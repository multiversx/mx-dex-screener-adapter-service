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
}
