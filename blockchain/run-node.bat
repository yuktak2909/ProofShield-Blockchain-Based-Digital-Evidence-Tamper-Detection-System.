@echo off
set "LOCALAPPDATA=%~dp0cache\localappdata"
cd /d "%~dp0"
npx hardhat node

