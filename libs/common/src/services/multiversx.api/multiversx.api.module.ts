import { Module } from "@nestjs/common";
import { DynamicModuleUtils } from "@mvx-monorepo/common";
import { MultiversXApiService } from "./multiversx.api.service";

@Module({})
export class MultiversXApiModule {
  static forRoot(configuration: () => Record<string, any>) {
    return {
      module: MultiversXApiModule,
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
    };
  }
}
