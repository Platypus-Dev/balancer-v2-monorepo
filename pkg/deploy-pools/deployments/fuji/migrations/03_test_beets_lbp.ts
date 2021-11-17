import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { BigNumber } from 'ethers';
import { fujiTokens } from '../fujiTokens';
import { toNormalizedWeights } from '@balancer-labs/balancer-js/src';
import { createLiquidityBootstrappingPool } from '../../../src/createLiquidityBootstrappingPool';

export default async function (etherscanApiKey: string): Promise<void> {
  await createLiquidityBootstrappingPool({
    name: 'CAIL LBP 2',
    symbol: 'CAIL-LBP-2',
    //the tokens here must be sorted by address. if you get an error code 101, your tokens are not sorted in the correct order
    tokens: [fujiTokens.USDC.address, fujiTokens.CIAL.address],
    weights: toNormalizedWeights([fp(5), fp(95)]),
    initialBalances: [BigNumber.from(42857.14e6), fp(5000000)],
    swapFeePercentage: fp(0.001),
    swapEnabledOnStart: false,
    owner: '0xD0DF68f0149C3e662Df772CF40cB63070591AD36',
    etherscanApiKey,
  });
}
