import { VRMUtils } from '@pixiv/three-vrm'
import { Box3, Vector3 } from 'three'


const POSE = {
  spread: 0.12,
  forward: 0.18,
  elbow: 0.25,
}


const VOWEL_NAMES = {
  aa: ["aa", "A", "a"],
  ih: ["ih", "I", "i"],
  uu: ["ou", "U", "uu", "u"],
  eh: ["ee", "E", "eh", "e"],
  oh: ["oh", "O", "o"],
}

export function setExpr(expr, names, value) {
  for (const name of names) {
    if (expr.getExpression?.(name)) {
      expr.setValue(name, value)
    }
  }
}


export function prepararAvatar(scene, vrm) {
  VRMUtils.removeUnnecessaryVertices(scene)
  VRMUtils.combineSkeletons(scene)
  VRMUtils.combineMorphs(vrm)

  VRMUtils.rotateVRM0(vrm)

  vrm.scene.traverse((obj) => {
    obj.frustumCulled = false
  })

  if (scene && typeof scene.updateWorldMatrix === 'function') {
    const box = new Box3().setFromObject(scene)
    const center = new Vector3()
    box.getCenter(center)

    scene.position.set(-center.x, -box.min.y, -center.z)
  }

  vrm._isVRM0 = vrm.meta?.metaVersion === "0"

  const head = vrm.humanoid?.getNormalizedBoneNode("head")
  vrm._headBind = head ? { x: head.rotation.x, y: head.rotation.y } : { x: 0, y: 0 }
}

function suavizarValor(atual, alvo, delta, velocidade = 6) {
  return atual + (alvo - atual) * Math.min(1, delta * velocidade)
}

function applyArmPose(humanoid, armAngle, sway, isVRM0) {
  const sign = isVRM0 ? 1 : -1
  const leftUpperArm = humanoid?.getNormalizedBoneNode("leftUpperArm")
  const rightUpperArm = humanoid?.getNormalizedBoneNode("rightUpperArm")
  const leftLowerArm = humanoid?.getNormalizedBoneNode("leftLowerArm")
  const rightLowerArm = humanoid?.getNormalizedBoneNode("rightLowerArm")

  if (leftUpperArm) {
    leftUpperArm.rotation.set(POSE.forward, 0, sign * (armAngle - POSE.spread + sway))
  }
  if (rightUpperArm) {
    rightUpperArm.rotation.set(POSE.forward, 0, sign * (-armAngle + POSE.spread - sway))
  }
  if (leftLowerArm) leftLowerArm.rotation.set(0, -POSE.elbow, 0)
  if (rightLowerArm) rightLowerArm.rotation.set(0, POSE.elbow, 0)
}


function applyIdleMotion(humanoid, t, breath) {
  const chest = humanoid?.getNormalizedBoneNode("chest")
  if (chest) {
    chest.rotation.x = breath * 0.03
    chest.rotation.z = Math.sin(t * 0.9 + 3) * 0.008
  }

  const spine = humanoid?.getNormalizedBoneNode("spine")
  if (spine) {
    spine.rotation.y = Math.sin(t * 0.6) * 0.02
    spine.rotation.x = Math.sin(t * 0.4 + 2) * 0.008
  }
}



function atualizarGesto(vrm, t, delta, gesture) {
  if (gesture) {
    if (vrm._gestoAtual !== gesture) {
      vrm._gestoAtual = gesture
      vrm._gestoInicio = t
      vrm._gestoFade = 1
    }
    return gesture
  }

  if (vrm._gestoFade && vrm._gestoFade > 0) {
    vrm._gestoFade = Math.max(0, vrm._gestoFade - delta / 0.35)
    if (vrm._gestoFade <= 0) {
      vrm._gestoAtual = null
      vrm._gestoInicio = null
    }
    return vrm._gestoAtual
  }
  return null
}


function applyHead(vrm, humanoid, t, delta, gesture, mouse) {
  const head = humanoid?.getNormalizedBoneNode("head")
  if (!head) return

  const bind = vrm._headBind ?? { x: 0, y: 0 }

  let offX = Math.sin(t * 0.35 + 1.3) * 0.012 + Math.sin(t * 1.9) * 0.005
  let offY = Math.sin(t * 0.55 + 2.1) * 0.012

  if (gesture) {
    const inicio = vrm._gestoInicio ?? t
    const entrada = Math.min(1, (t - inicio) / 0.22)
    const fade = vrm._gestoFade ?? 1
    const osc = Math.sin(t * 7) * 0.2 * entrada * fade
    if (gesture === "nod") offX = osc
    else offY = osc
  } else if (mouse) {
    offX += -mouse.y * 0.1
    offY += mouse.x * 0.15
  }

  head.rotation.x = bind.x + offX
  head.rotation.y = bind.y + offY
}


