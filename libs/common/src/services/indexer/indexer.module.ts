import { Module } from "@nestjs/common";
import { IndexerService } from "./indexer.service";
import { DynamicModuleUtils } from "@mvx-monorepo/common";

@Module({})
export class IndexerModule {
  static forRoot(configuration: () => Record<string, any>) {
    return {
      module: IndexerModule,
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
    };
  }
}
