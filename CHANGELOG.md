# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.15] - 2026-01-01

### Fixed

- **Dock Icon Visibility**: Configured app as `LSUIElement` (Agent app) for all macOS builds to prevent dock icon from appearing.
  - Root Cause: Missing `LSUIElement` in `Info.plist` for standard builds, reliant only on programmatic hiding
  - Impact: Application now correctly appears only in the menu bar/tray for all macOS users

## [0.1.12] - 2025-12-31

### Fixed

- **Critical: Default Browser Detection**: Registered app as a handler for `http`, `https`, and `file` URL schemes in MAS builds.
  - Root Cause: Missing `CFBundleURLTypes` in `Info.plist` caused macOS to not recognize the app as a browser
  - Impact: App now correctly appears in "Default Browser" selection dropdown in System Settings

## [0.1.11] - 2025-12-30

### Fixed

- **Critical: MAS Entitlements**: Added `allow-jit` and `network.client` to main app entitlements while keeping helper entitlements minimal.
- **Build Configuration**: Disabled `hardenedRuntime` for MAS builds (conflicts with sandbox).
- **Launch Issues**: Temporarily removed `LSUIElement` to verify launch behavior.

## [0.1.10] - 2025-12-27

### Fixed

- **Critical: MAS Sandbox Crash**: Reduced entitlements to minimal configuration to match provisioning profile.
  - Root Cause: App entitlements requested capabilities not in provisioning profile
  - Impact: Should resolve SYSCALL_SET_USERLAND_PROFILE crash on launch

## [0.1.9] - 2025-12-27

### Fixed

- **Critical: MAS Sandbox Crash**: Fixed SYSCALL_SET_USERLAND_PROFILE crash by removing `com.apple.security.inherit` from helper entitlements.
  - Root Cause: Combining `inherit` with explicit entitlements causes sandbox initialization failure
  - Impact: Helper processes now launch correctly without crashing

## [0.1.8] - 2025-12-27

### Fixed

- **MAS Tray Icon**: Added error handling for tray creation to prevent silent failures.
- **MAS Protocol Registration**: Disabled protocol handler registration for MAS builds (sandbox restriction).
- **Debug Logging**: Added detailed logging for troubleshooting MAS-specific issues.

## [0.1.7] - 2025-12-24

### Fixed

- **Critical: MAS Blank Window**: Fixed blank window issue in Mac App Store builds by adding `com.apple.security.cs.allow-jit` entitlement to `entitlements.mac.mas.inherit.plist`.
  - Root Cause: Electron helper processes couldn't execute JavaScript without JIT compilation entitlement
  - Impact: MAS builds now properly render UI instead of showing blank window
  - Files Modified: `build/entitlements.mac.mas.inherit.plist`
- **MAS Helper Process Warnings**: Fixed helper process warnings in TestFlight by adding `LSUIElement: true` to Info.plist.
  - Root Cause: App was hiding from Dock programmatically instead of declaratively
  - Impact: Eliminates "differs from previously opened versions" warnings
  - Files Modified: `package.json`, `src/main/index.ts`

### Changed

- **Build Configuration**: Updated MAS build to create universal binaries (x64 + arm64) by default.

## [0.1.5] - 2025-12-21

### Added

- **Mac App Store Configuration**: Added MAS build target and configuration for App Store distribution.
  - Implementation: `package.json` (mas target, build:mas script)
  - New Files: `build/entitlements.mac.mas.plist`, `build/entitlements.mac.mas.inherit.plist`
  - Impact: Enables building sandboxed .pkg for Mac App Store submission
- **MAS Update Redirect**: For Mac App Store builds, update notifications redirect users to the App Store page instead of downloading directly.

### Changed

- **License**: Changed from MIT to BSD-3-Clause for attribution requirements.

## [0.1.4] - 2025-12-16

### Added

- **Apple Code Signing Configuration**: Added electron-builder configuration for macOS code signing and notarization.
  - Implementation: `package.json` (mac.hardenedRuntime, mac.notarize, dmg.sign)
  - Impact: Resolves macOS Gatekeeper malware warnings on macOS 26.2+
  - Certificate: Developer ID Application signed and notarized by Apple
