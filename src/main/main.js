const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { scanFolder } = require("./fileScanner");
const { findDuplicates } = require("./duplicateScanner");
const fs = require("fs");
const {
  createOrganizationPlan,
  createCategoryFolders,
  checkOrganizationConflicts,
  moveFileSafely
} = require("./organizer");

let lastOrganizationResults = [];

function createWindow() {
   const win = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 800,
    minHeight: 500,

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, "../../index.html"));
}

ipcMain.handle("choose-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle("scan-folder", async (event, folderPath) => {
  try {
    return scanFolder(folderPath);
  } catch (error) {
    console.error("Scan failed:", error);
    throw error;
  }
});

ipcMain.handle(
  "create-organization-plan",
  async (event, folderPath) => {
    try {
      const files = scanFolder(folderPath);

      return createOrganizationPlan(
        files,
        folderPath
      );
    } catch (error) {
      console.error(
        "Could not create organization plan:",
        error
      );

      throw error;
    }
  }
);

ipcMain.handle(
  "create-category-folders",
  async (event, folderPath) => {
    try {
      return createCategoryFolders(folderPath);
    } catch (error) {
      console.error(
        "Could not create category folders:",
        error
      );

      throw error;
    }
  }
);

ipcMain.handle("organize-files", async (event, folderPath) => {
  try {
    const files = scanFolder(folderPath);
    const plan = createOrganizationPlan(files, folderPath);

    const results = [];

    for (const file of plan) {
      try {
        const result = moveFileSafely(file);
        results.push(result);
      } catch (error) {
        console.error(`Could not move ${file.name}:`, error);

        results.push({
          success: false,
          skipped: false,
          reason: "error",
          file: file.name,
          sourcePath: file.sourcePath,
          destinationPath: file.destinationPath,
          error: error.message
        });
      }
    }

    lastOrganizationResults = results.filter(
      result =>
        result.success &&
        result.sourcePath &&
        result.destinationPath
    );

    return results;

  } catch (error) {
    console.error("Organization failed:", error);
    throw error;
  }
});

ipcMain.handle("undo-organization", async () => {
  try {
    if (lastOrganizationResults.length === 0) {
      return {
        success: false,
        restored: 0,
        failed: 0,
        message: "There is no organization to undo."
      };
    }

    let restored = 0;
    let failed = 0;

    for (const file of lastOrganizationResults) {
      try {
        if (!fs.existsSync(file.destinationPath)) {
          failed++;
          continue;
        }

        if (fs.existsSync(file.sourcePath)) {
          failed++;
          continue;
        }

        fs.renameSync(
          file.destinationPath,
          file.sourcePath
        );

        restored++;

      } catch (error) {
        console.error(
          `Could not restore ${file.file}:`,
          error
        );

        failed++;
      }
    }

    lastOrganizationResults = [];

    return {
      success: true,
      restored,
      failed,
      message: "Undo completed."
    };

  } catch (error) {
    console.error("Undo failed:", error);
    throw error;
  }
});

ipcMain.handle(
  "check-organization-conflicts",
  async (event, folderPath) => {
    try {
      const files = scanFolder(folderPath);

      const plan = createOrganizationPlan(
        files,
        folderPath
      );

      return checkOrganizationConflicts(plan);
    } catch (error) {
      console.error(
        "Could not check organization conflicts:",
        error
      );

      throw error;
    }
  }
);

ipcMain.handle(
  "move-file-safely",
  async (event, file) => {
    try {
      return moveFileSafely(file);
    } catch (error) {
      console.error(
        "Could not move file:",
        error
      );

      return {
        success: false,
        skipped: false,
        reason: "error",
        file: file.name,
        error: error.message
      };
    }
  }
);

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("find-duplicates", async (event, folderPath) => {
  try {
    return findDuplicates(folderPath);
  } catch (error) {
    console.error("Duplicate scan failed:", error);
    throw error;
  }
});