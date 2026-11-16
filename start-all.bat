@echo off
TITLE ProofShield Enterprise Platform Launcher
COLOR 0B
echo =========================================================================
echo               PROOFSHIELD DIGITAL EVIDENCE INTEGRITY SYSTEM
echo                      Enterprise Platform Launcher
echo =========================================================================
echo.
echo Starting all subsystems in dedicated windows...
echo.

:: 1. Start Hardhat Ethereum Node
echo [1/3] Launching Hardhat Blockchain Node (Chain 1337 on port 8545)...
start "ProofShield [1/3] - Ethereum Node" cmd /k "cd /d "%~dp0blockchain" && npx hardhat node"

:: Actively wait for Hardhat node to answer on port 8545
echo Waiting for Blockchain Node to initialize on port 8545...
:wait_node
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8545' -Method POST -Body '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}' -ContentType 'application/json' -TimeoutSec 1; exit 0 } catch { exit 1 }"
if %ERRORLEVEL% NEQ 0 (
    timeout /t 1 /nobreak >nul
    goto wait_node
)
echo [OK] Hardhat Blockchain Node is active and responding!

:: 2. Deploy Smart Contract and Anchor Exhibits
echo [2/3] Deploying ProofShieldEvidence.sol and synchronizing on-chain ledger...
call npx --prefix "%~dp0blockchain" hardhat run "%~dp0blockchain\scripts\deploy.js" --network localhost
call node "%~dp0backend\src\utils\anchor-all-evidence.js"

:: 3. Start Backend Express API Server
echo [3/3] Launching ProofShield Backend API Server (Port 5000)...
start "ProofShield [2/3] - Backend API Server" cmd /k "cd /d "%~dp0backend" && npm start"

:: 4. Start Frontend Vite Dev Server
echo Launching ProofShield Frontend React Dev Server (Port 5173)...
start "ProofShield [3/3] - Frontend Dev Server" cmd /k "cd /d "%~dp0frontend" && npm run dev"

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
