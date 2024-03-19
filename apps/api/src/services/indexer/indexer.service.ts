import { ElasticQuery, ElasticService, ElasticSortOrder, MatchQuery, QueryType } from "@multiversx/sdk-nestjs-elastic";
import { Injectable } from "@nestjs/common";
import { ElasticBlock, ElasticEvent } from "./entities";
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

  public async getBlock(shardId: number, nonce: number): Promise<ElasticBlock | undefined> {
    const query = ElasticQuery.create()
      .withPagination({ from: 0, size: 1 })
      .withFields(['nonce', 'shardId', 'timestamp'])
      .withMustCondition(new MatchQuery('shardId', shardId))
      .withMustCondition(new MatchQuery('nonce', nonce))
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }]);

    const blocks = await this.elasticService.getList('blocks', 'hash', query);
    return blocks.length > 0 ? blocks[0] : undefined;
  }

  public async getSwapEvents(before: number, after: number, pairAddresses: string[]): Promise<ElasticEvent[]> {
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

    const logs = await this.elasticService.getList('logs', 'txHash', query);

    const swapEvents: ElasticEvent[] = [];
    for (const log of logs) {
      for (const event of log.events) {
        const isSwapAddress = pairAddresses.includes(event.address);
        const isSwapIdentifier = event.identifier === 'swapTokensFixedInput' || event.identifier === 'swapTokensFixedOutput';
        const isSwapTopic = event.topics.length > 0 && event.topics[0] === nameTopic;

        if (isSwapAddress && isSwapIdentifier && isSwapTopic) {
          swapEvents.push(event);
        }
      }
    }

    return swapEvents;
  }
}
