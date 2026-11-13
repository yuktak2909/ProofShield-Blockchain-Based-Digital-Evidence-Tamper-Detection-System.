import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Activity, 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ShieldCheck,
  Terminal,
  Layers,
  Zap
} from "lucide-react";

const SystemHealth = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/health");
      setHealth(res.data);
      setLastCheck(new Date());
    } catch (err) {
      console.error("Health probe failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const formatUptime = (seconds) => {
    if (!seconds) return "N/A";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const getStatusIcon = (status) => {
    if (status === "Operational") {
      return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    } else if (status === "Degraded") {
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const getStatusBadge = (status) => {
    if (status === "Operational") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (status === "Degraded") {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    return "bg-red-50 text-red-700 border-red-200";
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              High-Availability Subsystem Monitor
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Diagnostics & Health</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Real-time status monitor inspecting PostgreSQL storage latency, Ethereum JSON-RPC connectivity, smart contract availability, and IPFS mock storage nodes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lastCheck && (
            <span className="text-[11px] font-mono text-slate-400 mr-2">
              Audited: {lastCheck.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchHealth}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Re-probe System
          </button>
        </div>
      </div>

      {/* Global Status Banner */}
      {health && (
        <div className={`p-5 rounded-xl border flex items-center justify-between ${
          health.status === "Operational"
            ? "bg-emerald-50/60 border-emerald-200"
            : "bg-amber-50 border-amber-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${
              health.status === "Operational" ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
            }`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                  PLATFORM CORE STATUS:
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getStatusBadge(health.status)}`}>
                  {health.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                All critical services evaluated with an overall roundtrip latency of <strong className="font-mono">{health.responseTimeMs}ms</strong>.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-6 font-mono text-xs text-slate-600">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-sans">Uptime</span>
              <span className="font-bold text-slate-900">{formatUptime(health.uptimeSeconds)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-sans">Node RSS Mem</span>
              <span className="font-bold text-slate-900">{health.memoryUsageMb} MB</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-sans">Node.js Engine</span>
              <span className="font-bold text-slate-900">{health.nodeVersion}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4 Core Components Diagnostic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. PostgreSQL Database */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Relational Ledger (PostgreSQL)
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">Sequelize ORM Pool</span>
              </div>
            </div>
            {health && (
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getStatusBadge(health.components?.database?.status)}`}>
                {health.components?.database?.status}
              </span>
            )}
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-500 font-sans">Query Roundtrip Latency:</span>
              <span className="font-bold text-slate-900">{health?.components?.database?.latencyMs ?? "--"} ms</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-500 font-sans">Pool Connectivity:</span>
              <span className="text-emerald-700 font-bold">{health?.components?.database?.details || "Connected"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-sans">Dialect & Port:</span>
              <span className="text-slate-700">postgres @ 5432</span>
            </div>
          </div>
        </div>

        {/* 2. Ethereum Blockchain JSON-RPC */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Ethereum JSON-RPC Node
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">Ethers.js HTTP Provider</span>
              </div>
            </div>
            {health && (
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getStatusBadge(health.components?.blockchainRpc?.status)}`}>
                {health.components?.blockchainRpc?.status}
              </span>
            )}
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-500 font-sans">RPC Endpoint:</span>
              <span className="font-bold text-purple-700">http://127.0.0.1:8545</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-500 font-sans">Chain ID & Network:</span>
              <span className="text-slate-900 font-bold">1337 (Local Hardhat Node)</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-sans">Current Block Height:</span>
              <span className="text-emerald-700 font-bold">#{health?.components?.blockchainRpc?.blockNumber ?? "--"}</span>
            </div>
          </div>
        </div>

        {/* 3. Solidity Smart Contract */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  ProofShieldEvidence.sol
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">Solidity v0.8.24 Deployment</span>
              </div>
            </div>
            {health && (
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getStatusBadge(health.components?.smartContract?.status)}`}>
                {health.components?.smartContract?.status}
              </span>
            )}
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <span className="text-slate-500 font-sans block mb-1">Contract Deployment Address:</span>
              <span className="bg-slate-50 p-2 rounded border border-slate-200 text-slate-900 font-bold block truncate" title={health?.components?.smartContract?.address}>
                {health?.components?.smartContract?.address || "0x5FbDB2315678afecb367f032d93F642f64180aa3"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-sans">Contract Owner Address:</span>
              <span className="text-slate-700 truncate max-w-[200px]" title={health?.components?.smartContract?.owner}>
                {health?.components?.smartContract?.owner || "Deployer Account #0"}
              </span>
            </div>
          </div>
        </div>

        {/* 4. IPFS Mock Storage Service */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  IPFS Mock & Evidence Storage
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">Content-Addressable CID Storage</span>
              </div>
            </div>
            {health && (
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getStatusBadge(health.components?.ipfsGateway?.status)}`}>
                {health.components?.ipfsGateway?.status}
              </span>
            )}
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-500 font-sans">Storage Mount:</span>
              <span className="font-bold text-slate-900 truncate max-w-[200px]" title={health?.components?.ipfsGateway?.directory}>
                backend/uploads/ipfs_mock
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-500 font-sans">Stored Exhibits:</span>
              <span className="text-emerald-700 font-bold">{health?.components?.ipfsGateway?.fileCount ?? 0} files</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-sans">Streaming Mode:</span>
              <span className="text-blue-700 font-bold">HTTP 206 Partial Range Active</span>
            </div>
          </div>
        </div>

      </div>

      {/* Security Architecture Notice */}
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-xs flex items-start gap-3">
        <Server className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-slate-800">Decentralized Trust Architecture:</span> In compliance with legal admissibility mandates, ProofShield uses a dual-ledger paradigm. High-throughput relational operations occur in PostgreSQL, while cryptographic proofs (SHA-256 digests and custody state transitions) are permanently sealed into Ethereum blocks, providing mathematical immutability independent of local system administrators.
        </div>
      </div>

    </div>
  );
};

export default SystemHealth;

