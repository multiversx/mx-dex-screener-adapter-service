import { XExchangePair } from "@mvx-monorepo/common";
import { ApiProperty } from "@nestjs/swagger";

export class Pair {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  dexKey!: string;

  @ApiProperty()
  asset0Id!: string;

  @ApiProperty()
  asset1Id!: string;

  @ApiProperty()
  createdAtBlockNumber?: number;

  @ApiProperty()
  createdAtBlockTimestamp?: number;

  @ApiProperty()
  createdAtTxnId?: string;

  @ApiProperty()
  feeBps?: number;

  @ApiProperty()
  pool?: {
    id: string;
    name: string;
    assetIds: string[];
    pairIds: string[];
    metadata?: Record<string, string>;
  };

  @ApiProperty()
  metadata?: Record<string, string>;

  static fromXExchangePair(pair: XExchangePair, feePercent: number, deployInfo?: { deployRound?: number, deployTxHash?: string, deployedAt?: number }): Pair {
    return {
      id: pair.address,
      dexKey: 'xexchange',
      asset0Id: pair.firstTokenId,
      asset1Id: pair.secondTokenId,
      feeBps: feePercent * 100,
      createdAtBlockNumber: deployInfo?.deployRound,
      createdAtBlockTimestamp: deployInfo?.deployedAt,
      createdAtTxnId: deployInfo?.deployTxHash,
    };
  }
}
