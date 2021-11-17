import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { BigNumber } from 'ethers';
import { rinkebyTokens } from '../rinkebyTokens';
import { toNormalizedWeights } from '@balancer-labs/balancer-js/src';
import { createLiquidityBootstrappingPool } from '../../../src/createLiquidityBootstrappingPool';

export default async function (etherscanApiKey: string): Promise<void> {
  await createLiquidityBootstrappingPool({
    name: 'BEETS LBP 2',
    symbol: 'BEETS-LBP-2',
    //the tokens here must be sorted by address. if you get an error code 101, your tokens are not sorted in the correct order
    tokens: [rinkebyTokens.USDC.address, rinkebyTokens.BEETS.address],
    weights: toNormalizedWeights([fp(5), fp(95)]),
    initialBalances: [BigNumber.from(42857.14e6), fp(5000000)],
    swapFeePercentage: fp(0.001),
    swapEnabledOnStart: false,
    owner: '0x4fbe899d37fb7514adf2f41B0630E018Ec275a0C',
    etherscanApiKey,
  });
}
