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
  ExternalLink,
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
  X
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
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);

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
  }, [targetEvidenceId]);

  const fetchEvidence = async () => {
    try {
      const response = await axios.get("/api/evidence");
      setEvidenceList(response.data);
      
      if (response.data.length > 0) {
        if (targetEvidenceId) {
          const found = response.data.find(item => item.id === targetEvidenceId);
          setSelectedItem(found || response.data[0]);
        } else if (!selectedItem) {
          setSelectedItem(response.data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load evidence catalog for custody timeline");
    } finally {
      setLoading(false);
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

  const handleAcceptTransfer = async (transferLogId) => {
    if (!window.confirm("Confirm acceptance of evidentiary custody? This will execute an on-chain transfer receipt.")) return;
    setAccepting(true);
    try {
      await axios.post(`/api/custody/accept/${transferLogId}`, {
        conditionNotes: transferConditionNotes
      });
      alert("Custody successfully accepted and registered on the blockchain.");
      await fetchEvidence();
      await fetchTimeline();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to accept custody transfer.");
    } finally {
      setAccepting(false);
    }
  };

  const handleRejectTransfer = async (transferLogId) => {
    if (!rejectReason) {
      alert("A statutory justification is mandatory to reject custody transfer.");
      return;
    }
    try {
      await axios.post(`/api/custody/reject/${transferLogId}`, {
        rejectionReason: rejectReason
      });
      alert("Custody transfer rejected.");
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
        return { label: "CUSTODY TRANSFERRED", bg: "bg-purple-50 text-purple-700 border-purple-200", icon: Send };
      case "downloaded": 
        return { label: "EVIDENCE DOWNLOADED", bg: "bg-blue-50 text-blue-700 border-blue-200", icon: Download };
      case "viewed": 
        return { label: "EVIDENCE ACCESSED / VIEWED", bg: "bg-slate-100 text-slate-700 border-slate-200", icon: Eye };
      default: 
        return { label: action.toUpperCase(), bg: "bg-slate-100 text-slate-700 border-slate-200", icon: History };
    }
  };

  const filteredList = evidenceList.filter(item => 
    item.evidenceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.case?.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.fileHash?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              ISO/IEC 27037 & BSA Sec 63 Evidentiary Ledger
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Chain of Custody & Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Chronological, cryptographically verifiable log recording every view, download, transfer, and custodian handoff anchored by Ethereum smart contract receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedItem && (
            <button
              onClick={handleViewCertificate}
              disabled={certLoading}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-purple-700" />
              Custody Certificate
            </button>
          )}
          <Link
            to="/verify"
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Verify Checksum
          </Link>
          <Link
            to="/register"
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5"
          >
            <FileCheck className="w-4 h-4" />
            Register New Evidence
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-24 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-600 font-medium text-xs">
          <div className="w-8 h-8 border-3 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent rounded-full animate-spin mb-3"></div>
          LOADING AUDIT TRAIL DATA FROM ON-CHAIN LEDGER...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Panel: Search & Catalog Selector (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs h-fit max-h-[700px] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Select Evidence Record</h3>
              <span className="text-[11px] font-mono text-slate-500 font-medium">{filteredList.length} files</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by file name or case..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none transition-all"
              />
            </div>
            
            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {filteredList.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`w-full text-left p-3 border rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                    selectedItem?.id === item.id 
                      ? "border-blue-600 bg-blue-50/60 text-slate-900 shadow-xs" 
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="truncate pr-2">
                    <span className="text-xs font-bold block truncate text-slate-900">{item.evidenceName}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded">
                        {item.case?.caseNumber || "Case"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 truncate">
                        {item.fileType?.split("/")[1]?.toUpperCase() || "FILE"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 ${selectedItem?.id === item.id ? "text-blue-700 font-bold" : "text-slate-400"}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel: Selected Item Timeline Details (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedItem ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-xs">
                
                {/* Evidence Item Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                        {selectedItem.case?.caseNumber}
                      </span>
                      <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                        {selectedItem.status}
                      </span>
                      {selectedItem.retentionStatus === "Under Legal Hold" && (
                        <span className="text-[10px] font-mono uppercase bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded font-bold">
                          LEGAL HOLD
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedItem.evidenceName}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      SHA-256: <span className="font-semibold text-slate-800 select-all">{selectedItem.fileHash}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={handleViewCertificate}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-lg border border-purple-200 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Certificate
                    </button>
                    <Link
                      to={`/evidence/${selectedItem.id}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-all flex items-center gap-1"
                    >
                      Inspect Dossier &rarr;
                    </Link>
                  </div>
                </div>

                {/* Pending Transfer Action Banner if applicable */}
                {pendingTransfer && (
                  <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-3 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                            Custody Handoff Pending Final Acceptance
                          </h4>
                          <p className="text-xs text-amber-800 mt-0.5">
                            Transfer initiated by <span className="font-bold">{pendingTransfer.actor?.name || "Custodian"}</span> to designate <span className="font-bold">{pendingTransfer.nextCustodian?.name || "Designee"}</span>.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded font-bold">
                        AWAITING RECIPIENT CONFIRMATION
                      </span>
                    </div>

                    <div className="text-xs bg-white p-3 rounded-lg border border-amber-200 space-y-1 text-slate-700 font-mono">
                      <div><strong className="text-slate-900">Reason:</strong> {pendingTransfer.reason || "Not specified"}</div>
                      {pendingTransfer.evidenceCondition && (
                        <div><strong className="text-slate-900">Physical Condition:</strong> {pendingTransfer.evidenceCondition}</div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-1">
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

                {/* Meta Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Registered Submitter</span>
                    <span className="font-semibold text-slate-800">{selectedItem.submitter?.name || "Investigator Alice"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Current Designated Custodian</span>
                    <span className="font-semibold text-blue-700">{selectedItem.custodian?.name || "Analyst Bob"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">IPFS Content Identifier (CID)</span>
                    <span className="font-mono text-slate-700 text-[11px] truncate block" title={selectedItem.ipfsCid}>
                      {selectedItem.ipfsCid}
                    </span>
                  </div>
                </div>

                {/* Chronological Timeline */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Verified Custody Timeline Events ({timeline.length})
                  </h4>

                  {timelineLoading ? (
                    <div className="py-12 flex items-center justify-center text-slate-500 font-medium text-xs">
                      <div className="w-5 h-5 border-2 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent rounded-full animate-spin mr-3"></div>
                      FETCHING ON-CHAIN AUDIT LOGS...
                    </div>
                  ) : timeline.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                      No custody transitions recorded for this item yet.
                    </div>
                  ) : (
                    <div className="space-y-6 relative pl-6 border-l-2 border-slate-200 ml-4 py-2">
                      {timeline.map((log, idx) => {
                        const badgeInfo = getActionBadge(log.action, log.transferState);
                        const ActionIcon = badgeInfo.icon;
                        const isTransfer = log.action === "transferred";
                        
                        return (
                          <div key={log.id || idx} className="relative group">
                            
                            {/* Circle Marker */}
                            <span className={`absolute -left-[33px] top-1.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                              isTransfer ? "border-purple-600" : log.action === "downloaded" ? "border-blue-600" : "border-slate-400"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                isTransfer ? "bg-purple-600" : log.action === "downloaded" ? "bg-blue-600" : "bg-slate-400"
                              }`}></span>
                            </span>

                            <div className="bg-slate-50 border border-slate-200 hover:border-slate-300 p-4 rounded-xl space-y-2 transition-all shadow-2xs">
                              
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1.5 ${badgeInfo.bg}`}>
                                  <ActionIcon className="w-3 h-3" />
                                  {badgeInfo.label}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono font-medium flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {new Date(log.timestamp).toLocaleString()}
                                </span>
                              </div>

                              <p className="text-xs text-slate-800 font-medium">
                                Action authorized by <span className="font-bold text-slate-900">{log.actor?.name || "System Actor"}</span>
                                <span className="text-slate-500 ml-1">({log.actor?.role?.toUpperCase() || "AUTHORIZED"})</span>
                              </p>

                              {isTransfer && (
                                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg text-xs text-purple-900 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold">Custody Transfer:</span>
                                    <span className="text-[10px] font-mono px-2 py-0.5 bg-white rounded border border-purple-200 font-bold">
                                      STATE: {log.transferState || "Completed"}
                                    </span>
                                  </div>
                                  <div>
                                    Handoff from <strong className="text-purple-950">{log.prevCustodian?.name || "Initial Seizure"}</strong> &rarr; to <strong className="text-purple-950">{log.nextCustodian?.name || "New Custodian"}</strong>
                                  </div>
                                  {log.reason && (
                                    <div className="text-[11px] text-purple-800 pt-1">
                                      <strong>Transfer Reason:</strong> {log.reason}
                                    </div>
                                  )}
                                  {log.evidenceCondition && (
                                    <div className="text-[11px] text-slate-600 font-mono pt-0.5">
                                      <strong>Condition:</strong> {log.evidenceCondition}
                                    </div>
                                  )}
                                </div>
                              )}

                              {log.blockchainTxId && (
                                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] font-mono text-slate-500 gap-1">
                                  <span className="truncate max-w-md select-all" title={log.blockchainTxId}>
                                    BLOCKCHAIN RECEIPT TX: <span className="text-purple-700 font-semibold">{log.blockchainTxId}</span>
                                  </span>
                                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1 flex-shrink-0">
                                    <Cpu className="w-3 h-3" />
                                    Smart Contract Confirmed
                                  </span>
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
              <div className="bg-white border border-dashed border-slate-300 rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-xs">
                <History className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">No Evidence Item Selected</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Choose a registered evidence item from the catalog on the left to inspect its on-chain custody audit trail.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Rejection Modal */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Reject Custody Transfer Request
            </h3>
            <p className="text-xs text-slate-600">
              Please enter the statutory justification for refusing this evidence custody transfer. This refusal will be written permanently to the audit log.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Physical tamper seal breached; package damaged during courier transit."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-600"
              rows={3}
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectionModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => pendingTransfer && handleRejectTransfer(pendingTransfer.id)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custody Certificate Modal */}
      {certificateModalOpen && certificateData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
            
            {/* Certificate Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-blue-700 font-bold block mb-1">
                  OFFICIAL FORENSIC RECORD &bull; PROOFSHIELD EVIDENCE CORE
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  CHAIN OF CUSTODY CERTIFICATE
                </h2>
                <span className="text-xs font-mono text-slate-500">
                  REF NO: {certificateData.certificateNumber}
                </span>
              </div>
              <button
                onClick={() => setCertificateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Certificate Body */}
            <div className="space-y-4 text-xs font-mono">
              
              {/* Evidence Technical Data */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 font-sans block">
                  Evidentiary Asset Specifications
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-800">
                  <div><strong>Exhibit Name:</strong> {certificateData.evidenceMetadata.evidenceName}</div>
                  <div><strong>Case Reference:</strong> {certificateData.caseMetadata.caseNumber}</div>
                  <div><strong>Format / MIME:</strong> {certificateData.evidenceMetadata.fileType}</div>
                  <div><strong>Payload Size:</strong> {certificateData.evidenceMetadata.fileSize}</div>
                  <div className="col-span-2">
                    <strong>SHA-256 Digest:</strong> <span className="text-blue-700">{certificateData.evidenceMetadata.sha256Digest}</span>
                  </div>
                  <div className="col-span-2 truncate">
                    <strong>IPFS CID:</strong> {certificateData.evidenceMetadata.ipfsCid}
                  </div>
                </div>
              </div>

              {/* Blockchain Attestation */}
              <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2 text-slate-800">
                <span className="text-[10px] font-bold uppercase text-purple-900 font-sans block">
                  Ethereum Smart Contract Witness
                </span>
                <div className="text-[11px] space-y-1">
                  <div><strong>Network:</strong> {certificateData.blockchainWitness.network}</div>
                  <div className="truncate"><strong>Solidity Contract:</strong> {certificateData.blockchainWitness.contractAddress}</div>
                  <div className="truncate"><strong>Transaction Hash:</strong> {certificateData.blockchainWitness.transactionHash}</div>
                  <div><strong>On-Chain Witness Status:</strong> <span className="text-emerald-700 font-bold">VERIFIED ON-CHAIN</span></div>
                </div>
              </div>

              {/* Transfer Table */}
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 font-sans block mb-2">
                  Chronological Transfer Ledger ({certificateData.custodyHandoffHistory.length} Handoffs)
                </span>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-slate-100 border-b border-slate-200 font-bold uppercase text-[9px]">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">Timestamp</th>
                        <th className="p-2">From Custodian</th>
                        <th className="p-2">To Custodian</th>
                        <th className="p-2">Transfer Reason</th>
                        <th className="p-2">State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {certificateData.custodyHandoffHistory.map((item) => (
                        <tr key={item.sequence}>
                          <td className="p-2 font-bold">{item.sequence}</td>
                          <td className="p-2">{new Date(item.timestamp).toLocaleString()}</td>
                          <td className="p-2 font-semibold">{item.fromCustodian}</td>
                          <td className="p-2 font-semibold text-blue-700">{item.toCustodian}</td>
                          <td className="p-2 text-slate-600">{item.reason}</td>
                          <td className="p-2">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {item.transferState || "Completed"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Statutory Statement */}
              <div className="p-3 bg-slate-100 rounded-lg text-[10px] text-slate-600 leading-relaxed font-sans">
                <strong>Statutory Admissibility Statement:</strong> {certificateData.complianceStatement} Pursuant to Bharatiya Sakshya Adhiniyam, 2023 (Section 63) and Federal Rule of Evidence 902(13), this certificate attests to the uninterrupted custody trail and mathematical integrity of the electronic record.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <span className="text-[11px] text-slate-500 font-mono">
                Issued By: {certificateData.issuer.operator} ({certificateData.issuer.operatorRole})
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  Print Official Certificate
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ChainOfCustody;
