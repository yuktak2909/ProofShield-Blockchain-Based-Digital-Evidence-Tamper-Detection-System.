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
  Send,
  Calendar,
  MapPin,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  FileSearch,
  Hash
} from "lucide-react";

const EvidenceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // General Vault List State
  const [evidenceList, setEvidenceList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [listLoading, setListLoading] = useState(true);

  // Single Item Details State
  const [evidence, setEvidence] = useState(null);
  const [dbHistory, setDbHistory] = useState([]);
  const [verificationLogs, setVerificationLogs] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("custody"); // custody, verifications, specs

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
  // DOWNLOAD / TRANSFER ACTIONS
  // -------------------------------------------------------------
  const handleDownloadFile = async () => {
    if (!evidence) return;
    try {
      await axios.post(`/api/evidence/${evidence.id}/download`);
      
      const link = document.createElement("a");
      link.href = `/api/evidence/mock-ipfs/${evidence.ipfsCid}?download=true`;
      link.setAttribute("download", evidence.evidenceName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      setRefreshTrigger(p => p + 1);
    } catch (err) {
      console.error("Failed to log download event:", err);
    }
  };

  const openTransferModal = async () => {
    setShowTransferModal(true);
    setTransferError("");
    try {
      const response = await axios.get("/api/admin/users");
      const otherUsers = response.data.filter(u => u.id !== user.id);
      setUsers(otherUsers);
    } catch (err) {
      setTransferError("Could not retrieve system users list.");
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
      setTransferError(err.response?.data?.error || "Custody transfer failed.");
    } finally {
      setTransferLoading(false);
    }
  };

  // -------------------------------------------------------------
  // DETAIL VIEW
  // -------------------------------------------------------------
  if (id) {
    if (detailsLoading && !evidence) {
      return (
        <div className="py-24 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-600 font-medium text-xs">
          <div className="w-8 h-8 border-3 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent rounded-full animate-spin mb-3"></div>
          RETRIEVING ENCRYPTED DOSSIER SPECIFICATIONS...
        </div>
      );
    }

    if (!evidence) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Evidence file not found in database index.
        </div>
      );
    }

    const fileUrl = `/api/evidence/mock-ipfs/${evidence.ipfsCid}`;
    const isGif = evidence.fileType === "image/gif";
    const isVideo = !isGif && evidence.fileType?.startsWith("video/");
    const isAudio = evidence.fileType?.startsWith("audio/");
    const isPdf = evidence.fileType === "application/pdf";
    const isImage = !isGif && evidence.fileType?.startsWith("image/");

    return (
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <button
          onClick={() => navigate("/evidence")}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Evidence Vault Catalog
        </button>

        {/* Dossier Header Card */}
        <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-xl shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center text-blue-700 flex-shrink-0">
              {isVideo ? <Video className="w-7 h-7" /> : isAudio ? <Music className="w-7 h-7" /> : isPdf ? <FileText className="w-7 h-7" /> : <FileCheck className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                  {evidence.case?.caseNumber || "CASE"}
                </span>
                <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                  IMMUTABLE STATUS: {evidence.status}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{evidence.evidenceName}</h2>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Sealed On: {new Date(evidence.submittedAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Location: {evidence.location || "Central Evidence Recovery Locker"}
                </span>
                <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  Size: {(evidence.fileSize / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleDownloadFile}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs transition-all shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Asset
            </button>

            {/* Direct Chain of Custody Button */}
            <Link
              to={`/custody?evidenceId=${evidence.id}`}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold rounded-lg text-xs transition-all shadow-2xs"
            >
              <History className="w-3.5 h-3.5 text-purple-600" />
              Chain of Custody
            </Link>

            {/* Verify Integrity Button */}
            <Link
              to={`/verify?evidenceId=${evidence.id}`}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-all shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Verify Checksum
            </Link>
            
            {/* Custody Transfer Button */}
            {(evidence.currentCustodian === user?.id || user?.role === "admin") && (
              <button
                onClick={openTransferModal}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Transfer Custody
              </button>
            )}
          </div>
        </div>

        {/* EMBEDDED FORENSIC MEDIA VIEWER */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              Embedded Forensic Evidence Preview
            </h3>
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1"
            >
              Open Direct Gateway Link
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center">
            {isGif && (
              <div className="w-full max-w-2xl">
                <img
                  src={fileUrl}
                  alt={evidence.evidenceName}
                  className="w-full max-h-[400px] rounded-lg border border-slate-800 shadow-md object-cover bg-black"
                />
                <p className="text-center text-[11px] text-slate-500 font-mono mt-2">
                  Animated CCTV Surveillance Feed &bull; SHA-256 Verified Binary
                </p>
              </div>
            )}

            {isVideo && (
              <div className="w-full max-w-2xl">
                <video
                  controls
                  className="w-full rounded-lg bg-black shadow-md border border-slate-800"
                  src={fileUrl}
                >
                  Your browser does not support video playback.
                </video>
                <p className="text-center text-[11px] text-slate-500 font-mono mt-2">
                  Direct H.264 Surveillance Feed Stream &bull; SHA-256 Verified Binary
                </p>
              </div>
            )}

            {isAudio && (
              <div className="w-full max-w-xl p-4 bg-white rounded-lg border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Music className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{evidence.evidenceName}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">Audio Stream &bull; {evidence.fileType}</span>
                  </div>
                </div>
                <audio controls className="w-full" src={fileUrl}>
                  Your browser does not support audio playback.
                </audio>
              </div>
            )}

            {isPdf && (
              <div className="w-full">
                <iframe
                  src={fileUrl}
                  title="PDF Evidence Preview"
                  className="w-full h-[500px] rounded-lg border border-slate-300 shadow-inner bg-white"
                />
              </div>
            )}

            {isImage && (
              <div className="max-w-2xl">
                <img
                  src={fileUrl}
                  alt={evidence.evidenceName}
                  className="max-h-[420px] rounded-lg border border-slate-300 shadow-md object-contain bg-slate-900"
                />
              </div>
            )}

            {!isGif && !isVideo && !isAudio && !isPdf && !isImage && (
              <div className="py-8 text-center text-slate-500 text-xs">
                <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">{evidence.evidenceName}</p>
                <p className="text-[11px] text-slate-400 mt-1">Binary file preview not rendered inline. Use "Download Asset" to inspect locally.</p>
              </div>
            )}
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Tabs (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Tabs */}
            <div className="border-b border-slate-200 flex gap-4 text-xs font-bold uppercase tracking-wider">
              <button
                onClick={() => setActiveTab("custody")}
                className={`pb-3 cursor-pointer ${activeTab === "custody" ? "border-b-2 border-blue-700 text-blue-700" : "text-slate-500 hover:text-slate-800"}`}
              >
                Custody Events ({dbHistory.length})
              </button>
              <button
                onClick={() => setActiveTab("verifications")}
                className={`pb-3 cursor-pointer ${activeTab === "verifications" ? "border-b-2 border-blue-700 text-blue-700" : "text-slate-500 hover:text-slate-800"}`}
              >
                Integrity Audits ({verificationLogs.length})
              </button>
              <button
                onClick={() => setActiveTab("specs")}
                className={`pb-3 cursor-pointer ${activeTab === "specs" ? "border-b-2 border-blue-700 text-blue-700" : "text-slate-500 hover:text-slate-800"}`}
              >
                Cryptographic Hashes & Technical Specs
              </button>
            </div>

            {/* Tab: Custody Events */}
            {activeTab === "custody" && (
              <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-6 shadow-xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Audit Trail Log</h4>
                  <Link to={`/custody?evidenceId=${evidence.id}`} className="text-xs font-semibold text-blue-700 hover:underline">
                    Open Full Chain of Custody Page &rarr;
                  </Link>
                </div>

                <div className="space-y-4">
                  {dbHistory.map((log, idx) => (
                    <div key={log.id || idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                            {log.action}
                          </span>
                          <span className="text-xs font-semibold text-slate-900">
                            by {log.actor?.name || "Authorized User"}
                          </span>
                        </div>
                        {log.action === "transferred" && (
                          <p className="text-xs text-slate-600 mt-1">
                            Handoff: <span className="font-semibold">{log.prevCustodian?.name}</span> &rarr; <span className="font-semibold text-blue-700">{log.nextCustodian?.name}</span>
                          </p>
                        )}
                        {log.blockchainTxId && (
                          <span className="text-[10px] font-mono text-purple-700 block mt-1 truncate max-w-md">
                            TX: {log.blockchainTxId}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 flex-shrink-0">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Verifications */}
            {activeTab === "verifications" && (
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 border-b border-slate-100 pb-3">
                  Historical Verification Checks
                </h4>

                {verificationLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No integrity checks logged yet for this item.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                          <th className="py-2.5 px-3">Auditor</th>
                          <th className="py-2.5 px-3">Timestamp</th>
                          <th className="py-2.5 px-3">Submitted Checksum Snippet</th>
                          <th className="py-2.5 px-3 text-right">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {verificationLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="py-3 px-3 font-semibold text-slate-800">{log.verifier?.name || "Auditor"}</td>
                            <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="py-3 px-3 font-mono text-slate-600 text-[11px]" title={log.submittedHash}>
                              {log.submittedHash.substring(0, 16)}...
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                log.result === "verified" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                              }`}>
                                {log.result}
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
            {activeTab === "specs" && (
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
                  Cryptographic Specifications
                </h4>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">SHA-256 Cryptographic Checksum</span>
                    <span className="font-bold text-slate-900 break-all select-all">{evidence.fileHash}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">IPFS Content Identifier (CID v0)</span>
                    <span className="font-bold text-blue-700 break-all select-all">{evidence.ipfsCid}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">Ethereum Smart Contract Receipt Tx</span>
                    <span className="font-bold text-purple-700 break-all select-all">{evidence.blockchainTxId}</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Summary Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Cpu className="w-4 h-4 text-blue-700" />
                Ledger Identity Attributes
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Case Number</span>
                  <span className="font-bold text-slate-800">{evidence.case?.caseNumber}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Original Submitter</span>
                  <span className="font-semibold text-slate-800">{evidence.submitter?.name}</span>
                  <span className="text-[10px] font-mono text-slate-500 block truncate">{evidence.submitter?.walletAddress || "Unassigned"}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Current Custodian</span>
                  <span className="font-semibold text-blue-700">{evidence.custodian?.name}</span>
                  <span className="text-[10px] font-mono text-slate-500 block truncate">{evidence.custodian?.walletAddress || "Unassigned"}</span>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Investigative Notes</span>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                    {evidence.description || "No additional notes filed."}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Transfer Custody Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-2xl p-6">
              <h3 className="text-base font-bold text-slate-900 mb-1">Transfer Chain of Custody</h3>
              <p className="text-xs text-slate-500 mb-5">
                Executing this transfer writes an immutable record to the Solidity smart contract and updates the designated custodian for <span className="font-bold text-slate-800">{evidence.evidenceName}</span>.
              </p>

              {transferError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                  {transferError}
                </div>
              )}

              <form onSubmit={handleExecuteTransfer} className="space-y-4">
                <div>
                  <label className="text-[11px] text-slate-600 font-bold uppercase block mb-1">Select Qualified Transferee</label>
                  <select
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none"
                    required
                  >
                    <option value="">-- Choose Recipient Officer / Official --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                    disabled={transferLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={transferLoading || !targetUserId}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs tracking-wide shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {transferLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Sign & Execute Transfer"
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
            Central Judicial Repository
          </span>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Digital Evidence Vault</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically sealed repository associating searchable case metadata with immutable blockchain transaction proofs.
          </p>
        </div>

        <Link
          to="/register"
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs shadow-xs transition-all flex items-center gap-1.5"
        >
          <UploadCloud className="w-4 h-4" />
          Register Evidence File
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vault by file name, SHA-256 checksum, or case reference..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-lg pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none"
          />
        </div>
        <div className="w-full sm:w-56">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
          >
            <option value="">All Forensic Formats</option>
            <option value="video/">CCTV & Surveillance Videos</option>
            <option value="audio/">Dispatch & Audio Recordings</option>
            <option value="application/pdf">Forensic PDF Reports</option>
            <option value="image/">Scene Photographs (JPG/PNG)</option>
            <option value="text/plain">Server Logs & Text Dumps</option>
          </select>
        </div>
      </div>

      {/* Catalog Table */}
      {listLoading ? (
        <div className="py-24 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-600 font-medium text-xs">
          <div className="w-8 h-8 border-3 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent rounded-full animate-spin mb-3"></div>
          SYNCING VAULT CATALOG WITH ON-CHAIN LEDGER...
        </div>
      ) : evidenceList.length === 0 ? (
        <div className="py-24 bg-white border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 shadow-xs">
          <FileCheck className="w-12 h-12 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No evidence records matched your search parameters.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-5">Case Number</th>
                  <th className="py-3 px-5">Evidence Item</th>
                  <th className="py-3 px-5">Format</th>
                  <th className="py-3 px-5">Cryptographic Fingerprint (SHA-256)</th>
                  <th className="py-3 px-5">Custodian</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evidenceList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-blue-700">
                      {item.case?.caseNumber}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-900">
                      {item.evidenceName}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px]">
                      {item.fileType}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-mono text-[11px]" title={item.fileHash}>
                      {item.fileHash.substring(0, 16)}...
                    </td>
                    <td className="py-3.5 px-5 text-slate-800 font-medium">
                      {item.custodian?.name}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-2">
                      <Link
                        to={`/custody?evidenceId=${item.id}`}
                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded font-semibold text-[11px] transition-all inline-block"
                        title="Chain of Custody"
                      >
                        Custody
                      </Link>
                      <Link
                        to={`/evidence/${item.id}`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded font-semibold text-[11px] transition-all inline-block"
                      >
                        Inspect Dossier &rarr;
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
