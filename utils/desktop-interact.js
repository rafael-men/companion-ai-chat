const SELETORES_INTERATIVOS = "input, textarea, select, button, a, [data-no-drag]"

/**
 * @param {{electronAPI?: {arrastarJanela?: Function}, window?: Window}} [deps]
 * @returns {{onMouseDown: Function, desativar: Function}}
 */
export function criarControleDeArrastoDeJanela(deps = {}) {
  const w = deps.window ?? globalThis.window ?? null
  const arrastarJanela =
    deps.electronAPI?.arrastarJanela ?? globalThis.window?.electronAPI?.arrastarJanela ?? null

  let arrastando = false

  function aoMouseMove() {
    if (!arrastando) return
    arrastarJanela?.("move")
  }

  function encerrarArrasto() {
    if (!arrastando) return
    arrastando = false
    arrastarJanela?.("end")
    w?.removeEventListener("mousemove", aoMouseMove)
    w?.removeEventListener("mouseup", encerrarArrasto)
  }

  function aoMouseDown(evento) {
    if (arrastando) return
    if (evento.target?.closest?.(SELETORES_INTERATIVOS)) return

    arrastando = true
    arrastarJanela?.("start")
    w?.addEventListener("mousemove", aoMouseMove)
    w?.addEventListener("mouseup", encerrarArrasto)
  }

  return {
    onMouseDown: aoMouseDown,
    desativar: encerrarArrasto,
  }
}

/**
 * @param {{electronAPI?: {redimensionarJanela?: Function}, window?: Window}} [deps]
 * @returns {{onWheel: Function, desativar: Function}}
 */
export function criarControleDeScrollParaRedimensionar(deps = {}) {
  const w = deps.window ?? globalThis.window ?? null
  const redimensionarJanela =
    deps.electronAPI?.redimensionarJanela ?? globalThis.window?.electronAPI?.redimensionarJanela ?? null

  let ativo = true

  function aoWheel(evento) {
    if (!ativo) return
    if (evento.target?.closest?.(SELETORES_INTERATIVOS)) return
    if (Math.abs(evento.deltaY) < 1) return

    evento.preventDefault()
    redimensionarJanela?.(evento.deltaY)
  }

  w?.addEventListener("wheel", aoWheel, { passive: false })

  return {
    desativar() {
      ativo = false
      w?.removeEventListener("wheel", aoWheel)
    },
  }
}