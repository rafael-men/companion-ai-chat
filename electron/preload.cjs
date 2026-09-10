const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  setTransparent: (ativo) => ipcRenderer.send('window:set-transparent', !!ativo),
  arrastarJanela: (acao) => ipcRenderer.send('window:drag', acao),
  redimensionarJanela: (delta) => ipcRenderer.send('window:resize', delta),
})