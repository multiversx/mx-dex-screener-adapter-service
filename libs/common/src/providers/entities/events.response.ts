import { ApiProperty } from "@nestjs/swagger";
import { Block } from "./block";
import { SwapEvent } from "./swap.event";
import { JoinExitEvent } from "./join.exit.event";

export class EventsResponse {
  @ApiProperty()
  events!: Array<{ block: Block } & (SwapEvent | JoinExitEvent)>;
}
