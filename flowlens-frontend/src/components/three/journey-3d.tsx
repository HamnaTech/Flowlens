import { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from 'framer-motion';

type NodeType = 'flow' | 'friction' | 'neutral';

interface JourneyNode {
  label: string;
  position: [number, number, number];
  type: NodeType;
}

const NODES: JourneyNode[] = [
  { label: 'Visitor', position: [-3.5, 0.2, 0], type: 'neutral' },
  { label: 'Landing', position: [-2.2, 0.6, 0.3], type: 'flow' },
  { label: 'Product', position: [-0.8, 0.1, -0.2], type: 'flow' },
  { label: 'Signup', position: [0.6, 0.8, 0.2], type: 'friction' },
  { label: 'Checkout', position: [2.0, 0.3, -0.3], type: 'friction' },
  { label: 'Conversion', position: [3.5, 0.6, 0.1], type: 'flow' },
];

const NODE_RADIUS = 0.22;

function getCurve(start: THREE.Vector3, end: THREE.Vector3, index: number): THREE.CatmullRomCurve3 {
  const mid = start.clone().lerp(end, 0.5);
  const offset = new THREE.Vector3(0, 0.8 + (index % 2) * 0.3, (index % 2 === 0 ? 0.3 : -0.3));
  mid.add(offset);
  return new THREE.CatmullRomCurve3([start, mid, end]);
}

function JourneyNodeMesh({ node, index }: { node: JourneyNode; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const reduce = useReducedMotion();
  const isFriction = node.type === 'friction';
  const isFlow = node.type === 'flow';
  const color = isFriction ? '#D14A2D' : isFlow ? '#2F6F62' : '#8A8F94';

  useFrame((state) => {
    if (!meshRef.current || reduce) return;
    const t = state.clock.elapsedTime;
    if (isFriction) {
      const pulse = 1 + Math.sin(t * 2 + index) * 0.08;
      meshRef.current.scale.setScalar(pulse);
    } else {
      meshRef.current.position.y = node.position[1] + Math.sin(t * 0.8 + index) * 0.05;
    }
  });

  return (
    <group position={node.position}>
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[NODE_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.1}
          emissive={color}
          emissiveIntensity={isFriction ? 0.25 : 0.12}
        />
      </mesh>
      {isFriction && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[NODE_RADIUS + 0.08, NODE_RADIUS + 0.12, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}
      <Text
        position={[0, -0.5, 0]}
        fontSize={0.18}
        color="#16181A"
        anchorX="center"
        anchorY="middle"
      >
        {node.label}
      </Text>
    </group>
  );
}

function Particle({
  curve,
  delay,
  speed,
  frictionIndex,
  reduce,
}: {
  curve: THREE.CatmullRomCurve3;
  delay: number;
  speed: number;
  frictionIndex: number;
  reduce: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const progress = useRef(0);
  const diverted = useRef(false);
  const divertOffset = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    if (reduce) {
      const pos = curve.getPointAt(0.5);
      meshRef.current.position.copy(pos);
      return;
    }

    const t = state.clock.elapsedTime;
    progress.current += delta * speed;

    if (progress.current >= 1) {
      progress.current = 0;
      diverted.current = false;
      divertOffset.current.set(0, 0, 0);
    }

    if (t < delay) return;

    const point = curve.getPointAt(Math.min(progress.current, 1));

    if (frictionIndex >= 0) {
      const distToFriction = Math.abs(progress.current - 0.5);
      if (distToFriction < 0.15) {
        if (!diverted.current && progress.current > 0.4 && progress.current < 0.5 && Math.random() < 0.005) {
          diverted.current = true;
          divertOffset.current.set(
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.3) * 1,
            (Math.random() - 0.5) * 1,
          );
        }
        if (diverted.current) {
          const blended = point.clone().lerp(point.clone().add(divertOffset.current), Math.min((progress.current - 0.4) * 3, 1));
          meshRef.current.position.copy(blended);
          meshRef.current.scale.setScalar(0.06);
        } else {
          progress.current -= delta * speed * 0.5;
          meshRef.current.position.copy(point);
        }
        return;
      }
    }

    meshRef.current.position.copy(point);
  });

  return (
    <mesh ref={meshRef} scale={0.08}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={frictionIndex >= 0 ? '#D14A2D' : '#2F6F62'} transparent opacity={0.8} />
    </mesh>
  );
}

function JourneyPaths() {
  const reduce = useReducedMotion();

  const curves = useMemo(() => {
    return NODES.slice(0, -1).map((node, i) => {
      const start = new THREE.Vector3(...node.position);
      const end = new THREE.Vector3(...NODES[i + 1].position);
      return getCurve(start, end, i);
    });
  }, []);

  return (
    <>
      {curves.map((curve, i) => {
        const points = curve.getPoints(50);
        const nextNode = NODES[i + 1];
        const isFrictionPath = nextNode.type === 'friction';
        return (
          <Line
            key={`path-${i}`}
            points={points}
            color={isFrictionPath ? '#D14A2D' : '#2F6F62'}
            lineWidth={1.5}
            transparent
            opacity={0.3}
          />
        );
      })}

      {curves.map((curve, i) => {
        const nextNode = NODES[i + 1];
        const frictionIndex = nextNode.type === 'friction' ? i : -1;
        return Array.from({ length: 3 }).map((_, j) => (
          <Particle
            key={`particle-${i}-${j}`}
            curve={curve}
            delay={j * 0.8}
            speed={0.15 + j * 0.03}
            frictionIndex={frictionIndex}
            reduce={!!reduce}
          />
        ));
      })}
    </>
  );
}

function CameraController() {
  const { camera, pointer } = useThree();
  const reduce = useReducedMotion();

  useFrame(() => {
    if (reduce) return;
    const targetX = pointer.x * 0.5;
    const targetY = pointer.y * 0.3;
    camera.position.x += (targetX - camera.position.x) * 0.03;
    camera.position.y += (2.5 + targetY - camera.position.y) * 0.03;
    camera.lookAt(0, 0.8, 0);
  });

  return null;
}

export function Journey3D() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div className="relative h-full w-full" role="img" aria-label="3D visualization of a user journey with flow and friction points">
      <Canvas
        camera={{ position: [0, 2.5, 8], fov: 45 }}
        dpr={isMobile ? 1 : Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio : 1)}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 5]} intensity={0.8} castShadow />
        <directionalLight position={[-3, 2, -2]} intensity={0.3} />
        <CameraController />
        <group position={[-0.5, -0.5, 0]}>
          {NODES.map((node, i) => (
            <JourneyNodeMesh key={node.label} node={node} index={i} />
          ))}
          <JourneyPaths />
        </group>
      </Canvas>
    </div>
  );
}

export function HeroSceneFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-secondary" />
    </div>
  );
}

export function HeroScene() {
  return (
    <Suspense fallback={<HeroSceneFallback />}>
      <Journey3D />
    </Suspense>
  );
}
