/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';
import { LANE_WIDTH, getThemeForLevel } from '../../types';

const StarField: React.FC = () => {
  const speed = useStore(state => state.speed);
  const count = 3500;
  const meshRef = useRef<THREE.Points>(null);
  
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#70d6ff'),
      new THREE.Color('#ff70a6'),
      new THREE.Color('#ffd670'),
      new THREE.Color('#a0c4ff')
    ];

    for (let i = 0; i < count; i++) {
      let x = (Math.random() - 0.5) * 450;
      let y = (Math.random() - 0.5) * 220 + 55;
      let z = -600 + Math.random() * 700;

      if (Math.abs(x) < 18 && y > -5 && y < 22) {
        if (x < 0) x -= 18;
        else x += 18;
      }

      pos[i * 3] = x;     
      pos[i * 3 + 1] = y; 
      pos[i * 3 + 2] = z; 

      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    const pos = meshRef.current.geometry.attributes.position.array as Float32Array;
    const activeSpeed = speed > 0 ? speed : 2;

    for (let i = 0; i < count; i++) {
      let z = pos[i * 3 + 2];
      z += activeSpeed * delta * 2.2;
      
      if (z > 120) {
        z = -600 - Math.random() * 50;
        let x = (Math.random() - 0.5) * 450;
        let y = (Math.random() - 0.5) * 220 + 55;
        if (Math.abs(x) < 18 && y > -5 && y < 22) {
          if (x < 0) x -= 18;
          else x += 18;
        }
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
      }
      pos[i * 3 + 2] = z;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.65}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  );
};

