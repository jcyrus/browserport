import { useEffect, useState, useCallback } from "react";

interface Browser {
  id: string;
  name: string;
  path: string;
  icon?: string;
}

interface UpdateState {
  available: boolean;
  version?: string;
  downloading: boolean;
  progress?: number;
  downloaded: boolean;
  error?: string;
}

function App() {
  const [browsers, setBrowsers] = useState<Browser[]>([]);
  const [url, setUrl] = useState<string>("");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [updateState, setUpdateState] = useState<UpdateState>({
    available: false,
    downloading: false,
    downloaded: false,
  });

  useEffect(() => {
    // Load browsers on mount
    const loadBrowsers = async () => {
      try {
        const detectedBrowsers = await globalThis.electronAPI.getBrowsers();
        setBrowsers(detectedBrowsers);
      } catch (error) {
        console.error("Failed to load browsers:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBrowsers();

    // Listen for incoming URLs
    globalThis.electronAPI.onUrlReceived((incomingUrl: string) => {
      setUrl(incomingUrl);
      setSelectedIndex(0);
    });

    // Listen for update events
    globalThis.electronAPI.onUpdateAvailable((info) => {
      setUpdateState((prev) => ({
        ...prev,
        available: true,
        version: info.version,
      }));
    });

    globalThis.electronAPI.onUpdateNotAvailable(() => {
      setUpdateState((prev) => ({
        ...prev,
        available: false,
      }));
    });

    globalThis.electronAPI.onUpdateError((error) => {
      setUpdateState((prev) => ({
        ...prev,
        error,
        downloading: false,
      }));
    });

    globalThis.electronAPI.onDownloadProgress((progress) => {
      setUpdateState((prev) => ({
        ...prev,
        downloading: true,
        progress: Math.round(progress.percent),
      }));
    });

    globalThis.electronAPI.onUpdateDownloaded((info) => {
      setUpdateState((prev) => ({
        ...prev,
        downloading: false,
        downloaded: true,
        version: info.version,
      }));
    });
  }, []);

  const handleLaunch = useCallback(
    async (browserId: string) => {
      if (!url) return;

      try {
        const result = await globalThis.electronAPI.launchBrowser(
          browserId,
          url
        );
        if (!result.success) {
          console.error("Failed to launch browser:", result.error);
        }
      } catch (error) {
        console.error("Error launching browser:", error);
      }
    },
    [url]
  );

  const handleDownloadUpdate = async () => {
    try {
      setUpdateState((prev) => ({
        ...prev,
        downloading: true,
        error: undefined,
      }));
      const result = await globalThis.electronAPI.downloadUpdate();
      if (!result.success) {
        setUpdateState((prev) => ({
          ...prev,
          downloading: false,
          error: result.error || "Failed to download update",
        }));
      }
    } catch (error) {
      console.error("Error downloading update:", error);
      setUpdateState((prev) => ({
        ...prev,
        downloading: false,
        error: "Failed to download update",
      }));
    }
  };

  const handleInstallUpdate = async () => {
    try {
      await globalThis.electronAPI.installUpdate();
    } catch (error) {
      console.error("Error installing update:", error);
    }
  };

  const dismissUpdateNotification = () => {
    setUpdateState({
      available: false,
      downloading: false,
      downloaded: false,
    });
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (browsers.length === 0) return;

      switch (e.key) {
        case "Escape":
          globalThis.electronAPI.hideWindow();
          break;
        case "ArrowUp":
        case "ArrowLeft":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : browsers.length - 1
          );
          break;
        case "ArrowDown":
        case "ArrowRight":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < browsers.length - 1 ? prev + 1 : 0
          );
          break;
        case "Enter":
          e.preventDefault();
          if (browsers[selectedIndex]) {
            handleLaunch(browsers[selectedIndex].id);
          }
          break;
        default:
          // Number keys 1-9
          if (e.key >= "1" && e.key <= "9") {
            const index = Number.parseInt(e.key, 10) - 1;
            if (index < browsers.length && browsers[index]) {
              handleLaunch(browsers[index].id);
            }
          }
      }
    },
    [browsers, selectedIndex, handleLaunch]
  );

  useEffect(() => {
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const truncateUrl = (fullUrl: string, maxLength: number = 50) => {
    if (fullUrl.length <= maxLength) return fullUrl;
    return `${fullUrl.substring(0, maxLength)}...`;
  };

  const getBrowserIcon = (browserId: string) => {
    // Map browser IDs to their SVG icon paths
    const iconMap: Record<string, string> = {
      chrome: "./icons/browsers/chrome.svg",
      firefox: "./icons/browsers/firefox.svg",
      safari: "./icons/browsers/safari.svg",
      edge: "./icons/browsers/edge.svg",
      brave: "./icons/browsers/brave.svg",
      chromium: "./icons/browsers/chromium.svg",
      tor: "./icons/browsers/tor.svg",
    };
    return iconMap[browserId.toLowerCase()] ?? null;
  };

  const getBrowserEmoji = (browserId: string) => {
    // Fallback emojis for browsers without custom icons
    const emojiMap: Record<string, string> = {
      arc: "🎨",
      opera: "🎭",
      vivaldi: "❤️",
    };
    return emojiMap[browserId.toLowerCase()] ?? "🌐";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-white text-lg">
          Loading browsers...
        </div>
      </div>
    );
  }

  if (browsers.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-widget-bg backdrop-blur-widget border border-widget-border rounded-2xl shadow-widget p-8 max-w-md">
          <h2 className="text-xl font-semibold text-white mb-4">
            No Browsers Found
          </h2>
          <p className="text-gray-300">
            BrowserPort couldn't detect any installed browsers on your system.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen">
      <div className="bg-gray-900/80 backdrop-blur-2xl shadow-2xl p-6 h-full w-full flex flex-col justify-center">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-sm font-medium text-gray-400 mb-2">
            Open link in:
          </h1>
          {url && (
            <div className="text-white font-mono text-sm bg-black/30 rounded-lg px-4 py-2 truncate">
              {truncateUrl(url, 60)}
            </div>
          )}
        </div>

        {/* Update Notification */}
        {updateState.available && !updateState.downloaded && (
          <div className="mb-4 bg-blue-600/20 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-blue-100 font-medium">
                  Update Available: v{updateState.version}
                </p>
                {updateState.downloading && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${updateState.progress ?? 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-blue-200 mt-1">
                      Downloading... {updateState.progress}%
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                {!updateState.downloading && (
                  <>
                    <button
                      onClick={handleDownloadUpdate}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                    >
                      Download
                    </button>
                    <button
                      onClick={dismissUpdateNotification}
                      className="px-2 py-1 text-blue-200 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {updateState.downloaded && (
          <div className="mb-4 bg-green-600/20 border border-green-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-green-100 font-medium">
                  Update Ready: v{updateState.version}
                </p>
                <p className="text-xs text-green-200 mt-1">
                  Restart to install the update
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={handleInstallUpdate}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                >
                  Restart Now
                </button>
                <button
                  onClick={dismissUpdateNotification}
                  className="px-2 py-1 text-green-200 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {updateState.error && (
          <div className="mb-4 bg-red-600/20 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-100">{updateState.error}</p>
              <button
                onClick={dismissUpdateNotification}
                className="px-2 py-1 text-red-200 hover:text-white text-xs ml-4"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Browser Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {browsers.map((browser, index) => (
            <button
              key={browser.id}
              onClick={() => handleLaunch(browser.id)}
              className={`
                group relative flex flex-col items-center justify-center p-4 rounded-xl
                transition-all duration-200 transform
                ${
                  selectedIndex === index
                    ? "bg-blue-600 scale-105 shadow-lg"
                    : "bg-gray-800/40 hover:bg-gray-700/40 hover:scale-105"
                }
              `}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {/* Number Badge */}
              {index < 9 && (
                <div className="absolute top-2 right-2 text-xs font-bold text-gray-400 group-hover:text-white">
                  {index + 1}
                </div>
              )}

              {/* Icon */}
              <div className="mb-2 flex items-center justify-center h-20 w-20">
                {getBrowserIcon(browser.id) ? (
                  <img
                    src={getBrowserIcon(browser.id)!}
                    alt={browser.name}
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      // Fallback to emoji if SVG fails to load
                      const target = e.currentTarget;
                      target.style.display = "none";
                      if (target.nextElementSibling) {
                        target.nextElementSibling.classList.remove("hidden");
                      }
                    }}
                  />
                ) : null}
                <span
                  className={
                    getBrowserIcon(browser.id) ? "hidden text-5xl" : "text-5xl"
                  }
                >
                  {getBrowserEmoji(browser.id)}
                </span>
              </div>

              {/* Name */}
              <div className="text-white font-medium text-center text-sm">
                {browser.name}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-700/30">
          <div className="flex gap-4">
            <span>↑↓ or 1-9 to select</span>
            <span>Enter to open</span>
          </div>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}

export default App;
