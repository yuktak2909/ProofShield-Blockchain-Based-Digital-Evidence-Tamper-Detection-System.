import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { 
  FolderLock, 
  FileCheck, 
  Plus, 
  ArrowLeft, 
  ShieldCheck, 
  User, 
  Calendar,
  AlertCircle,
  FileText,
  History,
  X,
  CheckCircle2,
  Users,
  Activity,
  Download,
  AlertTriangle,
  Lock,
  Tag,
  Flag,
  Edit2
} from "lucide-react";

const Cases = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  
  // Lists state
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");

  // Details state
  const [currentCase, setCurrentCase] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview, evidence, team, activities, reports, closure
  const [activities, setActivities] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Create Case modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("Digital Forensics");
  const [newPriority, setNewPriority] = useState("Medium");
  const [createLoading, setCreateLoading] = useState(false);

  // Close Case modal state
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closureReason, setClosureReason] = useState("");
  const [closeLoading, setCloseLoading] = useState(false);

  // Team assign state
  const [assignInvestigator, setAssignInvestigator] = useState("");
  const [assignAnalyst, setAssignAnalyst] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/cases");
      setCases(response.data);
    } catch (err) {
      setError("Failed to fetch cases from API server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCaseDetails = async (id) => {
    setDetailsLoading(true);
    try {
      const response = await axios.get(`/api/cases/${id}`);
      setCurrentCase(response.data);
      setAssignInvestigator(response.data.assignedInvestigatorId || "");
      setAssignAnalyst(response.data.assignedAnalystId || "");
      
      // Also fetch activities
      try {
        const actRes = await axios.get(`/api/cases/${id}/activities`);
        setActivities(actRes.data || []);
      } catch (e) {
        // Non-blocking
      }
    } catch (err) {
      setError("Failed to load case details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/admin/users");
      setUsersList(res.data || []);
    } catch (e) {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchCases();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (caseId) {
      fetchCaseDetails(caseId);
      setActiveTab("overview");
    } else {
      setCurrentCase(null);
    }
  }, [caseId]);

  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!newTitle) return;
    
    setCreateLoading(true);
    try {
      await axios.post("/api/cases", {
        title: newTitle,
        description: newDesc,
        category: newCategory,
        priority: newPriority
      });
      setNewTitle("");
      setNewDesc("");
      setShowCreateModal(false);
      fetchCases();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create case.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCloseCase = async (e) => {
    e.preventDefault();
    if (!closureReason) return;

    setCloseLoading(true);
    try {
      await axios.post(`/api/cases/${caseId}/close`, { closureReason });
      setShowCloseModal(false);
      setClosureReason("");
      fetchCaseDetails(caseId);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to close case.");
    } finally {
      setCloseLoading(false);
    }
  };

  const handleSaveTeam = async () => {
    setAssignLoading(true);
    try {
      await axios.patch(`/api/cases/${caseId}`, {
        assignedInvestigatorId: assignInvestigator || null,
        assignedAnalystId: assignAnalyst || null
      });
      fetchCaseDetails(caseId);
      alert("Case personnel assignments updated successfully.");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update team members.");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleDownloadCaseReport = async () => {
    try {
      const res = await axios.get(`/api/reports/case/${caseId}`);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Case_Summary_Report_${currentCase.caseNumber}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      alert("Failed to export case report.");
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Critical": return "bg-red-50 text-red-700 border-red-200 font-bold";
      case "High": return "bg-amber-50 text-amber-700 border-amber-200 font-semibold";
      case "Medium": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Closed": return "bg-slate-100 text-slate-700 border-slate-300 font-bold";
      case "Under Investigation": return "bg-blue-50 text-blue-700 border-blue-200 font-semibold";
      case "Pending Review": return "bg-purple-50 text-purple-700 border-purple-200 font-semibold";
      default: return "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold";
    }
  };

  const filteredCases = cases.filter(c => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchNumber = c.caseNumber?.toLowerCase().includes(q);
      const matchTitle = c.title?.toLowerCase().includes(q);
      const matchDesc = c.description?.toLowerCase().includes(q);
      if (!matchNumber && !matchTitle && !matchDesc) return false;
    }
    if (filterCategory !== "ALL" && c.category !== filterCategory) return false;
    if (filterStatus !== "ALL" && c.status !== filterStatus) return false;
    if (filterPriority !== "ALL" && c.priority !== filterPriority) return false;
    return true;
  }).sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortBy === "oldest" ? timeA - timeB : timeB - timeA;
  });

  // -------------------------------------------------------------
  // DEDICATED 6-TAB CASE DETAILS WORKSPACE VIEW
  // -------------------------------------------------------------
  if (currentCase) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <button
          onClick={() => navigate("/cases")}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Case Catalog
        </button>

        {/* Case Header Banner */}
        <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-xs">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded">
                  {currentCase.caseNumber}
                </span>
                <span className={`text-[11px] uppercase px-2.5 py-0.5 rounded border ${getStatusBadge(currentCase.status)}`}>
                  {currentCase.status}
                </span>
                <span className={`text-[11px] uppercase px-2.5 py-0.5 rounded border ${getPriorityBadge(currentCase.priority)}`}>
                  PRIORITY: {currentCase.priority}
                </span>
                <span className="text-[11px] bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded">
                  {currentCase.category || "General Forensics"}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{currentCase.title}</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                {currentCase.description || "No official description recorded."}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2.5">
              {currentCase.status !== "Closed" && hasRole(["admin", "investigator"]) && (
                <button
                  onClick={() => setShowCloseModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold rounded-lg text-xs transition-all cursor-pointer shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  Close & Archive Case
                </button>
              )}
              {hasRole(["admin", "investigator"]) && (
                <Link
                  to={`/register?caseId=${currentCase.id}`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Add Evidence File
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 6-Tab Navigation Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="flex border-b border-slate-200 overflow-x-auto text-xs font-bold uppercase tracking-wider bg-slate-50/50">
            {[
              { id: "overview", label: "Overview", icon: FolderLock },
              { id: "evidence", label: `Evidence Records (${currentCase.evidenceItems?.length || 0})`, icon: FileCheck },
              { id: "team", label: "Team Members", icon: Users },
              { id: "activities", label: `Activity Log (${activities.length})`, icon: Activity },
              { id: "reports", label: "Forensic Reports", icon: FileText }
            ].map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3.5 cursor-pointer border-b-2 transition-all whitespace-nowrap ${
                    isActive 
                      ? "border-blue-700 text-blue-700 bg-white" 
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {/* Tab 1: Overview */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Lead Investigator</span>
                    <p className="text-slate-900 font-bold text-sm">
                      {currentCase.assignedInvestigator?.name || currentCase.creator?.name || "Unassigned"}
                    </p>
                    <p className="text-slate-500 text-[11px] font-mono">{currentCase.assignedInvestigator?.email || "No email"}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Assigned Forensic Analyst</span>
                    <p className="text-slate-900 font-bold text-sm">
                      {currentCase.assignedAnalyst?.name || "None Assigned"}
                    </p>
                    <p className="text-slate-500 text-[11px] font-mono">{currentCase.assignedAnalyst?.email || "Pending Analyst Assignment"}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Timeline & Archive Status</span>
                    <p className="text-slate-900 font-medium">Created: {new Date(currentCase.createdAt).toLocaleString()}</p>
                    {currentCase.closedAt && (
                      <p className="text-red-700 font-semibold text-[11px]">
                        Closed on {new Date(currentCase.closedAt).toLocaleDateString()} by {currentCase.closer?.name || "Officer"}
                      </p>
                    )}
                  </div>
                </div>

                {currentCase.closureReason && (
                  <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl text-xs space-y-1">
                    <span className="font-bold uppercase text-slate-800 text-[10px] block">Official Case Closure Justification</span>
                    <p className="text-slate-700 leading-relaxed">{currentCase.closureReason}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Evidence Records */}
            {activeTab === "evidence" && (
              <div className="space-y-4">
                {!currentCase.evidenceItems || currentCase.evidenceItems.length === 0 ? (
                  <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-500">
                    <FileCheck className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No evidence items registered under this case yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-semibold">
                          <th className="py-3 px-4">Evidence Title</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Current Custodian</th>
                          <th className="py-3 px-4">Retention Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentCase.evidenceItems.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-semibold text-slate-900">{item.evidenceName}</td>
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{item.fileType}</td>
                            <td className="py-3 px-4 text-slate-700">{item.custodian?.name || "Evidence Room"}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.retentionStatus === "Under Legal Hold"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}>
                                {item.retentionStatus || "Active"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <Link
                                to={`/custody?evidenceId=${item.id}`}
                                className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded font-semibold text-[10px]"
                              >
                                Custody Trail
                              </Link>
                              <Link
                                to={`/evidence/${item.id}`}
                                className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold text-[10px]"
                              >
                                View File &rarr;
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Team Members */}
            {activeTab === "team" && (
              <div className="max-w-xl space-y-5 text-xs">
                <div>
                  <label className="text-slate-700 font-semibold uppercase block mb-1.5">Assign Lead Investigator</label>
                  <select
                    value={assignInvestigator}
                    onChange={(e) => setAssignInvestigator(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                    disabled={currentCase.status === "Closed" || !hasRole(["admin", "investigator"])}
                  >
                    <option value="">-- Select Investigator --</option>
                    {usersList.filter(u => u.role === "investigator" || u.role === "admin").map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold uppercase block mb-1.5">Assign Lead Forensic Analyst</label>
                  <select
                    value={assignAnalyst}
                    onChange={(e) => setAssignAnalyst(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                    disabled={currentCase.status === "Closed" || !hasRole(["admin", "investigator"])}
                  >
                    <option value="">-- Select Forensic Analyst --</option>
                    {usersList.filter(u => u.role === "analyst" || u.role === "admin").map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>

                {hasRole(["admin", "investigator"]) && currentCase.status !== "Closed" && (
                  <button
                    onClick={handleSaveTeam}
                    disabled={assignLoading}
                    className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-xs"
                  >
                    {assignLoading ? "Saving..." : "Save Personnel Assignments"}
                  </button>
                )}
              </div>
            )}

            {/* Tab 4: Activity Log */}
            {activeTab === "activities" && (
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No audit activities logged for this case yet.</p>
                ) : (
                  activities.map(act => (
                    <div key={act.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900">{act.action}</span>
                          <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                            {act.category}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-tight">
                          By <strong className="text-slate-800">{act.actor?.name || "System"}</strong> ({act.actorRole || "User"})
                          {act.details && ` — ${typeof act.details === "object" ? JSON.stringify(act.details) : act.details}`}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                        {new Date(act.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 5: Reports */}
            {activeTab === "reports" && (
              <div className="space-y-4 text-xs">
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Official Case Summary Dossier</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Export comprehensive technical report containing full case metadata, registered evidence SHA-256 digests, and custodian histories.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadCaseReport}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs shadow-xs cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Export Case Dossier (JSON/PDF)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Case Closure Confirmation Modal */}
        {showCloseModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-6">
            <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative">
              <button 
                onClick={() => setShowCloseModal(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-600" />
                Case Closure Confirmation
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Closing this case marks all evidence items as immutable archives. You must provide a formal statutory closure reason.
              </p>

              <form onSubmit={handleCloseCase} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-700 font-semibold uppercase block mb-1.5">
                    Formal Closure Reason & Justification *
                  </label>
                  <textarea
                    value={closureReason}
                    onChange={(e) => setClosureReason(e.target.value)}
                    placeholder="e.g. Adjudicated in district court. All evidentiary requirements satisfied."
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCloseModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={closeLoading}
                    className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg text-xs"
                  >
                    {closeLoading ? "Archiving..." : "Confirm & Seal Case"}
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
  // LIST VIEW
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E8E4E1] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#343239] tracking-tight">Cases</h1>
          <p className="text-xs text-[#57515A] mt-0.5">
            Active investigative case records containing cryptographically sealed digital evidence.
          </p>
        </div>

        {hasRole(["admin", "investigator"]) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#873D50] hover:bg-[#732F40] text-white font-semibold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create New Case
          </button>
        )}
      </div>

      {/* Filter Toolbar with Search & Multi-criteria Selectors */}
      <div className="bg-white border border-[#E8E4E1] p-4 rounded-xl shadow-xs space-y-3 text-xs">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search cases by Case ID, title, or scenario keywords..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none"
            />
          </div>

          {/* Quick Clear Filter */}
          {(searchTerm || filterCategory !== "ALL" || filterStatus !== "ALL" || filterPriority !== "ALL") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterCategory("ALL");
                setFilterStatus("ALL");
                setFilterPriority("ALL");
              }}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 px-2 py-1 cursor-pointer shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Category */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Category:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="Property Crime">Property Crime</option>
                <option value="Road Traffic Offence">Road Traffic Offence</option>
                <option value="Cyber / Financial Crime">Cyber / Financial Crime</option>
                <option value="Digital Forensics">Digital Forensics</option>
              </select>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Open">Open</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Filter by Priority */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Priority:</span>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
              >
                <option value="newest">Date Opened (Newest)</option>
                <option value="oldest">Date Opened (Oldest)</option>
              </select>
            </div>
          </div>

          <span className="text-slate-400 font-mono text-[11px]">{filteredCases.length} {filteredCases.length === 1 ? "case" : "cases"} indexed</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-blue-700 font-medium text-xs">
          <div className="w-8 h-8 border-3 border-blue-700 border-t-transparent rounded-full animate-spin mb-3"></div>
          Retrieving official case records...
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="py-20 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-500 bg-white">
          <FolderLock className="w-12 h-12 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No matching cases found.</p>
          <p className="text-xs text-slate-400 mt-1">Adjust search parameters or initialize a new case file.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCases.map((c) => (
            <div 
              key={c.id} 
              className="bg-white border border-[#E8E4E1] hover:border-[#873D50] hover:shadow-md p-5 rounded-xl flex flex-col justify-between transition-all group"
            >
              <div>
                {/* Header row: Case Number & Badges */}
                <div className="flex justify-between items-start mb-2.5">
                  <span className="text-xs font-mono font-bold bg-[#F2E2E7] text-[#873D50] border border-[#E5C3CD] px-2.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                    {c.caseNumber}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border whitespace-nowrap ${getStatusBadge(c.status)}`}>
                      {c.status}
                    </span>
                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border whitespace-nowrap ${getPriorityBadge(c.priority)}`}>
                      {c.priority}
                    </span>
                  </div>
                </div>

                {/* Case Title */}
                <h3 className="text-sm font-bold text-[#343239] group-hover:text-[#873D50] transition-colors mb-1.5 leading-snug break-all">
                  {c.title}
                </h3>

                {/* Crime Category Tag */}
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="text-[10px] font-semibold bg-[#FAF8F7] text-[#57515A] border border-[#E8E4E1] px-2 py-0.5 rounded">
                    {c.category}
                  </span>
                  <span className="text-[10px] text-[#8C8490] font-mono">
                    Opened {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Short Case Description */}
                <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-3">
                  {c.description || "No official case summary recorded."}
                </p>

                {/* Assigned Personnel */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[11px] space-y-1 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 uppercase text-[9px] font-bold">Lead Investigator:</span>
                    <span className="text-slate-800 font-semibold truncate max-w-[160px]">
                      {c.assignedInvestigator?.name || c.creator?.name || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 uppercase text-[9px] font-bold">Forensic Analyst:</span>
                    <span className="text-slate-800 font-semibold truncate max-w-[160px]">
                      {c.assignedAnalyst?.name || "Pending Analyst Assignment"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1.5 text-[11px]">
                  <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                  {c.evidenceItems?.length || 0} Evidence {c.evidenceItems?.length === 1 ? "Item" : "Items"}
                </span>
                <Link
                  to={`/cases/${c.id}`}
                  className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  View Case &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create New Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Create New Case</h3>
            <p className="text-xs text-slate-500 mb-5">Open an official investigation case file to begin registering digital evidence.</p>

            <form onSubmit={handleCreateCase} className="space-y-4">
              <div>
                <label className="text-xs text-slate-700 font-semibold uppercase block mb-1">Case Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Residential Burglary or Intersection Collision Incident"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-700 font-semibold uppercase block mb-1">Crime Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="Property Crime">Property Crime</option>
                    <option value="Road Traffic Offence">Road Traffic Offence</option>
                    <option value="Cyber / Financial Crime">Cyber / Financial Crime</option>
                    <option value="Digital Forensics">Digital Forensics</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-semibold uppercase block mb-1">Initial Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold uppercase block mb-1">Investigation Scope / Summary</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe initial dispatch details, scene location, and incident background..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs tracking-wide flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {createLoading ? "Creating..." : "Create Case"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cases;
