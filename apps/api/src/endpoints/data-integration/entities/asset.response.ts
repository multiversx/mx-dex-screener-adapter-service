import { ApiProperty } from "@nestjs/swagger";
import { Asset } from "../../../entitites";

export class AssetResponse {
  @ApiProperty()
  asset!: Asset;
}
