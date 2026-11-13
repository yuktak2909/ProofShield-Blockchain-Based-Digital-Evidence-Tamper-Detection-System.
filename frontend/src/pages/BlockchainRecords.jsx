import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Cpu, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  HelpCircle, 
  Copy, 
  Check, 
  Database,
  Layers,
  Fuel,
  CheckCircle2,
  ExternalLink
} from "lucide-react";

const BlockchainRecords = () => {
  const [evidenceList, setEvidenceList] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [chainData, setChainData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const response = await axios.get("/api/evidence");
        const registered = response.data.filter(item => item.status === "REGISTERED");
        setEvidenceList(registered);
        if (registered.length > 0) {
          setSelectedId(registered[0].id);
        }
      } catch (err) {
        console.error("Failed to load evidence catalog");
      }
    };
    fetchEvidence();
  }, []);

  const fetchBlockchainState = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError("");
    setChainData(null);
    try {
      const response = await axios.get(`/api/evidence/${selectedId}/blockchain`);
      setChainData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to retrieve live smart contract state.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockchainState();
  }, [selectedId]);

  const handleCopyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Blockchain Integrity Ledger</h1>
        <p className="text-xs text-slate-500">Live JSON-RPC state inspector querying Solidity contract variables on Ethereum Node (Chain ID 1337).</p>
      </div>

      {/* Contract & Network Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block mb-0.5 font-sans">Smart Contract</span>
            <span className="text-slate-900 font-bold block">ProofShieldEvidence.sol</span>
            <span className="text-[10px] text-slate-500 block mt-1">Solidity v0.8.24</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-700">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block mb-0.5 font-sans">Ethereum JSON-RPC Node</span>
            <span className="text-slate-900 font-bold block">HTTP 127.0.0.1:8545</span>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-1">Hardhat Node (Chain 1337)</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block mb-0.5 font-sans">Data Schema</span>
            <span className="text-slate-900 font-bold block">struct EvidenceRecord</span>
            <span className="text-[10px] text-slate-500 block mt-1">Keccak256 / SHA-256 Checksums</span>
          </div>
        </div>
      </div>

      {/* Query Selector Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">
          Target Evidence Asset:
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
        >
          <option value="">-- Select secured file to inspect --</option>
          {evidenceList.map((item) => (
            <option key={item.id} value={item.id}>
              {item.evidenceName} ({item.case?.caseNumber || "CASE"}) &bull; {item.fileHash.substring(0, 10)}...
            </option>
          ))}
        </select>
        <button
          onClick={fetchBlockchainState}
          disabled={loading || !selectedId}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh State
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-blue-700 font-medium text-xs">
          <div className="w-8 h-8 border-3 border-blue-700 border-t-transparent rounded-full animate-spin mb-3"></div>
          Reading smart contract storage slots via JSON-RPC...
        </div>
      ) : chainData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Column A: PostgreSQL Record Mirror */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  PostgreSQL Relational Index
                </h3>
                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-mono font-bold">
                  SQL MIRROR
                </span>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-sans block">Evidence UUID</span>
                  <span className="text-slate-900 font-semibold block break-all">{chainData.database.id}</span>
                </div>
                
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-sans block">IPFS Gateway CID</span>
                  <span className="text-blue-700 block break-all">{chainData.database.ipfsCid}</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-400 text-[10px] uppercase font-sans block mb-0.5">Database Checksum (SHA-256)</span>
                  <span className="text-emerald-700 font-bold block break-all">{chainData.database.fileHash}</span>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-sans block mb-0.5">Registered Ethereum Transaction ID</span>
                  <span className="text-purple-700 block break-all">{chainData.database.blockchainTxId}</span>
                </div>
              </div>
            </div>

            {/* Column B: Smart Contract Solidity State */}
            <div className="bg-white border border-purple-200 p-6 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-600" />
                  On-Chain Smart Contract State
                </h3>
                <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-mono font-bold">
                  SOLIDITY STORAGE
                </span>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-sans block">contract.evidenceId</span>
                  <span className="text-slate-900 font-semibold block break-all">{chainData.blockchain.evidenceId}</span>
                </div>
                
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-sans block">contract.caseId Reference</span>
                  <span className="text-slate-900 block">{chainData.blockchain.caseId}</span>
                </div>

                <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-lg">
                  <span className="text-slate-400 text-[10px] uppercase font-sans block mb-0.5">contract.fileHash (Immutable)</span>
                  <span className="text-emerald-700 font-bold block break-all">{chainData.blockchain.fileHash}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-sans block mb-0.5">contract.currentCustodian (Wallet)</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-900 block break-all text-[11px] truncate flex-1">
                      {chainData.blockchain.currentCustodian}
                    </span>
                    <button 
                      onClick={() => handleCopyAddress(chainData.blockchain.currentCustodian)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-200 flex-shrink-0 cursor-pointer"
                      title="Copy wallet address"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-purple-100 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-sans block">Timestamp Mined</span>
                    <span className="text-slate-900 block">{new Date(chainData.blockchain.timestamp).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-sans block">contract.exists</span>
                    <span className="text-emerald-700 font-bold block uppercase">
                      {String(chainData.blockchain.exists)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Transaction Mined Details Card */}
          {chainData.transaction && (
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  Mined Ethereum Transaction Receipt
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3 h-3" />
                  {chainData.transaction.txStatus || "CONFIRMED"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-sans block">Block Height</span>
                  <span className="text-slate-900 font-bold block text-sm">#{chainData.transaction.blockNumber}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-sans block">Gas Consumed</span>
                  <span className="text-slate-900 font-bold block text-sm">{chainData.transaction.gasUsed}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-sans block">Confirmations</span>
                  <span className="text-emerald-700 font-bold block text-sm">{chainData.transaction.confirmations}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-sans block">Network Standard</span>
                  <span className="text-purple-700 font-bold block text-sm">EVM / 1337</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <Cpu className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">No Evidence Record Selected</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Choose a registered evidence item from the catalog dropdown list above to query live smart contract variables.
          </p>
        </div>
      )}

    </div>
  );
};

export default BlockchainRecords;
