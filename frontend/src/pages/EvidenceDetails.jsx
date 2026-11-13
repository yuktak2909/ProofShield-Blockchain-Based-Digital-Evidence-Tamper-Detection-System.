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
  Hash,
  ShieldAlert,
  HardDrive,
  UserCheck,
  Tag,
  X
} from "lucide-react";

const EvidenceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // General Vault List State
  const [evidenceList, setEvidenceList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterRetention, setFilterRetention] = useState("");
  const [listLoading, setListLoading] = useState(true);

  // Single Item Details State
  const [evidence, setEvidence] = useState(null);
  const [dbHistory, setDbHistory] = useState([]);
  const [verificationLogs, setVerificationLogs] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("custody"); // custody, verifications, specs

  // Transfer Modal State (Two-Step Workflow)
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [targetUserId, setTargetUserId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferCondition, setTransferCondition] = useState("Intact / Verified Cryptographic Container");
  const [transferNotes, setTransferNotes] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState("");

  // Legal Hold Modal State
  const [showLegalHoldModal, setShowLegalHoldModal] = useState(false);
  const [legalHoldReason, setLegalHoldReason] = useState("");
  const [legalHoldLoading, setLegalHoldLoading] = useState(false);
  const [isReleasingHold, setIsReleasingHold] = useState(false);

  // Rejection Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [pendingLogToReject, setPendingLogToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

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
          fileType: filterType,
          retentionStatus: filterRetention
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
  }, [id, searchTerm, filterType, filterRetention]);

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
  // DOWNLOAD / TRANSFER / HOLD ACTIONS
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

  const handleDownloadCertificate = async () => {
    try {
      const res = await axios.get(`/api/reports/certificate/${evidence.id}`);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Chain_of_Custody_Certificate_${evidence.id.substring(0,8)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      alert("Failed to export custody certificate.");
    }
  };

  const openTransferModal = async () => {
    setShowTransferModal(true);
    setTransferError("");
    setTransferReason("");
    setTransferNotes("");
    try {
      const response = await axios.get("/api/admin/users");
      const otherUsers = response.data.filter(u => u.id !== user.id);
      setUsers(otherUsers);
    } catch (err) {
      setTransferError("Could not retrieve system users list.");
    }
  };

  const handleInitiateTransfer = async (e) => {
    e.preventDefault();
    if (!targetUserId || !transferReason) {
      setTransferError("Please select a receiving officer and state an official transfer reason.");
      return;
    }
    
    setTransferLoading(true);
    setTransferError("");
    try {
      await axios.post(`/api/evidence/${evidence.id}/transfer/initiate`, {
        receivingUserId: targetUserId,
        reason: transferReason,
        notes: transferNotes,
        evidenceCondition: transferCondition
      });
      setShowTransferModal(false);
      setRefreshTrigger(p => p + 1);
      alert("Custody transfer request submitted. The designated recipient must authenticate and accept to complete the handoff.");
    } catch (err) {
      setTransferError(err.response?.data?.error || "Custody transfer initiation failed.");
    } finally {
      setTransferLoading(false);
    }
  };

  const handleAcceptTransfer = async (pendingLogId) => {
    if (!window.confirm("Confirm that you have physically received and inspected this evidence item in good condition.")) return;
    try {
      await axios.post(`/api/evidence/${evidence.id}/transfer/accept`, { logId: pendingLogId });
      setRefreshTrigger(p => p + 1);
      alert("Custody transfer officially accepted and anchored to Ethereum smart contract!");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to accept custody transfer.");
    }
  };

  const handleOpenReject = (pendingLog) => {
    setPendingLogToReject(pendingLog);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason) return;
    setRejectLoading(true);
    try {
      await axios.post(`/api/evidence/${evidence.id}/transfer/reject`, {
        logId: pendingLogToReject.id,
        rejectionReason
      });
      setShowRejectModal(false);
      setRefreshTrigger(p => p + 1);
      alert("Custody transfer declined. The item remains with original custodian.");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to reject transfer.");
    } finally {
      setRejectLoading(false);
    }
  };

  const handleToggleLegalHold = async (e) => {
    e.preventDefault();
    if (!legalHoldReason) return;
    setLegalHoldLoading(true);
    try {
      if (isReleasingHold) {
        await axios.post(`/api/evidence/${evidence.id}/release-hold`, { releaseReason: legalHoldReason });
        alert("Legal hold released. Evidence status restored to Active.");
      } else {
        await axios.post(`/api/evidence/${evidence.id}/legal-hold`, { reason: legalHoldReason });
        alert("Evidence placed under active Legal Hold. Deletion locks engaged.");
      }
      setShowLegalHoldModal(false);
      setLegalHoldReason("");
      setRefreshTrigger(p => p + 1);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update legal hold status.");
    } finally {
      setLegalHoldLoading(false);
    }
  };

  // -------------------------------------------------------------
  // DETAIL VIEW
  // -------------------------------------------------------------
  if (id) {
    if (detailsLoading) {
      return (
        <div className="py-24 flex flex-col items-center justify-center text-blue-700 font-medium text-xs">
          <div className="w-8 h-8 border-3 border-blue-700 border-t-transparent rounded-full animate-spin mb-3"></div>
          Reading encrypted evidence records...
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

    // Check for pending transfer targeting current user
    const pendingIncomingTransfer = dbHistory.find(
      log => log.transferState === "Pending" && (log.newCustodian === user?.id || user?.role === "admin")
    );

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

        {/* Pending Transfer Alert Banner (if applicable) */}
        {pendingIncomingTransfer && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <h4 className="font-bold text-amber-900">Custody Transfer Request Awaiting Your Acceptance</h4>
                <p className="text-amber-800 mt-0.5">
                  Initiated by <span className="font-semibold">{pendingIncomingTransfer.actor?.name || "Custodian"}</span>. Reason: "{pendingIncomingTransfer.reason || "Case progression"}".
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAcceptTransfer(pendingIncomingTransfer.id)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Accept Custody
              </button>
              <button
                onClick={() => handleOpenReject(pendingIncomingTransfer)}
                className="px-3.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {/* Legal Hold Alert Banner (if applied) */}
        {evidence.retentionStatus === "Under Legal Hold" && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-purple-700 flex-shrink-0" />
              <div>
                <span className="font-bold text-purple-900 block">STATUTORY LEGAL HOLD ACTIVE</span>
                <p className="text-purple-700 text-[11px] mt-0.5">
                  Justification: {evidence.legalHoldReason || "Court Mandated Preservation Order"}
                </p>
              </div>
            </div>
            {user?.role === "admin" && (
              <button
                onClick={() => {
                  setIsReleasingHold(true);
                  setLegalHoldReason("");
                  setShowLegalHoldModal(true);
                }}
                className="px-3 py-1 bg-white border border-purple-300 text-purple-800 hover:bg-purple-100 rounded-md font-semibold text-[11px] cursor-pointer"
              >
                Release Hold
              </button>
            )}
          </div>
        )}

        {/* Dossier Header Card */}
        <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center text-blue-700 flex-shrink-0">
              {isVideo ? <Video className="w-7 h-7" /> : isAudio ? <Music className="w-7 h-7" /> : isPdf ? <FileText className="w-7 h-7" /> : <FileCheck className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                  {evidence.case?.caseNumber || "CASE"}
                </span>
                <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                  STATUS: {evidence.status}
                </span>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold border ${
                  evidence.retentionStatus === "Under Legal Hold"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}>
                  RETENTION: {evidence.retentionStatus || "Active"}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{evidence.evidenceName}</h2>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Sealed: {new Date(evidence.submittedAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {evidence.location || "Evidence Locker"}
                </span>
                <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  Size: {(evidence.fileSize / (1024 * 1024)).toFixed(2)} MB
                </span>
                <span className="text-[11px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                  {evidence.category || "Surveillance"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleDownloadFile}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Asset
            </button>

            <button
              onClick={handleDownloadCertificate}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              Custody Certificate (PDF)
            </button>

            <Link
              to={`/custody?evidenceId=${evidence.id}`}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold rounded-lg text-xs transition-all shadow-xs"
            >
              <History className="w-3.5 h-3.5 text-purple-600" />
              Chain of Custody
            </Link>

            <Link
              to={`/verify?evidenceId=${evidence.id}`}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-all shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Verify Checksum
            </Link>
            
            {/* Custody Transfer Button */}
            {(evidence.currentCustodian === user?.id || user?.role === "admin") && evidence.retentionStatus !== "Under Legal Hold" && (
              <button
                onClick={openTransferModal}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Transfer Custody
              </button>
            )}

            {/* Legal Hold Button */}
            {user?.role === "admin" && evidence.retentionStatus !== "Under Legal Hold" && (
              <button
                onClick={() => {
                  setIsReleasingHold(false);
                  setLegalHoldReason("");
                  setShowLegalHoldModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                Apply Legal Hold
              </button>
            )}
          </div>
        </div>

        {/* EMBEDDED FORENSIC MEDIA VIEWER */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
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
                Forensic Acquisition Specs
              </button>
            </div>

            {/* Tab: Custody Events */}
            {activeTab === "custody" && (
              <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-xs">
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
                          {log.transferState && (
                            <span className="text-[9px] uppercase px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono">
                              {log.transferState}
                            </span>
                          )}
                        </div>
                        {log.reason && (
                          <p className="text-xs text-slate-600 mt-1 italic">
                            Reason: "{log.reason}"
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
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
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
                          <th className="py-2.5 px-3">Submitted Checksum</th>
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

            {/* Tab: Forensic Acquisition Specs */}
            {activeTab === "specs" && (
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
                  Cryptographic & Forensic Acquisition Specifications
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 md:col-span-2">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5 font-sans">SHA-256 Checksum (FIPS 180-4)</span>
                    <span className="font-bold text-slate-900 break-all select-all">{evidence.fileHash}</span>
                  </div>
                  
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5 font-sans">Acquisition Source</span>
                    <span className="font-semibold text-slate-800 font-sans">{evidence.acquisitionSource || "Primary Digital Recovery"}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5 font-sans">Acquisition Method</span>
                    <span className="font-semibold text-slate-800 font-sans">{evidence.acquisitionMethod || "Bit-Stream Copy"}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5 font-sans">Seizing Collector / Badge #</span>
                    <span className="font-semibold text-slate-800 font-sans">{evidence.collectorIdentity || evidence.submitter?.name}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5 font-sans">Device / Hardware Info</span>
                    <span className="font-semibold text-slate-800 font-sans">{evidence.deviceInfo || "Standard Hardware"}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5 font-sans">IPFS CID Gateway</span>
                    <span className="font-bold text-blue-700 break-all select-all">{evidence.ipfsCid}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5 font-sans">Blockchain Witness Tx</span>
                    <span className="font-bold text-purple-700 break-all select-all">{evidence.blockchainTxId}</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Summary Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
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

        {/* Transfer Custody Modal (Two-Step Workflow) */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6">
              <h3 className="text-base font-bold text-slate-900 mb-1">Initiate Custody Transfer</h3>
              <p className="text-xs text-slate-500 mb-4">
                Initiates a formal handoff for <span className="font-bold text-slate-800">{evidence.evidenceName}</span>. Custodian status will update only once accepted by recipient.
              </p>

              {transferError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                  {transferError}
                </div>
              )}

              <form onSubmit={handleInitiateTransfer} className="space-y-4">
                <div>
                  <label className="text-[11px] text-slate-600 font-bold uppercase block mb-1">Select Qualified Transferee *</label>
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

                <div>
                  <label className="text-[11px] text-slate-600 font-bold uppercase block mb-1">Official Transfer Reason *</label>
                  <input
                    type="text"
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="e.g. Forensic laboratory examination / Court submission"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-bold uppercase block mb-1">Physical / Logical Evidence Condition</label>
                  <select
                    value={transferCondition}
                    onChange={(e) => setTransferCondition(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900"
                  >
                    <option value="Intact / Verified Cryptographic Container">Intact / Verified Cryptographic Container</option>
                    <option value="Physical Sealed Evidence Bag #PS-4401">Physical Sealed Evidence Bag</option>
                    <option value="Write-Blocked Digital Bit-Stream Image">Write-Blocked Digital Bit-Stream</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-bold uppercase block mb-1">Chain of Custody Notes</label>
                  <textarea
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    placeholder="Record transport precautions or hardware serial tags..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
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
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs tracking-wide shadow-xs cursor-pointer"
                  >
                    {transferLoading ? "Initiating..." : "Initiate Transfer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Legal Hold Modal */}
        {showLegalHoldModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6">
              <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-700" />
                {isReleasingHold ? "Release Legal Hold" : "Apply Statutory Legal Hold"}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                {isReleasingHold 
                  ? "Releasing this legal hold returns evidence to regular retention schedule." 
                  : "Applying a legal hold locks this evidence item from deletion and custodial transfers."}
              </p>

              <form onSubmit={handleToggleLegalHold} className="space-y-4">
                <div>
                  <label className="text-[11px] text-slate-600 font-bold uppercase block mb-1">
                    {isReleasingHold ? "Authorized Release Justification *" : "Mandatory Legal Hold Reason *"}
                  </label>
                  <textarea
                    value={legalHoldReason}
                    onChange={(e) => setLegalHoldReason(e.target.value)}
                    placeholder={isReleasingHold ? "e.g. Case settled; preservation order lifted." : "e.g. Grand Jury Subpoena #GJ-2026-99 mandatory preservation."}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowLegalHoldModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={legalHoldLoading}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-lg text-xs"
                  >
                    {legalHoldLoading ? "Updating..." : isReleasingHold ? "Confirm Release" : "Apply Legal Hold"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6">
              <h3 className="text-base font-bold text-slate-900 mb-1">Decline Custody Transfer</h3>
              <p className="text-xs text-slate-500 mb-4">
                State the reason why you are declining to accept this custody transfer.
              </p>

              <form onSubmit={handleConfirmReject} className="space-y-4">
                <div>
                  <label className="text-[11px] text-slate-600 font-bold uppercase block mb-1">Rejection Justification *</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Physical evidence seal was broken / Transferee not authorized."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={rejectLoading}
                    className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg text-xs"
                  >
                    {rejectLoading ? "Declining..." : "Confirm Rejection"}
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
        <div className="w-full sm:w-44">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800"
          >
            <option value="">All Formats</option>
            <option value="video/">Video / CCTV</option>
            <option value="image/">Photographs</option>
            <option value="audio/">Audio Recordings</option>
            <option value="application/pdf">Forensic PDF Reports</option>
          </select>
        </div>
        <div className="w-full sm:w-44">
          <select
            value={filterRetention}
            onChange={(e) => setFilterRetention(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800"
          >
            <option value="">All Retention</option>
            <option value="Active">Active</option>
            <option value="Under Legal Hold">Under Legal Hold</option>
          </select>
        </div>
      </div>

      {/* Catalog Table */}
      {listLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-blue-700 font-medium text-xs">
          <div className="w-8 h-8 border-3 border-blue-700 border-t-transparent rounded-full animate-spin mb-3"></div>
          Accessing encrypted catalog...
        </div>
      ) : evidenceList.length === 0 ? (
        <div className="py-20 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-500 bg-white">
          <FileCheck className="w-12 h-12 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No matching evidence items found.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-6">Evidence File</th>
                  <th className="py-3.5 px-6">Case Identifier</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Current Custodian</th>
                  <th className="py-3.5 px-6">Retention</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evidenceList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div>
                        {item.evidenceName}
                        <span className="block font-mono text-[10px] text-slate-400 mt-0.5">
                          SHA-256: {item.fileHash.substring(0, 16)}...
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px] text-blue-700">
                      {item.case?.caseNumber || "UNLINKED"}
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {item.category || "Surveillance"}
                    </td>
                    <td className="py-4 px-6 text-slate-800">
                      {item.custodian?.name || "Evidence Room"}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.retentionStatus === "Under Legal Hold"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        {item.retentionStatus || "Active"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <Link
                        to={`/custody?evidenceId=${item.id}`}
                        className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded font-semibold text-[11px] transition-all inline-block"
                      >
                        Custody
                      </Link>
                      <Link
                        to={`/evidence/${item.id}`}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-semibold text-[11px] transition-all inline-block"
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
