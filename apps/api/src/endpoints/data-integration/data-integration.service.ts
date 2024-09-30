import { Injectable, NotFoundException } from "@nestjs/common";
import {
  ApiConfigService, Asset, AssetResponse, Block, ElasticRound, EventsResponse,
  IndexerService, JoinExitEvent, LatestBlockResponse,
  MultiversXApiService, PairResponse, SwapEvent, XExchangeService,
} from "@mvx-monorepo/common";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { IProviderService } from "@mvx-monorepo/common/providers/interface";
import { GeneralEvent } from "@mvx-monorepo/common/providers/entities/general.event";
// import { OneDexService } from "@mvx-monorepo/common/providers";

@Injectable()
export class DataIntegrationService {
  private readonly logger = new OriginLogger(DataIntegrationService.name);
  private providers: IProviderService[] = [];
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly indexerService: IndexerService,
    private readonly multiversXApiService: MultiversXApiService,
    xExchangeService: XExchangeService,
    // oneDexService: OneDexService,
  ) {
    this.providers = [
      xExchangeService,
      // oneDexService,
    ];
  }

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

  public async getPair(identifier: string): Promise<PairResponse> {
    for (const provider of this.providers) {
      const pairResponse = await provider.getPair(identifier);
      if (pairResponse) {
        return pairResponse;
      }
    }

    this.logger.error(`Pair with identifier ${identifier} not found`);
    throw new NotFoundException(`Pair with identifier ${identifier} not found`);
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

    const allEvents: ({ block: Block } & (SwapEvent | JoinExitEvent))[] = [];
    for (const provider of this.providers) {
      const generalEvents = await provider.getEvents(before, after);
      const event = this.processEvents(generalEvents, provider, rounds);
      allEvents.push(...event);
    }

    const sortedEvents = allEvents.sort((a, b) => {
      if (a.block.blockTimestamp !== b.block.blockTimestamp) {
        return a.block.blockTimestamp - b.block.blockTimestamp;
      }
      return a.txnId.localeCompare(b.txnId);
    });

    let txnIndex = 0;
    let lastBlockTimestamp = 0;
    for (const event of sortedEvents) {
      if (event.block.blockTimestamp !== lastBlockTimestamp) {
        txnIndex = 0;
      } else {
        txnIndex++;
      }
      event.txnIndex = txnIndex;
      lastBlockTimestamp = event.block.blockTimestamp;
    }

    return {
      events: sortedEvents,
    };
  }

  private processEvents(generalEvents: GeneralEvent[], provider: IProviderService, rounds: ElasticRound[]): ({ block: Block } & (SwapEvent | JoinExitEvent))[] {
    const events: ({ block: Block } & (SwapEvent | JoinExitEvent))[] = [];
    for (const generalEvent of generalEvents) {
      let event: SwapEvent | JoinExitEvent;
      switch (generalEvent.type) {
        case "swap":
          event = provider.fromSwapEvent(generalEvent);
          break;
        case "addLiquidity":
        case "removeLiquidity":
          event = provider.fromAddRemoveLiquidityEvent(generalEvent);
          break;
        default:
          this.logger.error(`Unknown event type: ${generalEvent.type} for event: ${JSON.stringify(generalEvent)}`);
          continue;
      }
      const round = rounds.find((round: { timestamp: number }) => round.timestamp === generalEvent.timestamp);
      if (!round) {
        this.logger.error(`Round not found for event: ${JSON.stringify(generalEvent)}`);
        continue;
      }
      const block = Block.fromElasticRound(round, { onlyRequiredFields: true });
      events.push({
        block,
        ...event,
      });
    }
    return events;
  }
}
