# Tekst z ekranu

`Tekst z ekranu` is a Windows and macOS desktop OCR application built with Electron. Select any part of your screen and the local Tesseract OCR engine recognizes Polish and English text, then copies the result to the clipboard.

The application is designed to work offline: screen images are processed locally in memory, are not sent to external services, and are not saved to disk. OCR history is kept only in memory by default; optional local persistence can be enabled in Settings.

## Features

- Local, on-device OCR powered by Tesseract.js and WebAssembly.
- Polish and English recognition, including Polish diacritics.
- Global shortcut: `Win + Shift + Q` on Windows or `⌥ + Shift + Q` on macOS.
- Multi-monitor support and DPI scaling support.
- Automatic clipboard copy after recognition.
- Optional OCR history, result normalization, and automatic copying.
- Selection cancellation with `Esc`, right-click, or the capture shortcut again.
- System tray support: closing the window minimizes the app to the tray.
- Windows (`.exe`) and macOS (`.dmg`/`.zip`) builds; no separate Tesseract installation is required.

## Download and use

Build artifacts are created in `dist/` after building the project.

1. Start the application.
2. Press the platform shortcut or click the capture button. On Windows it is `Win + Shift + Q`; on macOS it is `⌥ + Shift + Q`.
3. Drag over the text you want to recognize. The selection must stay on one monitor.
4. Paste the recognized text with `Ctrl + V` (`⌘ + V` on macOS).

Press `Esc` or right-click to cancel a selection. The application supports multiple monitors, including selections over the taskbar. The first OCR operation may take longer because the engine is initialized.

When the window is closed, the application remains in the system tray (the menu bar on macOS). Click its tray icon and choose **Exit** to quit completely. The application does not start automatically with the system.

If the global shortcut is already in use, the app shows a message. Close the conflicting application and restart `Tekst z ekranu`, or use the capture button or tray menu.

Empty OCR results do not overwrite the clipboard.

## Privacy

All OCR processing is local. The bundled Polish and English language data is copied to the application's local cache on first use. No screen image or recognized text is uploaded. Settings persist locally between launches. History remains in memory unless optional local persistence is enabled in Settings. The state file has a 10 MB limit; if history exceeds it, the newest entries that fit are saved. Other entries remain available until the app closes.

## Development

The source is organized by responsibility:

- `src/main/` — Electron main process, OCR, screen capture, history, and local storage.
- `src/main/platform/` — Windows-specific capture helpers; macOS uses Electron's `desktopCapturer`.
- `src/renderer/` — application windows, preload bridge, styles, and renderer scripts.
- `src/shared/` — pure utilities shared by the main process and tests.
- `src/assets/` — packaged application assets such as the Windows and macOS icons.
- `test/` — unit tests; `scripts/` — build and end-to-end helpers.

Requirements:

- Windows 10/11 or macOS 10.15+ for the full desktop workflow.
- Node.js and npm.
- Internet access for the initial dependency installation.

On macOS, the first capture requires **Screen Recording** permission in System Settings → Privacy & Security → Screen Recording. Restart the app after changing this permission.

Install dependencies and run the available scripts:

```powershell
npm ci
npm start
npm test
npm run dist:win
npm run dist:mac
```

The scripts are:

- `npm start` — starts the Electron application.
- `npm test` — runs the automated unit tests with Node's test runner.
- `npm run dist` or `npm run dist:win` — builds a portable Windows executable in `dist/` and creates the generic `Tekst-z-ekranu.exe` copy.
- `npm run dist:mac` — builds `.dmg` and `.zip` macOS packages for the current Mac architecture. Build macOS packages on macOS.
- `npm run pack` — creates an unpacked Electron build for inspection.
- `npm run pack:mac` — creates an unpacked macOS build for inspection.
- `npm run test:e2e` — runs the end-to-end desktop test on the attached monitors.

The Windows executable and macOS packages are not digitally signed. Before running `npm run test:e2e`, close any running instance of the app so that the global shortcut is available. The end-to-end test needs an unlocked, visible desktop; it restores the original clipboard text when it finishes.

## Testing

The automated tests cover:

- DPI-aware coordinate conversion.
- Cropping at image boundaries.
- Invalid and empty selections.
- OCR text normalization.
- History ordering, deduplication, restoring, deleting, and clearing.
- Display/source matching and operation timeouts.

The end-to-end test additionally checks the global shortcut, full-screen overlays, dragging, Polish characters, clipboard integration, cancellation, and overlay cleanup.

## Version 1.0.4

- Unified the application icon in the window, taskbar, Alt+Tab view, and system tray.
- Added native Windows icon sizes from 16 to 256 px and fixed BGRA colors.
- Changed the Windows application identifier to separate the app from Electron's remembered icon group.

## License

This project is published under the [MIT License](LICENSE). See `package.json` for the package metadata.

For the Polish documentation, see [README.pl.md](README.pl.md).
