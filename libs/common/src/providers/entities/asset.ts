import { Token } from "@mvx-monorepo/common";
import { ApiProperty } from "@nestjs/swagger";

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

  static fromToken(token: Token, extra: { wegldIdentifier: string, usdcIdentifier: string }): Asset {
    let coinGeckoId = undefined;
    if (token.assets?.social?.coingecko) {
      coinGeckoId = token.assets?.social?.coingecko.replace('https://www.coingecko.com/en/coins/', '').split('/')[0];
    }

    let coinMarketCapId = undefined;
    if (token.assets?.social?.coinmarketcap) {
      coinMarketCapId = token.assets?.social?.coinmarketcap.replace('https://coinmarketcap.com/currencies/', '').split('/')[0];
    }

    const name = token.name;
    let symbol = token.ticker;

    if (token.identifier === extra.wegldIdentifier) {
      // name = 'MultiversX eGold';
      symbol = 'EGLD';
    }
    if (token.identifier === extra.usdcIdentifier) {
      // name = 'WrappedUSDC';
      symbol = 'USDC';
    }

    return {
      id: token.identifier,
      name,
      symbol,
      totalSupply: token.supply,
      circulatingSupply: token.circulatingSupply,
      coinGeckoId,
      coinMarketCapId,
    };
  }
}
