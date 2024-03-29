import { ApiProperty } from "@nestjs/swagger";
import { Asset } from "./asset";

export class AssetResponse {
  @ApiProperty()
  asset!: Asset;
}
