import { Injectable, NotFoundException } from "@nestjs/common";
import {
  ApiConfigService, Asset, AssetResponse, Block, ElasticRound, EventsResponse,
  IndexerService, JoinExitEvent, LatestBlockResponse,
  MultiversXApiService, PairResponse, SwapEvent, XExchangeService,
} from "@mvx-monorepo/common";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { IProviderService } from "@mvx-monorepo/common/providers/interface";
import { GeneralEvent } from "@mvx-monorepo/common/providers/entities/general.event";

@Injectable()
export class DataIntegrationService {
  private readonly logger = new OriginLogger(DataIntegrationService.name);
  private providers: IProviderService[] = [];
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly indexerService: IndexerService,
    private readonly multiversXApiService: MultiversXApiService,
    xExchangeService: XExchangeService,
  ) {
    this.providers.push(xExchangeService)
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
    return this.resolveProvider(identifier).getPair(identifier);
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

    const response = new EventsResponse();

    for (const provider of this.providers) {
      const generalEvents = await provider.getEvents(before, after);
      const event = this.processEvents(generalEvents, provider, rounds);
      response.events.push(...event);
    }

    return response;
  }

  private processEvents(generalEvents: GeneralEvent[], provider: IProviderService, rounds: ElasticRound[]): ({ block: Block } & (SwapEvent | JoinExitEvent))[] {
    const events: ({ block: Block } & (SwapEvent | JoinExitEvent))[] = [];
    for (const generalEvent of generalEvents) {
      let event: SwapEvent | JoinExitEvent;
      switch (generalEvent.type) {
        case "swap":
          event = provider.fromSwapEvent(generalEvent)
          break;
        case "addLiquidity":
        case "removeLiquidity":
          event = provider.fromAddRemoveLiquidityEvent(generalEvent)
          break;
        default:
          this.logger.error(`Unknown event type: ${generalEvent.type} for event: ${JSON.stringify(generalEvent)}`);
          continue;
      }
      const round = rounds.find((round: { timestamp: number; }) => round.timestamp === generalEvent.timestamp);
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

  private resolveProvider(identifier: string): IProviderService {
    const provider = this.providers.find((p) => p.getPair(identifier) !== undefined);
    if (!provider) {
      this.logger.error(`Provider with identifier ${identifier} not found`);
      throw new NotFoundException(`Provider with identifier ${identifier} not found`);
    }

    return provider;
  }
}
