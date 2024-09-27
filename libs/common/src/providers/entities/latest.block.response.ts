import { ApiProperty } from "@nestjs/swagger";
import { Block } from "./block";

export class LatestBlockResponse {
  @ApiProperty()
  block!: Block;
}
