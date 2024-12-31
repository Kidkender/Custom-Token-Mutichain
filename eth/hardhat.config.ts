import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

const etherscanKey = process.env.ETHERSCAN_API_KEY || "";
const polygonScanKey = process.env.POLYGON_API_KEY || "";

const secretKey = process.env.PRIVATE_KEY || "";
const coinmarketcapKey = process.env.COINMARKETCAP_API_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.25",
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
      url: "https://1rpc.io/sepolia",
    },
    mainnet: {
      chainId: 97,
      url: "https://ethereum-rpc.publicnode.com",
      accounts: [secretKey],
    },
    amoy: {
      chainId: 80002,
      url: "https://rpc-amoy.polygon.technology",
      accounts: [secretKey],
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    coinmarketcap: coinmarketcapKey,
  },
  etherscan: {
    apiKey: {
      sepolia: etherscanKey,
      amoy: polygonScanKey,
    },
    customChains: [
      {
        network: "amoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com/",
        },
      },
    ],
  },
};

export default config;
