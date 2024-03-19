import { Injectable, NotImplementedException } from "@nestjs/common";
import { AssetResponse, EventsResponse, LatestBlockResponse, PairResponse } from "./entities";
import { IndexerService } from "../../services";
import { ApiConfigService } from "@mvx-monorepo/common";
import { Block } from "../../entitites";

@Injectable()
export class DataIntegrationService {
  // private readonly logger = new OriginLogger(DataIntegrationService.name);

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly indexerService: IndexerService,
  ) { }

  public async getLatestBlock(): Promise<LatestBlockResponse> {
    const shardId = this.apiConfigService.getXExchangeShardId();

    const block = await this.indexerService.getLatestBlock(shardId);

    const latestBlock = Block.fromElasticBlock(block);

    return {
      block: latestBlock,
    };
  }

  // eslint-disable-next-line require-await
  public async getAsset(_id: string): Promise<AssetResponse> {
    throw new NotImplementedException();
  }

  // eslint-disable-next-line require-await
  public async getPair(_id: string): Promise<PairResponse> {
    throw new NotImplementedException();
  }

  // eslint-disable-next-line require-await
  public async getEvents(_fromBlock: number, _toBlock: number): Promise<EventsResponse> {
    throw new NotImplementedException();
  }
}
