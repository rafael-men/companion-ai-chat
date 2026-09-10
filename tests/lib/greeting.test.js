import { animarAvatar } from '../../src/lib/vrm.js'

jest.mock('@pixiv/three-vrm', () => ({
  VRMUtils: {
    removeUnnecessaryVertices: jest.fn(),
    combineSkeletons: jest.fn(),
    combineMorphs: jest.fn(),
    rotateVRM0: jest.fn(),
  },
}))

function makeMockVRM(metaVersion = '1.0') {
  const bones = new Map()
  const makeBone = () => ({ rotation: { set: jest.fn(), x: 0, y: 0, z: 0 } })
  for (const name of ['head', 'leftUpperArm', 'rightUpperArm', 'leftLowerArm', 'rightLowerArm', 'chest', 'spine']) {
    bones.set(name, makeBone())
  }

  const expressions = new Map(
    ['happy', 'sad', 'angry', 'relaxed', 'neutral', 'blink', 'Blink', 'Joy', 'Sorrow', 'Angry', 'Fun', 'Neutral', 'aa', 'ih', 'ou', 'ee', 'oh']
      .map(n => [n, 0])
  )

  return {
    humanoid: {
      getNormalizedBoneNode: jest.fn((name) => bones.get(name) || null),
    },
    expressionManager: {
      getExpression: jest.fn((name) => expressions.has(name) ? name : null),
      setValue: jest.fn((name, value) => { expressions.set(name, value) }),
      _expressions: expressions,
    },
    scene: { traverse: jest.fn() },
    meta: { metaVersion },
    _isVRM0: metaVersion === '0',
    _headBind: { x: 0, y: 0 },
    update: jest.fn(),
  }
}

describe('greeting: olhos fechados + sorriso durante animação', () => {
  test('durante greeting (eyesClosed=true, emotion=happy), blink fica 1', () => {
    const vrm = makeMockVRM()
    animarAvatar(vrm, 0, 0.016, null, 1.0, null, true, null, 'happy')

    const blinkCalls = vrm.expressionManager.setValue.mock.calls.filter(
      ([name]) => name === 'blink' || name === 'Blink'
    )
    expect(blinkCalls.length).toBeGreaterThan(0)
    expect(blinkCalls[0][1]).toBe(1)
  })

  test('durante greeting, happy fica 1 e outros emotion zera', () => {
    const vrm = makeMockVRM()
    animarAvatar(vrm, 0, 0.016, null, 1.0, null, true, null, 'happy')

    const calls = vrm.expressionManager.setValue.mock.calls
    const happyCalls = calls.filter(([name]) => name === 'happy')
    const sadCalls = calls.filter(([name]) => name === 'sad')
    const angryCalls = calls.filter(([name]) => name === 'angry')
    const neutralCalls = calls.filter(([name]) => name === 'neutral')

    expect(happyCalls.length).toBeGreaterThan(0)
    expect(happyCalls[0][1]).toBe(1)

    if (sadCalls.length) expect(sadCalls[0][1]).toBe(0)
    if (angryCalls.length) expect(angryCalls[0][1]).toBe(0)
    if (neutralCalls.length) expect(neutralCalls[0][1]).toBe(0)
  })

  test('durante greeting com VRMA ativo, skeleton não é alterado', () => {
    const vrm = makeMockVRM()
    vrm._vrmaAtivo = true
    vrm._mixer = { update: jest.fn() }

    animarAvatar(vrm, 0, 0.016, null, 1.0, null, true, null, 'happy')

    const leftUpperArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm')
    expect(leftUpperArm.rotation.set).not.toHaveBeenCalled()
    expect(vrm.update).toHaveBeenCalledWith(0.016)
  })

  test('durante greeting, lip-sync continua funcionando', () => {
    const vrm = makeMockVRM()
    const intensities = { aa: 0.8, ih: 0.2, uu: 0, eh: 0, oh: 0 }
    animarAvatar(vrm, 0, 0.016, intensities, 1.0, null, true, null, 'happy')

    const aaCalls = vrm.expressionManager.setValue.mock.calls.filter(
      ([name]) => name === 'aa'
    )
    expect(aaCalls.length).toBeGreaterThan(0)
    expect(aaCalls[0][1]).toBe(0.8)
  })

  test('após greeting terminar (eyesClosed=false, emotion=neutral), blink volta ao procedural', () => {
    const vrm = makeMockVRM()
    vrm._proximoPiscar = 5
    vrm._blinkAte = null

    animarAvatar(vrm, 0, 0.016, null, 1.0, null, false, null, 'neutral')

    const blinkCalls = vrm.expressionManager.setValue.mock.calls.filter(
      ([name]) => name === 'blink' || name === 'Blink'
    )
    expect(blinkCalls.length).toBeGreaterThan(0)
    expect(blinkCalls[0][1]).toBe(0)
  })
})

describe('VRM 0: olhos fechados + sorriso durante greeting', () => {
  test('durante greeting VRM 0, usa nomes Joy/Angry/Sorrow', () => {
    const vrm = makeMockVRM('0')
    animarAvatar(vrm, 0, 0.016, null, 1.0, null, true, null, 'happy')

    const calls = vrm.expressionManager.setValue.mock.calls
    const blinkCalls = calls.filter(([name]) => name === 'blink' || name === 'Blink')
    expect(blinkCalls.length).toBeGreaterThan(0)
    expect(blinkCalls[0][1]).toBe(1)
  })
})

describe('greeting em dispositivos móveis (window.innerWidth pequeno)', () => {
  test('greeting funciona com mouse default (0,0)', () => {
    const vrm = makeMockVRM()
    animarAvatar(vrm, 0, 0.016, null, 1.0, null, true, { x: 0, y: 0 }, 'happy')

    const blinkCalls = vrm.expressionManager.setValue.mock.calls.filter(
      ([name]) => name === 'blink' || name === 'Blink'
    )
    expect(blinkCalls.length).toBeGreaterThan(0)
    expect(blinkCalls[0][1]).toBe(1)
  })
})
