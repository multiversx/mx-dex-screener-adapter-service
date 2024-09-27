import {
  ApiConfigService,
  JoinExitEvent,
  MetricsEvents,
  PairResponse, SwapEvent,
  LogPerformanceAsync,
  ApiMetricsService,
  MultiversXApiService,
  CacheInfo,
  IndexerService,
} from "@mvx-monorepo/common";
import { Injectable } from "@nestjs/common";
import { GeneralEvent } from "@mvx-monorepo/common/providers/entities/general.event";
import { IProviderService } from "@mvx-monorepo/common/providers";
import { OneDexPair } from "./entities/onedex.pair";
import swapAbi from "./abis/swap.abi.json";
import { AbiRegistry, Address, Interaction, ResultsParser, SmartContract, TypedOutcomeBundle, U32Value } from "@multiversx/sdk-core/out";
import { PerformanceProfiler } from "@multiversx/sdk-nestjs-monitoring";
import { ContractQueryRequest } from "@multiversx/sdk-network-providers/out/contractQueryRequest";
import { BinaryUtils, OriginLogger } from "@multiversx/sdk-nestjs-common";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { ContractQueryResponse } from "@multiversx/sdk-network-providers/out";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { OneDexSwapEvent } from "./entities/onedex.swap.event";
import BigNumber from "bignumber.js";

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
    private readonly indexerService: IndexerService,
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
  public async getEvents(before: number, after: number): Promise<GeneralEvent[]> {
    const pairs = await this.getPairs();

    const swapTopic = BinaryUtils.base64Encode("SwapTokensFixedInputEvent");
    // const addLiquidityTopic = BinaryUtils.base64Encode(PAIR_EVENTS.ADD_LIQUIDITY);
    // const removeLiquidityTopic = BinaryUtils.base64Encode(PAIR_EVENTS.REMOVE_LIQUIDITY);
    const eventNames = [swapTopic];

    const logs = await this.indexerService.getLogs(before, after, [this.swapAddress], eventNames);

    // const events: (OneDexSwapEvent | OneDexAddLiquidityEvent | OneDexRemoveLiquidityEvent)[] = [];
    const events: (OneDexSwapEvent)[] = [];
    for (const log of logs) {
      for (const event of log.events) {
        switch (event.topics[0]) {
          case swapTopic:
            const swapEvent = new OneDexSwapEvent(event, log, pairs);
            events.push(swapEvent);
            break;
          // TODO
          // case addLiquidityTopic:
          //   const addLiquidityEvent = new XExchangeAddLiquidityEvent(event, log, pair);
          //   events.push(addLiquidityEvent);
          //   break;
          // case removeLiquidityTopic:
          //   const removeLiquidityEvent = new XExchangeRemoveLiquidityEvent(event, log, pair);
          //   events.push(removeLiquidityEvent);
          //   break;
          default:
            this.logger.error(`Unknown event topic ${event.topics[0]}. Event: ${JSON.stringify(event)}`);
        }
      }
    }

    return events;
  }

  public getProviderName(): string {
    return "OneDex";
  }

  public fromSwapEvent(event: OneDexSwapEvent): SwapEvent {
    let asset0In: string | undefined = undefined;
    let asset1In: string | undefined = undefined;
    let asset0Out: string | undefined = undefined;
    let asset1Out: string | undefined = undefined;
    let asset0Reserves: string;
    let asset1Reserves: string;
    let priceNative: string;

    if (event.pair.firstTokenId === event.tokenInId) {
      asset0In = new BigNumber(event.tokenInAmount).shiftedBy(-event.pair.firstTokenDecimals).toFixed();
      asset1Out = new BigNumber(event.tokenOutAmount).shiftedBy(-event.pair.secondTokenDecimals).toFixed();
      asset0Reserves = new BigNumber(event.tokenInReserves).shiftedBy(-event.pair.firstTokenDecimals).toFixed();
      asset1Reserves = new BigNumber(event.tokenOutReserves).shiftedBy(-event.pair.secondTokenDecimals).toFixed();
      priceNative = new BigNumber(asset1Reserves).dividedBy(asset0Reserves).toFixed();
    } else {
      asset1In = new BigNumber(event.tokenInAmount).shiftedBy(-event.pair.secondTokenDecimals).toFixed();
      asset0Out = new BigNumber(event.tokenOutAmount).shiftedBy(-event.pair.firstTokenDecimals).toFixed();
      asset0Reserves = new BigNumber(event.tokenOutReserves).shiftedBy(-event.pair.firstTokenDecimals).toFixed();
      asset1Reserves = new BigNumber(event.tokenInReserves).shiftedBy(-event.pair.secondTokenDecimals).toFixed();
      priceNative = new BigNumber(asset1Reserves).dividedBy(asset0Reserves).toFixed();
    }

    return {
      eventType: "swap",
      txnId: event.txHash,
      txnIndex: event.txOrder,
      eventIndex: event.eventOrder,
      maker: event.caller,
      pairId: event.address,
      asset0In,
      asset1In,
      asset0Out,
      asset1Out,
      priceNative,
      reserves: {
        asset0: asset0Reserves,
        asset1: asset1Reserves,
      },
    };
  }

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
