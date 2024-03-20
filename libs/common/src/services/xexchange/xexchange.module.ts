import { Module } from "@nestjs/common";
import { DynamicModuleUtils } from "@mvx-monorepo/common";
import { XExchangeService } from "./xexchange.service";
import { IndexerModule } from "../indexer";
import { MultiversXApiModule } from "../multiversx.api";

@Module({})
export class XExchangeModule {
  static forRoot(configuration: () => Record<string, any>) {
    return {
      module: XExchangeModule,
      imports: [
        DynamicModuleUtils.getApiModule(configuration),
        DynamicModuleUtils.getCachingModule(configuration),
        IndexerModule.forRoot(configuration),
        MultiversXApiModule.forRoot(configuration),
      ],
      providers: [
        XExchangeService,
      ],
      exports: [
        XExchangeService,
      ],
    };
  }
}
