import { ElasticEvent, ElasticLog } from "@mvx-monorepo/common";
import { XExchangePair } from "./xexchange.pair";
import { XExchangeLiquidityEvent } from "./xexchange.liquidity.event";

export class XExchangeAddLiquidityEvent extends XExchangeLiquidityEvent {
  constructor(event: ElasticEvent, log: ElasticLog, pair: XExchangePair) {
    super(event, log, pair, "addLiquidity");

    const decodedEvent = this.decodeEvent();
    this.caller = decodedEvent.caller.bech32();
  }
}
