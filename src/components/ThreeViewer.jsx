import { Canvas } from '@react-three/fiber'
import { VRMAvatar } from './VRMAvatar'
import { OrbitControls } from '@react-three/drei'

export default function ThreeViewer({
  speaking = false,
  speechText = "",
  avatar = 'example.vrm',
  animation = null,
  animationLoop = true,
  onAnimationEnd = null,
  armAngle = 1.0,
  gesture = null,
  emotion = "neutral",
  lipSyncIntensity = 1,
  onFaceClick = () => { },
  eyesClosed = false,
}) {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 1.35, 1.8], fov: 30 }}
        onClick={onFaceClick}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} />
        <VRMAvatar
          avatar={avatar}
          animation={animation}
          animationLoop={animationLoop}
          onAnimationEnd={onAnimationEnd}
          speaking={speaking}
          speechText={speechText}
          armAngle={armAngle}
          gesture={gesture}
          emotion={emotion}
          lipSyncIntensity={lipSyncIntensity}
          eyesClosed={eyesClosed}
        />
        <OrbitControls target={[0, 1.3, 0]} minDistance={1.0} maxDistance={3.5}  />
      </Canvas>
    </div>
  )
}
