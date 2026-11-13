import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { 
  UploadCloud, 
  FileText, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Cpu, 
  Database,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const RegisterEvidence = () => {
  const [searchParams] = useSearchParams();
  const preselectedCaseId = searchParams.get("caseId") || "";
  const navigate = useNavigate();

  // Form States
  const [cases, setCases] = useState([]);
  const [caseId, setCaseId] = useState(preselectedCaseId);
  const [evidenceName, setEvidenceName] = useState("");
  const [description, setDescription] = useState("");
  const [collectionTimestamp, setCollectionTimestamp] = useState(new Date().toISOString().substring(0, 16));
  const [location, setLocation] = useState("");
  const [file, setFile] = useState(null);
  const [enablePHash, setEnablePHash] = useState(false);

  // Pipeline/Loading States
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: Idle, 1: Hashing, 2: IPFS, 3: Blockchain, 4: Database, 5: Finished
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState("");

  const steps = [
    { label: "Cryptographic SHA-256 Hashing", desc: "Generating tamper-proof binary fingerprint (FIPS 180-4)", icon: FileText },
    { label: "IPFS Content Addressing", desc: "Sealing payload into content-addressed distributed storage", icon: UploadCloud },
    { label: "Ethereum Smart Contract Witness", desc: "Mining on-chain transaction to register immutable hash", icon: Cpu },
    { label: "PostgreSQL Audit Trail Index", desc: "Recording chain of custody logs and case relationships", icon: Database },
    { label: "Evidence Verified & Sealed", desc: "Federal Rules of Evidence Rule 902(13)/(14) compliant", icon: ShieldCheck }
  ];

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await axios.get("/api/cases");
        setCases(response.data);
      } catch (err) {
        console.error("Failed to load cases catalog");
      }
    };
    fetchCases();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setEvidenceName(selectedFile.name);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setEvidenceName(droppedFile.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !caseId || !evidenceName) {
      setError("Please select a target case, specify an evidence name, and attach a file.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessData(null);
    
    try {
      // Step 1: Hashing simulation
      setCurrentStep(1);
      await new Promise(r => setTimeout(r, 600));

      // Step 2: IPFS
      setCurrentStep(2);
      await new Promise(r => setTimeout(r, 600));

      // Step 3: Blockchain
      setCurrentStep(3);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("caseId", caseId);
      formData.append("evidenceName", evidenceName);
      formData.append("description", description);
      formData.append("collectionTimestamp", collectionTimestamp);
      formData.append("location", location);
      formData.append("enablePHash", enablePHash);

      const response = await axios.post("/api/evidence", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      // Step 4: DB
      setCurrentStep(4);
      await new Promise(r => setTimeout(r, 600));

      // Step 5: Secured
      setCurrentStep(5);
      setSuccessData(response.data.evidence);

    } catch (err) {
      setError(err.response?.data?.error || "Evidence registration failed.");
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // SUCCESS SCREEN
  // -------------------------------------------------------------
  if (successData) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white border border-emerald-200 p-8 rounded-2xl text-center shadow-sm">
          <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="text-xs font-mono font-bold uppercase px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
            CRYPTOGRAPHIC PROOF SEALED
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-2 mb-2">Evidence Cryptographically Secured</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            The digital asset has been securely stored on IPFS and its cryptographic SHA-256 fingerprint is permanently recorded on the Ethereum blockchain.
          </p>
        </div>

        {/* Audit Details Card */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
            Sealed Dossier Credentials
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-sans">Evidence Identifier</span>
              <span className="text-slate-900 font-semibold block truncate">{successData.id}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-sans">Associated Case Dossier</span>
              <span className="text-slate-900 font-semibold block truncate">{successData.caseId}</span>
            </div>
            <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase font-sans mb-1">Original SHA-256 Checksum</span>
              <span className="text-emerald-700 font-bold block break-all">{successData.fileHash}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-sans">IPFS Storage CID</span>
              <span className="text-blue-700 block truncate" title={successData.ipfsCid}>
                {successData.ipfsCid}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-sans">Sealed Timestamp (UTC)</span>
              <span className="text-slate-900 block">{new Date(successData.submittedAt).toLocaleString()}</span>
            </div>
            <div className="sm:col-span-2 pt-2 border-t border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-sans mb-1">Ethereum Transaction Hash</span>
              <span className="text-purple-700 font-semibold block break-all">{successData.blockchainTxId}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            to={`/evidence/${successData.id}`}
            className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-sm transition-all shadow-xs"
          >
            Access Evidence Dossier
          </Link>
          <button
            onClick={() => {
              setFile(null);
              setSuccessData(null);
              setCurrentStep(0);
              setDescription("");
              setCollectionTimestamp(new Date().toISOString().substring(0, 16));
              setLocation("");
            }}
            className="px-6 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-lg text-sm transition-all shadow-xs"
          >
            Register Another Evidence File
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // REGISTRATION FORM / PIPELINE VIEW
  // -------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Register Digital Evidence</h1>
        <p className="text-xs text-slate-500">Seal forensic digital payloads with an immutable blockchain timestamp and IPFS storage.</p>
      </div>

      {loading ? (
        // Pipeline UI Loader
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs space-y-8">
          <div className="text-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700">Executing Cryptographic Registration Pipeline</h3>
            <p className="text-xs text-slate-500 mt-1">Please wait while the multi-step witness protocol seals this asset...</p>
          </div>

          <div className="max-w-md mx-auto space-y-6 relative pl-8 border-l border-slate-200">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isPast = idx + 1 < currentStep;
              const isCurrent = idx + 1 === currentStep;
              
              return (
                <div key={idx} className="relative flex items-start gap-4">
                  <span className={`absolute -left-12 top-0.5 w-8 h-8 rounded-full border flex items-center justify-center text-xs font-mono font-bold transition-all ${
                    isPast 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300" 
                      : isCurrent 
                        ? "bg-blue-50 text-blue-700 border-blue-600 animate-pulse" 
                        : "bg-slate-100 text-slate-400 border-slate-200"
                  }`}>
                    {isPast ? "✓" : idx + 1}
                  </span>

                  <div>
                    <h4 className={`text-xs font-bold tracking-wide flex items-center gap-1.5 ${
                      isCurrent ? "text-blue-700" : isPast ? "text-emerald-700" : "text-slate-400"
                    }`}>
                      <StepIcon className="w-4 h-4" />
                      {step.label}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-normal mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Input Form
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xs">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* File Drag and Drop */}
            <div>
              <label className="text-xs text-slate-700 font-semibold uppercase block mb-2">Digital Forensic File *</label>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/70 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative group"
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  required={!file}
                />
                <UploadCloud className="w-10 h-10 text-blue-600 mb-3 group-hover:scale-105 transition-transform" />
                {file ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; {file.type || "binary payload"}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-800 font-medium">Drag and drop evidence file here, or click to browse</p>
                    <p className="text-[11px] text-slate-400 mt-1">Accepted: MP4, AVI, JPG, PNG, PDF, WAV, DOCX, LOG, TXT (Up to 50MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="text-xs text-slate-700 font-semibold uppercase block mb-1">Target Case Dossier *</label>
                <select
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-4 py-2.5 text-xs text-slate-900 focus:outline-none"
                  required
                >
                  <option value="">-- Select Case File --</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.caseNumber}] {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold uppercase block mb-1">Evidence Title *</label>
                <input
                  type="text"
                  value={evidenceName}
                  onChange={(e) => setEvidenceName(e.target.value)}
                  placeholder="e.g., cctv_surveillance_vault.mp4"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-4 py-2.5 text-xs text-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold uppercase block mb-1">Collection Location / Coordinates</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Central Vault - Node 04 corridor"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold uppercase block mb-1">Collection Timestamp (UTC)</label>
                <div className="relative font-mono">
                  <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="datetime-local"
                    value={collectionTimestamp}
                    onChange={(e) => setCollectionTimestamp(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-slate-700 font-semibold uppercase block mb-1">Forensic Description & Recovery Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Record recovery methodology, write-blocker hardware serial numbers, and initial custody context..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-4 py-2.5 text-xs text-slate-900 focus:outline-none resize-none"
                />
              </div>

              {/* Optional Perceptual Hashing Checkbox */}
              {file && file.type?.startsWith("image/") && (
                <div className="md:col-span-2 p-4 bg-purple-50/60 border border-purple-200 rounded-xl flex items-center justify-between">
                  <div className="pr-4">
                    <h4 className="text-xs font-bold text-purple-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Visual Perceptual Fingerprint (pHash)
                    </h4>
                    <p className="text-[11px] text-purple-700/80 mt-0.5">
                      Compute invariant discrete cosine transform fingerprint to detect crops, watermark alterations, or re-compression.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enablePHash}
                    onChange={(e) => setEnablePHash(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 cursor-pointer"
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <Link
                to="/cases"
                className="px-5 py-2.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs tracking-wide flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                Register & Seal Evidence
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default RegisterEvidence;
