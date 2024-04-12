import { AddressType, BigUIntType, BinaryCodec, FieldDefinition, StructType, TokenIdentifierType, U64Type } from "@multiversx/sdk-core/out";
import { ElasticEvent, ElasticLog } from "@mvx-monorepo/common";
import { GeneralEvent } from "../../entities/general.event";
import { XExchangePair } from "./xexchange.pair";

export class XExchangeLiquidityEvent extends GeneralEvent {
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
  block: number;
  epoch: number;
  txHash: string;
  txOrder: number;
  eventOrder: number;
  pair: XExchangePair;

  constructor(event: ElasticEvent, log: ElasticLog, pair: XExchangePair, eventType: "addLiquidity" | "removeLiquidity") {
    super(event, eventType);

    const decodedEvent = this.decodeEvent();
    this.caller = decodedEvent.caller.bech32();

    if (pair.isInverted) {
      this.firstTokenId = decodedEvent.secondTokenID;
      this.firstTokenAmount = decodedEvent.secondTokenAmount.toFixed();
      this.secondTokenId = decodedEvent.firstTokenID;
      this.secondTokenAmount = decodedEvent.firstTokenAmount.toFixed();
      this.firstTokenReserves = decodedEvent.secondTokenReserves.toFixed();
      this.secondTokenReserves = decodedEvent.firstTokenReserves.toFixed();
    } else {
      this.firstTokenId = decodedEvent.firstTokenID;
      this.firstTokenAmount = decodedEvent.firstTokenAmount.toFixed();
      this.secondTokenId = decodedEvent.secondTokenID;
      this.secondTokenAmount = decodedEvent.secondTokenAmount.toFixed();
      this.firstTokenReserves = decodedEvent.firstTokenReserves.toFixed();
      this.secondTokenReserves = decodedEvent.secondTokenReserves.toFixed();
    }

    this.lpTokenId = decodedEvent.lpTokenID;
    this.lpTokenAmount = decodedEvent.lpTokenAmount.toFixed();
    this.liquidityPoolSupply = decodedEvent.liquidityPoolSupply.toFixed();

    this.block = decodedEvent.block.toNumber();
    this.epoch = decodedEvent.epoch.toNumber();
    this.timestamp = decodedEvent.timestamp.toNumber();

    this.txHash = log.originalTxHash ?? log.txHash;
    this.txOrder = log.order;
    this.eventOrder = event.order;
    this.pair = pair;
  }

  protected decodeEvent() {
    if (this.data == undefined) {
      throw new Error('Invalid data field');
    }

    const data = Buffer.from(this.data, 'base64');
    const codec = new BinaryCodec();

    const eventStruct = this.getStructure();

    const [decoded] = codec.decodeNested(data, eventStruct);
    return decoded.valueOf();
  }

  private getStructure(): StructType {
    return new StructType('XexchangeLiquidityEvent', [
      new FieldDefinition('caller', '', new AddressType()),
      new FieldDefinition('firstTokenID', '', new TokenIdentifierType()),
      new FieldDefinition('firstTokenAmount', '', new BigUIntType()),
      new FieldDefinition('secondTokenID', '', new TokenIdentifierType()),
      new FieldDefinition('secondTokenAmount', '', new BigUIntType()),
      new FieldDefinition('lpTokenID', '', new TokenIdentifierType()),
      new FieldDefinition('lpTokenAmount', '', new BigUIntType()),
      new FieldDefinition('liquidityPoolSupply', '', new BigUIntType()),
      new FieldDefinition('firstTokenReserves', '', new BigUIntType()),
      new FieldDefinition('secondTokenReserves', '', new BigUIntType()),
      new FieldDefinition('block', '', new U64Type()),
      new FieldDefinition('epoch', '', new U64Type()),
      new FieldDefinition('timestamp', '', new U64Type()),
    ]);
  }
}
