import { ethers, network } from 'hardhat';
import { BigNumber, Contract } from 'ethers';
import ERC20 from '../abi/ERC20.json';
import VaultInput from '@balancer-labs/v2-deployments/tasks/20210418-vault/input';
import PoolVerifier from './poolVerifier';
import { BuildInfo } from 'hardhat/types';
import { delay } from '@nomiclabs/hardhat-etherscan/dist/src/etherscan/EtherscanService';
import path from 'path';
import fs from 'fs';
import logger from '@balancer-labs/v2-deployments/src/logger';

const TASKS_DIRECTORY = path.resolve(__dirname, '../../deployments/tasks');
const OUTPUT_DIR_PATH = path.resolve(__dirname, `../deployments/${network.name}/output`);
const DEPLOYED_POOLS_FILE_PATH = path.resolve(OUTPUT_DIR_PATH, 'DeployedPools.json');
const RETRY_COUNT = 15;

export async function joinPool({
  vault,
  poolId,
  tokens,
  initialBalances,
}: {
  vault: Contract;
  poolId: string;
  tokens: string[];
  initialBalances: BigNumber[];
}): Promise<void> {
  const JOIN_KIND_INIT = 0;
  // Construct magic userData
  const [deployer] = await ethers.getSigners();
  const initUserData = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256[]'], [JOIN_KIND_INIT, initialBalances]);
  const joinPoolRequest = {
    assets: tokens,
    maxAmountsIn: initialBalances,
    userData: initUserData,
    fromInternalBalance: false,
  };

  logger.info(`Approving tokens...`);
  for (let i = 0; i < tokens.length; i++) {
    const token = await ethers.getContractAt(ERC20, tokens[i]);
    logger.info(`approving ${tokens[i]} ${initialBalances[i].toString()}`);

    await token.approve(vault.address, initialBalances[i]);
  }

  for (let i = 0; i < RETRY_COUNT; i++) {
    logger.info(
      `Joining the pool. We retry a few times in case the approvals haven't been recognized yet. Attempt #${i + 1}...`
    );
    await delay(2500);
    try {
      // joins and exits are done on the Vault, not the pool
      const tx2 = await vault.joinPool(poolId, deployer.address, deployer.address, joinPoolRequest);
      // You can wait for it like this, or just print the tx hash and monitor
      await tx2.wait();
      break;
    } catch (e) {
      console.log(e);
      if (i === RETRY_COUNT - 1) {
        //we've exhausted our retries, give up
        throw e;
      }
    }
  }

  logger.success('Successfully added initial liquidity to the pool');
}

export async function getPoolAddressAndBlockHashFromTransaction(
  // eslint-disable-next-line
  tx: any
): Promise<{ poolAddress: string; blockHash: string }> {
  const receipt = await tx.wait();
  const events = receipt.events.filter((e: { event: string }) => e.event === 'PoolCreated');

  return { poolAddress: events[0].args.pool, blockHash: receipt.blockHash };
}

export async function getBlockTimestamp(blockHash: string): Promise<number> {
  const block = await network.provider.send('eth_getBlockByHash', [blockHash, true]);

  return BigNumber.from(block.timestamp).toNumber();
}

export function getAbiEncodedConstructorArguments(
  abi: { type: string; inputs: { name: string; type: string }[] }[],
  values: unknown[]
): string {
  const argTypes =
    abi.find((item) => item.type === 'constructor')?.inputs.map((input) => ethers.utils.ParamType.from(input)) || [];
  //const argTypes = abi.find((item) => item.type === 'constructor')?.inputs.map((input) => input.type) || [];

  const abiCoder = new ethers.utils.AbiCoder();

  return abiCoder.encode(argTypes, values).replace('0x', '');
}

export function decodeAbieEncodedConstructorArguments(
  abi: { type: string; inputs: { name: string; type: string }[] }[],
  encodedArgs: string
) {
  //const argTypes =
  //  abi.find((item) => item.type === 'constructor')?.inputs.map((input) => ethers.utils.ParamType.from(input)) || [];
  const argTypes = abi.find((item) => item.type === 'constructor')?.inputs.map((input) => input.type) || [];

  const abiCoder = new ethers.utils.AbiCoder();
  const decoded = abiCoder.decode(argTypes, encodedArgs);

  console.log(decoded);
}

export function getBufferPeriodDuration(): number {
  const networkName = network.name as keyof typeof VaultInput;

  if (!VaultInput[networkName]) {
    throw new Error('Network does not have a defined buffer period');
  }

  return VaultInput[networkName].bufferPeriodDuration;
}

