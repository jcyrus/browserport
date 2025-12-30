import {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  dialog,
  shell,
} from "electron";
import { autoUpdater, UpdateInfo } from "electron-updater";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { version } from "../../package.json";
import { BrowserManager } from "./browserManager";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect if running as Mac App Store build (process.mas is set by Electron for MAS builds)
const isMAS = !!(process as NodeJS.Process & { mas?: boolean }).mas;

// App Store URL - Update this with your actual App Store ID after approval
const APP_STORE_URL = "macappstore://apps.apple.com/app/id0000000000"; // TODO: Replace with actual App Store ID

// Configure auto-updater
autoUpdater.autoDownload = false; // User controls when to download
autoUpdater.autoInstallOnAppQuit = true;

// Auto-updater event handlers
autoUpdater.on("checking-for-update", () => {
  console.log("Checking for updates...");
});

autoUpdater.on("update-available", (info) => {
  console.log("Update available:", info.version);
  updateCheckResult = info; // Store the update info
  if (mainWindow) {
    mainWindow.webContents.send("update-available", info);
  }
});

autoUpdater.on("update-not-available", (info) => {
  console.log("Update not available:", info.version);
  updateCheckResult = null; // Clear any stored update info
  if (mainWindow) {
    mainWindow.webContents.send("update-not-available", info);
  }
});

autoUpdater.on("error", (err) => {
  console.error("Update error:", err);
  if (mainWindow) {
    mainWindow.webContents.send("update-error", err.message);
  }
});

autoUpdater.on("download-progress", (progressObj) => {
  console.log(`Download progress: ${progressObj.percent}%`);
  if (mainWindow) {
    mainWindow.webContents.send("download-progress", progressObj);
  }
});

autoUpdater.on("update-downloaded", (info) => {
  console.log("Update downloaded:", info.version);
  updateCheckResult = null; // Clear stored result after successful download
  if (mainWindow) {
    mainWindow.webContents.send("update-downloaded", info);
  }
});

// The built directory structure:
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main
// │ │ └── preload
process.env.DIST = path.join(__dirname, "../../dist");
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, "../public");

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let pendingUrl: string | null = null;
let updateCheckResult: UpdateInfo | null = null; // Store the last update check result
const browserManager = new BrowserManager();

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();

