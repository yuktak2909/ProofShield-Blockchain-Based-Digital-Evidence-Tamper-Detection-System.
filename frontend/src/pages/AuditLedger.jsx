import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  FileText,
  Activity,
  Layers,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Cpu
} from "lucide-react";

const CATEGORIES = [
  { label: "All Events", value: "ALL" },
  { label: "Authentication", value: "AUTH" },
  { label: "Case Management", value: "CASE" },
  { label: "Evidence", value: "EVIDENCE" },
  { label: "Verification", value: "VERIFICATION" },
  { label: "Custody", value: "CUSTODY" },
  { label: "Blockchain", value: "BLOCKCHAIN" },
  { label: "Administration", value: "ADMIN" }
];

// Helper to convert technical event codes into professional human-readable descriptions
export const formatAuditAction = (action, details, log) => {
  if (!action) return "System operation recorded.";

  switch (action) {
    case "EVIDENCE_VERIFIED_MATCH":
      return "Evidence verification – Integrity verified";
    case "EVIDENCE_VERIFIED_TAMPER_DETECTED":
      return "Evidence verification – Integrity mismatch detected";
    case "TRANSFER_INITIATED":
      return "Evidence transfer initiated";
    case "TRANSFER_ACCEPTED":
      return "Evidence transfer accepted";
    case "TRANSFER_REJECTED":
      return "Evidence transfer rejected";
    case "CASE_CREATED":
      return "New investigation case initiated";
    case "CASE_UPDATED":
      return "Case dossier parameters updated";
    case "CASE_CLOSED":
      return "Case dossier closed and archived";
    case "EVIDENCE_REGISTERED":
      return "Digital evidence registered & hashed";
    case "EVIDENCE_VIEWED":
      return "Evidence record inspected";
    case "EVIDENCE_DOWNLOADED":
      return "Evidence container downloaded";
    case "LEGAL_HOLD_APPLIED":
      return "Statutory legal hold applied";
    case "LEGAL_HOLD_RELEASED":
      return "Statutory legal hold released";
    case "USER_LOGIN":
    case "AUTH_LOGIN":
      return "User session authenticated";
    case "USER_REGISTERED":
      return "New personnel profile registered";
    case "USER_UPDATED":
      return "Personnel security clearance updated";
    case "SMART_CONTRACT_DEPLOYED":
      return "Solidity smart contract deployed on-chain";
    case "BLOCKCHAIN_REGISTRATION_INITIATED":
      return "Blockchain registration initiated";
    case "BLOCKCHAIN_REGISTRATION_CONFIRMED":
      return "Blockchain registration confirmed on Ethereum";
    case "BLOCKCHAIN_REGISTRATION_FAILED":
      return "Blockchain anchoring failed (Node offline or contract revert)";
    case "EXISTING_EVIDENCE_ANCHORED":
      return "Existing exhibit anchored to Ethereum contract";
    case "BLOCKCHAIN_VERIFICATION_COMPLETED":
      return "Blockchain verification completed on-chain";
    case "BLOCKCHAIN_VERIFICATION_FAILED":
      return "Blockchain verification failed (Tamper detected)";
    case "CUSTODY_TRANSACTION_CONFIRMED":
      return "Custody transfer anchored on Ethereum smart contract";
    case "CUSTODY_TRANSACTION_FAILED":
      return "Custody transfer blockchain commitment failed";
    default:
      // Convert SNAKE_CASE to Title Case
      return action
        .toLowerCase()
        .split("_")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
  }
};

