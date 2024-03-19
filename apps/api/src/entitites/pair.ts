import { ApiProperty } from "@nestjs/swagger";
import { XExchangePair } from "../services";

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

  static fromXExchangePair(pair: XExchangePair): Pair {
    return {
      id: pair.address,
      dexKey: 'xexchange', // TODO: update dex key      
      asset0Id: pair.firstTokenId,
      asset1Id: pair.secondTokenId,
      feeBps: pair.feePercent * 100,
      // TODO:
      // createdAtBlockNumber?: number;
      // createdAtBlockTimestamp?: number;
      // createdAtTxnId?: string;
      // pool?: {
      //   id: string;
      //   name: string;
      //   assetIds: string[];
      //   pairIds: string[];
      //   metadata?: Record<string, string>;
      // };
      // metadata?: Record<string, string>;
    };
  }
}
