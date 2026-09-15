const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function getFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);

  return crypto
    .createHash("sha256")
    .update(fileBuffer)
    .digest("hex");
}

function getAllFiles(folderPath) {
  const entries = fs.readdirSync(folderPath, {
    withFileTypes: true
  });

  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(
      folderPath,
      entry.name
    );

    if (entry.isFile()) {
      files.push(entryPath);
    } else if (entry.isDirectory()) {
      files.push(...getAllFiles(entryPath));
    }
  }

  return files;
}

function findDuplicates(folderPath) {
  const filePaths = getAllFiles(folderPath);
  const hashGroups = new Map();

  for (const filePath of filePaths) {
    try {
      const stats = fs.statSync(filePath);
      const hash = getFileHash(filePath);

      if (!hashGroups.has(hash)) {
        hashGroups.set(hash, []);
      }

      hashGroups.get(hash).push({
        name: path.basename(filePath),
        path: filePath,
        size: stats.size
      });

    } catch (error) {
      console.error(
        `Could not check ${filePath}:`,
        error
      );
    }
  }

  return Array.from(hashGroups.values())
    .filter(group => group.length > 1);
}

module.exports = {
  findDuplicates
};