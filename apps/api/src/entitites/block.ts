import { ApiProperty } from "@nestjs/swagger";
import { ElasticRound } from "../services";

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
        blockTimestamp: round.timestamp,
      };
    }

    return {
      blockNumber: round.round,
      blockTimestamp: round.timestamp,
      metadata: {
        epoch: round.epoch.toString(),
      },
    };
  }
}
