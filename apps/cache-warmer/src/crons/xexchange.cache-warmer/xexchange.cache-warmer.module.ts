import { Module } from "@nestjs/common";
import { XExchangeCacheWarmerService } from "./xexchange.cache-warmer.service";

@Module({
  imports: [
  ],
  providers: [
    XExchangeCacheWarmerService,
  ],
  exports: [
    XExchangeCacheWarmerService,
  ],
})
export class XExchangeCacheWarmerModule { }
