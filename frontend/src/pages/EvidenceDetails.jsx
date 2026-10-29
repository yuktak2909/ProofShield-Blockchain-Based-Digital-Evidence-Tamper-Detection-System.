import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { 
  FileCheck, 
  Search, 
  ArrowLeft, 
  ShieldCheck, 
  Cpu, 
  UploadCloud, 
  History, 
  Download, 
  ExternalLink,
  ChevronRight,
  RefreshCw,
  FolderOpen,
  Send,
  Calendar,
  MapPin,
  FileText
} from "lucide-react";

const EvidenceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  // General Vault List State
  const [evidenceList, setEvidenceList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [listLoading, setListLoading] = useState(true);

  // Single Item Details State
  const [evidence, setEvidence] = useState(null);
  const [dbHistory, setDbHistory] = useState([]);
  const [blockchainHistory, setBlockchainHistory] = useState([]);
  const [verificationLogs, setVerificationLogs] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("custody"); // custody, verifications, details

  // Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [targetUserId, setTargetUserId] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState("");

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // -------------------------------------------------------------
  // FETCH LIST DATA
  // -------------------------------------------------------------
  const fetchEvidenceList = async () => {
    setListLoading(true);
    try {
      const response = await axios.get("/api/evidence", {
        params: {
          search: searchTerm,
          fileType: filterType
        }
      });
      setEvidenceList(response.data);
    } catch (err) {
      console.error("Failed to load evidence catalog");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      fetchEvidenceList();
    }
  }, [id, searchTerm, filterType]);

  // -------------------------------------------------------------
  // FETCH SINGLE DETAIL DATA
  // -------------------------------------------------------------
  const fetchEvidenceDetails = async (evidenceId) => {
    setDetailsLoading(true);
    try {
      const detailRes = await axios.get(`/api/evidence/${evidenceId}`);
      setEvidence(detailRes.data);

      const custodyRes = await axios.get(`/api/evidence/${evidenceId}/custody`);
      setDbHistory(custodyRes.data.databaseHistory || []);
      setBlockchainHistory(custodyRes.data.blockchainHistory || []);

      const verifyRes = await axios.get(`/api/evidence/${evidenceId}/verifications`);
      setVerificationLogs(verifyRes.data || []);
    } catch (err) {
      console.error("Failed to load evidence details:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEvidenceDetails(id);
    }
  }, [id, refreshTrigger]);

  // -------------------------------------------------------------
  // VIEW / DOWNLOAD / TRANSFER ACTIONS
  // -------------------------------------------------------------
  const handleViewFile = async () => {
    if (!evidence) return;
    try {
      // Log the viewed event
      await axios.post(`/api/evidence/${evidence.id}/view`);
      // Open file in new tab
      window.open(`/api/evidence/mock-ipfs/${evidence.ipfsCid}`, "_blank");
      setRefreshTrigger(p => p + 1);
    } catch (err) {
      console.error("Failed to log view event");
    }
  };

  const handleDownloadFile = async () => {
    if (!evidence) return;
    try {
      // Log the downloaded event
      await axios.post(`/api/evidence/${evidence.id}/download`);
      
      // Programmatically trigger download
      const link = document.createElement("a");
      link.href = `/api/evidence/mock-ipfs/${evidence.ipfsCid}`;
      link.setAttribute("download", evidence.evidenceName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      setRefreshTrigger(p => p + 1);
    } catch (err) {
      console.error("Failed to log download event");
    }
  };

  const openTransferModal = async () => {
    setShowTransferModal(true);
    setTransferError("");
    try {
      const response = await axios.get("/api/admin/users");
      // Filter out self and make list
      const otherUsers = response.data.filter(u => u.id !== user.id);
      setUsers(otherUsers);
    } catch (err) {
      setTransferError("Could not retrieve list of active system users.");
    }
  };

  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    if (!targetUserId) return;
    
    setTransferLoading(true);
    setTransferError("");
    try {
      await axios.post(`/api/evidence/${evidence.id}/transfer`, {
        newCustodianId: targetUserId
      });
      setShowTransferModal(false);
      setTargetUserId("");
      setRefreshTrigger(p => p + 1);
    } catch (err) {
      setTransferError(err.response?.data?.error || "Custody transfer execution failed.");
    } finally {
      setTransferLoading(false);
    }
  };

  // -------------------------------------------------------------
  // DETAIL VIEW COMPONENT
  // -------------------------------------------------------------
  if (id) {
    if (detailsLoading && !evidence) {
      return (
        <div className="py-24 flex flex-col items-center justify-center text-cyan-400 font-mono text-xs">
          <div className="w-8 h-8 border-3 border-t-cyan-400 border-r-transparent border-b-cyan-400 border-l-transparent rounded-full animate-spin mb-3"></div>
          LOADING DOSSIER ENCRYPTED SEALS...
        </div>
      );
    }

    if (!evidence) {
      return (
        <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-lg text-red-400 text-xs">
          Evidence not found or database sync failed.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Breadcrumb Header */}
        <button
          onClick={() => navigate("/evidence")}
          className="flex items-center gap-2 text-sm text-cyber-muted hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Evidence Vault Catalog
        </button>

        {/* Dossier Header */}
        <div className="bg-[#151B2C]/60 border border-[#1F2937] p-6 md:p-8 rounded-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 border border-cyan-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-semibold bg-cyan-950/30 text-cyan-400 border border-cyan-900/30 px-2 py-0.5 rounded inline-block mb-1">
                FILE SECURED
              </span>
              <h2 className="text-xl font-tech font-bold text-cyan-100">{evidence.evidenceName}</h2>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-cyber-muted">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Sealed: {new Date(evidence.submittedAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Recovered: {evidence.location || "Unknown Location"}
                </span>
                <span className="font-mono text-[10px] bg-[#111827] px-2 py-0.5 rounded border border-gray-800">
                  Ref: {evidence.case?.caseNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleViewFile}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#151B2C] hover:bg-[#151B2C]/80 border border-[#1F2937] text-cyan-400 font-semibold rounded-lg text-xs transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Asset
            </button>
            <button
              onClick={handleDownloadFile}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#151B2C] hover:bg-[#151B2C]/80 border border-[#1F2937] text-cyan-400 font-semibold rounded-lg text-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <Link
              to={`/verify?evidenceId=${evidence.id}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Verify Integrity
            </Link>
            
            {/* Custody Transfer - Restricted to currentCustodian or admin */}
            {(evidence.currentCustodian === user.id || user.role === "admin") && (
              <button
                onClick={openTransferModal}
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold rounded-lg text-xs transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Transfer Custody
              </button>
            )}
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Columns - Details Tab */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tabs */}
            <div className="border-b border-gray-800 flex gap-4 text-xs font-semibold uppercase tracking-wider">
              <button
                onClick={() => setActiveTab("custody")}
                className={`pb-3 ${activeTab === "custody" ? "border-b-2 border-cyan-400 text-cyan-400" : "text-cyber-muted hover:text-cyan-200"}`}
              >
                Chain of Custody Timeline
              </button>
              <button
                onClick={() => setActiveTab("verifications")}
                className={`pb-3 ${activeTab === "verifications" ? "border-b-2 border-cyan-400 text-cyan-400" : "text-cyber-muted hover:text-cyan-200"}`}
              >
                Audit Log ({verificationLogs.length})
              </button>
              <button
                onClick={() => setActiveTab("details")}
                className={`pb-3 ${activeTab === "details" ? "border-b-2 border-cyan-400 text-cyan-400" : "text-cyber-muted hover:text-cyan-200"}`}
              >
                Technical Specifications
              </button>
            </div>

            {/* Tab: Custody Timeline */}
            {activeTab === "custody" && (
              <div className="bg-[#151B2C]/40 border border-[#1F2937] p-6 rounded-xl space-y-8 relative">
                <div className="absolute left-[33px] top-8 bottom-8 w-0.5 bg-gray-800"></div>

                {dbHistory.map((log, idx) => {
                  const isTransfer = log.action === "transferred";
                  
                  return (
                    <div key={log.id} className="relative flex items-start gap-6 group">
                      
                      {/* Circle Dot */}
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold z-10 border transition-all ${
                        log.action === "transferred" 
                          ? "bg-purple-950/40 text-purple-400 border-purple-500/20"
                          : log.action === "downloaded"
                            ? "bg-cyan-950/40 text-cyan-400 border-cyan-500/20"
                            : "bg-gray-950 text-gray-400 border-gray-800"
                      }`}>
                        {idx + 1}
                      </span>

                      <div className="flex-1 bg-[#111827]/40 border border-[#1F2937] hover:border-gray-800 p-4 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 mb-2">
                          <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-cyan-400 bg-cyan-950/20 px-2 py-0.5 rounded">
                            {log.action}
                          </span>
                          <span className="text-[10px] font-mono text-cyber-muted">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <p className="text-xs text-cyan-100">
                          Executed by <span className="font-semibold text-cyan-400">{log.actor?.name}</span> ({log.actor?.role})
                        </p>
                        
                        {isTransfer && (
                          <p className="text-xs text-gray-400 mt-1">
                            Custody transitioned from <span className="text-cyan-200">{log.prevCustodian?.name}</span> to <span className="text-cyan-200">{log.nextCustodian?.name}</span>
                          </p>
                        )}

                        {log.blockchainTxId && (
                          <div className="mt-3 pt-2.5 border-t border-gray-800/80 text-[10px] font-mono text-cyber-muted truncate" title={log.blockchainTxId}>
                            BLOCKCHAIN TX: <span className="text-purple-400 select-all">{log.blockchainTxId}</span>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab: Verification Logs */}
            {activeTab === "verifications" && (
              <div className="bg-[#151B2C]/40 border border-[#1F2937] p-6 rounded-xl">
                {verificationLogs.length === 0 ? (
                  <div className="text-center py-12 text-cyber-muted text-xs">
                    No verification checks have been logged for this evidence.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-800 text-cyber-muted uppercase">
                          <th className="py-2 px-2">Auditor</th>
                          <th className="py-2 px-2">Timestamp</th>
                          <th className="py-2 px-2">Calculated Hash snippet</th>
                          <th className="py-2 px-2 text-right">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/40">
                        {verificationLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-800/20">
                            <td className="py-3 px-2 font-semibold text-cyan-100">{log.verifier?.name}</td>
                            <td className="py-3 px-2 text-gray-400 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="py-3 px-2 text-cyber-muted font-mono" title={log.submittedHash}>
                              {log.submittedHash.substring(0, 16)}...
                            </td>
                            <td className="py-3 px-2 text-right">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                log.result === "verified" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400 animate-pulse"
                              }`}>
                                {log.result.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Technical Specs */}
            {activeTab === "details" && (
              <div className="bg-[#151B2C]/40 border border-[#1F2937] p-6 rounded-xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 bg-[#111827]/40 rounded border border-gray-800">
                    <span className="text-[10px] text-cyber-muted block">Evidence File Name</span>
                    <span className="text-cyan-200 font-semibold">{evidence.evidenceName}</span>
                  </div>
                  <div className="p-3 bg-[#111827]/40 rounded border border-gray-800">
                    <span className="text-[10px] text-cyber-muted block">Database UUID</span>
                    <span className="text-cyan-200 select-all truncate block">{evidence.id}</span>
                  </div>
                  <div className="p-3 bg-[#111827]/40 rounded border border-gray-800">
                    <span className="text-[10px] text-cyber-muted block">Payload Format</span>
                    <span className="text-cyan-200">{evidence.fileType}</span>
                  </div>
                  <div className="p-3 bg-[#111827]/40 rounded border border-gray-800">
                    <span className="text-[10px] text-cyber-muted block">Payload Size</span>
                    <span className="text-cyan-200">{(evidence.fileSize / (1024 * 1024)).toFixed(2)} MB ({evidence.fileSize} bytes)</span>
                  </div>
                  <div className="p-3 bg-[#111827]/40 rounded border border-gray-800 sm:col-span-2">
                    <span className="text-[10px] text-cyber-muted block">SHA-256 Checksum Fingerprint</span>
                    <span className="text-emerald-400 break-all select-all font-semibold block">{evidence.fileHash}</span>
                  </div>
                  <div className="p-3 bg-[#111827]/40 rounded border border-gray-800 sm:col-span-2">
                    <span className="text-[10px] text-cyber-muted block">IPFS Gateway Storage CID</span>
                    <span className="text-cyan-200 break-all select-all block">{evidence.ipfsCid}</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Column - Blockchain Seal Overview */}
          <div className="space-y-6">
            <div className="bg-[#151B2C]/40 border border-[#1F2937] p-6 rounded-xl space-y-4">
              <h3 className="font-tech text-xs tracking-wider uppercase text-cyan-400 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Immutable Blockchain Seal
              </h3>

              <div className="space-y-3.5 text-xs font-mono">
                <div className="p-3 bg-[#111827]/50 rounded border border-purple-500/10">
                  <span className="text-[10px] text-cyber-muted block">Status State</span>
                  <span className="text-emerald-400 font-semibold uppercase">{evidence.status}</span>
                </div>
                
                <div>
                  <span className="text-[10px] text-cyber-muted block">Sealing Node Wallet</span>
                  <span className="text-cyan-200 break-all text-[11px] block">{evidence.submitter?.walletAddress || "None"}</span>
                </div>
                
                <div>
                  <span className="text-[10px] text-cyber-muted block">Current Custodian Wallet</span>
                  <span className="text-cyan-200 break-all text-[11px] block">{evidence.custodian?.walletAddress || "None"}</span>
                </div>

                <div>
                  <span className="text-[10px] text-cyber-muted block">Registered Submitter</span>
                  <span className="text-cyan-200 block font-sans font-semibold">{evidence.submitter?.name}</span>
                </div>

                <div>
                  <span className="text-[10px] text-cyber-muted block">Current Custodian</span>
                  <span className="text-cyan-200 block font-sans font-semibold">{evidence.custodian?.name}</span>
                </div>

                <div className="pt-2 border-t border-gray-800/60">
                  <span className="text-[10px] text-cyber-muted block">Transaction Coordinates</span>
                  <span className="text-purple-400 break-all text-[11px] select-all block" title={evidence.blockchainTxId}>
                    {evidence.blockchainTxId || "Pending Execution..."}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Transfer Custody Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-[#111827] border border-[#1F2937] rounded-xl shadow-2xl p-6">
              <h3 className="font-tech text-base font-bold text-cyan-400 mb-2 uppercase">Transfer Chain of Custody</h3>
              <p className="text-xs text-gray-400 mb-6">
                Select a qualified investigator or analyst to transfer custody of <span className="font-mono text-cyan-300 font-semibold">{evidence.evidenceName}</span>. This executes an on-chain transaction.
              </p>

              {transferError && (
                <div className="mb-4 p-3 bg-red-950/20 border border-red-500/30 rounded text-red-400 text-xs">
                  {transferError}
                </div>
              )}

              <form onSubmit={handleExecuteTransfer} className="space-y-4">
                <div>
                  <label className="text-[10px] text-cyber-muted font-semibold uppercase block mb-1">Target Custodian</label>
                  <select
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full bg-[#151B2C] border border-[#1F2937] focus:border-cyan-400 rounded-lg px-4 py-2.5 text-xs text-gray-100 focus:outline-none"
                    required
                  >
                    <option value="">-- SELECT TARGET USER --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="px-4 py-2 border border-gray-800 hover:bg-gray-800 rounded-lg text-xs font-semibold text-cyber-muted hover:text-gray-100"
                    disabled={transferLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={transferLoading || !targetUserId}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold rounded-lg text-xs tracking-wide flex items-center gap-1.5"
                  >
                    {transferLoading ? (
                      <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Execute Transfer"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // CATALOG LIST VIEW
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-tech font-bold text-cyan-400 tracking-wide">DIGITAL EVIDENCE VAULT</h2>
          <p className="text-xs text-cyber-muted">Cryptographic catalog matching searchable database indexes with blockchain records.</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#151B2C]/40 border border-[#1F2937] p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-cyber-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by file name, file hash, CID..."
            className="w-full bg-[#151B2C] border border-[#1F2937] focus:border-cyan-400 rounded-lg pl-10 pr-4 py-2.5 text-xs text-gray-100 focus:outline-none"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-[#151B2C] border border-[#1F2937] focus:border-cyan-400 rounded-lg px-4 py-2.5 text-xs text-gray-100 focus:outline-none"
          >
            <option value="">All Formats</option>
            <option value="image/">Images</option>
            <option value="video/">Videos</option>
            <option value="application/pdf">PDFs</option>
            <option value="text/plain">Log/Text Files</option>
          </select>
        </div>
      </div>

      {/* Vault Catalog Table */}
      {listLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-cyan-400 font-mono text-xs">
          <div className="w-8 h-8 border-3 border-t-cyan-400 border-r-transparent border-b-cyan-400 border-l-transparent rounded-full animate-spin mb-3"></div>
          SYNCING DIGITAL CATALOGUE...
        </div>
      ) : evidenceList.length === 0 ? (
        <div className="py-24 border border-dashed border-gray-800 rounded-xl flex flex-col items-center justify-center text-gray-500">
          <FolderOpen className="w-12 h-12 text-cyber-muted mb-2 animate-bounce" />
          <p className="text-sm font-semibold">No secure evidence records match your search filters.</p>
        </div>
      ) : (
        <div className="bg-[#151B2C]/30 border border-[#1F2937] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-[#111827]/40 text-cyber-muted uppercase tracking-wider">
                  <th className="py-3.5 px-6">Case Ref</th>
                  <th className="py-3.5 px-6">Evidence File Name</th>
                  <th className="py-3.5 px-6">Mime Type</th>
                  <th className="py-3.5 px-6">File SHA-256 Fingerprint</th>
                  <th className="py-3.5 px-6">Custodian</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {evidenceList.map((item) => (
                  <tr key={item.id} className="hover:bg-[#151B2C]/20 transition-colors">
                    <td className="py-4 px-6 font-mono font-semibold text-cyan-400">
                      {item.case?.caseNumber}
                    </td>
                    <td className="py-4 px-6 font-semibold text-cyan-100 truncate max-w-[200px]" title={item.evidenceName}>
                      {item.evidenceName}
                    </td>
                    <td className="py-4 px-6 text-gray-400 font-mono">{item.fileType}</td>
                    <td className="py-4 px-6 text-cyber-muted font-mono" title={item.fileHash}>
                      {item.fileHash.substring(0, 16)}...
                    </td>
                    <td className="py-4 px-6 text-cyan-200">{item.custodian?.name}</td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/evidence/${item.id}`}
                        className="px-3 py-1.5 bg-[#151B2C] hover:bg-cyan-500 hover:text-gray-950 border border-cyan-900/40 hover:border-cyan-400 text-cyan-400 rounded font-semibold transition-all inline-flex items-center gap-1"
                      >
                        Inspect Dossier
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceDetails;
