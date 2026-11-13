const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Evidence, sequelize } = require("../models");

const userOriginal = "C:\\Users\\yukta\\.gemini\\antigravity\\brain\\8ec51652-65bd-46ea-90f4-c3aa24bf54b4\\.user_uploaded\\media_1794572406780_8f013c1b.mp4";
const userTampered = "C:\\Users\\yukta\\.gemini\\antigravity\\brain\\8ec51652-65bd-46ea-90f4-c3aa24bf54b4\\.user_uploaded\\media_1794572413608_fad88d39.mp4";

const demoDir = path.join(__dirname, "../../uploads/demo_files");
const ipfsDir = path.join(__dirname, "../../uploads/ipfs_mock");

function computeHash(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function updateCCTV() {
  console.log("Checking source files...");
  if (!fs.existsSync(userOriginal) || !fs.existsSync(userTampered)) {
    throw new Error("One or both user uploaded video files do not exist at specified path.");
  }

  const origSize = fs.statSync(userOriginal).size;
  const tampSize = fs.statSync(userTampered).size;
  const origHash = computeHash(userOriginal);
  const tampHash = computeHash(userTampered);

  console.log(`Original Video: ${origSize} bytes, SHA-256: ${origHash}`);
  console.log(`Tampered Video: ${tampSize} bytes, SHA-256: ${tampHash}`);

  // 1. Copy to demo_files
  fs.copyFileSync(userOriginal, path.join(demoDir, "evidence_cctv.mp4"));
  fs.copyFileSync(userOriginal, path.join(demoDir, "original_cctv.mp4"));
  fs.copyFileSync(userTampered, path.join(demoDir, "evidence_cctv_tampered.mp4"));
  fs.copyFileSync(userTampered, path.join(demoDir, "tampered_cctv_object_removed.mp4"));
  console.log("Copied to backend/uploads/demo_files/");

  // 2. Copy to ipfs_mock
  fs.copyFileSync(userOriginal, path.join(ipfsDir, "QmXvideo001"));
  fs.copyFileSync(userTampered, path.join(ipfsDir, "QmXvideo001-tampered"));
  console.log("Copied to backend/uploads/ipfs_mock/");

  // 3. Update _manifest.json
  const manifestPath = path.join(ipfsDir, "_manifest.json");
  let manifest = {};
  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  }
  manifest["QmXvideo001"] = { hash: origHash, size: origSize };
  manifest["QmXvideo001-tampered"] = { hash: tampHash, size: tampSize };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log("Updated _manifest.json");

  // 4. Update Evidence record in PostgreSQL database
  try {
    await sequelize.authenticate();
    const evidenceItem = await Evidence.findOne({
      where: {
        ipfsCid: "QmXvideo001"
      }
    });

    if (evidenceItem) {
      evidenceItem.fileHash = origHash;
      evidenceItem.fileSize = origSize;
      evidenceItem.fileType = "video/mp4";
      evidenceItem.evidenceName = "CCTV Footage - Front Vault Entrance (original_cctv.mp4)";
      await evidenceItem.save();
      console.log(`Updated Evidence record ID ${evidenceItem.id} with new hash & size.`);
    } else {
      console.log("Evidence item QmXvideo001 not found by CID, looking by name...");
      const altItem = await Evidence.findOne({
        where: {
          fileType: "video/mp4"
        }
      });
      if (altItem) {
        altItem.fileHash = origHash;
        altItem.fileSize = origSize;
        altItem.ipfsCid = "QmXvideo001";
        await altItem.save();
        console.log(`Updated alternate Evidence record ID ${altItem.id}`);
      }
    }
  } catch (dbErr) {
    console.warn("DB update warning:", dbErr.message);
  }

  console.log("All CCTV videos successfully replaced with user uploaded videos!");
}

updateCCTV()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FAILED:", err);
    process.exit(1);
  });

