/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text3D, Center } from '@react-three/drei';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../../store';
import { GameObject, ObjectType, LANE_WIDTH, SPAWN_DISTANCE, REMOVE_DISTANCE, GameStatus, GEMINI_COLORS, getThemeForLevel } from '../../types';
import { audio } from '../System/Audio';

// Geometry Constants
const OBSTACLE_HEIGHT = 1.6;
const OBSTACLE_GEOMETRY = new THREE.ConeGeometry(0.9, OBSTACLE_HEIGHT, 6);
const OBSTACLE_GLOW_GEO = new THREE.ConeGeometry(0.9, OBSTACLE_HEIGHT, 6);
const OBSTACLE_RING_GEO = new THREE.RingGeometry(0.6, 0.9, 6);

const GEM_GEOMETRY = new THREE.IcosahedronGeometry(0.32, 0);

// Alien Geometries
const ALIEN_BODY_GEO = new THREE.CylinderGeometry(0.6, 0.3, 0.3, 8);
const ALIEN_DOME_GEO = new THREE.SphereGeometry(0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
const ALIEN_EYE_GEO = new THREE.SphereGeometry(0.1);

// Missile Geometries
const MISSILE_CORE_GEO = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8);
const MISSILE_RING_GEO = new THREE.TorusGeometry(0.16, 0.02, 16, 32);

// Moving Patrol Drone Geometries
const DRONE_CORE_GEO = new THREE.OctahedronGeometry(0.42, 0);
const DRONE_RING_GEO = new THREE.TorusGeometry(0.55, 0.035, 12, 24);
const DRONE_EYE_GEO = new THREE.SphereGeometry(0.14, 8, 8);

// Laser Gate Geometries
const PYLON_GEO = new THREE.CylinderGeometry(0.12, 0.16, 2.8, 8);
const PYLON_CAP_GEO = new THREE.SphereGeometry(0.2, 8, 8);
const LASER_BEAM_GEO = new THREE.CylinderGeometry(0.07, 0.07, 1.0, 8);
const TALL_GRID_BAR_GEO = new THREE.BoxGeometry(0.05, 2.2, 0.05);
const SLIDE_SIGN_GEO = new THREE.BoxGeometry(1.6, 0.35, 0.1);

// Shadow Geometries
const SHADOW_LETTER_GEO = new THREE.PlaneGeometry(2, 0.6);
const SHADOW_GEM_GEO = new THREE.CircleGeometry(0.6, 32);
const SHADOW_ALIEN_GEO = new THREE.CircleGeometry(0.8, 32);
const SHADOW_MISSILE_GEO = new THREE.PlaneGeometry(0.15, 3);
const SHADOW_DRONE_GEO = new THREE.CircleGeometry(0.65, 16);
const SHADOW_GATE_GEO = new THREE.PlaneGeometry(2.2, 0.4);
const SHADOW_DEFAULT_GEO = new THREE.CircleGeometry(0.8, 6);

// Shop Geometries
const SHOP_FRAME_GEO = new THREE.BoxGeometry(1, 7, 1);
const SHOP_BACK_GEO = new THREE.BoxGeometry(1, 5, 1.2);
const SHOP_OUTLINE_GEO = new THREE.BoxGeometry(1, 7.2, 0.8);
const SHOP_FLOOR_GEO = new THREE.PlaneGeometry(1, 4);

const PARTICLE_COUNT = 600;
const BASE_LETTER_INTERVAL = 140; 

const getLetterInterval = (level: number) => {
    return BASE_LETTER_INTERVAL * Math.pow(1.35, Math.max(0, level - 1));
};

const BASE_MISSILE_SPEED = 30;
const FONT_URL = "https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_bold.typeface.json";

