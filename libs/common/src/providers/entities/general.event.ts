import { ElasticEvent } from "@mvx-monorepo/common";

export class GeneralEvent {
  type: string;
  address: string;
  identifier: string;
  topics: string[];
  data: string;
  timestamp!: number;

  constructor(event: ElasticEvent, type: "swap" | "addLiquidity" | "removeLiquidity") {
    this.address = event.address;
    this.identifier = event.identifier;
    this.topics = event.topics;
    this.data = event.data;

    this.type = type;
  }
}
