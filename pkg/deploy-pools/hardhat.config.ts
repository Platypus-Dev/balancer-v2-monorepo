import dotenv from 'dotenv';
import '@nomiclabs/hardhat-ethers';
import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Logger } from '@balancer-labs/v2-deployments/src/logger';
import fs from 'fs';
import path from 'path';

dotenv.config();

task('deploy', 'Run deployment task')
  .addParam('key', 'Etherscan API key to verify contracts')
  .setAction(async (args: { id: string; key: string }, hre: HardhatRuntimeEnvironment) => {
    Logger.setDefaults(false, true);
    const migrationsPath = path.resolve(__dirname, `./deployments/${hre.network.name}/migrations`);

    if (!fs.existsSync(migrationsPath)) {
      throw new Error(
        `There are no migrations for your chosen network: ${hre.network.name}. Please create your migrations in ./deployments/${hre.network.name}/migrations and rerun the deploy task.`
      );
    }

    //fetch all files in the migrations directory for the specified network
    const migrationFiles = fs.readdirSync(migrationsPath);

    for (const migrationFile of migrationFiles) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const migration = require(path.resolve(migrationsPath, migrationFile)).default;
      await migration(args.key);
    }
  });

const DEPLOYER_PRIVATE_KEY =
  process.env.DEPLOYER_PRIVATE_KEY || '0000000000000000000000000000000000000000000000000000000000000000';
const INFURA_KEY = process.env.INFURA_KEY || '';

export default {
  networks: {
    opera: {
      chainId: 250,
      url: `https://rpc.ftm.tools/`,
      accounts: [`0x${DEPLOYER_PRIVATE_KEY}`], // Using private key instead of mnemonic for vanity deploy
      saveDeployments: true,
    },
    rinkeby: {
      chainId: 4,
      url: `https://rinkeby.infura.io/v3/${INFURA_KEY}`,
      accounts: [`0x${DEPLOYER_PRIVATE_KEY}`], // Using private key instead of mnemonic for vanity deploy
      saveDeployments: true,
      gasMultiplier: 10,
    },
    fuji: {
      chainId: 43113,
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: [`0x${DEPLOYER_PRIVATE_KEY}`], // Using private key instead of mnemonic for vanity deploy
      saveDeployments: true,
      gas: 4221000,
      gasPrice: 225000000000,
      gasMultiplier: 2,
    },
  },
};
