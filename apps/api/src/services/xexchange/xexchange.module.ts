import { Module } from "@nestjs/common";
import { DynamicModuleUtils } from "@mvx-monorepo/common";
import configuration from "../../../config/configuration";
import { XExchangeService } from "./xexchange.service";

@Module({
  imports: [
    DynamicModuleUtils.getApiModule(configuration),
    DynamicModuleUtils.getCachingModule(configuration),
  ],
  providers: [
    XExchangeService,
  ],
  exports: [
    XExchangeService,
  ],
})
export class XExchangeModule { }
