import { AbiRegistry, Address, Interaction, ResultsParser, SmartContract, TypedOutcomeBundle } from "@multiversx/sdk-core/out";
import { ApiConfigService, CacheInfo } from "@mvx-monorepo/common";
import { Injectable } from "@nestjs/common";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { ContractQueryResponse } from "@multiversx/sdk-network-providers/out";
import { ContractQueryRequest } from "@multiversx/sdk-network-providers/out/contractQueryRequest";
import pairAbi from "./abis/pair.abi.json";
import routerAbi from "./abis/router.abi.json";
import { PairMetadata, XExchangeAddLiquidityEvent, XExchangePair, XExchangeRemoveLiquidityEvent, XExchangeSwapEvent } from "./entities";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import BigNumber from "bignumber.js";
import { IndexerService } from "../indexer";
import { BinaryUtils } from "@multiversx/sdk-nestjs-common";
import { PAIR_EVENTS } from "@multiversx/sdk-exchange";

@Injectable()
export class XExchangeService {
  private readonly SWAP_FEE_PERCENT_BASE_POINTS = 100000;

  private readonly resultsParser: ResultsParser;
  private readonly routerContract: SmartContract;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
    private readonly cacheService: CacheService,
    private readonly indexerService: IndexerService,
  ) {
    this.resultsParser = new ResultsParser();

    const routerAddress = this.apiConfigService.getXExchangeRouterAddress();
    this.routerContract = new SmartContract({
      address: new Address(routerAddress),
      abi: AbiRegistry.create(routerAbi),
    });
  }

  public async getPairs(): Promise<XExchangePair[]> {
    const pairsMetadata = await this.getPairsMetadata();

    const pairs: XExchangePair[] = await Promise.all(pairsMetadata.map(async (metadata) => {
      const feePercent = await this.getPairFeePercent(metadata.address);

      // TODO: add other fields
      // TODO: swap first and second token if needed

      return {
        ...metadata,
        feePercent,
      };
    }));

    return pairs;
  }

  public async getPairsMetadata(): Promise<PairMetadata[]> {
    return await this.cacheService.getOrSet(
      CacheInfo.PairsMetadata().key,
      () => this.getPairsMetadataRaw(),
      CacheInfo.PairsMetadata().ttl,
    );
  }

  private async getPairsMetadataRaw(): Promise<PairMetadata[]> {
    const interaction = this.routerContract.methodsExplicit.getAllPairContractMetadata();
    const responseRaw = await this.queryContract(interaction);
    const response = responseRaw?.firstValue?.valueOf();

    if (!response) {
      // TODO: handle error
      throw new Error("No response");
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

  private async getPairFeePercent(pairAddress: string): Promise<number> {
    return await this.cacheService.getOrSet(
      CacheInfo.PairFeePercent(pairAddress).key,
      () => this.getPairFeePercentRaw(pairAddress),
      CacheInfo.PairFeePercent(pairAddress).ttl,
    );
  }

  private async getPairFeePercentRaw(pairAddress: string): Promise<number> {
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
    const request = new ContractQueryRequest(interaction.buildQuery()).toHttpRequest();
    const httpResponse = await this.apiService.post(`${this.apiConfigService.getApiUrl()}/query`, request, { headers: request.headers });
    const queryResponse = ContractQueryResponse.fromHttpResponse(httpResponse.data);

    const response = this.resultsParser.parseQueryResponse(queryResponse, interaction.getEndpoint());
    return response;
  }

  public async getEvents(before: number, after: number): Promise<(XExchangeSwapEvent | XExchangeAddLiquidityEvent | XExchangeRemoveLiquidityEvent)[]> {
    const pairsMetadata = await this.getPairsMetadata();
    const pairAddresses = pairsMetadata.map((p) => p.address);

    const swapTopic = BinaryUtils.base64Encode(PAIR_EVENTS.SWAP);
    const addLiquidityTopic = BinaryUtils.base64Encode(PAIR_EVENTS.ADD_LIQUIDITY);
    const removeLiquidityTopic = BinaryUtils.base64Encode(PAIR_EVENTS.REMOVE_LIQUIDITY);
    const eventNames = [swapTopic, addLiquidityTopic, removeLiquidityTopic];

    const logs = await this.indexerService.getLogs(before, after, pairAddresses, eventNames);

    const events: (XExchangeSwapEvent | XExchangeAddLiquidityEvent | XExchangeRemoveLiquidityEvent)[] = [];
    for (const log of logs) {
      for (const event of log.events) {
        switch (event.topics[0]) {
          case swapTopic:
            const swapEvent = new XExchangeSwapEvent(event, log);
            events.push(swapEvent);
            break;
          case addLiquidityTopic:
            const addLiquidityEvent = new XExchangeAddLiquidityEvent(event, log);
            events.push(addLiquidityEvent);
            break;
          case removeLiquidityTopic:
            const removeLiquidityEvent = new XExchangeRemoveLiquidityEvent(event, log);
            events.push(removeLiquidityEvent);
            break;
          default:
            // TODO: handle error
            continue;
        }
      }
    }

    return events;
  }

  private isPairInverted(firstTokenId: string, secondTokenId: string): boolean {
    const wegldIdentifier = this.apiConfigService.getWrappedEGLDIdentifier();
    const wusdcIdentifier = this.apiConfigService.getWrappedUSDCIdentifier();

    return firstTokenId === wegldIdentifier && secondTokenId !== wusdcIdentifier;
  }
}
