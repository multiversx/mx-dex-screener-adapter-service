import { ElasticEvent } from "@mvx-monorepo/common";
import { XExchangePair } from "./xexchange.pair";
import { XExchangeLiquidityEvent } from "./xexchange.liquidity.event";

export class XExchangeAddLiquidityEvent extends XExchangeLiquidityEvent {
  constructor(event: ElasticEvent, pair: XExchangePair) {
    super(event, pair, "addLiquidity");

    const decodedEvent = this.decodeEvent();
    this.caller = decodedEvent.caller.bech32();
  }
}
