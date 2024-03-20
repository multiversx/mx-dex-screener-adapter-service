import { ElasticEvent } from "./elastic.event";

export interface ElasticLog {
  originalTxHash?: string
  txHash: string;
  address: string;
  timestamp: number;
  events: ElasticEvent[];
}
