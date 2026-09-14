const fs = require("fs");
const path = require("path");

function createOrganizationPlan(files, folderPath) {
  return files.map(file => {
    const destinationFolder = path.join(
      folderPath,
      file.category
    );

    const destinationPath = path.join(
      destinationFolder,
      file.name
    );

    let status = "ready";

    if (file.alreadyOrganized) {
      status = "organized";
    } else if (file.parentFolder) {
      status = "misplaced";
    }

    return {
      name: file.name,
      category: file.category,
      sourcePath: file.path,
      destinationFolder,
      destinationPath,
      size: file.size,
      parentFolder: file.parentFolder,
      alreadyOrganized: file.alreadyOrganized,
      status
    };
  });
}

function createCategoryFolders(folderPath) {
  const categories = [
    "Documents",
    "Images",
    "Videos",
    "Archives",
    "Installers",
    "Other"
  ];

  const createdFolders = [];

  for (const category of categories) {
    const categoryPath = path.join(
      folderPath,
      category
    );

    if (!fs.existsSync(categoryPath)) {
      fs.mkdirSync(categoryPath, {
        recursive: true
      });

      createdFolders.push(category);
    }
  }

  return createdFolders;
}

function checkOrganizationConflicts(plan) {
  return plan.map(file => {
    const exists = fs.existsSync(file.destinationPath);

    return {
      ...file,
      conflict: exists && !file.alreadyOrganized
    };
  });
}

function moveFileSafely(file) {
  if (fs.existsSync(file.destinationPath)) {
    return {
      success: false,
      skipped: true,
      reason: "conflict",
      file: file.name
    };
  }

  fs.mkdirSync(file.destinationFolder, {
    recursive: true
  });

  fs.renameSync(
    file.sourcePath,
    file.destinationPath
  );

  return {
    success: true,
    skipped: false,
    reason: null,
    file: file.name
  };
}

module.exports = {
  createOrganizationPlan,
  createCategoryFolders,
  checkOrganizationConflicts,
  moveFileSafely
};