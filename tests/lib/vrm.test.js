import { setExpr, animarAvatar, prepararAvatar } from '../../src/lib/vrm.js'

jest.mock('@pixiv/three-vrm', () => ({
  VRMUtils: {
    removeUnnecessaryVertices: jest.fn(),
    combineSkeletons: jest.fn(),
    combineMorphs: jest.fn(),
    rotateVRM0: jest.fn(),
  },
}))

function makeMockExpressionManager(extraNames = []) {
  const names = ['happy', 'sad', 'angry', 'relaxed', 'Joy', 'Sorrow', 'Angry', 'Fun', 'Neutral', 'neutral', 'blink', 'Blink', 'aa', 'ih', 'uu', 'eh', 'oh', ...extraNames]
  const expressions = new Map(names.map(n => [n, 0]))
  return {
    getExpression: jest.fn((name) => expressions.has(name) ? name : null),
    setValue: jest.fn((name, value) => { expressions.set(name, value) }),
    _expressions: expressions,
  }
}

function makeMockVRM() {
  const bones = new Map()
  const makeBone = () => ({ rotation: { set: jest.fn(), x: 0, y: 0, z: 0 } })

  for (const name of ['head', 'leftUpperArm', 'rightUpperArm', 'leftLowerArm', 'rightLowerArm', 'chest', 'spine']) {
    bones.set(name, makeBone())
  }

  return {
    humanoid: {
      getNormalizedBoneNode: jest.fn((name) => bones.get(name) || null),
    },
    expressionManager: makeMockExpressionManager(),
    scene: { traverse: jest.fn() },
    meta: { metaVersion: '1.0' },
    _isVRM0: false,
    _headBind: { x: 0, y: 0 },
    update: jest.fn(),
  }
}

describe('setExpr', () => {
  test('chama setValue para cada nome encontrado', () => {
    const expr = {
      getExpression: jest.fn((name) => name === 'aa' ? 'aa' : null),
      setValue: jest.fn(),
    }

    setExpr(expr, ['aa', 'A', 'a'], 0.5)
    expect(expr.setValue).toHaveBeenCalledTimes(1)
    expect(expr.setValue).toHaveBeenCalledWith('aa', 0.5)
  })

  test('não chama setValue para nomes não encontrados', () => {
    const expr = {
      getExpression: jest.fn(() => null),
      setValue: jest.fn(),
    }

    setExpr(expr, ['aa', 'A'], 0.8)
    expect(expr.setValue).not.toHaveBeenCalled()
  })

  test('chama setValue para múltiplos nomes válidos', () => {
    const expr = {
      getExpression: jest.fn(() => 'found'),
      setValue: jest.fn(),
    }

    setExpr(expr, ['aa', 'A', 'a'], 1.0)
    expect(expr.setValue).toHaveBeenCalledTimes(3)
  })
})

describe('prepararAvatar', () => {
  test('chama VRMUtils funções de otimização', () => {
    const { VRMUtils } = require('@pixiv/three-vrm')
    const scene = { traverse: jest.fn() }
    const vrm = makeMockVRM()
    vrm.scene = scene

    prepararAvatar(scene, vrm)

    expect(VRMUtils.removeUnnecessaryVertices).toHaveBeenCalledWith(scene)
    expect(VRMUtils.combineSkeletons).toHaveBeenCalledWith(scene)
    expect(VRMUtils.combineMorphs).toHaveBeenCalledWith(vrm)
    expect(VRMUtils.rotateVRM0).toHaveBeenCalledWith(vrm)
  })

  test('desabilita frustumCulled em todos os objetos', () => {
    const mockObj = { frustumCulled: true }
    const scene = { traverse: jest.fn((cb) => cb(mockObj)) }
    const vrm = makeMockVRM()
    vrm.scene = scene

    prepararAvatar(scene, vrm)
    expect(mockObj.frustumCulled).toBe(false)
  })

  test('detecta VRM0 e salva head bind', () => {
    const scene = { traverse: jest.fn() }
    const vrm = makeMockVRM()
    vrm.meta = { metaVersion: '0' }
    vrm.scene = scene

    prepararAvatar(scene, vrm)
    expect(vrm._isVRM0).toBe(true)
  })

  test('centraliza o modelo no centro da cena', () => {
    const { Group, Mesh, BoxGeometry, MeshStandardMaterial, Vector3 } = require('three')

    const scene = new Group()
    const mesh = new Mesh(new BoxGeometry(1, 2, 1), new MeshStandardMaterial())
    mesh.position.set(1, 2, 3)
    scene.add(mesh)

    const vrm = makeMockVRM()
    vrm.scene = scene

    prepararAvatar(scene, vrm)

    expect(scene.position.x).toBe(-1)
    expect(scene.position.y).toBe(-1)
    expect(scene.position.z).toBe(-3)
    expect(scene.scale.x).toBeGreaterThan(0)
  })
})

