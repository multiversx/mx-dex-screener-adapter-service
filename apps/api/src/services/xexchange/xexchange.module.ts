import { Module } from "@nestjs/common";
import { DynamicModuleUtils } from "@mvx-monorepo/common";
import configuration from "../../../config/configuration";
import { XExchangeService } from "./xexchange.service";
import { IndexerModule } from "../indexer";
import { MultiversXApiModule } from "../multiversx.api";

@Module({
  imports: [
    DynamicModuleUtils.getApiModule(configuration),
    DynamicModuleUtils.getCachingModule(configuration),
    IndexerModule,
    MultiversXApiModule,
  ],
  providers: [
    XExchangeService,
  ],
  exports: [
    XExchangeService,
  ],
})
export class XExchangeModule { }
