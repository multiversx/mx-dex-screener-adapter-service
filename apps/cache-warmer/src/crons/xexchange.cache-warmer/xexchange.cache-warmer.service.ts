import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Lock } from "@multiversx/sdk-nestjs-common";
import { CacheInfo, XExchangeService } from "@mvx-monorepo/common";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class XExchangeCacheWarmerService {
  constructor(
    private readonly xExchangeService: XExchangeService,
    private readonly cacheService: CacheService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
  ) { }

  @Cron(CronExpression.EVERY_SECOND)
  @Lock({ name: 'warmPairsMetadata', verbose: true })
  async warmPairsMetadata() {
    const pairsMetadata = await this.xExchangeService.getPairsMetadataRaw();

    await this.cacheService.set(CacheInfo.PairsMetadata().key, pairsMetadata, CacheInfo.PairsMetadata().ttl);
    this.clientProxy.emit('deleteCacheKeys', [CacheInfo.PairsMetadata().key]);
  }
}
