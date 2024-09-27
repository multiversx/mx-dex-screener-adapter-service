import { Module } from "@nestjs/common";
import { DynamicModuleUtils } from "@mvx-monorepo/common";
import { IndexerModule } from "../../services/indexer";
import { MultiversXApiModule } from "../../services/multiversx.api";
import { OneDexService } from "./onedex.service";

@Module({})
export class OneDexModule {
  static forRoot(configuration: () => Record<string, any>) {
    return {
      module: OneDexModule,
      imports: [
        DynamicModuleUtils.getApiModule(configuration),
        DynamicModuleUtils.getCachingModule(configuration),
        IndexerModule.forRoot(configuration),
        MultiversXApiModule.forRoot(configuration),
      ],
      providers: [
        OneDexService,
      ],
      exports: [
        OneDexService,
      ],
    };
  }
}