describe('animarAvatar', () => {
  test('chama vrm.update com delta', () => {
    const vrm = makeMockVRM()
    animarAvatar(vrm, 0, 0.016, null, 1.0, null, false, null, 'neutral')
    expect(vrm.update).toHaveBeenCalledWith(0.016)
  })

  test('aplica lip-sync quando intensidades fornecidas', () => {
    const vrm = makeMockVRM()
    const intensities = { aa: 1, ih: 0, uu: 0, eh: 0, oh: 0 }
    animarAvatar(vrm, 0, 0.016, intensities)
    expect(vrm.expressionManager.setValue).toHaveBeenCalled()
  })

  test('aplica emoção', () => {
    const vrm = makeMockVRM()
    animarAvatar(vrm, 0, 0.016, null, 1.0, null, false, null, 'happy')
    expect(vrm.expressionManager.setValue).toHaveBeenCalled()
  })

  test('aplica gesto nod ao head', () => {
    const vrm = makeMockVRM()
    animarAvatar(vrm, 1, 0.016, null, 1.0, 'nod', false, null)
    expect(vrm.humanoid.getNormalizedBoneNode).toHaveBeenCalledWith('head')
  })

  test('aplica gesto shake ao head', () => {
    const vrm = makeMockVRM()
    animarAvatar(vrm, 1, 0.016, null, 1.0, 'shake', false, null)
    expect(vrm.humanoid.getNormalizedBoneNode).toHaveBeenCalledWith('head')
  })

  test('aplica mouse tracking quando fornecido', () => {
    const vrm = makeMockVRM()
    animarAvatar(vrm, 1, 0.016, null, 1.0, null, false, { x: 0.5, y: 0.5 })
    expect(vrm.humanoid.getNormalizedBoneNode).toHaveBeenCalledWith('head')
  })

  test('aplica blink quando eyesClosed true', () => {
    const vrm = makeMockVRM()
    animarAvatar(vrm, 0, 0.016, null, 1.0, null, true, null)
    expect(vrm.expressionManager.setValue).toHaveBeenCalled()
  })

  test('atualiza o mixer quando existe', () => {
    const vrm = makeMockVRM()
    vrm._mixer = { update: jest.fn() }
    animarAvatar(vrm, 0, 0.016)
    expect(vrm._mixer.update).toHaveBeenCalledWith(0.016)
  })

  test('quando VRMA ativo não aplica pose procedural mas mantém expressões', () => {
    const vrm = makeMockVRM()
    vrm._vrmaAtivo = true
    vrm._mixer = { update: jest.fn() }

    animarAvatar(vrm, 0, 0.016, { aa: 1 }, 1.0, 'nod', false, null, 'happy')

    const leftUpperArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm')
    expect(leftUpperArm.rotation.set).not.toHaveBeenCalled()
    expect(vrm.expressionManager.setValue).toHaveBeenCalled()
    expect(vrm.update).toHaveBeenCalledWith(0.016)
  })
})

