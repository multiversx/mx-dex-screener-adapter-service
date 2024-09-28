import { ElasticEvent, ElasticLog } from "@mvx-monorepo/common";
import { GeneralEvent } from "../../entities/general.event";
import { OneDexPair } from "./onedex.pair";
import { AddressUtils, BinaryUtils } from "@multiversx/sdk-nestjs-common";

export class OneDexRemoveLiquidityEvent extends GeneralEvent {
  caller: string;
  firstTokenId: string;
  firstTokenAmount: string;
  secondTokenId: string;
  secondTokenAmount: string;
  lpTokenId: string;
  lpTokenAmount: string;
  liquidityPoolSupply: string;
  firstTokenReserves: string;
  secondTokenReserves: string;
  txHash: string;
  txOrder: number;
  eventOrder: number;
  pair: OneDexPair;

  constructor(event: ElasticEvent, log: ElasticLog, pairs: OneDexPair[]) {
    super(event, "removeLiquidity");

    this.caller = AddressUtils.bech32Encode(BinaryUtils.base64ToHex(event.topics[1]));

    this.firstTokenId = BinaryUtils.base64Decode(event.topics[2]);
    this.firstTokenAmount = BinaryUtils.base64ToBigInt(event.topics[3]).toString();
    this.secondTokenId = BinaryUtils.base64Decode(event.topics[4]);
    this.secondTokenAmount = BinaryUtils.base64ToBigInt(event.topics[5]).toString();

    this.firstTokenReserves = BinaryUtils.base64ToBigInt(event.topics[10]).toString();
    this.secondTokenReserves = BinaryUtils.base64ToBigInt(event.topics[11]).toString();

    this.lpTokenId = BinaryUtils.base64Decode(event.topics[6]);
    this.lpTokenAmount = BinaryUtils.base64ToBigInt(event.topics[7]).toString();
    this.liquidityPoolSupply = BinaryUtils.base64ToBigInt(event.topics[12]).toString();

    this.timestamp = BinaryUtils.hexToNumber(BinaryUtils.base64ToHex(event.topics[8]));

    this.txHash = log.originalTxHash ?? log.txHash;
    this.txOrder = log.order;
    this.eventOrder = event.order;

    const pairId = BinaryUtils.hexToNumber(BinaryUtils.base64ToHex(event.topics[9]));
    this.pair = pairs.find(p => p.id === pairId)!;
  }
}
