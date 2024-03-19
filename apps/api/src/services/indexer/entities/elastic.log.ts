import { ElasticEvent } from "./elastic.event";

export interface ElasticLog {
  originalTxHash: string;
  address: string;
  timestamp: number;
  events: ElasticEvent[];
}
