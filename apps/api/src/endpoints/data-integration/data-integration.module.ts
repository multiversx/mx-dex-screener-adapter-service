import { Module } from "@nestjs/common";
import { DataIntegrationService } from "./data-integration.service";
import { DataIntegrationController } from "./data-integration.controller";
import { IndexerModule, MultiversXApiModule, XExchangeModule } from "../../services";

@Module({
  imports: [
    IndexerModule,
    MultiversXApiModule,
    XExchangeModule,
  ],
  providers: [
    DataIntegrationService,
  ],
  controllers: [
    DataIntegrationController,
  ],
})
export class DataIntegrationModule { }
