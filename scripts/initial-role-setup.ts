import { ethers } from 'hardhat';
import { actionId } from '../pvt/helpers/src/models/misc/actions';
import * as assert from 'assert';

const authorizerAddress = '0x4D5c7c795c6319399cABa2B726E3b6bC12DdFF69';
const protocolFeeCollectorAddress = '0x7d27Ce4fDA56F9a417D62796734eB7e156810179';
const vaultAddress = '0x3B95f3278F8783b3ECf59a96f94B5184EBE766f7';

const initialAdminAddress = '0xD0DF68f0149C3e662Df772CF40cB63070591AD36';
const withdrawalAdminAddress = '0xD0DF68f0149C3e662Df772CF40cB63070591AD36';

type RoleAction = 'grant' | 'revoke';

type BaseRoleConfig = {
  adminAddress: string;
};

const vaultAbi = [
  {
      "inputs": [
          {
              "internalType": "contract IAuthorizer",
              "name": "authorizer",
              "type": "address"
          },
          {
              "internalType": "contract IWETH",
              "name": "weth",
              "type": "address"
          },
          {
              "internalType": "uint256",
              "name": "pauseWindowDuration",
              "type": "uint256"
          },
          {
              "internalType": "uint256",
              "name": "bufferPeriodDuration",
              "type": "uint256"
          }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "contract IAuthorizer",
              "name": "newAuthorizer",
              "type": "address"
          }
      ],
      "name": "AuthorizerChanged",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "contract IERC20",
              "name": "token",
              "type": "address"
          },
          {
              "indexed": true,
              "internalType": "address",
              "name": "sender",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "address",
              "name": "recipient",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
          }
      ],
      "name": "ExternalBalanceTransfer",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "contract IFlashLoanRecipient",
              "name": "recipient",
              "type": "address"
          },
          {
              "indexed": true,
              "internalType": "contract IERC20",
              "name": "token",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "feeAmount",
              "type": "uint256"
          }
      ],
      "name": "FlashLoan",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "address",
              "name": "user",
              "type": "address"
          },
          {
              "indexed": true,
              "internalType": "contract IERC20",
              "name": "token",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "int256",
              "name": "delta",
              "type": "int256"
          }
      ],
      "name": "InternalBalanceChanged",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "bool",
              "name": "paused",
              "type": "bool"
          }
      ],
      "name": "PausedStateChanged",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "bytes32",
              "name": "poolId",
              "type": "bytes32"
          },
          {
              "indexed": true,
              "internalType": "address",
              "name": "liquidityProvider",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "contract IERC20[]",
              "name": "tokens",
              "type": "address[]"
          },
          {
              "indexed": false,
              "internalType": "int256[]",
              "name": "deltas",
              "type": "int256[]"
          },
          {
              "indexed": false,
              "internalType": "uint256[]",
              "name": "protocolFeeAmounts",
              "type": "uint256[]"
          }
      ],
      "name": "PoolBalanceChanged",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "bytes32",
              "name": "poolId",
              "type": "bytes32"
          },
          {
              "indexed": true,
              "internalType": "address",
              "name": "assetManager",
              "type": "address"
          },
          {
              "indexed": true,
              "internalType": "contract IERC20",
              "name": "token",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "int256",
              "name": "cashDelta",
              "type": "int256"
          },
          {
              "indexed": false,
              "internalType": "int256",
              "name": "managedDelta",
              "type": "int256"
          }
      ],
      "name": "PoolBalanceManaged",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "bytes32",
              "name": "poolId",
              "type": "bytes32"
          },
          {
              "indexed": true,
              "internalType": "address",
              "name": "poolAddress",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "enum IVault.PoolSpecialization",
              "name": "specialization",
              "type": "uint8"
          }
      ],
      "name": "PoolRegistered",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "address",
              "name": "relayer",
              "type": "address"
          },
          {
              "indexed": true,
              "internalType": "address",
              "name": "sender",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "bool",
              "name": "approved",
              "type": "bool"
          }
      ],
      "name": "RelayerApprovalChanged",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "bytes32",
              "name": "poolId",
              "type": "bytes32"
          },
          {
              "indexed": true,
              "internalType": "contract IERC20",
              "name": "tokenIn",
              "type": "address"
          },
          {
              "indexed": true,
              "internalType": "contract IERC20",
              "name": "tokenOut",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "amountIn",
              "type": "uint256"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "amountOut",
              "type": "uint256"
          }
      ],
      "name": "Swap",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "bytes32",
              "name": "poolId",
              "type": "bytes32"
          },
          {
              "indexed": false,
              "internalType": "contract IERC20[]",
              "name": "tokens",
              "type": "address[]"
          }
      ],
      "name": "TokensDeregistered",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "bytes32",
              "name": "poolId",
              "type": "bytes32"
          },
          {
              "indexed": false,
              "internalType": "contract IERC20[]",
              "name": "tokens",
              "type": "address[]"
          },
          {
              "indexed": false,
              "internalType": "address[]",
              "name": "assetManagers",
              "type": "address[]"
          }
      ],
      "name": "TokensRegistered",
      "type": "event"
  },
  {
      "inputs": [],
      "name": "WETH",
      "outputs": [
          {
              "internalType": "contract IWETH",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "enum IVault.SwapKind",
              "name": "kind",
              "type": "uint8"
          },
          {
              "components": [
                  {
                      "internalType": "bytes32",
                      "name": "poolId",
                      "type": "bytes32"
                  },
                  {
                      "internalType": "uint256",
                      "name": "assetInIndex",
                      "type": "uint256"
                  },
                  {
                      "internalType": "uint256",
                      "name": "assetOutIndex",
                      "type": "uint256"
                  },
                  {
                      "internalType": "uint256",
                      "name": "amount",
                      "type": "uint256"
                  },
                  {
                      "internalType": "bytes",
                      "name": "userData",
                      "type": "bytes"
                  }
              ],
              "internalType": "struct IVault.BatchSwapStep[]",
              "name": "swaps",
              "type": "tuple[]"
          },
          {
              "internalType": "contract IAsset[]",
              "name": "assets",
              "type": "address[]"
          },
          {
              "components": [
                  {
                      "internalType": "address",
                      "name": "sender",
                      "type": "address"
                  },
                  {
                      "internalType": "bool",
                      "name": "fromInternalBalance",
                      "type": "bool"
                  },
                  {
                      "internalType": "address payable",
                      "name": "recipient",
                      "type": "address"
                  },
                  {
                      "internalType": "bool",
                      "name": "toInternalBalance",
                      "type": "bool"
                  }
              ],
              "internalType": "struct IVault.FundManagement",
              "name": "funds",
              "type": "tuple"
          },
          {
              "internalType": "int256[]",
              "name": "limits",
              "type": "int256[]"
          },
          {
              "internalType": "uint256",
              "name": "deadline",
              "type": "uint256"
          }
      ],
      "name": "batchSwap",
      "outputs": [
          {
              "internalType": "int256[]",
              "name": "assetDeltas",
              "type": "int256[]"
          }
      ],
      "stateMutability": "payable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bytes32",
              "name": "poolId",
              "type": "bytes32"
          },
          {
              "internalType": "contract IERC20[]",
              "name": "tokens",
              "type": "address[]"
          }
      ],
      "name": "deregisterTokens",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bytes32",
              "name": "poolId",
              "type": "bytes32"
          },
          {
              "internalType": "address",
              "name": "sender",
              "type": "address"
          },
          {
              "internalType": "address payable",
              "name": "recipient",
              "type": "address"
          },
          {
              "components": [
                  {
                      "internalType": "contract IAsset[]",
                      "name": "assets",
                      "type": "address[]"
                  },
                  {
                      "internalType": "uint256[]",
                      "name": "minAmountsOut",
                      "type": "uint256[]"
                  },
                  {
                      "internalType": "bytes",
                      "name": "userData",
                      "type": "bytes"
                  },
                  {
                      "internalType": "bool",
                      "name": "toInternalBalance",
                      "type": "bool"
                  }
              ],
              "internalType": "struct IVault.ExitPoolRequest",
              "name": "request",
              "type": "tuple"
          }
      ],
      "name": "exitPool",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "contract IFlashLoanRecipient",
              "name": "recipient",
              "type": "address"
          },
          {
              "internalType": "contract IERC20[]",
              "name": "tokens",
              "type": "address[]"
          },
          {
              "internalType": "uint256[]",
              "name": "amounts",
              "type": "uint256[]"
          },
          {
              "internalType": "bytes",
              "name": "userData",
              "type": "bytes"
          }
      ],
      "name": "flashLoan",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bytes4",
              "name": "selector",
              "type": "bytes4"
          }
      ],
      "name": "getActionId",
      "outputs": [
          {
              "internalType": "bytes32",
              "name": "",
              "type": "bytes32"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "getAuthorizer",
      "outputs": [
          {
              "internalType": "contract IAuthorizer",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "getDomainSeparator",
      "outputs": [
          {
              "internalType": "bytes32",
              "name": "",
              "type": "bytes32"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "user",
              "type": "address"
          },
          {
              "internalType": "contract IERC20[]",
              "name": "tokens",
              "type": "address[]"
          }
      ],
      "name": "getInternalBalance",
      "outputs": [
          {
              "internalType": "uint256[]",
              "name": "balances",
              "type": "uint256[]"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "user",
              "type": "address"
          }
      ],
      "name": "getNextNonce",
      "outputs": [
          {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "getPausedState",
      "outputs": [
          {
              "internalType": "bool",
              "name": "paused",
              "type": "bool"
          },
          {
              "internalType": "uint256",
              "name": "pauseWindowEndTime",
              "type": "uint256"
          },
          {
              "internalType": "uint256",
              "name": "bufferPeriodEndTime",
              "type": "uint256"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bytes32",
              "name": "poolId",
              "type": "bytes32"
          }
      ],
      "name": "getPool",
      "outputs": [
          {
              "internalType": "address",
              "name": "",
              "type": "address"
          },
          {
              "internalType": "enum IVault.PoolSpecialization",
              "name": "",
              "type": "uint8"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bytes32",
              "name": "poolId",
              "type": "bytes32"
          },
          {
              "internalType": "contract IERC20",
              "name": "token",
              "type": "address"
          }
      ],
      "name": "getPoolTokenInfo",
      "outputs": [
          {
              "internalType": "uint256",
              "name": "cash",
              "type": "uint256"
          },
          {
              "internalType": "uint256",
              "name": "managed",
              "type": "uint256"
          },
          {
              "internalType": "uint256",
              "name": "lastChangeBlock",
              "type": "uint256"
          },
          {
              "internalType": "address",
              "name": "assetManager",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bytes32",
              "name": "poolId",
              "type": "bytes32"
          }
      ],
      "name": "getPoolTokens",
      "outputs": [
          {
              "internalType": "contract IERC20[]",
              "name": "tokens",
              "type": "address[]"
          },
          {
              "internalType": "uint256[]",
              "name": "balances",
              "type": "uint256[]"
          },
          {
              "internalType": "uint256",
              "name": "lastChangeBlock",
              "type": "uint256"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "getProtocolFeesCollector",
      "outputs": [
          {
              "internalType": "contract ProtocolFeesCollector",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "user",
              "type": "address"
          },
          {
              "internalType": "address",
              "name": "relayer",
              "type": "address"
          }
      ],
      "name": "hasApprovedRelayer",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bytes32",
              "name": "poolId",
              "type": "bytes32"
          },
          {
              "internalType": "address",
              "name": "sender",
              "type": "address"
          },
          {
              "internalType": "address",
              "name": "recipient",
              "type": "address"
          },
          {
              "components": [
                  {
                      "internalType": "contract IAsset[]",
                      "name": "assets",
                      "type": "address[]"
                  },
                  {
                      "internalType": "uint256[]",
                      "name": "maxAmountsIn",
                      "type": "uint256[]"
                  },
                  {
                      "internalType": "bytes",
                      "name": "userData",
                      "type": "bytes"
                  },
                  {
                      "internalType": "bool",
                      "name": "fromInternalBalance",
                      "type": "bool"
                  }
              ],
              "internalType": "struct IVault.JoinPoolRequest",
              "name": "request",
              "type": "tuple"
          }
      ],
      "name": "joinPool",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "components": [
                  {
                      "internalType": "enum IVault.PoolBalanceOpKind",
                      "name": "kind",
                      "type": "uint8"
                  },
                  {
                      "internalType": "bytes32",
                      "name": "poolId",
                      "type": "bytes32"
                  },
                  {
                      "internalType": "contract IERC20",
                      "name": "token",
                      "type": "address"
                  },
                  {
                      "internalType": "uint256",
                      "name": "amount",
                      "type": "uint256"
                  }
              ],
              "internalType": "struct IVault.PoolBalanceOp[]",
              "name": "ops",
              "type": "tuple[]"
          }
      ],
      "name": "managePoolBalance",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "components": [
                  {
                      "internalType": "enum IVault.UserBalanceOpKind",
                      "name": "kind",
                      "type": "uint8"
                  },
                  {
                      "internalType": "contract IAsset",
                      "name": "asset",
                      "type": "address"
                  },
                  {
                      "internalType": "uint256",
                      "name": "amount",
                      "type": "uint256"
                  },
                  {
                      "internalType": "address",
                      "name": "sender",
                      "type": "address"
                  },
                  {
                      "internalType": "address payable",
                      "name": "recipient",
                      "type": "address"
                  }
              ],
              "internalType": "struct IVault.UserBalanceOp[]",
              "name": "ops",
              "type": "tuple[]"
          }
      ],
      "name": "manageUserBalance",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "enum IVault.SwapKind",
              "name": "kind",
              "type": "uint8"
          },
          {
              "components": [
                  {
                      "internalType": "bytes32",
                      "name": "poolId",
                      "type": "bytes32"
                  },
                  {
                      "internalType": "uint256",
                      "name": "assetInIndex",
                      "type": "uint256"
                  },
                  {
                      "internalType": "uint256",
                      "name": "assetOutIndex",
                      "type": "uint256"
                  },
                  {
                      "internalType": "uint256",
                      "name": "amount",
                      "type": "uint256"
                  },
                  {
                      "internalType": "bytes",
                      "name": "userData",
                      "type": "bytes"
                  }
              ],
              "internalType": "struct IVault.BatchSwapStep[]",
              "name": "swaps",
              "type": "tuple[]"
          },
          {
              "internalType": "contract IAsset[]",
              "name": "assets",
              "type": "address[]"
          },
          {
              "components": [
                  {
                      "internalType": "address",
                      "name": "sender",
                      "type": "address"
                  },
                  {
                      "internalType": "bool",
                      "name": "fromInternalBalance",
                      "type": "bool"
                  },
                  {
                      "internalType": "address payable",
                      "name": "recipient",
                      "type": "address"
                  },
                  {
                      "internalType": "bool",
                      "name": "toInternalBalance",
                      "type": "bool"
                  }
              ],
              "internalType": "struct IVault.FundManagement",
              "name": "funds",
              "type": "tuple"
          }
      ],
      "name": "queryBatchSwap",
      "outputs": [
          {
              "internalType": "int256[]",
              "name": "",
              "type": "int256[]"
          }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "enum IVault.PoolSpecialization",
              "name": "specialization",
              "type": "uint8"
          }
      ],
      "name": "registerPool",
      "outputs": [
          {
              "internalType": "bytes32",
              "name": "",
              "type": "bytes32"
          }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bytes32",
              "name": "poolId",
              "type": "bytes32"
          },
          {
              "internalType": "contract IERC20[]",
              "name": "tokens",
              "type": "address[]"
          },
          {
              "internalType": "address[]",
              "name": "assetManagers",
              "type": "address[]"
          }
      ],
      "name": "registerTokens",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "contract IAuthorizer",
              "name": "newAuthorizer",
              "type": "address"
          }
      ],
      "name": "setAuthorizer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bool",
              "name": "paused",
              "type": "bool"
          }
      ],
      "name": "setPaused",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "sender",
              "type": "address"
          },
          {
              "internalType": "address",
              "name": "relayer",
              "type": "address"
          },
          {
              "internalType": "bool",
              "name": "approved",
              "type": "bool"
          }
      ],
      "name": "setRelayerApproval",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "components": [
                  {
                      "internalType": "bytes32",
                      "name": "poolId",
                      "type": "bytes32"
                  },
                  {
                      "internalType": "enum IVault.SwapKind",
                      "name": "kind",
                      "type": "uint8"
                  },
                  {
                      "internalType": "contract IAsset",
                      "name": "assetIn",
                      "type": "address"
                  },
                  {
                      "internalType": "contract IAsset",
                      "name": "assetOut",
                      "type": "address"
                  },
                  {
                      "internalType": "uint256",
                      "name": "amount",
                      "type": "uint256"
                  },
                  {
                      "internalType": "bytes",
                      "name": "userData",
                      "type": "bytes"
                  }
              ],
              "internalType": "struct IVault.SingleSwap",
              "name": "singleSwap",
              "type": "tuple"
          },
          {
              "components": [
                  {
                      "internalType": "address",
                      "name": "sender",
                      "type": "address"
                  },
                  {
                      "internalType": "bool",
                      "name": "fromInternalBalance",
                      "type": "bool"
                  },
                  {
                      "internalType": "address payable",
                      "name": "recipient",
                      "type": "address"
                  },
                  {
                      "internalType": "bool",
                      "name": "toInternalBalance",
                      "type": "bool"
                  }
              ],
              "internalType": "struct IVault.FundManagement",
              "name": "funds",
              "type": "tuple"
          },
          {
              "internalType": "uint256",
              "name": "limit",
              "type": "uint256"
          },
          {
              "internalType": "uint256",
              "name": "deadline",
              "type": "uint256"
          }
      ],
      "name": "swap",
      "outputs": [
          {
              "internalType": "uint256",
              "name": "amountCalculated",
              "type": "uint256"
          }
      ],
      "stateMutability": "payable",
      "type": "function"
  },
  {
      "stateMutability": "payable",
      "type": "receive"
  }
]

