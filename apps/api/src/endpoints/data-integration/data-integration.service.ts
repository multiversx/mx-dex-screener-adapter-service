import { Injectable, NotImplementedException } from "@nestjs/common";
import { AssetResponse, EventsResponse, LatestBlockResponse, PairResponse } from "./entities";

@Injectable()
export class DataIntegrationService {
  // private readonly logger = new OriginLogger(DataIntegrationService.name);

  constructor() { }

  // eslint-disable-next-line require-await
  public async getLatestBlock(): Promise<LatestBlockResponse> {
    throw new NotImplementedException();
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
