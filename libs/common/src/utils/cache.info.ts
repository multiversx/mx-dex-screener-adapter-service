import { Constants } from "@multiversx/sdk-nestjs-common";

export class CacheInfo {
  key: string = "";
  ttl: number = Constants.oneSecond() * 6;

  static Token(identifier: string): CacheInfo {
    return {
      key: `token:${identifier}`,
      ttl: Constants.oneDay(),
    };
  }

  static PairsMetadata(): CacheInfo {
    return {
      key: "pairs-metadata",
      ttl: Constants.oneMinute(),
    };
  }

  static PairFeePercent(pairAddress: string): CacheInfo {
    return {
      key: `pair-fee-percent:${pairAddress}`,
      ttl: Constants.oneHour() * 10, // TODO
    };
  }

  static ContractDeployInfo(address: string): CacheInfo {
    return {
      key: `contract-deploy-info:${address}`,
      ttl: Constants.oneDay(),
    };
  }
}
