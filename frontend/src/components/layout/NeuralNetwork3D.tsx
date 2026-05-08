import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Network() {
  const pointsRef = useRef<THREE.Points>(null!);
  const linesRef = useRef<THREE.LineSegments>(null!);
  const groupRef = useRef<THREE.Group>(null!);

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
    if (!pointsRef.current || !linesRef.current || !groupRef.current) return;
    
    // Smoothly follow the mouse cursor
    const mouseX = state.mouse.x * 2;
    const mouseY = state.mouse.y * 2;
    
    groupRef.current.position.x += (mouseX - groupRef.current.position.x) * 0.05;
    groupRef.current.position.y += (mouseY - groupRef.current.position.y) * 0.05;
    
    // Rotate slightly based on mouse
    groupRef.current.rotation.y += delta * 0.05 + (mouseX * 0.01);
    groupRef.current.rotation.x += delta * 0.02 - (mouseY * 0.01);

    let vertexpos = 0;
    let colorpos = 0;
    let numConnected = 0;

    const positionsArray = pointsRef.current.geometry.attributes.position.array as Float32Array;

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

          // Use white color as requested
          colors[colorpos++] = alpha;
          colors[colorpos++] = alpha;
          colors[colorpos++] = alpha;

          colors[colorpos++] = alpha;
          colors[colorpos++] = alpha;
          colors[colorpos++] = alpha;

          numConnected++;
        }
      }
    }

    linesRef.current.geometry.setDrawRange(0, numConnected * 2);
    linesRef.current.geometry.attributes.position.needsUpdate = true;
    linesRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
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
          size={0.06}
          color="#ffffff"
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
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

export default function NeuralNetwork3D() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-50 bg-[#020617]">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <fog attach="fog" args={['#020617', 2, 10]} />
        <Network />
      </Canvas>
    </div>
  );
}
