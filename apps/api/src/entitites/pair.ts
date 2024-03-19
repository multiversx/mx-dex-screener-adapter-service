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

  static fromXExchangePair(pair: any): Pair {
    // @ts-ignore
    return {
      id: pair.address,
      dexKey: 'xexchange', // TODO: update dex key
      // TODO:
      // dexKey!: string;
      // asset0Id!: string;
      // asset1Id!: string;
      // createdAtBlockNumber?: number;
      // createdAtBlockTimestamp?: number;
      // createdAtTxnId?: string;
      // feeBps?: number;
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
