import { ApiProperty } from "@nestjs/swagger";
import { XExchangeAddLiquidityEvent, XExchangeRemoveLiquidityEvent } from "../services";
import BigNumber from "bignumber.js";

export class JoinExitEvent {
  @ApiProperty()
  eventType!: "join" | "exit";

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
  amount0!: number | string;

  @ApiProperty()
  amount1!: number | string;

  @ApiProperty()
  reserves?: {
    asset0: number | string;
    asset1: number | string;
  };

  @ApiProperty()
  metadata?: Record<string, string>;

  static fromXExchangeEvent(event: XExchangeAddLiquidityEvent | XExchangeRemoveLiquidityEvent): JoinExitEvent {
    const eventType = event.type === "addLiquidity" ? "join" : "exit";

    return {
      eventType,
      txnId: event.txHash,
      txnIndex: 0, // TODO
      eventIndex: event.eventOrder,
      maker: event.caller,
      pairId: event.address,
      amount0: new BigNumber(event.firstTokenAmount).shiftedBy(-event.pair.firstTokenDecimals).toFixed(),
      amount1: new BigNumber(event.secondTokenAmount).shiftedBy(-event.pair.secondTokenDecimals).toFixed(),
      reserves: {
        asset0: new BigNumber(event.firstTokenReserves).shiftedBy(-event.pair.firstTokenDecimals).toFixed(),
        asset1: new BigNumber(event.secondTokenReserves).shiftedBy(-event.pair.secondTokenDecimals).toFixed(),
      },
    };
  }
}
