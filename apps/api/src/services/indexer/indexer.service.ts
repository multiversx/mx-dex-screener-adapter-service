import { ElasticQuery, ElasticService, ElasticSortOrder, MatchQuery, QueryType, RangeGreaterThanOrEqual, RangeLowerThanOrEqual, RangeQuery } from "@multiversx/sdk-nestjs-elastic";
import { Injectable } from "@nestjs/common";
import { ElasticBlock, ElasticLog } from "./entities";
import { BinaryUtils } from "@multiversx/sdk-nestjs-common";

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

  public async getSwapLogs(before: number, after: number, pairAddresses: string[]): Promise<ElasticLog[]> {
    const nameTopic = BinaryUtils.base64Encode('swap');

    const query = ElasticQuery.create()
      .withPagination({ from: 0, size: 10000 })
      .withMustCondition([
        QueryType.Should(pairAddresses.map(address => QueryType.Nested("events", [new MatchQuery("events.address", address)]))),
        QueryType.Should([
          QueryType.Nested('events', [new MatchQuery('events.identifier', 'swapTokensFixedInput')]),
          QueryType.Nested('events', [new MatchQuery('events.identifier', 'swapTokensFixedOutput')]),
        ]),
        QueryType.Nested('events', [new MatchQuery('events.topics', nameTopic)]),
      ])
      .withDateRangeFilter('timestamp', before, after)
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }]);

    const logsRaw = await this.elasticService.getList('logs', 'txHash', query);

    const logs = logsRaw.map((log) => {
      const events = log.events.filter((event: any) => {
        const isSwapAddress = pairAddresses.includes(event.address);
        const isSwapIdentifier = event.identifier === 'swapTokensFixedInput' || event.identifier === 'swapTokensFixedOutput';
        const isSwapTopic = event.topics.length > 0 && event.topics[0] === nameTopic;

        const isSwapEvent = isSwapAddress && isSwapIdentifier && isSwapTopic;
        return isSwapEvent;
      });

      return { ...log, events };
    });

    return logs;
  }
}
