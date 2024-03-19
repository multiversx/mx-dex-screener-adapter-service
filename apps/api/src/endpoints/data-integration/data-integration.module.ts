import { Module } from "@nestjs/common";
import { DataIntegrationService } from "./data-integration.service";
import { DataIntegrationController } from "./data-integration.controller";
import { IndexerModule, MultiversXApiModule } from "../../services";

@Module({
  imports: [
    IndexerModule,
    MultiversXApiModule,
  ],
  providers: [
    DataIntegrationService,
  ],
  controllers: [
    DataIntegrationController,
  ],
})
export class DataIntegrationModule { }
