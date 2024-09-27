import { ElasticEvent, ElasticLog } from "@mvx-monorepo/common";
import { GeneralEvent } from "../../entities/general.event";
import { OneDexPair } from "./onedex.pair";
import { AddressUtils, BinaryUtils } from "@multiversx/sdk-nestjs-common";

export class OneDexSwapEvent extends GeneralEvent {
  caller: string;
  tokenInId: string;
  tokenInAmount: string;
  tokenOutId: string;
  tokenOutAmount: string;
  // feeAmount: string;
  tokenInReserves: string;
  tokenOutReserves: string;
  // block: number;
  // epoch: number;
  txHash: string;
  txOrder: number;
  eventOrder: number;
  pair: OneDexPair;

  constructor(event: ElasticEvent, log: ElasticLog, pairs: OneDexPair[]) {
    super(event, 'swap');

    // TODO
    // this.feeAmount = decodedEvent.feeAmount.toFixed();
    // this.block = decodedEvent.block.toNumber();
    // this.epoch = decodedEvent.epoch.toNumber();

    this.caller = AddressUtils.bech32Encode(BinaryUtils.base64ToHex(event.topics[1]));

    this.tokenInId = BinaryUtils.base64Decode(event.topics[2]);
    this.tokenInAmount = BinaryUtils.base64ToBigInt(event.topics[3]).toString();

    this.tokenOutId = BinaryUtils.base64Decode(event.topics[5]);
    this.tokenOutAmount = BinaryUtils.base64ToBigInt(event.topics[6]).toString();

    this.tokenInReserves = BinaryUtils.base64ToBigInt(event.topics[4]).toString();
    this.tokenOutReserves = BinaryUtils.base64ToBigInt(event.topics[7]).toString();

    this.timestamp = BinaryUtils.hexToNumber(BinaryUtils.base64ToHex(event.topics[8]));

    this.txHash = log.originalTxHash ?? log.txHash;
    this.txOrder = log.order;
    this.eventOrder = event.order;

    const pairId = BinaryUtils.hexToNumber(BinaryUtils.base64ToHex(event.topics[9]));
    this.pair = pairs.find(p => p.id === pairId)!;
  }
}
