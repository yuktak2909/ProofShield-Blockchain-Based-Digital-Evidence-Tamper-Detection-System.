@echo off
TITLE ProofShield Enterprise Platform Launcher
COLOR 0B
setlocal
cd /d "%~dp0"

echo =========================================================================
echo               PROOFSHIELD DIGITAL EVIDENCE INTEGRITY SYSTEM
echo                      Enterprise Platform Launcher
echo =========================================================================
echo.

:: 1. Start Hardhat Ethereum Node
echo [1/4] Launching Hardhat Blockchain Node (Chain 1337 on port 8545)...
start "ProofShield [1/3] - Ethereum Node" /D "%~dp0blockchain" cmd /k "npx hardhat node"

:: 2. Wait for Hardhat Node to be ready
echo [2/4] Waiting for Blockchain Node to initialize on port 8545...
set ATTEMPTS=0

:wait_node
set /a ATTEMPTS+=1
node -e "const http=require('http'); const req=http.request('http://127.0.0.1:8545', {method:'POST'}, res=>{process.exit(0)}); req.on('error', ()=>process.exit(1)); req.write('{}'); req.end();" >nul 2>&1 && goto node_ready

if %ATTEMPTS% GEQ 25 (
    echo [WARNING] Node startup took longer than 25s. Continuing with startup...
    goto deploy_step
)
timeout /t 1 /nobreak >nul
goto wait_node

:node_ready
echo [OK] Hardhat Blockchain Node is active and responding on port 8545!

:deploy_step
:: 3. Deploy Smart Contract and Anchor Database Exhibits
echo [3/4] Deploying ProofShieldEvidence.sol and synchronizing on-chain ledger...
cd /d "%~dp0blockchain"
call npx hardhat run scripts\deploy.js --network localhost
cd /d "%~dp0"
call node backend\src\utils\anchor-all-evidence.js

:: 4. Start Backend Express API Server
echo [4/4] Launching Backend API Server (Port 5000)...
start "ProofShield [2/3] - Backend API Server" /D "%~dp0backend" cmd /k "npm start"

:: 5. Start Frontend Vite Dev Server
echo Launching Frontend React Dev Server (Port 5173)...
start "ProofShield [3/3] - Frontend Dev Server" /D "%~dp0frontend" cmd /k "npm run dev"

echo.
echo =========================================================================
echo                   ALL SUBSYSTEMS LAUNCHED SUCCESSFULLY
echo =========================================================================
echo.
echo Frontend Application : http://localhost:5173
echo Backend REST API     : http://localhost:5000/api
echo Blockchain Node RPC  : http://127.0.0.1:8545
echo.
echo Press any key to close this launcher window (subsystems will keep running).
pause >nul
