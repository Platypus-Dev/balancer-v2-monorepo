import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { BigNumber } from 'ethers';
import { rinkebyTokens } from '../rinkebyTokens';
import { createWeightedPool } from '../../../src/createWeightedPool';
import { toNormalizedWeights } from '@balancer-labs/balancer-js/src';

export default async function (etherscanApiKey: string): Promise<void> {
  await createWeightedPool({
    name: 'Test pool',
    symbol: 'TEST-WEIGHTED',
    //the tokens here must be sorted by address. if you get an error code 101, your tokens are not sorted in the correct order
    tokens: [rinkebyTokens.FTM.address, rinkebyTokens.WETH.address, rinkebyTokens.WBTC.address],
    weights: toNormalizedWeights([fp(33.333333333333333333), fp(33.333333333333333333), fp(33.333333333333333333)]),
    initialBalances: [fp(360.78094488188976378), fp(0.13801539823968481), BigNumber.from(1e6)],
    swapFeePercentage: fp(0.0025),
    etherscanApiKey,
  });
}
