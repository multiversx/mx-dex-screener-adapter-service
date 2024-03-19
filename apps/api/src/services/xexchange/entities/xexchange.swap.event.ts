import { AddressType, BigUIntType, BinaryCodec, FieldDefinition, StructType, TokenIdentifierType, U64Type } from "@multiversx/sdk-core/out";
import { ElasticEvent, ElasticLog } from "../../indexer";
import { PairEventTopics } from '@multiversx/sdk-exchange';
import { XExchangeEvent } from "./xexchange.event";

export class XExchangeSwapEvent extends XExchangeEvent {
  address: string;
  identifier: string;
  topics: string[];
  data: string;
  decodedTopics: PairEventTopics;
  caller: string;
  tokenInId: string;
  tokenInAmount: string;
  tokenOutId: string;
  tokenOutAmount: string;
  feeAmount: string;
  tokenInReserves: string;
  tokenOutReserves: string;
  block: number;
  epoch: number;
  timestamp: number;
  txHash: string;

  constructor(event: ElasticEvent, log: ElasticLog) {
    super('swap');

    this.address = event.address;
    this.identifier = event.identifier;
    this.topics = event.topics;
    this.data = event.data;
    this.decodedTopics = new PairEventTopics(this.topics);

    const decodedEvent = this.decodeEvent();
    this.caller = decodedEvent.caller.bech32();
    this.tokenInId = decodedEvent.tokenInID;
    this.tokenInAmount = decodedEvent.tokenInAmount.toFixed();
    this.tokenOutId = decodedEvent.tokenOutID;
    this.tokenOutAmount = decodedEvent.tokenOutAmount.toFixed();
    this.feeAmount = decodedEvent.feeAmount.toFixed();
    this.tokenInReserves = decodedEvent.tokenInReserves.toFixed();
    this.tokenOutReserves = decodedEvent.tokenOutReserves.toFixed();
    this.block = decodedEvent.block.toNumber();
    this.epoch = decodedEvent.epoch.toNumber();
    this.timestamp = decodedEvent.timestamp.toNumber();

    this.txHash = log.originalTxHash; // TODO: discuss
  }

  private decodeEvent() {
    if (this.data == undefined) {
      throw new Error('Invalid data field');
    }

    const data = Buffer.from(this.data, 'base64');
    const codec = new BinaryCodec();

    const swapEventStructure = this.getStructure();

    const [decoded] = codec.decodeNested(data, swapEventStructure);

    return decoded.valueOf();
  }

  private getStructure(): StructType {
    return new StructType('SwapEvent', [
      new FieldDefinition('caller', '', new AddressType()),
      new FieldDefinition('tokenInID', '', new TokenIdentifierType()),
      new FieldDefinition('tokenInAmount', '', new BigUIntType()),
      new FieldDefinition('tokenOutID', '', new TokenIdentifierType()),
      new FieldDefinition('tokenOutAmount', '', new BigUIntType()),
      new FieldDefinition('feeAmount', '', new BigUIntType()),
      new FieldDefinition('tokenInReserves', '', new BigUIntType()),
      new FieldDefinition('tokenOutReserves', '', new BigUIntType()),
      new FieldDefinition('block', '', new U64Type()),
      new FieldDefinition('epoch', '', new U64Type()),
      new FieldDefinition('timestamp', '', new U64Type()),
    ]);
  }
}
