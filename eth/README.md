# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```

## Deploy ignition

```bash
    npx hardhat ignition deploy .\ignition\modules\ETbetToken.ts --network localhost
```

## Get a list of all the deployment IDs that exist in the current project

```bash
npx hardhat ignition deployments
```

## Check on the current status of a deployment

```bash
    npx hardhat ignition status DeploymentId
```

### Delete or wipe previous execution

```bash
    npx hardhat ignition wipe deploymentId futureId
```

### Verify smart contract

```bash
    npx hardhat verify --network amoy 0xba0f945493eb503233411e2383b3b45cb9af7cd7 "Polygon Tbet Token" "PTBET" 200000000
```

Example:
<https://sepolia.etherscan.io/address/0xF565D310818dD8Ae9854c1B9e881Fe55704795fF#code>