const authorizedAbi = [
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "admin",
              "type": "address"
          }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "bytes32",
              "name": "role",
              "type": "bytes32"
          },
          {
              "indexed": true,
              "internalType": "bytes32",
              "name": "previousAdminRole",
              "type": "bytes32"
          },
          {
              "indexed": true,
              "internalType": "bytes32",
              "name": "newAdminRole",
              "type": "bytes32"
          }
      ],
      "name": "RoleAdminChanged",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "bytes32",
              "name": "role",
              "type": "bytes32"
          },
          {
              "indexed": true,
              "internalType": "address",
              "name": "account",
              "type": "address"
          },
          {
              "indexed": true,
              "internalType": "address",
              "name": "sender",
              "type": "address"
          }
      ],
      "name": "RoleGranted",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "bytes32",
              "name": "role",
              "type": "bytes32"
          },
          {
              "indexed": true,
              "internalType": "address",
              "name": "account",
              "type": "address"
          },
          {
              "indexed": true,
              "internalType": "address",
              "name": "sender",
              "type": "address"
          }
      ],
      "name": "RoleRevoked",
      "type": "event"
  },
  {
      "inputs": [],
      "name": "DEFAULT_ADMIN_ROLE",
      "outputs": [
          {
              "internalType": "bytes32",
              "name": "",
              "type": "bytes32"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bytes32",
              "name": "actionId",
              "type": "bytes32"
          },
          {
              "internalType": "address",
              "name": "account",
              "type": "address"
          },
          {
              "internalType": "address",
              "name": "",
              "type": "address"
          }
      ],
      "name": "canPerform",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bytes32",
              "name": "role",
              "type": "bytes32"
          }
      ],
      "name": "getRoleAdmin",
      "outputs": [
          {
              "internalType": "bytes32",
              "name": "",
              "type": "bytes32"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bytes32",
              "name": "role",
              "type": "bytes32"
          },
          {
              "internalType": "uint256",
              "name": "index",
              "type": "uint256"
          }
      ],
      "name": "getRoleMember",
      "outputs": [
          {
              "internalType": "address",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bytes32",
              "name": "role",
              "type": "bytes32"
          }
      ],
      "name": "getRoleMemberCount",
      "outputs": [
          {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bytes32",
              "name": "role",
              "type": "bytes32"
          },
          {
              "internalType": "address",
              "name": "account",
              "type": "address"
          }
      ],
      "name": "grantRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bytes32[]",
              "name": "roles",
              "type": "bytes32[]"
          },
          {
              "internalType": "address",
              "name": "account",
              "type": "address"
          }
      ],
      "name": "grantRoles",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bytes32[]",
              "name": "roles",
              "type": "bytes32[]"
          },
          {
              "internalType": "address[]",
              "name": "accounts",
              "type": "address[]"
          }
      ],
      "name": "grantRolesToMany",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bytes32",
              "name": "role",
              "type": "bytes32"
          },
          {
              "internalType": "address",
              "name": "account",
              "type": "address"
          }
      ],
      "name": "hasRole",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bytes32",
              "name": "role",
              "type": "bytes32"
          },
          {
              "internalType": "address",
              "name": "account",
              "type": "address"
          }
      ],
      "name": "renounceRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bytes32",
              "name": "role",
              "type": "bytes32"
          },
          {
              "internalType": "address",
              "name": "account",
              "type": "address"
          }
      ],
      "name": "revokeRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bytes32[]",
              "name": "roles",
              "type": "bytes32[]"
          },
          {
              "internalType": "address",
              "name": "account",
              "type": "address"
          }
      ],
      "name": "revokeRoles",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bytes32[]",
              "name": "roles",
              "type": "bytes32[]"
          },
          {
              "internalType": "address[]",
              "name": "accounts",
              "type": "address[]"
          }
      ],
      "name": "revokeRolesFromMany",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  }
]

