import { Global, Module } from "@nestjs/common";
import { ApiMetricsService } from "./api.metrics.service";
import { MetricsModule } from "@multiversx/sdk-nestjs-monitoring";
import { EventEmitterModule } from "@nestjs/event-emitter";

@Global()
@Module({
  imports: [
    MetricsModule,
    EventEmitterModule.forRoot({ maxListeners: 1 }),
  ],
  providers: [
    ApiMetricsService,
  ],
  exports: [
    ApiMetricsService,
  ],
})
export class ApiMetricsModule { }
