import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { BatchUtils, Lock, OriginLogger } from "@multiversx/sdk-nestjs-common";
import { CacheInfo, MultiversXApiService, XExchangeService } from "@mvx-monorepo/common";
import { OneDexService } from "@mvx-monorepo/common/providers";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class CacheWarmerService {
  private readonly logger = new OriginLogger(CacheWarmerService.name);

  constructor(
    private readonly xExchangeService: XExchangeService,
    private readonly oneDexService: OneDexService,
    private readonly multiversXApiService: MultiversXApiService,
    private readonly cacheService: CacheService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
  ) { }

  @Cron(CronExpression.EVERY_10_SECONDS)
  @Lock({ name: 'Warm xExchange pairs metadata', verbose: true })
  async warmPairsMetadata() {
    const pairsMetadata = await this.xExchangeService.getPairsMetadataRaw();

    await this.cacheService.set(CacheInfo.PairsMetadata().key, pairsMetadata, CacheInfo.PairsMetadata().ttl);
    this.clientProxy.emit('deleteCacheKeys', [CacheInfo.PairsMetadata().key]);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  @Lock({ name: 'Warm OneDex pairs metadata', verbose: true })
  async warmOneDexPairsMetadata() {
    const pairsMetadata = await this.oneDexService.getPairsMetadataRaw();

    await this.cacheService.set(CacheInfo.OneDexPairsMetadata().key, pairsMetadata, CacheInfo.OneDexPairsMetadata().ttl);
    this.clientProxy.emit('deleteCacheKeys', [CacheInfo.OneDexPairsMetadata().key]);
  }

  @Cron(CronExpression.EVERY_2ND_HOUR)
  @Lock({ name: 'Warm Tokens', verbose: true })
  async warmTokens() {
    const xExchangePairsMetadata = await this.xExchangeService.getPairsMetadata();
    const oneDexPairsMetadata = await this.oneDexService.getPairsMetadata();

    const xExchangeTokens = xExchangePairsMetadata.map(pair => [pair.firstTokenId, pair.secondTokenId]).flat();
    const oneDexTokens = oneDexPairsMetadata.map(pair => [pair.first_token_id, pair.second_token_id]).flat();

    const tokens = [...xExchangeTokens, ...oneDexTokens].distinct();
    const tokenBatches = BatchUtils.splitArrayIntoChunks(tokens, 25);

    for (const batch of tokenBatches) {
      const cacheKeys: string[] = [];

      for (const tokenId of batch) {
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

      await new Promise(r => setTimeout(r, 5000));
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  @Lock({ name: 'Warm xExchange pair fees', verbose: true })
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
