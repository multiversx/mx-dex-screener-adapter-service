import { Module } from "@nestjs/common";
import { DynamicModuleUtils } from "@mvx-monorepo/common";
import configuration from "../../../config/configuration";
import { MultiversXApiService } from "./multiversx.api.service";

@Module({
  imports: [
    DynamicModuleUtils.getApiModule(configuration),
    DynamicModuleUtils.getCachingModule(configuration),
  ],
  providers: [
    MultiversXApiService,
  ],
  exports: [
    MultiversXApiService,
  ],
})
export class MultiversXApiModule { }
