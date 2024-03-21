import { ElasticQuery, ElasticService, ElasticSortOrder, MatchQuery, QueryType, RangeGreaterThanOrEqual, RangeLowerThanOrEqual, RangeQuery } from "@multiversx/sdk-nestjs-elastic";
import { Injectable } from "@nestjs/common";
import { ElasticLog, ElasticRound } from "./entities";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { LogPerformanceAsync, MetricsEvents } from "@mvx-monorepo/common";

@Injectable()
export class IndexerService {
  private readonly logger = new OriginLogger(IndexerService.name);

  constructor(
    private readonly elasticService: ElasticService,
  ) { }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  public async getLatestRound(): Promise<ElasticRound> {
    const query = ElasticQuery.create()
      .withPagination({ from: 0, size: 1 })
      .withFields(['round', 'epoch', 'timestamp'])
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }]);

    const [round] = await this.elasticService.getList('rounds', 'id', query);
    return round;
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  public async getRound(timestamp: number): Promise<ElasticRound | undefined> {
    try {
      const query = ElasticQuery.create()
        .withPagination({ from: 0, size: 1 })
        .withFields(['round', 'epoch', 'timestamp'])
        .withMustCondition(new MatchQuery('timestamp', timestamp));

      const rounds = await this.elasticService.getList('rounds', 'id', query);
      return rounds.length > 0 ? rounds[0] : undefined;
    } catch (error) {
      this.logger.error(`Failed to get round with timestamp: ${timestamp}`);
      this.logger.error(error);

      return undefined;
    }
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  public async getRounds(fromRound: number, toRound: number): Promise<ElasticRound[]> {
    const query = ElasticQuery.create()
      .withPagination({ from: 0, size: 10_000 })
      .withFields(['round', 'epoch', 'shardId', 'timestamp'])
      .withMustCondition(new MatchQuery('shardId', 4294967295))
      .withMustCondition(new RangeQuery('round', [
        new RangeLowerThanOrEqual(toRound),
        new RangeGreaterThanOrEqual(fromRound),
      ]))
      .withSort([{
        name: 'timestamp',
        order: ElasticSortOrder.ascending,
      }]);

    const rounds = await this.elasticService.getList('rounds', 'id', query);
    return rounds;
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  public async getLogs(before: number, after: number, addresses: string[], eventNames: string[]): Promise<ElasticLog[]> {
    const query = ElasticQuery.create()
      .withPagination({ from: 0, size: 10000 })
      .withMustCondition([
        QueryType.Should(addresses.map(address => QueryType.Nested("events", [new MatchQuery("events.address", address)]))),
        QueryType.Should(eventNames.map(eventName => QueryType.Nested('events', [new MatchQuery('events.topics', eventName)]))),
      ])
      .withDateRangeFilter('timestamp', before, after)
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }]);

    const logsRaw: ElasticLog[] = [];
    // eslint-disable-next-line require-await
    await this.elasticService.getScrollableList('logs', 'txHash', query, async (logs: ElasticLog[]) => {
      logsRaw.push(...logs);
    }, {
      scrollTimeout: '10m',
    });

    const logs = logsRaw.map((log, index) => {
      const events = log.events.filter((event: any) => {
        const isSearchedAddress = addresses.includes(event.address);
        const isSearchedEvent = event.topics.length > 0 && eventNames.includes(event.topics[0]);

        return isSearchedAddress && isSearchedEvent;
      });

      return {
        ...log,
        order: index,
        events,
      };
    });

    return logs;
  }
}
