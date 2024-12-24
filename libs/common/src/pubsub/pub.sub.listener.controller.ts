import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Controller } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";

@Controller()
export class PubSubListenerController {
  // private readonly logger = new OriginLogger(PubSubListenerController.name);

  constructor(
    private readonly cacheService: CacheService,
  ) { }

  @EventPattern('deleteCacheKeys')
  async deleteCacheKey(keys: string[]) {
    for (const key of keys) {
      // this.logger.log(`Deleting local cache key ${key}`);
      await this.cacheService.deleteLocal(key);
    }
  }
}
