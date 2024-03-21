export class XExchangeEvent {
  public readonly type: string;

  constructor(type: "swap" | "addLiquidity" | "removeLiquidity") {
    this.type = type;
  }
}
