import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { AssetResponse, EventsResponse, LatestBlockResponse, PairResponse } from "./entities";
import { ApiResponse } from "@nestjs/swagger";
import { DataIntegrationService } from "./data-integration.service";
import { ParseIntPipe } from "@multiversx/sdk-nestjs-common";

@Controller()
export class DataIntegrationController {
  constructor(
    private readonly dataIntegrationService: DataIntegrationService,
  ) { }

  @Get("/latest-block")
  @ApiResponse({ status: 200, type: LatestBlockResponse })
  async getLatestBlock(): Promise<LatestBlockResponse> {
    return await this.dataIntegrationService.getLatestBlock();
  }

  @Get("/asset")
  async getAsset(
    @Query("id") id: string,
  ): Promise<AssetResponse> {
    if (!id) {
      throw new BadRequestException("id is required");
    }
    return await this.dataIntegrationService.getAsset(id);
  }

  @Get("/pair")
  async getPair(
    @Query("id") id: string,
  ): Promise<PairResponse> {
    if (!id) {
      throw new BadRequestException("id is required");
    }
    return await this.dataIntegrationService.getPair(id);
  }

  @Get("/events")
  async getEvents(
    @Query("fromBlock", ParseIntPipe) fromBlock: number,
    @Query("toBlock", ParseIntPipe) toBlock: number,
  ): Promise<EventsResponse> {
    return await this.dataIntegrationService.getEvents(fromBlock, toBlock);
  }
}
