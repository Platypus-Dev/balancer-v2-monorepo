import { ethers } from 'hardhat';
import LiquidityBootstrappingPoolFactory from '@balancer-labs/v2-deployments/tasks/20210721-liquidity-bootstrapping-pool/abi/LiquidityBootstrappingPoolFactory.json';
import LiquidityBootstrappingPoolFactoryBuildInfo from '@balancer-labs/v2-deployments/tasks/20210721-liquidity-bootstrapping-pool/build-info/LiquidityBootstrappingPoolFactory.json';
import LiquidityBootstrappingPool from '@balancer-labs/v2-deployments/tasks/20210721-liquidity-bootstrapping-pool/abi/LiquidityBootstrappingPool.json';
import { BigNumber } from 'ethers';
import {
  getAbiEncodedConstructorArguments,
  getBufferPeriodDuration,
  getDeployedPoolData,
  getPauseWindowDurationForPool,
  getPoolAddressAndBlockHashFromTransaction,
  getTaskOutputFile,
  getVaultAddress,
  hasPoolBeenDeployed,
  hasPoolBeenInitialized,
  hasPoolBeenVerified,
  joinPool,
  savePoolDeployment,
  setDeployedPoolAsInitialized,
  setDeployedPoolAsVerified,
  verifyPool,
} from './helpers';
import { BuildInfo } from 'hardhat/types';
import Vault from '@balancer-labs/v2-deployments/tasks/20210418-vault/abi/Vault.json';
import logger from '@balancer-labs/v2-deployments/src/logger';

interface CreateLbpParams {
  name: string;
  symbol: string;
  tokens: string[];
  weights: BigNumber[];
  swapFeePercentage: BigNumber;
  initialBalances: BigNumber[];
  owner: string;
  swapEnabledOnStart: boolean;
  etherscanApiKey: string;
}

export async function createLiquidityBootstrappingPool(params: CreateLbpParams): Promise<void> {
  const { name, symbol, tokens, weights, swapFeePercentage, owner, initialBalances, swapEnabledOnStart } = params;
  const lbpFactoryAddress = getTaskOutputFile('20210721-liquidity-bootstrapping-pool')
    .LiquidityBootstrappingPoolFactory;
  const vaultAddress = await getVaultAddress();
  const vault = await ethers.getContractAt(Vault, vaultAddress);
  const factory = await ethers.getContractAt(LiquidityBootstrappingPoolFactory, lbpFactoryAddress);

  if (!hasPoolBeenDeployed(symbol)) {
    logger.info('Calling create on the LiquidityBootstrappingPoolFactory...');
    const tx = await factory.create(name, symbol, tokens, weights, swapFeePercentage, owner, swapEnabledOnStart);
    const { poolAddress, blockHash } = await getPoolAddressAndBlockHashFromTransaction(tx);
    const pool = await ethers.getContractAt(LiquidityBootstrappingPool, poolAddress);
    const poolId = await pool.getPoolId();

    logger.success(`Successfully deployed the LiquidityBootstrappingPool at address ${poolAddress} with id ${poolId}`);
    logger.info(`Pool deployment block hash: ${blockHash}`);

    savePoolDeployment(symbol, poolAddress, poolId, blockHash, { ...params });
  }

  const poolData = getDeployedPoolData(symbol);

  if (poolData && !hasPoolBeenVerified(symbol)) {
    await verifyLbpPool({
      ...params,
      poolAddress: poolData.address,
      blockHash: poolData.blockHash,
    });

    setDeployedPoolAsVerified(symbol);
  }

  if (poolData && !hasPoolBeenInitialized(symbol)) {
    await joinPool({
      vault,
      poolId: poolData.id,
      tokens,
      initialBalances,
    });

    setDeployedPoolAsInitialized(symbol);
  }
}

async function verifyLbpPool({
  name,
  symbol,
  tokens,
  weights,
  swapFeePercentage,
  owner,
  poolAddress,
  blockHash,
  etherscanApiKey,
  swapEnabledOnStart,
}: CreateLbpParams & { poolAddress: string; blockHash: string }) {
  const vaultAddress = getVaultAddress();
  const pool = await ethers.getContractAt(LiquidityBootstrappingPool, poolAddress);
  const pauseWindowDuration = await getPauseWindowDurationForPool(pool, blockHash);
  const bufferPeriodDuration = getBufferPeriodDuration();

  const abiEncodedConstructorArguments = getAbiEncodedConstructorArguments(LiquidityBootstrappingPool, [
    vaultAddress,
    name,
    symbol,
    tokens,
    weights,
    swapFeePercentage,
    pauseWindowDuration - 3,
    bufferPeriodDuration,
    owner,
    swapEnabledOnStart,
  ]);

  await verifyPool({
    contractName: 'LiquidityBootstrappingPool',
    poolAddress,
    abiEncodedConstructorArguments,
    buildInfo: LiquidityBootstrappingPoolFactoryBuildInfo as BuildInfo,
    etherscanApiKey,
  });
}
