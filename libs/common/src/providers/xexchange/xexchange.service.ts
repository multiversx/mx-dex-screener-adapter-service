import { AbiRegistry, Address, Interaction, ResultsParser, SmartContract, TypedOutcomeBundle } from "@multiversx/sdk-core/out";
import {
  ApiConfigService,
  ApiMetricsService,
  CacheInfo, JoinExitEvent,
  LogPerformanceAsync,
  MetricsEvents, Pair, PairResponse, SwapEvent,
} from "@mvx-monorepo/common";
import { Injectable, NotFoundException } from "@nestjs/common";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { ContractQueryResponse } from "@multiversx/sdk-network-providers/out";
import { ContractQueryRequest } from "@multiversx/sdk-network-providers/out/contractQueryRequest";
import pairAbi from "./abis/pair.abi.json";
import routerAbi from "./abis/router.abi.json";
import { PairMetadata } from "../entities";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import BigNumber from "bignumber.js";
import { IndexerService } from "../../services/indexer";
import { BinaryUtils, OriginLogger } from "@multiversx/sdk-nestjs-common";
import { PAIR_EVENTS } from "@multiversx/sdk-exchange";
import { MultiversXApiService } from "../../services/multiversx.api";
import { PerformanceProfiler } from "@multiversx/sdk-nestjs-monitoring";
import { GeneralEvent } from "@mvx-monorepo/common/providers/entities/general.event";
import { IProviderService } from "@mvx-monorepo/common/providers";
import { XExchangePair } from "@mvx-monorepo/common/providers/xexchange/entities/xexchange.pair";
import { XExchangeSwapEvent } from "@mvx-monorepo/common/providers/xexchange/entities/xexchange.swap.event";
import { XExchangeAddLiquidityEvent } from "@mvx-monorepo/common/providers/xexchange/entities/xexchange.add.liquidity.event";
import { XExchangeRemoveLiquidityEvent } from "@mvx-monorepo/common/providers/xexchange/entities/xexchange.remove.liquidity.event";

