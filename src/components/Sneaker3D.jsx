
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Html,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";

function SneakerModel({ interacting, onReady }) {
  const group = useRef();
  const { scene } = useGLTF("/models/sneaker.glb");

  // Clone and automatically center and resize the sneaker.
  const model = useMemo(() => {
    const cloned = scene.clone(true);

    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const largest = Math.max(size.x, size.y, size.z);
    const scale = largest > 0 ? 3.2 / largest : 1;

    cloned.position.set(
      -center.x * scale,
      -center.y * scale,
      -center.z * scale
    );

    cloned.scale.setScalar(scale);

    return cloned;
  }, [scene]);

  // Notify the parent after the model is available, without updating state during render.
  useEffect(() => { onReady?.(true); }, [scene, onReady]);

  // Subtle floating animation and automatic rotation.
  useFrame((state, delta) => {
    if (!group.current) return;

    group.current.position.y =
      Math.sin(state.clock.elapsedTime * 1.1) * 0.035;

    if (!interacting.current) {
      group.current.rotation.y += delta * 0.16;
    }
  });

  return (
    <group ref={group} rotation={[0.08, -2.3, 0]}>
      <primitive object={model} />
    </group>
  );
}

function ModelLoader() {
  return (
    <Html center>
      <div className="sneaker3d-loader">
        <span className="sneaker3d-loader-dot" />
        LOADING 3D MODEL
      </div>
    </Html>
  );
}

export default function Sneaker3D() {
  const controls = useRef();
  const interacting = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [modelReady, setModelReady] = useState(false);

  function resetView() {
    controls.current?.reset();
    interacting.current = false;
    setDragging(false);
  }

  return (
    <div className="sneaker3d-stage">
      {!modelReady && <div className="sneaker3d-image-preview" aria-label="Interactive 3D sneaker is loading"><div className="sneaker3d-preview-mark" aria-hidden="true">SF<span>01</span></div><span>PREPARING 3D EXPERIENCE</span></div>}
      {/* Decorative background */}
      <div className="sneaker3d-orbit sneaker3d-orbit-outer" />
      <div className="sneaker3d-orbit sneaker3d-orbit-inner" />

      <div className="sneaker3d-crosshair sneaker3d-crosshair-top" />
      <div className="sneaker3d-crosshair sneaker3d-crosshair-bottom" />

      {/* Top information */}
      <div className="sneaker3d-topline">
        <span>SF / 001</span>

        <span className="sneaker3d-live">
          <span />
          3D OBJECT
        </span>
      </div>

      {/* 3D scene */}
      <Canvas
        className="sneaker3d-canvas"
        camera={{
          position: [0, 0.15, 5.2],
          fov: 32,
        }}
        dpr={[1, 1.25]}
        gl={{
          antialias: true,
          alpha: true,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
        }}
      >
        {/* Soft studio lighting */}
        <ambientLight intensity={1.2} />

        <directionalLight
          position={[3, 5, 5]}
          intensity={2.2}
        />

        <directionalLight
          position={[-4, 2, -3]}
          intensity={1.3}
        />

        <spotLight
          position={[0, 5, 1]}
          intensity={1}
          angle={0.7}
          penumbra={1}
        />

         <Suspense fallback={<ModelLoader />}>
          <SneakerModel
            interacting={interacting}
            onReady={setModelReady}
          />

          <ContactShadows
            position={[0, -0.8, 0]}
            opacity={0.22}
            scale={3.5}
            blur={3}
            far={2}
          />
        </Suspense>

        {/* Drag to rotate; zoom and pan disabled */}
        <OrbitControls
          ref={controls}
          makeDefault
          enablePan={false}
          enableZoom={false}
          enableDamping
          dampingFactor={0.08}
          minPolarAngle={Math.PI / 2.8}
          maxPolarAngle={Math.PI / 1.8}
          rotateSpeed={0.65}
          onStart={() => {
            interacting.current = true;
            setDragging(true);
          }}
          onEnd={() => {
            interacting.current = false;
            setDragging(false);
          }}
        />
      </Canvas>

      {/* Bottom controls */}
      <div className="sneaker3d-bottomline">
        <span>
          {dragging ? "ROTATING OBJECT" : "DRAG TO EXPLORE"}
        </span>

        <button
          type="button"
          className="sneaker3d-reset"
          onClick={resetView}
          aria-label="Reset sneaker view"
          title="Reset view"
        >
          ↺ RESET VIEW
        </button>
      </div>
    </div>
  );
}

// Drei caches the GLTF result in memory; browser HTTP caching also reuses the file between visits.
// Drei caches the GLTF result in memory; browser HTTP caching also reuses the file between visits.
useGLTF.preload("/models/sneaker.glb");
