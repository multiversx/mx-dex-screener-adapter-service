import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const CHAIN_SIMULATOR_URL = 'http://localhost:8085';
const API_SERVICE_URL = 'http://localhost:3001';
const ALICE_ADDRESS = 'erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th';
const ROUTER_ADDRESS = 'erd1qqqqqqqqqqqqqpgqq66xk9gfr4esuhem3jru86wg5hvp33a62jps2fy57p';
const ROUTER_OWNER_ADDRESS = 'erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97';

// const BOB_ADDRESS = 'erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx';
import { deploySc, DeployScArgs, fundAddress, issueMultipleEsdts } from './chain.simulator.operations';
import { Address } from '@multiversx/sdk-core/out';

describe('Events e2e tests with chain simulator', () => {
    beforeAll(async () => {
        try {
            const response = await axios.get(
                `${CHAIN_SIMULATOR_URL}/simulator/observers`,
            );
            let numRetries = 0;
            while (true) {
                if (response.status === 200) {
                    await axios.post(
                        `${CHAIN_SIMULATOR_URL}/simulator/generate-blocks-until-epoch-reached/2`,
                        {},
                    );
                    break;
                }

                numRetries += 1;
                if (numRetries > 50) {
                    fail('Chain simulator not started!');
                }
            }
            // 0.003
            // 0.081
            // Fund Alice's address
            await fundAddress(CHAIN_SIMULATOR_URL, ALICE_ADDRESS);

            const relativePath = path.join(__dirname, 'erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2.wasm')

            const contractCode = await fs.readFile(relativePath);

            const tokenIdentifiers = await issueMultipleEsdts(CHAIN_SIMULATOR_URL, ALICE_ADDRESS, 2);

            const deployRes = await deploySc(new DeployScArgs(
                {
                    chainSimulatorUrl: CHAIN_SIMULATOR_URL,
                    deployer: ALICE_ADDRESS,
                    contractCodeRaw: contractCode,
                    hexArguments: [
                        `${Buffer.from(tokenIdentifiers[0], 'utf8').toString('hex')}`, // first_token_id
                        `${Buffer.from(tokenIdentifiers[1], 'utf8').toString('hex')}`, // second_token_id
                        Address.fromBech32(ROUTER_ADDRESS).hex(), // router_address
                        Address.fromBech32(ROUTER_OWNER_ADDRESS).hex(), // router_owner_address
                        `${(parseInt('3000').toString(16))}`, // total_fee_percent
                        `${(parseInt('6000').toString(16))}`, // special_fee_percent
                        Address.fromBech32(ALICE_ADDRESS).hex(), // initial_liquidity_adder
                    ]
                }
            ))

            console.log(deployRes);


            // // Issue multiple ESDT tokens
            // await issueMultipleEsdts(CHAIN_SIMULATOR_URL, ALICE_ADDRESS, 5);
            await new Promise((resolve) => setTimeout(resolve, 20000));
        } catch (e) {
            console.error(e);
        }
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });


    describe('GET /blocks', () => {
        it('should return status code 200', async () => {
            const response = await axios.get(`${API_SERVICE_URL}/blocks`);
            expect(response.status).toBe(200);
        })
    });
})