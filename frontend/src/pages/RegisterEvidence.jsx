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
  Sparkles
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
    { label: "File Upload & Hashing", desc: "Generating SHA-256 cryptographic fingerprint", icon: FileText },
    { label: "IPFS Off-Chain Storage", desc: "Pushing digital payload to decentralized nodes", icon: UploadCloud },
    { label: "Blockchain Sealing", desc: "Executing smart contract transaction to seal hash", icon: Cpu },
    { label: "Database Registry", desc: "Writing searchable metadata & logs to SQL index", icon: Database },
    { label: "Evidence Secured", desc: "Integrity verified and custody lock sealed", icon: ShieldCheck }
  ];

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await axios.get("/api/cases");
        setCases(response.data);
      } catch (err) {
        console.error("Failed to load cases");
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
      setError("Please fill out all required fields and select a file.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessData(null);
    
    // Simulate pipeline transitions for user interface visual clarity
    // since the server does it all in one API request, we map the progression sequentially
    try {
      // Step 1: Hashing
      setCurrentStep(1);
      await new Promise(r => setTimeout(r, 800)); // micro-loading for realistic visualization

      // Step 2: IPFS
      setCurrentStep(2);
      await new Promise(r => setTimeout(r, 800));

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
      await new Promise(r => setTimeout(r, 800));

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
        <div className="bg-[#151B2C]/60 border border-emerald-500/20 p-8 rounded-xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-400"></div>
          <div className="h-16 w-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 animate-pulse">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-tech font-bold text-emerald-400 uppercase tracking-wider mb-2">Evidence Cryptographically Secured</h2>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            The file has been registered. The blockchain transaction provides an immutable witness of the original SHA-256 fingerprint.
          </p>
        </div>

        {/* Audit Details Card */}
        <div className="bg-[#151B2C]/40 border border-[#1F2937] p-6 rounded-xl space-y-4">
          <h3 className="font-tech text-xs tracking-wider uppercase text-cyan-400 border-b border-gray-800 pb-3">Dossier Audit Credentials</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-cyber-muted block text-[10px] uppercase">Evidence ID</span>
              <span className="text-cyan-200 block truncate">{successData.id}</span>
            </div>
            <div>
              <span className="text-cyber-muted block text-[10px] uppercase">Case ID Ref</span>
              <span className="text-cyan-200 block truncate">{successData.caseId}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-cyber-muted block text-[10px] uppercase">Primary SHA-256 Fingerprint</span>
              <span className="text-emerald-400 block break-all">{successData.fileHash}</span>
            </div>
            <div>
              <span className="text-cyber-muted block text-[10px] uppercase">IPFS Gateway CID</span>
              <span className="text-cyan-200 block truncate" title={successData.ipfsCid}>
                {successData.ipfsCid}
              </span>
            </div>
            <div>
              <span className="text-cyber-muted block text-[10px] uppercase">Sealed Timestamp</span>
              <span className="text-cyan-200 block">{new Date(successData.submittedAt).toLocaleString()}</span>
            </div>
            <div className="sm:col-span-2 pt-2 border-t border-gray-800/50">
              <span className="text-cyber-muted block text-[10px] uppercase">Blockchain Tx Hash</span>
              <span className="text-purple-400 block break-all">{successData.blockchainTxId}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            to={`/evidence/${successData.id}`}
            className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold rounded-lg text-sm transition-all"
          >
            Access Custody Dossier
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
            className="px-6 py-2.5 bg-[#151B2C] hover:bg-[#151B2C]/80 border border-[#1F2937] text-cyan-400 font-semibold rounded-lg text-sm transition-all"
          >
            Register Another File
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // REGISTRATION FORM / PIPELINE VIEW
  // -------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-tech font-bold text-cyan-400 tracking-wide">SECURE DIGITAL REGISTER</h2>
        <p className="text-xs text-cyber-muted">Seal raw forensic digital files into the tamper detection database and on-chain log.</p>
      </div>

      {loading ? (
        // Pipeline UI Loader
        <div className="bg-[#151B2C]/40 border border-[#1F2937] rounded-xl p-8 space-y-8">
          <div className="text-center">
            <h3 className="font-tech text-cyan-400 animate-pulse text-sm tracking-wider font-semibold">EXECUTING REGISTER PIPELINE</h3>
            <p className="text-xs text-gray-500 mt-1">Standby. Initializing multi-node cryptographic lock...</p>
          </div>

          <div className="max-w-md mx-auto space-y-6 relative pl-8 border-l border-gray-800">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isPast = idx + 1 < currentStep;
              const isCurrent = idx + 1 === currentStep;
              
              return (
                <div key={idx} className="relative flex items-start gap-4">
                  {/* Step Bubble */}
                  <span className={`absolute -left-12 top-0.5 w-8 h-8 rounded-full border flex items-center justify-center text-xs font-mono font-bold transition-all ${
                    isPast 
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                      : isCurrent 
                        ? "bg-cyan-500/20 text-cyan-400 border-cyan-400 animate-pulse" 
                        : "bg-[#151B2C] text-gray-600 border-gray-800"
                  }`}>
                    {idx + 1}
                  </span>

                  <div>
                    <h4 className={`text-xs font-bold tracking-wide flex items-center gap-1.5 ${isCurrent ? "text-cyan-400" : isPast ? "text-emerald-400" : "text-gray-500"}`}>
                      <StepIcon className="w-4 h-4" />
                      {step.label}
                    </h4>
                    <p className="text-[10px] text-gray-400 leading-normal mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Input Form
        <div className="bg-[#151B2C]/40 border border-[#1F2937] rounded-xl p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-950/20 border border-red-500/30 rounded-lg text-red-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* File Drag and Drop */}
            <div>
              <label className="text-[10px] text-cyber-muted font-semibold uppercase block mb-2">Select Digital Payload</label>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-gray-800 hover:border-cyan-500/30 bg-[#111827]/40 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative group"
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  required={!file}
                />
                <UploadCloud className="w-10 h-10 text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
                {file ? (
                  <div>
                    <p className="text-sm font-semibold text-cyan-200">{file.name}</p>
                    <p className="text-xs text-cyber-muted mt-1 font-mono">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; {file.type || "unknown type"}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-300 font-medium">Drag & drop evidence file here, or click to browse</p>
                    <p className="text-[10px] text-cyber-muted mt-1">Supported: JPG, PNG, MP4, MOV, AVI, MP3, WAV, PDF, TXT, DOC/DOCX (Max 50MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="text-[10px] text-cyber-muted font-semibold uppercase block mb-1">Target Case Dossier *</label>
                <select
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  className="w-full bg-[#151B2C] border border-[#1F2937] focus:border-cyan-400 rounded-lg px-4 py-2.5 text-xs text-gray-100 focus:outline-none"
                  required
                >
                  <option value="">-- SELECT Dossier --</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.caseNumber}] {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-cyber-muted font-semibold uppercase block mb-1">Evidence Title *</label>
                <input
                  type="text"
                  value={evidenceName}
                  onChange={(e) => setEvidenceName(e.target.value)}
                  placeholder="e.g., lobby_cctv_leak.mp4"
                  className="w-full bg-[#151B2C] border border-[#1F2937] focus:border-cyan-400 rounded-lg px-4 py-2.5 text-xs text-gray-100 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-cyber-muted font-semibold uppercase block mb-1">Collection Location / GPS</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-cyber-muted" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="GPS Coordinates or Room Name"
                    className="w-full bg-[#151B2C] border border-[#1F2937] focus:border-cyan-400 rounded-lg pl-10 pr-4 py-2.5 text-xs text-gray-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-cyber-muted font-semibold uppercase block mb-1">Collection Date & Time</label>
                <div className="relative font-mono">
                  <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-cyber-muted" />
                  <input
                    type="datetime-local"
                    value={collectionTimestamp}
                    onChange={(e) => setCollectionTimestamp(e.target.value)}
                    className="w-full bg-[#151B2C] border border-[#1F2937] focus:border-cyan-400 rounded-lg pl-10 pr-4 py-2.5 text-xs text-gray-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] text-cyber-muted font-semibold uppercase block mb-1">Description / Investigative Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Record device details, physical recovery tags, and chain-of-custody contexts..."
                  rows={4}
                  className="w-full bg-[#151B2C] border border-[#1F2937] focus:border-cyan-400 rounded-lg px-4 py-2.5 text-xs text-gray-100 focus:outline-none resize-none"
                />
              </div>

              {/* Optional Perceptual Hashing Checkbox */}
              {file && file.type?.startsWith("image/") && (
                <div className="md:col-span-2 p-4 bg-[#111827]/40 border border-purple-500/20 rounded-lg flex items-center justify-between">
                  <div className="pr-4">
                    <h4 className="text-xs font-bold text-purple-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Visual Perceptual Fingerprint
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Enable fuzzy hashing to match visually identical media (detect compression differences, cropping, or watermark alterations).
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enablePHash}
                    onChange={(e) => setEnablePHash(e.target.checked)}
                    className="w-4 h-4 accent-purple-500 cursor-pointer"
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
              <Link
                to="/cases"
                className="px-5 py-2.5 border border-gray-800 hover:bg-gray-800 rounded-lg text-xs font-semibold text-cyber-muted hover:text-gray-100"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-gray-950 font-semibold rounded-lg text-xs tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              >
                SECURE LOCK PAYLOAD
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
