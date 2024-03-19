import { ApiProperty } from "@nestjs/swagger";
import { Block } from "../../../entitites";

export class LatestBlockResponse {
  @ApiProperty()
  block!: Block;
}
