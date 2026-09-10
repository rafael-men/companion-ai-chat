jest.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: jest.fn(),
  },
  ipcRenderer: {
    send: jest.fn(),
  },
}))

describe('electron/preload.cjs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  test('exposeInMainWorld é chamado com electronAPI', () => {
    require('../../electron/preload.cjs')
    const { contextBridge } = require('electron')

    expect(contextBridge.exposeInMainWorld).toHaveBeenCalledTimes(1)
    expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith(
      'electronAPI',
      expect.objectContaining({
        platform: expect.any(String),
      })
    )
  })

  test('platform reflete process.platform', () => {
    require('../../electron/preload.cjs')
    const { contextBridge } = require('electron')

    const api = contextBridge.exposeInMainWorld.mock.calls[0][1]
    expect(api.platform).toBe(process.platform)
  })

  test('setTransparent envia evento para a janela principal', () => {
    require('../../electron/preload.cjs')
    const { contextBridge, ipcRenderer } = require('electron')

    const api = contextBridge.exposeInMainWorld.mock.calls[0][1]

    api.setTransparent(true)
    expect(ipcRenderer.send).toHaveBeenCalledWith('window:set-transparent', true)

    api.setTransparent(0)
    expect(ipcRenderer.send).toHaveBeenCalledWith('window:set-transparent', false)
  })

  test('arrastarJanela envia evento de arrasto da janela', () => {
    require('../../electron/preload.cjs')
    const { contextBridge, ipcRenderer } = require('electron')

    const api = contextBridge.exposeInMainWorld.mock.calls[0][1]

    api.arrastarJanela('start')
    expect(ipcRenderer.send).toHaveBeenCalledWith('window:drag', 'start')

    api.arrastarJanela('move')
    expect(ipcRenderer.send).toHaveBeenCalledWith('window:drag', 'move')

    api.arrastarJanela('end')
    expect(ipcRenderer.send).toHaveBeenCalledWith('window:drag', 'end')
  })

  test('redimensionarJanela envia evento de resize', () => {
    require('../../electron/preload.cjs')
    const { contextBridge, ipcRenderer } = require('electron')

    const api = contextBridge.exposeInMainWorld.mock.calls[0][1]

    api.redimensionarJanela(120)
    expect(ipcRenderer.send).toHaveBeenCalledWith('window:resize', 120)

    api.redimensionarJanela(-120)
    expect(ipcRenderer.send).toHaveBeenCalledWith('window:resize', -120)
  })
})
