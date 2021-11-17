import { ethers } from 'hardhat';
import WeightedPoolFactory from '@balancer-labs/v2-deployments/tasks/20210418-weighted-pool/abi/WeightedPoolFactory.json';
import WeightedPoolFactoryBuildInfo from '@balancer-labs/v2-deployments/tasks/20210418-weighted-pool/build-info/WeightedPoolFactory.json';
import { ZERO_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';
import WeightedPool from '@balancer-labs/v2-deployments/tasks/20210418-weighted-pool/abi/WeightedPool.json';
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

interface CreateWeightedPoolParams {
  name: string;
  symbol: string;
  tokens: string[];
  weights: BigNumber[];
  initialBalances: BigNumber[];
  swapFeePercentage: BigNumber;
  owner?: string;
  etherscanApiKey: string;
}

export async function createWeightedPool(params: CreateWeightedPoolParams): Promise<void> {
  const { name, symbol, tokens, weights, swapFeePercentage, owner, initialBalances } = params;
  const weightedPoolFactoryAddress = getTaskOutputFile('20210418-weighted-pool').WeightedPoolFactory;
  const vaultAddress = await getVaultAddress();
  const vault = await ethers.getContractAt(Vault, vaultAddress);
  const factory = await ethers.getContractAt(WeightedPoolFactory, weightedPoolFactoryAddress);

  if (!hasPoolBeenDeployed(symbol)) {
    logger.info('Calling create on the WeightedPoolFactory...');
    const tx = await factory.create(name, symbol, tokens, weights, swapFeePercentage, owner || ZERO_ADDRESS);
    const { poolAddress, blockHash } = await getPoolAddressAndBlockHashFromTransaction(tx);
    const pool = await ethers.getContractAt(WeightedPool, poolAddress);
    const poolId = await pool.getPoolId();

    logger.success(`Successfully deployed the WeightedPool at address ${poolAddress} with id ${poolId}`);
    logger.info(`Pool deployment block hash: ${blockHash}`);

    savePoolDeployment(symbol, poolAddress, poolId, blockHash, { ...params });
  }

  const poolData = getDeployedPoolData(symbol);

  if (poolData && !hasPoolBeenVerified(symbol)) {
    await verifyWeightedPool({
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

async function verifyWeightedPool({
  name,
  symbol,
  tokens,
  weights,
  swapFeePercentage,
  owner,
  poolAddress,
  blockHash,
  etherscanApiKey,
}: CreateWeightedPoolParams & { poolAddress: string; blockHash: string }) {
  const vaultAddress = getVaultAddress();
  const pool = await ethers.getContractAt(WeightedPool, poolAddress);
  const pauseWindowDuration = await getPauseWindowDurationForPool(pool, blockHash);
  const bufferPeriodDuration = getBufferPeriodDuration();

  const abiEncodedConstructorArguments = getAbiEncodedConstructorArguments(WeightedPool, [
    vaultAddress,
    name,
    symbol,
    tokens,
    weights,
    swapFeePercentage,
    pauseWindowDuration - 3,
    bufferPeriodDuration,
    owner || ZERO_ADDRESS,
  ]);

  await verifyPool({
    contractName: 'WeightedPool',
    poolAddress,
    abiEncodedConstructorArguments,
    buildInfo: WeightedPoolFactoryBuildInfo as BuildInfo,
    etherscanApiKey,
  });
}
