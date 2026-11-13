/**
 * generate-demo-media.js
 * Generates realistic forensic crime scene media using node-canvas and ffmpeg-static:
 * 1. crime_scene_photo.jpg - High-res forensic crime scene photo with evidence markers & tape
 * 2. crime_scene_photo_tampered.jpg - Tampered copy with altered pixel checksum
 * 3. evidence_cctv.mp4 - Real H.264 MP4 surveillance recording of crime scene with timecode & REC
 * 4. evidence_cctv_tampered.mp4 - Tampered CCTV video with altered frame
 * 5. Syncs everything to backend/uploads/ipfs_mock/ with deterministic CIDs
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createCanvas } = require('canvas');
const ffmpegPath = require('ffmpeg-static');
const { execFileSync } = require('child_process');

const DEMO_DIR = path.join(__dirname, '..', '..', 'uploads', 'demo_files');
const IPFS_DIR = path.join(__dirname, '..', '..', 'uploads', 'ipfs_mock');
const TEMP_DIR = path.join(__dirname, '..', '..', 'uploads', 'temp_frames');

[DEMO_DIR, IPFS_DIR, TEMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// =========================================================================
// 1. GENERATE FORENSIC CRIME SCENE PHOTOGRAPH (JPEG)
// =========================================================================
function renderCrimeScene(ctx, width, height, options = {}) {
  const { isNightVision = false, timeString = "03:47:19.42", frameIndex = 0 } = options;

  // Background - concrete / floor tiles
  const floorGrad = ctx.createLinearGradient(0, height * 0.35, 0, height);
  if (isNightVision) {
    floorGrad.addColorStop(0, '#0c1a10');
    floorGrad.addColorStop(1, '#051008');
  } else {
    floorGrad.addColorStop(0, '#2d3748');
    floorGrad.addColorStop(1, '#1a202c');
  }
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, 0, width, height);

  // Perspective hallway / wall
  const wallGrad = ctx.createLinearGradient(0, 0, 0, height * 0.45);
  if (isNightVision) {
    wallGrad.addColorStop(0, '#040d06');
    wallGrad.addColorStop(1, '#0c1f12');
  } else {
    wallGrad.addColorStop(0, '#111827');
    wallGrad.addColorStop(1, '#1f2937');
  }
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, width, height * 0.45);

  // Perspective floor grid lines
  ctx.strokeStyle = isNightVision ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.08)';
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

  // Vault Door / Entrance in background
  ctx.fillStyle = isNightVision ? '#061a0c' : '#0f172a';
  ctx.fillRect(width * 0.38, height * 0.12, width * 0.24, height * 0.33);
  ctx.strokeStyle = isNightVision ? '#15803d' : '#475569';
  ctx.lineWidth = 3;
  ctx.strokeRect(width * 0.38, height * 0.12, width * 0.24, height * 0.33);

  // Door lock wheel
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.28, 28, 0, Math.PI * 2);
  ctx.fillStyle = isNightVision ? '#0a2312' : '#334155';
  ctx.fill();
  ctx.stroke();

  // Forensic Chalk Outline of Victim / Intruder on floor
  const cx = width * 0.48;
  const cy = height * 0.65;
  ctx.strokeStyle = isNightVision ? '#86efac' : '#f1f5f9';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  // Head
  ctx.arc(cx - 60, cy - 40, 24, 0, Math.PI * 2);
  // Torso
  ctx.moveTo(cx - 36, cy - 35);
  ctx.lineTo(cx + 80, cy - 10);
  ctx.lineTo(cx + 70, cy + 30);
  ctx.lineTo(cx - 40, cy + 10);
  ctx.closePath();
  // Arms
  ctx.moveTo(cx - 30, cy - 30);
  ctx.lineTo(cx - 70, cy - 80);
  ctx.lineTo(cx - 95, cy - 70);
  ctx.moveTo(cx + 10, cy + 20);
  ctx.lineTo(cx + 40, cy + 70);
  // Legs
  ctx.moveTo(cx + 75, cy - 10);
  ctx.lineTo(cx + 160, cy + 20);
  ctx.lineTo(cx + 155, cy + 35);
  ctx.moveTo(cx + 70, cy + 30);
  ctx.lineTo(cx + 130, cy + 90);
  ctx.stroke();

  // Evidence Markers (Yellow tent cards with black numbers)
  const markers = [
    { x: cx - 120, y: cy - 70, label: "01" }, // weapon / tool
    { x: cx + 180, y: cy + 30, label: "02" }, // footwear impression
    { x: cx + 15, y: cy + 85, label: "03" },  // dropped keycard
    { x: width * 0.25, y: height * 0.55, label: "04" } // broken lock pry mark
  ];

  markers.forEach(m => {
    // Marker tent shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(m.x + 8, m.y + 26, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Yellow Tent
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(m.x - 18, m.y + 24);
    ctx.lineTo(m.x, m.y - 12);
    ctx.lineTo(m.x + 18, m.y + 24);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Black text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(m.label, m.x, m.y + 10);
  });

  // Dropped evidence items
  // Evidence 01: Flash drive / tool
  ctx.fillStyle = '#000000';
  ctx.fillRect(cx - 105, cy - 65, 22, 10);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(cx - 83, cy - 63, 6, 6);

  // Evidence 03: High security badge
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx + 25, cy + 85, 20, 30);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(cx + 27, cy + 87, 16, 6);

  // Crime Scene Barrier Tape (Yellow & Black stripes, angled across frame)
  ctx.save();
  ctx.translate(0, height * 0.48);
  ctx.rotate(-0.06);

  // Tape strip shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(-50, 4, width + 100, 36);

  // Yellow tape
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-50, 0, width + 100, 36);

  // Black repeating stripes & text
  ctx.fillStyle = '#000000';
  ctx.font = '900 16px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let x = -30; x < width + 60; x += 220) {
    ctx.fillText("POLICE LINE DO NOT CROSS", x, 18);
    // diagonal caution stripes
    ctx.beginPath();
    ctx.moveTo(x + 180, 0);
    ctx.lineTo(x + 195, 0);
    ctx.lineTo(x + 175, 36);
    ctx.lineTo(x + 160, 36);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Forensic Metric Reference Scale (Bottom Right)
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

  // CCTV HUD Overlay Elements
  if (isNightVision) {
    // Green night vision noise / tint
    ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
    ctx.fillRect(0, 0, width, height);

    // Scan lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Top Header Banner
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText("FED-SURVEILLANCE // NODE 04 // EVIDENCE RECOVERY VAULT", 30, 35);
    ctx.textAlign = 'right';
    ctx.fillText(`UTC: 2026-11-12 ${timeString}`, width - 30, 35);

    // Blinking REC Indicator
    if (frameIndex % 2 === 0) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(width - 240, 30, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText("REC [LIVE]", width - 225, 35);
    }

    // Bottom Status Banner
    ctx.fillStyle = '#22c55e';
    ctx.font = '13px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText("FPS: 30.0 | ISO: 3200 | SENSOR: IR-NIGHT | RES: 1280x720", 30, height - 25);
    ctx.textAlign = 'right';
    ctx.fillText("CHAIN OF CUSTODY SEAL: ACTIVE", width - 30, height - 25);
  } else {
    // Normal Forensic Still Photo Stamp
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(20, height - 70, 380, 50);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, height - 70, 380, 50);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText("EVIDENCE RECOVERY PHOTOGRAPHY // PRIMARY ITEM #04", 32, height - 50);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Arial';
    ctx.fillText(`CASE: PS-2026-001 | DATE: 2026-11-12 ${timeString} UTC`, 32, height - 32);
  }
}

async function generateCrimeScenePhotos() {
  console.log('Generating realistic forensic crime scene photo (1280x720)...');
  const width = 1280;
  const height = 720;

  // 1. Original authentic crime scene photo
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  renderCrimeScene(ctx, width, height, { isNightVision: false, timeString: "03:47:19.42" });
  const photoBuf = canvas.toBuffer('image/jpeg', { quality: 0.92 });
  const photoPath = path.join(DEMO_DIR, 'crime_scene_photo.jpg');
  fs.writeFileSync(photoPath, photoBuf);
  console.log(`✓ Saved original photo: ${photoPath} (${photoBuf.length} bytes)`);

  // 2. Tampered crime scene photo (altered timestamp, modified evidence tag)
  const canvasTampered = createCanvas(width, height);
  const ctxTampered = canvasTampered.getContext('2d');
  renderCrimeScene(ctxTampered, width, height, { isNightVision: false, timeString: "04:12:00.00" });
  // Draw an altered spray mark over evidence marker 02
  ctxTampered.fillStyle = '#ef4444';
  ctxTampered.font = 'bold 24px Arial';
  ctxTampered.fillText("TAMPERED", width * 0.48 + 140, height * 0.65 + 10);

  const tamperedPhotoBuf = canvasTampered.toBuffer('image/jpeg', { quality: 0.92 });
  const tamperedPhotoPath = path.join(DEMO_DIR, 'crime_scene_photo_tampered.jpg');
  fs.writeFileSync(tamperedPhotoPath, tamperedPhotoBuf);
  console.log(`✓ Saved tampered photo: ${tamperedPhotoPath} (${tamperedPhotoBuf.length} bytes)`);
}

// =========================================================================
// 2. GENERATE REAL CCTV SURVEILLANCE VIDEO (H.264 MP4 via FFMPEG)
// =========================================================================
async function generateCctvVideo() {
  console.log('\nGenerating real CCTV surveillance MP4 video (H.264/AAC, 1280x720, 3 seconds)...');
  const width = 1280;
  const height = 720;
  const fps = 10;
  const durationSec = 3;
  const totalFrames = fps * durationSec;

  // Clear temp frames
  const existingFrames = fs.readdirSync(TEMP_DIR);
  existingFrames.forEach(f => fs.unlinkSync(path.join(TEMP_DIR, f)));

  console.log(`Rendering ${totalFrames} CCTV frames...`);
  for (let i = 0; i < totalFrames; i++) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const sec = Math.floor(i / fps);
    const ms = Math.floor((i % fps) * (100 / fps));
    const timeStr = `03:47:${String(19 + sec).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;

    renderCrimeScene(ctx, width, height, {
      isNightVision: true,
      timeString: timeStr,
      frameIndex: i
    });

    const frameFile = path.join(TEMP_DIR, `frame_${String(i).padStart(4, '0')}.jpg`);
    fs.writeFileSync(frameFile, canvas.toBuffer('image/jpeg', { quality: 0.85 }));
  }

  const mp4Path = path.join(DEMO_DIR, 'evidence_cctv.mp4');
  console.log('Encoding MP4 using ffmpeg with H.264 video codec...');

  // ffmpeg -y -framerate 10 -i temp_frames/frame_%04d.jpg -c:v libx264 -pix_fmt yuv420p -movflags +faststart evidence_cctv.mp4
  execFileSync(ffmpegPath, [
    '-y',
    '-framerate', String(fps),
    '-i', path.join(TEMP_DIR, 'frame_%04d.jpg'),
    '-c:v', 'libx264',
    '-profile:v', 'baseline',
    '-level', '3.0',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    mp4Path
  ]);

  const mp4Stat = fs.statSync(mp4Path);
  console.log(`✓ Saved authentic CCTV video: ${mp4Path} (${mp4Stat.size} bytes)`);

  // Generate tampered version (altered video content)
  const tamperedMp4Path = path.join(DEMO_DIR, 'evidence_cctv_tampered.mp4');
  // Copy authentic video and modify payload bytes to simulate subtle forensic tamper
  const vidData = fs.readFileSync(mp4Path);
  const tamperedVidData = Buffer.from(vidData);
  tamperedVidData[Math.floor(tamperedVidData.length * 0.7)] ^= 0xff; // Flip bits in payload
  fs.writeFileSync(tamperedMp4Path, tamperedVidData);
  console.log(`✓ Saved tampered CCTV video: ${tamperedMp4Path} (${tamperedVidData.length} bytes)`);

  // Cleanup temp frames
  fs.readdirSync(TEMP_DIR).forEach(f => fs.unlinkSync(path.join(TEMP_DIR, f)));
  fs.rmdirSync(TEMP_DIR);
}

// =========================================================================
// 3. SYNC TO MOCK IPFS GATEWAY DIRECTORY
// =========================================================================
function syncToIpfsMock() {
  console.log('\nSyncing all demo files to mock IPFS storage (/uploads/ipfs_mock)...');

  const fileMappings = [
    { src: 'evidence_cctv.mp4', cid: 'QmXvideo001' },
    { src: 'forensic_report.pdf', cid: 'QmYpdf002' },
    { src: 'dispatch_call.wav', cid: 'QmZaudio003' },
    { src: 'crime_scene_photo.jpg', cid: 'QmWimage004' },
    { src: 'evidence_cctv_tampered.mp4', cid: 'QmXvideo001-tampered' },
    { src: 'forensic_report_tampered.pdf', cid: 'QmYpdf002-tampered' },
    { src: 'dispatch_call_tampered.wav', cid: 'QmZaudio003-tampered' },
    { src: 'crime_scene_photo_tampered.jpg', cid: 'QmWimage004-tampered' },
  ];

  const results = {};

  fileMappings.forEach(({ src, cid }) => {
    const srcPath = path.join(DEMO_DIR, src);
    const destPath = path.join(IPFS_DIR, cid);
    if (fs.existsSync(srcPath)) {
      const data = fs.readFileSync(srcPath);
      fs.writeFileSync(destPath, data);
      const sha256 = crypto.createHash('sha256').update(data).digest('hex');
      results[src] = { cid, size: data.length, sha256 };
      console.log(`  ✓ ${cid} <- ${src} (${data.length} bytes, sha256: ${sha256.substring(0, 16)}...)`);
    } else {
      console.warn(`  ! Missing source file: ${srcPath}`);
    }
  });

  return results;
}

async function main() {
  try {
    await generateCrimeScenePhotos();
    await generateCctvVideo();
    const hashes = syncToIpfsMock();
    console.log('\n======================================================');
    console.log('DEMO MEDIA GENERATION COMPLETED SUCCESSFULLY!');
    console.log('======================================================');
  } catch (err) {
    console.error('Fatal error during media generation:', err);
    process.exit(1);
  }
}

main();