const LaneGuides: React.FC = () => {
  const { laneCount, speed, level } = useStore();
  const chevronRef = useRef<THREE.Group>(null);
  const theme = useMemo(() => getThemeForLevel(level), [level]);
  const trackWidth = laneCount * LANE_WIDTH;
  
  const separators = useMemo(() => {
    const lines: number[] = [];
    const startX = -trackWidth / 2;
    for (let i = 0; i <= laneCount; i++) {
      lines.push(startX + (i * LANE_WIDTH));
    }
    return lines;
  }, [laneCount, trackWidth]);

  useFrame((state, delta) => {
    if (chevronRef.current) {
      const activeSpeed = speed > 0 ? speed : 5;
      chevronRef.current.position.z += activeSpeed * delta;
      if (chevronRef.current.position.z > 20) {
        chevronRef.current.position.z -= 20;
      }
    }
  });

  return (
    <group position={[0, 0.02, 0]}>
      {/* Outer Glow Bed with Dynamic Theme Colors */}
      <mesh position={[0, -0.06, -30]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[trackWidth + 8, 240]} />
        <meshBasicMaterial color={theme.trackGlowColor} transparent opacity={0.65} />
      </mesh>

      {/* Main Track Floor - Upgrades Material per Level Theme */}
      <mesh position={[0, -0.02, -30]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[trackWidth, 240]} />
        <meshStandardMaterial 
          color={theme.trackColor} 
          roughness={0.2} 
          metalness={0.75} 
          emissive={theme.trackGlowColor} 
          emissiveIntensity={0.6} 
        />
      </mesh>

      {/* Outer Border Glowing Rails - Themed */}
      <mesh position={[-trackWidth / 2, 0.12, -30]}>
        <boxGeometry args={[0.16, 0.26, 240]} />
        <meshBasicMaterial color={theme.railLeftColor} />
      </mesh>
      <mesh position={[trackWidth / 2, 0.12, -30]}>
        <boxGeometry args={[0.16, 0.26, 240]} />
        <meshBasicMaterial color={theme.railRightColor} />
      </mesh>

      {/* Dynamic Lane Separator Beams */}
      {separators.map((x, i) => (
        <mesh key={`sep-${level}-${i}`} position={[x, 0.01, -30]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 240]} /> 
          <meshBasicMaterial 
            color={i === 0 || i === separators.length - 1 ? theme.railLeftColor : theme.separatorColor} 
            transparent 
            opacity={0.65} 
          />
        </mesh>
      ))}

      {/* Animated Center Track Chevrons */}
      <group ref={chevronRef}>
        {[-80, -60, -40, -20, 0].map((zOffset, idx) => (
          <mesh key={`chev-${level}-${idx}`} position={[0, 0.03, zOffset]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.8, 1.4]} />
            <meshBasicMaterial color={theme.chevronColor} transparent opacity={0.45} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

const RetroSun: React.FC = () => {
  const { level } = useStore();
  const theme = useMemo(() => getThemeForLevel(level), [level]);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const sunGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      matRef.current.uniforms.uColorTop.value.set(theme.sunTopColor);
      matRef.current.uniforms.uColorBottom.value.set(theme.sunBottomColor);
    }
    if (sunGroupRef.current) {
      sunGroupRef.current.position.y = 32 + Math.sin(state.clock.elapsedTime * 0.25) * 1.5;
      sunGroupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorTop: { value: new THREE.Color(theme.sunTopColor) },
    uColorBottom: { value: new THREE.Color(theme.sunBottomColor) }
  }), [theme.sunTopColor, theme.sunBottomColor]);

  return (
    <group ref={sunGroupRef} position={[0, 32, -190]}>
      {/* Sun Glow Corona / Backing Aura */}
      <mesh position={[0, 0, -5]}>
        <circleGeometry args={[48, 32]} />
        <meshBasicMaterial 
          color={theme.sunBottomColor} 
          transparent 
          opacity={0.3} 
          side={THREE.DoubleSide} 
        />
      </mesh>

      {/* Sun Sphere with animated synthwave scanlines */}
      <mesh>
        <sphereGeometry args={[36, 32, 32]} />
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          transparent
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec2 vUv;
            uniform float uTime;
            uniform vec3 uColorTop;
            uniform vec3 uColorBottom;

            void main() {
              vec3 color = mix(uColorBottom, uColorTop, vUv.y);
              float stripeFreq = 38.0;
              float stripeSpeed = 0.8;
              float stripes = sin((vUv.y * stripeFreq) - (uTime * stripeSpeed));
              float stripeMask = smoothstep(0.18, 0.28, stripes);
              float scanlineFade = smoothstep(0.75, 0.25, vUv.y); 
              vec3 finalColor = mix(color, color * 0.15, (1.0 - stripeMask) * scanlineFade);
              gl_FragColor = vec4(finalColor, 1.0);
            }
          `}
        />
      </mesh>
    </group>
  );
};

const MovingGrid: React.FC = () => {
  const { speed, level } = useStore();
  const theme = useMemo(() => getThemeForLevel(level), [level]);
  const meshRef = useRef<THREE.Mesh>(null);
  const offsetRef = useRef(0);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      const activeSpeed = speed > 0 ? speed : 5;
      offsetRef.current += activeSpeed * delta;
      const cellSize = 10;
      meshRef.current.position.z = -100 + (offsetRef.current % cellSize);
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, -100]}>
      <planeGeometry args={[360, 420, 36, 42]} />
      <meshBasicMaterial 
        color={theme.gridColor} 
        wireframe 
        transparent 
        opacity={0.3} 
      />
    </mesh>
  );
};

export const Environment: React.FC = () => {
  const level = useStore(state => state.level);
  const theme = useMemo(() => getThemeForLevel(level), [level]);

  return (
    <>
      {/* Dynamic sky and fog updated per level */}
      <color attach="background" args={[theme.skyColor]} />
      <fog attach="fog" args={[theme.fogColor, 75, 260]} />
      
      {/* 1. Themed Ambient Light */}
      <ambientLight intensity={0.9} color={theme.ambientColor} />

      {/* 2. Key Overhead Directional Light */}
      <directionalLight 
        position={[10, 32, 18]} 
        intensity={2.6} 
        color={theme.directionalColor} 
        castShadow 
      />

      {/* 3. Rim / Fill Directional Light */}
      <directionalLight 
        position={[-12, 18, -15]} 
        intensity={1.8} 
        color={theme.fillColor} 
      />

      {/* 4. Player Forward Track Uplight */}
      <pointLight 
        position={[0, 4.5, 4]} 
        intensity={2.8} 
        color={theme.railLeftColor} 
        distance={45} 
        decay={1.8} 
      />

      {/* 5. Horizon Sun Radiance */}
      <pointLight 
        position={[0, 35, -160]} 
        intensity={4.5} 
        color={theme.sunBottomColor} 
        distance={280} 
        decay={1.5} 
      />

      <StarField />
      <MovingGrid />
      <LaneGuides />
      <RetroSun />
    </>
  );
};
