import { Module } from '@nestjs/common';
import { ApiConfigModule, ApiMetricsModule, DynamicModuleUtils } from '@mvx-monorepo/common';
import { LoggingModule } from '@multiversx/sdk-nestjs-common';
import { CronsModule } from './crons';
import configuration from '../config/configuration';

@Module({
  imports: [
    LoggingModule,
    ApiMetricsModule,
    ApiConfigModule.forRoot(configuration),
    CronsModule,
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
  ],
  exports: [
  ],
})
export class OfflineJobsAppModule { }
