import { ApiProperty } from "@nestjs/swagger";

export class Block {
  @ApiProperty()
  blockNumber!: number;

  @ApiProperty()
  blockTimestamp!: number;

  @ApiProperty()
  metadata?: Record<string, string>;
}
