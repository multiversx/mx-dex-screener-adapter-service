import { ElasticEvent } from "@mvx-monorepo/common";
import { XExchangePair } from "./xexchange.pair";
import { XExchangeLiquidityEvent } from "./xexchange.liquidity.event";

export class XExchangeRemoveLiquidityEvent extends XExchangeLiquidityEvent {
  constructor(event: ElasticEvent, pair: XExchangePair) {
    super(event, pair, "removeLiquidity");

    const decodedEvent = this.decodeEvent();
    this.caller = decodedEvent.caller.bech32();
  }
}
