import { AbiRegistry, Address, Interaction, ResultsParser, SmartContract, TypedOutcomeBundle } from "@multiversx/sdk-core/out";
import { ApiConfigService, CacheInfo } from "@mvx-monorepo/common";
import { Injectable } from "@nestjs/common";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { ContractQueryResponse } from "@multiversx/sdk-network-providers/out";
import { ContractQueryRequest } from "@multiversx/sdk-network-providers/out/contractQueryRequest";
import routerAbi from "./abis/router.abi.json";
import { PairMetadata } from "./entities";
import { CacheService } from "@multiversx/sdk-nestjs-cache";

@Injectable()
export class XExchangeService {
  private readonly resultsParser: ResultsParser;
  private readonly routerContract: SmartContract;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
    private readonly cacheService: CacheService,
  ) {
    this.resultsParser = new ResultsParser();

    const routerAddress = this.apiConfigService.getXExchangeRouterAddress();
    this.routerContract = new SmartContract({
      address: new Address(routerAddress),
      abi: AbiRegistry.create(routerAbi),
    });
  }

  public async getPairs(): Promise<any[]> {
    const pairs = await this.pairsMetadata();

    // TODO: add other fields
    // TODO: swap first and second token if needed

    return pairs;
  }

  private async pairsMetadata(): Promise<PairMetadata[]> {
    return await this.cacheService.getOrSet(
      CacheInfo.PairsMetadata().key,
      () => this.pairsMetadataRaw(),
      CacheInfo.PairsMetadata().ttl,
    );
  }

  private async pairsMetadataRaw(): Promise<PairMetadata[]> {
    const interaction = this.routerContract.methodsExplicit.getAllPairContractMetadata();
    const responseRaw = await this.queryContract(interaction);
    const response = responseRaw?.firstValue?.valueOf();

    if (!response) {
      // TODO: handle error
      throw new Error("No response");
    }

    const pairsMetadata = response.map((v: any) => {
      return {
        address: v.address.toString(),
        firstTokenId: v.first_token_id.toString(),
        secondTokenId: v.second_token_id.toString(),
      };
    });

    return pairsMetadata;
  }

  private async queryContract(interaction: Interaction): Promise<TypedOutcomeBundle> {
    const request = new ContractQueryRequest(interaction.buildQuery()).toHttpRequest();
    const httpResponse = await this.apiService.post(`${this.apiConfigService.getApiUrl()}/query`, request, { headers: request.headers });
    const queryResponse = ContractQueryResponse.fromHttpResponse(httpResponse.data);

    const response = this.resultsParser.parseQueryResponse(queryResponse, interaction.getEndpoint());
    return response;
  }
}
