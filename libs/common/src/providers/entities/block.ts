import { ElasticRound } from "@mvx-monorepo/common";
import { ApiProperty } from "@nestjs/swagger";

export class Block {
  @ApiProperty()
  blockNumber!: number;

  @ApiProperty()
  blockTimestamp!: number;

  @ApiProperty()
  metadata?: Record<string, string>;

  static fromElasticRound(round: ElasticRound, options?: { onlyRequiredFields?: boolean }): Block {
    if (options?.onlyRequiredFields) {
      return {
        blockNumber: round.round,
        blockTimestamp: parseInt(round.timestamp),
      };
    }

    return {
      blockNumber: round.round,
      blockTimestamp: parseInt(round.timestamp),
      metadata: {
        epoch: round.epoch.toString(),
      },
    };
  }
}
