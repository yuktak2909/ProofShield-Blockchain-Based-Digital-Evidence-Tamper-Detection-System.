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
  Terminal, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  FileText,
  Activity,
  Layers,
  ArrowUpDown
} from "lucide-react";

const CATEGORIES = [
  "ALL",
  "AUTH",
  "CASE",
  "EVIDENCE",
  "CUSTODY",
  "BLOCKCHAIN",
  "RETENTION",
  "REPORT",
  "ADMIN"
];

const AuditLedger = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [page, setPage] = useState(1);
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
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedCategory, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const exportAuditReport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(logs, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `proofshield_audit_ledger_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case "AUTH":
        return "bg-slate-100 text-slate-700 border-slate-300";
      case "CASE":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "EVIDENCE":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "CUSTODY":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "BLOCKCHAIN":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "RETENTION":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "ADMIN":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              ISO/IEC 27037 & BSA Sec 63 Compliance
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit & Integrity Ledger</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Append-only chronological record documenting every authentication event, evidence access, custody transfer, cryptographic verification, and administrative modification across the enterprise.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportAuditReport}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Export Ledger JSON
          </button>
          <button
            onClick={fetchLogs}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Control Bar: Category Filters & Search */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-4">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] uppercase mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-blue-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by action, actor, target entity, or IP address..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main Audit Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Audit Event Log
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500 font-medium">
            Showing {logs.length} of {total} recorded events
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-xs">
            <div className="w-7 h-7 border-3 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent rounded-full animate-spin mb-3"></div>
            Loading forensic audit ledger...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs border-dashed">
            No audit records found matching the specified parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider font-mono">
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Network / Client</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getCategoryBadge(log.category)}`}>
                        {log.category}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 font-bold text-slate-900 font-sans">
                      {log.action}
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4 whitespace-nowrap font-sans">
                      {log.user ? (
                        <div>
                          <span className="font-semibold text-slate-900 block text-xs">{log.user.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Role: {log.user.role?.toUpperCase()}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">SYSTEM / ANONYMOUS</span>
                      )}
                    </td>

                    {/* Target Entity */}
                    <td className="py-3 px-4 text-slate-700">
                      {log.targetEntity ? (
                        <div className="truncate max-w-[200px]" title={log.targetId || ""}>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block">{log.targetEntity}</span>
                          <span className="text-slate-900 text-[11px] truncate block">{log.targetId ? log.targetId.substring(0, 18) + "..." : "N/A"}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* IP & Client */}
                    <td className="py-3 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                      <div>IP: {log.ipAddress || "127.0.0.1"}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]" title={log.userAgent}>
                        {log.userAgent ? log.userAgent.split(" ")[0] : "Localhost"}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {log.status === "SUCCESS" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                          <XCircle className="w-3 h-3" />
                          FAILED
                        </span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
          <span className="text-slate-500">
            Page {page} of {Math.ceil(total / limit) || 1}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * limit >= total}
              className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AuditLedger;
