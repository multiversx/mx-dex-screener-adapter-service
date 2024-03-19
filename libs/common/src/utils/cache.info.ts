import { Constants } from "@multiversx/sdk-nestjs-common";

export class CacheInfo {
  key: string = "";
  ttl: number = Constants.oneSecond() * 6;

  static Token(identifier: string): CacheInfo {
    return {
      key: `token:${identifier}`,
      ttl: Constants.oneHour(),
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
      ttl: Constants.oneMinute() * 10,
    };
  }
}
