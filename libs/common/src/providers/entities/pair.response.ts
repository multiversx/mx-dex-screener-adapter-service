import { ApiProperty } from "@nestjs/swagger";
import { Pair } from "./pair";

export class PairResponse {
  @ApiProperty()
  pair!: Pair;
}
