import { Injectable, NotFoundException } from "@nestjs/common";
import { AssetResponse, EventsResponse, LatestBlockResponse, PairResponse } from "./entities";
import { IndexerService, MultiversXApiService, XExchangeAddLiquidityEvent, XExchangeRemoveLiquidityEvent, XExchangeService, XExchangeSwapEvent } from "@mvx-monorepo/common";
import { Asset, Block, JoinExitEvent, Pair, SwapEvent } from "../../entitites";
import { ApiConfigService } from "@mvx-monorepo/common";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";

@Injectable()
export class DataIntegrationService {
  private readonly logger = new OriginLogger(DataIntegrationService.name);

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly indexerService: IndexerService,
    private readonly multiversXApiService: MultiversXApiService,
    private readonly xExchangeService: XExchangeService,
  ) { }

  public async getLatestBlock(): Promise<LatestBlockResponse> {
    // we are using rounds instead of blocks because the MultiversX blockchain is multi-sharded,
    // each shard has its own block number, but the round number is the same across all shards

    const round = await this.indexerService.getLatestRound();

    const latestBlock = Block.fromElasticRound(round);
    return {
      block: latestBlock,
    };
  }

  public async getAsset(identifier: string): Promise<AssetResponse> {
    const token = await this.multiversXApiService.getToken(identifier);
    if (!token) {
      throw new NotFoundException(`Asset with identifier ${identifier} not found`);
    }

    const asset = Asset.fromToken(token, {
      wegldIdentifier: this.apiConfigService.getWrappedEGLDIdentifier(),
      usdcIdentifier: this.apiConfigService.getWrappedUSDCIdentifier(),
    });

    return {
      asset,
    };
  }

  public async getPair(address: string): Promise<PairResponse> {
    const xExchangePairs = await this.xExchangeService.getPairs();
    const xExchangePair = xExchangePairs.find((p) => p.address === address);
    if (!xExchangePair) {
      throw new NotFoundException(`Pair with address ${address} not found`);
    }

    const pairFeePercent = await this.xExchangeService.getPairFeePercent(address);

    const { deployTxHash, deployedAt } = await this.multiversXApiService.getContractDeployInfo(address);
    const round = deployedAt ? await this.indexerService.getRound(deployedAt) : undefined;

    const pair = Pair.fromXExchangePair(xExchangePair, pairFeePercent, { deployTxHash, deployedAt, deployRound: round?.round });
    return {
      pair,
    };
  }

  public async getEvents(fromBlockNonce: number, toBlockNonce: number): Promise<EventsResponse> {
    const rounds = await this.indexerService.getRounds(fromBlockNonce, toBlockNonce);
    if (rounds.length === 0) {
      return {
        events: [],
      };
    }

    const after = rounds[0].timestamp;
    const before = rounds[rounds.length - 1].timestamp;

    const xExchangeEvents = await this.xExchangeService.getEvents(before, after);

    const events: ({ block: Block } & (SwapEvent | JoinExitEvent))[] = [];
    for (const xExchangeEvent of xExchangeEvents) {
      let event: SwapEvent | JoinExitEvent;
      switch (xExchangeEvent.type) {
        case "swap":
          event = SwapEvent.fromXExchangeSwapEvent(xExchangeEvent as XExchangeSwapEvent);
          break;
        case "addLiquidity":
          event = JoinExitEvent.fromXExchangeEvent(xExchangeEvent as XExchangeAddLiquidityEvent);
          break;
        case "removeLiquidity":
          event = JoinExitEvent.fromXExchangeEvent(xExchangeEvent as XExchangeRemoveLiquidityEvent);
          break;
        default:
          this.logger.error(`Unknown event type: ${xExchangeEvent.type} for event: ${JSON.stringify(xExchangeEvent)}`);
          continue;
      }

      const round = rounds.find((round) => round.timestamp === xExchangeEvent.timestamp);
      if (!round) {
        this.logger.error(`Round not found for event: ${JSON.stringify(xExchangeEvent)}`);
        continue;
      }

      const block = Block.fromElasticRound(round, { onlyRequiredFields: true });
      events.push({
        block,
        ...event,
      });
    }

    return { events };
  }
}
