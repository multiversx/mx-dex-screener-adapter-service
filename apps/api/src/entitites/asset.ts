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
}