@Injectable()
export class XExchangeService implements IProviderService {
  private readonly SWAP_FEE_PERCENT_BASE_POINTS = 100000;
  private readonly logger = new OriginLogger(XExchangeService.name);
  private readonly resultsParser: ResultsParser;
  private readonly routerContract: SmartContract;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
    private readonly cacheService: CacheService,
    private readonly indexerService: IndexerService,
    private readonly multiversXApiService: MultiversXApiService,
    private readonly apiMetricsService: ApiMetricsService,
  ) {
    this.resultsParser = new ResultsParser();

    const routerAddress = this.apiConfigService.getXExchangeRouterAddress();
    this.routerContract = new SmartContract({
      address: new Address(routerAddress),
      abi: AbiRegistry.create(routerAbi),
    });
  }

  @LogPerformanceAsync(MetricsEvents.SetXExchangeDuration)
  public async getPairs(): Promise<XExchangePair[]> {
    const pairsMetadata = await this.getPairsMetadata();

    const pairs: XExchangePair[] = [];
    for (const metadata of pairsMetadata) {
      const [firstToken, secondToken] = await Promise.all([
        this.multiversXApiService.getToken(metadata.firstTokenId),
        this.multiversXApiService.getToken(metadata.secondTokenId),
      ]);

      if (!firstToken || !secondToken) {
        this.logger.error(`Token not found for pair with address ${metadata.address}`);
        continue;
      }

      pairs.push({
        ...metadata,
        firstTokenDecimals: firstToken.decimals,
        secondTokenDecimals: secondToken.decimals,
      });
    }

    return pairs;
  }

  public async getPairsMetadata(): Promise<PairMetadata[]> {
    return await this.cacheService.getOrSet(
      CacheInfo.PairsMetadata().key,
      () => this.getPairsMetadataRaw(),
      CacheInfo.PairsMetadata().ttl,
    );
  }

  public async getPairsMetadataRaw(): Promise<PairMetadata[]> {
    const interaction = this.routerContract.methodsExplicit.getAllPairContractMetadata();
    const responseRaw = await this.queryContract(interaction);
    const response = responseRaw?.firstValue?.valueOf();

    if (!response) {
      this.logger.error(`Empty vm-query result`);
      throw new Error("Empty vm-query result");
    }

    const pairsMetadata = response.map((v: any) => {
      const firstTokenId = v.first_token_id.toString();
      const secondTokenId = v.second_token_id.toString();

      const isInverted = this.isPairInverted(firstTokenId, secondTokenId);

      return {
        address: v.address.toString(),
        firstTokenId: isInverted ? secondTokenId : firstTokenId,
        secondTokenId: isInverted ? firstTokenId : secondTokenId,
        isInverted,
      };
    });

    return pairsMetadata;
  }

  public async getPairFeePercent(pairAddress: string): Promise<number> {
    return await this.cacheService.getOrSet(
      CacheInfo.PairFeePercent(pairAddress).key,
      () => this.getPairFeePercentRaw(pairAddress),
      CacheInfo.PairFeePercent(pairAddress).ttl,
    );
  }

  public async getPairFeePercentRaw(pairAddress: string): Promise<number> {
    const pairContract = new SmartContract({
      address: new Address(pairAddress),
      abi: AbiRegistry.create(pairAbi),
    });

    const interaction = pairContract.methodsExplicit.getTotalFeePercent();
    const responseRaw = await this.queryContract(interaction);
    const response = responseRaw?.firstValue?.valueOf()?.toNumber();

    if (response === undefined) {
      // TOOD: handle error
      throw new Error("No response");
    }

    const feePercent = new BigNumber(response)
      .dividedBy(this.SWAP_FEE_PERCENT_BASE_POINTS)
      .multipliedBy(100)
      .toNumber();
    return feePercent;
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

  @LogPerformanceAsync(MetricsEvents.SetXExchangeDuration)
  public async getEvents(before: number, after: number): Promise<GeneralEvent[]> {
    const pairs = await this.getPairs();
    const pairAddresses = pairs.map((p) => p.address);

    const swapTopic = BinaryUtils.base64Encode(PAIR_EVENTS.SWAP);
    const addLiquidityTopic = BinaryUtils.base64Encode(PAIR_EVENTS.ADD_LIQUIDITY);
    const removeLiquidityTopic = BinaryUtils.base64Encode(PAIR_EVENTS.REMOVE_LIQUIDITY);
    const eventNames = [swapTopic, addLiquidityTopic, removeLiquidityTopic];

    const logs = await this.indexerService.getLogs(before, after, pairAddresses, eventNames);

    const events: (XExchangeSwapEvent | XExchangeAddLiquidityEvent | XExchangeRemoveLiquidityEvent)[] = [];
    for (const log of logs) {
      for (const event of log.events) {
        const pair = pairs.find((p) => p.address === event.address);
        if (!pair) {
          this.logger.error(`Pair not found for address ${event.address}`);
          continue;
        }

        switch (event.topics[0]) {
          case swapTopic:
            const swapEvent = new XExchangeSwapEvent(event, log, pair);
            events.push(swapEvent);
            break;
          case addLiquidityTopic:
            const addLiquidityEvent = new XExchangeAddLiquidityEvent(event, log, pair);
            events.push(addLiquidityEvent);
            break;
          case removeLiquidityTopic:
            const removeLiquidityEvent = new XExchangeRemoveLiquidityEvent(event, log, pair);
            events.push(removeLiquidityEvent);
            break;
          default:
            this.logger.error(`Unknown event topic ${event.topics[0]}. Event: ${JSON.stringify(event)}`);
        }
      }
    }

    return events;
  }

  public async getPair(identifier: string): Promise<PairResponse> {
    const xExchangePairs = await this.getPairs();
    const xExchangePair = xExchangePairs.find((p) => p.address === identifier);
    if (!xExchangePair) {
      this.logger.error(`Pair with address ${identifier} not found`);
      throw new NotFoundException(`Pair with address ${identifier} not found`);
    }

    const pairFeePercent = await this.getPairFeePercent(identifier);

    const { deployTxHash, deployedAt } = await this.multiversXApiService.getContractDeployInfo(identifier);
    const round = deployedAt ? await this.indexerService.getRound(deployedAt) : undefined;

    const pair = this.fromCustomPair(xExchangePair, pairFeePercent, {
      deployTxHash,
      deployedAt,
      deployRound: round?.round,
    });
    return {
      pair,
    };
  }

  public getProviderName(): string {
    return "xExchange";
  }

  private fromCustomPair(pair: XExchangePair, feePercent: number, deployInfo?: { deployRound?: number, deployTxHash?: string, deployedAt?: number }): Pair {
      return {
        id: pair.address,
        dexKey: this.getProviderName(),
        asset0Id: pair.firstTokenId,
        asset1Id: pair.secondTokenId,
        feeBps: feePercent * 100,
        createdAtBlockNumber: deployInfo?.deployRound,
        createdAtBlockTimestamp: deployInfo?.deployedAt,
        createdAtTxnId: deployInfo?.deployTxHash,
      };
  }

  public fromSwapEvent(event: XExchangeSwapEvent): SwapEvent {
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

  public fromAddRemoveLiquidityEvent(event: XExchangeAddLiquidityEvent | XExchangeRemoveLiquidityEvent): JoinExitEvent {
    const eventType = event.type === "addLiquidity" ? "join" : "exit";

    return {
      eventType,
      txnId: event.txHash,
      txnIndex: event.txOrder,
      eventIndex: event.eventOrder,
      maker: event.caller,
      pairId: event.address,
      amount0: new BigNumber(event.firstTokenAmount).shiftedBy(-event.pair.firstTokenDecimals).toFixed(),
      amount1: new BigNumber(event.secondTokenAmount).shiftedBy(-event.pair.secondTokenDecimals).toFixed(),
      reserves: {
        asset0: new BigNumber(event.firstTokenReserves).shiftedBy(-event.pair.firstTokenDecimals).toFixed(),
        asset1: new BigNumber(event.secondTokenReserves).shiftedBy(-event.pair.secondTokenDecimals).toFixed(),
      },
    };
  }

  private isPairInverted(firstTokenId: string, secondTokenId: string): boolean {
    const wegldIdentifier = this.apiConfigService.getWrappedEGLDIdentifier();
    const wusdcIdentifier = this.apiConfigService.getWrappedUSDCIdentifier();

    return firstTokenId === wegldIdentifier && secondTokenId !== wusdcIdentifier;
  }
}