const protoFeesAbi = [
  {
    "inputs": [
      {
        "internalType": "contract IVault",
        "name": "_vault",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newFlashLoanFeePercentage",
        "type": "uint256"
      }
    ],
    "name": "FlashLoanFeePercentageChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newSwapFeePercentage",
        "type": "uint256"
      }
    ],
    "name": "SwapFeePercentageChanged",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "selector",
        "type": "bytes4"
      }
    ],
    "name": "getActionId",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAuthorizer",
    "outputs": [
      {
        "internalType": "contract IAuthorizer",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract IERC20[]",
        "name": "tokens",
        "type": "address[]"
      }
    ],
    "name": "getCollectedFeeAmounts",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "feeAmounts",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getFlashLoanFeePercentage",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getSwapFeePercentage",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newFlashLoanFeePercentage",
        "type": "uint256"
      }
    ],
    "name": "setFlashLoanFeePercentage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newSwapFeePercentage",
        "type": "uint256"
      }
    ],
    "name": "setSwapFeePercentage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "vault",
    "outputs": [
      {
        "internalType": "contract IVault",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract IERC20[]",
        "name": "tokens",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      },
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      }
    ],
    "name": "withdrawCollectedFees",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

async function setManagementRoles(adminAddress: string, action: RoleAction) {
  const authorizer = await ethers.getContractAt(authorizedAbi, authorizerAddress);
  const feesCollector = await ethers.getContractAt(protoFeesAbi, protocolFeeCollectorAddress);
  const vault = await ethers.getContractAt(vaultAbi, vaultAddress);

  const roles = [
    await actionId(feesCollector, 'setFlashLoanFeePercentage'),
    await actionId(feesCollector, 'setSwapFeePercentage '),
    await actionId(feesCollector, 'setSwapFeePercentage '),
    await actionId(vault, 'setPaused'),
  ];
  let tx;
  if (action === 'grant') {
    tx = await authorizer.grantRoles(roles, adminAddress);
  } else {
    tx = await authorizer.revokeRoles(roles, adminAddress);
  }
  const receipt = await tx.wait();
  console.log(`${action} management roles : `, receipt);
}

