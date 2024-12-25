import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const etherscanApi = process.env.ETHERSCAN_API_KEY;
const secretKey = process.env.PRIVATE_KEY || "";
const coinmarketcapKey = process.env.COINMARKETCAP_API_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "localhost",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      chainId: 11155111,
      accounts: [secretKey],
      url: "https://rpc.sepolia.org",
    },
    mainnet: {
      chainId: 97,
      url: "https://ethereum-rpc.publicnode.com",
      accounts: [secretKey],
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    coinmarketcap: coinmarketcapKey,
  },
  etherscan: {
    apiKey: etherscanApi,
  },
};

export default config;
