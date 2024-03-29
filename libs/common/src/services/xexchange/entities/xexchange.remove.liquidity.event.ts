import { ElasticEvent, ElasticLog } from "../../indexer";
import { XExchangePair } from "./pair";
import { XExchangeLiquidityEvent } from "./xexchange.liquidity.event";

export class XExchangeRemoveLiquidityEvent extends XExchangeLiquidityEvent {
  constructor(event: ElasticEvent, log: ElasticLog, pair: XExchangePair) {
    super(event, log, pair, "removeLiquidity");
  }
}
