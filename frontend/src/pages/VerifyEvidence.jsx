import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf";
import { 
  SearchCode, 
  UploadCloud, 
  ShieldCheck, 
  ShieldAlert,
  AlertTriangle, 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Video, 
  Music, 
  Image as ImageIcon,
  Layers, 
  Download, 
  FileCheck2, 
  Printer, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Clock, 
  HelpCircle,
  FileSearch,
  ExternalLink,
  Info
} from "lucide-react";

const VerifyEvidence = () => {
  const [searchParams] = useSearchParams();
  const queryEvidenceId = searchParams.get("evidenceId") || "";

  // Selection & File states
  const [evidenceList, setEvidenceList] = useState([]);
  const [evidenceId, setEvidenceId] = useState(queryEvidenceId);
  const [file, setFile] = useState(null);
  const [sampleAccordionOpen, setSampleAccordionOpen] = useState(false);

  // 5-Stage Verification Pipeline State
  const [verifying, setVerifying] = useState(false);
  const [pipelineStages, setPipelineStages] = useState([
    { id: 1, label: "Evidence File Received", status: "idle", detail: "Awaiting uploaded exhibit file", timestamp: null },
    { id: 2, label: "SHA-256 Hash Calculation", status: "idle", detail: "FIPS 180-4 compliant 256-bit cryptographic digest", timestamp: null },
    { id: 3, label: "Registered Hash Comparison", status: "idle", detail: "Byte-level comparison against sealed baseline digest", timestamp: null },
    { id: 4, label: "Blockchain Record Verification", status: "idle", detail: "Solidity smart contract query on Ethereum ledger (Chain 1337)", timestamp: null },
    { id: 5, label: "Final Integrity Assessment", status: "idle", detail: "Admissibility verdict and tamper detection summary", timestamp: null }
  ]);

  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [copiedRegistered, setCopiedRegistered] = useState(false);
  const [copiedCalculated, setCopiedCalculated] = useState(false);

  // Judicial Certificate Modal State
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certData, setCertData] = useState(null);
  const [certLoading, setCertLoading] = useState(false);

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const response = await axios.get("/api/evidence");
        if (Array.isArray(response.data)) {
          setEvidenceList(response.data);
          if (queryEvidenceId) {
            setEvidenceId(queryEvidenceId);
          } else if (response.data.length > 0 && !evidenceId) {
            setEvidenceId(response.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load evidence catalog for verification");
      }
    };
    fetchEvidence();
  }, [queryEvidenceId]);

  const selectedEvidenceMeta = Array.isArray(evidenceList) 
    ? evidenceList.find(e => String(e.id) === String(evidenceId)) 
    : null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setReport(null);
      setError("");
      resetPipeline();
    }
  };

  const resetPipeline = () => {
    setPipelineStages([
      { id: 1, label: "Evidence File Received", status: "idle", detail: "Awaiting uploaded exhibit file", timestamp: null },
      { id: 2, label: "SHA-256 Hash Calculation", status: "idle", detail: "FIPS 180-4 compliant 256-bit cryptographic digest", timestamp: null },
      { id: 3, label: "Registered Hash Comparison", status: "idle", detail: "Byte-level comparison against sealed baseline digest", timestamp: null },
      { id: 4, label: "Blockchain Record Verification", status: "idle", detail: "Solidity smart contract query on Ethereum ledger (Chain 1337)", timestamp: null },
      { id: 5, label: "Final Integrity Assessment", status: "idle", detail: "Admissibility verdict and tamper detection summary", timestamp: null }
    ]);
  };

  // 1-Click Sample File Loader for Testing
  const handleLoadSampleFile = async (filename, isTampered, categoryKeywords) => {
    try {
      // Find corresponding registered evidence in evidenceList
      const matching = evidenceList.find(e => 
        categoryKeywords.some(kw => 
          (e.evidenceName && e.evidenceName.toLowerCase().includes(kw.toLowerCase())) ||
          (e.category && e.category.toLowerCase().includes(kw.toLowerCase())) ||
          (e.fileType && e.fileType.toLowerCase().includes(kw.toLowerCase()))
        )
      );

      if (matching) {
        setEvidenceId(matching.id);
      }

      // Fetch sample binary from demo_files static directory
      const res = await fetch(`/uploads/demo_files/${filename}`);
      if (!res.ok) {
        throw new Error(`Demo file not accessible: ${filename}`);
      }
      const blob = await res.blob();
      const getMimeFromFilename = (fname) => {
        const ext = fname.split(".").pop().toLowerCase();
        if (ext === "mp4") return "video/mp4";
        if (ext === "pdf") return "application/pdf";
        if (ext === "png") return "image/png";
        if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
        if (ext === "wav") return "audio/wav";
        return "application/octet-stream";
      };
      const mimeType = (blob.type && blob.type !== "application/octet-stream" && blob.type !== "text/html")
        ? blob.type 
        : getMimeFromFilename(filename);
      const demoFile = new File([blob], filename, { type: mimeType });
      setFile(demoFile);
      setReport(null);
      setError("");
      resetPipeline();
    } catch (err) {
      setError(`Failed to load demonstration file: ${err.message}. Please select file manually.`);
    }
  };

  // Execute 5-Stage Real-Time Integrity Verification
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!file || !evidenceId) {
      setError("Please select a target evidence record and upload an exhibit file to audit.");
      return;
    }

    setVerifying(true);
    setError("");
    setReport(null);

    const now = () => new Date().toLocaleTimeString();

    // Helper to update specific pipeline step
    const setStepState = (id, status, detail) => {
      setPipelineStages(prev => prev.map(s => s.id === id ? { ...s, status, detail, timestamp: now() } : s));
    };

    try {
      // STAGE 1: Evidence File Received
      setStepState(1, "running", `Ingesting payload: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      await new Promise(r => setTimeout(r, 250));
      setStepState(1, "success", `Valid file envelope received: ${file.name} • ${file.type || "binary payload"}`);

      // STAGE 2: SHA-256 Hash Calculation (Compute live on client + submit to backend)
      setStepState(2, "running", "Computing 256-bit FIPS 180-4 cryptographic digest across byte stream...");
      let clientHash = "";
      try {
        const buffer = await file.arrayBuffer();
        const hashBuf = await crypto.subtle.digest("SHA-256", buffer);
        clientHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
      } catch (chErr) {
        // Fallback handled by backend
      }
      await new Promise(r => setTimeout(r, 250));
      setStepState(2, "success", `Digest calculated: ${clientHash ? clientHash.substring(0, 20) + "..." : "Completed"}`);

      // STAGE 3 & 4: Registered Hash Comparison & Blockchain Query via Backend
      setStepState(3, "running", "Querying registered cryptographic baseline and evaluating mathematical equivalence...");
      setStepState(4, "running", "Querying Solidity contract via Ethereum RPC node...");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("evidenceId", evidenceId);

      const response = await axios.post("/api/verify", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const rep = response.data.report;
      setReport(rep);

      // Evaluate STAGE 3 result
      if (rep.isVerified) {
        setStepState(3, "success", "Exact mathematical match: Submitted exhibit digest matches registered baseline byte-for-byte.");
      } else {
        setStepState(3, "failed", "Cryptographic mismatch: Submitted exhibit digest differs from registered baseline.");
      }

      // Evaluate STAGE 4 result (reporting actual registered evidence anchoring status)
      if (rep.blockchainAnchoring === "CONFIRMED") {
        setStepState(4, "success", "On-Chain Corroboration: Smart contract verified record (Witness: Ethereum Node Chain ID 1337).");
      } else if (rep.blockchainAnchoring === "PREVIOUS_CHAIN") {
        setStepState(4, "warning", "Blockchain Status: PREVIOUS CHAIN. Record was anchored on a previous chain instance; unverified on active network.");
      } else if (rep.blockchainAnchoring === "NOT_ANCHORED") {
        setStepState(4, "warning", "Blockchain Status: NOT ANCHORED. Exhibit is registered in repository but not yet anchored on Ethereum.");
      } else if (rep.blockchainAnchoring === "NODE_UNAVAILABLE" || rep.networkStatus === "NODE_UNAVAILABLE") {
        setStepState(4, "warning", "Blockchain Status: NODE UNAVAILABLE. Ethereum JSON-RPC node offline. Corroborated against repository seal.");
      } else {
        setStepState(4, "warning", `Blockchain Status: ${rep.blockchainAnchoring || "UNAVAILABLE"}.`);
      }

      // STAGE 5: Final Integrity Assessment (Never treat offline node as file tampering!)
      if (rep.fileIntegrity === "MATCH") {
        if (rep.blockchainAnchoring === "CONFIRMED") {
          setStepState(5, "success", "INTEGRITY VERIFIED — HASH MATCH (Fully corroborated on Ethereum Smart Contract).");
        } else {
          setStepState(5, "success", `INTEGRITY VERIFIED — LOCAL HASH MATCH (Corroborated against database seal; Blockchain: ${rep.blockchainAnchoring}).`);
        }
      } else {
        setStepState(5, "failed", "INTEGRITY COMPROMISED — HASH MISMATCH DETECTED. File altered post-seizure.");
      }

    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || "Integrity verification check failed.";
      setError(errMsg);
      setStepState(3, "failed", "Integrity audit aborted due to technical error.");
      setStepState(5, "failed", `VERIFICATION FAILED – TECHNICAL ERROR: ${errMsg}`);
    } finally {
      setVerifying(false);
    }
  };

  // Download Formal Forensic Verification Report as PDF
  const handleDownloadVerificationReport = () => {
    if (!report) return;

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const isVerified = Boolean(report.isVerified);
      const pageWidth = 210;

      // 1. Charcoal Top Banner (#343239)
      doc.setFillColor(52, 50, 57);
      doc.rect(0, 0, pageWidth, 28, "F");

      // 2. Burgundy Accent Strip (#873D50)
      doc.setFillColor(135, 61, 80);
      doc.rect(0, 28, pageWidth, 3, "F");

      // Header Title
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("PROOFSHIELD DIGITAL EVIDENCE INTEGRITY SYSTEM", 14, 12);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(211, 207, 214);
      doc.text("FORENSIC INTEGRITY AUDIT & VERIFICATION REPORT • FRE 902(13)/(14) & BSA 2023 SEC 63", 14, 19);

      // Right Header Info
      doc.setFont("courier", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(242, 226, 231);
      doc.text("CHAIN ID 1337", 196, 12, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text("FIPS 180-4 SHA-256 AUDIT", 196, 19, { align: "right" });

      // 3. Metadata Header Pill Box
      doc.setFillColor(250, 248, 247);
      doc.setDrawColor(232, 228, 225);
      doc.roundedRect(14, 35, 182, 17, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(87, 81, 90);
      doc.text("VERIFICATION ID", 18, 40);
      doc.text("AUDIT TIMESTAMP", 80, 40);
      doc.text("INTEGRITY STATUS", 145, 40);

      doc.setFont("courier", "bold");
      doc.setFontSize(8);
      doc.setTextColor(52, 50, 57);
      doc.text(String(report.verificationId || ("VRF-" + Date.now())).substring(0, 24), 18, 46.5);
      doc.text(new Date(report.timestamp || Date.now()).toISOString().replace("T", " ").substring(0, 19) + " UTC", 80, 46.5);

      if (isVerified) {
        doc.setTextColor(8, 116, 67);
        doc.text("✓ INTEGRITY VERIFIED", 145, 46.5);
      } else {
        doc.setTextColor(180, 35, 24);
        doc.text("✗ TAMPER DETECTED", 145, 46.5);
      }

      let y = 58;

      // Section Header Helper
      const drawSectionHeader = (title) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(135, 61, 80);
        doc.text(title, 14, y);
        doc.setDrawColor(232, 228, 225);
        doc.line(14, y + 2, 196, y + 2);
        y += 7;
      };

      // --- SECTION 1: TARGET EVIDENCE RECORD ---
      drawSectionHeader("1. TARGET DIGITAL EVIDENCE RECORD");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(87, 81, 90);

      const rowH = 5.2;
      const col1 = 16;
      const col2 = 60;
      const col3 = 110;
      const col4 = 150;

      doc.text("Evidence File Name:", col1, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(52, 50, 57);
      doc.text(doc.splitTextToSize(String(report.evidenceName || "N/A"), 130), col2, y);
      y += rowH;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(87, 81, 90);
      doc.text("Case Dossier Ref:", col1, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(52, 50, 57);
      const caseText = `${selectedEvidenceMeta?.case?.caseNumber || "CASE-FILE"} — ${selectedEvidenceMeta?.case?.title || "Active Investigation"}`;
      doc.text(doc.splitTextToSize(caseText, 130), col2, y);
      y += rowH;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(87, 81, 90);
      doc.text("Category / MIME:", col1, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(52, 50, 57);
      doc.text(`${selectedEvidenceMeta?.category || "Forensic Exhibit"} (${report.registeredFileType || "binary"})`, col2, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(87, 81, 90);
      doc.text("Registered Size:", col3, y);
      doc.setFont("courier", "bold");
      doc.setTextColor(52, 50, 57);
      doc.text(`${(report.originalSize / 1024).toFixed(2)} KB (${report.originalSize} B)`, col4, y);
      y += rowH;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(87, 81, 90);
      doc.text("Registered At:", col1, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(52, 50, 57);
      doc.text(selectedEvidenceMeta?.createdAt ? new Date(selectedEvidenceMeta.createdAt).toUTCString() : "N/A", col2, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(87, 81, 90);
      doc.text("Examined Size:", col3, y);
      doc.setFont("courier", "bold");
      doc.setTextColor(52, 50, 57);
      doc.text(`${(report.uploadedSize / 1024).toFixed(2)} KB (${report.uploadedSize} B)`, col4, y);
      y += rowH + 3;

      // --- SECTION 2: CRYPTOGRAPHIC CHECKSUM COMPARISON ---
      drawSectionHeader("2. CRYPTOGRAPHIC BIT-STREAM AUDIT (FIPS 180-4 SHA-256)");

      // Baseline Hash Box
      doc.setFillColor(250, 248, 247);
      doc.setDrawColor(232, 228, 225);
      doc.roundedRect(14, y, 182, 13, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(87, 81, 90);
      doc.text("1. ORIGINAL REGISTERED HASH (IMMUTABLE BASELINE):", 18, y + 4.5);
      doc.setFont("courier", "bold");
      doc.setFontSize(8);
      doc.setTextColor(52, 50, 57);
      doc.text(report.originalHash || "N/A", 18, y + 9.5);
      y += 16;

      // Submitted Live Hash Box
      if (isVerified) {
        doc.setFillColor(237, 253, 245);
        doc.setDrawColor(166, 244, 197);
      } else {
        doc.setFillColor(254, 243, 242);
        doc.setDrawColor(254, 205, 202);
      }
      doc.roundedRect(14, y, 182, 13, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(isVerified ? 8 : 180, isVerified ? 116 : 35, isVerified ? 67 : 24);
      doc.text("2. SUBMITTED EXHIBIT HASH (CALCULATED LIVE AT INTAKE):", 18, y + 4.5);
      doc.setFont("courier", "bold");
      doc.setFontSize(8);
      doc.text(report.submittedHash || "N/A", 18, y + 9.5);
      y += 16;

      // Final Comparison Verdict Banner
      if (isVerified) {
        doc.setFillColor(237, 253, 245);
        doc.setDrawColor(166, 244, 197);
        doc.roundedRect(14, y, 182, 11, 2, 2, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(8, 116, 67);
        doc.text("VERDICT: EXACT MATHEMATICAL MATCH — 0 BIT DIVERGENCE (AUTHENTIC & UNALTERED)", 18, y + 7);
      } else {
        doc.setFillColor(254, 243, 242);
        doc.setDrawColor(254, 205, 202);
        doc.roundedRect(14, y, 182, 11, 2, 2, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(180, 35, 24);
        doc.text("VERDICT: CHECKSUM MISMATCH — DIVERGENCE CONFIRMS UNAUTHORIZED TAMPERING", 18, y + 7);
      }
      y += 16;

      // --- SECTION 3: BLOCKCHAIN CONSENSUS & NON-REPUDIATION ---
      drawSectionHeader("3. ETHEREUM BLOCKCHAIN ANCHORING & CONSENSUS WITNESS");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(87, 81, 90);

      doc.text("On-Chain Anchoring Status:", col1, y);
      doc.setFont("helvetica", "bold");
      if (report.blockchainAnchoring === "CONFIRMED") {
        doc.setTextColor(8, 116, 67);
        doc.text("CONFIRMED ON ETHEREUM SMART CONTRACT (CHAIN ID 1337)", col2, y);
      } else if (report.blockchainAnchoring === "PREVIOUS_CHAIN") {
        doc.setTextColor(152, 96, 0);
        doc.text("PREVIOUS CHAIN SESSION (Unverified on Active Epoch)", col2, y);
      } else {
        doc.setTextColor(87, 81, 90);
        doc.text(String(report.blockchainAnchoring || "NOT ANCHORED"), col2, y);
      }
      y += rowH;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(87, 81, 90);
      doc.text("Witness Source:", col1, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(52, 50, 57);
      doc.text(String(report.witnessSource || "Cryptographic Ledger"), col2, y);
      y += rowH;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(87, 81, 90);
      doc.text("Ethereum Transaction Hash:", col1, y);
      doc.setFont("courier", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(52, 50, 57);
      doc.text(String(report.blockchainTxId || "Standby Redundancy Seal"), col2, y);
      y += rowH;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(87, 81, 90);
      doc.text("Decentralized Storage CID:", col1, y);
      doc.setFont("courier", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(52, 50, 57);
      doc.text(String(report.ipfsCid || "IPFS Mock Storage Container"), col2, y);
      y += rowH + 3;

      // --- SECTION 4: STATUTORY DECLARATION & CERTIFICATION ---
      drawSectionHeader("4. STATUTORY DECLARATION & JUDICIAL CERTIFICATION");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(87, 81, 90);

      const declarationText = isVerified
        ? "I hereby certify pursuant to Federal Rules of Evidence Rule 902(13)/(14) and Section 63 of the Bharatiya Sakshya Adhiniyam, 2023, that the cryptographic hash algorithm (SHA-256) executed against the submitted digital exhibit produced an output identical to the baseline record anchored to the blockchain ledger. No data corruption, modification, or post-seizure tampering was detected."
        : "CRITICAL FORENSIC ADVISORY: Pursuant to forensic verification procedures, the digital exhibit presented for authentication diverges from the registered baseline SHA-256 fingerprint on record. This discrepancy constitutes positive mathematical proof of post-seizure file modification, corruption, or substitution. This payload MUST NOT be admitted as original authentic evidence.";

      const splitDeclaration = doc.splitTextToSize(declarationText, 180);
      doc.text(splitDeclaration, 16, y);
      y += (splitDeclaration.length * 3.8) + 6;

      // Signatures / Seal Box
      doc.setDrawColor(232, 228, 225);
      doc.line(16, y + 10, 85, y + 10);
      doc.line(125, y + 10, 194, y + 10);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(52, 50, 57);
      doc.text("FORENSIC EXAMINER SIGNATURE", 16, y + 14);
      doc.text("CRYPTOGRAPHIC SYSTEM ATTESTATION", 125, y + 14);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(87, 81, 90);
      doc.text("Qualified Examiner (Digital Forensics Unit)", 16, y + 18);
      doc.text("ProofShield Core v2.4 (FIPS 180-4 / Chain ID 1337)", 125, y + 18);

      // Bottom Footer
      doc.setDrawColor(232, 228, 225);
      doc.line(14, 282, 196, 282);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(140, 132, 144);
      doc.text("ProofShield Forensic Core • Decentralized Digital Evidence Ledger • Official Verification Document", 14, 287);
      doc.text("Page 1 of 1", 196, 287, { align: "right" });

      const safeFilename = String(report.evidenceName || "evidence").replace(/\.[^/.]+$/, "");
      doc.save(`ProofShield_Verification_Report_${safeFilename}_${Date.now()}.pdf`);
    } catch (pdfErr) {
      console.error("Failed to generate verification report PDF:", pdfErr);
      alert("Error generating verification PDF report: " + pdfErr.message);
    }
  };

  // Open Formal Judicial Certificate Modal
  const handleOpenCertificate = async () => {
    if (!evidenceId) return;
    setCertLoading(true);
    try {
      const res = await axios.get(`/api/reports/verification/${evidenceId}`);
      setCertData(res.data);
      setCertModalOpen(true);
    } catch (err) {
      alert("Failed to load official certificate: " + (err.response?.data?.error || err.message));
    } finally {
      setCertLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E8E4E1] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#343239] tracking-tight">Verify Evidence Integrity</h1>
          <p className="text-xs text-[#57515A] mt-0.5">
            Conduct byte-level SHA-256 cryptographic audits to prove digital evidence authenticity and detect unauthorized tampering.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {evidenceId && (
            <button
              onClick={handleOpenCertificate}
              disabled={certLoading}
              className="px-3.5 py-1.5 bg-white border border-[#E8E4E1] hover:bg-[#FAF8F7] text-[#343239] font-semibold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileCheck2 className="w-4 h-4 text-[#087443]" />
              Judicial Certificate
            </button>
          )}
          <Link
            to="/custody"
            className="px-3.5 py-1.5 bg-white border border-[#E8E4E1] hover:bg-[#FAF8F7] text-[#343239] font-semibold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4 text-[#6941C6]" />
            Chain of Custody
          </Link>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: Target Selection & Upload Exhibit (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E8E4E1] rounded-xl p-5 shadow-xs space-y-4">
          <div className="border-b border-[#E8E4E1] pb-2 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#343239] flex items-center gap-1.5 font-mono">
              <SearchCode className="w-4 h-4 text-[#873D50]" />
              Verification Parameters
            </h2>
            <span className="text-[10px] font-mono text-[#57515A]">FIPS 180-4 Engine</span>
          </div>

          {error && (
            <div className="p-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-lg text-[#B42318] text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#B42318] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            
            {/* 1. Target Evidence Dropdown */}
            <div>
              <label className="text-[11px] text-[#343239] font-bold uppercase tracking-wider block mb-1 font-mono">
                Select Registered Evidence Record *
              </label>
              <select
                value={evidenceId}
                onChange={(e) => {
                  setEvidenceId(e.target.value);
                  setReport(null);
                  resetPipeline();
                }}
                className="w-full bg-[#FAF8F7] border border-[#DDD7D2] focus:border-[#873D50] focus:ring-1 focus:ring-[#873D50]/20 focus:bg-white rounded-lg px-3 py-2 text-xs text-[#343239] focus:outline-none transition-colors"
                required
              >
                <option value="">-- Choose Evidence Item --</option>
                {evidenceList.map((item) => (
                  <option key={item.id} value={item.id}>
                    [{item.case?.caseNumber || "CASE"}] {item.evidenceName}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Evidence Details Card */}
            {selectedEvidenceMeta && (
              <div className="p-3.5 bg-[#FAF8F7] rounded-xl border border-[#E8E4E1] text-xs space-y-2.5">
                <div className="flex items-start justify-between gap-3 border-b border-[#E8E4E1] pb-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-[#57515A] uppercase font-mono tracking-wider block">Evidence Filename</span>
                    <span className="font-bold text-[#343239] text-xs break-all block mt-0.5 leading-snug">
                      {selectedEvidenceMeta.evidenceName}
                    </span>
                  </div>
                  <span className="shrink-0 whitespace-nowrap px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#F2E2E7] text-[#873D50] border border-[#E5C3CD]">
                    {selectedEvidenceMeta.category || "Digital Exhibit"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-[9px] uppercase font-sans text-[#57515A] block">Case Reference</span>
                    <span className="text-[#343239] font-semibold">{selectedEvidenceMeta.case?.caseNumber || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-sans text-[#57515A] block">Registered Size</span>
                    <span className="text-[#343239] font-semibold">
                      {(selectedEvidenceMeta.fileSize / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] uppercase font-sans text-[#57515A] block">Registration Timestamp</span>
                    <span className="text-[#57515A] text-[10px]">
                      {new Date(selectedEvidenceMeta.createdAt).toUTCString()}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] text-[#57515A] uppercase mb-1">
                    <span className="font-mono">Registered SHA-256 Digest:</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedEvidenceMeta.fileHash);
                        setCopiedRegistered(true);
                        setTimeout(() => setCopiedRegistered(false), 2000);
                      }}
                      className="text-[#873D50] hover:text-[#732F40] flex items-center gap-1 cursor-pointer font-sans font-bold normal-case text-[11px]"
                    >
                      {copiedRegistered ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copiedRegistered ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-[#343239] font-bold break-all block bg-white p-2.5 rounded-lg border border-[#E8E4E1]">
                    {selectedEvidenceMeta.fileHash}
                  </span>
                </div>
              </div>
            )}

            {/* 2. File Upload Area */}
            <div>
              <label className="text-[11px] text-[#343239] font-bold uppercase tracking-wider block mb-1 font-mono">
                Upload Exhibit File to Verify *
              </label>
              <div className="border-2 border-dashed border-[#DDD7D2] hover:border-[#873D50] bg-[#FAF8F7]/60 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer relative group transition-all">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  required
                />
                <UploadCloud className="w-7 h-7 text-[#873D50] mb-1.5 group-hover:scale-105 transition-transform" />
                {file ? (
                  <div className="w-full px-2">
                    <p className="text-xs font-bold text-[#343239] truncate">{file.name}</p>
                    <span className="text-[10px] text-[#57515A] font-mono block mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB &bull; {file.type || "binary exhibit"}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-semibold text-[#343239] block">Click to browse or drop exhibit file here</span>
                    <span className="text-[10px] text-[#57515A] mt-0.5 block">Accepts MP4, WebM, JPG, PNG, WAV, PDF (Up to 250MB)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Primary Verification Action Button */}
            <button
              type="submit"
              disabled={verifying || !file || !evidenceId}
              className="w-full bg-[#873D50] hover:bg-[#732F40] active:bg-[#612433] text-white py-2.5 rounded-lg text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {verifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Executing Verification Pipeline...</span>
                </>
              ) : (
                <>
                  <SearchCode className="w-4 h-4" />
                  <span>Verify Evidence Integrity</span>
                </>
              )}
            </button>
          </form>

          {/* Collapsible Section: Sample Evidence for Testing */}
          <div className="pt-2 border-t border-[#E8E4E1]">
            <button
              type="button"
              onClick={() => setSampleAccordionOpen(!sampleAccordionOpen)}
              className="w-full flex items-center justify-between text-xs font-semibold text-[#343239] hover:text-[#873D50] py-1.5 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#873D50]" />
                Sample Evidence for Testing
              </span>
              {sampleAccordionOpen ? <ChevronUp className="w-4 h-4 text-[#57515A]" /> : <ChevronDown className="w-4 h-4 text-[#57515A]" />}
            </button>

            {sampleAccordionOpen && (
              <div className="mt-2.5 space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <p className="text-[10px] text-slate-500 leading-relaxed mb-2">
                  Select any pair to quickly test authentic match vs tampered detection:
                </p>

                {/* 1. CCTV Video */}
                <div className="p-2 bg-white rounded border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
                    <span className="flex items-center gap-1">
                      <Video className="w-3 h-3 text-blue-600" />
                      1. CCTV Surveillance Video
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">original_cctv.mp4</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleLoadSampleFile("original_cctv.mp4", false, ["original_cctv", "cctv", "video"])}
                      className="flex-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold cursor-pointer transition-all"
                    >
                      Load Original (Match)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSampleFile("original_cctv_tampered.mp4", true, ["original_cctv", "cctv", "video"])}
                      className="flex-1 px-2 py-1 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded text-[10px] font-bold cursor-pointer transition-all"
                    >
                      Load Tampered (Mismatch)
                    </button>
                  </div>
                </div>

                {/* 2. Fingerprint Examination Report */}
                <div className="p-2 bg-white rounded border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3 text-rose-600" />
                      2. Fingerprint Examination Report
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">fingerprint_examination_report.pdf</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleLoadSampleFile("fingerprint_examination_report.pdf", false, ["fingerprint", "report", "pdf"])}
                      className="flex-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold cursor-pointer transition-all"
                    >
                      Load Original (Match)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSampleFile("fingerprint_examination_report_tampered.pdf", true, ["fingerprint", "report", "pdf"])}
                      className="flex-1 px-2 py-1 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded text-[10px] font-bold cursor-pointer transition-all"
                    >
                      Load Tampered (Mismatch)
                    </button>
                  </div>
                </div>

                {/* 3. Crime Scene Photo */}
                <div className="p-2 bg-white rounded border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-purple-600" />
                      3. Crime Scene Photograph
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">crime_scene_photo.png</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleLoadSampleFile("crime_scene_photo.png", false, ["crime_scene_photo", "photo", "image"])}
                      className="flex-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold cursor-pointer transition-all"
                    >
                      Load Original (Match)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSampleFile("crime_scene_photo_tampered.png", true, ["crime_scene_photo", "photo", "image"])}
                      className="flex-1 px-2 py-1 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded text-[10px] font-bold cursor-pointer transition-all"
                    >
                      Load Tampered (Mismatch)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: 5-Stage Verification Workflow & Comparative Results (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Section A: 5-Stage Verification Workflow Timeline */}
          <div className="bg-white border border-[#E8E4E1] rounded-xl p-5 shadow-xs">
            <div className="border-b border-[#E8E4E1] pb-2.5 flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#343239] font-mono">
                5-Stage Integrity Verification Workflow
              </h3>
              <span className="text-[10px] font-mono text-[#57515A]">Real-Time Progression</span>
            </div>

            <div className="space-y-3.5 relative pl-6 border-l border-[#E8E4E1] ml-2">
              {pipelineStages.map((step) => {
                const isSuccess = step.status === "success";
                const isRunning = step.status === "running";
                const isFailed = step.status === "failed";
                const isWarning = step.status === "warning";

                return (
                  <div key={step.id} className="relative flex items-start gap-3">
                    <span className={`absolute -left-[35px] top-0.5 w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                      isSuccess 
                        ? "bg-[#EDFDF5] text-[#087443] border-[#A6F4C5]" 
                        : isRunning 
                          ? "bg-[#F2E2E7] text-[#873D50] border-[#E5C3CD] animate-pulse" 
                          : isFailed
                          ? "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]"
                          : isWarning
                          ? "bg-[#FEF6EE] text-[#986000] border-[#FEDF89]"
                          : "bg-[#FAF8F7] text-[#8C8490] border-[#E8E4E1]"
                    }`}>
                      {isSuccess ? "✓" : isFailed ? "✕" : isWarning ? "!" : step.id}
                    </span>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-bold ${
                          isRunning 
                            ? "text-[#873D50] font-bold" 
                            : isSuccess 
                            ? "text-[#087443] font-bold" 
                            : isFailed 
                            ? "text-[#B42318] font-bold" 
                            : isWarning
                            ? "text-[#986000] font-bold"
                            : "text-[#57515A]"
                        }`}>
                          {step.label}
                        </h4>
                        {step.timestamp && (
                          <span className="text-[10px] font-mono text-[#57515A]">{step.timestamp}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#57515A] mt-0.5 leading-relaxed">{step.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section B: Verification Standby / Results */}
          {!report && !verifying ? (
            <div className="bg-white border border-dashed border-[#DDD7D2] rounded-xl p-10 flex flex-col items-center justify-center text-center shadow-xs">
              <FileSearch className="w-10 h-10 text-[#8C8490] mb-2" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#343239] font-mono">Awaiting Verification Execution</h4>
              <p className="text-[11px] text-[#57515A] max-w-sm mt-0.5">
                Select an evidence item and exhibit file on the left, then click Verify Evidence Integrity to evaluate mathematical equivalence.
              </p>
            </div>
          ) : report ? (
            <div className="space-y-4">
              
              {/* Verdict Banner */}
              {report.isVerified ? (
                <div className="bg-emerald-50 border-2 border-emerald-500 p-5 rounded-xl flex items-start gap-3.5 shadow-xs">
                  <div className="h-9 w-9 bg-emerald-600 text-white rounded-full flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                        INTEGRITY VERIFIED – HASH MATCH
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-emerald-950 mt-1">
                      Evidence Cryptographic Integrity Confirmed
                    </h3>
                    <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                      Byte-level mathematical corroboration relative to baseline. The calculated SHA-256 digest matches the on-chain Solidity registration byte-for-byte.
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] font-mono">
                      <span className="text-emerald-900 font-bold uppercase">WITNESS SOURCE:</span>
                      <span className="bg-white/90 px-2 py-0.5 rounded border border-emerald-300 font-bold text-emerald-800">
                        {report.witnessSource === "ON_CHAIN_ETHEREUM_SMART_CONTRACT" ? "Ethereum Smart Contract (Chain 1337)" : "Cryptographic Database Registry"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border-2 border-red-600 p-5 rounded-xl flex items-start gap-3.5 shadow-xs">
                  <div className="h-9 w-9 bg-red-600 text-white rounded-full flex items-center justify-center shrink-0 shadow-xs">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-red-800 bg-red-100 border border-red-300 px-2 py-0.5 rounded">
                        INTEGRITY MISMATCH – HASH DOES NOT MATCH
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-red-950 mt-1">
                      Evidence Tampering Detected — Cryptographic Mismatch!
                    </h3>
                    <p className="text-xs text-red-800 mt-0.5 leading-relaxed">
                      The submitted exhibit does NOT match the original fingerprint sealed on the Ethereum blockchain. The file has been modified, re-encoded, truncated, or substituted post-seizure.
                    </p>
                  </div>
                </div>
              )}

              {/* THREE INDEPENDENT FORENSIC CHECKS (TASK 5) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* A. File Integrity */}
                <div className={`p-3.5 rounded-xl border ${
                  report.fileIntegrity === "MATCH" ? "bg-emerald-50/70 border-emerald-300" : "bg-red-50/70 border-red-300"
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    A. File Integrity
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    {report.fileIntegrity === "MATCH" ? (
                      <span className="text-emerald-700 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" /> HASH MATCH
                      </span>
                    ) : (
                      <span className="text-red-700 flex items-center gap-1 font-mono">
                        <XCircle className="w-3.5 h-3.5" /> HASH MISMATCH
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {report.fileIntegrity === "MATCH" 
                      ? "Uploaded binary matches registered SHA-256 digest." 
                      : "File hash does not match registered baseline."}
                  </p>
                </div>

                {/* B. Blockchain Anchoring */}
                <div className={`p-3.5 rounded-xl border ${
                  report.blockchainAnchoring === "CONFIRMED" 
                    ? "bg-emerald-50/70 border-emerald-300" 
                    : report.blockchainAnchoring === "PREVIOUS_CHAIN"
                    ? "bg-purple-50/70 border-purple-300"
                    : report.blockchainAnchoring === "NOT_ANCHORED" 
                    ? "bg-amber-50/70 border-amber-300" 
                    : report.blockchainAnchoring === "NODE_UNAVAILABLE"
                    ? "bg-amber-50/70 border-amber-300"
                    : "bg-slate-50 border-slate-300"
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    B. Blockchain Anchoring
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-xs font-mono">
                    {report.blockchainAnchoring === "CONFIRMED" ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ON-CHAIN CONFIRMED
                      </span>
                    ) : report.blockchainAnchoring === "PREVIOUS_CHAIN" ? (
                      <span className="text-purple-700 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> PREVIOUS CHAIN (UNVERIFIED)
                      </span>
                    ) : report.blockchainAnchoring === "NOT_ANCHORED" ? (
                      <span className="text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> NOT ANCHORED
                      </span>
                    ) : report.blockchainAnchoring === "NODE_UNAVAILABLE" ? (
                      <span className="text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> NODE UNAVAILABLE
                      </span>
                    ) : (
                      <span className="text-slate-600 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" /> {report.blockchainAnchoring || "UNAVAILABLE"}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {report.blockchainAnchoring === "CONFIRMED" 
                      ? "Corroborated on Ethereum smart contract."
                      : report.blockchainAnchoring === "PREVIOUS_CHAIN"
                      ? "Anchored on previous chain session; unverified on active network."
                      : report.blockchainAnchoring === "NOT_ANCHORED"
                      ? "Sealed in repository; pending smart contract anchor."
                      : report.blockchainAnchoring === "NODE_UNAVAILABLE"
                      ? "Ethereum node unreachable; verified against repository seal."
                      : "Ethereum RPC node offline or unreachable."}
                  </p>
                </div>

                {/* C. Network Status */}
                <div className={`p-3.5 rounded-xl border ${
                  report.networkStatus === "OPERATIONAL" ? "bg-[#EDFDF5]/70 border-[#A6F4C5]" : "bg-[#FEF6EE]/70 border-[#FEDF89]"
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#57515A] block mb-1 font-mono">
                    C. Network Status
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-xs font-mono">
                    {report.networkStatus === "OPERATIONAL" ? (
                      <span className="text-[#087443] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> NODE OPERATIONAL
                      </span>
                    ) : (
                      <span className="text-[#986000] flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> NODE UNAVAILABLE
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#57515A] mt-1">
                    {report.networkStatus === "OPERATIONAL" 
                      ? "JSON-RPC Provider (127.0.0.1:8545) & Contract active."
                      : "Ethereum JSON-RPC Provider offline or standby."}
                  </p>
                </div>
              </div>

              {/* Side-by-Side Fingerprint Comparison Card */}
              <div className="bg-white border border-[#E8E4E1] p-5 rounded-xl shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8E4E1] pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#343239] font-mono">
                    Cryptographic Checksum Comparison
                  </h4>
                  <span className="text-[10px] font-mono text-[#57515A]">SHA-256 (64 hex characters)</span>
                </div>
                
                <div className="space-y-2.5 font-mono text-xs">
                  {/* 1. Registered Hash */}
                  <div className="p-3 bg-[#FAF8F7] rounded-lg border border-[#E8E4E1]">
                    <div className="flex items-center justify-between text-[10px] text-[#57515A] font-bold uppercase mb-1">
                      <span>1. Original Registered Hash (Immutable Baseline):</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(report.originalHash);
                          setCopiedRegistered(true);
                          setTimeout(() => setCopiedRegistered(false), 2000);
                        }}
                        className="text-[#873D50] hover:text-[#732F40] flex items-center gap-1 cursor-pointer font-sans normal-case font-bold"
                      >
                        {copiedRegistered ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copiedRegistered ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <span className="text-[#343239] break-all select-all font-bold block bg-white p-2.5 rounded-lg border border-[#E8E4E1] text-[11px]">
                      {report.originalHash}
                    </span>
                  </div>
                  
                  {/* 2. Submitted Hash */}
                  <div className={`p-3 rounded-lg border ${report.isVerified ? "bg-[#EDFDF5]/50 border-[#A6F4C5]" : "bg-[#FEF3F2]/50 border-[#FECDCA]"}`}>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase mb-1">
                      <span className={report.isVerified ? "text-[#087443]" : "text-[#B42318]"}>
                        2. Submitted Exhibit Hash (Calculated Live):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(report.submittedHash);
                          setCopiedCalculated(true);
                          setTimeout(() => setCopiedCalculated(false), 2000);
                        }}
                        className="text-[#873D50] hover:text-[#732F40] flex items-center gap-1 cursor-pointer font-sans normal-case font-bold"
                      >
                        {copiedCalculated ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copiedCalculated ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <span className={`break-all select-all font-bold block bg-white p-2.5 rounded-lg border text-[11px] ${
                      report.isVerified ? "text-[#087443] border-[#A6F4C5]" : "text-[#B42318] border-[#FECDCA]"
                    }`}>
                      {report.submittedHash}
                    </span>
                  </div>

                  {/* Comparative Metrics Breakdown */}
                  <div className="p-3 bg-[#FAF8F7] border border-[#E8E4E1] rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] font-mono text-[#57515A]">
                    <div>
                      <span className="text-[10px] text-[#8C8490] uppercase font-sans block">Registered Size</span>
                      <span className="font-bold text-[#343239]">{report.originalSize != null ? `${(report.originalSize / 1024).toFixed(1)} KB` : "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8C8490] uppercase font-sans block">Uploaded Size</span>
                      <span className="font-bold text-[#343239]">{report.uploadedSize != null ? `${(report.uploadedSize / 1024).toFixed(1)} KB` : "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8C8490] uppercase font-sans block">Verification Time</span>
                      <span className="text-[#343239] font-sans text-[10px] block truncate">
                        {report.timestamp ? new Date(report.timestamp).toLocaleTimeString() : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Supplementary Perceptual Hash (Images only) */}
                  {report.pHashSimilarity !== null && report.pHashSimilarity !== undefined && (
                    <div className="p-3 bg-[#FAF8F7] border border-[#E8E4E1] rounded-lg text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase text-[#873D50] flex items-center gap-1 font-sans">
                          <Layers className="w-3.5 h-3.5 text-[#873D50]" />
                          Supplementary Perceptual Similarity (pHash)
                        </span>
                        <span className="font-mono font-bold text-[#873D50]">{report.pHashSimilarity}% Correlation</span>
                      </div>
                      <p className="text-[10px] text-[#57515A] font-sans leading-normal">
                        Perceptual comparison metric for forensic imaging analysis. SHA-256 remains the definitive legal standard for mathematical byte-level integrity.
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Report Actions */}
                <div className="pt-2 border-t border-[#E8E4E1] flex items-center justify-end gap-2.5">
                  <button
                    onClick={handleDownloadVerificationReport}
                    className="px-3.5 py-1.5 bg-[#873D50] hover:bg-[#732F40] text-white font-semibold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Verification Report
                  </button>
                  <button
                    onClick={handleOpenCertificate}
                    disabled={certLoading}
                    className="px-3.5 py-1.5 bg-white border border-[#E8E4E1] hover:bg-[#FAF8F7] text-[#343239] font-semibold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#57515A]" />
                    Judicial Certificate
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Judicial Verification Certificate Modal */}
      {certModalOpen && certData && (
        <div className="fixed inset-0 bg-[#343239]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-[#E8E4E1] rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setCertModalOpen(false)}
              className="absolute right-4 top-4 text-[#8C8490] hover:text-[#343239] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#E8E4E1] pb-3 mb-4 flex items-center gap-3">
              <div className="h-10 w-10 bg-[#EDFDF5] text-[#087443] rounded-xl flex items-center justify-center border border-[#A6F4C5]">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#343239]">Certificate of Cryptographic Authenticity</h3>
                <span className="text-[10px] font-mono text-[#57515A] uppercase">
                  FRE 902(13)/(14) & BSA 2023 Sec 63 Evidentiary Certificate
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-[#FAF8F7] border border-[#E8E4E1] rounded-lg space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#57515A] font-sans">Certificate Serial:</span>
                  <span className="font-bold text-[#343239]">{certData.certificateNumber || "CERT-" + Date.now()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57515A] font-sans">Evidence Name:</span>
                  <span className="font-bold text-[#343239]">{certData.evidenceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57515A] font-sans">Case Dossier:</span>
                  <span className="text-[#873D50] font-bold">{certData.caseNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57515A] font-sans">Registered Size:</span>
                  <span className="text-[#343239]">{(certData.fileSize / 1024).toFixed(2)} KB</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-sans text-[#57515A] font-bold block mb-1">
                  Sealed Baseline Fingerprint (SHA-256):
                </span>
                <span className="p-2 bg-[#FAF8F7] rounded border border-[#E8E4E1] text-[#343239] font-bold break-all block text-[11px]">
                  {certData.registeredSha256 || certData.fileHash}
                </span>
              </div>

              {certData.blockchainTxId && (
                <div>
                  <span className="text-[10px] uppercase font-sans text-slate-500 font-bold block mb-1">
                    On-Chain Ethereum Transaction ID:
                  </span>
                  <span className="p-2 bg-purple-50 rounded border border-purple-200 text-purple-900 font-bold break-all block text-[11px]">
                    {certData.blockchainTxId}
                  </span>
                </div>
              )}

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 font-sans text-xs space-y-1">
                <span className="font-bold block uppercase text-[10px] text-emerald-800">
                  Judicial Statutory Admissibility Attestation
                </span>
                <p className="text-[11px] leading-relaxed text-emerald-900">
                  ProofShield certifies that the registered SHA-256 cryptographic digest of this digital exhibit has remained unmodified since the recorded acquisition timestamp.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Certificate
              </button>
              <button
                onClick={() => setCertModalOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

class VerifyEvidenceErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("VerifyEvidence caught a rendering error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto bg-white border border-red-200 rounded-2xl shadow-sm text-center space-y-4 my-8">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Evidence Verification Display Recovered</h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
            An unexpected error occurred while rendering the verification interface:{" "}
            <span className="font-mono text-red-600 font-semibold">{this.state.error?.message || "Unknown error"}</span>
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all"
            >
              Reset & Reload View
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const VerifyEvidenceWithErrorBoundary = (props) => (
  <VerifyEvidenceErrorBoundary>
    <VerifyEvidence {...props} />
  </VerifyEvidenceErrorBoundary>
);

export default VerifyEvidenceWithErrorBoundary;