function applyEmotion(expr, emotion) {
  const map = {
    happy: { happy: 1, sad: 0, angry: 0, relaxed: 0, neutral: 0 },
    sad: { happy: 0, sad: 1, angry: 0, relaxed: 0, neutral: 0 },
    angry: { happy: 0, sad: 0, angry: 1, relaxed: 0, neutral: 0 },
    playful: { happy: 0.8, sad: 0, angry: 0, relaxed: 0.2, neutral: 0 },
    neutral: { happy: 0, sad: 0, angry: 0, relaxed: 0, neutral: 1 },
  }
  const v = map[emotion] || map.neutral

  setExpr(expr, ["happy", "Joy"], v.happy)
  setExpr(expr, ["sad", "Sorrow"], v.sad)
  setExpr(expr, ["angry", "Angry"], v.angry)
  setExpr(expr, ["relaxed", "Fun"], v.relaxed)
  setExpr(expr, ["neutral", "Neutral"], v.neutral)
}

function applyBlink(vrm, expr, t, eyesClosed = false) {
  if (eyesClosed) {
    vrm._blinkAte = null
    vrm._proximoPiscar = null
    setExpr(expr, ["blink", "Blink"], 1)
    return
  }

  if (vrm._proximoPiscar == null) {
    vrm._proximoPiscar = t + 0.8 + Math.random() * 3
  }

  if (vrm._blinkAte == null && t >= vrm._proximoPiscar) {
    vrm._blinkAte = t + 0.13
  }

  if (vrm._blinkAte != null) {
    if (t < vrm._blinkAte) {
      setExpr(expr, ["blink", "Blink"], 1)
      return
    }
    vrm._blinkAte = null
    vrm._proximoPiscar = t + 1.2 + Math.random() * 3.5
  }

  setExpr(expr, ["blink", "Blink"], 0)
}

function applyLipSync(expr, intensities) {
  const v = intensities || {}
  setExpr(expr, VOWEL_NAMES.aa, v.aa ?? 0)
  setExpr(expr, VOWEL_NAMES.ih, v.ih ?? 0)
  setExpr(expr, VOWEL_NAMES.uu, v.uu ?? 0)
  setExpr(expr, VOWEL_NAMES.eh, v.eh ?? 0)
  setExpr(expr, VOWEL_NAMES.oh, v.oh ?? 0)
}

/**
 * @param {object} vrm 
 * @param {number} t 
 * @param {number} delta 
 * @param {object} intensities 
 * @param {number} armAngle 
 * @param {string|null} gesture 
 * @param {boolean} eyesClosed 
 * @param {{x:number,y:number}|null} mouse 
 */
export function animarAvatar(vrm, t, delta, intensities, armAngle = 1.0, gesture = null, eyesClosed = false, mouse = null, emotion = "neutral") {
  const humanoid = vrm.humanoid

  vrm._mixer?.update(delta)

 
  if (vrm._vrmaAtivo === true) {
    const expr = vrm.expressionManager
    if (expr) {
      applyBlink(vrm, expr, t, eyesClosed)
      applyLipSync(expr, intensities)
      applyEmotion(expr, emotion)
    }

    vrm.update(delta)
    return
  }

  const base = Math.sin(t * 1.5)
  const respiracao = base * (0.6 + 0.4 * Math.sin(t * 0.23 + 1.7))

  if (vrm._bracoAtual == null) vrm._bracoAtual = armAngle
  vrm._bracoAtual = suavizarValor(vrm._bracoAtual, armAngle, delta)

  const gestoAtivo = atualizarGesto(vrm, t, delta, gesture)

  applyArmPose(humanoid, vrm._bracoAtual, respiracao * 0.02, vrm._isVRM0)
  applyIdleMotion(humanoid, t, respiracao)
  applyHead(vrm, humanoid, t, delta, gestoAtivo, mouse)

  const expr = vrm.expressionManager
  if (expr) {
    applyBlink(vrm, expr, t, eyesClosed)
    applyLipSync(expr, intensities)
    applyEmotion(expr, emotion)
  }

  vrm.update(delta)
}