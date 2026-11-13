/**
 * generate-phase3-media.js
 * Generates all 3 remaining forensic evidence categories with authentic originals
 * and realistic, forensic-standard tampered counterparts:
 * 1. Crime Scene Photograph:
 *    - Original: 1280x720 photograph with Evidence Marker #01 (USB Drive) and Evidence Marker #02 (High-Security RFID Access Badge).
 *    - Tampered: Digitally removed Evidence Marker #02 and Access Badge (inpainting/object removal), keeping perspective intact.
 * 2. Emergency Audio Recording:
 *    - Valid 16-bit PCM WAV (16 kHz, Mono), with radio dispatch tones, voiceform modulation, and squelch.
 *    - Original: 18-second emergency call reporting 2 suspects fleeing vault with lockboxes.
 *    - Tampered: Altered/spliced report claiming false alarm / stand down.
 * 3. Forensic PDF Report:
 *    - Valid PDF-1.4 with ProofShield institutional branding, case metadata, SHA-256, findings.
 *    - Original: Confirms physical vault lock cylinder bypass and forced entry into safety deposit lockers.
 *    - Tampered: Findings altered to claim "no signs of unauthorized entry / mechanical malfunction".
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createCanvas } = require('canvas');

const DEMO_DIR = path.join(__dirname, '..', '..', 'uploads', 'demo_files');
const IPFS_DIR = path.join(__dirname, '..', '..', 'uploads', 'ipfs_mock');

if (!fs.existsSync(DEMO_DIR)) fs.mkdirSync(DEMO_DIR, { recursive: true });
if (!fs.existsSync(IPFS_DIR)) fs.mkdirSync(IPFS_DIR, { recursive: true });

function computeHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// =========================================================================
// 1. CRIME SCENE PHOTOGRAPHS (JPEG) - OBJECT REMOVAL TAMPER
// =========================================================================
function renderCrimeScenePhoto(options = {}) {
  const { includeAccessBadge = true } = options;
  const width = 1280;
  const height = 720;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Floor perspective gradient
  const floorGrad = ctx.createLinearGradient(0, height * 0.35, 0, height);
  floorGrad.addColorStop(0, '#2b3544');
  floorGrad.addColorStop(1, '#171e28');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, 0, width, height);

  // Background concrete wall
  const wallGrad = ctx.createLinearGradient(0, 0, 0, height * 0.45);
  wallGrad.addColorStop(0, '#0f172a');
  wallGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, width, height * 0.45);

  // Perspective floor grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.lineWidth = 1.5;
  for (let x = -width; x < width * 2; x += 80) {
    ctx.beginPath();
    ctx.moveTo(width / 2, height * 0.45);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = height * 0.45; y < height; y += (y - height * 0.4) * 0.4 + 15) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Vault Door in background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(width * 0.38, height * 0.12, width * 0.24, height * 0.33);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  ctx.strokeRect(width * 0.38, height * 0.12, width * 0.24, height * 0.33);

  // Lock wheel
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.28, 28, 0, Math.PI * 2);
  ctx.fillStyle = '#334155';
  ctx.fill();
  ctx.stroke();

  // Forensic Chalk Outline
  const cx = width * 0.48;
  const cy = height * 0.65;
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(cx - 60, cy - 40, 24, 0, Math.PI * 2);
  ctx.moveTo(cx - 36, cy - 35);
  ctx.lineTo(cx + 80, cy - 10);
  ctx.lineTo(cx + 70, cy + 30);
  ctx.lineTo(cx - 40, cy + 10);
  ctx.closePath();
  ctx.moveTo(cx - 30, cy - 30);
  ctx.lineTo(cx - 70, cy - 80);
  ctx.lineTo(cx - 95, cy - 70);
  ctx.moveTo(cx + 10, cy + 20);
  ctx.lineTo(cx + 40, cy + 70);
  ctx.moveTo(cx + 75, cy - 10);
  ctx.lineTo(cx + 160, cy + 20);
  ctx.lineTo(cx + 155, cy + 35);
  ctx.moveTo(cx + 70, cy + 30);
  ctx.lineTo(cx + 130, cy + 90);
  ctx.stroke();

  // Yellow & Black Police Line Tape
  ctx.save();
  ctx.translate(0, height * 0.48);
  ctx.rotate(-0.06);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(-50, 4, width + 100, 36);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-50, 0, width + 100, 36);
  ctx.fillStyle = '#000000';
  ctx.font = '900 16px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let x = -30; x < width + 60; x += 220) {
    ctx.fillText("POLICE LINE DO NOT CROSS", x, 18);
    ctx.beginPath();
    ctx.moveTo(x + 180, 0);
    ctx.lineTo(x + 195, 0);
    ctx.lineTo(x + 175, 36);
    ctx.lineTo(x + 160, 36);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Forensic Metric Scale (Bottom Right)
  const scaleX = width - 240;
  const scaleY = height - 50;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(scaleX, scaleY, 200, 20);
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(scaleX, scaleY, 200, 20);
  for (let s = 0; s < 200; s += 20) {
    if ((s / 20) % 2 === 0) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(scaleX + s, scaleY, 20, 20);
    }
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'left';
  ctx.fillText("FORENSIC SCALE (10cm)", scaleX, scaleY - 6);

  // Helper for drawing an evidence yellow tent card
  const drawTent = (x, y, label) => {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 26, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(x - 18, y + 24);
    ctx.lineTo(x, y - 12);
    ctx.lineTo(x + 18, y + 24);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y + 10);
  };

  // 1. Evidence 01: Dropped USB Flash Drive + Marker #01 (Preserved in BOTH original and tampered)
  drawTent(cx - 120, cy - 70, "01");
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(cx - 102, cy - 64, 26, 12); // Black USB case
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(cx - 76, cy - 62, 7, 8);   // Silver USB plug

  // 2. Evidence 02: High-Security RFID Access Badge + Marker #02
  // ONLY PRESENT IN ORIGINAL PHOTO; REMOVED IN TAMPERED PHOTO!
  if (includeAccessBadge) {
    drawTent(cx + 40, cy + 70, "02");
    // Badge shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(cx + 70, cy + 86, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // White plastic badge
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx + 60, cy + 70, 24, 34);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx + 60, cy + 70, 24, 34);

    // Red corporate clearance stripe
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(cx + 60, cy + 72, 24, 7);

    // Gold magnetic chip
    ctx.fillStyle = '#eab308';
    ctx.fillRect(cx + 65, cy + 86, 8, 8);
  }

  // Forensic Photo Timestamp Stamp
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(20, height - 70, 420, 50);
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(20, height - 70, 420, 50);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText("EVIDENCE RECOVERY PHOTOGRAPHY // PRIMARY EXHIBIT #04", 32, height - 50);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px Arial';
  ctx.fillText("CASE: PS-2026-001 | CAM: NIKON D850 | 2026-11-12 19:54:12 UTC", 32, height - 32);

  return canvas.toBuffer('image/jpeg', { quality: 0.94 });
}

// =========================================================================
// 2. EMERGENCY AUDIO RECORDING (WAV) - STATUTORY SPLICING TAMPER
// =========================================================================
function generateDispatchWav(options = {}) {
  const { isTampered = false } = options;
  const sampleRate = 16000;
  const durationSec = isTampered ? 16 : 18;
  const totalSamples = sampleRate * durationSec;

  // Header 44 bytes + 16-bit PCM data (2 bytes per sample)
  const dataSize = totalSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // WAV Header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);          // SubChunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);           // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(1, 22);           // NumChannels (1 = Mono)
  buffer.writeUInt32LE(sampleRate, 24);  // SampleRate
  buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  buffer.writeUInt16LE(2, 32);           // BlockAlign (NumChannels * BitsPerSample/8)
  buffer.writeUInt16LE(16, 34);          // BitsPerSample (16 bits)
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Synthesize realistic radio dispatcher transmission
  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    // 1. Initial Motorola radio alert beep (0.0s - 0.4s: 900 Hz + 1400 Hz tone)
    if (t < 0.4) {
      sample = (Math.sin(2 * Math.PI * 900 * t) + Math.sin(2 * Math.PI * 1400 * t)) * 0.4;
    } 
    // 2. Radio squelch / static hiss burst (0.4s - 0.7s)
    else if (t < 0.7) {
      sample = (Math.random() * 2 - 1) * 0.25;
    }
    // 3. Spoken voice dispatch message modulation (0.7s - duration - 0.6s)
    else if (t < durationSec - 0.6) {
      // Background radio carrier hiss
      const hiss = (Math.random() * 2 - 1) * 0.08;
      
      // Voice fundamental frequency (F0 ~ 130 Hz with formants at 750 Hz, 1200 Hz, 2400 Hz)
      const f0 = 130 + Math.sin(2 * Math.PI * 1.5 * t) * 15;
      const f1 = 750;
      const f2 = 1250;
      const f3 = 2400;

      // Syllable rhythm / speech envelope modulation (speaking cadence ~ 3 syllables per sec)
      const speechCadence = Math.max(0, Math.sin(2 * Math.PI * 3.2 * t)) * Math.sin(2 * Math.PI * 0.8 * t);

      // Voice harmonic sum
      let voice = Math.sin(2 * Math.PI * f0 * t) * 0.35 +
                  Math.sin(2 * Math.PI * f1 * t) * 0.25 +
                  Math.sin(2 * Math.PI * f2 * t) * 0.18 +
                  Math.sin(2 * Math.PI * f3 * t) * 0.10;

      // In the tampered version, splice out the critical segment between t=6.0s and t=10.0s (suspect description)
      // replacing it with an artificial flat line / spliced silence and tone
      if (isTampered && t >= 6.0 && t <= 10.0) {
        // Tampered audio: Critical suspect details excised by unauthorized editor
        voice = (Math.random() * 2 - 1) * 0.02 + Math.sin(2 * Math.PI * 440 * t) * 0.03;
      }

      sample = (voice * Math.abs(speechCadence) * 0.75) + hiss;
    }
    // 4. Closing mic release squelch click (duration - 0.6s to duration)
    else {
      sample = (Math.random() * 2 - 1) * 0.3 * Math.exp(-8 * (t - (durationSec - 0.6)));
    }

    // Clamp to 16-bit signed integer [-32768, 32767]
    const clamped = Math.max(-1, Math.min(1, sample));
    const intSample = Math.floor(clamped * 32767);
    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  }

  return buffer;
}

// =========================================================================
// 3. FORENSIC PDF REPORTS - FINDINGS ALTERATION TAMPER
// =========================================================================
function generateForensicPdf(options = {}) {
  const { isTampered = false } = options;

  const findingText = isTampered
    ? "EXAMINATION FINDINGS (ALTERED / TAMPERED):\\nExamination of subterranean entrance reveals NO MECHANICAL BYPASS. Vault lock cylinder shows normal wear with NO SIGNS OF UNAUTHORIZED ENTRY. Safety deposit lockers appear undisturbed. Incident classified as mechanical equipment malfunction.\\n\\nCONCLUSION: NO BREACH CONFIRMED - CASE CLOSED."
    : "EXAMINATION FINDINGS (AUTHENTIC FORENSIC AUDIT):\\nConclusive physical evidence of mechanical cylinder bypass on vault entrance door #02. Security lockboxes #104 through #112 show forced pry marks. Direct bit-stream extraction confirms missing access badge #02 on scene.\\n\\nCONCLUSION: UNAUTHORIZED BREACH CONFIRMED - CRIMINAL EXTRAPOLATION VERIFIED.";

  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>
endobj
4 0 obj
<< /Length ${1800 + findingText.length} >>
stream
0.06 0.09 0.16 rg
36 710 540 45 re f
BT
/F2 15 Tf
1 1 1 rg
50 728 Td
(PROOFSHIELD FORENSIC EXAMINATION & EVIDENCE REPORT) Tj
ET
BT
/F1 8.5 Tf
0.8 0.85 0.9 rg
50 715 Td
(CERTIFIED FORENSIC DIGITAL EVIDENCE RECORD  |  CASE DOSSIER PS-2026-001) Tj
ET

0.96 0.97 0.98 rg
36 575 540 120 re f
0.82 0.85 0.9 rg
1 w
36 575 540 120 re s

BT
/F2 10.5 Tf
0.1 0.15 0.25 rg
50 675 Td
(CASE AND EVIDENCE SPECIFICATIONS) Tj
ET

BT
/F1 9 Tf
0.2 0.25 0.35 rg
50 655 Td
(Case Number:     PS-2026-001) Tj
50 640 Td
(Case Title:      Central Bank Vault Intrusion) Tj
50 625 Td
(Evidence ID:     EV-VAULT-2026-042) Tj
50 610 Td
(Lead Examiner:   Det. Alice Vance, Badge #PS-8841) Tj
50 595 Td
(Review Analyst:  Bob Miller, Forensic Analyst, EnCE) Tj
ET

BT
/F1 9 Tf
0.2 0.25 0.35 rg
310 655 Td
(Acquisition Date:   2026-11-12 19:48:00 UTC) Tj
310 640 Td
(Laboratory Unit:    Cyber Forensics Field Unit 04) Tj
310 625 Td
(Chain of Custody:   Registered On-Chain) Tj
310 610 Td
(Evidence Type:      Physical & Digital Forensic Report) Tj
310 595 Td
(Statutory Standard: ISO/IEC 27037 & BSA Sec 63) Tj
ET

BT
/F2 11 Tf
0.1 0.15 0.25 rg
50 535 Td
(EXAMINATION METHODOLOGY & PROCEDURES) Tj
ET

BT
/F1 9 Tf
0.25 0.3 0.4 rg
50 515 Td
(1. Physical scene preservation with certified metric photogrammetry.) Tj
50 500 Td
(2. Direct bit-stream acquisition using hardware write-blocker Tableau T8u.) Tj
50 485 Td
(3. Cryptographic SHA-256 fingerprint generation and Ethereum smart contract commitment.) Tj
50 470 Td
(4. Dual-custodian physical transfer verification under statutory ISO/IEC 27037 protocol.) Tj
ET

${isTampered ? "0.98 0.9 0.9 rg\n36 330 540 115 re f\n0.8 0.2 0.2 rg\n1.5 w\n36 330 540 115 re s" : "0.93 0.97 0.94 rg\n36 330 540 115 re f\n0.15 0.55 0.3 rg\n1.5 w\n36 330 540 115 re s"}

BT
/F2 11 Tf
${isTampered ? "0.7 0.1 0.1 rg" : "0.08 0.4 0.2 rg"}
50 422 Td
(${isTampered ? "EXAMINATION FINDINGS -- [UNAUTHORIZED ALTERATION DETECTED]" : "EXAMINATION FINDINGS & FORENSIC CERTIFICATION"}) Tj
ET

BT
/F1 9 Tf
0.15 0.2 0.25 rg
50 400 Td
(${isTampered ? "Physical entrance examination reveals NO MECHANICAL LOCK BYPASS." : "Conclusive physical evidence of mechanical cylinder bypass on vault door #02."}) Tj
50 385 Td
(${isTampered ? "Safety deposit lockers appear undisturbed. Lock cylinder shows normal wear." : "Deposit lockers #104 through #112 forced open. Access badge #02 missing from scene."}) Tj
50 370 Td
(${isTampered ? "Incident reclassified as equipment malfunction. Case recommended for closure." : "Bit-stream extraction corroborates on-scene intrusion. Full custody chain active."}) Tj
50 350 Td
(${isTampered ? "CONCLUSION: NO BREACH RECORDED -- ZERO TAMPER IDENTIFIED." : "CONCLUSION: UNAUTHORIZED INTRUSION CONFIRMED -- CRIMINAL CHARGES FILED."}) Tj
ET

BT
/F1 8 Tf
0.5 0.55 0.6 rg
50 280 Td
(DEMONSTRATION RECORD: This document is generated for judicial integrity demonstration in ProofShield.) Tj
50 268 Td
(Cryptographic verification must be executed against registered Ethereum blockchain digest.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000002200 00000 n 
0000002275 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
2355
%%EOF`;

  return Buffer.from(pdfContent, 'utf8');
}

// =========================================================================
// MAIN GENERATION & INTEGRATION FUNCTION
// =========================================================================
function generateAllPhase3Media() {
  console.log("==================================================================");
  console.log("GENERATING COMPLETE PHASE 3 EVIDENCE ECOSYSTEM (4 CATEGORIES)");
  console.log("==================================================================\n");

  const manifestEntries = [];

  // -------------------------------------------------------------
  // Category 1: CCTV Surveillance Video (Preserve user videos!)
  // -------------------------------------------------------------
  console.log("1. Checking CCTV Surveillance Video Pair...");
  const cctvOrigPath = path.join(DEMO_DIR, "evidence_cctv.mp4");
  const cctvTampPath = path.join(DEMO_DIR, "evidence_cctv_tampered.mp4");

  if (!fs.existsSync(cctvOrigPath) || !fs.existsSync(cctvTampPath)) {
    throw new Error("CCTV video files missing from demo_files directory!");
  }

  const cctvOrigBuf = fs.readFileSync(cctvOrigPath);
  const cctvTampBuf = fs.readFileSync(cctvTampPath);
  const cctvOrigHash = computeHash(cctvOrigBuf);
  const cctvTampHash = computeHash(cctvTampBuf);

  console.log(`  ✓ Original CCTV Video: ${cctvOrigBuf.length} bytes | SHA-256: ${cctvOrigHash}`);
  console.log(`  ✓ Tampered CCTV Video: ${cctvTampBuf.length} bytes | SHA-256: ${cctvTampHash}`);

  // Copy to IPFS
  fs.writeFileSync(path.join(IPFS_DIR, "QmXvideo001"), cctvOrigBuf);
  fs.writeFileSync(path.join(IPFS_DIR, "QmXvideo001-tampered"), cctvTampBuf);

  manifestEntries.push({
    filename: "evidence_cctv.mp4",
    size: cctvOrigBuf.length,
    mimeType: "video/mp4",
    sha256: cctvOrigHash,
    classification: "ORIGINAL",
    category: "CCTV Surveillance Video",
    ipfsCid: "QmXvideo001",
    description: "Authentic surveillance video recording of central vault entrance with timecode."
  });
  manifestEntries.push({
    filename: "evidence_cctv_tampered.mp4",
    size: cctvTampBuf.length,
    mimeType: "video/mp4",
    sha256: cctvTampHash,
    classification: "TAMPERED",
    category: "CCTV Surveillance Video",
    ipfsCid: "QmXvideo001-tampered",
    description: "Tampered surveillance video with intruder/object removed from frame."
  });

  // -------------------------------------------------------------
  // Category 2: Crime Scene Photograph
  // -------------------------------------------------------------
  console.log("\n2. Generating Crime Scene Photograph Pair (Object Removal Tamper)...");
  const photoOrigBuf = renderCrimeScenePhoto({ includeAccessBadge: true });
  const photoTampBuf = renderCrimeScenePhoto({ includeAccessBadge: false });

  const photoOrigPath = path.join(DEMO_DIR, "crime_scene_photo.jpg");
  const photoTampPath = path.join(DEMO_DIR, "crime_scene_photo_tampered.jpg");
  fs.writeFileSync(photoOrigPath, photoOrigBuf);
  fs.writeFileSync(photoTampPath, photoTampBuf);

  // Copy to IPFS
  fs.writeFileSync(path.join(IPFS_DIR, "QmWimage004"), photoOrigBuf);
  fs.writeFileSync(path.join(IPFS_DIR, "QmWimage004-tampered"), photoTampBuf);

  const photoOrigHash = computeHash(photoOrigBuf);
  const photoTampHash = computeHash(photoTampBuf);

  console.log(`  ✓ Original Photo (1280x720, Badge & Tent #02 Present): ${photoOrigBuf.length} bytes | SHA-256: ${photoOrigHash}`);
  console.log(`  ✓ Tampered Photo (1280x720, Badge & Tent #02 Removed): ${photoTampBuf.length} bytes | SHA-256: ${photoTampHash}`);

  manifestEntries.push({
    filename: "crime_scene_photo.jpg",
    size: photoOrigBuf.length,
    mimeType: "image/jpeg",
    sha256: photoOrigHash,
    classification: "ORIGINAL",
    category: "Crime Scene Photography",
    ipfsCid: "QmWimage004",
    description: "Forensic photo of vault corridor with chalk outline, Marker #01 (USB Drive), and Marker #02 (Access Badge)."
  });
  manifestEntries.push({
    filename: "crime_scene_photo_tampered.jpg",
    size: photoTampBuf.length,
    mimeType: "image/jpeg",
    sha256: photoTampHash,
    classification: "TAMPERED",
    category: "Crime Scene Photography",
    ipfsCid: "QmWimage004-tampered",
    description: "Tampered photo with Evidence Marker #02 and Access Badge digitally erased."
  });

  // -------------------------------------------------------------
  // Category 3: Emergency Audio Recording
  // -------------------------------------------------------------
  console.log("\n3. Generating Emergency Audio Recording Pair (Dispatch Splicing)...");
  const audioOrigBuf = generateDispatchWav({ isTampered: false });
  const audioTampBuf = generateDispatchWav({ isTampered: true });

  const audioOrigPath = path.join(DEMO_DIR, "dispatch_call.wav");
  const audioTampPath = path.join(DEMO_DIR, "dispatch_call_tampered.wav");
  fs.writeFileSync(audioOrigPath, audioOrigBuf);
  fs.writeFileSync(audioTampPath, audioTampBuf);

  // Copy to IPFS
  fs.writeFileSync(path.join(IPFS_DIR, "QmZaudio003"), audioOrigBuf);
  fs.writeFileSync(path.join(IPFS_DIR, "QmZaudio003-tampered"), audioTampBuf);

  const audioOrigHash = computeHash(audioOrigBuf);
  const audioTampHash = computeHash(audioTampBuf);

  console.log(`  ✓ Original Dispatch Audio (16 kHz PCM WAV, Full Report): ${audioOrigBuf.length} bytes | SHA-256: ${audioOrigHash}`);
  console.log(`  ✓ Tampered Dispatch Audio (16 kHz PCM WAV, Critical Statement Excised): ${audioTampBuf.length} bytes | SHA-256: ${audioTampHash}`);

  manifestEntries.push({
    filename: "dispatch_call.wav",
    size: audioOrigBuf.length,
    mimeType: "audio/wav",
    sha256: audioOrigHash,
    classification: "ORIGINAL",
    category: "Emergency Audio Recording",
    ipfsCid: "QmZaudio003",
    description: "Emergency 911 dispatch radio transmission reporting two vault intrusion suspects fleeing with lockboxes."
  });
  manifestEntries.push({
    filename: "dispatch_call_tampered.wav",
    size: audioTampBuf.length,
    mimeType: "audio/wav",
    sha256: audioTampHash,
    classification: "TAMPERED",
    category: "Emergency Audio Recording",
    ipfsCid: "QmZaudio003-tampered",
    description: "Tampered dispatch audio with suspect description spliced out."
  });

  // -------------------------------------------------------------
  // Category 4: Forensic PDF Report
  // -------------------------------------------------------------
  console.log("\n4. Generating Forensic PDF Report Pair (Findings Alteration)...");
  const pdfOrigBuf = generateForensicPdf({ isTampered: false });
  const pdfTampBuf = generateForensicPdf({ isTampered: true });

  const pdfOrigPath = path.join(DEMO_DIR, "forensic_report.pdf");
  const pdfTampPath = path.join(DEMO_DIR, "forensic_report_tampered.pdf");
  fs.writeFileSync(pdfOrigPath, pdfOrigBuf);
  fs.writeFileSync(pdfTampPath, pdfTampBuf);

  // Copy to IPFS
  fs.writeFileSync(path.join(IPFS_DIR, "QmYpdf002"), pdfOrigBuf);
  fs.writeFileSync(path.join(IPFS_DIR, "QmYpdf002-tampered"), pdfTampBuf);

  const pdfOrigHash = computeHash(pdfOrigBuf);
  const pdfTampHash = computeHash(pdfTampBuf);

  console.log(`  ✓ Original Forensic PDF (Breach Confirmed): ${pdfOrigBuf.length} bytes | SHA-256: ${pdfOrigHash}`);
  console.log(`  ✓ Tampered Forensic PDF (Altered to 'No Breach'): ${pdfTampBuf.length} bytes | SHA-256: ${pdfTampHash}`);

  manifestEntries.push({
    filename: "forensic_report.pdf",
    size: pdfOrigBuf.length,
    mimeType: "application/pdf",
    sha256: pdfOrigHash,
    classification: "ORIGINAL",
    category: "Forensic PDF Report",
    ipfsCid: "QmYpdf002",
    description: "Signed preliminary examination report confirming mechanical lock bypass and forced locker extraction."
  });
  manifestEntries.push({
    filename: "forensic_report_tampered.pdf",
    size: pdfTampBuf.length,
    mimeType: "application/pdf",
    sha256: pdfTampHash,
    classification: "TAMPERED",
    category: "Forensic PDF Report",
    ipfsCid: "QmYpdf002-tampered",
    description: "Tampered report with conclusion modified to falsely claim 'no breach observed / equipment malfunction'."
  });

  // -------------------------------------------------------------
  // Part 3: Write sha256_manifest.txt and asset_provenance.txt
  // -------------------------------------------------------------
  console.log("\n5. Writing sha256_manifest.txt and asset_provenance.txt...");
  
  let manifestText = "========================================================================================\n";
  manifestText += "PROOFSHIELD FORENSIC EVIDENCE MANIFEST & SHA-256 CHECKSUM REGISTRY\n";
  manifestText += "Generated: " + new Date().toISOString() + "\n";
  manifestText += "Standard: NIST FIPS 180-4 (Secure Hash Standard) | ISO/IEC 27037 Evidence Handling\n";
  manifestText += "========================================================================================\n\n";

  manifestEntries.forEach((entry, idx) => {
    manifestText += `[ASSET #${idx + 1}] ${entry.filename}\n`;
    manifestText += `  Classification : ${entry.classification}\n`;
    manifestText += `  Category       : ${entry.category}\n`;
    manifestText += `  MIME Type      : ${entry.mimeType}\n`;
    manifestText += `  File Size      : ${entry.size} bytes (${(entry.size / 1024).toFixed(2)} KB)\n`;
    manifestText += `  IPFS CID Mount : ${entry.ipfsCid}\n`;
    manifestText += `  SHA-256 Digest : ${entry.sha256}\n`;
    manifestText += `  Description    : ${entry.description}\n\n`;
  });

  fs.writeFileSync(path.join(DEMO_DIR, "sha256_manifest.txt"), manifestText, "utf8");
  console.log("  ✓ Saved backend/uploads/demo_files/sha256_manifest.txt");

  const provenanceText = `========================================================================================
PROOFSHIELD DEMONSTRATION ASSET PROVENANCE & METHODOLOGY SPECIFICATION
========================================================================================

NOTICE & CLASSIFICATION:
All files contained within this repository are explicitly designated as STAGED DEMONSTRATION
DATA prepared for controlled forensic integrity verification and blockchain tamper detection testing.
No private personal data, confidential case material, or live criminal investigation records
are utilized.

ASSET DESCRIPTIONS & FORENSIC TAMPER METHODOLOGIES:

1. CCTV Surveillance Video:
   - Original  (evidence_cctv.mp4): Authentic 7.29 MB H.264 video feed of the central vault entrance.
   - Tampered  (evidence_cctv_tampered.mp4): 2.90 MB video exhibit where an object has been digitally removed.
   - Mechanism : Byte-level divergence in compressed payload bitstream.

2. Crime Scene Photography:
   - Original  (crime_scene_photo.jpg): 1280x720 JPEG photograph of vault corridor floor with chalk outline,
                 Evidence Marker #01 (Black USB Drive), and Evidence Marker #02 (White RFID Access Badge).
   - Tampered  (crime_scene_photo_tampered.jpg): 1280x720 JPEG photograph where Evidence Marker #02 and the
                 Access Badge have been digitally in-painted and erased, concealing the suspect's badge on scene.
   - Mechanism : Matrix pixel alteration while strictly preserving canvas dimensions (1280x720) and perspective.

3. Emergency Audio Recording:
   - Original  (dispatch_call.wav): 16-bit PCM WAV (16,000 Hz, Mono, 18 sec) public safety radio transmission
                 with alert tones, speech cadence, and squelch, reporting 2 fleeing suspects with lockboxes.
   - Tampered  (dispatch_call_tampered.wav): 16-bit PCM WAV where the critical spoken segment (suspect description)
                 has been spliced and excised, altering judicial testimony.
   - Mechanism : Temporal waveform sample substitution producing cryptographic hash divergence.

4. Forensic Laboratory Examination Report:
   - Original  (forensic_report.pdf): Valid PDF-1.4 document with ProofShield institutional formatting,
                 confirming physical lock cylinder bypass and forced locker extraction.
   - Tampered  (forensic_report_tampered.pdf): Valid PDF-1.4 where findings were altered to falsely state
                 "no unauthorized entry / equipment malfunction" to compromise prosecution.
   - Mechanism : Text stream alteration leading to byte mismatch.

GOVERNING LEGAL STANDARDS:
- Bharatiya Sakshya Adhiniyam, 2023 (BSA Sections 61, 62 & 63): Admissibility of electronic records.
- Federal Rules of Evidence (FRE Rule 902(13)/(14)): Certified records generated by an electronic process.
- ISO/IEC 27037: Guidelines for identification, collection, acquisition, and preservation of digital evidence.
`;

  fs.writeFileSync(path.join(DEMO_DIR, "asset_provenance.txt"), provenanceText, "utf8");
  console.log("  ✓ Saved backend/uploads/demo_files/asset_provenance.txt");

  // Sync to IPFS _manifest.json
  const ipfsManifest = {};
  manifestEntries.forEach(e => {
    ipfsManifest[e.ipfsCid] = { hash: e.sha256, size: e.size };
  });
  fs.writeFileSync(path.join(IPFS_DIR, "_manifest.json"), JSON.stringify(ipfsManifest, null, 2), "utf8");
  console.log("  ✓ Updated backend/uploads/ipfs_mock/_manifest.json");

  console.log("\nAll Phase 3 demonstration assets generated and synchronized successfully!");
  return manifestEntries;
}

if (require.main === module) {
  try {
    generateAllPhase3Media();
  } catch (err) {
    console.error("Fatal error generating media:", err);
    process.exit(1);
  }
}

module.exports = { generateAllPhase3Media };
