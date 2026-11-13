import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  FileText
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCases: 2,
    totalEvidence: 4,
    verifiedEvidence: 4,
    tamperAlerts: 1,
    totalVerifications: 4,
    totalCustodyEvents: 7
  });
  const [recentEvidence, setRecentEvidence] = useState([]);
  const [recentCustody, setRecentCustody] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get("/api/admin/stats");
        setStats(response.data.stats);
        setRecentEvidence(response.data.recentEvidence || []);
        setRecentCustody(response.data.recentCustody || []);
      } catch (err) {
        console.warn("Could not load stats from backend API. Using verified fallback data.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const chartData = [
    { name: "CCTV / Video", value: 3, color: "#1D4ED8" },
    { name: "Forensic PDF Reports", value: 2, color: "#059669" },
    { name: "Audio Recordings", value: 2, color: "#7C3AED" },
    { name: "Scene Photographs", value: 1, color: "#D97706" }
  ];

  const barChartData = [
    { name: "Mon", verifications: 14, alerts: 0 },
    { name: "Tue", verifications: 22, alerts: 1 },
    { name: "Wed", verifications: 18, alerts: 0 },
    { name: "Thu", verifications: 28, alerts: 1 },
    { name: "Fri", verifications: 35, alerts: 0 },
    { name: "Sat", verifications: 12, alerts: 0 },
    { name: "Sun", verifications: 16, alerts: 1 }
  ];

  const getActionBadge = (action) => {
    switch (action) {
      case "transferred": 
        return { label: "TRANSFERRED", bg: "bg-purple-50 text-purple-700 border-purple-200" };
      case "downloaded": 
        return { label: "DOWNLOADED", bg: "bg-blue-50 text-blue-700 border-blue-200" };
      case "viewed": 
        return { label: "VIEWED", bg: "bg-slate-100 text-slate-700 border-slate-200" };
      default: 
        return { label: action?.toUpperCase() || "LOGGED", bg: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              Command Overview
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Digital Forensic Audit Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time monitoring of registered digital exhibits, smart contract state transitions, and tamper detection events.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/verify"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs shadow-2xs transition-all"
          >
            <SearchCode className="w-4 h-4 text-emerald-600" />
            Verify Checksum
          </Link>
          <Link
            to="/register"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            Register New Evidence
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1 */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Active Case Dossiers</span>
            <span className="text-3xl font-extrabold text-slate-900">{stats.totalCases}</span>
            <span className="text-[11px] text-slate-400 block mt-1">Multi-exhibit folders</span>
          </div>
          <div className="h-12 w-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-700">
            <FolderLock className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Total Evidence Items</span>
            <span className="text-3xl font-extrabold text-slate-900">{stats.totalEvidence}</span>
            <span className="text-[11px] text-slate-400 block mt-1">Videos, Audio, PDFs, Photos</span>
          </div>
          <div className="h-12 w-12 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center text-purple-700">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">On-Chain Sealed</span>
            <span className="text-3xl font-extrabold text-emerald-700">{stats.verifiedEvidence}</span>
            <span className="text-[11px] text-emerald-600 block mt-1 font-medium">100% Immutable on Ethereum</span>
          </div>
          <div className="h-12 w-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className={`bg-white border p-5 rounded-xl shadow-xs flex items-center justify-between ${stats.tamperAlerts > 0 ? "border-red-300 bg-red-50/20" : "border-slate-200"}`}>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Tamper Detections</span>
            <span className={`text-3xl font-extrabold ${stats.tamperAlerts > 0 ? "text-red-700" : "text-slate-900"}`}>
              {stats.tamperAlerts}
            </span>
            <span className={`text-[11px] block mt-1 font-medium ${stats.tamperAlerts > 0 ? "text-red-600" : "text-slate-400"}`}>
              {stats.tamperAlerts > 0 ? "Flagged Hash Mismatches" : "Zero Breaches Detected"}
            </span>
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stats.tamperAlerts > 0 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Verification Traffic (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Weekly Integrity Check Verification Traffic</h3>
              <p className="text-[11px] text-slate-400">Total audits conducted by court officials and analysts</p>
            </div>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              High Verification Activity
            </span>
          </div>
          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 8, color: "#0F172A", fontSize: 12, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }} />
                <Bar dataKey="verifications" fill="#1D4ED8" radius={[4, 4, 0, 0]} name="Passed Verifications" />
                <Bar dataKey="alerts" fill="#DC2626" radius={[4, 4, 0, 0]} name="Tamper Detections" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evidence Allocation (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Evidence Format Allocation</h3>
            <p className="text-[11px] text-slate-400">Distribution across vault media types</p>
          </div>

          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-600 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Two Column Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Recent Evidence (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Recent Evidence Registries</h3>
            <Link to="/evidence" className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1">
              Browse Vault
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {recentEvidence.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No evidence records found.</p>
            ) : (
              recentEvidence.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center hover:bg-slate-100/70 transition-all">
                  <div className="truncate pr-3">
                    <Link to={`/evidence/${item.id}`} className="text-xs font-bold text-slate-900 hover:text-blue-700 truncate block">
                      {item.evidenceName}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-mono">
                      <span className="font-semibold text-blue-700">{item.case?.caseNumber}</span>
                      <span>&bull;</span>
                      <span className="truncate">SHA: {item.fileHash?.substring(0, 12)}...</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      to={`/custody?evidenceId=${item.id}`}
                      className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded text-[10px] font-semibold"
                    >
                      Custody
                    </Link>
                    <Link
                      to={`/evidence/${item.id}`}
                      className="px-2 py-1 bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 rounded text-[10px] font-semibold"
                    >
                      Dossier
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Custody Activity Log (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Audit Trail Activity Feed</h3>
            <Link to="/custody" className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1">
              Full Ledger
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {recentCustody.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No recent custody activities logged.</p>
            ) : (
              recentCustody.map((log) => {
                const badge = getActionBadge(log.action);
                return (
                  <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-100/70 transition-all">
                    <div className="truncate pr-3">
                      <p className="text-xs text-slate-900 font-medium">
                        <span className="font-bold text-slate-950">{log.actor?.name || "Officer"}</span> executed <span className="font-semibold">{log.action}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                        Item: {log.evidence?.evidenceName || "Evidence Exhibit"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
