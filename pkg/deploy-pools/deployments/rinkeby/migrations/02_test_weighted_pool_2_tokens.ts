import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { BigNumber } from 'ethers';
import { rinkebyTokens } from '../rinkebyTokens';
import { toNormalizedWeights } from '@balancer-labs/balancer-js/src';
import { createWeightedPool2Tokens } from '../../../src/createWeightedPool2Tokens';

export default async function (etherscanApiKey: string): Promise<void> {
  await createWeightedPool2Tokens({
    name: 'Test pool 2 tokens weighted',
    symbol: 'TEST-2-TOKEN-WEIGHTED',
    //the tokens here must be sorted by address. if you get an error code 101, your tokens are not sorted in the correct order
    tokens: [rinkebyTokens.WETH.address, rinkebyTokens.WBTC.address],
    weights: toNormalizedWeights([fp(40), fp(60)]),
    initialBalances: [fp(0.13801539823968481), BigNumber.from(1e6)],
    swapFeePercentage: fp(0.0025),
    oracleEnabled: false,
    etherscanApiKey,
  });
}
