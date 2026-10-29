# ProofShield — Blockchain-Based Digital Evidence Tamper Detection System

ProofShield is a secure digital evidence integrity and chain-of-custody tracking platform designed for investigators, forensic analysts, court officials, and administrators. The system allows users to cryptographically secure digital evidence (CCTV footage, documents, photographs, logs) and verify its integrity against altered copies.

---

## Core Architecture Principles

> [!IMPORTANT]
> **THE ACTUAL EVIDENCE FILE IS NOT STORED ON THE BLOCKCHAIN.**
> - Large files directly on-chain incur exorbitant gas fees and fail to guarantee storage confidentiality.
> - Instead, ProofShield applies a **Four-Layer Hybrid Architecture**:
>   1. The uploaded file is hashed using **SHA-256** to generate its unique cryptographic fingerprint.
>   2. The file is uploaded to **IPFS** off-chain (returning a Content Identifier / CID).
>   3. Searchable metadata, the CID, and custody records are indexed in **PostgreSQL**.
>   4. The evidence hash, case ID, submitter information, and timestamps are registered on an **Ethereum-compatible blockchain** through a Solidity smart contract.
>   5. Verification consists of re-hashing a suspect file and comparing it side-by-side with the immutable on-chain record.

---

## System Architecture

```mermaid
graph TD
    Client[React/Vite Client Layer 1] -->|REST API & JWT| Express[Express.js Server Layer 2]
    Express -->|ethers.js RPC| Blockchain[Solidity Smart Contract Layer 3]
    Express -->|Sequelize ORM| Postgres[(PostgreSQL Metadata Layer 4)]
    Express -->|Axios/FS| IPFS[(IPFS Off-Chain Storage Layer 4)]
```

### Layer 1: Client Layer
- **React.js + Vite + Tailwind CSS**: Clean, responsive cybersecurity dark-theme dashboard.
- Features: User Auth, Case Creation, Drag-and-drop Evidence Uploader, Side-by-Side Verification Panel (tamper alarms), Custody Timeline, Blockchain Inspector, and Admin User management.

### Layer 2: Application / API Layer
- **Node.js + Express.js**: REST API server.
- Security: Role-Based Access Control (RBAC) middleware, custom memory rate limiters, JWT authorization, file type whitelist validators, and temporary disk sanitization.
- Services: Hashing, IPFS Pinning (with Axios/FormData), ethers.js wallet signing, and verification log compilers.

### Layer 3: Blockchain Layer
- **Solidity Smart Contract (`ProofShieldEvidence.sol`)**: Maintains immutable proof of registration, checksum hashes, and custody history logs.
- Hardhat Development network handles local compiled mock deployments and Solidity unit tests.

### Layer 4: Storage Layer
- **PostgreSQL**: Houses database indices for users, cases, evidence records, IPFS CIDs, and cached custody activities.
- **IPFS**: Decentralized file store. If Pinata API credentials are omitted, falls back to a development directory adapter (`backend/uploads/ipfs_mock`).

---

## Installation & Setup

### Prerequisites
- **Node.js** (v18+ recommended)
- **PostgreSQL** (Port 5432)
- **Docker** (Optional, database container config included)

---

### Step 1: Environment Variables
Create a `.env` file in the project root (copied from `.env.example`):
```env
# Server
PORT=5000
NODE_ENV=development
JWT_SECRET=supersecretproofshieldtokenkey12345

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/proofshield
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=proofshield
DB_HOST=localhost
DB_PORT=5432

# Blockchain
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=

# IPFS Pinata (Optional, leave blank to use mock local uploads)
PINATA_API_KEY=
PINATA_API_SECRET=
PINATA_JWT=
IPFS_GATEWAY_URL=https://gateway.pinata.cloud/ipfs/
```

---

### Step 2: Install Workspace Packages
From the root directory, run:
```bash
cmd.exe /c npm run install:all
```
This script runs `npm install` recursively in the root, `blockchain/`, `backend/`, and `frontend/` folders.

---

### Step 3: Spin Up PostgreSQL Database
If you have Docker installed, start the database container:
```bash
docker-compose up -d
```
Otherwise, ensure a local PostgreSQL server is running on Port 5432 and matching database name `proofshield` exists.

---

