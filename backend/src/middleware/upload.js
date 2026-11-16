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
  // Video formats
  "video/mp4",
  "video/webm",
  "video/quicktime", // MOV
  "video/x-msvideo", // AVI
  "video/x-matroska", // MKV
  "video/mpeg",
  "video/ogg",
  "video/3gpp",

  // Audio formats
  "audio/mpeg", // MP3
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/webm",
  "audio/ogg",
  "audio/aac",
  "audio/mp4",
  "audio/x-m4a",
  "audio/flac",

  // Image formats
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",

  // Document & Data formats
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
  "application/msword", // DOC
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // DOCX
];

const extMap = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  ".mpeg": "video/mpeg",
  ".mpg": "video/mpeg",
  ".ogv": "video/ogg",
  ".3gp": "video/3gpp",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".oga": "audio/ogg",
  ".aac": "audio/aac",
  ".m4a": "audio/x-m4a",
  ".flac": "audio/flac",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".json": "application/json",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

const fileFilter = (req, file, cb) => {
  let mime = file.mimetype;
  const ext = path.extname(file.originalname || "").toLowerCase();

  // If MIME is generic, undefined, or needs extension corroboration
  if (!mime || mime === "application/octet-stream" || mime === "binary/octet-stream") {
    if (extMap[ext]) {
      mime = extMap[ext];
      file.mimetype = mime;
    }
  }

  // Also verify extension matches allowed types if MIME is allowed
  if (allowedMimeTypes.includes(mime) || extMap[ext]) {
    if (!allowedMimeTypes.includes(mime) && extMap[ext]) {
      file.mimetype = extMap[ext];
    }
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype || ext}. Supported types: MP4, WebM, MOV, AVI, MKV, MP3, WAV, JPG, PNG, WEBP, PDF, TXT, DOC, DOCX.`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 250 * 1024 * 1024 // 250 MB max limit for video & forensic exhibits
  },
  fileFilter: fileFilter
});

module.exports = upload;
