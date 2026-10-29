import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { 
  SearchCode, 
  UploadCloud, 
  ShieldCheck, 
  AlertTriangle, 
  Cpu, 
  ExternalLink,
  HelpCircle,
  FileSearch,
  Sparkles
} from "lucide-react";

const VerifyEvidence = () => {
  const [searchParams] = useSearchParams();
  const queryEvidenceId = searchParams.get("evidenceId") || "";

  // Selection state
  const [evidenceList, setEvidenceList] = useState([]);
  const [evidenceId, setEvidenceId] = useState(queryEvidenceId);
  const [file, setFile] = useState(null);

  // Verification result states
  const [verifying, setVerifying] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const response = await axios.get("/api/evidence");
        setEvidenceList(response.data);
      } catch (err) {
        console.error("Failed to load evidence for select dropdown");
      }
    };
    fetchEvidence();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!file || !evidenceId) {
      setError("Please select a target evidence item and upload a file to inspect.");
      return;
    }

    setVerifying(true);
    setError("");
    setReport(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("evidenceId", evidenceId);

    try {
      // Send validation request to API server
      const response = await axios.post("/api/verify", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      setReport(response.data.report);
    } catch (err) {
      setError(err.response?.data?.error || "Integrity verification request failed.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-tech font-bold text-cyan-400 tracking-wide">INTEGRITY AUDIT STATION</h2>
        <p className="text-xs text-cyber-muted">Inspect suspected digital files against immutable blockchain fingerprints.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Hand: Upload Form */}
        <div className="bg-[#151B2C]/40 border border-[#1F2937] p-6 rounded-xl h-fit">
          <h3 className="font-tech text-xs tracking-wider uppercase text-cyan-400 border-b border-gray-800 pb-3 mb-4">Inspection Input</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-950/20 border border-red-500/30 rounded text-red-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-[10px] text-cyber-muted font-semibold uppercase block mb-1">Target Evidence Record</label>
              <select
                value={evidenceId}
                onChange={(e) => setEvidenceId(e.target.value)}
                className="w-full bg-[#151B2C] border border-[#1F2937] focus:border-cyan-400 rounded-lg px-3 py-2.5 text-xs text-gray-100 focus:outline-none"
                required
              >
                <option value="">-- SELECT EVIDENCE ITEM --</option>
                {evidenceList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.evidenceName} ({item.case?.caseNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-cyber-muted font-semibold uppercase block mb-2">Upload Suspected Copy</label>
              <div className="border border-dashed border-gray-800 hover:border-cyan-500/20 bg-[#111827]/40 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer relative group">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  required
                />
                <UploadCloud className="w-8 h-8 text-cyan-400 mb-2 group-hover:scale-105 transition-transform" />
                {file ? (
                  <div className="truncate w-full px-2">
                    <p className="text-xs font-semibold text-cyan-200 truncate">{file.name}</p>
                    <span className="text-[10px] text-cyber-muted font-mono block mt-0.5">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs text-gray-400 font-medium block">Select file to inspect</span>
                    <span className="text-[9px] text-cyber-muted">Any format supported by vault</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={verifying || !file || !evidenceId}
              className="w-full bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-gray-950 py-3 rounded-lg text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {verifying ? (
                <div className="w-5 h-5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <SearchCode className="w-4 h-4" />
                  VERIFY INTEGRITY
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Hand: Inspection Report */}
        <div className="lg:col-span-2 space-y-6">
          {!report && !verifying ? (
            // Empty State
            <div className="bg-[#151B2C]/20 border border-dashed border-gray-800 rounded-xl p-12 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <FileSearch className="w-12 h-12 text-cyber-muted mb-3 animate-pulse" />
              <h3 className="font-tech text-xs tracking-wider uppercase text-cyber-muted">Auditing Panel Idle</h3>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                Upload a file copy and associate it with a registered evidence record to run the checksum comparator.
              </p>
            </div>
          ) : verifying ? (
            // Loading State
            <div className="bg-[#151B2C]/20 border border-[#1F2937] rounded-xl p-12 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <div className="w-10 h-10 border-4 border-t-cyan-400 border-r-transparent border-b-cyan-400 border-l-transparent rounded-full animate-spin mb-4"></div>
              <h3 className="font-tech text-xs tracking-wider uppercase text-cyan-400 animate-pulse">Running Comparator Engine</h3>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                Calculating SHA-256 local checksum & querying immutable contract state...
              </p>
            </div>
          ) : (
            // Results State
            <div className="space-y-6">
              
              {/* Outcome Badge */}
              {report.isVerified ? (
                <div className="bg-[#151B2C]/60 border border-emerald-500/20 p-6 rounded-xl flex items-center gap-4 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-400"></div>
                  <div className="h-10 w-10 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-tech text-sm font-bold text-emerald-400 uppercase tracking-wide">VERIFIED — EVIDENCE INTEGRITY SECURE</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      The file matches the cryptographic fingerprint registered on the blockchain. No alterations detected.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#151B2C]/60 border border-red-500/20 p-6 rounded-xl flex items-center gap-4 relative overflow-hidden animate-neon-pulse">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
                  <div className="h-10 w-10 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-tech text-sm font-bold text-red-500 uppercase tracking-wide animate-pulse">WARNING: TAMPER DETECTED</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      The file does not match the cryptographic fingerprint registered on the blockchain! The evidence payload has been modified.
                    </p>
                  </div>
                </div>
              )}

              {/* Compare Hash Board */}
              <div className="bg-[#151B2C]/40 border border-[#1F2937] p-6 rounded-xl space-y-4">
                <h4 className="font-tech text-xs tracking-wider uppercase text-cyan-400">Cryptographic Checksum Comparison</h4>
                
                <div className="space-y-4 font-mono text-xs">
                  <div className="p-3 bg-[#111827]/40 rounded border border-gray-800">
                    <span className="text-[10px] text-cyber-muted block uppercase font-bold tracking-wider mb-1">
                      Original Blockchain Fingerprint
                    </span>
                    <span className="text-cyan-100 break-all select-all font-semibold block">
                      {report.originalHash}
                    </span>
                  </div>
                  
                  <div className={`p-3 rounded border ${report.isVerified ? "bg-[#111827]/40 border-gray-800" : "bg-red-950/10 border-red-500/20"}`}>
                    <span className="text-[10px] text-cyber-muted block uppercase font-bold tracking-wider mb-1">
                      Submitted File Checksum
                    </span>
                    <span className={`break-all select-all font-semibold block ${report.isVerified ? "text-cyan-100" : "text-red-400"}`}>
                      {report.submittedHash}
                    </span>
                  </div>

                  {report.pHashSimilarity !== null && (
                    <div className="p-3 bg-purple-950/15 border border-purple-500/20 rounded flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">
                          Visual Perceptual Similarity (pHash)
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-normal max-w-sm">
                          Hamming distance indicates the content is visually similar, despite binary edits.
                        </p>
                      </div>
                      <span className="text-xl font-tech font-extrabold text-purple-400">
                        {report.pHashSimilarity}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Audit Trail Credentials */}
              <div className="bg-[#151B2C]/40 border border-[#1F2937] p-6 rounded-xl space-y-3">
                <h4 className="font-tech text-xs tracking-wider uppercase text-cyan-400 border-b border-gray-800 pb-2.5">
                  Audit Credentials Reference
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-cyber-muted text-[10px] block uppercase">Case Dossier Ref</span>
                    <span className="text-cyan-200 block truncate">{report.caseId}</span>
                  </div>
                  <div>
                    <span className="text-cyber-muted text-[10px] block uppercase">Evidence Reference</span>
                    <Link to={`/evidence/${report.evidenceId}`} className="text-cyan-400 hover:underline block truncate">
                      {report.evidenceName} &rarr;
                    </Link>
                  </div>
                  <div>
                    <span className="text-cyber-muted text-[10px] block uppercase">Original Submitter</span>
                    <span className="text-cyan-200 block font-sans">{report.submitter?.name}</span>
                  </div>
                  <div>
                    <span className="text-cyber-muted text-[10px] block uppercase">Current Custodian</span>
                    <span className="text-cyan-200 block font-sans">{report.currentCustodian?.name}</span>
                  </div>
                  <div className="sm:col-span-2 pt-2 border-t border-gray-800/40">
                    <span className="text-cyber-muted text-[10px] block uppercase">Smart Contract Transaction ID</span>
                    <span className="text-purple-400 break-all select-all text-[11px] block">{report.blockchainTxId}</span>
                  </div>
                </div>
              </div>

              {/* Garbage-In Limitation Callout */}
              <div className="p-4 bg-yellow-950/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-yellow-500/80 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-yellow-500">Notice of Authenticity Boundary:</span>
                  <p className="text-gray-400 mt-1 leading-relaxed">
                    ProofShield secures file integrity and proves evidence has not been altered <strong>after</strong> its registration timestamp. This system does not verify if the evidence was genuine at the exact moment it was captured.
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default VerifyEvidence;
