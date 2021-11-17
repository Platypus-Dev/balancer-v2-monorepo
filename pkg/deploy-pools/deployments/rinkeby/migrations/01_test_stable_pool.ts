import { createStablePool } from '../../../src/createStablePool';
import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { BigNumber } from 'ethers';
import { rinkebyTokens } from '../rinkebyTokens';

export default async function (etherscanApiKey: string): Promise<void> {
  await createStablePool({
    name: 'Test Stable Pool',
    symbol: 'TEST-STABLE',
    //the tokens here must be sorted by address. if you get an error code 101, your tokens are not sorted in the correct order
    tokens: [rinkebyTokens.DAI.address, rinkebyTokens.USDC.address],
    initialBalances: [fp(50), BigNumber.from(50e6)],
    amplificationParameter: 200,
    swapFeePercentage: fp(0.0005),
    etherscanApiKey,
  });
}
