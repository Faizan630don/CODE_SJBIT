import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Network() {
  const pointsRef = useRef<THREE.Points>(null!);
  const linesRef = useRef<THREE.LineSegments>(null!);

  const particleCount = 100;
  const maxDistance = 1.2;

  const { particles, positions, colors } = useMemo(() => {
    const particles = new Float32Array(particleCount * 3);
    const positions = new Float32Array(particleCount * particleCount * 3);
    const colors = new Float32Array(particleCount * particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      particles[i * 3] = (Math.random() - 0.5) * 8;
      particles[i * 3 + 1] = (Math.random() - 0.5) * 8;
      particles[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return { particles, positions, colors };
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current || !linesRef.current) return;
    
    // Slowly rotate the entire network
    pointsRef.current.rotation.y += delta * 0.05;
    linesRef.current.rotation.y += delta * 0.05;
    pointsRef.current.rotation.x += delta * 0.02;
    linesRef.current.rotation.x += delta * 0.02;

    let vertexpos = 0;
    let colorpos = 0;
    let numConnected = 0;

    const positionsArray = pointsRef.current.geometry.attributes.position.array as Float32Array;

    // Optional: slowly move particles
    for (let i = 0; i < particleCount; i++) {
      // We could add simple drifting here, but rotation is enough for a smooth effect
    }

    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dx = positionsArray[i * 3] - positionsArray[j * 3];
        const dy = positionsArray[i * 3 + 1] - positionsArray[j * 3 + 1];
        const dz = positionsArray[i * 3 + 2] - positionsArray[j * 3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < maxDistance * maxDistance) {
          const alpha = 1.0 - Math.sqrt(distSq) / maxDistance;

          positions[vertexpos++] = positionsArray[i * 3];
          positions[vertexpos++] = positionsArray[i * 3 + 1];
          positions[vertexpos++] = positionsArray[i * 3 + 2];

          positions[vertexpos++] = positionsArray[j * 3];
          positions[vertexpos++] = positionsArray[j * 3 + 1];
          positions[vertexpos++] = positionsArray[j * 3 + 2];

          // Use a brand-matching color (brand-500 is roughly #8b5cf6, purple)
          // We will use 139, 92, 246 rgb values mapped to 0-1
          colors[colorpos++] = 0.55 * alpha;
          colors[colorpos++] = 0.36 * alpha;
          colors[colorpos++] = 0.96 * alpha;

          colors[colorpos++] = 0.55 * alpha;
          colors[colorpos++] = 0.36 * alpha;
          colors[colorpos++] = 0.96 * alpha;

          numConnected++;
        }
      }
    }

    linesRef.current.geometry.setDrawRange(0, numConnected * 2);
    linesRef.current.geometry.attributes.position.needsUpdate = true;
    linesRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particles}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#a78bfa"
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

export default function NeuralNetwork3D() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <fog attach="fog" args={['#0f172a', 2, 10]} />
        <Network />
      </Canvas>
    </div>
  );
}