if (gotTheLock) {
  app.on("second-instance", (_event, commandLine) => {
    // Someone tried to run a second instance, focus our window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }

    // Extract URL from command line (Windows/Linux)
    const url = commandLine.find((arg) => arg.startsWith("http"));
    if (url) {
      handleIncomingUrl(url);
    }
  });

  // App initialization - use event-based approach to avoid blocking
  app.whenReady().then(() => {
    // Create Tray Icon with error handling
    try {
      createTray();
      console.log("Tray icon created successfully");
    } catch (err) {
      console.error("Failed to create tray icon:", err);
    }

    // Detect browsers on startup (non-blocking)
    browserManager.detectBrowsers().catch((err) => {
      console.error("Failed to detect browsers:", err);
    });

    // Register as default protocol handler (not allowed in MAS sandbox)
    if (!isMAS) {
      if (process.defaultApp) {
        if (process.argv.length >= 2) {
          app.setAsDefaultProtocolClient("http", process.execPath, [
            path.resolve(process.argv[1] ?? ""),
          ]);
          app.setAsDefaultProtocolClient("https", process.execPath, [
            path.resolve(process.argv[1] ?? ""),
          ]);
        }
      } else {
        app.setAsDefaultProtocolClient("http");
        app.setAsDefaultProtocolClient("https");
      }
    }

    createWindow();

    // Check for updates on startup (only in production) - non-blocking
    if (!process.env.VITE_DEV_SERVER_URL && app.isPackaged) {
      setTimeout(() => {
        autoUpdater
          .checkForUpdates()
          .then((result) => {
            // Only store if there's actually a newer version
            if (
              result?.updateInfo &&
              compareVersions(result.updateInfo.version, version) > 0
            ) {
              updateCheckResult = result.updateInfo;
            } else {
              updateCheckResult = null;
            }
          })
          .catch((err) => {
            console.error("Failed to check for updates:", err);
            updateCheckResult = null;
          });
      }, 3000); // Wait 3 seconds after app start
    }

    // macOS: Handle URL open events
    app.on("open-url", (event, url) => {
      event.preventDefault();
      handleIncomingUrl(url);
    });

    // Check for URL in process.argv (Windows/Linux)
    const url = process.argv.find((arg) => arg.startsWith("http"));
    if (url) {
      handleIncomingUrl(url);
    }
  });

  app.on("window-all-closed", () => {
    // Only keep running if tray exists, otherwise quit
    // This prevents users from being stuck if tray creation fails
    if (!tray) {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  app.on("before-quit", () => {
    tray?.destroy();
  });
} else {
  app.quit();
}

// Helper function to compare semantic versions
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.replace(/^v/, "").split(".").map(Number);
  const parts2 = v2.replace(/^v/, "").split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}

async function handleUpdateCheck() {
  if (!app.isPackaged) {
    await dialog.showMessageBox({
      title: "Updates",
      message: "Updates are only available in production builds",
      buttons: ["OK"],
    });
    return;
  }

  try {
    const result = await autoUpdater.checkForUpdates();

    if (
      !result?.updateInfo ||
      compareVersions(result.updateInfo.version, version) <= 0
    ) {
      await dialog.showMessageBox({
        title: "No Updates",
        message: `You're running the latest version (v${version})`,
        buttons: ["OK"],
      });
      return;
    }

    // For Mac App Store builds, redirect to App Store instead of downloading
    if (isMAS) {
      const response = await dialog.showMessageBox({
        title: "Update Available",
        message: `Version ${result.updateInfo.version} is available`,
        detail: "Would you like to open the App Store to update?",
        buttons: ["Open App Store", "Later"],
        defaultId: 0,
        cancelId: 1,
      });

      if (response.response === 0) {
        await shell.openExternal(APP_STORE_URL);
      }
      return;
    }

    // For direct distribution, download and install
    const response = await dialog.showMessageBox({
      title: "Update Available",
      message: `Version ${result.updateInfo.version} is available`,
      detail: "Would you like to download and install it?",
      buttons: ["Download & Install", "Later"],
      defaultId: 0,
      cancelId: 1,
    });

    if (response.response === 0) {
      await autoUpdater.downloadUpdate();
      await dialog.showMessageBox({
        title: "Update Ready",
        message: "Update has been downloaded",
        detail: "The update will be installed when you quit the app.",
        buttons: ["OK"],
      });
    }
  } catch (error) {
    await dialog.showMessageBox({
      title: "Update Error",
      message: "Failed to check for updates",
      detail: error instanceof Error ? error.message : "Unknown error",
      buttons: ["OK"],
    });
  }
}

function createTray() {
  const publicDir = process.env.VITE_PUBLIC;
  if (!publicDir) {
    console.error("VITE_PUBLIC environment variable is not defined");
    console.error("app.isPackaged:", app.isPackaged);
    console.error("__dirname:", __dirname);
    throw new Error("VITE_PUBLIC not defined");
  }

  const iconPath = path.join(publicDir, "tray.png");
  console.log("Creating tray with icon path:", iconPath);

  if (!fs.existsSync(iconPath)) {
    console.error(`Tray icon not found at: ${iconPath}`);
    // List available files in publicDir for debugging
    try {
      const files = fs.readdirSync(publicDir);
      console.error("Available files in publicDir:", files);
    } catch (e) {
      console.error("Failed to list publicDir:", e);
    }
    throw new Error(`Tray icon not found: ${iconPath}`);
  }

  const icon = nativeImage.createFromPath(iconPath);
  if (icon.isEmpty()) {
    console.error("Created icon is empty, path:", iconPath);
    throw new Error("Tray icon image is empty");
  }

  // Use template image for macOS to adapt to theme
  if (process.platform === "darwin") {
    icon.setTemplateImage(true);
  }

  tray = new Tray(icon);
  tray.setToolTip("BrowserPort");
  console.log("Tray created, setting up context menu...");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "About BrowserPort",
      click: () => {
        const appIconPath = path.join(
          process.env.VITE_PUBLIC ?? "",
          "app-icon.png"
        );
        const appIcon = nativeImage.createFromPath(appIconPath);

        dialog
          .showMessageBox({
            title: "About BrowserPort",
            message: `BrowserPort v${version}`,
            detail:
              "A cross-platform browser picker.\n\nCreated by @jCyrus. \n\nhttps://jcyrus.com/",
            buttons: ["OK"],
            icon: appIcon,
          })
          .catch((error) => {
            console.error("Failed to show about dialog:", error);
          });
      },
    },
    { type: "separator" },
    {
      label: "Check for Updates...",
      click: () => {
        handleUpdateCheck().catch(console.error);
      },
    },
    { type: "separator" },
    { label: "Quit", click: () => app.quit() },
  ]);

  tray.setContextMenu(contextMenu);

  // Optional: Toggle window on click (if not right-click)
  tray.on("click", () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      // Show context menu on left-click for consistency across platforms
      tray?.popUpContextMenu();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    center: true,
    show: false, // Don't show until ready
    skipTaskbar: true, // Hide from taskbar (Windows/Linux)
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    ...(process.platform === "darwin" && {
      vibrancy: "under-window",
      // Ensure window doesn't appear in dock
      hiddenInMissionControl: true,
    }),
  });

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(process.env.DIST ?? "", "index.html"));
  }

  // Ready to show
  mainWindow.once("ready-to-show", () => {
    if (pendingUrl) {
      showWindowWithUrl(pendingUrl);
      pendingUrl = null;
    } else if (process.env.VITE_DEV_SERVER_URL) {
      // In dev mode, show window with a test URL
      showWindowWithUrl("https://github.com/electron/electron");
    }
  });

  // Note: We don't auto-hide on blur because it causes the window to close
  // immediately when opened from another app. The window will hide when:
  // 1. User presses Escape
  // 2. User selects a browser (handled in IPC handler)

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function handleIncomingUrl(url: string) {
  if (!mainWindow) {
    // Store for later when window is ready
    pendingUrl = url;
    return;
  }

  if (mainWindow.webContents.isLoading()) {
    pendingUrl = url;
  } else {
    showWindowWithUrl(url);
  }
}

