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
  Sparkles,
  CheckCircle2,
  XCircle,
  History,
  FileText,
  Video,
  Music,
  ArrowRight,
  Info,
  Printer,
  X,
  FileCheck2,
  Download
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

  // Verification certificate modal
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certData, setCertData] = useState(null);
  const [certLoading, setCertLoading] = useState(false);

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const response = await axios.get("/api/evidence");
        setEvidenceList(response.data);
        if (queryEvidenceId) {
          setEvidenceId(queryEvidenceId);
        } else if (response.data.length > 0 && !evidenceId) {
          setEvidenceId(response.data[0].id);
        }
      } catch (err) {
        console.error("Failed to load evidence for verification dropdown");
      }
    };
    fetchEvidence();
  }, [queryEvidenceId]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!file || !evidenceId) {
      setError("Please select a target evidence record and upload an exhibit file to audit.");
      return;
    }

    setVerifying(true);
    setError("");
    setReport(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("evidenceId", evidenceId);

    try {
      const response = await axios.post("/api/verify", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      setReport(response.data.report);
    } catch (err) {
      setError(err.response?.data?.error || "Integrity verification check failed.");
    } finally {
      setVerifying(false);
    }
  };

  const handleGenerateCertificate = async () => {
    if (!evidenceId) return;
    setCertLoading(true);
    try {
      const res = await axios.get(`/api/reports/verification/${evidenceId}`);
      setCertData(res.data);
      setCertModalOpen(true);
    } catch (err) {
      alert("Failed to load verification certificate: " + (err.response?.data?.error || err.message));
    } finally {
      setCertLoading(false);
    }
  };

  const selectedEvidenceMeta = evidenceList.find(e => e.id === evidenceId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              ISO/IEC 27037 & FRE 902(13)/(14) Hash Verification
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Independent Evidence Verification</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Upload any suspect digital exhibit to recalculate its SHA-256 cryptographic fingerprint and compare it in real time against the immutable Ethereum blockchain registry.
          </p>
        </div>

        {evidenceId && (
          <button
            onClick={handleGenerateCertificate}
            disabled={certLoading}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
            Integrity Certificate
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Upload & Target Selection (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-5 h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
            Evidentiary Audit Parameters
          </h3>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-[11px] text-slate-600 font-bold uppercase block mb-1">
                1. Target Registered Evidence Item
              </label>
              <select
                value={evidenceId}
                onChange={(e) => {
                  setEvidenceId(e.target.value);
                  setReport(null);
                }}
                className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                required
              >
                <option value="">-- Choose Evidence Item --</option>
                {evidenceList.map((item) => (
                  <option key={item.id} value={item.id}>
                    [{item.case?.caseNumber}] {item.evidenceName}
                  </option>
                ))}
              </select>

              {selectedEvidenceMeta && (
                <div className="mt-2 p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600 space-y-1 font-mono">
                  <div>FORMAT: <span className="text-slate-900 font-semibold">{selectedEvidenceMeta.fileType}</span></div>
                  <div>REGISTERED SIZE: <span className="text-slate-900 font-semibold">{(selectedEvidenceMeta.fileSize / (1024 * 1024)).toFixed(2)} MB</span></div>
                  <div className="truncate" title={selectedEvidenceMeta.fileHash}>
                    ON-CHAIN HASH: <span className="text-slate-900 font-semibold">{selectedEvidenceMeta.fileHash.substring(0, 16)}...</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] text-slate-600 font-bold uppercase block mb-1.5">
                2. Select Exhibit File for Audit
              </label>
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer relative group transition-all">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  required
                />
                <UploadCloud className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-105 transition-transform" />
                {file ? (
                  <div className="truncate w-full px-2">
                    <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                    <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; {file.type || "file"}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Click to browse or drop file here</span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">Accepts MP4, WAV, PDF, JPG, LOG</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Demo Files Guidance */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1.5">
              <span className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wide text-blue-800">
                <Info className="w-3.5 h-3.5" />
                Demo Files Available to Test
              </span>
              <p className="text-[11px] leading-relaxed text-blue-800">
                To test integrity verification or trigger tamper alerts, browse files located in <code className="bg-white px-1 py-0.5 rounded">backend/uploads/demo_files/</code>:
              </p>
              <div className="font-mono text-[10px] bg-white p-2 rounded border border-blue-200 text-slate-700 space-y-1">
                <div>&bull; <span className="font-semibold text-emerald-700">Original:</span> evidence_cctv.mp4 / crime_scene_photo.jpg / dispatch_call.wav</div>
                <div>&bull; <span className="font-semibold text-red-700">Tampered:</span> evidence_cctv_tampered.mp4 / crime_scene_photo_tampered.jpg / server_audit.log</div>
              </div>
            </div>

            <button
              type="submit"
              disabled={verifying || !file || !evidenceId}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-lg text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {verifying ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <SearchCode className="w-4 h-4" />
                  RECALCULATE CHECKSUM & VERIFY
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Verification Output & Hash Comparator (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {!report && !verifying ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-xs min-h-[380px]">
              <FileSearch className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Verification Standby</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Select an evidence item on the left and upload your file to execute the bitstream cryptographic comparator.
              </p>
            </div>
          ) : verifying ? (
            <div className="bg-white border border-slate-200 rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-xs min-h-[380px]">
              <div className="w-10 h-10 border-4 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent rounded-full animate-spin mb-4"></div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Executing Cryptographic Checksum Engine</h3>
              <p className="text-xs text-slate-500 mt-1 font-mono max-w-md">
                Reading file bitstream &bull; Computing SHA-256 hex digest &bull; Querying Solidity Smart Contract via ethers.js JSON-RPC...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Verdict Banner */}
              {report.isVerified ? (
                <div className="bg-emerald-50 border-2 border-emerald-500 p-6 rounded-xl flex items-start gap-4 shadow-xs">
                  <div className="h-10 w-10 bg-emerald-600 text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                      INTEGRITY VERIFIED — HASH MATCH
                    </span>
                    <h3 className="text-base font-bold text-emerald-950 mt-1">
                      Evidence Cryptographic Integrity Confirmed
                    </h3>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      Byte-level mathematical corroboration relative to registered digest. The calculated SHA-256 digest matches the on-chain Solidity registration byte-for-byte. 
                      <strong className="block mt-1">Satisfies Bharatiya Sakshya Adhiniyam (BSA 2023) Sections 61-63 and FRE 902(13)/(14) electronic record admissibility requirements.</strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border-2 border-red-600 p-6 rounded-xl flex items-start gap-4 shadow-sm animate-alert-border">
                  <div className="h-10 w-10 bg-red-600 text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-xs">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase text-red-800 bg-red-100 border border-red-300 px-2 py-0.5 rounded">
                      CRITICAL ALERT: CRYPTOGRAPHIC MISMATCH DETECTED
                    </span>
                    <h3 className="text-base font-bold text-red-950 mt-1">
                      Evidence Hash Does Not Match Blockchain Registry!
                    </h3>
                    <p className="text-xs text-red-800 mt-1 leading-relaxed">
                      The submitted exhibit does NOT match the original fingerprint sealed on the Ethereum blockchain. 
                      <strong> The file has been modified, re-encoded, truncated, or substituted post-seizure.</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Side-by-Side Fingerprint Comparison Card */}
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between border-b border-slate-100 pb-3">
                  <span>Cryptographic Checksum Comparison</span>
                  <span className="text-[11px] font-mono font-normal text-slate-500">SHA-256 (64 hex chars)</span>
                </h4>
                
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                      1. ORIGINAL BLOCKCHAIN-REGISTERED HASH (IMMUTABLE TRUTH):
                    </span>
                    <span className="text-slate-900 break-all select-all font-bold block bg-white p-2 rounded border border-slate-200">
                      {report.originalHash}
                    </span>
                  </div>
                  
                  <div className={`p-3 rounded-lg border ${report.isVerified ? "bg-emerald-50/50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                    <span className={`text-[10px] font-bold uppercase block mb-1 ${report.isVerified ? "text-emerald-800" : "text-red-800"}`}>
                      2. CURRENT SUBMITTED EXHIBIT HASH (CALCULATED LIVE):
                    </span>
                    <span className={`break-all select-all font-bold block bg-white p-2 rounded border ${
                      report.isVerified ? "text-emerald-700 border-emerald-200" : "text-red-700 border-red-300"
                    }`}>
                      {report.submittedHash}
                    </span>
                  </div>

                  {/* Comparative Metadata Breakdown */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-2 gap-3 text-[11px] font-mono text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-sans block">File Size Comparison:</span>
                      <div>Registered: {selectedEvidenceMeta ? `${(selectedEvidenceMeta.fileSize / 1024).toFixed(1)} KB` : "N/A"}</div>
                      <div>Submitted: {file ? `${(file.size / 1024).toFixed(1)} KB` : "N/A"}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-sans block">MIME Type Match:</span>
                      <div>Target: {selectedEvidenceMeta?.fileType || "unknown"}</div>
                      <div>Uploaded: {file?.type || "unknown"}</div>
                    </div>
                  </div>

                  {/* Visual Similarity Percentage if available */}
                  {report.pHashSimilarity !== null && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-purple-900 font-bold uppercase block">
                          Visual Perceptual Similarity (pHash Analysis)
                        </span>
                        <p className="text-[11px] text-purple-700 mt-0.5">
                          Measures visual feature retention across image frames despite binary byte tampering.
                        </p>
                      </div>
                      <span className="text-xl font-bold font-mono text-purple-800">
                        {report.pHashSimilarity}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Legal Reference & Chain of Custody Link */}
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Chain of Custody Record Available</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    Audit Ref ID: {report.verificationId || "VERIFIED-LOG"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateCertificate}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    Formal Certificate
                  </button>
                  <Link
                    to={`/custody?evidenceId=${report.evidenceId}`}
                    className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-2xs"
                  >
                    <History className="w-4 h-4" />
                    View Custody &rarr;
                  </Link>
                </div>
              </div>

              {/* Boundary Notice */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
                <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-900">Legal Boundary Notice (Anti-Garbage-In Standard):</span>
                  <p className="text-amber-800 mt-1 leading-relaxed text-[11px]">
                    ProofShield certifies that the evidence file has not been altered <strong>after</strong> its registration timestamp. This system does not claim to certify the authenticity of the material before it was collected and registered.
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Verification Certificate Modal */}
      {certModalOpen && certData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold block mb-1">
                  JUDICIAL EVIDENCE INTEGRITY CERTIFICATE
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  CERTIFICATE OF ELECTRONIC RECORD AUTHENTICATION
                </h2>
                <span className="text-xs font-mono text-slate-500">
                  DOC REF: {certData.certificateNumber}
                </span>
              </div>
              <button
                onClick={() => setCertModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="grid grid-cols-2 gap-2 text-slate-800">
                  <div><strong>Evidence Name:</strong> {certData.evidenceName}</div>
                  <div><strong>Case File:</strong> {certData.caseNumber}</div>
                  <div className="col-span-2">
                    <strong>Immutable Digest (SHA-256):</strong> <span className="text-blue-700 break-all">{certData.registeredSha256}</span>
                  </div>
                  <div className="col-span-2 truncate">
                    <strong>Ethereum Tx Receipt:</strong> {certData.blockchainTxId}
                  </div>
                  <div><strong>Retention Status:</strong> {certData.retentionStatus}</div>
                  <div><strong>Total Prior Audits:</strong> {certData.totalAuditsExecuted}</div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 text-emerald-950 font-sans">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Statutory Admissibility Foundations
                </span>
                <div className="text-[11px] space-y-1.5 leading-relaxed">
                  <div><strong>Bharatiya Sakshya Adhiniyam, 2023 (BSA Sec 61-63):</strong> {certData.statutoryStandards?.bharatiyaSakshyaAdhiniyam2023}</div>
                  <div><strong>Federal Rules of Evidence (FRE 902(13)/(14)):</strong> {certData.statutoryStandards?.federalRulesOfEvidence}</div>
                </div>
              </div>

              {certData.verificationHistory && certData.verificationHistory.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 font-sans block mb-2">
                    Historical Audit Runs ({certData.verificationHistory.length})
                  </span>
                  <div className="border border-slate-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-slate-100 border-b border-slate-200 text-[9px] uppercase font-bold">
                        <tr>
                          <th className="p-2">Timestamp</th>
                          <th className="p-2">Examiner</th>
                          <th className="p-2">Calculated Hash</th>
                          <th className="p-2">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {certData.verificationHistory.map((v, i) => (
                          <tr key={v.id || i}>
                            <td className="p-2">{new Date(v.timestamp).toLocaleString()}</td>
                            <td className="p-2">{v.verifier?.name || "System"}</td>
                            <td className="p-2 font-mono truncate max-w-[150px]">{v.calculatedHash}</td>
                            <td className="p-2">
                              {v.isMatch ? (
                                <span className="text-emerald-700 font-bold">MATCH</span>
                              ) : (
                                <span className="text-red-700 font-bold">MISMATCH</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <span className="text-[11px] text-slate-500 font-mono">
                Certified By: ProofShield Automated Witness Engine
              </span>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                Print Certificate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VerifyEvidence;
