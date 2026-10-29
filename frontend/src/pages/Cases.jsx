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
  AlertCircle
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
      setError("Failed to fetch cases from Express API server.");
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
        {/* Breadcrumbs */}
        <button
          onClick={() => navigate("/cases")}
          className="flex items-center gap-2 text-sm text-cyber-muted hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Caseload List
        </button>

        {/* Case Header Card */}
        <div className="bg-[#151B2C]/60 border border-[#1F2937] p-8 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-cyan-400"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-xs font-mono font-semibold bg-cyan-950/30 text-cyan-400 border border-cyan-900/30 px-2.5 py-1 rounded inline-block mb-3">
                {currentCase.caseNumber}
              </span>
              <h2 className="text-2xl font-tech font-bold text-cyan-100">{currentCase.title}</h2>
              <p className="text-sm text-gray-400 mt-2 max-w-2xl leading-relaxed">{currentCase.description || "No description provided."}</p>
            </div>
            
            <div className="text-sm space-y-2 border-l border-gray-800 pl-4 py-2 flex-shrink-0">
              <div className="flex items-center gap-2 text-cyber-muted">
                <User className="w-4 h-4 text-cyan-400" />
                <span>Opened By: {currentCase.creator?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-cyber-muted">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Opened On: {new Date(currentCase.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Evidence files under this case */}
        <div className="bg-[#151B2C]/40 border border-[#1F2937] rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-tech text-xs tracking-wider uppercase text-cyan-400">Registered Digital Evidence Vault</h3>
            {hasRole(["admin", "investigator"]) && (
              <Link
                to={`/register?caseId=${currentCase.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 rounded font-semibold text-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Evidence File
              </Link>
            )}
          </div>

          {detailsLoading ? (
            <div className="py-12 flex items-center justify-center text-cyan-400 font-mono text-xs">
              <div className="w-6 h-6 border-2 border-t-cyan-400 border-r-transparent border-b-cyan-400 border-l-transparent rounded-full animate-spin mr-3"></div>
              LOADING ENCRYPTED VAULT...
            </div>
          ) : !currentCase.evidenceItems || currentCase.evidenceItems.length === 0 ? (
            <div className="py-12 border border-dashed border-gray-800 rounded-lg flex flex-col items-center justify-center text-gray-500">
              <FileCheck className="w-10 h-10 text-cyber-muted mb-2 animate-bounce" />
              <p className="text-sm">No evidence has been registered under this case yet.</p>
              {hasRole(["admin", "investigator"]) && (
                <p className="text-xs text-cyber-muted mt-1">Click the "Add Evidence File" button to cryptographically secure one.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-800 text-cyber-muted uppercase tracking-wider">
                    <th className="py-3 px-4">Evidence File</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">SHA-256 Fingerprint</th>
                    <th className="py-3 px-4">Custodian</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {currentCase.evidenceItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#151B2C]/20 transition-colors">
                      <td className="py-3 px-4 font-semibold text-cyan-100">{item.evidenceName}</td>
                      <td className="py-3 px-4 text-gray-400 font-mono">{item.fileType}</td>
                      <td className="py-3 px-4 font-mono text-cyber-muted" title={item.fileHash}>
                        {item.fileHash.substring(0, 16)}...
                      </td>
                      <td className="py-3 px-4 text-cyan-200">{item.custodian?.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          item.status === "REGISTERED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-950/20" : "bg-yellow-500/10 text-yellow-400"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/evidence/${item.id}`}
                          className="px-2.5 py-1 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-900/30 text-cyan-400 rounded font-semibold text-[10px] transition-all inline-block"
                        >
                          Access File &rarr;
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-tech font-bold text-cyan-400 tracking-wide">ACTIVE CASELOAD</h2>
          <p className="text-xs text-cyber-muted">Investigative dossiers mapping registered digital evidence packages.</p>
        </div>

        {hasRole(["admin", "investigator"]) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold rounded-lg text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Initialize Dossier
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-cyan-400 font-mono text-xs">
          <div className="w-8 h-8 border-3 border-t-cyan-400 border-r-transparent border-b-cyan-400 border-l-transparent rounded-full animate-spin mb-3"></div>
          FETCHING SYSTEM DOSSIERS...
        </div>
      ) : cases.length === 0 ? (
        <div className="py-24 border border-dashed border-gray-800 rounded-xl flex flex-col items-center justify-center text-gray-500">
          <FolderLock className="w-12 h-12 text-cyber-muted mb-2 animate-pulse" />
          <p className="text-sm font-semibold">No active cases are logged in the database.</p>
          {hasRole(["admin", "investigator"]) && (
            <p className="text-xs text-cyber-muted mt-1">Click the "Initialize Dossier" button to open a new case investigation.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((c) => (
            <div key={c.id} className="bg-[#151B2C]/40 border border-[#1F2937] hover:border-cyan-500/30 p-6 rounded-xl flex flex-col justify-between transition-all group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-mono font-semibold bg-cyan-950/30 text-cyan-400 border border-cyan-900/30 px-2 py-0.5 rounded">
                    {c.caseNumber}
                  </span>
                  <span className="text-[10px] text-cyber-muted font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-cyan-500" />
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-tech text-base font-bold text-cyan-100 group-hover:text-cyan-400 transition-colors mb-2">
                  {c.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4 truncate-3-lines">
                  {c.description || "No description provided."}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between">
                <span className="text-xs text-cyber-muted flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-purple-400" />
                  {c.evidenceItems?.length || 0} Registered Files
                </span>
                
                <Link
                  to={`/cases/${c.id}`}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                >
                  Access Dossier &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Initialize Dossier Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-[#111827] border border-[#1F2937] rounded-xl shadow-2xl p-6">
            <h3 className="font-tech text-base font-bold text-cyan-400 mb-2 uppercase">Initialize Case Dossier</h3>
            <p className="text-xs text-gray-400 mb-6">Create a case dossier to start cryptographically registering files.</p>

            <form onSubmit={handleCreateCase} className="space-y-4">
              <div>
                <label className="text-[10px] text-cyber-muted font-semibold uppercase block mb-1">Case Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Central Vault Incident"
                  className="w-full bg-[#151B2C] border border-[#1F2937] focus:border-cyan-400 rounded-lg px-4 py-2.5 text-xs text-gray-100 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-cyber-muted font-semibold uppercase block mb-1">Dossier Overview / Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detail the case scope, target materials, and investigative leads..."
                  rows={4}
                  className="w-full bg-[#151B2C] border border-[#1F2937] focus:border-cyan-400 rounded-lg px-4 py-2.5 text-xs text-gray-100 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-800 hover:bg-gray-800 rounded-lg text-xs font-semibold text-cyber-muted hover:text-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold rounded-lg text-xs tracking-wide flex items-center gap-1.5"
                >
                  {createLoading ? (
                    <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Create Case"
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
