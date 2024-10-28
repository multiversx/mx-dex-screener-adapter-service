import { ElasticEvent, ElasticLog } from "@mvx-monorepo/common";
import { GeneralEvent } from "../../entities/general.event";
import { OneDexPair } from "./onedex.pair";
import { AddressUtils, BinaryUtils } from "@multiversx/sdk-nestjs-common";

export class OneDexAddInitialLiquidityEvent extends GeneralEvent {
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
    super(event, "addLiquidity");

    this.caller = AddressUtils.bech32Encode(BinaryUtils.base64ToHex(event.topics[1]));

    this.firstTokenId = BinaryUtils.base64Decode(event.topics[2]);
    this.firstTokenAmount = BinaryUtils.base64ToBigInt(event.topics[3]).toString();
    this.secondTokenId = BinaryUtils.base64Decode(event.topics[4]);
    this.secondTokenAmount = BinaryUtils.base64ToBigInt(event.topics[5]).toString();

    this.firstTokenReserves = this.firstTokenAmount;
    this.secondTokenReserves = this.secondTokenAmount;

    this.lpTokenId = BinaryUtils.base64Decode(event.topics[6]);
    this.lpTokenAmount = BinaryUtils.base64ToBigInt(event.topics[7]).toString();
    this.liquidityPoolSupply = this.lpTokenAmount;

    this.timestamp = BinaryUtils.hexToNumber(BinaryUtils.base64ToHex(event.topics[8]));

    this.txHash = log.originalTxHash ?? log.txHash;
    this.txOrder = log.order;
    this.eventOrder = event.order;

    this.pair = pairs.find(p => p.lpTokenId === this.lpTokenId)!;
  }
}
