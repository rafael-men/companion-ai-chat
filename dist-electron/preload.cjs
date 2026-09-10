"use strict";
const require$$0 = require("electron");
var preload = {};
var hasRequiredPreload;
function requirePreload() {
  if (hasRequiredPreload) return preload;
  hasRequiredPreload = 1;
  const { contextBridge, ipcRenderer } = require$$0;
  contextBridge.exposeInMainWorld("electronAPI", {
    platform: process.platform,
    setTransparent: (ativo) => ipcRenderer.send("window:set-transparent", !!ativo),
    arrastarJanela: (acao) => ipcRenderer.send("window:drag", acao),
    redimensionarJanela: (delta) => ipcRenderer.send("window:resize", delta)
  });
  return preload;
}
requirePreload();
