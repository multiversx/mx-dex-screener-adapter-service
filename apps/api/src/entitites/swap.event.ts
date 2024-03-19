import { ApiProperty } from "@nestjs/swagger";
import { ElasticEvent } from "../services";

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

  static fromElasticSwapEvent(event: ElasticEvent): SwapEvent {
    // TODO
    // @ts-ignore
    return {
      eventType: "swap",
      // txnId!: string;
      // txnIndex!: number;
      // eventIndex!: number;
      // maker!: string;
      pairId: event.address,
      // asset0In?: number | string;
      // asset1In?: number | string;
      // asset0Out?: number | string;
      // asset1Out?: number | string;
      // priceNative!: number | string;
      // reserves?: {
      //   asset0: number | string;
      //   asset1: number | string;
      // };
      // metadata?: Record<string, string>;
    };
  }
}
