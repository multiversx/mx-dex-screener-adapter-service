import { Module } from "@nestjs/common";
import { DataIntegrationService } from "./data-integration.service";
import { DataIntegrationController } from "./data-integration.controller";
import { IndexerModule, MultiversXApiModule, XExchangeModule } from "@mvx-monorepo/common";
import configuration from "../../../config/configuration";

@Module({
  imports: [
    IndexerModule.forRoot(configuration),
    MultiversXApiModule.forRoot(configuration),
    XExchangeModule.forRoot(configuration),
  ],
  providers: [
    DataIntegrationService,
  ],
  controllers: [
    DataIntegrationController,
  ],
})
export class DataIntegrationModule { }
