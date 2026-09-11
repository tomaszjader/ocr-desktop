const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('ocr', {
  capture: () => ipcRenderer.send('capture'),
  select: rect => ipcRenderer.send('selection', rect),
  cancel: () => ipcRenderer.send('cancel'),
  imageReady: success => ipcRenderer.send('image-ready', success),
  copy: () => ipcRenderer.send('copy'),
  clear: () => ipcRenderer.send('clear'),
  getStatus: () => ipcRenderer.invoke('get-status'),
  onStatus: callback => ipcRenderer.on('status', (_event, data) => callback(data)),
  onImage: callback => ipcRenderer.on('capture-image', (_event, data) => callback(data))
});
