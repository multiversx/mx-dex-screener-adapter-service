import { Injectable, NotFoundException, NotImplementedException } from "@nestjs/common";
import { AssetResponse, EventsResponse, LatestBlockResponse, PairResponse } from "./entities";
import { IndexerService, MultiversXApiService, XExchangeService } from "../../services";
import { ApiConfigService } from "@mvx-monorepo/common";
import { Asset, Block, Pair } from "../../entitites";

@Injectable()
export class DataIntegrationService {
  // private readonly logger = new OriginLogger(DataIntegrationService.name);

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

  // eslint-disable-next-line require-await
  public async getEvents(_fromBlock: number, _toBlock: number): Promise<EventsResponse> {
    throw new NotImplementedException();
  }
}
