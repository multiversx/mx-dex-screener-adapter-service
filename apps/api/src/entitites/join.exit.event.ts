import { ApiProperty } from "@nestjs/swagger";
import { XExchangeAddLiquidityEvent, XExchangeRemoveLiquidityEvent } from "../services";

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

  static fromXExchangeAddLiquidityEvent(event: XExchangeAddLiquidityEvent): JoinExitEvent {
    // TODO
    return {
      eventType: "join",
      txnId: "",
      txnIndex: 0,
      eventIndex: 0,
      maker: event.caller,
      pairId: event.address,
      amount0: '0',
      amount1: '0',
      // reserves?: {
      //   asset0: number | string;
      //   asset1: number | string;
      // };
      // metadata?: Record<string, string>;
    };
  }

  static fromXExchangeRemoveLiquidityEvent(event: XExchangeRemoveLiquidityEvent): JoinExitEvent {
    // TODO
    return {
      eventType: "exit",
      txnId: "",
      txnIndex: 0,
      eventIndex: 0,
      maker: event.caller,
      pairId: event.address,
      amount0: '0',
      amount1: '0',
      // reserves?: {
      //   asset0: number | string;
      //   asset1: number | string;
      // };
      // metadata?: Record<string, string>;
    };
  }
}
