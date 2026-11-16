import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FolderLock, 
  FileCheck, 
  ShieldCheck, 
  AlertTriangle, 
  History, 
  Cpu, 
  ArrowRight, 
  Plus, 
  SearchCode, 
  CheckCircle2, 
  Lock, 
  Clock, 
  Eye, 
  Download, 
  Send, 
  FileText,
  AlertOctagon,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  Copy,
  Check,
  Calendar
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, Legend } from "recharts";

const Dashboard = () => {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    openInvestigations: 0,
    registeredEvidence: 0,
    pendingCustodyTransfers: 0,
    integrityAlerts: 0,
    totalCases: 0,
    heldEvidence: 0,
    totalVerifications: 0,
    totalCustodyEvents: 0
  });

  const [attentionAlerts, setAttentionAlerts] = useState([]);
  const [evidenceDistribution, setEvidenceDistribution] = useState([]);
  const [verificationActivity, setVerificationActivity] = useState([]);
  const [recentEvidence, setRecentEvidence] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [dateRange, setDateRange] = useState("7d"); // 7d, 30d, all
  const [loading, setLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get("/api/admin/stats");
      const data = response.data;
      if (data.metrics) setMetrics(data.metrics);
      if (data.attentionAlerts) setAttentionAlerts(data.attentionAlerts);
      if (data.evidenceDistribution) setEvidenceDistribution(data.evidenceDistribution);
      if (data.verificationActivity) setVerificationActivity(data.verificationActivity);
      if (data.recentEvidence) setRecentEvidence(data.recentEvidence);
      if (data.recentActivity) setRecentActivity(data.recentActivity);
    } catch (err) {
      console.warn("Could not load stats from API:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCopyHash = (hash, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getIntegrityBadge = (status) => {
    switch (status) {
      case "Hash Match":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Hash Mismatch":
        return "bg-red-50 text-red-700 border-red-200 font-bold animate-pulse";
      case "Verification Failed":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "warning":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  // Filter verification chart data based on selected date range
  const filteredVerificationData = verificationActivity.slice(
    dateRange === "7d" ? -7 : dateRange === "30d" ? -30 : 0
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. Page Header (Compact & Professional) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#E8E4E1] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#343239] tracking-tight">Dashboard</h1>
          <p className="text-xs text-[#57515A] mt-0.5">
            Monitor active investigations, registered evidence, custody activity, and digital evidence integrity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/verify"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FAF8F7] border border-[#DDD7D2] text-[#343239] font-semibold rounded-lg text-xs shadow-2xs transition-all cursor-pointer"
          >
            <SearchCode className="w-3.5 h-3.5 text-[#087443]" />
            Verify Checksum
          </Link>
          <Link
            to="/register"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#873D50] hover:bg-[#732F40] text-white font-semibold rounded-lg text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Register Evidence
          </Link>
        </div>
      </div>

      {/* 2. Four Operational KPI Cards (Clickable & Informative) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Open Investigations */}
        <div 
          onClick={() => navigate("/cases")}
          className="bg-white border border-[#E8E4E1] hover:border-[#873D50] hover:shadow-sm p-4 rounded-xl shadow-xs transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#57515A] font-mono">Open Investigations</span>
            <div className="p-2 rounded-lg bg-[#F2E2E7] text-[#873D50]">
              <FolderLock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-[#343239] font-mono">{metrics.openInvestigations}</span>
            <span className="text-[11px] text-[#57515A] block mt-0.5">
              Across active cases &bull; Click to view
            </span>
          </div>
        </div>

        {/* KPI 2: Registered Evidence */}
        <div 
          onClick={() => navigate("/evidence")}
          className="bg-white border border-[#E8E4E1] hover:border-[#873D50] hover:shadow-sm p-4 rounded-xl shadow-xs transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#57515A] font-mono">Registered Evidence</span>
            <div className="p-2 rounded-lg bg-[#F9F5FF] text-[#6941C6]">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-[#343239] font-mono">{metrics.registeredEvidence}</span>
            <span className="text-[11px] text-[#57515A] block mt-0.5">
              Sealed in repository &bull; Click to inspect
            </span>
          </div>
        </div>

        {/* KPI 3: Pending Custody Transfers */}
        <div 
          onClick={() => navigate("/custody")}
          className={`bg-white border p-4 rounded-xl shadow-xs transition-all cursor-pointer flex flex-col justify-between ${
            metrics.pendingCustodyTransfers > 0 
              ? "border-[#FEDF89] bg-[#FEF6EE]/40 hover:border-[#F79009] hover:shadow-sm" 
              : "border-[#E8E4E1] hover:border-[#873D50] hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#57515A] font-mono">Pending Transfers</span>
            <div className={`p-2 rounded-lg ${metrics.pendingCustodyTransfers > 0 ? "bg-[#FEF6EE] text-[#986000]" : "bg-[#FAF8F7] text-[#57515A]"}`}>
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-2xl font-black font-mono ${metrics.pendingCustodyTransfers > 0 ? "text-[#986000]" : "text-[#343239]"}`}>
              {metrics.pendingCustodyTransfers}
            </span>
            <span className={`text-[11px] block mt-0.5 ${metrics.pendingCustodyTransfers > 0 ? "text-[#986000] font-semibold" : "text-[#57515A]"}`}>
              {metrics.pendingCustodyTransfers > 0 ? "Awaiting recipient acceptance" : "All custody handoffs resolved"}
            </span>
          </div>
        </div>

        {/* KPI 4: Integrity Alerts */}
        <div 
          onClick={() => navigate("/verify")}
          className={`bg-white border p-4 rounded-xl shadow-xs transition-all cursor-pointer flex flex-col justify-between ${
            metrics.integrityAlerts > 0 
              ? "border-[#FECDCA] bg-[#FEF3F2]/40 hover:border-[#D92D20] hover:shadow-sm" 
              : "border-[#E8E4E1] hover:border-[#873D50] hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#57515A] font-mono">Integrity Alerts</span>
            <div className={`p-2 rounded-lg ${metrics.integrityAlerts > 0 ? "bg-[#FEF3F2] text-[#B42318]" : "bg-[#EDFDF5] text-[#087443]"}`}>
              {metrics.integrityAlerts > 0 ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-2xl font-black font-mono ${metrics.integrityAlerts > 0 ? "text-[#B42318]" : "text-[#087443]"}`}>
              {metrics.integrityAlerts}
            </span>
            <span className={`text-[11px] block mt-0.5 ${metrics.integrityAlerts > 0 ? "text-[#B42318] font-bold" : "text-[#087443] font-medium"}`}>
              {metrics.integrityAlerts > 0 ? "Hash mismatch detected" : "Zero tampering detected"}
            </span>
          </div>
        </div>

      </div>

      {/* 3. Attention Required Section (Prominent & Actionable) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Attention Required</h2>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              {attentionAlerts.length} Actionable {attentionAlerts.length === 1 ? "Item" : "Items"}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Automated compliance & verification alerts
          </span>
        </div>

        {attentionAlerts.length === 0 ? (
          <div className="py-6 flex items-center justify-center gap-2 text-xs text-emerald-700 bg-emerald-50/50 rounded-lg border border-emerald-100 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>No immediate forensic or custody interventions required. All active exhibits conform to ledger integrity specifications.</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {attentionAlerts.map((alert) => (
              <div 
                key={alert.id}
                className="p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-md border shrink-0 mt-0.5 ${getSeverityBadge(alert.severity)}`}>
                    {alert.severity === "critical" ? (
                      <AlertOctagon className="w-4 h-4" />
                    ) : alert.severity === "warning" ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="font-bold text-slate-900">{alert.title}</span>
                      <span className="text-[10px] font-mono bg-white border border-slate-200 px-1.5 py-0.2 rounded text-slate-600">
                        Case: {alert.caseId}
                      </span>
                      {alert.evidenceName && (
                        <span className="text-[10px] font-mono text-slate-500 truncate max-w-xs">
                          {alert.evidenceName}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{alert.description}</p>
                    <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                      Logged {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 self-end md:self-center">
                  <Link
                    to={alert.actionLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-[11px] font-semibold transition-all shadow-2xs"
                  >
                    {alert.actionLabel}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Verification Activity & Evidence Distribution (Two-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Verification Activity (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 p-5 rounded-xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Verification Activity</h3>
              <p className="text-[11px] text-slate-400">Audits conducted against Ethereum smart contract digests</p>
            </div>
            
            {/* Date Range Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
              <button
                onClick={() => setDateRange("7d")}
                className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                  dateRange === "7d" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setDateRange("30d")}
                className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                  dateRange === "30d" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setDateRange("all")}
                className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                  dateRange === "all" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Time
              </button>
            </div>
          </div>

          <div className="h-56 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredVerificationData}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#FFFFFF", 
                    borderColor: "#E2E8F0", 
                    borderRadius: 8, 
                    color: "#0F172A", 
                    fontSize: 11 
                  }} 
                />
                <Legend 
                  wrapperStyle={{ fontSize: 11, paddingTop: 6 }} 
                  iconSize={10}
                />
                <Bar dataKey="verified" fill="#1D4ED8" radius={[3, 3, 0, 0]} name="Successful Verifications" />
                <Bar dataKey="mismatches" fill="#DC2626" radius={[3, 3, 0, 0]} name="Hash Mismatches" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Evidence Format Allocation (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 p-5 rounded-xl shadow-xs space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Evidence Type Distribution</h3>
            <p className="text-[11px] text-slate-400">Actual catalog count categorized by forensic media type</p>
          </div>

          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={evidenceDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={58}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {evidenceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val, name) => [`${val} items`, name]}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
            {evidenceDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="h-2 w-2 rounded-full inline-block shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-700 truncate">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900 ml-1">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. Recently Registered Evidence & Recent Audit Activity (Two-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Recently Registered Evidence (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Recently Registered Evidence</h3>
              <p className="text-[11px] text-slate-400">Latest exhibits indexed and committed</p>
            </div>
            <Link 
              to="/evidence" 
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
            >
              View All Evidence
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5 flex-1">
            {recentEvidence.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No evidence records indexed.</p>
            ) : (
              recentEvidence.map((item) => (
                <div 
                  key={item.id} 
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="truncate pr-2">
                    <Link 
                      to={`/evidence/${item.id}`} 
                      className="text-xs font-bold text-slate-900 hover:text-blue-700 truncate block"
                      title={item.evidenceName}
                    >
                      {item.evidenceName}
                    </Link>
                    
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-slate-500 font-mono">
                      <span className="font-semibold text-blue-700">{item.case?.caseNumber || "CASE"}</span>
                      <span>&bull;</span>
                      <span className="text-slate-600">{item.category}</span>
                      <span>&bull;</span>
                      <button 
                        onClick={(e) => handleCopyHash(item.fileHash, e)}
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                        title="Click to copy full SHA-256 fingerprint"
                      >
                        <span>SHA: {item.fileHash?.substring(0, 10)}...</span>
                        {copiedHash === item.fileHash ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                      <span>Custodian: <span className="text-slate-700 font-semibold">{item.custodian?.name || "Evidence Room"}</span></span>
                      <span>&bull;</span>
                      <span>{new Date(item.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getIntegrityBadge(item.integrityStatus)}`}>
                      {item.integrityStatus || "Not Yet Verified"}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <Link
                        to={`/custody?evidenceId=${item.id}`}
                        className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded text-[10px] font-semibold"
                      >
                        Custody History
                      </Link>
                      <Link
                        to={`/cases/${item.caseId}`}
                        className="px-2 py-0.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 rounded text-[10px] font-semibold"
                      >
                        View Case
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Audit Activity (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Recent Audit Activity</h3>
              <p className="text-[11px] text-slate-400">Chain of custody & operational audit stream</p>
            </div>
            <Link 
              to="/audit-logs" 
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
            >
              View Full Audit Log
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5 flex-1">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No audit events recorded.</p>
            ) : (
              recentActivity.map((log) => (
                <div 
                  key={log.id} 
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs text-slate-900 font-medium leading-snug">
                      {log.action}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-mono">
                      <span className="font-semibold text-blue-700">{log.caseNumber}</span>
                      <span>&bull;</span>
                      <span className="truncate">{log.evidenceName}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                      log.status === "Pending"
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : log.status === "Rejected"
                        ? "bg-red-50 text-red-800 border-red-300"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      {log.status}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
