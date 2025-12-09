# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
