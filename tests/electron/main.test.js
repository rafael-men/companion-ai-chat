jest.mock('electron', () => {
  return {
    app: {
      whenReady: jest.fn(() => Promise.resolve()),
      on: jest.fn(),
      quit: jest.fn(),
    },
    ipcMain: {
      on: jest.fn(),
    },
    screen: {
      getCursorScreenPoint: jest.fn(() => ({ x: 300, y: 200 })),
    },
    BrowserWindow: Object.assign(
      jest.fn(() => ({
        loadURL: jest.fn(),
        loadFile: jest.fn(),
        on: jest.fn(),
        setBackgroundColor: jest.fn(),
        setPosition: jest.fn(),
        setSize: jest.fn(),
        setMinimumSize: jest.fn(),
        getPosition: jest.fn(() => [100, 50]),
        getSize: jest.fn(() => [1200, 800]),
        getMinWidth: jest.fn(() => 360),
        getMinHeight: jest.fn(() => 240),
      })),
      { getAllWindows: jest.fn(() => []) }
    ),
  }
})

describe('electron/main.cjs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    delete process.env.VITE_DEV_SERVER_URL
  })

  test('createWindow - com VITE_DEV_SERVER_URL usa loadURL', async () => {
    process.env.VITE_DEV_SERVER_URL = 'http://localhost:5173'

    require('../../electron/main.cjs')
    await Promise.resolve()

    const { BrowserWindow } = require('electron')
    expect(BrowserWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: 'Companion AI',
      })
    )
    const winInstance = BrowserWindow.mock.results[0].value
    expect(winInstance.loadURL).toHaveBeenCalledWith('http://localhost:5173')
  })

  test('createWindow - sem VITE_DEV_SERVER_URL usa loadFile', async () => {
    require('../../electron/main.cjs')
    await Promise.resolve()

    const { BrowserWindow } = require('electron')
    const winInstance = BrowserWindow.mock.results[0].value
    expect(winInstance.loadFile).toHaveBeenCalled()
    const caminho = winInstance.loadFile.mock.calls[0][0]
    expect(caminho).toContain('dist')
    expect(caminho).toContain('index.html')
  })

  test('webPreferences configura contextIsolation e nodeIntegration', async () => {
    require('../../electron/main.cjs')
    await Promise.resolve()

    const { BrowserWindow } = require('electron')
    expect(BrowserWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        webPreferences: expect.objectContaining({
          contextIsolation: true,
          nodeIntegration: false,
        }),
      })
    )
  })

  test('createWindow - janela é criada com transparent: true', async () => {
    require('../../electron/main.cjs')
    await Promise.resolve()

    const { BrowserWindow } = require('electron')
    expect(BrowserWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        transparent: true,
      })
    )
  })

  test('window-all-closed - faz quit em plataforma não darwin', () => {
    const originalPlatform = process.platform
    Object.defineProperty(process, 'platform', { value: 'win32' })

    require('../../electron/main.cjs')
    const { app } = require('electron')
    const windowAllClosed = app.on.mock.calls.find(c => c[0] === 'window-all-closed')

    expect(windowAllClosed).toBeTruthy()
    windowAllClosed[1]()
    expect(app.quit).toHaveBeenCalled()

    Object.defineProperty(process, 'platform', { value: originalPlatform })
  })

  test('window-all-closed - NÃO faz quit em darwin', () => {
    const originalPlatform = process.platform
    Object.defineProperty(process, 'platform', { value: 'darwin' })

    require('../../electron/main.cjs')
    const { app } = require('electron')
    const windowAllClosed = app.on.mock.calls.find(c => c[0] === 'window-all-closed')

    windowAllClosed[1]()
    expect(app.quit).not.toHaveBeenCalled()

    Object.defineProperty(process, 'platform', { value: originalPlatform })
  })

  test('activate - registra handler', () => {
    require('../../electron/main.cjs')
    const { app } = require('electron')
    const activate = app.on.mock.calls.find(c => c[0] === 'activate')
    expect(activate).toBeTruthy()
  })

  test('window:set-transparent - ativa transparência no fundo da janela', async () => {
    require('../../electron/main.cjs')
    await Promise.resolve()

    const { ipcMain, BrowserWindow } = require('electron')
    const handler = ipcMain.on.mock.calls.find(c => c[0] === 'window:set-transparent')
    expect(handler).toBeTruthy()

    const winInstance = BrowserWindow.mock.results[0].value

    handler[1]({}, true)
    expect(winInstance.setBackgroundColor).toHaveBeenCalledWith('#00000000')
    expect(winInstance.setMinimumSize).toHaveBeenCalledWith(360, 240)

    handler[1]({}, false)
    expect(winInstance.setBackgroundColor).toHaveBeenCalledWith('#000000')
    expect(winInstance.setMinimumSize).toHaveBeenCalledWith(800, 600)
  })

  test('window:drag - arrasta a janela usando a posição do cursor no processo principal', async () => {
    require('../../electron/main.cjs')
    await Promise.resolve()

    const { ipcMain, BrowserWindow, screen } = require('electron')
    const handler = ipcMain.on.mock.calls.find(c => c[0] === 'window:drag')
    expect(handler).toBeTruthy()

    const winInstance = BrowserWindow.mock.results[0].value

    screen.getCursorScreenPoint.mockReturnValue({ x: 300, y: 200 })
    handler[1]({}, 'start')

    screen.getCursorScreenPoint.mockReturnValue({ x: 350, y: 220 })
    handler[1]({}, 'move')
    expect(winInstance.setPosition).toHaveBeenCalledWith(150, 70)
  })

  test('createWindow - janela é criada com transparent: true e frame: false', async () => {
    require('../../electron/main.cjs')
    await Promise.resolve()

    const { BrowserWindow } = require('electron')
    expect(BrowserWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        transparent: true,
        frame: false,
      })
    )
  })

  test('window:drag - end encerra o arrasto e interrompe o movimento', async () => {
    require('../../electron/main.cjs')
    await Promise.resolve()

    const { ipcMain, BrowserWindow, screen } = require('electron')
    const handler = ipcMain.on.mock.calls.find(c => c[0] === 'window:drag')
    const winInstance = BrowserWindow.mock.results[0].value

    screen.getCursorScreenPoint.mockReturnValue({ x: 300, y: 200 })
    handler[1]({}, 'start')

    handler[1]({}, 'end')
    screen.getCursorScreenPoint.mockReturnValue({ x: 999, y: 999 })
    handler[1]({}, 'move')

    expect(winInstance.setPosition).not.toHaveBeenCalled()
  })

  test('window:resize - redimensiona a janela proporcionalmente ao delta do scroll', async () => {
    require('../../electron/main.cjs')
    await Promise.resolve()

    const { ipcMain, BrowserWindow } = require('electron')
    const handler = ipcMain.on.mock.calls.find(c => c[0] === 'window:resize')
    expect(handler).toBeTruthy()

    const winInstance = BrowserWindow.mock.results[0].value
    winInstance.getSize = jest.fn(() => [1200, 800])
    winInstance.getMinWidth = jest.fn(() => 360)
    winInstance.getMinHeight = jest.fn(() => 240)

    handler[1]({}, 120)
    expect(winInstance.setSize).toHaveBeenCalledWith(1180, 780)

    handler[1]({}, -120)
    expect(winInstance.setSize).toHaveBeenCalledWith(1220, 820)
  })

  test('window:resize - respeita limites mínimos e máximos', async () => {
    require('../../electron/main.cjs')
    await Promise.resolve()

    const { ipcMain, BrowserWindow } = require('electron')
    const handler = ipcMain.on.mock.calls.find(c => c[0] === 'window:resize')

    const winInstance = BrowserWindow.mock.results[0].value
    winInstance.getSize = jest.fn(() => [370, 250])
    winInstance.getMinWidth = jest.fn(() => 360)
    winInstance.getMinHeight = jest.fn(() => 240)

    handler[1]({}, 120)
    expect(winInstance.setSize).toHaveBeenCalledWith(360, 240)
  })
})