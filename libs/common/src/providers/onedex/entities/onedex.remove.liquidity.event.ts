import { ElasticEvent } from "@mvx-monorepo/common";
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

  constructor(event: ElasticEvent, pairs: OneDexPair[]) {
    super(event, "removeLiquidity");

    this.caller = AddressUtils.bech32Encode(event.topics[1]);

    this.firstTokenId = BinaryUtils.hexToString(event.topics[2]);
    this.firstTokenAmount = BinaryUtils.hexToBigInt(event.topics[3]).toString();
    this.secondTokenId = BinaryUtils.hexToString(event.topics[4]);
    this.secondTokenAmount = BinaryUtils.hexToBigInt(event.topics[5]).toString();

    this.firstTokenReserves = BinaryUtils.hexToBigInt(event.topics[10]).toString();
    this.secondTokenReserves = BinaryUtils.hexToBigInt(event.topics[11]).toString();

    this.lpTokenId = BinaryUtils.hexToString(event.topics[6]);
    this.lpTokenAmount = BinaryUtils.hexToBigInt(event.topics[7]).toString();
    this.liquidityPoolSupply = BinaryUtils.hexToBigInt(event.topics[12]).toString();

    this.timestamp = BinaryUtils.hexToNumber(event.topics[8]);

    this.txHash = event.originalTxHash ?? event.txHash;
    this.txOrder = event.txOrder;
    this.eventOrder = event.order;

    const pairId = BinaryUtils.hexToNumber(event.topics[9]);
    this.pair = pairs.find(p => p.id === pairId)!;
  }
}
