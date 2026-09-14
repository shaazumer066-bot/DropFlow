const fs = require("fs");
const path = require("path");

const CATEGORY_MAP = {
  Documents: [".pdf", ".doc", ".docx", ".txt", ".ppt", ".pptx", ".xls", ".xlsx"],
  Images: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  Videos: [".mp4", ".mkv", ".avi", ".mov", ".webm"],
  Archives: [".zip", ".rar", ".7z", ".tar", ".gz"],
  Installers: [".exe", ".msi"]
};

const CATEGORY_FOLDERS = [
  "Documents",
  "Images",
  "Videos",
  "Archives",
  "Installers",
  "Other"
];

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
  const files = [];

  function scanDirectory(currentPath) {
    const entries = fs.readdirSync(currentPath, {
      withFileTypes: true
    });

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        scanDirectory(entryPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const extension = path.extname(entry.name);
      const stats = fs.statSync(entryPath);

      const relativePath = path.relative(
        folderPath,
        entryPath
      );

      const pathParts = relativePath.split(path.sep);

      const parentFolder =
        pathParts.length > 1
          ? pathParts[0]
          : null;

      const detectedCategory =
        getFileCategory(extension);

      const alreadyOrganized =
        parentFolder &&
        CATEGORY_FOLDERS.includes(parentFolder) &&
        parentFolder === detectedCategory;

      files.push({
        name: entry.name,
        path: entryPath,
        extension: extension || "File",
        category: detectedCategory,
        size: formatFileSize(stats.size),
        parentFolder,
        alreadyOrganized
      });
    }
  }

  scanDirectory(folderPath);

  return files;
}

module.exports = {
  scanFolder
};