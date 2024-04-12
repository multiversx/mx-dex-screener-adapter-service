import { ApiProperty } from "@nestjs/swagger";

export class SwapEvent {
  @ApiProperty()
  eventType!: "swap";

  @ApiProperty()
  txnId!: string;

  @ApiProperty()
  txnIndex!: number;

  @ApiProperty()
  eventIndex!: number;

  @ApiProperty()
  maker!: string;

  @ApiProperty()
  pairId!: string;

  @ApiProperty()
  asset0In?: number | string;

  @ApiProperty()
  asset1In?: number | string;

  @ApiProperty()
  asset0Out?: number | string;

  @ApiProperty()
  asset1Out?: number | string;

  @ApiProperty()
  priceNative!: number | string;

  @ApiProperty()
  reserves?: {
    asset0: number | string;
    asset1: number | string;
  };

  @ApiProperty()
  metadata?: Record<string, string>;
}
