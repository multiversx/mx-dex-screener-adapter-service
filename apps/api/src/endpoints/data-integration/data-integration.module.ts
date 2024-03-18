import { Module } from "@nestjs/common";
import { DataIntegrationService } from "./data-integration.service";
import { DataIntegrationController } from "./data-integration.controller";

@Module({
  imports: [
  ],
  providers: [
    DataIntegrationService,
  ],
  controllers: [
    DataIntegrationController,
  ],
})
export class DataIntegrationModule { }