describe('applyEmotion - VRM 0 e VRM 1.0', () => {
  function callWithEmotion(emotion, vrmMetaVersion = '1.0') {
    const vrm = makeMockVRM()
    vrm.meta = { metaVersion: vrmMetaVersion }
    vrm._isVRM0 = vrmMetaVersion === '0'
    animarAvatar(vrm, 0, 0.016, null, 1.0, null, false, null, emotion)
    return vrm.expressionManager
  }

  function getCallsForName(expr, targetName) {
    return expr.setValue.mock.calls.filter(([name]) => name === targetName)
  }

  test('happy seta valor 1.0 no preset VRM 1.0 (happy)', () => {
    const expr = callWithEmotion('happy')
    const calls = getCallsForName(expr, 'happy')
    expect(calls).toHaveLength(1)
    expect(calls[0][1]).toBe(1)
  })

  test('happy zera outros presets VRM 1.0', () => {
    const expr = callWithEmotion('happy')
    expect(getCallsForName(expr, 'sad')[0][1]).toBe(0)
    expect(getCallsForName(expr, 'angry')[0][1]).toBe(0)
    expect(getCallsForName(expr, 'neutral')[0][1]).toBe(0)
  })

  test('sad seta valor 1.0 no preset VRM 1.0 (sad)', () => {
    const expr = callWithEmotion('sad')
    const calls = getCallsForName(expr, 'sad')
    expect(calls).toHaveLength(1)
    expect(calls[0][1]).toBe(1)
  })

  test('angry seta valor 1.0 no preset VRM 1.0 (angry)', () => {
    const expr = callWithEmotion('angry')
    const calls = getCallsForName(expr, 'angry')
    expect(calls).toHaveLength(1)
    expect(calls[0][1]).toBe(1)
  })

  test('neutral seta valor 1.0 no preset VRM 1.0 (neutral)', () => {
    const expr = callWithEmotion('neutral')
    const calls = getCallsForName(expr, 'neutral')
    expect(calls).toHaveLength(1)
    expect(calls[0][1]).toBe(1)
  })

  test('playful seta happy=0.8 e relaxed=0.2 no VRM 1.0', () => {
    const expr = callWithEmotion('playful')
    expect(getCallsForName(expr, 'happy')[0][1]).toBe(0.8)
    expect(getCallsForName(expr, 'relaxed')[0][1]).toBe(0.2)
  })

  test('emoção desconhecida cai em neutral', () => {
    const expr = callWithEmotion('desconhecida')
    const calls = getCallsForName(expr, 'neutral')
    expect(calls).toHaveLength(1)
    expect(calls[0][1]).toBe(1)
  })
})

describe('greeting: eyesClosed + happy durante VRMA', () => {
  test('com eyesClosed=true, blink fica 1', () => {
    const vrm = makeMockVRM()
    animarAvatar(vrm, 0, 0.016, null, 1.0, null, true, null, 'happy')
    const blinkCalls = vrm.expressionManager.setValue.mock.calls.filter(
      ([name]) => name === 'blink' || name === 'Blink'
    )
    expect(blinkCalls.length).toBeGreaterThan(0)
    expect(blinkCalls[0][1]).toBe(1)
  })

  test('com emotion=happy, joy=1 durante VRMA ativo', () => {
    const vrm = makeMockVRM()
    vrm._vrmaAtivo = true
    vrm._mixer = { update: jest.fn() }
    animarAvatar(vrm, 0, 0.016, null, 1.0, null, true, null, 'happy')

    const happyCalls = vrm.expressionManager.setValue.mock.calls.filter(
      ([name]) => name === 'happy'
    )
    expect(happyCalls.length).toBeGreaterThan(0)
    expect(happyCalls[0][1]).toBe(1)
  })

  test('durante VRMA com eyesClosed=true, todos os outros emotion zera', () => {
    const vrm = makeMockVRM()
    vrm._vrmaAtivo = true
    vrm._mixer = { update: jest.fn() }
    animarAvatar(vrm, 0, 0.016, null, 1.0, null, true, null, 'happy')

    const calls = vrm.expressionManager.setValue.mock.calls
    const sadCalls = calls.filter(([name]) => name === 'sad')
    const angryCalls = calls.filter(([name]) => name === 'angry')
    const neutralCalls = calls.filter(([name]) => name === 'neutral')

    if (sadCalls.length) expect(sadCalls[0][1]).toBe(0)
    if (angryCalls.length) expect(angryCalls[0][1]).toBe(0)
    if (neutralCalls.length) expect(neutralCalls[0][1]).toBe(0)
  })
})
