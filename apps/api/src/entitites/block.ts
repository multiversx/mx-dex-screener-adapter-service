import { ApiProperty } from "@nestjs/swagger";
import { ElasticBlock } from "../services";

export class Block {
  @ApiProperty()
  blockNumber!: number;

  @ApiProperty()
  blockTimestamp!: number;

  @ApiProperty()
  metadata?: Record<string, string>;

  static fromElasticBlock(block: ElasticBlock, options?: { onlyRequiredFields?: boolean }): Block {
    if (options?.onlyRequiredFields) {
      return {
        blockNumber: block.nonce,
        blockTimestamp: block.timestamp,
      };
    }

    return {
      blockNumber: block.nonce,
      blockTimestamp: block.timestamp,
      metadata: {
        hash: block.hash,
        shardId: block.shardId.toString(),
      },
    };
  }
}
