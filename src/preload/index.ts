import { contextBridge, ipcRenderer } from "electron";

export interface Browser {
  id: string;
  name: string;
  path: string;
  icon?: string;
}

export interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseName?: string;
  releaseNotes?: string;
}

export interface DownloadProgress {
  percent: number;
  bytesPerSecond: number;
  total: number;
  transferred: number;
}

export interface ElectronAPI {
  getBrowsers: () => Promise<Browser[]>;
  launchBrowser: (
    browserId: string,
    url: string
  ) => Promise<{ success: boolean; error?: string }>;
  hideWindow: () => Promise<void>;
  onUrlReceived: (callback: (url: string) => void) => void;
  checkForUpdates: () => Promise<{
    success: boolean;
    updateInfo?: UpdateInfo;
    error?: string;
  }>;
  downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
  installUpdate: () => Promise<void>;
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void;
  onUpdateNotAvailable: (callback: (info: UpdateInfo) => void) => void;
  onUpdateError: (callback: (error: string) => void) => void;
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => void;
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => void;
}

// Expose protected methods that allow the renderer process to interact with electron
contextBridge.exposeInMainWorld("electronAPI", {
  getBrowsers: () => ipcRenderer.invoke("get-browsers"),
  launchBrowser: (browserId: string, url: string) =>
    ipcRenderer.invoke("launch-browser", browserId, url),
  hideWindow: () => ipcRenderer.invoke("hide-window"),
  onUrlReceived: (callback: (url: string) => void) => {
    ipcRenderer.on("url-received", (_event, url: string) => callback(url));
  },
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  downloadUpdate: () => ipcRenderer.invoke("download-update"),
  installUpdate: () => ipcRenderer.invoke("install-update"),
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => {
    ipcRenderer.on("update-available", (_event, info: UpdateInfo) =>
      callback(info)
    );
  },
  onUpdateNotAvailable: (callback: (info: UpdateInfo) => void) => {
    ipcRenderer.on("update-not-available", (_event, info: UpdateInfo) =>
      callback(info)
    );
  },
  onUpdateError: (callback: (error: string) => void) => {
    ipcRenderer.on("update-error", (_event, error: string) => callback(error));
  },
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => {
    ipcRenderer.on("download-progress", (_event, progress: DownloadProgress) =>
      callback(progress)
    );
  },
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => {
    ipcRenderer.on("update-downloaded", (_event, info: UpdateInfo) =>
      callback(info)
    );
  },
} satisfies ElectronAPI);
