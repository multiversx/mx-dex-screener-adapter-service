import { ApiProperty } from "@nestjs/swagger";
import { Pair } from "../../../entitites";

export class PairResponse {
  @ApiProperty()
  pair!: Pair;
}
