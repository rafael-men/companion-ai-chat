"use strict";
const require$$0 = require("electron");
const require$$1 = require("path");
var main = {};
var hasRequiredMain;
function requireMain() {
  if (hasRequiredMain) return main;
  hasRequiredMain = 1;
  const { app, BrowserWindow, ipcMain, screen } = require$$0;
  const path = require$$1;
  let mainWindow = null;
  let dragOffset = null;
  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      title: "Companion AI",
      frame: false,
      transparent: true,
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false
      }
    });
    if (process.env.VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
      mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    }
    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  }
  ipcMain.on("window:set-transparent", (_event, ativo) => {
    if (!mainWindow) return;
    const ativado = Boolean(ativo);
    mainWindow.setBackgroundColor(ativado ? "#00000000" : "#000000");
    if (ativado) {
      mainWindow.setMinimumSize(360, 240);
    } else {
      mainWindow.setMinimumSize(800, 600);
    }
  });
  ipcMain.on("window:drag", (_event, acao) => {
    if (!mainWindow) return;
    const cursorPos = screen.getCursorScreenPoint();
    if (acao === "start") {
      const [x, y] = mainWindow.getPosition();
      dragOffset = { x: cursorPos.x - x, y: cursorPos.y - y };
    } else if (acao === "move") {
      if (dragOffset) {
        mainWindow.setPosition(cursorPos.x - dragOffset.x, cursorPos.y - dragOffset.y);
      }
    } else if (acao === "end") {
      dragOffset = null;
    }
  });
  ipcMain.on("window:resize", (_event, delta) => {
    if (!mainWindow) return;
    const [w, h] = mainWindow.getSize();
    const fator = delta > 0 ? -20 : 20;
    const novoW = Math.max(mainWindow.getMinWidth(), Math.min(3840, w + fator));
    const novoH = Math.max(mainWindow.getMinHeight(), Math.min(2160, h + fator));
    mainWindow.setSize(novoW, novoH);
  });
  app.whenReady().then(createWindow);
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  return main;
}
requireMain();
