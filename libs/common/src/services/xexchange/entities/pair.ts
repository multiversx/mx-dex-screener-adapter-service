export interface XExchangePair {
  address: string;
  firstTokenId: string;
  firstTokenDecimals: number;
  secondTokenId: string;
  secondTokenDecimals: number;
  feePercent: number;
  isInverted: boolean;
}
