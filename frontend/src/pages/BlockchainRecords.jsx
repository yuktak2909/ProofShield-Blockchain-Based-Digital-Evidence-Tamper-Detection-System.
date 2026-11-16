import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { 
  Cpu, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  Copy, 
  Check, 
  Database,
  Layers,
  CheckCircle2,
  ExternalLink,
  Clock,
  FileCheck,
  FileText,
  X,
  Info
} from "lucide-react";

const BlockchainRecords = () => {
  const [evidenceList, setEvidenceList] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [chainData, setChainData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);
  const [txDetailsModalOpen, setTxDetailsModalOpen] = useState(false);
  const [anchoringLoading, setAnchoringLoading] = useState(false);
  const [anchorSuccessMessage, setAnchorSuccessMessage] = useState("");

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const response = await axios.get("/api/evidence");
        if (Array.isArray(response.data)) {
          const registered = response.data.filter(item => item.status === "REGISTERED");
          setEvidenceList(registered);
          if (registered.length > 0 && !selectedId) {
            setSelectedId(registered[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load evidence catalog for blockchain records");
      }
    };
    fetchEvidence();
  }, []);

  const fetchBlockchainState = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError("");
    setAnchorSuccessMessage("");
    setChainData(null);
    try {
      const response = await axios.get(`/api/evidence/${selectedId}/blockchain`);
      setChainData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to retrieve blockchain registration details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockchainState();
  }, [selectedId]);

  const handleAnchorEvidence = async () => {
    if (!selectedId) return;
    setAnchoringLoading(true);
    setError("");
    setAnchorSuccessMessage("");
    try {
      const res = await axios.post(`/api/evidence/${selectedId}/anchor`);
      setAnchorSuccessMessage(res.data.message || "Successfully anchored exhibit on Ethereum smart contract!");
      await fetchBlockchainState();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to anchor evidence to Ethereum.");
    } finally {
      setAnchoringLoading(false);
    }
  };

  const selectedEvidence = evidenceList.find(e => String(e.id) === String(selectedId));

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === "hash") {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Blockchain Records</h1>
          <p className="text-xs text-[#57515A] mt-0.5">
            Inspect on-chain evidence registration transactions, block confirmations, and cryptographic witness state.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBlockchainState}
            disabled={loading || !selectedId}
            className="px-3.5 py-1.5 bg-white border border-[#DDD7D2] hover:bg-[#FAF8F7] text-[#343239] font-semibold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Blockchain Status
          </button>
          <Link
            to="/verify"
            className="px-3.5 py-1.5 bg-[#873D50] hover:bg-[#732F40] text-white font-semibold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            Verify Evidence
          </Link>
        </div>
      </div>

      {/* Target Evidence Asset Selector Bar */}
      <div className="bg-white border border-[#E8E4E1] rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#343239] shrink-0 font-mono">
            Target Evidence Asset:
          </span>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-[#FAF8F7] border border-[#DDD7D2] focus:border-[#873D50] focus:bg-white rounded-lg px-3 py-1.5 text-xs text-[#343239] focus:outline-none w-full sm:max-w-md font-mono"
          >
            {evidenceList.map((item) => (
              <option key={item.id} value={item.id}>
                {item.evidenceName} [{item.case?.caseNumber || "CASE"}] &bull; {item.fileHash ? item.fileHash.substring(0, 14) + "..." : "No Hash"}
              </option>
            ))}
          </select>
        </div>

        {selectedEvidence && (
          <span className="text-[11px] font-mono text-slate-500 shrink-0">
            Registered: {new Date(selectedEvidence.createdAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Distinct System Status Indicators */}
      {chainData?.nodeStatus === "NODE_UNAVAILABLE" && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h3 className="font-bold text-amber-900">
              Ethereum Node Standby (Node Offline)
            </h3>
            <p className="text-amber-800 mt-0.5 leading-relaxed">
              The local Ethereum blockchain node is currently offline at http://127.0.0.1:8545. The cryptographic SHA-256 digest and case index remain securely sealed in the ProofShield database repository.
            </p>
          </div>
        </div>
      )}

      {chainData?.nodeStatus === "OPERATIONAL" && (chainData?.contractStatus === "CONTRACT_NOT_DEPLOYED" || chainData?.contractStatus === "CONTRACT_UNAVAILABLE") && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h3 className="font-bold text-amber-900">
              Smart Contract Not Deployed on Active Node (Node Connected)
            </h3>
            <p className="text-amber-800 mt-0.5 leading-relaxed">
              Ethereum JSON-RPC node is operational at http://127.0.0.1:8545, but the ProofShieldEvidence smart contract is not deployed at address <span className="font-mono font-semibold">{chainData.database?.blockchainContractAddress || "0x5FbDB2315678afecb367f032d93F642f64180aa3"}</span> on this chain instance. Deploy the contract using <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">npx hardhat run scripts/deploy.js --network localhost</code>.
            </p>
          </div>
        </div>
      )}

      {chainData?.recordStatus === "RECORD_PREVIOUS_CHAIN_UNVERIFIABLE" && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <h3 className="font-bold text-purple-900">
                Exhibit Anchored on Previous Chain Instance (Chain Reset Detected)
              </h3>
              <p className="text-purple-800 mt-0.5 leading-relaxed">
                This exhibit was recorded on a previous Ethereum blockchain session (Tx: <span className="font-mono font-semibold">{chainData.transaction?.txHash ? chainData.transaction.txHash.substring(0, 18) + "..." : "Recorded"}</span> in block #{chainData.transaction?.blockNumber || chainData.database?.blockchainBlockNumber || "N/A"}). The connected local chain has been reset and does not contain this on-chain record. Historical database data is preserved. Click below to anchor it to the active network.
              </p>
            </div>
          </div>
          <button
            onClick={handleAnchorEvidence}
            disabled={anchoringLoading}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs rounded-lg shadow-xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Cpu className={`w-3.5 h-3.5 ${anchoringLoading ? "animate-spin" : ""}`} />
            {anchoringLoading ? "Re-Anchoring..." : "Re-Anchor to Active Chain"}
          </button>
        </div>
      )}

      {chainData?.recordStatus === "RECORD_NOT_ANCHORED_ON_CHAIN" && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <h3 className="font-bold text-blue-900">
                Exhibit Sealed in Database — Pending Smart Contract Anchoring
              </h3>
              <p className="text-blue-800 mt-0.5 leading-relaxed">
                This exhibit is verified in the ProofShield PostgreSQL/SQLite database repository. Click below to anchor its cryptographic hash to the Ethereum smart contract.
              </p>
            </div>
          </div>
          <button
            onClick={handleAnchorEvidence}
            disabled={anchoringLoading}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg shadow-xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Cpu className={`w-3.5 h-3.5 ${anchoringLoading ? "animate-spin" : ""}`} />
            {anchoringLoading ? "Anchoring on Ethereum..." : "Anchor Exhibit to Ethereum"}
          </button>
        </div>
      )}

      {anchorSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{anchorSuccessMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-600 font-medium text-xs shadow-xs">
          <div className="w-8 h-8 border-3 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent rounded-full animate-spin mb-3"></div>
          Querying Ethereum JSON-RPC blockchain records...
        </div>
      ) : chainData ? (
        <div className="space-y-6">
          
          {/* Main Registration Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            
            {/* Top Status Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                  EVIDENCE REGISTRATION RECORD
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedEvidence?.evidenceName}</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Case Reference: <strong className="text-slate-800">{selectedEvidence?.case?.caseNumber || "CASE-FILE"}</strong> &bull; {selectedEvidence?.case?.title || "Investigation Case"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                  chainData.recordStatus === "RECORD_CONFIRMED_ON_CHAIN"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : chainData.recordStatus === "RECORD_PREVIOUS_CHAIN_UNVERIFIABLE"
                    ? "bg-purple-50 text-purple-700 border-purple-300"
                    : chainData.recordStatus === "RECORD_NOT_ANCHORED_ON_CHAIN"
                    ? "bg-amber-50 text-amber-700 border-amber-300"
                    : chainData.contractStatus === "CONTRACT_NOT_DEPLOYED"
                    ? "bg-amber-50 text-amber-700 border-amber-300"
                    : "bg-slate-100 text-slate-600 border-slate-300"
                }`}>
                  <span className={`h-2 w-2 rounded-full ${
                    chainData.recordStatus === "RECORD_CONFIRMED_ON_CHAIN" 
                      ? "bg-emerald-500" 
                      : chainData.recordStatus === "RECORD_PREVIOUS_CHAIN_UNVERIFIABLE"
                      ? "bg-purple-500"
                      : "bg-amber-500"
                  }`}></span>
                  {chainData.recordStatus === "RECORD_CONFIRMED_ON_CHAIN" 
                    ? "ON-CHAIN CONFIRMED (ETHEREUM)" 
                    : chainData.recordStatus === "RECORD_PREVIOUS_CHAIN_UNVERIFIABLE"
                    ? "PREVIOUS CHAIN (UNVERIFIED)"
                    : chainData.contractStatus === "CONTRACT_NOT_DEPLOYED"
                    ? "CONTRACT NOT DEPLOYED"
                    : chainData.recordStatus === "RECORD_NOT_ANCHORED_ON_CHAIN"
                    ? "DATABASE SEALED — NOT ANCHORED"
                    : chainData.recordStatus || "STANDBY"}
                </span>
                
                <button
                  onClick={() => setTxDetailsModalOpen(true)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View Transaction Details
                </button>
              </div>
            </div>

            {/* Core Registration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="text-[10px] uppercase font-sans text-slate-400 block font-semibold">Blockchain Network</span>
                <span className="font-bold text-slate-900 block truncate">
                  {chainData.nodeStatus === "OPERATIONAL" ? "Ethereum Local Node" : "Node Standby"}
                </span>
                <span className="text-[10px] text-blue-700 font-sans block">Chain ID: 1337</span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="text-[10px] uppercase font-sans text-slate-400 block font-semibold">Block Height</span>
                <span className="font-bold text-slate-900 block font-mono text-sm">
                  {chainData.transaction?.blockNumber ? `#${chainData.transaction.blockNumber}` : "Not available (unanchored)"}
                </span>
                <span className="text-[10px] text-slate-500 font-sans block">
                  {chainData.transaction?.confirmations != null ? `${chainData.transaction.confirmations} block confirmations` : "Awaiting blockchain confirmation"}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="text-[10px] uppercase font-sans text-slate-400 block font-semibold">Database Registration</span>
                <span className="font-bold text-slate-900 block truncate">
                  {selectedEvidence?.createdAt ? new Date(selectedEvidence.createdAt).toLocaleDateString() : "N/A"}
                </span>
                <span className="text-[10px] text-slate-500 font-sans block">
                  {selectedEvidence?.createdAt ? new Date(selectedEvidence.createdAt).toLocaleTimeString() : ""}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="text-[10px] uppercase font-sans text-slate-400 block font-semibold">Evidence Storage</span>
                <span className="font-bold text-purple-700 block truncate" title={selectedEvidence?.ipfsCid}>
                  {selectedEvidence?.ipfsCid ? selectedEvidence.ipfsCid.substring(0, 16) + "..." : "Encrypted Storage"}
                </span>
                <span className="text-[10px] text-slate-500 font-sans block">Content-Addressed (IPFS)</span>
              </div>
            </div>

            {/* Cryptographic Hash Section */}
            <div className="space-y-3 font-mono text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-[10px] uppercase font-sans text-slate-500 font-bold">
                  <span>Registered SHA-256 Digest (ProofShield Database):</span>
                  <button
                    onClick={() => handleCopy(selectedEvidence?.fileHash, "hash")}
                    className="text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer normal-case"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copiedHash ? "Copied" : "Copy Digest"}
                  </button>
                </div>
                <span className="text-slate-900 break-all select-all font-bold block bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                  {selectedEvidence?.fileHash}
                </span>
              </div>

              {/* Transaction Hash */}
              <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-[10px] uppercase font-sans text-purple-900 font-bold">
                  <span>Ethereum Transaction Hash:</span>
                  {chainData.transaction?.txHash && (
                    <button
                      onClick={() => handleCopy(chainData.transaction?.txHash, "tx")}
                      className="text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer normal-case"
                    >
                      {copiedTx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copiedTx ? "Copied" : "Copy Transaction Hash"}
                    </button>
                  )}
                </div>
                <span className="text-purple-950 break-all select-all font-bold block bg-white p-2.5 rounded-lg border border-purple-200 text-xs">
                  {chainData.transaction?.txHash || "Not available (Not anchored on Ethereum smart contract)"}
                </span>
              </div>
            </div>

            {/* Investigator Guidance Note */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Legal Forensics Architecture:</strong> The raw binary evidence payload is stored in secure content-addressed storage. The Ethereum blockchain records the immutable SHA-256 cryptographic digest, acquisition timestamp, and case reference — establishing an unalterable proof of existence and chain of custody without exposing sensitive evidentiary media on-chain.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 bg-white border border-dashed border-slate-300 rounded-xl text-center text-slate-400 text-xs shadow-xs">
          Select an evidence record from the dropdown above to query its on-chain blockchain registration.
        </div>
      )}

      {/* View Transaction Details Modal */}
      {txDetailsModalOpen && chainData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white border border-slate-300 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setTxDetailsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-200 pb-3 mb-4 flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-center border border-purple-200">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Blockchain Transaction Receipt</h3>
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  Ethereum Node JSON-RPC Transaction State
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Transaction Status:</span>
                  <span className={`font-bold uppercase ${
                    chainData.recordStatus === "RECORD_CONFIRMED_ON_CHAIN" ? "text-emerald-700" : "text-amber-700"
                  }`}>
                    {chainData.recordStatus === "RECORD_CONFIRMED_ON_CHAIN" 
                      ? "ON-CHAIN CONFIRMED" 
                      : chainData.recordStatus === "RECORD_NOT_ANCHORED_ON_CHAIN"
                      ? "NOT ANCHORED"
                      : "UNAVAILABLE"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Block Height:</span>
                  <span className="font-bold text-slate-900">
                    {chainData.transaction?.blockNumber ? `#${chainData.transaction.blockNumber}` : "Not available"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Confirmations:</span>
                  <span className="text-slate-800">
                    {chainData.transaction?.confirmations != null ? `${chainData.transaction.confirmations} Blocks` : "Not available"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Gas Consumed:</span>
                  <span className="text-slate-800">
                    {chainData.transaction?.gasUsed ? `${chainData.transaction.gasUsed} units` : "Not available"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Chain ID:</span>
                  <span className="text-blue-700 font-bold">1337 (Local Hardhat Node)</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-sans text-slate-400 font-bold block mb-1">
                  Full Transaction Hash:
                </span>
                <span className="p-2.5 bg-slate-100 rounded border border-slate-200 text-purple-900 font-bold break-all block text-[11px]">
                  {chainData.transaction?.txHash || "Not available (Not anchored on-chain)"}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-sans text-slate-400 font-bold block mb-1">
                  Cryptographic Evidence Hash Anchored On-Chain:
                </span>
                <span className="p-2.5 bg-slate-100 rounded border border-slate-200 text-slate-900 font-bold break-all block text-[11px]">
                  {chainData.blockchain?.fileHash || "Not yet written to smart contract"}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setTxDetailsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainRecords;