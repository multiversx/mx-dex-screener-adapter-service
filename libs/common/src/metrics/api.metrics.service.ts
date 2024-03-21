import { MetricsService } from "@multiversx/sdk-nestjs-monitoring";
import { Injectable } from "@nestjs/common";
import { register, Histogram } from 'prom-client';
import { LogMetricsEvent, MetricsEvents } from "../utils";
import { OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class ApiMetricsService {
  private static indexerDurationHistogram: Histogram<string>;
  private static xExchangeDurationHistogram: Histogram<string>;
  private static vmQueryDurationHistogram: Histogram<string>;

  constructor(
    private readonly metricsService: MetricsService,
  ) {
    if (!ApiMetricsService.indexerDurationHistogram) {
      ApiMetricsService.indexerDurationHistogram = new Histogram({
        name: 'indexer_duration',
        help: 'Indexer Duration',
        labelNames: ['action'],
        buckets: [],
      });
    }

    if (!ApiMetricsService.xExchangeDurationHistogram) {
      ApiMetricsService.xExchangeDurationHistogram = new Histogram({
        name: 'xexchange_duration',
        help: 'xExchange Duration',
        labelNames: ['action'],
        buckets: [],
      });
    }

    if (!ApiMetricsService.vmQueryDurationHistogram) {
      ApiMetricsService.vmQueryDurationHistogram = new Histogram({
        name: 'vm_query_duration',
        help: 'VM Query Duration',
        labelNames: ['endpoint'],
        buckets: [],
      });
    }
  }

  @OnEvent(MetricsEvents.SetIndexerDuration)
  setIndexerDurationHistogram(payload: LogMetricsEvent) {
    const [action, duration] = payload.args;
    this.metricsService.setExternalCall('indexer', duration);
    ApiMetricsService.indexerDurationHistogram.labels(action).observe(duration);
  }

  @OnEvent(MetricsEvents.SetXExchangeDuration)
  setXExchangeDurationHistogram(payload: LogMetricsEvent) {
    const [action, duration] = payload.args;
    this.metricsService.setExternalCall('xexchange', duration);
    ApiMetricsService.xExchangeDurationHistogram.labels(action).observe(duration);
  }

  setVmQueryDurationHistogram(endpoint: string, duration: number) {
    this.metricsService.setExternalCall('gateway', duration);
    ApiMetricsService.vmQueryDurationHistogram.labels(endpoint).observe(duration);
  }

  async getMetrics(): Promise<string> {
    const baseMetrics = await this.metricsService.getMetrics();
    const currentMetrics = await register.metrics();

    return baseMetrics + '\n' + currentMetrics;
  }
}
