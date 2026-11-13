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
  X
} from "lucide-react";

const Cases = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  
  // Lists state
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Details state
  const [currentCase, setCurrentCase] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Create Case state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

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
    } catch (err) {
      setError("Failed to load case details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    if (caseId) {
      fetchCaseDetails(caseId);
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
        description: newDesc
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

  // -------------------------------------------------------------
  // DETAIL VIEW
  // -------------------------------------------------------------
  if (currentCase) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate("/cases")}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Case Catalog
        </button>

        {/* Case Header Card */}
        <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-xl shadow-xs">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded inline-block mb-2">
                {currentCase.caseNumber}
              </span>
              <h2 className="text-2xl font-bold text-slate-900">{currentCase.title}</h2>
              <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
                {currentCase.description || "No official description provided."}
              </p>
            </div>
            
            <div className="text-xs space-y-2 border-l border-slate-200 pl-4 py-2 flex-shrink-0 text-slate-600">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-700" />
                <span>Opened By: <strong className="text-slate-900">{currentCase.creator?.name || "Authorized Investigator"}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-700" />
                <span>Created: {new Date(currentCase.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Evidence Vault under this Case */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Registered Evidence Vault
              </h3>
              <p className="text-xs text-slate-500">Digital assets cryptographically associated with this case file.</p>
            </div>
            {hasRole(["admin", "investigator"]) && (
              <Link
                to={`/register?caseId=${currentCase.id}`}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold text-xs transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Register New Evidence
              </Link>
            )}
          </div>

          {detailsLoading ? (
            <div className="py-12 flex items-center justify-center text-blue-700 font-medium text-xs">
              <div className="w-6 h-6 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mr-3"></div>
              Loading encrypted vault records...
            </div>
          ) : !currentCase.evidenceItems || currentCase.evidenceItems.length === 0 ? (
            <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-500">
              <FileCheck className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No evidence items registered under this case.</p>
              {hasRole(["admin", "investigator"]) && (
                <p className="text-xs text-slate-400 mt-1">Use the "Register New Evidence" button to secure forensic files.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Evidence File</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">SHA-256 Checksum</th>
                    <th className="py-3 px-4">Current Custodian</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentCase.evidenceItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{item.evidenceName}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{item.fileType}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600" title={item.fileHash}>
                        {item.fileHash.substring(0, 16)}...
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{item.custodian?.name || "Unassigned"}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Link
                          to={`/custody?evidenceId=${item.id}`}
                          className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded font-semibold text-[11px] transition-all inline-flex items-center gap-1"
                        >
                          <History className="w-3 h-3" />
                          Custody
                        </Link>
                        <Link
                          to={`/evidence/${item.id}`}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-semibold text-[11px] transition-all inline-block"
                        >
                          View Dossier &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LIST VIEW
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Case Dossiers</h1>
          <p className="text-xs text-slate-500">Investigative case files containing sealed digital forensic evidence.</p>
        </div>

        {hasRole(["admin", "investigator"]) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-sm transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Initialize New Case
          </button>
        )}
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
          Retrieving official case dossiers...
        </div>
      ) : cases.length === 0 ? (
        <div className="py-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-500 bg-white">
          <FolderLock className="w-12 h-12 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No active cases found in system records.</p>
          {hasRole(["admin", "investigator"]) && (
            <p className="text-xs text-slate-400 mt-1">Click "Initialize New Case" to open an investigation dossier.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c) => (
            <div key={c.id} className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md p-6 rounded-xl flex flex-col justify-between transition-all group">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded">
                    {c.caseNumber}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors mb-2">
                  {c.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-3">
                  {c.description || "No case description provided."}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                  <FileCheck className="w-4 h-4 text-purple-600" />
                  {c.evidenceItems?.length || 0} Evidence Files
                </span>
                
                <Link
                  to={`/cases/${c.id}`}
                  className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1"
                >
                  View Case &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Initialize Dossier Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Initialize Case Dossier</h3>
            <p className="text-xs text-slate-500 mb-6">Open an official investigation case file to begin sealing evidence.</p>

            <form onSubmit={handleCreateCase} className="space-y-4">
              <div>
                <label className="text-xs text-slate-700 font-semibold uppercase block mb-1">Case Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Vault Intrusion & Data Tamper Incident"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-4 py-2.5 text-xs text-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold uppercase block mb-1">Investigation Scope / Summary</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe initial dispatch details, scene location, and lead investigator..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-4 py-2.5 text-xs text-slate-900 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs tracking-wide flex items-center gap-1.5 shadow-xs"
                >
                  {createLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Create Case Dossier"
                  )}
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
