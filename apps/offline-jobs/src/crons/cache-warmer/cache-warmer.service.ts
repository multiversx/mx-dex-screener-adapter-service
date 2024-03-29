import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Lock, OriginLogger } from "@multiversx/sdk-nestjs-common";
import { CacheInfo, MultiversXApiService, XExchangeService } from "@mvx-monorepo/common";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class CacheWarmerService {
  private readonly logger = new OriginLogger(CacheWarmerService.name);

  constructor(
    private readonly xExchangeService: XExchangeService,
    private readonly multiversXApiService: MultiversXApiService,
    private readonly cacheService: CacheService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
  ) { }

  @Cron(CronExpression.EVERY_10_SECONDS)
  @Lock({ name: 'warmPairsMetadata', verbose: true })
  async warmPairsMetadata() {
    const pairsMetadata = await this.xExchangeService.getPairsMetadataRaw();

    await this.cacheService.set(CacheInfo.PairsMetadata().key, pairsMetadata, CacheInfo.PairsMetadata().ttl);
    this.clientProxy.emit('deleteCacheKeys', [CacheInfo.PairsMetadata().key]);
  }

  @Cron(CronExpression.EVERY_HOUR)
  @Lock({ name: 'warmTokens', verbose: true })
  async warmTokens() {
    const pairsMetadata = await this.xExchangeService.getPairsMetadata();
    const tokens = pairsMetadata.map(pair => [pair.firstTokenId, pair.secondTokenId]).flat().distinct();

    const cacheKeys: string[] = [];
    for (const tokenId of tokens) {
      try {
        const token = await this.multiversXApiService.getTokenRaw(tokenId);

        await this.cacheService.set(CacheInfo.Token(tokenId).key, token, CacheInfo.Token(tokenId).ttl);
        cacheKeys.push(CacheInfo.Token(tokenId).key);
      } catch (error: any) {
        this.logger.error(`Failed to get token with identifier: ${tokenId}`);
        this.logger.error(error);
      }
    }

    this.clientProxy.emit('deleteCacheKeys', cacheKeys);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  @Lock({ name: 'warmPairFees', verbose: true })
  async warmPairFees() {
    const pairsMetadata = await this.xExchangeService.getPairsMetadata();

    const cacheKeys: string[] = [];
    for (const metadata of pairsMetadata) {
      try {
        const feePercent = await this.xExchangeService.getPairFeePercentRaw(metadata.address);

        await this.cacheService.set(CacheInfo.PairFeePercent(metadata.address).key, feePercent, CacheInfo.PairFeePercent(metadata.address).ttl);
        cacheKeys.push(CacheInfo.PairFeePercent(metadata.address).key);
      } catch (error: any) {
        this.logger.error(`Failed to get fee percent for pair with address: ${metadata.address}`);
        this.logger.error(error);
      }
    }

    this.clientProxy.emit('deleteCacheKeys', cacheKeys);
  }
}
