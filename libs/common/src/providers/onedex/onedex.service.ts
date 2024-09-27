import {
  ApiConfigService,
  JoinExitEvent,
  MetricsEvents,
  PairResponse, SwapEvent,
  LogPerformanceAsync,
  ApiMetricsService,
  MultiversXApiService,
  CacheInfo,
} from "@mvx-monorepo/common";
import { Injectable } from "@nestjs/common";
import { GeneralEvent } from "@mvx-monorepo/common/providers/entities/general.event";
import { IProviderService } from "@mvx-monorepo/common/providers";
import { OneDexPair } from "./entities/onedex.pair";
import swapAbi from "./abis/swap.abi.json";
import { AbiRegistry, Address, Interaction, ResultsParser, SmartContract, TypedOutcomeBundle, U32Value } from "@multiversx/sdk-core/out";
import { PerformanceProfiler } from "@multiversx/sdk-nestjs-monitoring";
import { ContractQueryRequest } from "@multiversx/sdk-network-providers/out/contractQueryRequest";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { ContractQueryResponse } from "@multiversx/sdk-network-providers/out";
import { CacheService } from "@multiversx/sdk-nestjs-cache";

@Injectable()
export class OneDexService implements IProviderService {
  private readonly logger = new OriginLogger(OneDexService.name);

  private readonly resultsParser: ResultsParser;
  private readonly swapAddress: string;
  private readonly swapContract: SmartContract;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
    private readonly apiMetricsService: ApiMetricsService,
    private readonly multiversXApiService: MultiversXApiService,
    private readonly cacheService: CacheService,
  ) {
    this.resultsParser = new ResultsParser();

    this.swapAddress = this.apiConfigService.getOneDexSwapAddress();
    this.swapContract = new SmartContract({
      address: new Address(this.swapAddress),
      abi: AbiRegistry.create(swapAbi),
    });
  }

  @LogPerformanceAsync(MetricsEvents.SetOneDexDuration)
  public async getPair(address: string): Promise<PairResponse | undefined> {
    const oneDexPairs = await this.getPairs();
    const oneDexPair = oneDexPairs.find((p) => p.address === address);
    if (!oneDexPair) {
      return undefined;
    }

    const pair = {
      id: oneDexPair.address,
      dexKey: this.getProviderName(),
      asset0Id: oneDexPair.firstTokenId,
      asset1Id: oneDexPair.secondTokenId,
      feeBps: oneDexPair.pairFeePercent,
      // TODO
      //   deployTxHash,
      //   deployedAt,
      //   deployRound: round?.round,
    };

    return {
      pair,
    };
  }

  @LogPerformanceAsync(MetricsEvents.SetOneDexDuration)
  public async getPairs(): Promise<OneDexPair[]> {
    const rawPairs = await this.getPairsMetadata();

    const pairs: OneDexPair[] = [];
    for (const rawPair of rawPairs) {
      const [firstToken, secondToken] = await Promise.all([
        this.multiversXApiService.getToken(rawPair.first_token_id),
        this.multiversXApiService.getToken(rawPair.second_token_id),
      ]);

      if (!firstToken || !secondToken) {
        this.logger.error(`Token not found for pair with lp ${rawPair.lp_token_id}`);
        continue;
      }

      const pair: OneDexPair = {
        id: rawPair.pair_id,
        address: `${this.swapAddress}-${rawPair.lp_token_id}`,
        lpTokenId: rawPair.lp_token_id,
        lpTokenDecimals: rawPair.lp_token_decimal,
        firstTokenId: rawPair.first_token_id,
        firstTokenDecimals: firstToken.decimals,
        secondTokenId: rawPair.second_token_id,
        secondTokenDecimals: secondToken.decimals,
        pairFeePercent: rawPair.total_fee_percentage, // TODO: decimals
      }
      pairs.push(pair);
    }

    return pairs;
  }

  public async getPairsMetadata(): Promise<any[]> {
    return await this.cacheService.getOrSet(
      CacheInfo.OneDexPairsMetadata().key,
      () => this.getPairsMetadataRaw(),
      CacheInfo.OneDexPairsMetadata().ttl,
    );
  }

  public async getPairsMetadataRaw(): Promise<any[]> {
    const rawPairs = [];

    const size = 100;
    let from = 0;
    let currentRawPairs = [];
    do {
      const interaction = this.swapContract.methodsExplicit.viewPairsPaginated([
        new U32Value(from),
        new U32Value(size),
      ]);
      const responseRaw = await this.queryContract(interaction);
      currentRawPairs = responseRaw?.firstValue?.valueOf();

      rawPairs.push(...currentRawPairs);

      from += currentRawPairs.length;
    } while (currentRawPairs.length === size);

    for (const rawPair of rawPairs) {
      rawPair.pair_id = rawPair.pair_id.toNumber();
      rawPair.lp_token_decimal = rawPair.lp_token_decimal.toNumber();
      rawPair.total_fee_percentage = rawPair.total_fee_percentage.toNumber();
    }

    return rawPairs;
  }

  @LogPerformanceAsync(MetricsEvents.SetOneDexDuration)
  public async getEvents(_before: number, _after: number): Promise<GeneralEvent[]> {
    throw new Error("Method not implemented.");
  }

  public getProviderName(): string {
    return "OneDex";
  }

  @LogPerformanceAsync(MetricsEvents.SetOneDexDuration)
  public fromSwapEvent(_event: GeneralEvent): SwapEvent {
    throw new Error("Method not implemented.");
  }

  @LogPerformanceAsync(MetricsEvents.SetOneDexDuration)
  public fromAddRemoveLiquidityEvent(_event: GeneralEvent): JoinExitEvent {
    throw new Error("Method not implemented.");
  }

  private async queryContract(interaction: Interaction): Promise<TypedOutcomeBundle> {
    const performanceProfiler = new PerformanceProfiler();

    try {
      const request = new ContractQueryRequest(interaction.buildQuery()).toHttpRequest();
      const httpResponse = await this.apiService.post(`${this.apiConfigService.getApiUrl()}/query`, request, { headers: request.headers });
      const queryResponse = ContractQueryResponse.fromHttpResponse(httpResponse.data);

      const response = this.resultsParser.parseQueryResponse(queryResponse, interaction.getEndpoint());
      return response;
    } catch (error) {
      this.logger.error(`Failed to query contract: ${interaction.getEndpoint()}`);
      this.logger.error(error);
      throw error;
    } finally {
      performanceProfiler.stop();
      this.apiMetricsService.setVmQueryDurationHistogram(interaction.getEndpoint().name, performanceProfiler.duration);
    }
  }
}
