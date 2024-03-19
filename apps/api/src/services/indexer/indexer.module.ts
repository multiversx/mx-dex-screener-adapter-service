import { Module } from "@nestjs/common";
import { IndexerService } from "./indexer.service";
import { DynamicModuleUtils } from "@mvx-monorepo/common";
import configuration from "../../../config/configuration";

@Module({
  imports: [
    DynamicModuleUtils.getApiModule(configuration),
    DynamicModuleUtils.getElasticModule(configuration),
  ],
  providers: [
    IndexerService,
  ],
  exports: [
    IndexerService,
  ],
})
export class IndexerModule { }
