const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProofShieldEvidence Contract", function () {
  let ProofShieldEvidence;
  let contract;
  let owner;
  let investigator;
  let analyst;
  let court;

  beforeEach(async function () {
    [owner, investigator, analyst, court] = await ethers.getSigners();
    ProofShieldEvidence = await ethers.getContractFactory("ProofShieldEvidence");
    contract = await ProofShieldEvidence.deploy();
    await contract.waitForDeployment();
  });

  describe("Evidence Registration", function () {
    it("Should successfully register a new piece of evidence", async function () {
      const evidenceId = "ev-1";
      const fileHash = "sha256-hash-example-1234567890abcdef";
      const caseId = "case-101";
      const metadata = "CCTV camera footage at front gate";

      const tx = await contract.registerEvidence(
        evidenceId,
        fileHash,
        caseId,
        metadata,
        investigator.address
      );

      // Verify event emission
      await expect(tx)
        .emit(contract, "EvidenceRegistered")
        .withArgs(evidenceId, fileHash, caseId, investigator.address, anyTimestamp => true);

      // Retrieve evidence from contract
      const ev = await contract.getEvidence(evidenceId);
      expect(ev.evidenceId).to.equal(evidenceId);
      expect(ev.fileHash).to.equal(fileHash);
      expect(ev.caseId).to.equal(caseId);
      expect(ev.metadata).to.equal(metadata);
      expect(ev.submitter).to.equal(investigator.address);
      expect(ev.currentCustodian).to.equal(investigator.address);
      expect(ev.exists).to.be.true;
    });

    it("Should reject duplicate registration of the same evidence ID", async function () {
      const evidenceId = "ev-1";
      const fileHash = "sha256-hash-example-1";
      const caseId = "case-101";
      const metadata = "CCTV camera footage";

      await contract.registerEvidence(
        evidenceId,
        fileHash,
        caseId,
        metadata,
        investigator.address
      );

      await expect(
        contract.registerEvidence(
          evidenceId,
          "sha256-hash-example-2",
          caseId,
          "New metadata",
          analyst.address
        )
      ).to.be.revertedWith("Evidence already registered");
    });
  });

  describe("Evidence Verification", function () {
    const evidenceId = "ev-verify";
    const fileHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"; // Empty file hash
    const caseId = "case-verify";
    const metadata = "verification test file";

    beforeEach(async function () {
      await contract.registerEvidence(
        evidenceId,
        fileHash,
        caseId,
        metadata,
        investigator.address
      );
    });

    it("Should verify evidence successfully if hashes match", async function () {
      const result = await contract.verifyEvidence(evidenceId, fileHash);
      expect(result.isVerified).to.be.true;
      expect(result.registeredHash).to.equal(fileHash);
    });

    it("Should fail verification and return the original hash if hashes mismatch", async function () {
      const tamperedHash = "86182101687f97b6e92751f9859f515082161b34e5659e5572eb06a6b5860d5b";
      const result = await contract.verifyEvidence(evidenceId, tamperedHash);
      expect(result.isVerified).to.be.false;
      expect(result.registeredHash).to.equal(fileHash);
    });

    it("Should revert verification if evidence ID is unregistered", async function () {
      await expect(
        contract.verifyEvidence("invalid-ev", fileHash)
      ).to.be.revertedWith("Evidence not registered");
    });
  });

  describe("Custody Transfer", function () {
    const evidenceId = "ev-custody";
    const fileHash = "hash-12345";
    const caseId = "case-202";
    const metadata = "Transfer evidence demo";

    beforeEach(async function () {
      await contract.registerEvidence(
        evidenceId,
        fileHash,
        caseId,
        metadata,
        investigator.address
      );
    });

    it("Should transfer custody successfully when requested by the current custodian", async function () {
      const tx = await contract.transferCustody(evidenceId, analyst.address, investigator.address);

      await expect(tx)
        .emit(contract, "CustodyTransferred")
        .withArgs(evidenceId, investigator.address, analyst.address, anyTimestamp => true);

      const ev = await contract.getEvidence(evidenceId);
      expect(ev.currentCustodian).to.equal(analyst.address);

      // Verify custody history has been updated
      const history = await contract.getCustodyHistory(evidenceId);
      expect(history.length).to.equal(2); // Registration + Transfer
      
      expect(history[0].action).to.equal("REGISTERED");
      expect(history[0].newCustodian).to.equal(investigator.address);

      expect(history[1].action).to.equal("TRANSFERRED");
      expect(history[1].previousCustodian).to.equal(investigator.address);
      expect(history[1].newCustodian).to.equal(analyst.address);
    });

    it("Should reject custody transfer if from address does not match current custodian", async function () {
      await expect(
        contract.transferCustody(evidenceId, court.address, analyst.address)
      ).to.be.revertedWith("Custodian address mismatch");
    });

    it("Should reject custody transfer to the zero address", async function () {
      await expect(
        contract.transferCustody(evidenceId, ethers.ZeroAddress, investigator.address)
      ).to.be.revertedWith("Invalid new custodian address");
    });
  });
});
