# MultiversX DEX Screener Adapter Service

## Quick start

1. Run `npm install` in the project directory
2. Create `.env.mainnet` or `.env.custom` based on the `.env.example` file

## Dependencies

-  Redis Server is required to be installed [docs](https://redis.io/).

You can run `docker-compose up` in a separate terminal to use a local Docker container for all these dependencies.

After running the sample, you can stop the Docker container with `docker-compose down`

## Available Scripts

This is a MultiversX project built on Nest.js framework.

### `npm run start:api:mainnet`

​
Runs the app in the production mode.
Make requests to [http://localhost:3000/dex-screener-adapter](http://localhost:3000/dex-screener-adapter).

Redis Server is required to be installed.

## Running the api

```bash
# development debug mode on mainnet
$ npm run start:api:mainnet

# development debug mode on a custom network
$ npm run start:api:custom
```

## Running the offline-jobs

```bash
# development debug mode on mainnet
$ start:offline-jobs:mainnet

# development debug mode on a custom network
$ start:offline-jobs:custom
```
