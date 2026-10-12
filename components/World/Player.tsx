/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';
import { LANE_WIDTH, GameStatus } from '../../types';
import { audio } from '../System/Audio';

// Physics Constants
const GRAVITY = 50;
const BASE_JUMP_FORCE = 16.5;

// Geometries for the Cyber Mecha-Runner
const TORSO_MAIN_GEO = new THREE.CylinderGeometry(0.24, 0.16, 0.58, 6);
const CHEST_PLATE_GEO = new THREE.BoxGeometry(0.34, 0.28, 0.16);
const CORE_REACTOR_GEO = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 6);
const WAIST_GEO = new THREE.CylinderGeometry(0.15, 0.17, 0.16, 6);

// Helmet & Visor
const HELMET_GEO = new THREE.BoxGeometry(0.26, 0.28, 0.3);
const HELMET_CREST_GEO = new THREE.ConeGeometry(0.06, 0.32, 4);
const VISOR_GEO = new THREE.BoxGeometry(0.28, 0.12, 0.16);
const HELMET_EAR_GEO = new THREE.BoxGeometry(0.06, 0.14, 0.1);

// Jetpack & Thrusters
const JETPACK_BODY_GEO = new THREE.BoxGeometry(0.32, 0.38, 0.14);
const JETPACK_NOZZLE_GEO = new THREE.CylinderGeometry(0.07, 0.09, 0.18, 8);
const THRUSTER_FLAME_GEO = new THREE.ConeGeometry(0.08, 0.45, 8);
const WINGLET_GEO = new THREE.BoxGeometry(0.18, 0.04, 0.12);

// Limbs & Armor
const SHOULDER_PAD_GEO = new THREE.BoxGeometry(0.18, 0.14, 0.18);
const UPPER_ARM_GEO = new THREE.BoxGeometry(0.11, 0.3, 0.11);
const FOREARM_GEO = new THREE.BoxGeometry(0.13, 0.32, 0.13);
const HAND_GEO = new THREE.BoxGeometry(0.09, 0.1, 0.09);

const UPPER_LEG_GEO = new THREE.BoxGeometry(0.15, 0.36, 0.15);
const LOWER_LEG_GEO = new THREE.BoxGeometry(0.16, 0.38, 0.16);
const BOOT_GEO = new THREE.BoxGeometry(0.17, 0.12, 0.24);
const BOOT_THRUSTER_GEO = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 8);

const SHADOW_GEO = new THREE.CircleGeometry(0.55, 32);
const AURA_RING_GEO = new THREE.RingGeometry(0.4, 0.52, 32);
const SLIDE_SPARKS_GEO = new THREE.PlaneGeometry(0.6, 0.2);

