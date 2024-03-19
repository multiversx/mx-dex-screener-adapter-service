export interface Token {
  identifier: string;
  name: string;
  ticker: string;
  decimals: number;
  supply: string;
  circulatingSupply: string;
  assets?: {
    social?: {
      coinmarketcap?: string;
      coingecko?: string;
    }
  }
}
