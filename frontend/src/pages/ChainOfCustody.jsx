import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { 
  History, 
  Search, 
  User, 
  ArrowRight,
  ShieldCheck, 
  Download, 
  ChevronRight, 
  Cpu, 
  Clock, 
  FileCheck, 
  Send, 
  Eye, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  FileSpreadsheet, 
  Printer, 
  X,
  Plus,
  ExternalLink
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ChainOfCustody = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const targetEvidenceId = searchParams.get("evidenceId") || "";

  const [evidenceList, setEvidenceList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Transfer Initiation Modal State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferRecipientId, setTransferRecipientId] = useState("");
  const [transferReason, setTransferReason] = useState("Transfer for forensic lab bit-stream analysis and integrity verification");
  const [transferNotes, setTransferNotes] = useState("Evidence container sealed in tamper-evident forensic envelope with signature verification.");
  const [transferCondition, setTransferCondition] = useState("Intact / Tamper-evident seal verified unbroken");
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  // Transfer Acceptance / Rejection State
  const [accepting, setAccepting] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [transferConditionNotes, setTransferConditionNotes] = useState("Physical tamper-evident seal verified intact; container unbreached.");

  // Custody Certificate Modal State
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [certificateData, setCertificateData] = useState(null);
  const [certLoading, setCertLoading] = useState(false);

  useEffect(() => {
    fetchEvidence();
    fetchUsers();
  }, [targetEvidenceId]);

  const fetchEvidence = async () => {
    try {
      const response = await axios.get("/api/evidence");
      if (Array.isArray(response.data)) {
        setEvidenceList(response.data);
        if (response.data.length > 0) {
          if (targetEvidenceId) {
            const found = response.data.find(item => String(item.id) === String(targetEvidenceId));
            setSelectedItem(found || response.data[0]);
          } else if (!selectedItem) {
            setSelectedItem(response.data[0]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load evidence catalog for custody timeline");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/admin/users");
      if (Array.isArray(res.data)) {
        setUsers(res.data);
      }
    } catch (err) {
      // Fallback
      setUsers([]);
    }
  };

  const fetchTimeline = async () => {
    if (!selectedItem) return;
    setTimelineLoading(true);
    try {
      const response = await axios.get(`/api/evidence/${selectedItem.id}/custody`);
      setTimeline(response.data.databaseHistory || []);
    } catch (err) {
      console.error("Failed to load custody timeline details");
    } finally {
      setTimelineLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [selectedItem]);

  // Initiate Custody Transfer (Step 1 of 2-Step Protocol)
  const handleInitiateTransfer = async (e) => {
    e.preventDefault();
    if (!selectedItem || !transferRecipientId || !transferReason) {
      alert("Recipient and transfer reason are mandatory.");
      return;
    }

    setTransferSubmitting(true);
    try {
      await axios.post(`/api/custody/initiate/${selectedItem.id}`, {
        receivingUserId: transferRecipientId,
        reason: transferReason,
        notes: transferNotes,
        evidenceCondition: transferCondition
      });
      alert("Custody transfer initiated. Status is now PENDING awaiting recipient acceptance.");
      setTransferModalOpen(false);
      setTransferRecipientId("");
      await fetchEvidence();
      await fetchTimeline();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to initiate custody transfer.");
    } finally {
      setTransferSubmitting(false);
    }
  };

  // Accept Transfer (Step 2 of 2-Step Protocol)
  const handleAcceptTransfer = async (transferLogId) => {
    if (!window.confirm("Confirm acceptance of evidentiary custody? This will seal the transfer on the cryptographic ledger.")) return;
    setAccepting(true);
    try {
      await axios.post(`/api/custody/accept/${transferLogId}`, {
        conditionNotes: transferConditionNotes
      });
      alert("Custody successfully accepted and registered.");
      await fetchEvidence();
      await fetchTimeline();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to accept custody transfer.");
    } finally {
      setAccepting(false);
    }
  };

  // Reject Transfer
  const handleRejectTransfer = async (transferLogId) => {
    if (!rejectReason) {
      alert("A statutory justification is mandatory to reject custody transfer.");
      return;
    }
    try {
      await axios.post(`/api/custody/reject/${transferLogId}`, {
        rejectionReason: rejectReason
      });
      alert("Custody transfer rejected and permanently logged.");
      setRejectionModalOpen(false);
      setRejectReason("");
      await fetchEvidence();
      await fetchTimeline();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to reject transfer.");
    }
  };

  const handleViewCertificate = async () => {
    if (!selectedItem) return;
    setCertLoading(true);
    try {
      const res = await axios.get(`/api/reports/certificate/${selectedItem.id}`);
      setCertificateData(res.data);
      setCertificateModalOpen(true);
    } catch (err) {
      alert("Failed to generate Custody Certificate: " + (err.response?.data?.error || err.message));
    } finally {
      setCertLoading(false);
    }
  };

  const pendingTransfer = timeline.find(log => log.transferState === "Pending");

  const getActionBadge = (action, state) => {
    if (state === "Pending") {
      return { label: "TRANSFER PENDING APPROVAL", bg: "bg-amber-50 text-amber-800 border-amber-300", icon: Clock };
    }
    if (state === "Rejected") {
      return { label: "TRANSFER REJECTED", bg: "bg-red-50 text-red-700 border-red-200", icon: XCircle };
    }
    switch (action) {
      case "transferred": 
      case "transfer_accepted":
        return { label: "CUSTODY TRANSFERRED", bg: "bg-purple-50 text-purple-700 border-purple-200", icon: Send };
      case "transfer_initiated":
        return { label: "TRANSFER INITIATED", bg: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock };
      case "downloaded": 
        return { label: "EVIDENCE DOWNLOADED", bg: "bg-blue-50 text-blue-700 border-blue-200", icon: Download };
      case "viewed": 
        return { label: "EVIDENCE ACCESSED / VIEWED", bg: "bg-slate-100 text-slate-700 border-slate-200", icon: Eye };
      default: 
        return { label: action?.toUpperCase() || "RECORDED", bg: "bg-slate-100 text-slate-700 border-slate-200", icon: History };
    }
  };

  const filteredList = evidenceList.filter(item => 
    item.evidenceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.case?.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.fileHash?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#343239] tracking-tight">Chain of Custody</h1>
          <p className="text-xs text-[#57515A] mt-0.5">
            Track evidence ownership, handling and transfers throughout its lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedItem && (
            <button
              onClick={handleViewCertificate}
              disabled={certLoading}
              className="px-3.5 py-1.5 bg-white border border-[#DDD7D2] hover:bg-[#FAF8F7] text-[#343239] font-semibold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#873D50]" />
              Custody Certificate
            </button>
          )}
          {selectedItem && (
            <button
              onClick={() => setTransferModalOpen(true)}
              className="px-3.5 py-1.5 bg-[#873D50] hover:bg-[#732F40] text-white font-semibold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Transfer Evidence
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-24 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-600 font-medium text-xs">
          <div className="w-8 h-8 border-3 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent rounded-full animate-spin mb-3"></div>
          Accessing chain of custody records...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL: Evidence Records Catalog (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-xs flex flex-col max-h-[750px]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Evidence Records
              </h2>
              <span className="text-[10px] font-mono text-slate-400 font-semibold">{filteredList.length} items</span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by file or case reference..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none transition-all"
              />
            </div>
            
            {/* Evidence List */}
            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {filteredList.map(item => {
                const isSelected = selectedItem?.id === item.id;
                const isPending = item.custodyLogs?.some(l => l.transferState === "Pending");
                const isHeld = item.retentionStatus === "Under Legal Hold";

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`w-full text-left p-3 border rounded-xl transition-all cursor-pointer ${
                      isSelected 
                        ? "border-[#873D50] bg-[#FAF2F5] shadow-xs" 
                        : "border-[#E8E4E1] bg-white hover:border-[#DDD7D2] hover:bg-[#FAF8F7]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-[#343239] truncate block">
                        {item.evidenceName}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 whitespace-nowrap ${
                        isHeld 
                          ? "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]" 
                          : isPending 
                          ? "bg-[#FEF6EE] text-[#986000] border-[#FEDF89]" 
                          : "bg-[#EDFDF5] text-[#087443] border-[#A6F4C5]"
                      }`}>
                        {isHeld ? "LEGAL HOLD" : isPending ? "PENDING" : "ACTIVE"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-[#57515A]">
                      <span className="bg-[#FAF8F7] text-[#343239] px-1.5 py-0.2 rounded border border-[#E8E4E1] font-semibold">
                        {item.case?.caseNumber || "CASE"}
                      </span>
                      <span>&bull;</span>
                      <span>{item.category || item.fileType?.split("/")[1]?.toUpperCase() || "Exhibit"}</span>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-[#E8E4E1] flex items-center justify-between text-[11px]">
                      <span className="text-[#8C8490] text-[10px] font-sans">Custodian:</span>
                      <span className="text-[#873D50] font-semibold truncate max-w-[150px]">
                        {item.custodian?.name || "Lead Officer"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANEL: Custody History Timeline (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {selectedItem ? (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5 shadow-xs">
                
                {/* Evidence Item Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E8E4E1] pb-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase bg-[#F2E2E7] text-[#873D50] border border-[#E5C3CD] px-2 py-0.5 rounded shrink-0 whitespace-nowrap">
                        {selectedItem.case?.caseNumber} &bull; {selectedItem.case?.title || "Investigation Case"}
                      </span>
                      <span className="text-[10px] font-mono uppercase bg-[#EDFDF5] text-[#087443] border border-[#A6F4C5] px-2 py-0.5 rounded font-semibold shrink-0 whitespace-nowrap">
                        {selectedItem.status}
                      </span>
                      {selectedItem.retentionStatus === "Under Legal Hold" && (
                        <span className="text-[10px] font-mono uppercase bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA] px-2 py-0.5 rounded font-bold shrink-0 whitespace-nowrap">
                          UNDER LEGAL HOLD
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-[#343239] break-all leading-snug">{selectedItem.evidenceName}</h2>
                    <p className="text-[11px] text-[#57515A] font-mono mt-1 break-all">
                      SHA-256: <span className="font-semibold text-[#343239]">{selectedItem.fileHash}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                    <button
                      onClick={() => setTransferModalOpen(true)}
                      className="px-3.5 py-1.5 bg-[#873D50] hover:bg-[#732F40] text-white font-semibold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Transfer Evidence
                    </button>
                    <Link
                      to={`/evidence/${selectedItem.id}`}
                      className="px-3.5 py-1.5 bg-[#FAF8F7] hover:bg-[#F2E2E7] text-[#873D50] hover:text-[#732F40] font-semibold text-xs rounded-lg border border-[#DDD7D2] hover:border-[#873D50] transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Details
                    </Link>
                  </div>
                </div>

                {/* Pending Transfer Action Banner */}
                {pendingTransfer && (
                  <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-3 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 font-mono">
                            Custody Handoff Pending Final Acceptance
                          </h4>
                          <p className="text-xs text-amber-800 mt-0.5">
                            Transfer initiated by <span className="font-bold">{pendingTransfer.actor?.name || "Current Custodian"}</span> to designate <span className="font-bold">{pendingTransfer.nextCustodian?.name || "Designated Recipient"}</span>.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded font-bold shrink-0">
                        TWO-STEP PROTOCOL ACTIVE
                      </span>
                    </div>

                    <div className="text-xs bg-white p-3 rounded-lg border border-amber-200 space-y-1 text-slate-700 font-mono">
                      <div><strong className="text-slate-900">Reason:</strong> {pendingTransfer.reason || "Standard forensic investigation handover"}</div>
                      {pendingTransfer.evidenceCondition && (
                        <div><strong className="text-slate-900">Physical Condition:</strong> {pendingTransfer.evidenceCondition}</div>
                      )}
                      {pendingTransfer.notes && (
                        <div><strong className="text-slate-900">Transfer Notes:</strong> {pendingTransfer.notes}</div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-1">
                      <button
                        onClick={() => setRejectionModalOpen(true)}
                        className="px-3.5 py-1.5 bg-white border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject Transfer
                      </button>
                      <button
                        onClick={() => handleAcceptTransfer(pendingTransfer.id)}
                        disabled={accepting}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {accepting ? "Executing On-Chain..." : "Accept Custody & Sign"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Custody Summary Information */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#FAF8F7] p-3.5 rounded-lg border border-[#E8E4E1]">
                  <div>
                    <span className="text-[10px] text-[#57515A] uppercase font-semibold block font-mono">Registered Submitter</span>
                    <span className="font-semibold text-[#343239]">{selectedItem.submitter?.name || "Investigator Alice"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#57515A] uppercase font-semibold block font-mono">Current Active Custodian</span>
                    <span className="font-semibold text-[#873D50]">{selectedItem.custodian?.name || "Analyst Bob"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#57515A] uppercase font-semibold block font-mono">Storage CID</span>
                    <span className="font-mono text-[#343239] text-[11px] truncate block" title={selectedItem.ipfsCid}>
                      {selectedItem.ipfsCid || "Encrypted Repository Storage"}
                    </span>
                  </div>
                </div>

                {/* Chronological Custody Timeline */}
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-700" />
                      Custody Event Timeline ({timeline.length} recorded events)
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">Append-Only Audit</span>
                  </div>

                  {timelineLoading ? (
                    <div className="py-12 flex items-center justify-center text-slate-500 font-medium text-xs">
                      <div className="w-5 h-5 border-2 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent rounded-full animate-spin mr-3"></div>
                      Retrieving chronological custody trail...
                    </div>
                  ) : timeline.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                      No custody transitions recorded for this item yet.
                    </div>
                  ) : (
                    <div className="space-y-4 relative pl-6 border-l-2 border-slate-200 ml-3 py-1">
                      {timeline.map((log, idx) => {
                        const badgeInfo = getActionBadge(log.action, log.transferState);
                        const ActionIcon = badgeInfo.icon;
                        const isTransfer = log.action === "transferred" || log.action === "transfer_initiated" || log.action === "transfer_accepted";
                        
                        return (
                          <div key={log.id || idx} className="relative">
                            
                            {/* Marker */}
                            <span className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white flex items-center justify-center ${
                              isTransfer ? "border-purple-600" : log.action === "downloaded" ? "border-blue-600" : "border-slate-400"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                isTransfer ? "bg-purple-600" : log.action === "downloaded" ? "bg-blue-600" : "bg-slate-400"
                              }`}></span>
                            </span>

                            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2 shadow-2xs">
                              
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${badgeInfo.bg}`}>
                                  <ActionIcon className="w-3 h-3" />
                                  {badgeInfo.label}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(log.timestamp).toLocaleString()}
                                </span>
                              </div>

                              <p className="text-xs text-slate-800">
                                Performed by <span className="font-bold text-slate-900">{log.actor?.name || "Authorized Operator"}</span>
                                <span className="text-slate-500 ml-1 font-mono text-[10px]">({log.actor?.role?.toUpperCase() || "AUTHORIZED"})</span>
                              </p>

                              {/* Transfer Detailed Parameters */}
                              {isTransfer && (
                                <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1.5">
                                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <div>
                                      <span className="text-[9px] uppercase font-sans text-slate-400 block font-semibold">Transferred By</span>
                                      <span className="text-slate-800 font-semibold">{log.prevCustodian?.name || log.actor?.name || "Initial Submitter"}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] uppercase font-sans text-slate-400 block font-semibold">Transferred To</span>
                                      <span className="text-blue-700 font-bold">{log.nextCustodian?.name || "Designated Custodian"}</span>
                                    </div>
                                  </div>

                                  {log.reason && (
                                    <div className="text-[11px] text-slate-700 pt-1 border-t border-slate-100">
                                      <strong className="text-slate-900">Transfer Reason:</strong> {log.reason}
                                    </div>
                                  )}

                                  {log.notes && (
                                    <div className="text-[11px] text-slate-600">
                                      <strong className="text-slate-900">Transfer Notes:</strong> {log.notes}
                                    </div>
                                  )}

                                  {log.evidenceCondition && (
                                    <div className="text-[10px] font-mono text-slate-600">
                                      <strong>Evidence Condition:</strong> {log.evidenceCondition}
                                    </div>
                                  )}

                                  {log.blockchainTxId ? (
                                    <div className="text-[10px] font-mono text-purple-700 pt-1 border-t border-slate-100 break-all flex items-center justify-between">
                                      <span><strong>Ethereum Transaction:</strong> {log.blockchainTxId}</span>
                                      <span className="text-[9px] uppercase px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold shrink-0">On-Chain</span>
                                    </div>
                                  ) : isTransfer && (log.transferState === "Completed" || log.transferState === "Accepted") ? (
                                    <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                                      <span><strong>Ledger State:</strong> Recorded in Repository Database (Not Anchored On-Chain)</span>
                                      <span className="text-[9px] uppercase px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded font-semibold shrink-0">Local Seal</span>
                                    </div>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-400 text-xs">
                Select an evidence item from the catalog on the left to inspect its on-chain custody audit trail.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transfer Initiation Modal */}
      {transferModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative">
            <button 
              onClick={() => setTransferModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Send className="w-5 h-5 text-blue-700" />
              <h3 className="text-base font-bold text-slate-900">Initiate Custody Transfer</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Two-step protocol: Evidence remains in current custody until the recipient explicitly accepts the transfer.
            </p>

            <form onSubmit={handleInitiateTransfer} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Target Evidence Exhibit</span>
                <span className="font-bold text-slate-900 text-xs">{selectedItem.evidenceName}</span>
                <span className="text-[10px] text-blue-700 font-mono block mt-0.5">
                  [{selectedItem.case?.caseNumber}] Current Custodian: {selectedItem.custodian?.name || "Active Custodian"}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 uppercase block mb-1">
                  Designate Recipient *
                </label>
                <select
                  value={transferRecipientId}
                  onChange={(e) => setTransferRecipientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  required
                >
                  <option value="">-- Choose Recipient Officer / Analyst --</option>
                  {users
                    .filter(u => String(u.id) !== String(selectedItem.currentCustodian))
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role?.toUpperCase()}) &bull; {u.email}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 uppercase block mb-1">
                  Official Transfer Reason *
                </label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 uppercase block mb-1">
                  Evidence Physical Condition
                </label>
                <input
                  type="text"
                  value={transferCondition}
                  onChange={(e) => setTransferCondition(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 uppercase block mb-1">
                  Handover Notes & Observations
                </label>
                <textarea
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferSubmitting}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {transferSubmitting ? "Initiating..." : "Initiate Transfer"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Rejection Modal */}
      {rejectionModalOpen && pendingTransfer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative">
            <button 
              onClick={() => setRejectionModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1 text-red-700">
              <XCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Reject Custody Transfer</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              A permanent statutory justification is required to decline evidentiary custody.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 uppercase block mb-1">
                  Rejection Reason / Justification *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Physical seal compromised upon inspection; barcode discrepancy; unauthorized recipient assignment..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-red-600 focus:bg-white rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectionModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleRejectTransfer(pendingTransfer.id)}
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custody Certificate Modal */}
      {certificateModalOpen && certificateData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-300 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setCertificateModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-200 pb-3 mb-4 flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-center border border-purple-200">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Chain of Custody Certificate</h3>
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  ISO/IEC 27037 & BSA Sec 63 Evidentiary Ledger Record
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Evidence Exhibit:</span>
                  <span className="font-bold text-slate-900">{certificateData.evidenceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Case File:</span>
                  <span className="text-blue-700 font-bold">{certificateData.caseNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Active Custodian:</span>
                  <span className="font-bold text-slate-800">{certificateData.currentCustodian?.name || "Designated Officer"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Sealed SHA-256 Digest:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[280px]" title={certificateData.fileHash}>
                    {certificateData.fileHash}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-sans text-slate-500 font-bold block mb-1">
                  Chronological Transfer Log ({certificateData.custodyHistory?.length || 0} transitions):
                </span>
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2 max-h-48 overflow-y-auto">
                  {certificateData.custodyHistory?.map((h, i) => (
                    <div key={i} className="text-[11px] pb-1.5 border-b border-slate-100 last:border-0 flex justify-between">
                      <div>
                        <span className="font-bold text-slate-800">[{h.action?.toUpperCase()}]</span>
                        <span className="text-slate-600 ml-1">{h.actorName || "Officer"}</span>
                      </div>
                      <span className="text-slate-400 text-[10px]">{new Date(h.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Certificate
              </button>
              <button
                onClick={() => setCertificateModalOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChainOfCustody;