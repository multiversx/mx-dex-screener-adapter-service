import { JoinExitEvent, PairResponse, SwapEvent } from "./entities";
import { GeneralEvent } from "@mvx-monorepo/common/providers/entities/general.event";

export interface IProviderService {
    getPair(address: string): Promise<PairResponse>;
    getEvents(before: number, after: number): Promise<GeneralEvent[]>;
    getProviderName(): string;
    fromSwapEvent(event: GeneralEvent): SwapEvent;
    fromAddRemoveLiquidityEvent(event: GeneralEvent): JoinExitEvent;
}