// --- Particle System ---
const ParticleSystem: React.FC = () => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    const particles = useMemo(() => new Array(PARTICLE_COUNT).fill(0).map(() => ({
        life: 0,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        rot: new THREE.Vector3(),
        rotVel: new THREE.Vector3(),
        color: new THREE.Color()
    })), []);

    useEffect(() => {
        const handleExplosion = (e: CustomEvent) => {
            const { position, color } = e.detail;
            let spawned = 0;
            const burstAmount = 40; 

            for(let i = 0; i < PARTICLE_COUNT; i++) {
                const p = particles[i];
                if (p.life <= 0) {
                    p.life = 1.0 + Math.random() * 0.5; 
                    p.pos.set(position[0], position[1], position[2]);
                    
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    const speed = 2 + Math.random() * 10;
                    
                    p.vel.set(
                        Math.sin(phi) * Math.cos(theta),
                        Math.sin(phi) * Math.sin(theta),
                        Math.cos(phi)
                    ).multiplyScalar(speed);

                    p.rot.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                    p.rotVel.set(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(5);
                    
                    p.color.set(color);
                    
                    spawned++;
                    if (spawned >= burstAmount) break;
                }
            }
        };
        
        window.addEventListener('particle-burst', handleExplosion as any);
        return () => window.removeEventListener('particle-burst', handleExplosion as any);
    }, [particles]);

    useFrame((state, delta) => {
        if (!mesh.current) return;
        const safeDelta = Math.min(delta, 0.1);

        particles.forEach((p, i) => {
            if (p.life > 0) {
                p.life -= safeDelta * 1.5;
                p.pos.addScaledVector(p.vel, safeDelta);
                p.vel.y -= safeDelta * 5; 
                p.vel.multiplyScalar(0.98);

                p.rot.x += p.rotVel.x * safeDelta;
                p.rot.y += p.rotVel.y * safeDelta;
                
                dummy.position.copy(p.pos);
                const scale = Math.max(0, p.life * 0.25);
                dummy.scale.set(scale, scale, scale);
                dummy.rotation.set(p.rot.x, p.rot.y, p.rot.z);
                dummy.updateMatrix();
                
                mesh.current!.setMatrixAt(i, dummy.matrix);
                mesh.current!.setColorAt(i, p.color);
            } else {
                dummy.scale.set(0,0,0);
                dummy.updateMatrix();
                mesh.current!.setMatrixAt(i, dummy.matrix);
            }
        });
        
        mesh.current.instanceMatrix.needsUpdate = true;
        if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, PARTICLE_COUNT]}>
            <octahedronGeometry args={[0.5, 0]} />
            <meshBasicMaterial toneMapped={false} transparent opacity={0.9} />
        </instancedMesh>
    );
};

const getRandomLane = (laneCount: number) => {
    const max = Math.floor(laneCount / 2);
    return Math.floor(Math.random() * (max * 2 + 1)) - max;
};

