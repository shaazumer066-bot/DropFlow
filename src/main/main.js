const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");

const { scanFolder } = require("./fileScanner");

const {
  createOrganizationPlan,
  createCategoryFolders,
  checkOrganizationConflicts,
  moveFileSafely
} = require("./organizer");

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