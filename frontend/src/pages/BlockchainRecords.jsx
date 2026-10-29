import React, { useState, useEffect } from "react";
import axios from "axios";
import { Cpu, Search, RefreshCw, AlertTriangle, ShieldCheck, HelpCircle, Copy, Check } from "lucide-react";

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
        setEvidenceList(response.data.filter(item => item.status === "REGISTERED"));
        if (response.data.length > 0) {
          setSelectedId(response.data[0].id);
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
        <h2 className="text-xl font-tech font-bold text-cyan-400 tracking-wide">BLOCKCHAIN INTEGRITY LEDGER</h2>
        <p className="text-xs text-cyber-muted">Inspect live smart contract state variables directly via ethers.js JSON-RPC provider.</p>
      </div>

      {/* Contract & Network Specifications */}
      <div className="bg-[#151B2C]/40 border border-[#1F2937] p-6 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
        <div className="p-4 bg-[#111827]/40 rounded border border-gray-800 flex items-start gap-3">
          <Cpu className="w-5 h-5 text-cyan-400 mt-0.5" />
          <div>
            <span className="text-[10px] text-cyber-muted uppercase block mb-1">Contract Protocol</span>
            <span className="text-cyan-100 font-semibold block">ProofShieldEvidence.sol</span>
            <span className="text-[9px] text-gray-500 block mt-1">Solidity Compiler v0.8.24</span>
          </div>
        </div>

        <div className="p-4 bg-[#111827]/40 rounded border border-gray-800 flex items-start gap-3">
          <Cpu className="w-5 h-5 text-purple-400 mt-0.5" />
          <div>
            <span className="text-[10px] text-cyber-muted uppercase block mb-1">Target Network RPC</span>
            <span className="text-cyan-100 font-semibold block">HTTP 127.0.0.1:8545</span>
            <span className="text-[9px] text-emerald-400 block mt-1">Hardhat Network (Chain ID 1337)</span>
          </div>
        </div>

        <div className="p-4 bg-[#111827]/40 rounded border border-gray-800 flex items-start gap-3">
          <Cpu className="w-5 h-5 text-emerald-400 mt-0.5" />
          <div>
            <span className="text-[10px] text-cyber-muted uppercase block mb-1">Secured Schema</span>
            <span className="text-cyan-100 font-semibold block">struct Evidence {"{...}"}</span>
            <span className="text-[9px] text-gray-500 block mt-1">Keccak256 checksum validations</span>
          </div>
        </div>
      </div>

      {/* Inspection Select Selector */}
      <div className="bg-[#151B2C]/40 border border-[#1F2937] p-4 rounded-xl flex items-center gap-4">
        <label className="text-xs font-semibold text-cyber-muted uppercase w-32 flex-shrink-0">Query Target:</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 bg-[#151B2C] border border-[#1F2937] focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none"
        >
          <option value="">-- Select secured file --</option>
          {evidenceList.map((item) => (
            <option key={item.id} value={item.id}>
              {item.evidenceName} ({item.case?.caseNumber})
            </option>
          ))}
        </select>
        <button
          onClick={fetchBlockchainState}
          disabled={loading || !selectedId}
          className="px-3.5 py-2 bg-[#151B2C] hover:bg-gray-800 text-cyan-400 rounded border border-gray-800 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Side by Side Inspector Output */}
      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-lg text-red-400 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-cyan-400 font-mono text-xs">
          <div className="w-8 h-8 border-3 border-t-cyan-400 border-r-transparent border-b-cyan-400 border-l-transparent rounded-full animate-spin mb-3"></div>
          QUERYING CONTRACT STATE VARIABLES LIVE...
        </div>
      ) : chainData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Column A: Database Mirror */}
          <div className="bg-[#151B2C]/40 border border-[#1F2937] p-6 rounded-xl space-y-4">
            <h3 className="font-tech text-xs tracking-wider uppercase text-cyan-400 border-b border-gray-800 pb-3 flex items-center justify-between">
              <span>SQL PostgreSQL Index Mirror</span>
              <span className="text-[10px] bg-cyan-950/20 text-cyan-400 border border-cyan-900/30 px-2 py-0.5 rounded font-mono font-semibold">
                POSTGRESQL
              </span>
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <span className="text-cyber-muted text-[10px] block">Evidence UUID Index</span>
                <span className="text-cyan-200 block break-all">{chainData.database.id}</span>
              </div>
              
              <div>
                <span className="text-cyber-muted text-[10px] block">Storage Gateway CID Reference</span>
                <span className="text-cyan-200 block break-all">{chainData.database.ipfsCid}</span>
              </div>

              <div>
                <span className="text-cyber-muted text-[10px] block">Stored SHA-256 Fingerprint Checksum</span>
                <span className="text-emerald-400 font-semibold block break-all">{chainData.database.fileHash}</span>
              </div>

              <div className="pt-3 border-t border-gray-800/60">
                <span className="text-cyber-muted text-[10px] block">Logged Sealing Transaction ID</span>
                <span className="text-purple-400 block break-all">{chainData.database.blockchainTxId}</span>
              </div>
            </div>
          </div>

          {/* Column B: Live Smart Contract State */}
          <div className="bg-[#151B2C]/40 border border-purple-500/20 p-6 rounded-xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-purple-500"></div>
            <h3 className="font-tech text-xs tracking-wider uppercase text-purple-400 border-b border-gray-800 pb-3 flex items-center justify-between">
              <span>Smart Contract State Mirror</span>
              <span className="text-[10px] bg-purple-950/20 text-purple-400 border border-purple-900/30 px-2 py-0.5 rounded font-mono font-semibold">
                SOLIDITY STATE
              </span>
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <span className="text-cyber-muted text-[10px] block">struct.evidenceId</span>
                <span className="text-cyan-200 block break-all">{chainData.blockchain.evidenceId}</span>
              </div>
              
              <div>
                <span className="text-cyber-muted text-[10px] block">struct.caseId Reference</span>
                <span className="text-cyan-200 block">{chainData.blockchain.caseId}</span>
              </div>

              <div>
                <span className="text-cyber-muted text-[10px] block">struct.fileHash checksum</span>
                <span className="text-emerald-400 font-semibold block break-all">{chainData.blockchain.fileHash}</span>
              </div>

              <div>
                <span className="text-cyber-muted text-[10px] block">struct.currentCustodian Wallet Address</span>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-cyan-200 block break-all text-[11px] truncate flex-1">{chainData.blockchain.currentCustodian}</span>
                  <button 
                    onClick={() => handleCopyAddress(chainData.blockchain.currentCustodian)}
                    className="p-1 bg-[#111827] hover:bg-gray-800 text-cyan-400 border border-gray-800 rounded flex-shrink-0 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-800/60 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-cyber-muted text-[10px] block">struct.timestamp</span>
                  <span className="text-cyan-200 block">{new Date(chainData.blockchain.timestamp).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-cyber-muted text-[10px] block">struct.exists state</span>
                  <span className="text-emerald-400 font-semibold block uppercase">
                    {String(chainData.blockchain.exists)}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-[#151B2C]/20 border border-dashed border-gray-800 rounded-xl p-12 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
          <Cpu className="w-12 h-12 text-cyber-muted mb-3 animate-pulse" />
          <h3 className="font-tech text-xs tracking-wider uppercase text-cyber-muted">No blockchain query selected</h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1">
            Choose a registered evidence item from the catalog dropdown list to start the live JSON-RPC blockchain inspector.
          </p>
        </div>
      )}

    </div>
  );
};

export default BlockchainRecords;
