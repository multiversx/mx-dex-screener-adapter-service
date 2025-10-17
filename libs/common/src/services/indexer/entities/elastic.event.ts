export interface ElasticEvent {
  identifier: string;
  address: string;
  data: string;
  topics: string[];
  order: number;
  txOrder: number;
  shardId: number;
  timestamp: number;
  originalTxHash: string;
  txHash: string;
  logAddress: string;
}
