import { ElasticQuery, ElasticService, ElasticSortOrder, MatchQuery } from "@multiversx/sdk-nestjs-elastic";
import { Injectable } from "@nestjs/common";
import { ElasticBlock } from "./entities";

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
}
