import { ApiConfigModule, DynamicModuleUtils } from "@mvx-monorepo/common";
import { Module } from "@nestjs/common";
import configuration from "apps/api/config/configuration";

@Module({
  imports: [
    ApiConfigModule.forRoot(configuration),
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
  ],
})
export class EndpointsModule { }