### Step 4: Run Local Hardhat Node & Deploy Smart Contract
1. In a terminal window, start the local blockchain network:
   ```bash
   cd blockchain
   npx hardhat node
   ```
   This will spin up a local network on `http://127.0.0.1:8545` and log 20 pre-funded test accounts.
2. In a second terminal window, deploy the Solidity contract:
   ```bash
   cd blockchain
   npx hardhat run scripts/deploy.js --network localhost
   ```
   *Note: The deploy script automatically compiles the contract and updates the `CONTRACT_ADDRESS` environment variable in your root `.env` file.*

---

### Step 5: Initialize Database Schema & Seed Demo Data
To create tables and seed mock profiles:
```bash
cd backend
npm run start
# Wait for server connection, then run:
node src/utils/db-init.js
```
This creates standard tables and inserts the quick-login demo accounts.

---

### Step 6: Start the Applications Concurrently
From the project root:
```bash
npm run dev
```
- **Frontend client** starts on: `http://localhost:5173`
- **Backend API** runs on: `http://localhost:5000`
- **Local Blockchain** node responds on: `http://localhost:8545`

---

## Pre-authorized Demo Accounts
Use the "Quick Access Selector" buttons on the Login page to log in as any role immediately:

| Role Name | Clearance Level | Email | Passkey | Role Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Alice** | Investigator | `investigator@proofshield.com` | `Password123` | Create dossiers, register evidence, request transfers |
| **Bob** | Forensic Analyst | `analyst@proofshield.com` | `Password123` | Inspect vaults, download files, verify checksums |
| **Charles** | Court Official | `court@proofshield.com` | `Password123` | View timeline history, verify files, check blockchain |
| **Davis** | Administrator | `admin@proofshield.com` | `Password123` | Manage accounts, adjust system settings, view stats |

---

## Live Demonstration Walkthrough

### Scenario A: Secure Registration
1. Log in as **Investigator Alice**.
2. Click **Initialize Dossier** on the Cases page and create a Case (e.g. `PS-2026-001`).
3. Open **Register Evidence**, drag-and-drop the sample file located at:
   `backend/uploads/demo_files/evidence_cctv.mp4`
4. Associate it with your Case, and click **Secure Lock Payload**.
5. The UI shows the active pipeline: `Hashing -> IPFS -> Blockchain -> PostgreSQL`.
6. Once complete, inspect the report showing the IPFS CID and Blockchain transaction ID.

### Scenario B: Custody Transfer
1. Navigate to **Evidence Vault** and inspect the newly registered dossier.
2. Under Action buttons, click **Transfer Custody**. Select **Analyst Bob** and click **Execute**.
3. Log out and log back in as **Analyst Bob**.
4. Access the dossier. Click **Download** (which logs a "downloaded" audit trail event).

### Scenario C: Integrity Auditing & Tamper Alarm
1. Access the **Verify Evidence** tab as **Analyst Bob** or **Court Charles**.
2. Select the target evidence record from the dropdown.
3. **Audit Original File**: Upload the original file (`evidence_cctv.mp4`). Click **Verify**.
   - Output: **VERIFIED** (Green card confirms binary parity with on-chain checksum).
4. **Audit Tampered File**: Upload the altered file located at:
   `backend/uploads/demo_files/evidence_cctv_tampered.mp4`
   - Output: **TAMPER DETECTED** (Blinking red warning reports exactly when alterations took place, keeping the original contract values safe on-chain).

---

## Security Requirements Met
1. **Password Security**: Bcyrptjs hashing.
2. **Endpoint Safeguards**: Protected routes verified by JWT.
3. **Access Controls**: Strict role validation middleware.
4. **File Whitelist**: Upload filters whitelisting specific MIME-types (JPG, PNG, PDF, MP4, etc.) and rejecting malicious path traversals.
5. **Rate Limiting**: Custom window counts guarding login and verification against brute-forcing.
6. **Immutable fingerprint integrity**: Contract logic restricts editing hashes once registered.

---

## System Boundaries & Limitations
- **Garbage-In Disclaimer**: ProofShield proves evidence has not been altered *after* registration. It does not prove a CCTV video was genuine before it was uploaded to the platform.
- **AI Exclusions**: No AI face matching or predictive crime detections are implemented.
- **Master Signer Key**: The blockchain transactions are signed on behalf of the user by the backend master private key for a seamless REST client workflow.
