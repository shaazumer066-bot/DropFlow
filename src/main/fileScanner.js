const fs = require("fs");
const path = require("path");

const CATEGORY_MAP = {
  Documents: [".pdf", ".doc", ".docx", ".txt", ".ppt", ".pptx", ".xls", ".xlsx"],
  Images: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  Videos: [".mp4", ".mkv", ".avi", ".mov", ".webm"],
  Archives: [".zip", ".rar", ".7z", ".tar", ".gz"],
  Installers: [".exe", ".msi"]
};

function getFileCategory(extension) {
  const ext = extension.toLowerCase();

  for (const [category, extensions] of Object.entries(CATEGORY_MAP)) {
    if (extensions.includes(ext)) {
      return category;
    }
  }

  return "Other";
}

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function scanFolder(folderPath) {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });

  return entries
    .filter(entry => entry.isFile())
    .map(entry => {
      const filePath = path.join(folderPath, entry.name);
      const extension = path.extname(entry.name);
      const stats = fs.statSync(filePath);

      return {
        name: entry.name,
        path: filePath,
        extension: extension || "File",
        category: getFileCategory(extension),
        size: formatFileSize(stats.size)
      };
    });
}

module.exports = {
  scanFolder
};