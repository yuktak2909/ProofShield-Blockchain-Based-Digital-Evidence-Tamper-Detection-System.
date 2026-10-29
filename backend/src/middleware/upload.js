const multer = require("multer");
const path = require("path");
const fs = require("fs");

const tempDir = path.join(__dirname, "../../uploads/temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Generate unique safe filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

// File validation
const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "video/mp4",
  "video/quicktime", // MOV
  "video/x-msvideo", // AVI
  "audio/mpeg", // MP3
  "audio/wav",
  "audio/x-wav",
  "application/pdf",
  "text/plain",
  "application/msword", // DOC
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // DOCX
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types include JPG, PNG, MP4, MOV, AVI, MP3, WAV, PDF, TXT, DOC, DOCX`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB max limit
  },
  fileFilter: fileFilter
});

module.exports = upload;