- **Entitlements File**: Added `build/entitlements.mac.plist` for hardened runtime requirements.
- **Environment Template**: Added `.env.example` for code signing credentials configuration.

### Changed

- **GitHub Actions**: Updated CI/CD workflow to support automated code signing and notarization.
- **README**: Added code signing section documenting the security improvements.

## [0.1.3] - 2025-12-09

### Fixed

- **Critical: App Freezing Issue**: Fixed main process blocking by replacing top-level await with event-based initialization using `app.whenReady().then()`.
- **False Update Detection**: Added semantic version comparison to prevent detecting same or older versions as available updates.
- **Browser Icons Not Displaying**: Fixed SVG icon paths to use relative `./icons/browsers/` format for proper resolution in packaged applications.
- **Update Download Error**: Fixed "Please check update first" error by storing update check results from automatic startup checks.
- **Update State Management**: Ensured automatic update checks on app startup properly store results for later download.
- **Update Error Handling**: Improved error messages and validation for update download process.
- **Performance**: Changed browser detection to non-blocking asynchronous operation.
- **Initialization**: Restructured app initialization to use proper event handlers instead of blocking operations.

## [0.1.3-beta.1] - 2025-12-09

### Added

- **Browser Icons**: Added custom SVG icons for major browsers (Chrome, Firefox, Safari, Edge, Brave, Chromium, Tor).
- **Icon Fallback**: Generic emoji icons for browsers without custom SVG assets (Arc, Opera, Vivaldi, etc.).
- **Auto-Update Feature**: Automatic update checks on app startup with background download capability.
- **Manual Update Checks**: "Check for Updates" option in system tray menu with user-friendly dialogs.
- **Update Notifications**: In-app notification banners showing update availability, download progress, and installation prompts.
- **Update Progress**: Real-time download progress indicator in the UI.

### Changed

- Replaced all emoji browser icons with high-quality SVG graphics for supported browsers.
- Enhanced macOS dock visibility settings with `hiddenInMissionControl` option.

### Fixed

- **macOS Dock Icon**: Completely removed app icon from dock during runtime (was still appearing in some cases).

## [0.1.2] - 2025-12-03

### Added

- **Tray Application Mode**: Converted app to run as a background service.
- **System Tray**: Added system tray/menu bar icon with context menu (About, Quit).
- **Window Management**: App is now hidden from Dock (macOS) and Taskbar (Windows/Linux) until activated.
- **Tray Assets**: Added new tray icon assets (16x16, 32x32).
- **Security Policy**: Added SECURITY.md with vulnerability reporting guidelines.

### Changed

- Refreshed application icons using high-resolution source files.
- Switched to `iconutil` for macOS icon generation to ensure crisp rendering on Retina displays.
- App no longer quits when all windows are closed (to support background tray operation).
- About dialog now uses dynamic version from package.json.
- Tray icon uses template image on macOS for automatic theme adaptation.

### Fixed

- Added safety check to quit app if tray creation fails (prevents users from being stuck).
- Added validation for tray icon path to prevent crashes if assets are missing.
- Refactored About dialog to use async/await pattern for better error handling.

## [0.1.1] - 2025-12-03

### Added

- **Multi-Platform Support**: Automated installers for Windows (`.exe`) and Linux (`.AppImage`).
- **CI/CD**: GitHub Actions workflow for automated multi-platform builds.

### Fixed

- **Production Bug**: Removed auto-hide on blur behavior that caused the window to close immediately upon opening in production builds.
- **CI**: Fixed pnpm version conflicts in GitHub Actions.
- **CI**: Fixed permissions issues for GitHub Release creation.

## [0.1.0] - 2025-12-03

### Added

- Initial release of BrowserPort.
- Cross-platform browser detection (macOS, Windows, Linux).
- Protocol interception for http/https links.
- Modern glassmorphism widget UI.
- Full keyboard navigation.
- Single instance application architecture.
- Custom app icons.
