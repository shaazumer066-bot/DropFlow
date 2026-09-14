const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("dropflow", {
  chooseFolder: () => ipcRenderer.invoke("choose-folder"),
  scanFolder: (folderPath) => ipcRenderer.invoke("scan-folder", folderPath),
  createOrganizationPlan: (folderPath) =>
  ipcRenderer.invoke("create-organization-plan", folderPath),
  createCategoryFolders: (folderPath) =>
  ipcRenderer.invoke("create-category-folders", folderPath),
  checkOrganizationConflicts: (folderPath) =>
  ipcRenderer.invoke("check-organization-conflicts",folderPath),
  moveFileSafely: (file) => ipcRenderer.invoke("move-file-safely",file)
});