const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment of ProofShieldEvidence...");

  const ProofShieldEvidence = await hre.ethers.getContractFactory("ProofShieldEvidence");
  const contract = await ProofShieldEvidence.deploy();

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log(`ProofShieldEvidence deployed successfully at: ${address}`);

  // Auto-update .env file
  const envPath = path.join(__dirname, "../../.env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");
    if (envContent.includes("CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${address}`);
      fs.writeFileSync(envPath, envContent, "utf8");
      console.log(`Updated CONTRACT_ADDRESS in root .env to ${address}`);
    } else {
      envContent += `\nCONTRACT_ADDRESS=${address}`;
      fs.writeFileSync(envPath, envContent, "utf8");
      console.log(`Added CONTRACT_ADDRESS to root .env`);
    }
  } else {
    console.log("Root .env file not found, skipping auto-update.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
