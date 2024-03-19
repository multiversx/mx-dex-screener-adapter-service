import { ApiConfigModule, DynamicModuleUtils } from "@mvx-monorepo/common";
import { Module } from "@nestjs/common";
import configuration from "apps/api/config/configuration";
import { DataIntegrationModule } from "./data-integration";

@Module({
  imports: [
    ApiConfigModule.forRoot(configuration),
    DataIntegrationModule,
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
  ],
})
export class EndpointsModule { }

