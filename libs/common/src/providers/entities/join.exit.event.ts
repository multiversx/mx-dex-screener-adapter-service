import { ApiProperty } from "@nestjs/swagger";

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
}
