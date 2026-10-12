/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Download, 
  Sparkles, 
  Zap, 
  Shield, 
  Trophy, 
  Smartphone, 
  Laptop, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Flame, 
  Volume2, 
  VolumeX, 
  ChevronDown, 
  Share, 
  Diamond,
  X,
  RefreshCw
} from 'lucide-react';
import { usePWAInstall } from '../System/usePWAInstall';
import { CHARACTER_SKINS, LEVEL_THEMES } from '../../types';
import { useStore } from '../../store';
import { audio } from '../System/Audio';

interface ShowcaseLandingPageProps {
  onPlayGame: () => void;
}

export const ShowcaseLandingPage: React.FC<ShowcaseLandingPageProps> = ({ onPlayGame }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [demoMuted, setDemoMuted] = useState(true);
  const [activeSkinTab, setActiveSkinTab] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // --- Interactive Live 60fps Gameplay Demo Simulation ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let playerLane = 0; // -1, 0, 1
    let playerY = 0;
    let isJumping = false;
    let isSliding = false;
    let jumpVelocity = 0;
    let speed = 6;
    let score = 12450;
    let threatTier = 2;

    // Simulated obstacles
    const obstacles: Array<{
      lane: number;
      z: number;
      type: 'SPIKE' | 'DRONE' | 'LASER' | 'GEM' | 'LETTER';
      val?: string;
    }> = [
      { lane: 0, z: 80, type: 'GEM' },
      { lane: -1, z: 120, type: 'SPIKE' },
      { lane: 1, z: 160, type: 'DRONE' },
      { lane: 0, z: 210, type: 'LETTER', val: 'G' },
      { lane: 0, z: 260, type: 'LASER' },
      { lane: 1, z: 310, type: 'GEM' },
    ];

    const render = () => {
      frame++;
      score += 2;
      const w = canvas.width;
      const h = canvas.height;

      // 1. Clear background - synthwave dusk
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#0c021f');
      bgGrad.addColorStop(0.5, '#1e083a');
      bgGrad.addColorStop(1, '#050011');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Retro Sun
      const sunX = w / 2;
      const sunY = h * 0.38;
      const sunR = Math.min(w, h) * 0.22;
      const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
      sunGrad.addColorStop(0, '#fff056');
      sunGrad.addColorStop(1, '#ff007f');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();

      // Scanline cuts through sun
      ctx.fillStyle = '#0c021f';
      for (let i = 0; i < 7; i++) {
        const lineY = sunY + (i * 10) + (Math.sin(frame * 0.05) * 2);
        if (lineY < sunY + sunR) {
          ctx.fillRect(sunX - sunR, lineY, sunR * 2, 2.5 + i * 0.5);
        }
      }

      // 3. 3D Perspective Road
      const horizonY = h * 0.5;
      const roadTopW = w * 0.22;
      const roadBottomW = w * 0.88;

      ctx.beginPath();
      ctx.moveTo(w / 2 - roadTopW / 2, horizonY);
      ctx.lineTo(w / 2 + roadTopW / 2, horizonY);
      ctx.lineTo(w / 2 + roadBottomW / 2, h);
      ctx.lineTo(w / 2 - roadBottomW / 2, h);
      ctx.closePath();
      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, h);
      roadGrad.addColorStop(0, '#15072b');
      roadGrad.addColorStop(1, '#230b42');
      ctx.fillStyle = roadGrad;
      ctx.fill();

      // Glowing Cyan Border Rails
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(w / 2 - roadTopW / 2, horizonY);
      ctx.lineTo(w / 2 - roadBottomW / 2, h);
      ctx.stroke();

      ctx.strokeStyle = '#ff007f';
      ctx.beginPath();
      ctx.moveTo(w / 2 + roadTopW / 2, horizonY);
      ctx.lineTo(w / 2 + roadBottomW / 2, h);
      ctx.stroke();

      // Lane dividers
      const laneDivs = [-0.17, 0.17];
      laneDivs.forEach(div => {
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w / 2 + (roadTopW * div), horizonY);
        ctx.lineTo(w / 2 + (roadBottomW * div), h);
        ctx.stroke();
      });

      // Chevrons scrolling down
      const offset = (frame * speed) % 50;
      for (let z = 10; z < 250; z += 50) {
        const currZ = z - offset;
        if (currZ > 0) {
          const p = currZ / 250;
          const yPos = horizonY + (h - horizonY) * p;
          const widthAtZ = roadTopW + (roadBottomW - roadTopW) * p;
          ctx.strokeStyle = `rgba(0, 240, 255, ${0.15 + p * 0.4})`;
          ctx.lineWidth = 2 + p * 3;
          ctx.beginPath();
          ctx.moveTo(w / 2 - widthAtZ * 0.1, yPos);
          ctx.lineTo(w / 2, yPos + 6);
          ctx.lineTo(w / 2 + widthAtZ * 0.1, yPos);
          ctx.stroke();
        }
      }

      // 4. Update Simulated Player & AI Maneuver
      if (frame % 80 === 0) {
        // AI lane change or jump/slide
        const roll = Math.random();
        if (roll < 0.35) {
          playerLane = Math.max(-1, Math.min(1, playerLane + (Math.random() < 0.5 ? -1 : 1)));
        } else if (roll < 0.65 && !isJumping) {
          isJumping = true;
          jumpVelocity = 12;
        } else if (!isSliding) {
          isSliding = true;
          setTimeout(() => { isSliding = false; }, 500);
        }
      }

      // Jump Physics
      if (isJumping) {
        playerY += jumpVelocity;
        jumpVelocity -= 0.8;
        if (playerY <= 0) {
          playerY = 0;
          isJumping = false;
        }
      }

      // 5. Draw Obstacles moving towards camera
      obstacles.forEach(obs => {
        obs.z -= speed * 0.8;
        if (obs.z <= 0) {
          obs.z = 280;
          obs.lane = Math.floor(Math.random() * 3) - 1;
        }

        const p = 1 - (obs.z / 280);
        if (p > 0 && p < 1) {
          const yPos = horizonY + (h - horizonY) * p;
          const widthAtZ = roadTopW + (roadBottomW - roadTopW) * p;
          const xPos = w / 2 + (obs.lane * (widthAtZ / 3));
          const scale = 0.3 + p * 1.2;

          if (obs.type === 'SPIKE') {
            ctx.fillStyle = '#ff0055';
            ctx.beginPath();
            ctx.moveTo(xPos, yPos - 35 * scale);
            ctx.lineTo(xPos - 18 * scale, yPos);
            ctx.lineTo(xPos + 18 * scale, yPos);
            ctx.closePath();
            ctx.fill();
          } else if (obs.type === 'DRONE') {
            const droneSway = Math.sin(frame * 0.1) * 20 * scale;
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(xPos + droneSway, yPos - 25 * scale, 14 * scale, 0, Math.PI * 2);
            ctx.fill();
          } else if (obs.type === 'LASER') {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 4 * scale;
            ctx.beginPath();
            ctx.moveTo(xPos - 25 * scale, yPos - 20 * scale);
            ctx.lineTo(xPos + 25 * scale, yPos - 20 * scale);
            ctx.stroke();
          } else if (obs.type === 'GEM') {
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(xPos, yPos - 22 * scale, 8 * scale, 0, Math.PI * 2);
            ctx.fill();
          } else if (obs.type === 'LETTER') {
            ctx.fillStyle = '#ffd700';
            ctx.font = `bold ${Math.floor(18 * scale)}px Orbitron, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(obs.val || 'G', xPos, yPos - 20 * scale);
          }
        }
      });

      // 6. Draw Cyber Mecha Runner
      const playerGroundY = h * 0.88;
      const playerLaneW = roadBottomW / 3;
      const targetPX = w / 2 + (playerLane * playerLaneW);
      const targetPY = playerGroundY - playerY;

      ctx.save();
      ctx.translate(targetPX, targetPY);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, playerY, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dual Thruster Plasma Flames
      const flameH = (isSliding ? 30 : 20) + Math.sin(frame * 0.8) * 6;
      ctx.fillStyle = '#00f7ff';
      ctx.beginPath();
      ctx.moveTo(-10, -10);
      ctx.lineTo(-6, -10 + flameH);
      ctx.lineTo(-2, -10);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(2, -10);
      ctx.lineTo(6, -10 + flameH);
      ctx.lineTo(10, -10);
      ctx.fill();

      // Cyber Body
      if (isSliding) {
        // Low slide posture
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(-18, -25, 36, 18);
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(-14, -22, 28, 8);
      } else {
        // Upright running mecha
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(-16, -55, 32, 38);
        // Chest Plate & Visor
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(-12, -50, 24, 14);
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(-10, -46, 20, 6);
        // Head / Helmet
        ctx.fillStyle = '#ff007f';
        ctx.beginPath();
        ctx.arc(0, -62, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // 7. Simulated HUD Overlay on Canvas
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 16px Orbitron, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE: ${score.toLocaleString()}`, 20, 35);

      ctx.fillStyle = '#ff007f';
      ctx.textAlign = 'right';
      ctx.fillText(`THREAT: LVL ${threatTier} ESCALATION`, w - 20, 35);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(20, h - 45, 230, 28);
      ctx.strokeStyle = '#00f0ff';
      ctx.strokeRect(20, h - 45, 230, 28);
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('🔴 LIVE AUTOPILOT DEMO 60FPS', 28, h - 26);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // In standalone browser or if already installed
      setShowIOSModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#050011] text-white selection:bg-cyan-500 selection:text-black font-sans relative overflow-x-hidden">
      
      {/* Background Ambience & Cyber Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,50,255,0.35),rgba(255,255,255,0))]"></div>
      
      {/* --- TOP STICKY CYBER NAVBAR --- */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/75 border-b border-cyan-500/20 px-4 md:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 shadow-[0_0_20px_rgba(0,255,255,0.4)]">
              <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-cyber font-black text-lg md:text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-500">
                  HACKER ANKIT GAME
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  PWA STANDALONE
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono tracking-widest hidden sm:block">ENDLESS SYNTHWAVE RUNNER</p>
            </div>
          </div>

          {/* Quick Nav Anchors */}
          <nav className="hidden lg:flex items-center space-x-6 text-sm font-mono text-gray-300">
            <a href="#demo" className="hover:text-cyan-400 transition-colors">LIVE DEMO</a>
            <a href="#features" className="hover:text-cyan-400 transition-colors">FEATURES</a>
            <a href="#characters" className="hover:text-cyan-400 transition-colors">CHARACTERS</a>
            <a href="#controls" className="hover:text-cyan-400 transition-colors">CONTROLS</a>
          </nav>

          {/* Dual Primary Action Buttons */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {/* Install App Button */}
            <button
              onClick={handleInstallClick}
              className="flex items-center px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-mono text-xs sm:text-sm font-bold bg-white/10 hover:bg-white/20 border border-white/20 hover:border-cyan-400 transition-all text-white shadow-sm"
              title="Install Hacker Ankit Game directly to mobile home screen"
            >
              <Download className="w-4 h-4 mr-1.5 text-cyan-400" />
              <span className="hidden xs:inline">INSTALL</span> APP
            </button>

            {/* Play Online Button */}
            <button
              onClick={() => { audio.init(); onPlayGame(); }}
              className="group relative flex items-center px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-cyber text-xs sm:text-sm font-black text-black bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 hover:brightness-110 shadow-[0_0_25px_rgba(0,255,255,0.5)] transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <Play className="w-4 h-4 mr-1.5 fill-black" />
              PLAY ONLINE
            </button>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION WITH PROMINENT VIDEO/DEMO RIGHT AT THE TOP --- */}
      <section id="demo" className="relative pt-6 md:pt-10 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(0,255,255,0.2)]">
            <Sparkles className="w-3.5 h-3.5 mr-2 text-yellow-400" />
            INFINITE PROCEDURAL LEVELS • PWA STANDALONE READY
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-cyber tracking-tight leading-tight text-white mb-4">
            RACE THE ENDLESS <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500">CYBER COSMOS</span>
          </h1>
          <p className="text-sm md:text-lg text-gray-300 font-mono leading-relaxed">
            Survive breakneck speeds, dodge animated patrol drones, slide under high-voltage laser gates, and unlock high-tech mecha frames in this progressive cyber runner.
          </p>
        </div>

        {/* --- PROMINENT INTERACTIVE 60FPS GAMEPLAY VIDEO/DEMO SECTION --- */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-cyan-500/40 shadow-[0_0_60px_rgba(0,255,255,0.25)] bg-black max-w-4xl mx-auto group">
          
          {/* Top Bar for Demo player */}
          <div className="bg-gray-950/90 border-b border-white/10 px-4 py-2.5 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-gray-400 ml-2 font-bold hidden sm:inline">HACKER_ANKIT_GAME_DEMO.MP4</span>
            </div>
            <div className="flex items-center space-x-3 text-cyan-400">
              <span className="flex items-center"><Zap className="w-3.5 h-3.5 mr-1" /> 60 FPS ULTRA</span>
              <button onClick={() => setDemoMuted(!demoMuted)} className="hover:text-white transition">
                {demoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Canvas Gameplay Simulation */}
          <div className="relative aspect-[16/9] w-full bg-black">
            <canvas 
              ref={canvasRef} 
              width={854} 
              height={480} 
              className="w-full h-full object-cover block cursor-pointer"
              onClick={() => { audio.init(); onPlayGame(); }}
              title="Click to jump into real game!"
            />

            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none backdrop-blur-[2px]">
              <div className="px-6 py-3 rounded-2xl bg-cyan-500 text-black font-cyber font-black text-lg shadow-[0_0_30px_rgba(0,255,255,0.8)] flex items-center">
                <Play className="w-6 h-6 mr-2 fill-black" /> CLICK ANYWHERE TO PLAY NOW
              </div>
            </div>
          </div>

          {/* Bottom Dual Action Bar directly below the Demo */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="font-cyber font-bold text-white text-base md:text-lg flex items-center">
                Ready to beat the high score?
              </div>
              <p className="text-xs text-gray-400 font-mono">Available on Mobile (PWA Android & iOS) and Laptop/Desktop</p>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              {/* Big Install Button */}
              <button
                onClick={handleInstallClick}
                className="flex-1 sm:flex-initial flex items-center justify-center px-5 py-3.5 rounded-xl font-mono text-sm font-bold bg-white/10 hover:bg-white/20 border border-cyan-400/50 hover:border-cyan-300 text-cyan-300 shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all"
              >
                <Download className="w-4 h-4 mr-2 text-cyan-400" />
                INSTALL GAME APP
              </button>

              {/* Big Play Button */}
              <button
                onClick={() => { audio.init(); onPlayGame(); }}
                className="flex-1 sm:flex-initial flex items-center justify-center px-7 py-3.5 rounded-xl font-cyber text-sm font-black text-black bg-gradient-to-r from-cyan-400 to-teal-300 hover:brightness-110 shadow-[0_0_25px_rgba(0,255,255,0.4)] transition-all"
              >
                <Play className="w-4 h-4 mr-2 fill-black" />
                PLAY ONLINE
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURE HIGHLIGHTS SECTION --- */}
      <section id="features" className="py-16 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-4xl font-black font-cyber text-white mb-3">
            NEXT-GEN RUNNER <span className="text-cyan-400">FEATURES</span>
          </h2>
          <p className="text-sm font-mono text-gray-400">
            Engineered for high performance 60FPS graphics, responsive controls, and limitless replayability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Endless Progression */}
          <div className="p-6 rounded-2xl bg-gray-950/80 border border-gray-800 hover:border-cyan-400 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="font-cyber font-bold text-lg text-white mb-2">Endless Infinite Levels</h3>
            <p className="text-xs font-mono text-gray-400 leading-relaxed mb-3">
              No 3-level cap! Progress through infinite procedural stages (Level 1, 2, 3, 4, 5+). Each level introduces faster speed, tighter gaps, and rich procedural biomes.
            </p>
            <span className="text-[11px] font-mono font-bold text-cyan-400 flex items-center">
              5 DYNAMIC BIOMES <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </span>
          </div>

          {/* Card 2: Dual Controls */}
          <div className="p-6 rounded-2xl bg-gray-950/80 border border-gray-800 hover:border-purple-400 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-400/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Smartphone className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-cyber font-bold text-lg text-white mb-2">Responsive Dual Controls</h3>
            <p className="text-xs font-mono text-gray-400 leading-relaxed mb-3">
              Full keyboard support (WASD / Arrows to move, jump, and slide). On mobile, enjoy 100% natural touch/swipe gestures with zero annoying virtual buttons.
            </p>
            <span className="text-[11px] font-mono font-bold text-purple-400 flex items-center">
              PC KEYBOARD & MOBILE SWIPES <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </span>
          </div>

          {/* Card 3: Character Skins */}
          <div className="p-6 rounded-2xl bg-gray-950/80 border border-gray-800 hover:border-yellow-400 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-yellow-950/80 border border-yellow-400/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
            <h3 className="font-cyber font-bold text-lg text-white mb-2">Upgradeable Mecha Skins</h3>
            <p className="text-xs font-mono text-gray-400 leading-relaxed mb-3">
              Unlock 5 distinct cyberpunk mechas: Aero Vortex, Neon Phantom, Solar Striker, Quantum Drifter, and Hyperion Titan—each packed with gameplay passives.
            </p>
            <span className="text-[11px] font-mono font-bold text-yellow-400 flex items-center">
              STAT BONUSES & PASSIVES <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </span>
          </div>

          {/* Card 4: Slide & Dynamic Hazards */}
          <div className="p-6 rounded-2xl bg-gray-950/80 border border-gray-800 hover:border-pink-400 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-pink-950/80 border border-pink-400/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Flame className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="font-cyber font-bold text-lg text-white mb-2">Slide & High-Voltage Gates</h3>
            <p className="text-xs font-mono text-gray-400 leading-relaxed mb-3">
              Duck and slide beneath overhead laser barriers with custom ground spark physics. Dodge swaying patrol drones and jump over glowing neon spikes.
            </p>
            <span className="text-[11px] font-mono font-bold text-pink-400 flex items-center">
              DUCK, JUMP & WEAVE <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </span>
          </div>

        </div>
      </section>

      {/* --- CHARACTER MECHA ROSTER --- */}
      <section id="characters" className="py-16 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-4xl font-black font-cyber text-white mb-3">
            CYBER MECHA <span className="text-yellow-400">ROSTER</span>
          </h2>
          <p className="text-sm font-mono text-gray-400">
            Collect gems during your runs to unlock and pilot these advanced frames.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {CHARACTER_SKINS.map((skin, idx) => (
            <div 
              key={skin.id}
              className="p-5 rounded-2xl bg-gray-950 border border-gray-800 hover:border-cyan-400 transition-all flex flex-col justify-between"
              style={{ borderColor: idx === activeSkinTab ? skin.primaryColor : undefined }}
            >
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="w-4 h-4 rounded-full border border-white/30" style={{ backgroundColor: skin.primaryColor }}></span>
                  <span className="w-4 h-4 rounded-full border border-white/30" style={{ backgroundColor: skin.secondaryColor }}></span>
                  <span className="w-4 h-4 rounded-full border border-white/30" style={{ backgroundColor: skin.thrusterColor }}></span>
                </div>
                <h4 className="font-cyber font-black text-lg text-white mb-0.5">{skin.name}</h4>
                <p className="text-[11px] text-cyan-400 font-mono mb-2">{skin.subtitle}</p>
                <div className="p-2.5 rounded-lg bg-black/60 border border-white/10 mb-3">
                  <span className="text-[10px] uppercase tracking-wider text-yellow-400 font-bold block mb-1">PASSIVE:</span>
                  <p className="text-[11px] text-gray-300 font-sans">{skin.passiveDesc}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">COST:</span>
                <span className="text-yellow-400 font-bold">{skin.cost === 0 ? 'FREE' : `${skin.cost} GEMS`}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- DUAL CONTROLS COMPARISON --- */}
      <section id="controls" className="py-16 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-4xl font-black font-cyber text-white mb-3">
            RESPONSIVE <span className="text-cyan-400">DUAL CONTROLS</span>
          </h2>
          <p className="text-sm font-mono text-gray-400">
            Engineered for precision gaming across desktop monitors and mobile touchscreens.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Laptop / Desktop */}
          <div className="p-6 rounded-2xl bg-gray-950 border border-cyan-500/30">
            <div className="flex items-center space-x-3 mb-4">
              <Laptop className="w-6 h-6 text-cyan-400" />
              <h3 className="font-cyber font-bold text-lg text-white">Laptop & Desktop Controls</h3>
            </div>
            <ul className="space-y-3 text-xs font-mono text-gray-300">
              <li className="flex items-center justify-between p-2.5 rounded-lg bg-black/60 border border-white/10">
                <span>MOVE LEFT / RIGHT</span>
                <span className="text-cyan-300 font-bold">[ A / D ] or [ ◀ / ▶ ]</span>
              </li>
              <li className="flex items-center justify-between p-2.5 rounded-lg bg-black/60 border border-white/10">
                <span>JUMP & DOUBLE JUMP</span>
                <span className="text-cyan-300 font-bold">[ W ] or [ ▲ ]</span>
              </li>
              <li className="flex items-center justify-between p-2.5 rounded-lg bg-black/60 border border-white/10">
                <span>SLIDE UNDER BARRIERS</span>
                <span className="text-cyan-300 font-bold">[ S ] or [ ▼ ]</span>
              </li>
              <li className="flex items-center justify-between p-2.5 rounded-lg bg-black/60 border border-white/10">
                <span>ACTIVATE IMMORTALITY</span>
                <span className="text-cyan-300 font-bold">[ SPACE / SHIFT ]</span>
              </li>
            </ul>
          </div>

          {/* Mobile / Android & iOS */}
          <div className="p-6 rounded-2xl bg-gray-950 border border-purple-500/30">
            <div className="flex items-center space-x-3 mb-4">
              <Smartphone className="w-6 h-6 text-purple-400" />
              <h3 className="font-cyber font-bold text-lg text-white">Mobile Touch (Zero Virtual Buttons)</h3>
            </div>
            <ul className="space-y-3 text-xs font-mono text-gray-300">
              <li className="flex items-center justify-between p-2.5 rounded-lg bg-black/60 border border-white/10">
                <span>SWITCH LANES</span>
                <span className="text-purple-300 font-bold">SWIPE LEFT / RIGHT ◀ ▶</span>
              </li>
              <li className="flex items-center justify-between p-2.5 rounded-lg bg-black/60 border border-white/10">
                <span>JUMP & DOUBLE JUMP</span>
                <span className="text-purple-300 font-bold">SWIPE UP ▲</span>
              </li>
              <li className="flex items-center justify-between p-2.5 rounded-lg bg-black/60 border border-white/10">
                <span>SLIDE UNDER BARRIERS</span>
                <span className="text-purple-300 font-bold">SWIPE DOWN ▼</span>
              </li>
              <li className="flex items-center justify-between p-2.5 rounded-lg bg-black/60 border border-white/10">
                <span>ACTIVATE IMMORTALITY</span>
                <span className="text-purple-300 font-bold">TAP SCREEN</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* --- FOOTER & PWA INSTALL BANNER --- */}
      <footer className="py-12 px-4 md:px-8 border-t border-white/10 bg-black/90">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h4 className="font-cyber font-bold text-white text-lg">HACKER ANKIT GAME</h4>
            <p className="text-xs font-mono text-gray-400">Progressive Web App • Built with React & Three.js • GitHub Pages Ready</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleInstallClick}
              className="px-5 py-2.5 rounded-xl font-mono text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition"
            >
              <Download className="w-3.5 h-3.5 inline mr-1.5" /> INSTALL APP
            </button>
            <button
              onClick={() => { audio.init(); onPlayGame(); }}
              className="px-6 py-2.5 rounded-xl font-cyber text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition"
            >
              LAUNCH GAME
            </button>
          </div>
        </div>
      </footer>

      {/* --- iOS Safari / Mobile Install Guide Modal --- */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-2xl bg-gray-900 border border-cyan-500/40 p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 rounded-xl bg-cyan-950 border border-cyan-400/40">
                <Download className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-cyber font-bold text-white text-base">Install App</h3>
                <p className="text-xs font-mono text-cyan-400">Hacker Ankit Game</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed mb-4 font-mono">
              To install directly to your device home screen:
            </p>
            <div className="space-y-2 text-xs font-mono text-gray-200 bg-black/60 p-3 rounded-xl border border-white/10 mb-4">
              <p>1. Tap the <strong className="text-cyan-300">Share</strong> icon (iOS) or <strong className="text-cyan-300">Three Dots</strong> (Chrome).</p>
              <p>2. Scroll down and tap <strong className="text-cyan-300">'Add to Home Screen'</strong>.</p>
              <p>3. Launch directly from your home screen with a standalone app icon!</p>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs transition"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
