import { Injectable } from "@nestjs/common";
import { ErdnestConfigService } from "@multiversx/sdk-nestjs-common";

@Injectable()
export class SdkNestjsConfigServiceImpl implements ErdnestConfigService {
  getSecurityAdmins(): string[] {
    return [];
  }

  getJwtSecret(): string {
    return '';
  }

  getApiUrl(): string {
    return '';
  }

  getNativeAuthMaxExpirySeconds(): number {
    return 0;
  }

  getNativeAuthAcceptedOrigins(): string[] {
    return [];
  }
}
