import { ApiConfigModule, DynamicModuleUtils } from "@mvx-monorepo/common";
import { Module } from "@nestjs/common";
import configuration from "../../config/configuration";
import { CacheWarmerModule } from "./cache-warmer";

@Module({
  imports: [
    ApiConfigModule.forRoot(configuration),
    CacheWarmerModule,
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
  ],
})
export class CronsModule { }
