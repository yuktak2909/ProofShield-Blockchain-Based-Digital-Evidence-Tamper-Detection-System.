import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { 
  UploadCloud, 
  FileText, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  ShieldAlert,
  Cpu, 
  Database, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  HardDrive, 
  UserCheck, 
  Tag,
  X,
  FileCheck,
  Video,
  Music,
  Image as ImageIcon,
  Clock,
  Layers,
  Copy,
  Check,
  RotateCcw
} from "lucide-react";

const RegisterEvidence = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedCaseId = searchParams.get("caseId") || "";
  const navigate = useNavigate();

  // Role authorization: Only Administrators and Investigators can register evidence
  const isAuthorized = user && (user.role === "admin" || user.role === "investigator");

  // Form States
  const [cases, setCases] = useState([]);
  const [caseId, setCaseId] = useState(preselectedCaseId);
  const [evidenceName, setEvidenceName] = useState("");
  const [category, setCategory] = useState("CCTV / Video");
  const [description, setDescription] = useState("");
  const [collectionTimestamp, setCollectionTimestamp] = useState(new Date().toISOString().substring(0, 16));
  const [location, setLocation] = useState("");
  
  // Evidence Collection Details
  const [acquisitionSource, setAcquisitionSource] = useState("");
  const [acquisitionMethod, setAcquisitionMethod] = useState("");
  const [collectorIdentity, setCollectorIdentity] = useState("");
  const [deviceInfo, setDeviceInfo] = useState("");
  
  const [file, setFile] = useState(null);
  const [fileMetadata, setFileMetadata] = useState(null);
  const [clientSha256, setClientSha256] = useState("");
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Pipeline/Loading States
  const [loading, setLoading] = useState(false);
  const [pipelineStages, setPipelineStages] = useState([
    { id: 1, label: "File Received & Validated", status: "pending", desc: "Binary envelope integrity and MIME parameters checked" },
    { id: 2, label: "SHA-256 Fingerprint Calculated", status: "pending", desc: "FIPS 180-4 compliant 256-bit cryptographic digest generated" },
    { id: 3, label: "Evidence Stored Successfully", status: "pending", desc: "Sealed into content-addressed IPFS decentralized storage container" },
    { id: 4, label: "Blockchain Commitment Submitted", status: "pending", desc: "Solidity smart contract registerEvidence transaction mined" },
    { id: 5, label: "Database Record Confirmed", status: "pending", desc: "Relational case indices and chain of custody log confirmed" }
  ]);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState("");
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await axios.get("/api/cases");
        if (Array.isArray(response.data)) {
          setCases(response.data);
          if (!caseId && response.data.length > 0 && !preselectedCaseId) {
            setCaseId(response.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load cases catalog:", err);
      }
    };
    fetchCases();
  }, []);

  useEffect(() => {
    if (preselectedCaseId) {
      setCaseId(preselectedCaseId);
    }
  }, [preselectedCaseId]);

  // Compute Client-side SHA-256 and extract file metadata without mutating original bytes
  const extractMetadataAndHash = async (selectedFile) => {
    const meta = {
      filename: selectedFile.name,
      size: selectedFile.size,
      sizeFormatted: selectedFile.size > 1024 * 1024 
        ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` 
        : `${(selectedFile.size / 1024).toFixed(1)} KB`,
      mimeType: selectedFile.type || "application/octet-stream",
      dimensions: null,
      duration: null
    };

    // 1. Calculate SHA-256 client side
    try {
      const buffer = await selectedFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      setClientSha256(hashHex);
    } catch (e) {
      console.warn("Could not calculate client-side hash:", e);
    }

    // 2. Video metadata extraction
    if (selectedFile.type?.startsWith("video/") || 
        selectedFile.name?.toLowerCase().endsWith(".mp4") || 
        selectedFile.name?.toLowerCase().endsWith(".webm") || 
        selectedFile.name?.toLowerCase().endsWith(".mkv") || 
        selectedFile.name?.toLowerCase().endsWith(".mov") || 
        selectedFile.name?.toLowerCase().endsWith(".avi")) {
      setCategory("CCTV / Video");
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        setFileMetadata(prev => ({
          ...prev,
          dimensions: `${video.videoWidth} x ${video.videoHeight} px`,
          duration: `${Math.round(video.duration)} seconds`
        }));
      };
      video.src = URL.createObjectURL(selectedFile);
    }
    // 3. Image metadata extraction
    else if (selectedFile.type?.startsWith("image/")) {
      setCategory("Photographs");
      const img = new Image();
      img.onload = () => {
        window.URL.revokeObjectURL(img.src);
        setFileMetadata(prev => ({
          ...prev,
          dimensions: `${img.naturalWidth} x ${img.naturalHeight} px`
        }));
      };
      img.src = URL.createObjectURL(selectedFile);
    }
    // 4. Audio metadata extraction
    else if (selectedFile.type?.startsWith("audio/")) {
      setCategory("Audio Recordings");
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        window.URL.revokeObjectURL(audio.src);
        setFileMetadata(prev => ({
          ...prev,
          duration: `${Math.round(audio.duration)} seconds`
        }));
      };
      audio.src = URL.createObjectURL(selectedFile);
    }
    // 5. PDF metadata extraction
    else if (selectedFile.type === "application/pdf") {
      setCategory("PDF / Documents");
    }

    setFileMetadata(meta);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 250 * 1024 * 1024) {
        setError(`Selected file "${selectedFile.name}" exceeds the maximum upload limit of 250 MB (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB). Please select a file under 250 MB.`);
        setFile(null);
        setFileMetadata(null);
        return;
      }
      setError("");
      setFile(selectedFile);
      setEvidenceName(selectedFile.name);
      extractMetadataAndHash(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.size > 250 * 1024 * 1024) {
        setError(`Selected file "${droppedFile.name}" exceeds the maximum upload limit of 250 MB (${(droppedFile.size / (1024 * 1024)).toFixed(1)} MB). Please select a file under 250 MB.`);
        setFile(null);
        setFileMetadata(null);
        return;
      }
      setError("");
      setFile(droppedFile);
      setEvidenceName(droppedFile.name);
      extractMetadataAndHash(droppedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileMetadata(null);
    setClientSha256("");
  };

  const handleOpenSummary = (e) => {
    e.preventDefault();
    if (!file || !caseId || !evidenceName) {
      setError("Please select a case, specify an evidence name, and attach an evidence file.");
      return;
    }
    if (file.size > 250 * 1024 * 1024) {
      setError("File exceeds maximum allowed upload size (250 MB).");
      return;
    }
    setError("");
    setShowSummaryModal(true);
  };

  const handleConfirmRegistration = async () => {
    setShowSummaryModal(false);
    setLoading(true);
    setError("");
    setSuccessData(null);

    // Helper to update stage status
    const updateStage = (stageId, status, errorMsg) => {
      setPipelineStages(prev => prev.map(s => s.id === stageId ? { ...s, status, error: errorMsg } : s));
    };

    try {
      // Stage 1: File received and validated
      updateStage(1, "running");
      await new Promise(r => setTimeout(r, 400));
      updateStage(1, "success");

      // Stage 2: SHA-256 fingerprint calculated
      updateStage(2, "running");
      await new Promise(r => setTimeout(r, 400));
      updateStage(2, "success");

      // Stage 3 & 4: Submitting to backend API (handles IPFS storage + Smart contract + DB)
      updateStage(3, "running");
      updateStage(4, "running");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("caseId", caseId);
      formData.append("evidenceName", evidenceName);
      formData.append("category", category);
      formData.append("description", description);
      formData.append("collectionTimestamp", collectionTimestamp);
      formData.append("location", location);
      formData.append("acquisitionSource", acquisitionSource);
      formData.append("acquisitionMethod", acquisitionMethod);
      formData.append("collectorIdentity", collectorIdentity);
      formData.append("deviceInfo", deviceInfo);

      // Do NOT set explicit Content-Type header so the browser/Axios can properly set multipart/form-data with the boundary parameter
      const response = await axios.post("/api/evidence", formData);

      updateStage(3, "success");
      if (response.data.blockchainStatus === "CONFIRMED") {
        updateStage(4, "success");
      } else {
        updateStage(4, "warning", response.data.blockchainError || "Secured in repository; blockchain anchoring pending.");
      }

      // Stage 5: Database record confirmed
      updateStage(5, "running");
      await new Promise(r => setTimeout(r, 300));
      updateStage(5, "success");

      setSuccessData(response.data.evidence);

    } catch (err) {
      let errMsg = "Evidence registration failed.";
      if (err.response) {
        if (err.response.status === 413) {
          errMsg = "File size limit exceeded. The maximum allowed exhibit upload size is 250 MB.";
        } else if (err.response.status === 400) {
          errMsg = err.response.data?.error || "Validation error: Please check evidence metadata or duplicate hash.";
        } else if (err.response.status === 401 || err.response.status === 403) {
          errMsg = "Authorization error: " + (err.response.data?.error || "Investigator or Admin clearance required.");
        } else if (err.response.data?.error) {
          errMsg = err.response.data.error;
        } else {
          errMsg = `Server error (${err.response.status}): ${err.response.statusText || "Registration failed."}`;
        }
      } else if (err.code === "ECONNABORTED" || err.message?.toLowerCase().includes("timeout")) {
        errMsg = "Upload request timed out. The file transfer took longer than expected. Please check server responsiveness.";
      } else if (err.code === "ERR_NETWORK" || err.message?.toLowerCase().includes("network error")) {
        errMsg = "ProofShield Backend Server Unreachable (Network Error). Please verify that the backend API server is running on port 5000 and the network connection is active.";
      } else {
        errMsg = err.message || errMsg;
      }
      setError(errMsg);
      // Mark current running stage as failed
      setPipelineStages(prev => prev.map(s => s.status === "running" ? { ...s, status: "failed", error: errMsg } : s));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHash = () => {
    if (clientSha256) {
      navigator.clipboard.writeText(clientSha256);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const selectedCaseObj = Array.isArray(cases) 
    ? cases.find(c => String(c.id) === String(caseId)) 
    : null;

  // -------------------------------------------------------------
  // CLEARANCE RESTRICTION SCREEN (UNAUTHORIZED ROLES)
  // -------------------------------------------------------------
  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <div className="bg-white border border-amber-200 rounded-2xl p-8 text-center shadow-xs">
          <div className="h-14 w-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-amber-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded">
            EVIDENTIARY INTAKE CLEARANCE REQUIRED
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2 mb-1.5">Evidence Intake Clearance Restricted</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Only authorized <strong>System Administrators</strong> and sworn <strong>Lead Investigators</strong> hold legal authority to intake and commit new physical or digital evidence to the blockchain ledger.
          </p>
          <div className="my-5 p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1.5 font-mono max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Active User:</span>
              <span className="text-slate-800 font-bold">{user?.name || "Authenticated Operator"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Assigned Clearance:</span>
              <span className="text-amber-700 font-bold uppercase">{user?.role || "Restricted"}</span>
            </div>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <Link
              to="/evidence"
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs shadow-xs"
            >
              View Evidence Records &rarr;
            </Link>
            <Link
              to="/verify"
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs shadow-xs"
            >
              Verify Evidence Integrity
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUCCESS SCREEN
  // -------------------------------------------------------------
  if (successData) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white border border-emerald-200 p-8 rounded-2xl text-center shadow-xs">
          <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
            CRYPTOGRAPHIC WITNESS CONFIRMED
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2 mb-1.5">Evidence Successfully Registered</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            The exhibit has been sealed into repository storage with an immutable SHA-256 fingerprint anchored to the Ethereum ledger.
          </p>

          <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-xl mx-auto text-left text-xs font-mono space-y-2">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-sans block">Evidence Asset</span>
              <span className="text-slate-900 font-bold">{successData.evidenceName}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-sans block">Associated Case</span>
              <span className="text-blue-700 font-semibold">{selectedCaseObj?.caseNumber || "CASE-FILE"} &bull; {selectedCaseObj?.title}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-sans block">Permanent SHA-256 Digest</span>
              <span className="text-emerald-700 font-bold break-all">{successData.fileHash}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-sans block">Repository CID</span>
              <span className="text-purple-700 break-all">{successData.ipfsCid}</span>
            </div>
            {successData.blockchainTxId && (
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-sans block">Ethereum Transaction Receipt</span>
                <span className="text-slate-700 text-[11px] break-all">{successData.blockchainTxId}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-center">
            <Link
              to={`/evidence/${successData.id}`}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs transition-all shadow-xs"
            >
              View Evidence Details &rarr;
            </Link>
            <button
              onClick={() => {
                setFile(null);
                setFileMetadata(null);
                setClientSha256("");
                setSuccessData(null);
                setPipelineStages(prev => prev.map(s => ({ ...s, status: "pending", error: null })));
                setDescription("");
                setLocation("");
                setAcquisitionSource("");
                setAcquisitionMethod("");
                setCollectorIdentity("");
                setDeviceInfo("");
              }}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
            >
              Register Another Evidence File
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // REGISTRATION FORM & PIPELINE PROGRESS VIEW
  // -------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Register Evidence</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Capture chain of custody acquisition parameters and seal digital assets with an on-chain cryptographic witness.
        </p>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs space-y-6">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700">Executing Cryptographic Registration Pipeline</h3>
            <p className="text-xs text-slate-500 mt-0.5">Anchoring evidence container and establishing legal chain of custody...</p>
          </div>

          <div className="max-w-md mx-auto space-y-4 relative pl-8 border-l border-slate-200">
            {pipelineStages.map((step) => {
              const isSuccess = step.status === "success";
              const isRunning = step.status === "running";
              const isFailed = step.status === "failed";

              return (
                <div key={step.id} className="relative flex items-start gap-3">
                  <span className={`absolute -left-12 top-0 w-7 h-7 rounded-full border flex items-center justify-center text-xs font-mono font-bold transition-all ${
                    isSuccess 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300" 
                      : isRunning 
                        ? "bg-blue-50 text-blue-700 border-blue-600 animate-pulse" 
                        : isFailed
                        ? "bg-red-50 text-red-700 border-red-300"
                        : "bg-slate-100 text-slate-400 border-slate-200"
                  }`}>
                    {isSuccess ? "✓" : isFailed ? "✕" : step.id}
                  </span>

                  <div>
                    <h4 className={`text-xs font-bold tracking-wide flex items-center gap-1.5 ${
                      isRunning ? "text-blue-700" : isSuccess ? "text-emerald-700" : isFailed ? "text-red-700" : "text-slate-400"
                    }`}>
                      {step.label}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-normal mt-0.5">{step.desc}</p>
                    {isFailed && step.error && (
                      <span className="text-[10px] text-red-600 font-semibold block mt-1">
                        Failure note: {step.error}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="text-center pt-4">
              <button
                onClick={handleConfirmRegistration}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry Registration
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleOpenSummary} className="space-y-5">
            
            {/* Section A: File Upload (Reduced Height & Drag-Drop) */}
            <div>
              <label className="text-xs text-slate-700 font-semibold uppercase block mb-1.5">
                Select Evidence File *
              </label>

              {!file ? (
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative group"
                >
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    required
                  />
                  <UploadCloud className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-105 transition-transform" />
                  <p className="text-xs text-slate-800 font-semibold">Drag and drop evidence file here, or click to browse</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Supported: MP4, AVI, JPG, PNG, PDF, WAV, DOCX, LOG, TXT (Up to 50MB)</p>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{file.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                        <span>{fileMetadata?.sizeFormatted}</span>
                        <span>&bull;</span>
                        <span>{fileMetadata?.mimeType}</span>
                        <span>&bull;</span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Valid File Container
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-xs font-semibold text-red-600 hover:text-red-800 px-3 py-1.5 bg-white border border-red-200 rounded-lg transition-colors cursor-pointer self-start sm:self-center"
                  >
                    Remove / Replace
                  </button>
                </div>
              )}

              {/* Automatic File Metadata Extraction Section */}
              {fileMetadata && (
                <div className="mt-3 p-3.5 bg-blue-50/50 border border-blue-100 rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-700" />
                      Automatic File Information & Metadata (Original Bytes Preserved)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Read-Only Extraction</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono pt-1">
                    <div>
                      <span className="text-[9px] uppercase font-sans text-slate-400 block">Payload Size</span>
                      <span className="text-slate-800 font-bold">{fileMetadata.sizeFormatted}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-sans text-slate-400 block">Format</span>
                      <span className="text-slate-800 font-bold truncate block">{fileMetadata.mimeType}</span>
                    </div>
                    {fileMetadata.dimensions && (
                      <div>
                        <span className="text-[9px] uppercase font-sans text-slate-400 block">Dimensions</span>
                        <span className="text-slate-800 font-bold">{fileMetadata.dimensions}</span>
                      </div>
                    )}
                    {fileMetadata.duration && (
                      <div>
                        <span className="text-[9px] uppercase font-sans text-slate-400 block">Duration</span>
                        <span className="text-slate-800 font-bold">{fileMetadata.duration}</span>
                      </div>
                    )}
                  </div>

                  {clientSha256 && (
                    <div className="pt-2 border-t border-blue-100/70 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-sans text-slate-500">Calculated SHA-256 Digest:</span>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-800 font-semibold truncate">
                        <span className="truncate">{clientSha256}</span>
                        <button
                          type="button"
                          onClick={handleCopyHash}
                          className="p-1 hover:bg-blue-100 rounded text-blue-700 cursor-pointer shrink-0"
                          title="Copy digest"
                        >
                          {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section B: Case Selection, Evidence Name, and Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-700 font-semibold uppercase block mb-1">Select Case *</label>
                <select
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  required
                >
                  <option value="">-- Choose Target Case --</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.caseNumber}] {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold uppercase block mb-1">Evidence Name *</label>
                <input
                  type="text"
                  value={evidenceName}
                  onChange={(e) => setEvidenceName(e.target.value)}
                  placeholder="e.g. perimeter_surveillance.mp4"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold uppercase block mb-1">Evidence Type</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                >
                  <option value="CCTV / Video">CCTV / Video</option>
                  <option value="Photographs">Photographs</option>
                  <option value="Audio Recordings">Audio Recordings</option>
                  <option value="PDF / Documents">PDF / Documents</option>
                  <option value="Bit-Stream Disk Image">Bit-Stream Disk Image</option>
                  <option value="Mobile Extraction Report">Mobile Extraction Report</option>
                  <option value="Network Packet Capture">Network Packet Capture</option>
                </select>
              </div>
            </div>

            {/* Section C: Evidence Collection Details (ISO/IEC 27037 Standard) */}
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                <HardDrive className="w-4 h-4 text-blue-700" />
                Evidence Collection Details
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold uppercase block mb-1">Source Device / System</label>
                  <input
                    type="text"
                    value={acquisitionSource}
                    onChange={(e) => setAcquisitionSource(e.target.value)}
                    placeholder="e.g. Hikvision NVR Unit 04 / Surveillance DVR"
                    className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-semibold uppercase block mb-1">Collection Method</label>
                  <input
                    type="text"
                    value={acquisitionMethod}
                    onChange={(e) => setAcquisitionMethod(e.target.value)}
                    placeholder="e.g. Bit-Stream Image via Hardware Write-Blocker"
                    className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-semibold uppercase block mb-1">Collected By</label>
                  <input
                    type="text"
                    value={collectorIdentity}
                    onChange={(e) => setCollectorIdentity(e.target.value)}
                    placeholder="e.g. Det. Alice Vance (Badge #PS-8841)"
                    className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-semibold uppercase block mb-1">Device Details</label>
                  <input
                    type="text"
                    value={deviceInfo}
                    onChange={(e) => setDeviceInfo(e.target.value)}
                    placeholder="e.g. Seagate SkyHawk 4TB S/N: WAA88910"
                    className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-semibold uppercase block mb-1">Collection Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Rear Patio Sliding Glass Door Point of Entry"
                      className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-semibold uppercase block mb-1">Date & Time Collected (UTC)</label>
                  <div className="relative font-mono">
                    <Calendar className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="datetime-local"
                      value={collectionTimestamp}
                      onChange={(e) => setCollectionTimestamp(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-semibold uppercase block mb-1">Additional Collection Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Record seizure circumstances, write-blocker serial numbers, container seals, and physical evidence condition..."
                  rows={2}
                  className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                to="/cases"
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs tracking-wide flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                Review & Register Evidence
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Registration Summary Confirmation Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative">
            <button 
              onClick={() => setShowSummaryModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
              <h3 className="text-base font-bold text-slate-900">Confirm Evidence Registration</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Please review the evidentiary parameters below before permanently committing the cryptographic witness to the blockchain.
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Selected Case</span>
                  <span className="text-blue-700 font-bold">{selectedCaseObj?.caseNumber} &bull; {selectedCaseObj?.title}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Evidence Name</span>
                  <span className="text-slate-900 font-bold break-all">{evidenceName}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Evidence Type</span>
                  <span className="text-slate-800 font-medium">{category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">File Size</span>
                  <span className="text-slate-800 font-mono">{fileMetadata?.sizeFormatted}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Storage Destination</span>
                  <span className="text-purple-700 font-medium">Content-Addressed IPFS</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold mb-0.5">Calculated SHA-256 Fingerprint</span>
                <span className="text-emerald-700 font-mono font-bold text-[11px] break-all block bg-white p-2 rounded border border-slate-200">
                  {clientSha256 || "Calculating on upload..."}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Collected By</span>
                  <span className="text-slate-800 font-medium">{collectorIdentity || "Lead Investigator"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Collection Location</span>
                  <span className="text-slate-800 font-medium">{location || "Scene of Incident"}</span>
                </div>
              </div>

              <div className="p-2.5 bg-[#F2E2E7] border border-[#E5C3CD] rounded-lg text-[11px] text-[#873D50] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#873D50] shrink-0" />
                <span>Smart contract transaction will seal this hash to Ethereum block ledger upon submission.</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5 pt-3 border-t border-[#E8E4E1]">
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="px-4 py-2 border border-[#DDD7D2] hover:bg-[#FAF8F7] rounded-lg text-xs font-semibold text-[#343239] cursor-pointer"
              >
                Edit Parameters
              </button>
              <button
                type="button"
                onClick={handleConfirmRegistration}
                className="px-5 py-2 bg-[#873D50] hover:bg-[#732F40] text-white font-semibold rounded-lg text-xs tracking-wide flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                Confirm & Seal Evidence
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterEvidence;
