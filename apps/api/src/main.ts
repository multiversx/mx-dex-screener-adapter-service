import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({
  path: resolve(process.cwd(), '.env'),
});
import 'module-alias/register';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { join } from 'path';
import { ApiConfigService } from '@mvx-monorepo/common';
import { PrivateAppModule } from './private.app.module';
import { PublicAppModule } from './public.app.module';
import * as bodyParser from 'body-parser';
import { Logger, NestInterceptor } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import cookieParser from 'cookie-parser';
import { PubSubListenerModule } from '@mvx-monorepo/common';
import { LoggingInterceptor, MetricsService } from '@multiversx/sdk-nestjs-monitoring';
import { LoggerInitializer } from '@multiversx/sdk-nestjs-common';

import '@multiversx/sdk-nestjs-common/lib/utils/extensions/array.extensions';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/date.extensions';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/number.extensions';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/string.extensions';
import configuration from '../config/configuration';

async function bootstrap() {
  const logger = new Logger('Bootstrapper');

  LoggerInitializer.initialize(logger);

  const publicApp = await NestFactory.create(PublicAppModule);
  publicApp.use(bodyParser.json({ limit: '1mb' }));
  publicApp.enableCors();
  publicApp.useLogger(publicApp.get(WINSTON_MODULE_NEST_PROVIDER));
  publicApp.use(cookieParser());

  const apiConfigService = publicApp.get<ApiConfigService>(ApiConfigService);
  const metricsService = publicApp.get<MetricsService>(MetricsService);
  const httpAdapterHostService = publicApp.get<HttpAdapterHost>(HttpAdapterHost);

  const httpServer = httpAdapterHostService.httpAdapter.getHttpServer();
  httpServer.keepAliveTimeout = apiConfigService.getServerTimeout();
  httpServer.headersTimeout = apiConfigService.getHeadersTimeout(); //`keepAliveTimeout + server's expected response time`

  const globalInterceptors: NestInterceptor[] = [];
  globalInterceptors.push(new LoggingInterceptor(metricsService));
  publicApp.useGlobalInterceptors(...globalInterceptors);

  const publicApiPrefix = apiConfigService.getPublicApiPrefix();
  if (publicApiPrefix) {
    publicApp.setGlobalPrefix(publicApiPrefix);
  }

  const description = readFileSync(join(__dirname, '..', 'docs', 'swagger.md'), 'utf8');

  const documentBuilder = new DocumentBuilder()
    .setTitle('MultiversX Microservice API')
    .setDescription(description)
    .setVersion('1.0.0')
    .setExternalDoc('MultiversX Docs', 'https://docs.multiversx.com');
  const config = documentBuilder.build();

  const document = SwaggerModule.createDocument(publicApp, config);
  SwaggerModule.setup(publicApiPrefix ?? '', publicApp, document);

  await publicApp.listen(apiConfigService.getPublicApiFeaturePort());

  const privateApp = await NestFactory.create(PrivateAppModule);
  await privateApp.listen(apiConfigService.getPrivateApiFeaturePort());

  const pubSubApp = await NestFactory.createMicroservice<MicroserviceOptions>(
    PubSubListenerModule.forRoot(configuration),
    {
      transport: Transport.REDIS,
      options: {
        host: apiConfigService.getRedisUrl(),
        port: 6379,
        retryAttempts: 100,
        retryDelay: 1000,
        retryStrategy: () => 1000,
      },
    },
  );
  pubSubApp.useLogger(pubSubApp.get(WINSTON_MODULE_NEST_PROVIDER));
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  pubSubApp.listen();

  logger.log(`Public API active on port ${apiConfigService.getPublicApiFeaturePort()}`);
  logger.log(`Private API active on port ${apiConfigService.getPrivateApiFeaturePort()}`);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
