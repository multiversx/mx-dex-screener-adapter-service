import { ApiProperty } from "@nestjs/swagger";
import { Token } from "../services";

export class Asset {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  symbol!: string;

  @ApiProperty()
  totalSupply?: string | number;

  @ApiProperty()
  circulatingSupply?: string | number;

  @ApiProperty()
  coinGeckoId?: string;

  @ApiProperty()
  coinMarketCapId?: string;

  @ApiProperty()
  metadata?: Record<string, string>;

  static fromToken(token: Token): Asset {
    let coinGeckoId = undefined;
    if (token.assets?.social?.coingecko) {
      coinGeckoId = token.assets?.social?.coingecko.replace('https://www.coingecko.com/en/coins/', '').split('/')[0];
    }

    let coinMarketCapId = undefined;
    if (token.assets?.social?.coinmarketcap) {
      coinMarketCapId = token.assets?.social?.coinmarketcap.replace('https://coinmarketcap.com/currencies/', '').split('/')[0];
    }

    return {
      id: token.identifier,
      name: token.name,
      symbol: token.ticker,
      totalSupply: token.supply, // TODO: format
      circulatingSupply: token.circulatingSupply, // TODO: format
      coinGeckoId,
      coinMarketCapId,
      // TODO: add metadata
    };
  }
}