async function setFeeWithdrawalRole(adminAddress: string, action: RoleAction) {
  const authorizer = await ethers.getContractAt(authorizedAbi, authorizerAddress);
  const feesCollector = await ethers.getContractAt(protoFeesAbi, protocolFeeCollectorAddress);
  const roles = [await actionId(feesCollector, 'withdrawCollectedFees')];
  let tx;
  if (action === 'grant') {
    tx = await authorizer.grantRoles(roles, adminAddress);
  } else {
    tx = await authorizer.revokeRoles(roles, adminAddress);
  }
  const receipt = await tx.wait();
  console.log(`${action} fee withdrawal role : `, receipt);
}

type PausableRoleConfig = {
  adminAddress: string;
  pausableContract: string;
  pausableContractAddress: string;
};

async function setPausableRole(config: PausableRoleConfig, action: RoleAction) {
  const authorizer = await ethers.getContractAt(authorizedAbi, authorizerAddress);
  const pausableContract = await ethers.getContractAt(config.pausableContract, config.pausableContractAddress);

  const roles = [await actionId(pausableContract, 'setPaused')];
  let tx;
  if (action === 'grant') {
    tx = await authorizer.grantRoles(roles, config.adminAddress);
  } else {
    tx = await authorizer.revokeRoles(roles, config.adminAddress);
  }
  const receipt = await tx.wait();
  console.log(`${action} pausable role : `, receipt);
}