export function getTaskOutputFile(taskId: string): { [key: string]: string } {
  const filePath = path.join(TASKS_DIRECTORY, `${taskId}/output/${network.name}.json`);

  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath).toString()) : {};
}

export function getVaultAddress(): string {
  const file = getTaskOutputFile('20210418-vault');

  return file.Vault;
}

export async function getPauseWindowDurationForPool(pool: Contract, blockHash: string): Promise<number> {
  const pausedState = await pool.getPausedState();
  const pauseWindowEndTime = (pausedState.pauseWindowEndTime as BigNumber).toNumber();
  const blockTimestamp = await getBlockTimestamp(blockHash);
  const pauseWindowDuration = pauseWindowEndTime - blockTimestamp;

  return pauseWindowDuration < 0 ? 0 : pauseWindowDuration;
}

export async function verifyPool({
  contractName,
  poolAddress,
  abiEncodedConstructorArguments,
  buildInfo,
  etherscanApiKey,
}: {
  contractName: string;
  poolAddress: string;
  abiEncodedConstructorArguments: string;
  buildInfo: BuildInfo;
  etherscanApiKey: string;
}): Promise<void> {
  const verifier = new PoolVerifier(network, etherscanApiKey);

  for (let i = 0; i < RETRY_COUNT; i++) {
    logger.info(`Verifying contract. Etherscan can take some time to recognize the contract. Attempt #${i + 1}...`);
    await delay(2500);

    try {
      await verifier.call(contractName, poolAddress, abiEncodedConstructorArguments, buildInfo);

      break;
    } catch (e) {
      console.log('error', e);
      if (e.message.indexOf('Contract source code already verified') !== -1) {
        break;
      }

      if (i === RETRY_COUNT - 1) {
        //we've exhausted our retries, give up.
        throw e;
      }
    }
  }

  logger.success(`Successfully verified the ${contractName} at ${poolAddress}`);
}

export function hasPoolBeenDeployed(poolSymbol: string): boolean {
  const poolData = getDeployedPoolData(poolSymbol);

  if (poolData) {
    logger.info(`A pool has already been deployed for ${poolSymbol} at ${poolData.address}. Skipping deployment...`);
    return true;
  }

  return false;
}

export function hasPoolBeenVerified(poolSymbol: string): boolean {
  const poolData = getDeployedPoolData(poolSymbol);

  if (poolData && poolData.verified) {
    logger.info(`The pool with symbol ${poolSymbol} has already been verified. Skipping verification...`);
    return true;
  }

  return false;
}

export function hasPoolBeenInitialized(poolSymbol: string): boolean {
  const poolData = getDeployedPoolData(poolSymbol);

  if (poolData && poolData.initialized) {
    logger.info(`The pool with symbol ${poolSymbol} has already been initialized. Skipping initialization...`);
    return true;
  }

  return false;
}

export function getDeployedPoolData(
  poolSymbol: string
): { address: string; id: string; blockHash: string; verified?: boolean; initialized?: boolean } | null {
  const deployedPools = loadDeployedPools();

  return deployedPools[poolSymbol];
}

export function savePoolDeployment(
  symbol: string,
  address: string,
  id: string,
  blockHash: string,
  args: { [key: string]: unknown }
): void {
  const deployedPools = loadDeployedPools();

  deployedPools[symbol] = {
    address,
    id,
    symbol,
    blockHash,
    ...args,
    etherscanApiKey: undefined,
  };

  saveDeployedPools(deployedPools);
}

export function setDeployedPoolAsVerified(symbol: string): void {
  const deployedPools = loadDeployedPools();

  deployedPools[symbol] = {
    ...deployedPools[symbol],
    verified: true,
  };

  saveDeployedPools(deployedPools);
}

export function setDeployedPoolAsInitialized(symbol: string): void {
  const deployedPools = loadDeployedPools();

  deployedPools[symbol] = {
    ...deployedPools[symbol],
    initialized: true,
  };

  saveDeployedPools(deployedPools);
}

function loadDeployedPools() {
  if (!fs.existsSync(OUTPUT_DIR_PATH)) {
    fs.mkdirSync(OUTPUT_DIR_PATH);
  }

  return fs.existsSync(DEPLOYED_POOLS_FILE_PATH)
    ? JSON.parse(fs.readFileSync(DEPLOYED_POOLS_FILE_PATH).toString())
    : {};
}

function saveDeployedPools(deployedPools: unknown) {
  fs.writeFileSync(DEPLOYED_POOLS_FILE_PATH, JSON.stringify(deployedPools, null, 2));
}
