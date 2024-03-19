import { Module } from "@nestjs/common";
import { DataIntegrationService } from "./data-integration.service";
import { DataIntegrationController } from "./data-integration.controller";
import { IndexerModule } from "../../services";

@Module({
  imports: [
    IndexerModule,
  ],
  providers: [
    DataIntegrationService,
  ],
  controllers: [
    DataIntegrationController,
  ],
})
export class DataIntegrationModule { }
