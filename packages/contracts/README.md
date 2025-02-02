# Countracts by Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

<https://book.getfoundry.sh/>

## Usage

### Deploy Send Merkle Drop

```shell
forge script ./packages/contracts/script/DeploySendMerkleDrop.s.sol:DeploySendMerkleDropScript \
  -vvvv \
  --rpc-url http://localhost:8545 \
  --sender 0x647eb43401e13e995d89cf26cd87e68890ee3f89 \
  --froms 0x647eb43401e13e995d89cf26cd87e68890ee3f89 \
  --keystores ~/.foundry/keystores/send_deployer
  # --broadcast --verify
```

### Verify Send Merkle Drop

> [!NOTE]
> Requires `constructor-args.txt` to be present in the current working directory. And etherscan API key to be present in the environment as `ETHERSCAN_API_KEY`.

```shell
forge verify-contract \
  --watch \
  --constructor-args-path ./constructor-args.txt \
  0xB9310daE45E71c7a160A13D64204623071a8E347 \
  ./packages/contracts/src/SendMerkleDrop.sol:SendMerkleDrop
```

### Create Send Snapshot

```shell
forge script ./packages/contracts/script/CreateSendSnapshot.s.sol:CreateSendSnapshotScript -vvvv --fork-url http://localhost:8545 --broadcast
```

### Build

```shell
forge build
```

### Test

```shell
forge test
```

### Format

```shell
forge fmt
```

### Gas Snapshots

```shell
forge snapshot
```

### Anvil

```shell
anvil
```

### Deploy

```shell
forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
cast <subcommand>
```

### Help

```shell
forge --help
anvil --help
cast --help
```

### Forking Mainnet

A demonstrative example of how to fork mainnet and deploy a contract and impersonate accounts. Note: `anvil_setBalance` on a forked mainnet anvil node will not work. A regular `eth_sendTransaction` will work.

#### Deploying SendAccountFactory

```shell
forge script ./script/DeploySendMerkleDropScript.s.sol:DeploySendMerkleDropScript \
  -vvv \
  --rpc-url base-sepolia \
  --sender 0x647eb43401e13e995D89Cf26cD87e68890EE3f89 \
  --keystores ~/.foundry/keystores/send_deployer 
  # --broadcast --verify
```

#### Deploying SendMerkleDrop

```shell
forge script ./script/DeploySendMerkleDrop.s.sol:DeploySendMerkleDropScript \ 
  -vvv \
  --rpc-url base-sepolia \
  --sender 0x647eb43401e13e995D89Cf26cD87e68890EE3f89 \
  --keystores ~/.foundry/keystores/send_deployer
```

#### Updating Token Paymaster Cached Price

```shell
PAYMASTER=0x7e84448C1c94978f480D1895E6566C31c32fb136 \
forge script ./script/UpdateTokenPaymasterCachedPrice.s.sol:UpdateTokenPaymasterCachedPriceScript \
  -vvv \
  --rpc-url base-sepolia \
  --sender 0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f \
  --keystores ~/.foundry/keystores/send_core_dev
```

#### Creating a Distribution Tranche

```shell
OPERATOR=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
SEND_TOKEN=0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A
AIRDROP_MULTISIG_SAFE=0x6204Bc0662ccd8a9A762d59fe7906733f251E3b7
SEND_AIRDROP=0xB9310daE45E71c7a160A13D64204623071a8E347
TRANCHE_MERKLE_ROOT=0x83c580aeb9546d9144688a39f479473fd7917b708b113bfbd4d62947d62cddff
TRANCHE_AMOUNT=717100769

cast send --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --unlocked $AIRDROP_MULTISIG_SAFE --value 10ether
cast rpc anvil_impersonateAccount $AIRDROP_MULTISIG_SAFE
cast send $SEND_TOKEN \
    --unlocked \
    --from $AIRDROP_MULTISIG_SAFE \
    "approve(address,uint256)" \
    $SEND_AIRDROP $TRANCHE_AMOUNT
cast send $SEND_AIRDROP \
    --unlocked \
    --from $AIRDROP_MULTISIG_SAFE \
    "addTranche(bytes32,uint256)" \
    $TRANCHE_MERKLE_ROOT $TRANCHE_AMOUNT
```
