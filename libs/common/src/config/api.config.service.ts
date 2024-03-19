import { BaseConfigService, OriginLogger } from "@multiversx/sdk-nestjs-common";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class ApiConfigService extends BaseConfigService {
  private readonly logger = new OriginLogger(ApiConfigService.name);

  constructor(protected readonly config: ConfigService) {
    super(config);
    this.checkForMissingConfigs();
  }

  getPublicApiPrefix(): string | undefined {
    return this.get('apps.publicApi.prefix');
  }

  getPublicApiFeaturePort(): number {
    return this.getOrFail('apps.publicApi.port');
  }

  getPrivateApiFeaturePort(): number {
    return this.getOrFail('apps.privateApi.port');
  }

  getAxiosTimeout(): number {
    return this.getOrFallback('keepAlive.downstreamTimeout', 61000);
  }

  getServerTimeout(): number {
    return this.getOrFallback('keepAlive.upstreamTimeout', 60000);
  }

  getHeadersTimeout(): number {
    return this.getServerTimeout() + 1000;
  }

  getRateLimiterSecret(): string | undefined {
    return this.getOrFallback('rateLimiterSecret', undefined);
  }

  getUseKeepAliveAgentFlag(): boolean {
    return this.getOrFallback('keepAlive.enable', true);
  }

  getElasticUrl(): string {
    return this.getOrFail('urls.elastic');
  }

  getRedisUrl(): string {
    return this.getOrFail('urls.redis');
  }

  getPoolLimit(): number {
    return this.getOrFallback('caching.poolLimit', 100);
  }

  getProcessTtl(): number {
    return this.getOrFallback('caching.processTtl', 60);
  }

  getXExchangeShardId(): number {
    return this.getOrFail('xExchange.shardId');
  }

  private getOrFail<T>(key: string): T {
    const value = this.get<T>(key);

    if (!value) {
      throw new Error(`No ${key} present`);
    }

    return value;
  }

  private getOrFallback<T>(key: string, fallback: T): T {
    return this.get<T>(key) ?? fallback;
  }

  private checkForMissingConfigs(): void {
    const prototype = Object.getPrototypeOf(this);
    const allMethods = Reflect.ownKeys(prototype) as string[];
    const getMethods = allMethods.filter((key: string) => key.startsWith('get') && !['getOrFail', 'getOrFallback'].includes(key));

    const missingConfigs = getMethods
      .map((method) => {
        try {
          // @ts-ignore
          this[method]();
          return undefined;
        } catch (error: any) {
          return error?.message as string | undefined;
        }
      })
      .filter((item): item is string => !!item);

    for (const missingConfig of missingConfigs) {
      this.logger.error(missingConfig);
    }

    if (missingConfigs.length > 0) {
      process.exit(1);
    }
  }
}
