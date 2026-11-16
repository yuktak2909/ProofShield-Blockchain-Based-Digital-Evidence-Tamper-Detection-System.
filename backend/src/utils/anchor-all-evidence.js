const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });
const { Evidence, Case, User } = require("../models");
const bc = require("../services/blockchain.service");

async function main() {
  bc.initBlockchain();
  const provider = bc.provider;
  const contract = bc.contract;
  const contractAddress = await contract.getAddress();
  console.log("Connected to Contract Address:", contractAddress);
  const owner = await contract.owner();
  console.log("Contract Owner Address:", owner);

  const evs = await Evidence.findAll({
    include: [{ model: Case, as: "case" }, { model: User, as: "submitter" }]
  });
  console.log(`Found ${evs.length} evidence records in database.`);

  for (const e of evs) {
    try {
      const onChain = await contract.getEvidence(e.id);
      if (onChain && onChain[7]) {
        console.log(`[ON-CHAIN CONFIRMED] ${e.evidenceName} already on contract.`);
        e.blockchainStatus = "CONFIRMED";
        e.blockchainContractAddress = contractAddress;
        await e.save();
        continue;
      }
    } catch (err) {
      // not on chain yet
    }

    console.log(`[ANCHORING] ${e.evidenceName} (${e.id})`);
    const wallet = bc.wallet;
    const nonce = await provider.getTransactionCount(wallet.address, "latest");
    const submitterAddr = e.submitter?.walletAddress || wallet.address;

    const tx = await contract.registerEvidence(
      e.id,
      e.fileHash,
      e.case?.caseNumber || "PS-2026-001",
      e.description || "Forensic Exhibit",
      submitterAddr,
      { nonce }
    );
    const receipt = await tx.wait();
    e.blockchainTxId = receipt.hash;
    e.blockchainBlockNumber = receipt.blockNumber;
    e.blockchainStatus = "CONFIRMED";
    e.blockchainContractAddress = contractAddress;
    e.blockchainAnchoredAt = new Date();
    await e.save();
    console.log(`  -> MINED IN BLOCK #${receipt.blockNumber} (Tx: ${receipt.hash})`);
  }

  console.log("\nALL EXHIBITS ARE NOW IMMUTABLY ANCHORED ON ETHEREUM SMART CONTRACT!");
  process.exit(0);
}

main().catch(err => {
  console.error("Anchoring script failed:", err);
  process.exit(1);
});