function showWindowWithUrl(url: string) {
  if (!mainWindow) return;

  // Send URL to renderer
  mainWindow.webContents.send("url-received", url);

  // Show and focus the window
  mainWindow.show();
  mainWindow.focus();
}

// IPC Handlers
ipcMain.handle("get-browsers", async () => {
  return browserManager.getBrowsers();
});

ipcMain.handle(
  "launch-browser",
  async (_event, browserId: string, url: string) => {
    try {
      await browserManager.launchBrowserWithUrl(browserId, url);

      // Hide the window after launching
      mainWindow?.hide();

      return { success: true };
    } catch (error) {
      console.error("Failed to launch browser:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

ipcMain.handle("hide-window", async () => {
  mainWindow?.hide();
});

// Update handlers
ipcMain.handle("check-for-updates", async () => {
  try {
    if (!app.isPackaged) {
      return {
        success: false,
        error: "Updates are only available in production builds",
      };
    }
    const result = await autoUpdater.checkForUpdates();
    // Only store and return update info if it's actually a newer version
    if (
      result?.updateInfo &&
      compareVersions(result.updateInfo.version, version) > 0
    ) {
      updateCheckResult = result.updateInfo;
      return { success: true, updateInfo: result.updateInfo };
    } else {
      updateCheckResult = null;
      return { success: true, updateInfo: undefined };
    }
  } catch (error) {
    console.error("Failed to check for updates:", error);
    updateCheckResult = null;
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("download-update", async () => {
  try {
    // Ensure we have a valid update to download
    if (!updateCheckResult) {
      return {
        success: false,
        error: "No update available. Please check for updates first.",
      };
    }

    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    console.error("Failed to download update:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("install-update", async () => {
  autoUpdater.quitAndInstall();
});
