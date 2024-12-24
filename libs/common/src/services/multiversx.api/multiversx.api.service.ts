import { Injectable } from "@nestjs/common";
import { Token } from "./entities";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { ApiConfigService, CacheInfo } from "@mvx-monorepo/common";
import { Constants, OriginLogger } from "@multiversx/sdk-nestjs-common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";

@Injectable()
export class MultiversXApiService {
  private readonly logger = new OriginLogger(MultiversXApiService.name);

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
    private readonly cacheService: CacheService,
  ) { }

  public async getToken(identifier: string): Promise<Token | null> {
    const cachedToken = await this.cacheService.get<Token | null>(CacheInfo.Token(identifier).key);
    if (cachedToken !== undefined) {
      return cachedToken;
    }

    const tokenRaw = await this.getTokenRaw(identifier);

    await this.cacheService.set(CacheInfo.Token(identifier).key, tokenRaw, tokenRaw ? CacheInfo.Token(identifier).ttl : Constants.oneMinute());

    return tokenRaw;
  }

  public async getTokenRaw(identifier: string): Promise<Token | null> {
    try {
      const { data } = await this.apiService.get(`${this.apiConfigService.getApiUrl()}/tokens/${identifier}`);
      return data as Token;
    } catch (error: any) {
      if (error?.status === 404) {
        return null;
      }

      this.logger.error(`Failed to get token with identifier: ${identifier}`);
      this.logger.error(error);

      throw error;
    }
  }

  public async getContractDeployInfo(address: string): Promise<{ deployTxHash?: string, deployedAt?: number }> {
    return await this.cacheService.getOrSet(
      CacheInfo.ContractDeployInfo(address).key,
      async () => await this.getContractDeployInfoRaw(address),
      CacheInfo.ContractDeployInfo(address).ttl,
    );
  }

  private async getContractDeployInfoRaw(address: string): Promise<{ deployTxHash?: string, deployedAt?: number }> {
    try {
      const { data } = await this.apiService.get(`${this.apiConfigService.getApiUrl()}/accounts/${address}/?fields=deployTxHash,deployedAt`);
      return data;
    } catch (error: any) {
      this.logger.error(`Failed to get contract deploy info with address: ${address}`);
      this.logger.error(error);

      return {};
    }
  }
}
