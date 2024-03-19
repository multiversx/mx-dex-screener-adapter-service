import { Injectable, NotFoundException } from "@nestjs/common";
import { AssetResponse, EventsResponse, LatestBlockResponse, PairResponse } from "./entities";
import { IndexerService, MultiversXApiService, XExchangeService } from "../../services";
import { ApiConfigService } from "@mvx-monorepo/common";
import { Asset, Block, Pair, SwapEvent } from "../../entitites";

@Injectable()
export class DataIntegrationService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly indexerService: IndexerService,
    private readonly multiversXApiService: MultiversXApiService,
    private readonly xExchangeService: XExchangeService,
  ) { }

  public async getLatestBlock(): Promise<LatestBlockResponse> {
    const shardId = this.apiConfigService.getXExchangeShardId();

    const block = await this.indexerService.getLatestBlock(shardId);

    const latestBlock = Block.fromElasticBlock(block);
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
    return {
      pair,
    };
  }

  public async getEvents(fromBlockNonce: number, toBlockNonce: number): Promise<EventsResponse> {
    const shardId = this.apiConfigService.getXExchangeShardId();

    const blocks = await this.indexerService.getBlocks(shardId, fromBlockNonce, toBlockNonce);
    if (blocks.length === 0) {
      return {
        events: [],
      };
    }

    const after = blocks[0].timestamp;
    const before = blocks[blocks.length - 1].timestamp;

    const xExchangeSwapEvents = await this.xExchangeService.getSwapEvents(before, after);

    const events: ({ block: Block } & SwapEvent)[] = [];
    for (const event of xExchangeSwapEvents) {
      const elasticBlock = blocks.find((block) => block.nonce === event.block);
      if (!elasticBlock) {
        // TODO: handle error
        continue;
      }

      const block = Block.fromElasticBlock(elasticBlock, { onlyRequiredFields: true });
      const swapEvent = SwapEvent.fromXExchangeSwapEvent(event);

      events.push({
        block,
        ...swapEvent,
      });
    }

    return { events };
  }
}
