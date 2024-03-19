import { Injectable, NotFoundException, NotImplementedException } from "@nestjs/common";
import { AssetResponse, EventsResponse, LatestBlockResponse, PairResponse } from "./entities";
import { IndexerService, MultiversXApiService } from "../../services";
import { ApiConfigService } from "@mvx-monorepo/common";
import { Asset, Block } from "../../entitites";

@Injectable()
export class DataIntegrationService {
  // private readonly logger = new OriginLogger(DataIntegrationService.name);

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly indexerService: IndexerService,
    private readonly multiversXApiService: MultiversXApiService,
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

  // eslint-disable-next-line require-await
  public async getPair(_id: string): Promise<PairResponse> {
    throw new NotImplementedException();
  }

  // eslint-disable-next-line require-await
  public async getEvents(_fromBlock: number, _toBlock: number): Promise<EventsResponse> {
    throw new NotImplementedException();
  }
}
