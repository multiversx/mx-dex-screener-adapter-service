import { Module } from "@nestjs/common";
import { CacheWarmerService } from "./cache-warmer.service";
import { DynamicModuleUtils, MultiversXApiModule, XExchangeModule } from "@mvx-monorepo/common";
import configuration from "../../../config/configuration";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DynamicModuleUtils.getCachingModule(configuration),
    XExchangeModule.forRoot(configuration),
    MultiversXApiModule.forRoot(configuration),
  ],
  providers: [
    DynamicModuleUtils.getPubSubService(),
    CacheWarmerService,
  ],
  exports: [
    CacheWarmerService,
  ],
})
export class CacheWarmerModule { }
