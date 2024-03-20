import { ApiConfigModule, DynamicModuleUtils } from "@mvx-monorepo/common";
import { Module } from "@nestjs/common";
import configuration from "../../config/configuration";
import { XExchangeCacheWarmerModule } from "./xexchange.cache-warmer";

@Module({
  imports: [
    ApiConfigModule.forRoot(configuration),
    XExchangeCacheWarmerModule,
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
  ],
})
export class CronsModule { }
