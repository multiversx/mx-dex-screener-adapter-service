import { Injectable, NotFoundException } from "@nestjs/common";
import { AssetResponse, EventsResponse, LatestBlockResponse, PairResponse } from "./entities";
import { IndexerService, MultiversXApiService, XExchangeAddLiquidityEvent, XExchangeRemoveLiquidityEvent, XExchangeService, XExchangeSwapEvent } from "../../services";
import { ApiConfigService } from "@mvx-monorepo/common";
import { Asset, Block, JoinExitEvent, Pair, SwapEvent } from "../../entitites";

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

    const { deployTxHash, deployedAt } = await this.multiversXApiService.getContractDeployInfo(address);
    // pair.createdAtBlockNumber = // TODO: will get the round number from the indexer
    pair.createdAtBlockTimestamp = deployedAt;
    pair.createdAtTxnId = deployTxHash;

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

      const elasticBlock = blocks.find((block) => block.nonce === xExchangeEvent.block);
      if (!elasticBlock) {
        // TODO: handle error
        continue;
      }

      const block = Block.fromElasticBlock(elasticBlock, { onlyRequiredFields: true });
      events.push({
        block,
        ...event,
      });
    }

    return { events };
  }
}
