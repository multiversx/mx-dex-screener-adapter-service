import { Injectable, NotFoundException } from "@nestjs/common";
import { AssetResponse, EventsResponse, LatestBlockResponse, PairResponse } from "./entities";
import { IndexerService, MultiversXApiService, XExchangeAddLiquidityEvent, XExchangeRemoveLiquidityEvent, XExchangeService, XExchangeSwapEvent } from "../../services";
import { Asset, Block, JoinExitEvent, Pair, SwapEvent } from "../../entitites";

@Injectable()
export class DataIntegrationService {
  constructor(
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

    const asset = Asset.fromToken(token);
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

    const pair = Pair.fromXExchangePair(xExchangePair);

    const { deployTxHash, deployedAt } = await this.multiversXApiService.getContractDeployInfo(address);
    // pair.createdAtBlockNumber = // TODO: will get the round number from the indexer
    pair.createdAtBlockTimestamp = deployedAt;
    pair.createdAtTxnId = deployTxHash;

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
          event = JoinExitEvent.fromXExchangeAddLiquidityEvent(xExchangeEvent as XExchangeAddLiquidityEvent);
          break;
        case "removeLiquidity":
          event = JoinExitEvent.fromXExchangeRemoveLiquidityEvent(xExchangeEvent as XExchangeRemoveLiquidityEvent);
          break;
        default:
          // TODO: handle error
          continue;
      }

      const round = rounds.find((round) => round.timestamp === xExchangeEvent.timestamp);
      if (!round) {
        // TODO: handle error
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