async function setDefaultAdminRole(adminAddress: string, action: RoleAction) {
  const authorizer = await ethers.getContractAt(authorizedAbi, authorizerAddress);

  const roles = [await authorizer.DEFAULT_ADMIN_ROLE()];
  let tx;
  if (action === 'grant') {
    tx = await authorizer.grantRoles(roles, adminAddress);
  } else {
    tx = await authorizer.revokeRoles(roles, adminAddress);
  }

  const receipt = await tx.wait();
  console.log(`${action} default admin role: `, receipt);
}

/*
    scripts to run after deployment
 */

async function initialRoleSetup() {
  console.log(`Granting management roles to initial admin ${initialAdminAddress}`);
  await setManagementRoles(initialAdminAddress, 'grant');
  console.log('------------------- done ----------------------\n\n');
  console.log(`Granting fee withdrawal role to ${withdrawalAdminAddress}`);
  await setFeeWithdrawalRole(withdrawalAdminAddress, 'grant');
  console.log('------------------- done ----------------------');
}

async function revokeManagementRolesFromInitialAdmin() {
  console.log(`Revoking management roles from initial admin ${initialAdminAddress}`);
  await setManagementRoles(initialAdminAddress, 'revoke');
  console.log('------------------- done ----------------------\n\n');
}


initialRoleSetup()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .then(() => revokeManagementRolesFromInitialAdmin())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
// .then(() => dangerously__revokeDefaultAdminRoleFromInitialAdmin())
// .catch((error) => {
//   console.error(error);
//   process.exit(1);
// });

