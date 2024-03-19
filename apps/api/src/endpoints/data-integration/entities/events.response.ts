import { ApiProperty } from "@nestjs/swagger";
import { Block, JoinExitEvent, SwapEvent } from "../../../entitites";

export class EventsResponse {
  @ApiProperty()
  events!: Array<{ block: Block } & (SwapEvent | JoinExitEvent)>;
}
