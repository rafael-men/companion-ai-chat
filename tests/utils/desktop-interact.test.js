import { criarControleDeArrastoDeJanela, criarControleDeScrollParaRedimensionar } from '../../utils/desktop-interact.js'

function criarFakeWindow() {
  const ouvintes = {}
  return {
    addEventListener: jest.fn((tipo, fn, opts) => { ouvintes[tipo] = fn }),
    removeEventListener: jest.fn((tipo) => { delete ouvintes[tipo] }),
    disparar(tipo, evento, opts) { ouvintes[tipo]?.(evento) },
  }
}

function criarAlvo(closestRetorno) {
  return { closest: jest.fn(() => closestRetorno) }
}

describe('criarControleDeArrastoDeJanela', () => {
  let electronAPI
  let win

  beforeEach(() => {
    electronAPI = { arrastarJanela: jest.fn() }
    win = criarFakeWindow()
  })

  test('mouseDown inicia o arrasto e move envia o progresso', () => {
    const controle = criarControleDeArrastoDeJanela({ electronAPI, window: win })

    controle.onMouseDown({ target: criarAlvo(false) })
    expect(electronAPI.arrastarJanela).toHaveBeenCalledWith('start')

    win.disparar('mousemove', {})
    expect(electronAPI.arrastarJanela).toHaveBeenCalledWith('move')
  })

  test('mousemove antes do mouseDown não inicia o arrasto', () => {
    criarControleDeArrastoDeJanela({ electronAPI, window: win })

    win.disparar('mousemove', {})

    expect(electronAPI.arrastarJanela).not.toHaveBeenCalled()
  })

  test('mouseup encerra o arrasto e remove os ouvintes', () => {
    const controle = criarControleDeArrastoDeJanela({ electronAPI, window: win })

    controle.onMouseDown({ target: criarAlvo(false) })
    expect(win.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function))

    win.disparar('mouseup', {})

    expect(electronAPI.arrastarJanela).toHaveBeenLastCalledWith('end')
    expect(win.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function))
    expect(win.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function))

    win.disparar('mousemove', {})
    expect(electronAPI.arrastarJanela).toHaveBeenCalledTimes(2)
  })

  test('ignora cliques em elementos interativos (input, button, etc.)', () => {
    const controle = criarControleDeArrastoDeJanela({ electronAPI, window: win })

    controle.onMouseDown({ target: criarAlvo(true) })
    win.disparar('mousemove', {})

    expect(electronAPI.arrastarJanela).not.toHaveBeenCalled()
  })

  test('funciona sem electronAPI (não lança erros no navegador)', () => {
    const controle = criarControleDeArrastoDeJanela({ window: win })

    expect(() => {
      controle.onMouseDown({ target: criarAlvo(false) })
      win.disparar('mousemove', {})
      win.disparar('mouseup', {})
    }).not.toThrow()
  })

  test('desativar encerra um arrasto em andamento', () => {
    const controle = criarControleDeArrastoDeJanela({ electronAPI, window: win })

    controle.onMouseDown({ target: criarAlvo(false) })
    controle.desativar()

    expect(electronAPI.arrastarJanela).toHaveBeenLastCalledWith('end')

    win.disparar('mousemove', {})
    expect(electronAPI.arrastarJanela).toHaveBeenCalledTimes(2)
  })
})

describe('criarControleDeScrollParaRedimensionar', () => {
  let electronAPI
  let win

  beforeEach(() => {
    electronAPI = { redimensionarJanela: jest.fn() }
    win = criarFakeWindow()
  })

  test('wheel com deltaY significativo chama redimensionarJanela', () => {
    criarControleDeScrollParaRedimensionar({ electronAPI, window: win })

    const evento = { deltaY: 120, target: criarAlvo(false), preventDefault: jest.fn() }
    win.disparar('wheel', evento)

    expect(electronAPI.redimensionarJanela).toHaveBeenCalledWith(120)
    expect(evento.preventDefault).toHaveBeenCalled()
  })

  test('wheel em elemento interativo não redimensiona', () => {
    criarControleDeScrollParaRedimensionar({ electronAPI, window: win })

    win.disparar('wheel', { deltaY: 120, target: criarAlvo(true) })

    expect(electronAPI.redimensionarJanela).not.toHaveBeenCalled()
  })

  test(' deltaY pequeno ignora o evento', () => {
    criarControleDeScrollParaRedimensionar({ electronAPI, window: win })

    win.disparar('wheel', { deltaY: 0.5, target: criarAlvo(false) })

    expect(electronAPI.redimensionarJanela).not.toHaveBeenCalled()
  })

  test('desativar para de redimensionar', () => {
    const controle = criarControleDeScrollParaRedimensionar({ electronAPI, window: win })

    controle.desativar()
    win.disparar('wheel', { deltaY: 120, target: criarAlvo(false) })

    expect(electronAPI.redimensionarJanela).not.toHaveBeenCalled()
  })

  test('funciona sem electronAPI', () => {
    expect(() => {
      const controle = criarControleDeScrollParaRedimensionar({ window: win })
      win.disparar('wheel', { deltaY: 120, target: criarAlvo(false), preventDefault: jest.fn() })
      controle.desativar()
    }).not.toThrow()
  })
})