import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import { useEffect, useRef, useState } from "react";
import { prepararAvatar, animarAvatar } from "@/lib/vrm";
import { carregarVRMA, pararAnimacaoVRMA, tocarAnimacaoVRMA } from "@/lib/vrma";
import { useTextLipSync } from "@/hooks/useTextLipSync";

export const VRMAvatar = ({ avatar, animation = null, animationLoop = true, onAnimationEnd = null, speaking = false, speechText = "", armAngle = 1.0, gesture = null, emotion = "neutral", lipSyncIntensity = 1, eyesClosed = false, ...props }) => {
    const { scene, userData } = useGLTF(`models/${avatar}`, undefined, undefined, (loader) => {
        loader.register((parser) => {
            return new VRMLoaderPlugin(parser);
        });
    });


    const intensities = useTextLipSync(speechText, speaking, lipSyncIntensity);
    const intensitiesRef = useRef(intensities);
    intensitiesRef.current = intensities;


    const armAngleRef = useRef(armAngle);
    armAngleRef.current = armAngle;
    const gestureRef = useRef(gesture);
    gestureRef.current = gesture;
    const eyesClosedRef = useRef(eyesClosed);
    eyesClosedRef.current = eyesClosed;


    const mouseRef = useRef({ x: 0, y: 0 });
    useEffect(() => {
        const onMove = (e) => {
            mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
        };
        window.addEventListener("mousemove", onMove);
        return () => window.removeEventListener("mousemove", onMove);
    }, []);

    useEffect(() => {
        prepararAvatar(scene, userData.vrm);
    }, [scene]);

    const [vrma, setVrma] = useState(null);
    useEffect(() => {
        let ativo = true;
        setVrma(null);
        if (!animation) return;
        carregarVRMA(`assets/animations/${animation}`)
            .then((a) => { if (ativo) setVrma(a); })
            .catch(() => { if (ativo) setVrma(null); });
        return () => { ativo = false; };
    }, [animation]);

    useEffect(() => {
        const vrm = userData.vrm;
        if (!vrm) return;
        if (vrma) tocarAnimacaoVRMA(vrm, vrma, { loop: animationLoop, onEnd: onAnimationEnd });
        else pararAnimacaoVRMA(vrm);
    }, [vrma, scene, animationLoop, onAnimationEnd]);

    useFrame((state, delta) => {
        const vrm = userData.vrm;
        if (!vrm) return;
        animarAvatar(
            vrm,
            state.clock.elapsedTime,
            delta,
            intensitiesRef.current,
            armAngleRef.current,
            gestureRef.current,
            eyesClosedRef.current,
            mouseRef.current,
            emotion
        );
    });

    return (
        <group {...props} scale={1.25} position={[0, -0.35, 0]}>
            <primitive object={scene} />
        </group>
    );
};
