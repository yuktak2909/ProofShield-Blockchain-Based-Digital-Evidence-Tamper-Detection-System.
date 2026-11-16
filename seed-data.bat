@echo off
TITLE ProofShield Smart Contract Deployment & Database Seeder
COLOR 0A
echo =========================================================================
echo       PROOFSHIELD DEPLOYMENT & FORENSIC DATABASE SEEDER
echo =========================================================================
echo.
echo Deploying smart contract to local node...
call npx --prefix "%~dp0blockchain" hardhat run "%~dp0blockchain\scripts\deploy.js" --network localhost
echo.
echo Seeding cases, users, 4 complete evidence categories, and audit ledger...
call node "%~dp0backend\src\utils\db-init.js"
echo.
echo Deployment and seeding complete!
pause