export const Player: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  const slideSparksRef = useRef<THREE.Mesh>(null);

  // Limb Refs for Skeletal Animation
  const leftArmGroup = useRef<THREE.Group>(null);
  const rightArmGroup = useRef<THREE.Group>(null);
  const leftForearm = useRef<THREE.Group>(null);
  const rightForearm = useRef<THREE.Group>(null);

  const leftLegGroup = useRef<THREE.Group>(null);
  const rightLegGroup = useRef<THREE.Group>(null);
  const leftLowerLeg = useRef<THREE.Group>(null);
  const rightLowerLeg = useRef<THREE.Group>(null);

  const leftFlameRef = useRef<THREE.Mesh>(null);
  const rightFlameRef = useRef<THREE.Mesh>(null);
  const leftBootFlameRef = useRef<THREE.Mesh>(null);
  const rightBootFlameRef = useRef<THREE.Mesh>(null);

  const { 
    status, 
    laneCount, 
    takeDamage, 
    hasDoubleJump, 
    activateImmortality, 
    isImmortalityActive, 
    speed,
    getEquippedSkin,
    setIsSliding
  } = useStore();
  
  const currentSkin = getEquippedSkin();

  const [lane, setLane] = React.useState(0);
  const targetX = useRef(0);
  
  // Physics & Animation States
  const isJumping = useRef(false);
  const velocityY = useRef(0);
  const jumpsPerformed = useRef(0); 
  const spinRotation = useRef(0);

  // Slide mechanic
  const isSlidingRef = useRef(false);
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mobile Touch Gestures
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);

  const isInvincible = useRef(false);
  const lastDamageTime = useRef(0);

  // Dynamic Materials based on Equipped Skin & Immortality state
  const materials = useMemo(() => {
    const isImmortal = isImmortalityActive;
    const skin = currentSkin;

    const primaryColor = isImmortal ? '#ffd700' : skin.primaryColor;
    const secondaryColor = isImmortal ? '#ff9100' : skin.secondaryColor;
    const accentColor = isImmortal ? '#ffffff' : skin.accentColor;
    const glowColor = isImmortal ? '#ffffaa' : skin.glowColor;
    const thrusterColor = isImmortal ? '#ffe066' : skin.thrusterColor;

    return {
      chassisArmor: new THREE.MeshStandardMaterial({
        color: secondaryColor,
        roughness: 0.25,
        metalness: 0.85,
      }),
      platedArmor: new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.2,
        metalness: 0.8,
        emissive: isImmortal ? '#ffaa00' : primaryColor,
        emissiveIntensity: isImmortal ? 0.8 : 0.25,
      }),
      accentTrim: new THREE.MeshStandardMaterial({
        color: accentColor,
        roughness: 0.3,
        metalness: 0.6,
        emissive: accentColor,
        emissiveIntensity: 0.45,
      }),
      reactorCore: new THREE.MeshBasicMaterial({
        color: glowColor,
      }),
      visor: new THREE.MeshStandardMaterial({
        color: glowColor,
        roughness: 0.1,
        metalness: 0.9,
        emissive: glowColor,
        emissiveIntensity: 1.6,
      }),
      thrusterFlame: new THREE.MeshBasicMaterial({
        color: thrusterColor,
        transparent: true,
        opacity: 0.9,
      }),
      shadow: new THREE.MeshBasicMaterial({
        color: '#000000',
        opacity: 0.35,
        transparent: true,
      }),
      aura: new THREE.MeshBasicMaterial({
        color: isImmortal ? '#ffd700' : glowColor,
        transparent: true,
        opacity: isImmortal ? 0.8 : 0.25,
        side: THREE.DoubleSide,
      }),
      slideSparks: new THREE.MeshBasicMaterial({
        color: '#ffea00',
        transparent: true,
        opacity: 0.8,
      })
    };
  }, [isImmortalityActive, currentSkin]);

  // Reset physics on start/restart
  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      isJumping.current = false;
      jumpsPerformed.current = 0;
      velocityY.current = 0;
      spinRotation.current = 0;
      isSlidingRef.current = false;
      setIsSliding(false);
      if (groupRef.current) groupRef.current.position.y = 0;
      if (bodyRef.current) {
        bodyRef.current.position.y = 1.05;
        bodyRef.current.rotation.x = 0;
      }
    }
  }, [status, setIsSliding]);
  
  // Clamp lane if track width changes
  useEffect(() => {
    const maxLane = Math.floor(laneCount / 2);
    if (Math.abs(lane) > maxLane) {
      setLane(l => Math.max(Math.min(l, maxLane), -maxLane));
    }
  }, [laneCount, lane]);

  // --- Jump Controller ---
  const triggerJump = () => {
    // If sliding, cancel slide immediately to jump
    if (isSlidingRef.current) {
      isSlidingRef.current = false;
      setIsSliding(false);
      if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
    }

    const maxJumps = hasDoubleJump ? 2 : 1;
    const jumpForce = BASE_JUMP_FORCE * (currentSkin.bonusJump || 1.0);

    if (!isJumping.current) {
      audio.playJump(false);
      isJumping.current = true;
      jumpsPerformed.current = 1;
      velocityY.current = jumpForce;
    } else if (jumpsPerformed.current < maxJumps) {
      audio.playJump(true);
      jumpsPerformed.current += 1;
      velocityY.current = jumpForce * 1.05;
      spinRotation.current = 0;
    }
  };

  // --- Slide Controller ---
  const triggerSlide = () => {
    // If mid-air, fast dive to the ground
    if (isJumping.current) {
      velocityY.current = -35;
      return;
    }

    if (isSlidingRef.current) return;

    audio.playSlide();
    isSlidingRef.current = true;
    setIsSliding(true);

    const slideDuration = currentSkin.id === 'NEON_PHANTOM' ? 500 : 620;

    if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
    slideTimerRef.current = setTimeout(() => {
      isSlidingRef.current = false;
      setIsSliding(false);
    }, slideDuration);
  };

  // --- PC / Laptop Keyboard Controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== GameStatus.PLAYING) return;
      const maxLane = Math.floor(laneCount / 2);

      // Move Left
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setLane(l => Math.max(l - 1, -maxLane));
      } 
      // Move Right
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setLane(l => Math.min(l + 1, maxLane));
      } 
      // Jump
      else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        triggerJump();
      } 
      // Slide / Duck
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        triggerSlide();
      } 
      // Skill
      else if (e.key === ' ' || e.key === 'Enter' || e.key === 'Shift') {
        activateImmortality();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, laneCount, hasDoubleJump, activateImmortality, currentSkin]);

  // --- Mobile Touch Gestures (Intuitive Swipe Controls, Zero Virtual Buttons) ---
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        touchStartTime.current = Date.now();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (status !== GameStatus.PLAYING) return;
      if (e.changedTouches.length === 0) return;

      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      const touchDuration = Date.now() - touchStartTime.current;
      const maxLane = Math.floor(laneCount / 2);

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Swipe detected (at least 20px displacement)
      if (absX > 20 || absY > 20) {
        if (absX > absY) {
          // Horizontal Swipe (Lane Change)
          if (deltaX > 0) {
            setLane(l => Math.min(l + 1, maxLane));
          } else {
            setLane(l => Math.max(l - 1, -maxLane));
          }
        } else {
          // Vertical Swipe
          if (deltaY < -20) {
            // Swipe Up -> Jump
            triggerJump();
          } else if (deltaY > 20) {
            // Swipe Down -> Slide / Duck
            triggerSlide();
          }
        }
      } else if (touchDuration < 250 && absX < 12 && absY < 12) {
        // Quick Screen Tap -> Activate Immortality
        activateImmortality();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [status, laneCount, hasDoubleJump, activateImmortality, currentSkin]);

  // Sync state to group userData for LevelManager collision checks
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.userData = {
        isPlayer: true,
        isSliding: isSlidingRef.current,
        isJumping: isJumping.current
      };
    }
  });

  // --- Main Animation Frame Loop ---
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (status !== GameStatus.PLAYING && status !== GameStatus.SHOP) return;

    // 1. Horizontal Smooth Lane Lerp
    targetX.current = lane * LANE_WIDTH;
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x, 
      targetX.current, 
      delta * 16 
    );

    // 2. Jump Physics & Aerial Flip
    if (isJumping.current) {
      groupRef.current.position.y += velocityY.current * delta;
      velocityY.current -= GRAVITY * delta;

      if (groupRef.current.position.y <= 0) {
        groupRef.current.position.y = 0;
        isJumping.current = false;
        jumpsPerformed.current = 0;
        velocityY.current = 0;
        if (bodyRef.current) bodyRef.current.rotation.x = 0;
      }

      if (jumpsPerformed.current === 2 && bodyRef.current) {
        spinRotation.current -= delta * 18;
        if (spinRotation.current < -Math.PI * 2) spinRotation.current = -Math.PI * 2;
        bodyRef.current.rotation.x = spinRotation.current;
      }
    }

    // 3. Banking Lean on Lane Change
    const xDiff = targetX.current - groupRef.current.position.x;
    groupRef.current.rotation.z = -xDiff * 0.25; 
    groupRef.current.rotation.y = -xDiff * 0.15;

    // 4. Slide vs Run vs Jump Animation
    const isSliding = isSlidingRef.current;

    if (isSliding) {
      // Aerodynamic Low Slide Pose
      if (bodyRef.current) {
        bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, 0.42, delta * 20);
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, -0.65, delta * 20);
      }

      // Arms back, legs forward
      if (leftArmGroup.current) leftArmGroup.current.rotation.x = 1.2;
      if (rightArmGroup.current) rightArmGroup.current.rotation.x = 1.2;
      if (leftLegGroup.current) leftLegGroup.current.rotation.x = -1.2;
      if (rightLegGroup.current) rightLegGroup.current.rotation.x = -1.2;

      if (slideSparksRef.current) {
        slideSparksRef.current.visible = true;
        slideSparksRef.current.rotation.z += delta * 15;
      }

    } else {
      if (slideSparksRef.current) slideSparksRef.current.visible = false;

      const runCycle = state.clock.elapsedTime * (16 + Math.min(10, (speed || 20) * 0.4));
      const armSwing = Math.sin(runCycle);
      const legSwing = Math.sin(runCycle);

      if (!isJumping.current) {
        if (leftArmGroup.current) leftArmGroup.current.rotation.x = armSwing * 0.75;
        if (rightArmGroup.current) rightArmGroup.current.rotation.x = -armSwing * 0.75;
        if (leftForearm.current) leftForearm.current.rotation.x = -Math.abs(armSwing) * 0.4 - 0.2;
        if (rightForearm.current) rightForearm.current.rotation.x = -Math.abs(-armSwing) * 0.4 - 0.2;

        if (leftLegGroup.current) leftLegGroup.current.rotation.x = -legSwing * 0.9;
        if (rightLegGroup.current) rightLegGroup.current.rotation.x = legSwing * 0.9;
        if (leftLowerLeg.current) leftLowerLeg.current.rotation.x = Math.max(0, legSwing * 0.8);
        if (rightLowerLeg.current) rightLowerLeg.current.rotation.x = Math.max(0, -legSwing * 0.8);

        if (bodyRef.current && jumpsPerformed.current !== 2) {
          bodyRef.current.position.y = 1.05 + Math.abs(Math.sin(runCycle * 2)) * 0.08;
          bodyRef.current.rotation.x = 0.14;
        }
      } else {
        // Jump Pose
        const lerpSpeed = delta * 12;
        if (leftArmGroup.current) leftArmGroup.current.rotation.x = THREE.MathUtils.lerp(leftArmGroup.current.rotation.x, -1.8, lerpSpeed);
        if (rightArmGroup.current) rightArmGroup.current.rotation.x = THREE.MathUtils.lerp(rightArmGroup.current.rotation.x, -1.8, lerpSpeed);
        if (leftLegGroup.current) leftLegGroup.current.rotation.x = THREE.MathUtils.lerp(leftLegGroup.current.rotation.x, 0.6, lerpSpeed);
        if (rightLegGroup.current) rightLegGroup.current.rotation.x = THREE.MathUtils.lerp(rightLegGroup.current.rotation.x, -0.4, lerpSpeed);
        if (leftLowerLeg.current) leftLowerLeg.current.rotation.x = THREE.MathUtils.lerp(leftLowerLeg.current.rotation.x, 1.0, lerpSpeed);
        if (rightLowerLeg.current) rightLowerLeg.current.rotation.x = THREE.MathUtils.lerp(rightLowerLeg.current.rotation.x, 0.4, lerpSpeed);

        if (bodyRef.current && jumpsPerformed.current !== 2) {
          bodyRef.current.position.y = 1.05;
          bodyRef.current.rotation.x = 0.08;
        }
      }
    }

    // 5. Thruster Plasma Flares
    const flameFlicker = 1.0 + Math.sin(state.clock.elapsedTime * 40) * 0.25;
    const boostScale = isSliding ? 1.8 : (isJumping.current ? 1.6 : (1.0 + Math.min(0.6, speed * 0.015)));
    const finalFlameScale = flameFlicker * boostScale;

    if (leftFlameRef.current) leftFlameRef.current.scale.set(finalFlameScale, finalFlameScale, finalFlameScale);
    if (rightFlameRef.current) rightFlameRef.current.scale.set(finalFlameScale, finalFlameScale, finalFlameScale);

    if (leftBootFlameRef.current) leftBootFlameRef.current.scale.set(boostScale, boostScale, boostScale);
    if (rightBootFlameRef.current) rightBootFlameRef.current.scale.set(boostScale, boostScale, boostScale);

    // 6. Dynamic Shadow & Ground Aura
    const height = groupRef.current.position.y;
    if (shadowRef.current) {
      const scale = Math.max(0.2, 1 - (height / 3.0) * 0.6);
      shadowRef.current.scale.set(scale, scale, isSliding ? scale * 1.5 : scale);
      const mat = shadowRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = Math.max(0.08, 0.35 - (height / 3.0) * 0.25);
    }

    if (auraRef.current) {
      const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 6) * 0.15;
      auraRef.current.scale.set(pulse, pulse, pulse);
      auraRef.current.rotation.z += delta * 2;
    }

    // 7. Damage Invincibility Strobe
    if (isInvincible.current) {
      if (Date.now() - lastDamageTime.current > 1600) {
        isInvincible.current = false;
        groupRef.current.visible = true;
      } else {
        groupRef.current.visible = Math.floor(Date.now() / 60) % 2 === 0;
      }
    } else {
      groupRef.current.visible = true;
    }
  });

  // Damage Event Listener
  useEffect(() => {
    const checkHit = () => {
      if (isInvincible.current || isImmortalityActive) return;
      audio.playDamage();
      takeDamage();
      isInvincible.current = true;
      lastDamageTime.current = Date.now();
    };
    window.addEventListener('player-hit', checkHit);
    return () => window.removeEventListener('player-hit', checkHit);
  }, [takeDamage, isImmortalityActive]);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Main Articulated Mecha Body */}
      <group ref={bodyRef} position={[0, 1.05, 0]}>
        
        {/* Torso & Chest */}
        <mesh castShadow position={[0, 0.26, 0]} geometry={TORSO_MAIN_GEO} material={materials.chassisArmor} />
        <mesh position={[0, 0.32, 0.1]} geometry={CHEST_PLATE_GEO} material={materials.platedArmor} />
        <mesh position={[0, 0.32, 0.19]} rotation={[Math.PI / 2, 0, 0]} geometry={CORE_REACTOR_GEO} material={materials.reactorCore} />
        <mesh position={[0, -0.05, 0]} geometry={WAIST_GEO} material={materials.chassisArmor} />

        {/* Jetpack with Dual Nozzles & Winglets */}
        <group position={[0, 0.26, -0.18]}>
          <mesh geometry={JETPACK_BODY_GEO} material={materials.chassisArmor} />
          <mesh position={[-0.26, 0.08, 0]} geometry={WINGLET_GEO} material={materials.accentTrim} />
          <mesh position={[0.26, 0.08, 0]} geometry={WINGLET_GEO} material={materials.accentTrim} />

          {/* Left Jetpack Thruster */}
          <group position={[-0.11, -0.16, 0]}>
            <mesh rotation={[Math.PI, 0, 0]} geometry={JETPACK_NOZZLE_GEO} material={materials.chassisArmor} />
            <mesh ref={leftFlameRef} position={[0, -0.22, 0]} rotation={[Math.PI, 0, 0]} geometry={THRUSTER_FLAME_GEO} material={materials.thrusterFlame} />
          </group>

          {/* Right Jetpack Thruster */}
          <group position={[0.11, -0.16, 0]}>
            <mesh rotation={[Math.PI, 0, 0]} geometry={JETPACK_NOZZLE_GEO} material={materials.chassisArmor} />
            <mesh ref={rightFlameRef} position={[0, -0.22, 0]} rotation={[Math.PI, 0, 0]} geometry={THRUSTER_FLAME_GEO} material={materials.thrusterFlame} />
          </group>
        </group>

        {/* Helmet & Visor */}
        <group position={[0, 0.68, 0.02]}>
          <mesh castShadow geometry={HELMET_GEO} material={materials.platedArmor} />
          <mesh position={[0, 0.2, -0.04]} rotation={[0.3, 0, 0]} geometry={HELMET_CREST_GEO} material={materials.accentTrim} />
          <mesh position={[0, 0.02, 0.12]} geometry={VISOR_GEO} material={materials.visor} />
          <mesh position={[-0.15, 0.02, 0]} geometry={HELMET_EAR_GEO} material={materials.accentTrim} />
          <mesh position={[0.15, 0.02, 0]} geometry={HELMET_EAR_GEO} material={materials.accentTrim} />
        </group>

        {/* Arms */}
        <group ref={leftArmGroup} position={[-0.32, 0.44, 0]}>
          <mesh castShadow geometry={SHOULDER_PAD_GEO} material={materials.platedArmor} />
          <mesh position={[0, -0.14, 0]} geometry={UPPER_ARM_GEO} material={materials.chassisArmor} />
          <group ref={leftForearm} position={[0, -0.28, 0]}>
            <mesh castShadow position={[0, -0.12, 0]} geometry={FOREARM_GEO} material={materials.platedArmor} />
            <mesh position={[0, -0.32, 0]} geometry={HAND_GEO} material={materials.accentTrim} />
          </group>
        </group>

        <group ref={rightArmGroup} position={[0.32, 0.44, 0]}>
          <mesh castShadow geometry={SHOULDER_PAD_GEO} material={materials.platedArmor} />
          <mesh position={[0, -0.14, 0]} geometry={UPPER_ARM_GEO} material={materials.chassisArmor} />
          <group ref={rightForearm} position={[0, -0.28, 0]}>
            <mesh castShadow position={[0, -0.12, 0]} geometry={FOREARM_GEO} material={materials.platedArmor} />
            <mesh position={[0, -0.32, 0]} geometry={HAND_GEO} material={materials.accentTrim} />
          </group>
        </group>

        {/* Legs */}
        <group ref={leftLegGroup} position={[-0.13, -0.14, 0]}>
          <mesh castShadow position={[0, -0.16, 0]} geometry={UPPER_LEG_GEO} material={materials.platedArmor} />
          <group ref={leftLowerLeg} position={[0, -0.34, 0]}>
            <mesh castShadow position={[0, -0.18, 0]} geometry={LOWER_LEG_GEO} material={materials.chassisArmor} />
            <mesh castShadow position={[0, -0.36, 0.05]} geometry={BOOT_GEO} material={materials.platedArmor} />
            <mesh ref={leftBootFlameRef} position={[0, -0.43, 0]} rotation={[Math.PI, 0, 0]} geometry={BOOT_THRUSTER_GEO} material={materials.thrusterFlame} />
          </group>
        </group>

        <group ref={rightLegGroup} position={[0.13, -0.14, 0]}>
          <mesh castShadow position={[0, -0.16, 0]} geometry={UPPER_LEG_GEO} material={materials.platedArmor} />
          <group ref={rightLowerLeg} position={[0, -0.34, 0]}>
            <mesh castShadow position={[0, -0.18, 0]} geometry={LOWER_LEG_GEO} material={materials.chassisArmor} />
            <mesh castShadow position={[0, -0.36, 0.05]} geometry={BOOT_GEO} material={materials.platedArmor} />
            <mesh ref={rightBootFlameRef} position={[0, -0.43, 0]} rotation={[Math.PI, 0, 0]} geometry={BOOT_THRUSTER_GEO} material={materials.thrusterFlame} />
          </group>
        </group>

      </group>

      {/* Ground Slide Sparks */}
      <mesh ref={slideSparksRef} visible={false} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={SLIDE_SPARKS_GEO} material={materials.slideSparks} />

      {/* Dynamic Ground Shadow */}
      <mesh ref={shadowRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={SHADOW_GEO} material={materials.shadow} />
      
      {/* Magnetic Hover Aura */}
      <mesh ref={auraRef} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={AURA_RING_GEO} material={materials.aura} />
    </group>
  );
};