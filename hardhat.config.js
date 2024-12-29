require("@nomicfoundation/hardhat-toolbox")
require("@nomicfoundation/hardhat-ethers")
require("@chainlink/hardhat-chainlink")
require("hardhat-deploy")
require("dotenv").config()
const PRIVATE_KEY = process.env.PRIVATE_KEY
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const COINCAP_API_KEY = process.env.COINCAP_API_KEY

module.exports = {
    //solidity: "0.8.28",
    solidity: {
        compilers: [
            { version: "0.8.26" },
            { version: "0.8.28" },
            { version: "0.6.0" },
            { version: "0.6.6" },
        ],
    },
    defaultNetwork: "hardhat",
    networks: {
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
            blockConfirmations: 6,
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 31337,
        },
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: true,
        outputFile: "gas-report.txt",
        L1Etherscan: ETHERSCAN_API_KEY,
        noColors: true,
        currency: "USD",
        token: "MATIC",
        coinmarketcap: COINCAP_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        users: {
            default: 1,
        },
    },
}
