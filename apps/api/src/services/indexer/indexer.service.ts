import { ElasticQuery, ElasticService, ElasticSortOrder, MatchQuery, QueryType, RangeGreaterThanOrEqual, RangeLowerThanOrEqual, RangeQuery } from "@multiversx/sdk-nestjs-elastic";
import { Injectable } from "@nestjs/common";
import { ElasticBlock, ElasticLog } from "./entities";

@Injectable()
export class IndexerService {
  constructor(
    private readonly elasticService: ElasticService,
  ) { }

  public async getLatestBlock(shardId: number): Promise<ElasticBlock> {
    const query = ElasticQuery.create()
      .withPagination({ from: 0, size: 1 })
      .withFields(['nonce', 'shardId', 'timestamp'])
      .withMustCondition(new MatchQuery('shardId', shardId))
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }]);

    const [block] = await this.elasticService.getList('blocks', 'hash', query);
    return block;
  }

  public async getBlocks(shardId: number, fromNonce: number, toNonce: number): Promise<ElasticBlock[]> {
    const query = ElasticQuery.create()
      .withPagination({ from: 0, size: 10_000 })
      .withFields(['nonce', 'shardId', 'timestamp'])
      .withMustCondition(new MatchQuery('shardId', shardId))
      .withMustCondition(new RangeQuery('nonce', [new RangeLowerThanOrEqual(toNonce), new RangeGreaterThanOrEqual(fromNonce)]))
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.ascending }]);

    const blocks = await this.elasticService.getList('blocks', 'hash', query);
    return blocks;
  }

  public async getLogs(before: number, after: number, addresses: string[], eventNames: string[]): Promise<ElasticLog[]> {
    const query = ElasticQuery.create()
      .withPagination({ from: 0, size: 10000 })
      .withMustCondition([
        QueryType.Should(addresses.map(address => QueryType.Nested("events", [new MatchQuery("events.address", address)]))),
        QueryType.Should(eventNames.map(eventName => QueryType.Nested('events', [new MatchQuery('events.topics', eventName)]))),
      ])
      .withDateRangeFilter('timestamp', before, after)
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }]);

    const logsRaw = await this.elasticService.getList('logs', 'txHash', query);

    const logs = logsRaw.map((log) => {
      const events = log.events.filter((event: any) => {
        const isSearchedAddress = addresses.includes(event.address);
        const isSearchedEvent = event.topics.length > 0 && eventNames.includes(event.topics[0]);

        return isSearchedAddress && isSearchedEvent;
      });

      return { ...log, events };
    });

    return logs;
  }
}
