export interface OneDexPair {
  id: number;
  address: string;
  lpTokenId: string;
  lpTokenDecimals: number;
  firstTokenId: string;
  firstTokenDecimals: number;
  secondTokenId: string;
  secondTokenDecimals: number;
  pairFeePercent: number;
}
