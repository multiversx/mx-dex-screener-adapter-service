import { XExchangeSwapEvent } from "@mvx-monorepo/common";
import { ApiProperty } from "@nestjs/swagger";
import BigNumber from "bignumber.js";

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
    let asset0In: string | undefined = undefined;
    let asset1In: string | undefined = undefined;
    let asset0Out: string | undefined = undefined;
    let asset1Out: string | undefined = undefined;
    let asset0Reserves: string;
    let asset1Reserves: string;
    let priceNative: string;

    if (event.pair.firstTokenId === event.tokenInId) {
      asset0In = new BigNumber(event.tokenInAmount).shiftedBy(-event.pair.firstTokenDecimals).toFixed();
      asset1Out = new BigNumber(event.tokenOutAmount).shiftedBy(-event.pair.secondTokenDecimals).toFixed();
      asset0Reserves = new BigNumber(event.tokenInReserves).shiftedBy(-event.pair.firstTokenDecimals).toFixed();
      asset1Reserves = new BigNumber(event.tokenOutReserves).shiftedBy(-event.pair.secondTokenDecimals).toFixed();
      priceNative = new BigNumber(asset1Reserves).dividedBy(asset0Reserves).toFixed();
    } else {
      asset1In = new BigNumber(event.tokenInAmount).shiftedBy(-event.pair.secondTokenDecimals).toFixed();
      asset0Out = new BigNumber(event.tokenOutAmount).shiftedBy(-event.pair.firstTokenDecimals).toFixed();
      asset0Reserves = new BigNumber(event.tokenOutReserves).shiftedBy(-event.pair.firstTokenDecimals).toFixed();
      asset1Reserves = new BigNumber(event.tokenInReserves).shiftedBy(-event.pair.secondTokenDecimals).toFixed();
      priceNative = new BigNumber(asset1Reserves).dividedBy(asset0Reserves).toFixed();
    }

    return {
      eventType: "swap",
      txnId: event.txHash,
      txnIndex: event.txOrder,
      eventIndex: event.eventOrder,
      maker: event.caller,
      pairId: event.address,
      asset0In,
      asset1In,
      asset0Out,
      asset1Out,
      priceNative,
      reserves: {
        asset0: asset0Reserves,
        asset1: asset1Reserves,
      },
    };
  }
}
