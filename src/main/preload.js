const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("dropflow", {
  chooseFolder: () => ipcRenderer.invoke("choose-folder"),
  scanFolder: (folderPath) => ipcRenderer.invoke("scan-folder", folderPath)
});