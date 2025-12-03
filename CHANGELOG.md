# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Tray Application Mode**: Converted app to run as a background service.
- **System Tray**: Added system tray/menu bar icon with context menu (About, Quit).
- **Window Management**: App is now hidden from Dock (macOS) and Taskbar (Windows/Linux) until activated.
- **Tray Assets**: Added new tray icon assets (16x16, 32x32).

### Changed

- Refreshed application icons using high-resolution source files.
- Switched to `iconutil` for macOS icon generation to ensure crisp rendering on Retina displays.
- App no longer quits when all windows are closed (to support background tray operation).

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