export const LevelManager: React.FC = () => {
  const { 
    status, 
    speed, 
    collectGem, 
    collectLetter, 
    collectedLetters,
    laneCount,
    setDistance,
    updateDistanceAndHazard,
    openShop,
    level
  } = useStore();
  
  const objectsRef = useRef<GameObject[]>([]);
  const [, setRenderTrigger] = useState(0);
  const prevStatus = useRef(status);
  const prevLevel = useRef(level);

  const playerObjRef = useRef<THREE.Object3D | null>(null);
  const distanceTraveled = useRef(0);
  const nextLetterDistance = useRef(BASE_LETTER_INTERVAL);
  const lastDistanceSync = useRef(0);

  // Handle resets and infinite transitions
  useEffect(() => {
    const isRestart = status === GameStatus.PLAYING && prevStatus.current === GameStatus.GAME_OVER;
    const isMenuReset = status === GameStatus.MENU;
    const isLevelUp = level !== prevLevel.current && status === GameStatus.PLAYING;

    if (isMenuReset || isRestart) {
        objectsRef.current = [];
        setRenderTrigger(t => t + 1);
        
        distanceTraveled.current = 0;
        lastDistanceSync.current = 0;
        nextLetterDistance.current = getLetterInterval(1);

    } else if (isLevelUp && level > 1) {
        // Endless progression: soft reset deep fog objects to spawn Cyber Portal for this level
        objectsRef.current = objectsRef.current.filter(obj => obj.position[2] > -80);

        objectsRef.current.push({
            id: uuidv4(),
            type: ObjectType.SHOP_PORTAL,
            position: [0, 0, -100], 
            active: true,
        });
        
        nextLetterDistance.current = distanceTraveled.current - SPAWN_DISTANCE + getLetterInterval(level);
        setRenderTrigger(t => t + 1);
        
    } else if (status === GameStatus.GAME_OVER) {
        setDistance(Math.floor(distanceTraveled.current));
    }
    
    prevStatus.current = status;
    prevLevel.current = level;
  }, [status, level, setDistance]);

  useFrame((state) => {
      if (!playerObjRef.current) {
          const group = state.scene.getObjectByName('PlayerGroup');
          if (group && group.children.length > 0) {
              playerObjRef.current = group.children[0];
          }
      }
  });

  useFrame((state, delta) => {
    if (status !== GameStatus.PLAYING) return;

    const safeDelta = Math.min(delta, 0.05); 
    const dist = speed * safeDelta;
    
    distanceTraveled.current += dist;

    // Periodically sync distance and hazard difficulty to store
    if (distanceTraveled.current - lastDistanceSync.current >= 4) {
      lastDistanceSync.current = distanceTraveled.current;
      updateDistanceAndHazard(distanceTraveled.current);
    }

    // Dynamic Distance & Endless Level Difficulty Multiplier
    const currentDist = distanceTraveled.current;
    const difficulty = 1.0 + (currentDist / 420) + ((level - 1) * 0.35);

    let hasChanges = false;
    let playerPos = new THREE.Vector3(0, 0, 0);
    let isSliding = false;
    
    if (playerObjRef.current) {
        playerObjRef.current.getWorldPosition(playerPos);
        const userData = playerObjRef.current.userData || playerObjRef.current.parent?.userData;
        if (userData && userData.isSliding) {
            isSliding = true;
        }
    }

    // 1. Move & Update Entities
    const currentObjects = objectsRef.current;
    const keptObjects: GameObject[] = [];
    const newSpawns: GameObject[] = [];

    for (const obj of currentObjects) {
        let moveAmount = dist;
        
        if (obj.type === ObjectType.MISSILE) {
            const missileSpeed = BASE_MISSILE_SPEED + (difficulty * 5);
            moveAmount += missileSpeed * safeDelta;
        }

        const prevZ = obj.position[2];
        obj.position[2] += moveAmount;

        // Dynamic Moving Drone lateral oscillation
        if (obj.type === ObjectType.MOVING_DRONE && obj.active) {
            const patrolSpeed = obj.patrolSpeed || 2.5;
            const patrolAmp = obj.patrolAmplitude || (LANE_WIDTH * 0.9);
            const baseX = obj.baseX ?? obj.position[0];
            obj.position[0] = baseX + Math.sin(state.clock.elapsedTime * patrolSpeed) * patrolAmp;
        }
        
        // Alien AI logic - triggers missiles when approaching
        if (obj.type === ObjectType.ALIEN && obj.active && !obj.hasFired) {
             const fireDistance = -95 - Math.min(25, difficulty * 8);
             if (obj.position[2] > fireDistance) {
                 obj.hasFired = true;
                 
                 newSpawns.push({
                     id: uuidv4(),
                     type: ObjectType.MISSILE,
                     position: [obj.position[0], 1.0, obj.position[2] + 2],
                     active: true,
                     color: '#ff0055'
                 });
                 hasChanges = true;
                 
                 window.dispatchEvent(new CustomEvent('particle-burst', { 
                    detail: { position: obj.position, color: '#ff00ff' } 
                 }));
             }
        }

        let keep = true;
        if (obj.active) {
            const zThreshold = 2.0; 
            const inZZone = (prevZ < playerPos.z + zThreshold) && (obj.position[2] > playerPos.z - zThreshold);
            
            // SHOP PORTAL COLLISION
            if (obj.type === ObjectType.SHOP_PORTAL) {
                const dz = Math.abs(obj.position[2] - playerPos.z);
                if (dz < 2.2) { 
                     openShop();
                     obj.active = false;
                     hasChanges = true;
                     keep = false; 
                }
            } else if (inZZone) {
                const dx = Math.abs(obj.position[0] - playerPos.x);
                const collisionTolerance = (obj.type === ObjectType.LASER_GATE) ? 1.05 : 0.88;

                if (dx < collisionTolerance) {
                     const isHazard = 
                        obj.type === ObjectType.OBSTACLE || 
                        obj.type === ObjectType.ALIEN || 
                        obj.type === ObjectType.MISSILE ||
                        obj.type === ObjectType.MOVING_DRONE ||
                        obj.type === ObjectType.LASER_GATE;
                     
                     if (isHazard) {
                         // Hitbox height depends on whether player is crouching/sliding!
                         const playerBottom = playerPos.y;
                         const playerTop = isSliding ? (playerPos.y + 0.55) : (playerPos.y + 1.8);

                         let objBottom = obj.position[1] - 0.5;
                         let objTop = obj.position[1] + 0.5;

                         if (obj.type === ObjectType.OBSTACLE) {
                             objBottom = 0;
                             objTop = OBSTACLE_HEIGHT;
                         } else if (obj.type === ObjectType.MISSILE) {
                             objBottom = 0.5;
                             objTop = 1.5;
                         } else if (obj.type === ObjectType.MOVING_DRONE) {
                             objBottom = 0.4;
                             objTop = 2.0;
                         } else if (obj.type === ObjectType.LASER_GATE) {
                             if (obj.canSlideUnder) {
                                 // Overhead high barrier: beam is at 1.0 to 2.4. A sliding player ducks under it!
                                 objBottom = 0.95;
                                 objTop = 2.4;
                             } else if (obj.isTallLaser) {
                                 // Impassable wall: cannot be jumped over or slid under
                                 objBottom = 0;
                                 objTop = 2.8;
                             } else {
                                 // Low laser gate: beam at 0.8, can be jumped over
                                 objBottom = 0;
                                 objTop = 1.25;
                             }
                         }

                         const isHit = (playerBottom < objTop) && (playerTop > objBottom);

                         if (isHit) { 
                             window.dispatchEvent(new Event('player-hit'));
                             obj.active = false; 
                             hasChanges = true;
                             
                             window.dispatchEvent(new CustomEvent('particle-burst', { 
                                 detail: { position: obj.position, color: '#ff2255' } 
                             }));
                         }
                     } else {
                         // Items: Gems & Letters
                         const dy = Math.abs(obj.position[1] - playerPos.y);
                         if (dy < 2.5) {
                            if (obj.type === ObjectType.GEM) {
                                collectGem(obj.points || 50);
                                audio.playGemCollect();
                            }
                            if (obj.type === ObjectType.LETTER && obj.targetIndex !== undefined) {
                                collectLetter(obj.targetIndex);
                                audio.playLetterCollect();
                            }
                            
                            window.dispatchEvent(new CustomEvent('particle-burst', { 
                                detail: { 
                                    position: obj.position, 
                                    color: obj.color || '#ffffff' 
                                } 
                            }));

                            obj.active = false;
                            hasChanges = true;
                         }
                     }
                }
            }
        }

        if (obj.position[2] > REMOVE_DISTANCE) {
            keep = false;
            hasChanges = true;
        }

        if (keep) {
            keptObjects.push(obj);
        }
    }

    if (newSpawns.length > 0) {
        keptObjects.push(...newSpawns);
    }

    // 2. Progressive Endless Spawning Logic
    let furthestZ = 0;
    const staticObjects = keptObjects.filter(o => o.type !== ObjectType.MISSILE);
    
    if (staticObjects.length > 0) {
        furthestZ = Math.min(...staticObjects.map(o => o.position[2]));
    } else {
        furthestZ = -20;
    }

    if (furthestZ > -SPAWN_DISTANCE) {
         const baseGap = Math.max(7.2, 14.5 - (difficulty * 1.8));
         const minGap = baseGap + (speed * 0.22);
         const spawnZ = Math.min(furthestZ - minGap, -SPAWN_DISTANCE);
         
         const isLetterDue = distanceTraveled.current >= nextLetterDistance.current;

         if (isLetterDue) {
             const lane = getRandomLane(laneCount);
             const target = ['G','E','M','I','N','I'];
             const availableIndices = target.map((_, i) => i).filter(i => !collectedLetters.includes(i));

             if (availableIndices.length > 0) {
                 const chosenIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
                 keptObjects.push({
                    id: uuidv4(),
                    type: ObjectType.LETTER,
                    position: [lane * LANE_WIDTH, 1.0, spawnZ], 
                    active: true,
                    color: GEMINI_COLORS[chosenIndex],
                    value: target[chosenIndex],
                    targetIndex: chosenIndex
                 });
                 
                 nextLetterDistance.current += getLetterInterval(level);
                 hasChanges = true;
             } else {
                keptObjects.push({
                    id: uuidv4(),
                    type: ObjectType.GEM,
                    position: [lane * LANE_WIDTH, 1.2, spawnZ],
                    active: true,
                    color: '#00ffff',
                    points: 100
                });
                hasChanges = true;
             }

         } else if (Math.random() > 0.08) {
            const hazardThreshold = Math.max(0.08, 0.25 - (difficulty * 0.035));
            const isHazard = Math.random() > hazardThreshold;

            if (isHazard) {
                const roll = Math.random();
                const availableLanes: number[] = [];
                const maxLane = Math.floor(laneCount / 2);
                for (let i = -maxLane; i <= maxLane; i++) availableLanes.push(i);
                availableLanes.sort(() => Math.random() - 0.5);

                // Hazard 1: MOVING PATROL DRONES (200m+ or Level 2+)
                if ((currentDist > 200 || level >= 2) && roll < Math.min(0.35, 0.12 * difficulty)) {
                    const primaryLane = availableLanes[0];
                    const droneSpeed = 2.2 + (difficulty * 0.8);
                    const droneAmp = Math.min(LANE_WIDTH * 1.1, LANE_WIDTH * 0.75 * (1 + difficulty * 0.2));

                    keptObjects.push({
                        id: uuidv4(),
                        type: ObjectType.MOVING_DRONE,
                        position: [primaryLane * LANE_WIDTH, 1.2, spawnZ],
                        baseX: primaryLane * LANE_WIDTH,
                        patrolSpeed: droneSpeed,
                        patrolAmplitude: droneAmp,
                        active: true,
                        color: '#ff9900'
                    });

                // Hazard 2: LASER GATES (Includes Low Jump Gates & High Slide-Under Gates)
                } else if ((currentDist > 380 || level >= 2) && roll < Math.min(0.65, 0.26 * difficulty)) {
                    const gateLane = availableLanes[0];
                    const gateTypeRoll = Math.random();

                    // Overhead Slide-Under Gate (40% chance if distance > 400m)
                    if (currentDist > 400 && gateTypeRoll < 0.4) {
                        keptObjects.push({
                            id: uuidv4(),
                            type: ObjectType.LASER_GATE,
                            position: [gateLane * LANE_WIDTH, 1.5, spawnZ],
                            isTallLaser: true,
                            canSlideUnder: true,
                            active: true,
                            color: '#ffea00'
                        });
                    } 
                    // Tall Impassable Barrier
                    else if (currentDist > 800 && gateTypeRoll < 0.75) {
                        keptObjects.push({
                            id: uuidv4(),
                            type: ObjectType.LASER_GATE,
                            position: [gateLane * LANE_WIDTH, 1.4, spawnZ],
                            isTallLaser: true,
                            canSlideUnder: false,
                            active: true,
                            color: '#ff0055'
                        });
                    } 
                    // Low Jumpable Laser Gate
                    else {
                        keptObjects.push({
                            id: uuidv4(),
                            type: ObjectType.LASER_GATE,
                            position: [gateLane * LANE_WIDTH, 0.8, spawnZ],
                            isTallLaser: false,
                            canSlideUnder: false,
                            active: true,
                            color: '#00e5ff'
                        });

                        // Bonus gem reward for jumping low gate
                        if (Math.random() < 0.5) {
                            keptObjects.push({
                                id: uuidv4(),
                                type: ObjectType.GEM,
                                position: [gateLane * LANE_WIDTH, 2.3, spawnZ],
                                active: true,
                                color: '#ffd700',
                                points: 150
                            });
                        }
                    }

                // Hazard 3: ALIEN INTERCEPTORS
                } else if ((currentDist > 300 || level >= 2) && roll < Math.min(0.85, 0.45 * difficulty)) {
                    let alienCount = 1;
                    if ((currentDist > 1000 || level >= 3) && Math.random() < 0.45) {
                        alienCount = Math.min(2, availableLanes.length);
                    }

                    for (let k = 0; k < alienCount; k++) {
                        const lane = availableLanes[k];
                        keptObjects.push({
                            id: uuidv4(),
                            type: ObjectType.ALIEN,
                            position: [lane * LANE_WIDTH, 1.5, spawnZ],
                            active: true,
                            color: '#00ff66',
                            hasFired: false
                        });
                    }

                // Hazard 4: SPIKES & MULTI-LANE FORMATIONS
                } else {
                    let countToSpawn = 1;
                    const pMulti = Math.random();

                    if ((currentDist > 1200 || level >= 4) && pMulti > 0.4) {
                        countToSpawn = Math.min(3, availableLanes.length);
                    } else if ((currentDist > 450 || level >= 2) && pMulti > 0.4) {
                        countToSpawn = Math.min(2, availableLanes.length);
                    }

                    for (let i = 0; i < countToSpawn; i++) {
                        const lane = availableLanes[i];
                        const laneX = lane * LANE_WIDTH;
                        
                        keptObjects.push({
                            id: uuidv4(),
                            type: ObjectType.OBSTACLE,
                            position: [laneX, OBSTACLE_HEIGHT / 2, spawnZ],
                            active: true,
                            color: '#ff0055'
                        });

                        if (Math.random() < 0.35) {
                             keptObjects.push({
                                id: uuidv4(),
                                type: ObjectType.GEM,
                                position: [laneX, OBSTACLE_HEIGHT + 1.1, spawnZ],
                                active: true,
                                color: '#00e5ff',
                                points: 100
                            });
                        }
                    }
                }

            } else {
                // Ground Gems
                const lane = getRandomLane(laneCount);
                keptObjects.push({
                    id: uuidv4(),
                    type: ObjectType.GEM,
                    position: [lane * LANE_WIDTH, 1.2, spawnZ],
                    active: true,
                    color: '#00ffff',
                    points: 50
                });
            }
            hasChanges = true;
         }
    }

    if (hasChanges) {
        objectsRef.current = keptObjects;
        setRenderTrigger(t => t + 1);
    }
  });

  return (
    <group>
      <ParticleSystem />
      {objectsRef.current.map(obj => {
        if (!obj.active) return null;
        return <GameEntity key={obj.id} data={obj} />;
      })}
    </group>
  );
};

