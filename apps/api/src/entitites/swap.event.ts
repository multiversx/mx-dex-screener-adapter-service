import { ApiProperty } from "@nestjs/swagger";
import { XExchangeSwapEvent } from "../services";

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

  static fromXExchangeSwapEvent(event: XExchangeSwapEvent): SwapEvent {
    // TODO: handle inversed pairs
    return {
      eventType: "swap",
      txnId: event.txHash,
      txnIndex: 0, // TODO
      eventIndex: 0,
      maker: event.caller,
      pairId: event.address,
      // asset0In: event.tokenInI,
      // asset1In: event.tokenOutId,
      // asset0Out: event.tokenInAmount,
      // asset1Out?: number | string
      priceNative: '0',
      // reserves?: {
      //   asset0: number | string;
      //   asset1: number | string;
      // };
      // metadata?: Record<string, string>;
    };
  }
}
