import { ElasticEvent } from "@mvx-monorepo/common";
import { GeneralEvent } from "../../entities/general.event";
import { OneDexPair } from "./onedex.pair";
import { AddressUtils, BinaryUtils } from "@multiversx/sdk-nestjs-common";

export class OneDexSwapEvent extends GeneralEvent {
  caller: string;
  tokenInId: string;
  tokenInAmount: string;
  tokenOutId: string;
  tokenOutAmount: string;
  tokenInReserves: string;
  tokenOutReserves: string;
  txHash: string;
  txOrder: number;
  eventOrder: number;
  pair: OneDexPair;

  constructor(event: ElasticEvent, pairs: OneDexPair[]) {
    super(event, 'swap');

    this.caller = AddressUtils.bech32Encode(event.topics[1]);

    this.tokenInId = BinaryUtils.hexToString(event.topics[2]);
    this.tokenInAmount = BinaryUtils.hexToBigInt(event.topics[3]).toString();

    this.tokenOutId = BinaryUtils.hexToString(event.topics[5]);
    this.tokenOutAmount = BinaryUtils.hexToBigInt(event.topics[6]).toString();

    this.tokenInReserves = BinaryUtils.hexToBigInt(event.topics[4]).toString();
    this.tokenOutReserves = BinaryUtils.hexToBigInt(event.topics[7]).toString();

    this.timestamp = BinaryUtils.hexToNumber(event.topics[8]);

    this.txHash = event.originalTxHash ?? event.txHash;
    this.txOrder = event.txOrder;
    this.eventOrder = event.order;

    const pairId = BinaryUtils.hexToNumber(event.topics[9]);
    this.pair = pairs.find(p => p.id === pairId)!;
  }
}
