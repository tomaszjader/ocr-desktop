const { app, BrowserWindow } = require('electron');
const assert = require('node:assert/strict');
const path = require('node:path');

app.commandLine.appendSwitch('use-fake-device-for-media-stream');
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');
app.setPath('userData', path.resolve('.test-cache', `voice-smoke-${process.pid}`));
let transcriptionRequests = 0;
global.fetch = async (url, options) => {
  assert.equal(url, 'https://api.openai.com/v1/audio/transcriptions');
  assert.equal(options.method, 'POST');
  transcriptionRequests++;
  return { ok: true, json: async () => ({ text: 'Próbna notatka głosowa.' }) };
};
require('../src/main/main.js');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const value = await fn();
    if (value) return value;
    await delay(100);
  }
  throw new Error('Timed out waiting for the voice window');
}

app.whenReady().then(async () => {
  const ocr = await until(() => BrowserWindow.getAllWindows().find(window =>
    window.webContents.getURL().endsWith('/renderer/index.html') && !window.webContents.isLoading()));
  const voice = await until(() => BrowserWindow.getAllWindows().find(window =>
    window.webContents.getURL().endsWith('/voice-ui/dist/index.html') && !window.webContents.isLoading()));
  assert.equal(voice.isVisible(), false);
  await ocr.webContents.executeJavaScript('document.querySelector("[data-view=voice]").click()');
  await until(() => voice.isVisible());
  const ready = await until(() => voice.webContents.executeJavaScript('Boolean(document.querySelector(".recorder"))'));
  assert.equal(ready, true);
  const settings = await voice.webContents.executeJavaScript('window.szeptucha.getSettings()');
  assert(settings.recordHotkey);
  assert(settings.folder);
  console.log('PASS OCR opens voice notes; React UI and IPC settings load');
  const folder = path.join(app.getPath('userData'), 'notes');
  await voice.webContents.executeJavaScript(`window.szeptucha.saveSettings({
    ...${JSON.stringify(settings)}, provider: 'openai', model: 'gpt-4o-mini-transcribe',
    apiKey: 'test-key', folder: ${JSON.stringify(folder)}, format: 'txt', saveFromInterface: true
  })`);
  await voice.webContents.executeJavaScript('window.szeptucha.startRecording()');
  await delay(700);
  const note = await voice.webContents.executeJavaScript('window.szeptucha.stopRecording()');
  assert.equal(note.text, 'Próbna notatka głosowa.');
  assert.equal(transcriptionRequests, 1);
  const notes = await voice.webContents.executeJavaScript('window.szeptucha.getNotes()');
  assert.equal(notes.length, 1);
  assert.equal(await voice.webContents.executeJavaScript(`window.szeptucha.readNote(${JSON.stringify(note.path)})`), note.text);
  assert.equal(await voice.webContents.executeJavaScript(`window.szeptucha.deleteNote(${JSON.stringify(note.path)})`), true);
  console.log('PASS fake microphone recording, transcription IPC, note save/read/delete');
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => app.quit());
