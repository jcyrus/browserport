import { useState, useEffect } from "react";

interface Browser {
  id: string;
  name: string;
  path: string;
  icon?: string;
}

interface OnboardingScreenProps {
  version: string;
  onDismiss: () => void;
}

interface StepData {
  title: string;
  emoji?: string;
  useAppLogo?: boolean;
  useBrowserIcons?: boolean;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Browser icon priority order
const BROWSER_PRIORITY = ["safari", "chrome", "firefox", "edge", "brave", "arc", "opera", "vivaldi", "chromium", "tor"];

// Map browser IDs to their SVG icon paths
const BROWSER_ICON_MAP: Record<string, string> = {
  chrome: "./icons/browsers/chrome.svg",
  firefox: "./icons/browsers/firefox.svg",
  safari: "./icons/browsers/safari.svg",
  edge: "./icons/browsers/edge.svg",
  brave: "./icons/browsers/brave.svg",
  chromium: "./icons/browsers/chromium.svg",
  tor: "./icons/browsers/tor.svg",
};

export function OnboardingScreen({ version, onDismiss }: Readonly<OnboardingScreenProps>) {
  const [currentStep, setCurrentStep] = useState(0);
  const [browsers, setBrowsers] = useState<Browser[]>([]);

  useEffect(() => {
    // Load detected browsers for the "Pick Your Browser" step
    globalThis.electronAPI.getBrowsers().then(setBrowsers).catch(console.error);
  }, []);

  // Get top 3 browsers sorted by priority
  const getTopBrowsers = () => {
    const sorted = [...browsers].sort((a, b) => {
      const aIndex = BROWSER_PRIORITY.indexOf(a.id.toLowerCase());
      const bIndex = BROWSER_PRIORITY.indexOf(b.id.toLowerCase());
      const aPriority = aIndex === -1 ? 999 : aIndex;
      const bPriority = bIndex === -1 ? 999 : bIndex;
      return aPriority - bPriority;
    });
    return sorted.slice(0, 3);
  };

  const steps: StepData[] = [
    {
      title: "Welcome to BrowserPort",
      useAppLogo: true,
      description:
        "A modern browser picker that gives you control over which browser opens your links.",
    },
    {
      title: "Set as Default Browser",
      emoji: "⚙️",
      description:
        "Open System Settings → Desktop & Dock → Default web browser, then select BrowserPort.",
      action: {
        label: "Open System Settings",
        onClick: () => {
          globalThis.electronAPI.openSystemSettings();
        },
      },
    },
    {
      title: "Click Any Link",
      emoji: "🔗",
      description:
        "When you click a link in Slack, Discord, email, or any other app — BrowserPort appears.",
    },
    {
      title: "Pick Your Browser",
      useBrowserIcons: true,
      description:
        "Use arrow keys, number keys (1-9), or click to choose. Press Escape to cancel.",
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onDismiss();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const topBrowsers = getTopBrowsers();

  // Helper function to determine step indicator class based on step state
  const getStepIndicatorClass = (index: number): string => {
    if (index === currentStep) {
      return "w-8 bg-blue-500";
    }
    if (index < currentStep) {
      return "w-3 bg-blue-400/60";
    }
    return "w-3 bg-gray-700";
  };

  // Helper function to render the step icon/logo/emoji
  const renderStepIcon = () => {
    if (currentStepData?.useAppLogo) {
      return (
        <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/30 ring-1 ring-white/10">
          <img
            src="./app-icon.png"
            alt="BrowserPort"
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    if (currentStepData?.emoji) {
      return (
        <div className="w-20 h-20 rounded-2xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center">
          <span className="text-5xl">{currentStepData.emoji}</span>
        </div>
      );
    }

    if (currentStepData?.useBrowserIcons && topBrowsers.length > 0) {
      return (
        <div className="flex items-center gap-3">
          {topBrowsers.map((browser, index) => {
            const iconPath = BROWSER_ICON_MAP[browser.id.toLowerCase()];
            return (
              <div
                key={browser.id}
                className="w-16 h-16 rounded-xl bg-white/5 ring-1 ring-white/10 p-3 flex items-center justify-center"
                style={{
                  transform: `translateY(${index === 1 ? -8 : 0}px)`,
                }}
              >
                {iconPath ? (
                  <img
                    src={iconPath}
                    alt={browser.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-3xl">🌐</span>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // Default fallback
    return (
      <div className="w-20 h-20 rounded-2xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center">
        <span className="text-5xl">🌐</span>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen bg-[#1a1a2e] overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/20 pointer-events-none" />

      <div className="relative h-full w-full flex flex-col p-8">
        {/* Header with drag region - added mt-4 for spacing from window controls */}
        <div
          className="flex items-center justify-between mt-4"
          style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
              <img
                src="./app-icon.png"
                alt="BrowserPort"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-tight">
                BrowserPort
              </h1>
              <p className="text-sm text-gray-500 font-medium">v{version}</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-all"
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
            title="Close"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {steps.map((step, index) => (
            <button
              key={step.title}
              onClick={() => setCurrentStep(index)}
              className={`h-1.5 rounded-full transition-all duration-300 hover:opacity-80 ${getStepIndicatorClass(index)}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          {/* Icon/Logo/Emoji */}
          <div className="mb-6 h-28 flex items-center justify-center">
            {renderStepIcon()}
          </div>

          <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
            {currentStepData?.title}
          </h2>
          <p className="text-gray-400 text-lg max-w-sm leading-relaxed">
            {currentStepData?.description}
          </p>

          {currentStepData?.action && (
            <button
              onClick={currentStepData.action.onClick}
              className="mt-6 px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-xl ring-1 ring-white/10 transition-all hover:ring-white/20"
            >
              {currentStepData.action.label}
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={isFirstStep}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isFirstStep
                ? "text-gray-600 cursor-not-allowed"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Back
          </button>

          <button
            onClick={handleNext}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
          >
            {isLastStep ? "Get Started" : "Next"}
          </button>
        </div>

        {/* Footer hint */}
        <div className="text-center mt-4 text-xs text-gray-600">
          Access this guide anytime from the menu bar icon → "How to Use..."
        </div>
      </div>
    </div>
  );
}