const GameEntity: React.FC<{ data: GameObject }> = React.memo(({ data }) => {
    const groupRef = useRef<THREE.Group>(null);
    const visualRef = useRef<THREE.Group>(null);
    const shadowRef = useRef<THREE.Mesh>(null);
    const droneRingsRef = useRef<THREE.Group>(null);
    const laserBeamRef = useRef<THREE.Mesh>(null);
    const { laneCount, level } = useStore();
    const theme = useMemo(() => getThemeForLevel(level), [level]);
    
    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.position.set(data.position[0], 0, data.position[2]);
        }

        if (visualRef.current) {
            const baseHeight = data.position[1];
            
            if (data.type === ObjectType.SHOP_PORTAL) {
                 visualRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.02);
            } else if (data.type === ObjectType.MISSILE) {
                 visualRef.current.rotation.z += delta * 24;
                 visualRef.current.position.y = baseHeight;
            } else if (data.type === ObjectType.ALIEN) {
                 visualRef.current.position.y = baseHeight + Math.sin(state.clock.elapsedTime * 3) * 0.2;
                 visualRef.current.rotation.y += delta;
            } else if (data.type === ObjectType.MOVING_DRONE) {
                 visualRef.current.position.y = baseHeight + Math.sin(state.clock.elapsedTime * 5) * 0.15;
                 visualRef.current.rotation.y += delta * 2;
                 if (droneRingsRef.current) {
                     droneRingsRef.current.rotation.x += delta * 4;
                     droneRingsRef.current.rotation.z += delta * 3;
                 }
            } else if (data.type === ObjectType.LASER_GATE) {
                 visualRef.current.position.y = baseHeight;
                 if (laserBeamRef.current) {
                     const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 18) * 0.15;
                     laserBeamRef.current.scale.set(pulse, 1, pulse);
                 }
            } else if (data.type !== ObjectType.OBSTACLE) {
                visualRef.current.rotation.y += delta * 3;
                const bobOffset = Math.sin(state.clock.elapsedTime * 4 + data.position[0]) * 0.1;
                visualRef.current.position.y = baseHeight + bobOffset;
                
                if (shadowRef.current) {
                    shadowRef.current.scale.setScalar(1 - bobOffset);
                }
            } else {
                visualRef.current.position.y = baseHeight;
            }
        }
    });

    const shadowGeo = useMemo(() => {
        if (data.type === ObjectType.LETTER) return SHADOW_LETTER_GEO;
        if (data.type === ObjectType.GEM) return SHADOW_GEM_GEO;
        if (data.type === ObjectType.SHOP_PORTAL) return null;
        if (data.type === ObjectType.ALIEN) return SHADOW_ALIEN_GEO;
        if (data.type === ObjectType.MISSILE) return SHADOW_MISSILE_GEO;
        if (data.type === ObjectType.MOVING_DRONE) return SHADOW_DRONE_GEO;
        if (data.type === ObjectType.LASER_GATE) return SHADOW_GATE_GEO;
        return SHADOW_DEFAULT_GEO; 
    }, [data.type]);

    return (
        <group ref={groupRef} position={[data.position[0], 0, data.position[2]]}>
            {data.type !== ObjectType.SHOP_PORTAL && shadowGeo && (
                <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} geometry={shadowGeo}>
                    <meshBasicMaterial color="#000000" opacity={0.35} transparent />
                </mesh>
            )}

            <group ref={visualRef} position={[0, data.position[1], 0]}>
                {/* --- SHOP PORTAL --- */}
                {data.type === ObjectType.SHOP_PORTAL && (
                    <group>
                         <mesh position={[0, 3, 0]} geometry={SHOP_FRAME_GEO} scale={[laneCount * LANE_WIDTH + 2, 1, 1]}>
                             <meshStandardMaterial color="#1a142e" metalness={0.8} roughness={0.2} />
                         </mesh>
                         <mesh position={[0, 2, 0]} geometry={SHOP_BACK_GEO} scale={[laneCount * LANE_WIDTH, 1, 1]}>
                              <meshBasicMaterial color="#000000" />
                         </mesh>
                         <mesh position={[0, 3, 0]} geometry={SHOP_OUTLINE_GEO} scale={[laneCount * LANE_WIDTH + 2.2, 1, 1]}>
                             <meshBasicMaterial color={theme.railLeftColor} wireframe transparent opacity={0.4} />
                         </mesh>
                         <Center position={[0, 5, 0.6]}>
                             <Text3D font={FONT_URL} size={1.2} height={0.2}>
                                 CYBER SHOP
                                 <meshBasicMaterial color="#ffff00" />
                             </Text3D>
                         </Center>
                         <mesh position={[0, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]} geometry={SHOP_FLOOR_GEO} scale={[laneCount * LANE_WIDTH, 1, 1]}>
                             <meshBasicMaterial color={theme.railLeftColor} transparent opacity={0.35} />
                         </mesh>
                    </group>
                )}

                {/* --- OBSTACLE (SPIKES) --- */}
                {data.type === ObjectType.OBSTACLE && (
                    <group>
                        <mesh geometry={OBSTACLE_GEOMETRY} castShadow receiveShadow>
                             <meshStandardMaterial 
                                 color="#400018"
                                 roughness={0.25} 
                                 metalness={0.85} 
                                 flatShading={true}
                                 emissive="#ff0044"
                                 emissiveIntensity={0.3}
                             />
                        </mesh>
                        <mesh scale={[1.03, 1.03, 1.03]} geometry={OBSTACLE_GLOW_GEO}>
                             <meshBasicMaterial 
                                 color={data.color} 
                                 wireframe 
                                 transparent 
                                 opacity={0.45} 
                             />
                        </mesh>
                         <mesh position={[0, -OBSTACLE_HEIGHT / 2 + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={OBSTACLE_RING_GEO}>
                             <meshBasicMaterial color={data.color} transparent opacity={0.6} side={THREE.DoubleSide} />
                         </mesh>
                    </group>
                )}

                {/* --- MOVING PATROL DRONE --- */}
                {data.type === ObjectType.MOVING_DRONE && (
                    <group>
                        <mesh castShadow geometry={DRONE_CORE_GEO}>
                            <meshStandardMaterial color="#2d0a42" emissive="#ff3300" emissiveIntensity={0.8} roughness={0.2} metalness={0.9} />
                        </mesh>
                        <mesh geometry={DRONE_EYE_GEO}>
                            <meshBasicMaterial color="#ff0044" />
                        </mesh>
                        <group ref={droneRingsRef}>
                            <mesh geometry={DRONE_RING_GEO}>
                                <meshBasicMaterial color="#00e5ff" />
                            </mesh>
                            <mesh rotation={[Math.PI / 2, 0, 0]} geometry={DRONE_RING_GEO}>
                                <meshBasicMaterial color="#ff00aa" />
                            </mesh>
                        </group>
                    </group>
                )}

                {/* --- LASER GATE (With Slide-Under overhead variant) --- */}
                {data.type === ObjectType.LASER_GATE && (
                    <group>
                        {/* Left Pylon */}
                        <mesh position={[-LANE_WIDTH / 2, 0, 0]} geometry={PYLON_GEO}>
                            <meshStandardMaterial color="#1a1c2e" metalness={0.85} roughness={0.2} />
                        </mesh>
                        <mesh position={[-LANE_WIDTH / 2, 1.4, 0]} geometry={PYLON_CAP_GEO}>
                            <meshBasicMaterial color={data.canSlideUnder ? '#ffea00' : (data.isTallLaser ? '#ff0055' : '#00e5ff')} />
                        </mesh>

                        {/* Right Pylon */}
                        <mesh position={[LANE_WIDTH / 2, 0, 0]} geometry={PYLON_GEO}>
                            <meshStandardMaterial color="#1a1c2e" metalness={0.85} roughness={0.2} />
                        </mesh>
                        <mesh position={[LANE_WIDTH / 2, 1.4, 0]} geometry={PYLON_CAP_GEO}>
                            <meshBasicMaterial color={data.canSlideUnder ? '#ffea00' : (data.isTallLaser ? '#ff0055' : '#00e5ff')} />
                        </mesh>

                        {/* Overhead Slide-Under Gate */}
                        {data.canSlideUnder ? (
                            <group position={[0, 0.4, 0]}>
                                <mesh ref={laserBeamRef} rotation={[0, 0, Math.PI / 2]} scale={[1.4, LANE_WIDTH, 1.4]} geometry={LASER_BEAM_GEO}>
                                    <meshBasicMaterial color="#ffcc00" />
                                </mesh>
                                {/* Slide warning sign */}
                                <mesh position={[0, 0.5, 0]} geometry={SLIDE_SIGN_GEO}>
                                    <meshBasicMaterial color="#ff9900" />
                                </mesh>
                            </group>
                        ) : data.isTallLaser ? (
                            // Impassable wall
                            <group position={[0, 0, 0]}>
                                <mesh ref={laserBeamRef} rotation={[0, 0, Math.PI / 2]} scale={[1, LANE_WIDTH, 1]} geometry={LASER_BEAM_GEO}>
                                    <meshBasicMaterial color="#ff0044" />
                                </mesh>
                                {[-0.6, -0.2, 0.2, 0.6].map((xOffset, idx) => (
                                    <mesh key={`grid-${idx}`} position={[xOffset, 0, 0]} geometry={TALL_GRID_BAR_GEO}>
                                        <meshBasicMaterial color="#ff0055" transparent opacity={0.65} />
                                    </mesh>
                                ))}
                            </group>
                        ) : (
                            // Low laser beam (jumpable)
                            <group position={[0, 0, 0]}>
                                <mesh ref={laserBeamRef} rotation={[0, 0, Math.PI / 2]} scale={[1.2, LANE_WIDTH, 1.2]} geometry={LASER_BEAM_GEO}>
                                    <meshBasicMaterial color="#00e5ff" />
                                </mesh>
                            </group>
                        )}
                    </group>
                )}

                {/* --- ALIEN --- */}
                {data.type === ObjectType.ALIEN && (
                    <group>
                        <mesh castShadow geometry={ALIEN_BODY_GEO}>
                            <meshStandardMaterial color="#380966" metalness={0.85} roughness={0.2} emissive="#200044" emissiveIntensity={0.5} />
                        </mesh>
                        <mesh position={[0, 0.2, 0]} geometry={ALIEN_DOME_GEO}>
                            <meshStandardMaterial color="#00ff66" emissive="#00ff66" emissiveIntensity={0.8} transparent opacity={0.85} />
                        </mesh>
                        <mesh position={[0.3, 0, 0.3]} geometry={ALIEN_EYE_GEO}>
                             <meshBasicMaterial color="#ff00aa" />
                        </mesh>
                        <mesh position={[-0.3, 0, 0.3]} geometry={ALIEN_EYE_GEO}>
                             <meshBasicMaterial color="#ff00aa" />
                        </mesh>
                    </group>
                )}

                {/* --- MISSILE --- */}
                {data.type === ObjectType.MISSILE && (
                    <group rotation={[Math.PI / 2, 0, 0]}>
                        <mesh geometry={MISSILE_CORE_GEO}>
                            <meshStandardMaterial color="#ff0033" emissive="#ff0033" emissiveIntensity={4} />
                        </mesh>
                        <mesh position={[0, 1.0, 0]} geometry={MISSILE_RING_GEO}>
                            <meshBasicMaterial color="#ffff00" />
                        </mesh>
                        <mesh position={[0, 0, 0]} geometry={MISSILE_RING_GEO}>
                            <meshBasicMaterial color="#ffff00" />
                        </mesh>
                        <mesh position={[0, -1.0, 0]} geometry={MISSILE_RING_GEO}>
                            <meshBasicMaterial color="#ffff00" />
                        </mesh>
                    </group>
                )}

                {/* --- GEM --- */}
                {data.type === ObjectType.GEM && (
                    <mesh castShadow geometry={GEM_GEOMETRY}>
                        <meshStandardMaterial 
                            color={data.color} 
                            roughness={0.05} 
                            metalness={0.9} 
                            emissive={data.color} 
                            emissiveIntensity={2.2} 
                        />
                    </mesh>
                )}

                {/* --- LETTER --- */}
                {data.type === ObjectType.LETTER && (
                    <group scale={[1.5, 1.5, 1.5]}>
                         <Center>
                             <Text3D 
                                font={FONT_URL} 
                                size={0.8} 
                                height={0.5} 
                                bevelEnabled
                                bevelThickness={0.02}
                                bevelSize={0.02}
                                bevelSegments={5}
                             >
                                {data.value}
                                <meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={1.8} />
                             </Text3D>
                         </Center>
                    </group>
                )}
            </group>
        </group>
    );
});