const AuditLedger = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [metrics, setMetrics] = useState({
    totalEvents: 0,
    successActions: 0,
    failedActions: 0,
    securityAlerts: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const limit = 25;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        ...(selectedCategory !== "ALL" && { category: selectedCategory }),
        ...(searchTerm && { search: searchTerm })
      };
      const res = await axios.get("/api/audit-logs", { params });
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
      if (res.data.metrics) {
        setMetrics(res.data.metrics);
      }
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedCategory, page]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Export JSON Audit Log
  const exportJsonReport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(logs, null, 2)
    )}`;
    const a = document.createElement("a");
    a.href = jsonString;
    a.download = `proofshield_audit_log_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Export Human-Readable CSV / Text Report
  const exportTextReport = () => {
    let content = `PROOFSHIELD SYSTEM AUDIT LOG ACTIVITY REPORT\n`;
    content += `Generated: ${new Date().toUTCString()}\n`;
    content += `Total Recorded Events: ${total}\n\n`;
    content += `Date & Time (UTC) | Category | Description | Performed By | Related Record | Result\n`;
    content += `------------------------------------------------------------------------------------------------------------------------\n`;

    logs.forEach(l => {
      const time = new Date(l.timestamp || l.createdAt).toISOString();
      const cat = l.category;
      const desc = formatAuditAction(l.action, l.details, l);
      const actor = l.actor?.name ? `${l.actor.name} (${l.actor.role})` : "System / Administrator";
      const record = l.evidence?.evidenceName || l.case?.caseNumber || "System Global";
      const res = l.status || "SUCCESS";
      content += `${time} | ${cat} | ${desc} | ${actor} | ${record} | ${res}\n`;
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proofshield_audit_dossier_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case "AUTH":
        return "bg-slate-100 text-slate-700 border-slate-300";
      case "CASE":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "EVIDENCE":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "VERIFICATION":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CUSTODY":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "BLOCKCHAIN":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "ADMIN":
        return "bg-rose-50 text-rose-800 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getResultBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return { label: "SUCCESS", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "WARNING":
        return { label: "WARNING", bg: "bg-amber-50 text-amber-700 border-amber-200" };
      case "FAILURE":
      case "FAILED":
        return { label: "FAILED", bg: "bg-red-50 text-red-700 border-red-200" };
      default:
        return { label: status || "CONFIRMED", bg: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E8E4E1] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#343239] tracking-tight">Audit Log</h1>
          <p className="text-xs text-[#57515A] mt-0.5">
            Chronological, append-only activity records maintained across all platform operations and user actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportTextReport}
            className="px-3.5 py-1.5 bg-white border border-[#DDD7D2] hover:bg-[#FAF8F7] text-[#343239] font-semibold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Dossier (TXT)
          </button>
          <button
            onClick={exportJsonReport}
            className="px-3.5 py-1.5 bg-[#873D50] hover:bg-[#732F40] text-white font-semibold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Top Four Compact Summary Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Metric 1: Total Events */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
            Total Events
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {metrics.totalEvents || total}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Chronologically indexed</span>
        </div>

        {/* Metric 2: Successful Actions */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block font-mono">
            Successful Actions
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            {metrics.successActions}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Validated operations</span>
        </div>

        {/* Metric 3: Failed Actions */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block font-mono">
            Failed Actions
          </span>
          <span className="text-2xl font-black text-rose-700 mt-1 block">
            {metrics.failedActions}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Aborted or rejected</span>
        </div>

        {/* Metric 4: Security Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block font-mono">
            Security Alerts
          </span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">
            {metrics.securityAlerts}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Mismatches & warnings</span>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                setSelectedCategory(cat.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.value
                  ? "bg-blue-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search activity records by description, actor name, case number, or IP address..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Activity Records Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-slate-200 flex justify-between items-center bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Activity Records
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Showing {logs.length} of {total} indexed events
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-xs">
            <div className="w-7 h-7 border-3 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent rounded-full animate-spin mb-3"></div>
            Accessing forensic activity records...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No audit records found matching the specified parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider font-mono">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">Related Record</th>
                  <th className="py-3 px-4 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const resultBadge = getResultBadge(log.status);
                  const humanDesc = formatAuditAction(log.action, log.details, log);
                  const relatedEntity = log.evidence?.evidenceName || log.case?.caseNumber || "Platform System";

                  return (
                    <tr 
                      key={log.id} 
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    >
                      {/* 1. Date & Time */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap text-[11px] font-mono">
                        {new Date(log.timestamp || log.createdAt).toLocaleString()}
                      </td>

                      {/* 2. Event Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${getCategoryBadge(log.category)}`}>
                          {log.category}
                        </span>
                      </td>

                      {/* 3. Description (Human-Readable) */}
                      <td className="py-3 px-4 font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                        <div className="flex items-center gap-1.5">
                          <span>{humanDesc}</span>
                          <ChevronRight className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </td>

                      {/* 4. Performed By (Actor name + role) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.actor ? (
                          <div>
                            <span className="font-semibold text-slate-900 block text-xs">{log.actor.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {log.actor.role?.toUpperCase()}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-semibold text-slate-700 block text-xs">System Engine</span>
                            <span className="text-[10px] text-slate-400 font-mono">AUTOMATED</span>
                          </div>
                        )}
                      </td>

                      {/* 5. Related Record */}
                      <td className="py-3 px-4 text-slate-700 font-mono text-[11px] max-w-[200px] truncate" title={relatedEntity}>
                        {relatedEntity}
                      </td>

                      {/* 6. Result */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${resultBadge.bg}`}>
                          {resultBadge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Side Panel for Selected Audit Record */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-5 animate-slide-in-right">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${getCategoryBadge(selectedLog.category)}`}>
                  {selectedLog.category} EVENT
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1.5">
                  {formatAuditAction(selectedLog.action, selectedLog.details, selectedLog)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Overview Parameters */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Event Timestamp (UTC):</span>
                <span className="font-bold text-slate-900">
                  {new Date(selectedLog.timestamp || selectedLog.createdAt).toUTCString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Original Event Code:</span>
                <span className="text-blue-700 font-bold">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Execution Status:</span>
                <span className="font-bold text-emerald-700 uppercase">{selectedLog.status || "SUCCESS"}</span>
              </div>
            </div>

            {/* Authenticated Actor Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Authenticated Operator
              </h4>
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">User Identity:</span>
                  <span className="font-bold text-slate-900">{selectedLog.actor?.name || "System Automated Process"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Clearance:</span>
                  <span className="font-mono text-blue-700 font-semibold">{selectedLog.actor?.role?.toUpperCase() || "SYSTEM"}</span>
                </div>
                {selectedLog.actor?.email && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Official Email:</span>
                    <span className="font-mono text-slate-700">{selectedLog.actor.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Related Records Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Related Evidentiary Record
              </h4>
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1 font-mono">
                {selectedLog.case && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Case Dossier:</span>
                    <span className="font-bold text-slate-900">[{selectedLog.case.caseNumber}] {selectedLog.case.title}</span>
                  </div>
                )}
                {selectedLog.evidence && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Evidence Asset:</span>
                    <span className="font-bold text-slate-900">{selectedLog.evidence.evidenceName}</span>
                  </div>
                )}
                {selectedLog.evidence?.fileHash && (
                  <div>
                    <span className="text-slate-400 font-sans block text-[10px] uppercase mb-0.5">Sealed SHA-256 Digest:</span>
                    <span className="p-1.5 bg-slate-50 border border-slate-200 rounded text-[10px] break-all block font-bold text-slate-800">
                      {selectedLog.evidence.fileHash}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Network & Environment */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Network & Client Infrastructure
              </h4>
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Client IP Address:</span>
                  <span className="text-slate-800">{selectedLog.ipAddress || "127.0.0.1 (Local Session)"}</span>
                </div>
                {selectedLog.blockchainTxId && (
                  <div>
                    <span className="text-slate-400 font-sans block text-[10px] uppercase mb-0.5">Blockchain Transaction ID:</span>
                    <span className="p-1.5 bg-purple-50 border border-purple-200 rounded text-[10px] break-all block font-bold text-purple-900">
                      {selectedLog.blockchainTxId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Raw Parameter Details (if any) */}
            {selectedLog.details && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Event Parameters & Payload
                </h4>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[10px] font-mono overflow-x-auto max-h-40">
                  {typeof selectedLog.details === "object" 
                    ? JSON.stringify(selectedLog.details, null, 2) 
                    : selectedLog.details}
                </pre>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200">
              <button
                onClick={() => setSelectedLog(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs cursor-pointer"
              >
                Close Audit Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLedger;