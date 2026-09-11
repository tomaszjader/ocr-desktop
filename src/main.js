const { app, BrowserWindow, ipcMain, globalShortcut, screen, desktopCapturer, clipboard, Tray, Menu, nativeImage, Notification } = require('electron');
const path = require('node:path');
const { cropRectangle } = require('./geometry');
const { makeWorker } = require('./ocr');
const { captureDisplays, withTimeout } = require('./capture');
let main, tray, worker, busy = false, quitting = false;
let captureId = 0, phase = 'idle', restoreMain = false;
let overlays = [];
let status = { message: 'Gotowy do zaznaczania', busy: false, text: '', shortcut: true };
const send = (message, extra = {}) => {
  status = { ...status, message, busy, ...extra };
  if (main && !main.isDestroyed()) main.webContents.send('status', status);
  if (tray) tray.setToolTip(`Tekst z ekranu — ${message}`.slice(0, 120));
};
const notify = body => { if (Notification.isSupported()) new Notification({ title: 'Tekst z ekranu', body }).show(); };
function closeOverlays() {
  const closing = overlays;
  overlays = [];
  for (const item of closing) if (!item.window.isDestroyed()) item.window.destroy();
}
function restoreWindow() { if (restoreMain && !quitting) main.show(); restoreMain = false; }
function cancel() {
  if (phase === 'ocr') return;
  captureId++;
  closeOverlays(); busy = false; phase = 'idle'; restoreWindow();
  send('Anulowano. Gotowy do zaznaczania.');
}
async function capture() {
  if (busy) { cancel(); return; }
  const currentId = ++captureId;
  busy = true;
  phase = 'capture';
  send('Przygotowuję zaznaczanie ekranu…');
  try {
    restoreMain = main.isVisible();
    if (restoreMain) { main.hide(); await new Promise(resolve => setTimeout(resolve, 180)); }
    const displays = screen.getAllDisplays();
    const captures = await captureDisplays(displays, { desktopCapturer, screen, nativeImage });
    if (currentId !== captureId) return;
    for (const { display, image } of captures) {
      const window = new BrowserWindow({ ...display.bounds, frame: false, thickFrame: false, transparent: false, resizable: false,
        movable: false, skipTaskbar: true, alwaysOnTop: true, show: false, enableLargerThanScreen: true,
        webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
      window.setAlwaysOnTop(true, 'screen-saver');
      window.setBounds(display.bounds);
      window.setFullScreen(true);
      const item = { window, display, image };
      overlays.push(item);
      window.webContents.on('render-process-gone', () => { if (overlays.includes(item)) cancel(); });
      window.on('closed', () => { if (overlays.includes(item)) cancel(); });
      await withTimeout(window.loadFile(path.join(__dirname, 'overlay.html')), 10000, 'Nie udało się otworzyć zaznaczania.');
      if (currentId !== captureId) return;
      const ready = new Promise((resolve, reject) => {
        const listener = (event, success) => {
          if (event.sender !== window.webContents) return;
          ipcMain.removeListener('image-ready', listener);
          if (success) resolve(); else reject(new Error('Nie udało się wyświetlić obrazu ekranu.'));
        };
        ipcMain.on('image-ready', listener);
        window.once('closed', () => { ipcMain.removeListener('image-ready', listener); resolve(); });
      });
      window.webContents.send('capture-image', image.toDataURL());
      await withTimeout(ready, 10000, 'Nie udało się wyświetlić obrazu ekranu.');
      if (currentId !== captureId) return;
    }
    phase = 'selection';
    send('Zaznacz fragment ekranu. Esc lub ponownie Win + Shift + Q — anuluj.');
    for (const item of overlays) item.window.show();
    const active = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    overlays.find(i => i.display.id === active.id)?.window.focus();
  } catch (error) {
    if (currentId !== captureId) return;
    closeOverlays(); busy = false; phase = 'idle'; restoreWindow();
    send(`Błąd: ${error.message}`); notify(status.message);
  }
}
async function recognize(event, rect) {
  const item = overlays.find(i => i.window.webContents === event.sender);
  if (!item) return;
  let png;
  try {
    const region = cropRectangle(rect, item.display.bounds, item.image.getSize());
    let cropped = item.image.crop(region);
    if (region.width < 1600) cropped = cropped.resize({ width: Math.min(region.width * 2, 2400), quality: 'best' });
    png = cropped.toPNG();
    phase = 'ocr';
    closeOverlays();
    restoreWindow();
    send('Odczytuję tekst lokalnie…');
    if (!worker) {
      const initializing = makeWorker(app.getPath('userData'), progress => {
        if (phase === 'ocr' && progress.status === 'recognizing text') send(`Odczytuję tekst… ${Math.round(progress.progress * 100)}%`);
      });
      try { worker = await withTimeout(initializing, 60000, 'Uruchomienie OCR trwa zbyt długo. Spróbuj ponownie.'); }
      catch (error) { initializing.then(lateWorker => lateWorker.terminate()).catch(() => {}); throw error; }
    }
    const { data } = await withTimeout(worker.recognize(png), 90000, 'Odczyt trwa zbyt długo. Zaznacz mniejszy fragment.');
    const text = data.text.trim();
    if (text) await clipboard.writeText(text);
    busy = false; phase = 'idle';
    if (text) { send('Tekst skopiowany do schowka', { text }); notify('Tekst skopiowany. Wklej go za pomocą Ctrl + V.'); }
    else { send('Nie znaleziono tekstu. Zaznacz wyraźniejszy fragment.'); notify(status.message); }
  } catch (error) {
    closeOverlays(); busy = false; phase = 'idle'; restoreWindow();
    if (worker) { await worker.terminate().catch(() => {}); worker = null; }
    send(`Błąd OCR: ${error.message}`); notify(status.message);
  }
}
function showMain() { main.show(); main.focus(); }
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (main) showMain(); });
  app.whenReady().then(async () => {
    app.setAppUserModelId('pl.tekstzekranu.desktop');
    main = new BrowserWindow({ width: 1120, height: 780, minWidth: 760, minHeight: 620, backgroundColor: '#080d18', autoHideMenuBar: true,
      webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
    main.on('close', event => { if (!quitting) { event.preventDefault(); main.hide(); } });
    const pixels = Buffer.alloc(32 * 32 * 4);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const p = (y * 32 + x) * 4;
      const mark = (y >= 7 && y <= 11 && x >= 6 && x <= 25) || (x >= 14 && x <= 18 && y >= 7 && y <= 25);
      pixels.set(mark ? [30, 40, 25, 255] : [149, 231, 181, 255], p);
    }
    tray = new Tray(nativeImage.createFromBitmap(pixels, { width: 32, height: 32 }));
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Zaznacz tekst (Win + Shift + Q)', click: capture }, { label: 'Otwórz aplikację', click: showMain },
      { type: 'separator' }, { label: 'Zakończ', click: () => app.quit() }
    ]));
    tray.on('double-click', showMain);
    ipcMain.handle('get-status', () => status);
    ipcMain.on('capture', event => { if (event.sender === main.webContents) capture(); });
    ipcMain.on('selection', recognize);
    ipcMain.on('cancel', event => { if (overlays.some(i => i.window.webContents === event.sender)) cancel(); });
    ipcMain.on('copy', async event => {
      if (event.sender !== main.webContents || !status.text) return;
      try { await clipboard.writeText(status.text); }
      catch { send('Schowek jest chwilowo niedostępny. Spróbuj ponownie.'); }
    });
    ipcMain.on('clear', event => {
      if (event.sender !== main.webContents || busy) return;
      send('Gotowy do zaznaczania', { text: '' });
    });
    status.shortcut = globalShortcut.register('Super+Shift+Q', capture);
    send(status.shortcut ? 'Gotowy do zaznaczania' : 'Skrót Win + Shift + Q jest zajęty. Zamknij aplikację, która go używa, i uruchom tę ponownie.');
    await main.loadFile(path.join(__dirname, 'index.html'));
  });
  app.on('window-all-closed', () => {});
  app.on('before-quit', () => { quitting = true; closeOverlays(); globalShortcut.unregisterAll(); if (worker) worker.terminate(); });
}
