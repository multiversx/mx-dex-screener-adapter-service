import { Module } from "@nestjs/common";
import { XExchangeCacheWarmerService } from "./xexchange.cache-warmer.service";
import { DynamicModuleUtils, XExchangeModule } from "@mvx-monorepo/common";
import configuration from "../../../config/configuration";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DynamicModuleUtils.getCachingModule(configuration),
    XExchangeModule.forRoot(configuration),
  ],
  providers: [
    DynamicModuleUtils.getPubSubService(),
    XExchangeCacheWarmerService,
  ],
  exports: [
    XExchangeCacheWarmerService,
  ],
})
export class XExchangeCacheWarmerModule { }
