require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../.env" });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545",
      chainId: 1337
      // If we need to specify accounts, we can do so, but hardhat localhost naturally uses the node's accounts
    }
  }
};
