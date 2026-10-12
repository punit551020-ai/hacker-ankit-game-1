/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Zap, 
  Trophy, 
  MapPin, 
  Diamond, 
  ArrowUpCircle, 
  Shield, 
  Activity, 
  PlusCircle, 
  Play, 
  AlertTriangle, 
  ShoppingBag, 
  Check, 
  Sparkles,
  ChevronDown,
  X,
  Download
} from 'lucide-react';
import { usePWAInstall } from '../System/usePWAInstall';
import { useStore } from '../../store';
import { GameStatus, GEMINI_COLORS, ShopItem, RUN_SPEED_BASE, CHARACTER_SKINS, getThemeForLevel } from '../../types';
import { audio } from '../System/Audio';

const SHOP_ITEMS: ShopItem[] = [
    {
        id: 'DOUBLE_JUMP',
        name: 'DOUBLE JUMP',
        description: 'Jump again in mid-air. Essential for clearing high obstacles.',
        cost: 1000,
        icon: ArrowUpCircle,
        oneTime: true
    },
    {
        id: 'MAX_LIFE',
        name: 'MAX LIFE UP',
        description: 'Permanently adds a heart slot and heals you.',
        cost: 1500,
        icon: Activity
    },
    {
        id: 'HEAL',
        name: 'REPAIR KIT',
        description: 'Restores 1 Life point instantly.',
        cost: 1000,
        icon: PlusCircle
    },
    {
        id: 'IMMORTAL',
        name: 'IMMORTALITY',
        description: 'Unlock Ability: Press Space / Tap screen for 5s invincibility.',
        cost: 3000,
        icon: Shield,
        oneTime: true
    }
];

const HAZARD_INFO: Record<number, { name: string; color: string; desc: string }> = {
    1: { name: 'LVL 1: NOMINAL', color: '#00f5ff', desc: 'Single Spikes & Low Hazards' },
    2: { name: 'LVL 2: ESCALATION', color: '#ffd600', desc: 'Patrol Drones & Twin Spikes' },
    3: { name: 'LVL 3: HIGH DANGER', color: '#ff6600', desc: 'Laser Gates & Alien Scouts' },
    4: { name: 'LVL 4: HYPER SURGE', color: '#ff007f', desc: 'Overhead Slide Gates & Fast Missiles' },
    5: { name: 'LVL 5: APEX STORM', color: '#ff0033', desc: 'Extreme Hazard Density & Rapid Lasers' },
};

export const ShopModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { 
      score, 
      walletGems, 
      buyItem, 
      buySkin, 
      equipSkin, 
      equippedSkinId, 
      unlockedSkinIds, 
      hasDoubleJump, 
      hasImmortality, 
      status 
    } = useStore();
    
    const [tab, setTab] = useState<'SKINS' | 'POWERUPS'>('SKINS');
    const [items, setItems] = useState<ShopItem[]>([]);

    useEffect(() => {
        let pool = SHOP_ITEMS.filter(item => {
            if (item.id === 'DOUBLE_JUMP' && hasDoubleJump) return false;
            if (item.id === 'IMMORTAL' && hasImmortality) return false;
            return true;
        });
        setItems(pool);
    }, [hasDoubleJump, hasImmortality, isOpen]);

    if (!isOpen) return null;

    const isMidRun = status === GameStatus.SHOP || status === GameStatus.PLAYING;

    return (
        <div className="absolute inset-0 bg-black/95 z-[150] text-white pointer-events-auto backdrop-blur-xl overflow-y-auto">
             <div className="flex flex-col items-center min-h-full py-6 px-4 max-w-5xl mx-auto">
                 
                 {/* Header with Close and Balance */}
                 <div className="w-full flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                     <div>
                         <h2 className="text-2xl md:text-4xl font-black text-cyan-400 font-cyber tracking-widest flex items-center">
                             CYBER VAULT & SHOP
                         </h2>
                         <p className="text-xs md:text-sm text-gray-400 font-mono">Unlock upgraded skins & in-run cybernetics</p>
                     </div>
                     <div className="flex items-center space-x-3">
                         <div className="flex items-center px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,255,255,0.25)]">
                             <Diamond className="w-4 h-4 md:w-5 md:h-5 text-cyan-400 mr-2" />
                             <span className="font-mono font-bold text-sm md:text-base text-cyan-300">
                                 {walletGems.toLocaleString()} GEMS
                             </span>
                         </div>
                         <button 
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-gray-300 hover:text-white"
                         >
                            <X className="w-6 h-6" />
                         </button>
                     </div>
                 </div>

                 {/* Tab Selector */}
                 <div className="flex space-x-3 mb-6 w-full max-w-md">
                     <button
                        onClick={() => setTab('SKINS')}
                        className={`flex-1 py-2.5 rounded-xl font-cyber text-sm md:text-base font-bold transition-all border ${tab === 'SKINS' ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_20px_rgba(0,255,255,0.4)]' : 'bg-gray-900 text-gray-400 border-gray-700 hover:text-white'}`}
                     >
                        CHARACTER SKINS
                     </button>
                     <button
                        onClick={() => setTab('POWERUPS')}
                        className={`flex-1 py-2.5 rounded-xl font-cyber text-sm md:text-base font-bold transition-all border ${tab === 'POWERUPS' ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_20px_rgba(0,255,255,0.4)]' : 'bg-gray-900 text-gray-400 border-gray-700 hover:text-white'}`}
                     >
                        RUN POWER-UPS
                     </button>
                 </div>

                 {/* TAB 1: CHARACTER SKINS */}
                 {tab === 'SKINS' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full mb-8">
                         {CHARACTER_SKINS.map(skin => {
                             const isUnlocked = unlockedSkinIds.includes(skin.id);
                             const isEquipped = equippedSkinId === skin.id;
                             const canAfford = walletGems >= skin.cost;

                             return (
                                 <div 
                                    key={skin.id}
                                    style={{ borderColor: isEquipped ? skin.primaryColor : undefined }}
                                    className={`relative p-5 rounded-2xl flex flex-col justify-between border transition-all ${isEquipped ? 'bg-gray-900/90 shadow-[0_0_30px_rgba(0,255,255,0.2)]' : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'}`}
                                 >
                                     {/* Color Preview Swatch & Equipped Badge */}
                                     <div className="flex justify-between items-start mb-3">
                                         <div className="flex items-center space-x-2">
                                             <div className="w-5 h-5 rounded-full border border-white/30" style={{ backgroundColor: skin.primaryColor }}></div>
                                             <div className="w-5 h-5 rounded-full border border-white/30" style={{ backgroundColor: skin.secondaryColor }}></div>
                                             <div className="w-5 h-5 rounded-full border border-white/30" style={{ backgroundColor: skin.thrusterColor }}></div>
                                         </div>
                                         {isEquipped && (
                                             <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-400 text-black flex items-center">
                                                 <Check className="w-3 h-3 mr-1" /> EQUIPPED
                                             </span>
                                         )}
                                     </div>

                                     {/* Skin Info */}
                                     <div>
                                         <h3 className="text-lg md:text-xl font-black font-cyber text-white mb-0.5">{skin.name}</h3>
                                         <p className="text-xs text-cyan-400 font-mono mb-2">{skin.subtitle}</p>
                                         <p className="text-gray-400 text-xs mb-3 leading-relaxed">{skin.description}</p>
                                         
                                         {/* Passive Ability Box */}
                                         <div className="p-2.5 rounded-lg bg-black/60 border border-white/10 mb-4">
                                             <span className="text-[10px] uppercase tracking-wider text-yellow-400 font-bold block mb-1">
                                                 PASSIVE ABILITY:
                                             </span>
                                             <p className="text-xs text-gray-200">{skin.passiveDesc}</p>
                                         </div>
                                     </div>

                                     {/* Action Buttons */}
                                     <div>
                                         {isEquipped ? (
                                             <button disabled className="w-full py-2.5 rounded-xl font-bold font-mono text-sm bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 cursor-default">
                                                 ACTIVE UNIT
                                             </button>
                                         ) : isUnlocked ? (
                                             <button 
                                                onClick={() => equipSkin(skin.id)}
                                                className="w-full py-2.5 rounded-xl font-bold font-mono text-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-125 transition-all text-white shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                                             >
                                                 EQUIP SKIN
                                             </button>
                                         ) : (
                                             <button 
                                                onClick={() => buySkin(skin.id)}
                                                disabled={!canAfford}
                                                className={`w-full py-2.5 rounded-xl font-bold font-mono text-sm flex items-center justify-center transition-all ${canAfford ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:brightness-125 text-black shadow-[0_0_20px_rgba(255,180,0,0.3)]' : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-60'}`}
                                             >
                                                 <Diamond className="w-4 h-4 mr-1.5" /> UNLOCK ({skin.cost} GEMS)
                                             </button>
                                         )}
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                 )}

                 {/* TAB 2: RUN POWER-UPS */}
                 {tab === 'POWERUPS' && (
                     <div className="w-full max-w-4xl mb-8">
                         {!isMidRun && (
                             <div className="p-3 mb-4 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs text-center font-mono">
                                 Note: Run Power-Ups can be purchased during active runs via the Cyber Shop Portal using in-run score/credits!
                             </div>
                         )}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {items.map(item => {
                                 const Icon = item.icon;
                                 const canAfford = score >= item.cost;
                                 return (
                                     <div key={item.id} className="bg-gray-900/80 border border-gray-700 p-5 rounded-2xl flex items-center justify-between">
                                         <div className="flex items-center space-x-4">
                                             <div className="bg-gray-800 p-3 rounded-xl">
                                                 <Icon className="w-7 h-7 text-cyan-400" />
                                             </div>
                                             <div>
                                                 <h4 className="text-base font-bold font-cyber text-white">{item.name}</h4>
                                                 <p className="text-xs text-gray-400 max-w-xs">{item.description}</p>
                                             </div>
                                         </div>
                                         {isMidRun ? (
                                             <button 
                                                onClick={() => buyItem(item.id as any, item.cost)}
                                                disabled={!canAfford}
                                                className={`px-4 py-2 rounded-xl font-bold text-xs font-mono ml-4 shrink-0 ${canAfford ? 'bg-cyan-500 hover:bg-cyan-400 text-black' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                                             >
                                                 {item.cost} CREDITS
                                             </button>
                                         ) : (
                                             <span className="text-xs text-gray-500 font-mono ml-4 shrink-0">{item.cost} CREDITS</span>
                                         )}
                                     </div>
                                 );
                             })}
                         </div>
                     </div>
                 )}

                 {/* Close / Resume Button */}
                 <button 
                    onClick={onClose}
                    className="flex items-center px-10 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:scale-105 transition-all shadow-[0_0_25px_rgba(255,0,255,0.4)]"
                 >
                     {isMidRun ? 'RESUME MISSION' : 'BACK TO LAUNCHPAD'} <Play className="ml-2 w-5 h-5 fill-white" />
                 </button>
             </div>
        </div>
    );
};

export const HUD: React.FC<{ onOpenShowcase?: () => void }> = ({ onOpenShowcase }) => {
  const { 
    score, 
    highScore,
    lives, 
    maxLives, 
    collectedLetters, 
    status, 
    level, 
    restartGame, 
    startGame, 
    gemsCollected, 
    walletGems,
    distance, 
    hazardTier = 1,
    hazardMultiplier = 1.0,
    isImmortalityActive, 
    isSliding,
    speed,
    openShop,
    closeShop,
    getEquippedSkin
  } = useStore();
  
  const target = ['G', 'E', 'M', 'I', 'N', 'I'];
  const prevTier = useRef(hazardTier);
  const [warningBanner, setWarningBanner] = useState<string | null>(null);
  const [menuShopOpen, setMenuShopOpen] = useState(false);

  const currentSkin = getEquippedSkin();
  const theme = getThemeForLevel(level);
  const { isInstallable, isInstalled, install } = usePWAInstall();

  // Trigger alert banner when hazard tier escalates
  useEffect(() => {
    if (hazardTier > prevTier.current && status === GameStatus.PLAYING) {
        const info = HAZARD_INFO[hazardTier] || HAZARD_INFO[1];
        setWarningBanner(`${info.name}: ${info.desc}`);
        const timer = setTimeout(() => setWarningBanner(null), 3200);
        return () => clearTimeout(timer);
    }
    prevTier.current = hazardTier;
  }, [hazardTier, status]);

  const containerClass = "absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-8 z-50";

  // Mid-run shop portal opened
  if (status === GameStatus.SHOP) {
      return <ShopModal isOpen={true} onClose={closeShop} />;
  }

  // Main Launchpad Menu
  if (status === GameStatus.MENU) {
      return (
          <>
              <ShopModal isOpen={menuShopOpen} onClose={() => setMenuShopOpen(false)} />
              <div className="absolute inset-0 flex items-center justify-center z-[100] bg-black/80 backdrop-blur-md p-4 pointer-events-auto">
                  <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,255,255,0.3)] border border-cyan-500/40 animate-in zoom-in-95 duration-500 bg-gray-950">
                    
                    {/* Cover Art */}
                    <div className="relative w-full bg-gray-900">
                         <img 
                          src="https://www.gstatic.com/aistudio/starter-apps/gemini_runner/gemini_runner.png" 
                          alt="Gemini Runner Cover" 
                          className="w-full h-auto block"
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-[#09031a] via-black/40 to-transparent"></div>
                         
                         {/* Top Corner Bank & High Score */}
                         <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
                             <div className="flex items-center px-3 py-1 rounded-full bg-black/70 border border-yellow-500/50 text-yellow-400 font-mono text-xs font-bold shadow-md">
                                 <Trophy className="w-3.5 h-3.5 mr-1.5" /> HIGH: {highScore.toLocaleString()}
                             </div>
                             <div className="flex items-center px-3 py-1 rounded-full bg-black/70 border border-cyan-400/50 text-cyan-300 font-mono text-xs font-bold shadow-md">
                                 <Diamond className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> {walletGems.toLocaleString()}
                             </div>
                         </div>
                         
                         {/* Content area */}
                         <div className="absolute inset-0 flex flex-col justify-end items-center p-6 pb-7 text-center z-10">
                            
                            {/* Active Skin Badge */}
                            <div className="mb-3 px-3 py-1 rounded-full bg-black/70 border border-cyan-400/40 text-cyan-300 text-xs font-mono flex items-center">
                                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-yellow-400" />
                                ACTIVE: <span className="font-bold ml-1 text-white">{currentSkin.name}</span>
                            </div>

                            {/* Start Run Button */}
                            <button 
                              onClick={() => { audio.init(); startGame(); }}
                              className="w-full group relative px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-xl rounded-xl hover:bg-white/20 transition-all shadow-[0_0_25px_rgba(0,255,255,0.3)] hover:shadow-[0_0_35px_rgba(0,255,255,0.5)] hover:border-cyan-400 overflow-hidden mb-3"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/50 via-purple-500/50 to-pink-500/50 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                <span className="relative z-10 tracking-widest flex items-center justify-center font-cyber">
                                    LAUNCH RUN <Play className="ml-2 w-5 h-5 fill-white" />
                                </span>
                            </button>

                            {/* Action Buttons Row */}
                            <div className={`grid ${(!isInstalled && isInstallable) ? 'grid-cols-3' : 'grid-cols-2'} gap-2 w-full`}>
                                <button
                                   onClick={() => setMenuShopOpen(true)}
                                   className="py-2.5 px-2 rounded-xl bg-gray-900/90 border border-gray-700 hover:border-cyan-400 text-white font-bold font-mono text-[10px] sm:text-xs flex items-center justify-center transition-all shadow-md hover:bg-gray-800"
                                >
                                   <ShoppingBag className="w-3.5 h-3.5 mr-1 text-cyan-400 shrink-0" /> SKINS & SHOP
                                </button>
                                {onOpenShowcase && (
                                    <button
                                       onClick={onOpenShowcase}
                                       className="py-2.5 px-2 rounded-xl bg-purple-950/70 border border-purple-500/50 hover:border-purple-400 text-purple-200 font-bold font-mono text-[10px] sm:text-xs flex items-center justify-center transition-all shadow-md hover:bg-purple-900/60"
                                    >
                                       <Sparkles className="w-3.5 h-3.5 mr-1 text-yellow-400 shrink-0" /> SHOWCASE
                                    </button>
                                )}
                                {!isInstalled && isInstallable && (
                                    <button
                                       onClick={install}
                                       className="py-2.5 px-2 rounded-xl bg-cyan-950/80 border border-cyan-400/60 hover:border-cyan-300 text-cyan-300 font-bold font-mono text-[10px] sm:text-xs flex items-center justify-center transition-all shadow-md hover:bg-cyan-900/50"
                                       title="Install Hacker Ankit Game directly to mobile home screen"
                                    >
                                       <Download className="w-3.5 h-3.5 mr-1 text-cyan-400 shrink-0" /> INSTALL
                                    </button>
                                )}
                            </div>

                            {/* Natural Responsive Controls Legend */}
                            <div className="mt-4 text-cyan-400/80 text-[10px] md:text-[11px] font-mono tracking-wider space-y-0.5 border-t border-white/10 pt-2.5 w-full">
                                <p><span className="text-white font-bold">DESKTOP:</span> [A/D / Arrows] Move • [W / Up] Jump • [S / Down] Slide</p>
                                <p><span className="text-white font-bold">MOBILE:</span> Swipe ◀ ▶ to Move • ▲ Jump • ▼ Slide</p>
                            </div>
                         </div>
                    </div>
                  </div>
              </div>
          </>
      );
  }

  // Game Over Screen with Endless Stats
  if (status === GameStatus.GAME_OVER) {
      const hazard = HAZARD_INFO[hazardTier] || HAZARD_INFO[1];
      return (
          <div className="absolute inset-0 bg-black/90 z-[100] text-white pointer-events-auto backdrop-blur-md overflow-y-auto">
              <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
                <h1 className="text-4xl md:text-6xl font-black text-white mb-6 drop-shadow-[0_0_15px_rgba(255,0,85,0.9)] font-cyber text-center">GAME OVER</h1>
                
                <div className="grid grid-cols-1 gap-3 md:gap-4 text-center mb-8 w-full max-w-md">
                    <div className="bg-gray-900/90 p-3 md:p-4 rounded-xl border border-gray-700 flex items-center justify-between">
                        <div className="flex items-center text-yellow-400 text-sm md:text-base"><Trophy className="mr-2 w-4 h-4 md:w-5 md:h-5"/> ENDLESS LEVEL REACHED</div>
                        <div className="text-xl md:text-2xl font-bold font-mono">LEVEL {level}</div>
                    </div>
                    <div className="bg-gray-900/90 p-3 md:p-4 rounded-xl border border-gray-700 flex items-center justify-between">
                        <div className="flex items-center text-purple-400 text-sm md:text-base"><MapPin className="mr-2 w-4 h-4 md:w-5 md:h-5"/> DISTANCE SURVIVED</div>
                        <div className="text-xl md:text-2xl font-bold font-mono">{Math.floor(distance)} LY</div>
                    </div>
                    <div className="bg-gray-900/90 p-3 md:p-4 rounded-xl border border-gray-700 flex items-center justify-between">
                        <div className="flex items-center text-cyan-400 text-sm md:text-base"><Diamond className="mr-2 w-4 h-4 md:w-5 md:h-5"/> GEMS HARVESTED</div>
                        <div className="text-xl md:text-2xl font-bold font-mono">+{gemsCollected} (Total: {walletGems})</div>
                    </div>
                    <div className="bg-gray-900/90 p-3 md:p-4 rounded-xl border border-gray-700 flex items-center justify-between">
                        <div className="flex items-center text-red-400 text-sm md:text-base"><AlertTriangle className="mr-2 w-4 h-4 md:w-5 md:h-5"/> HIGHEST THREAT</div>
                        <div className="text-lg md:text-xl font-bold font-mono" style={{ color: hazard.color }}>{hazard.name}</div>
                    </div>
                    <div className="bg-gray-800/80 p-3 md:p-4 rounded-xl flex items-center justify-between mt-2 border border-white/10">
                        <div className="flex items-center text-white text-sm md:text-base font-cyber">RUN SCORE</div>
                        <div className="text-2xl md:text-3xl font-bold font-cyber text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">{score.toLocaleString()}</div>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                    <button 
                      onClick={() => { audio.init(); restartGame(); }}
                      className="px-6 md:px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-base md:text-lg rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,255,0.4)] font-cyber"
                    >
                        RUN AGAIN
                    </button>
                    <button 
                      onClick={() => useStore.getState().setStatus(GameStatus.MENU)}
                      className="px-5 md:px-7 py-3 bg-gray-800 border border-gray-600 text-white font-bold text-base md:text-lg rounded-xl hover:scale-105 transition-all font-cyber"
                    >
                        LAUNCHPAD
                    </button>
                    {onOpenShowcase && (
                      <button 
                        onClick={onOpenShowcase}
                        className="px-5 md:px-7 py-3 bg-purple-950 border border-purple-500/50 text-purple-200 font-bold text-base md:text-lg rounded-xl hover:scale-105 transition-all font-cyber"
                      >
                        SHOWCASE
                      </button>
                    )}
                </div>
              </div>
          </div>
      );
  }

  const currentHazard = HAZARD_INFO[hazardTier] || HAZARD_INFO[1];

  return (
    <div className={containerClass}>
        {/* Top Bar */}
        <div className="flex justify-between items-start w-full">
            <div className="flex flex-col">
                <div className="text-3xl md:text-5xl font-bold text-cyan-400 drop-shadow-[0_0_12px_#00f5ff] font-cyber">
                    {score.toLocaleString()}
                </div>
                {/* Distance & Wallet in Top-Left */}
                <div className="flex items-center space-x-3 text-purple-300 font-mono text-sm md:text-base mt-0.5">
                    <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-purple-400" /> {Math.floor(distance)} LY</span>
                    <span className="flex items-center text-cyan-300"><Diamond className="w-3.5 h-3.5 mr-1 text-cyan-400" /> {gemsCollected}</span>
                </div>
            </div>
            
            <div className="flex space-x-1 md:space-x-2">
                {[...Array(maxLives)].map((_, i) => (
                    <Heart 
                        key={i} 
                        className={`w-6 h-6 md:w-8 md:h-8 ${i < lives ? 'text-pink-500 fill-pink-500' : 'text-gray-800 fill-gray-800'} drop-shadow-[0_0_8px_#ff0054]`} 
                    />
                ))}
            </div>
        </div>
        
        {/* Endless Level & Theme Indicator - Top Center */}
        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 text-center z-50">
            <div className="text-xs md:text-sm text-purple-300 font-bold tracking-widest font-mono bg-black/70 px-4 py-1 rounded-full border border-purple-500/40 backdrop-blur-md shadow-lg">
                LEVEL {level} • <span className="text-white">{theme.name}</span>
            </div>
        </div>

        {/* Hazard Tier Escalation Banner (Temporary Alert) */}
        {warningBanner && (
            <div className="absolute top-28 left-1/2 transform -translate-x-1/2 bg-red-950/90 border border-red-500/80 px-4 py-2 rounded-xl backdrop-blur-md flex items-center shadow-[0_0_25px_rgba(255,0,0,0.6)] animate-bounce z-50">
                <AlertTriangle className="text-yellow-400 w-5 h-5 mr-2 animate-pulse" />
                <span className="text-white font-mono text-xs md:text-sm font-bold tracking-wider">
                    {warningBanner}
                </span>
            </div>
        )}

        {/* Active Skill & Slide Indicators */}
        <div className="absolute top-36 left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-2 pointer-events-none">
            {isImmortalityActive && (
                 <div className="text-yellow-300 font-bold text-lg md:text-xl animate-pulse flex items-center drop-shadow-[0_0_15px_gold]">
                     <Shield className="mr-1.5 fill-yellow-400 w-5 h-5" /> IMMORTAL ACTIVE
                 </div>
            )}
            {isSliding && (
                 <div className="text-cyan-300 font-mono text-xs md:text-sm bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-400/50 flex items-center tracking-widest">
                     <ChevronDown className="mr-1 w-4 h-4 text-cyan-400 animate-bounce" /> SLIDING
                 </div>
            )}
        </div>

        {/* Gemini Target Collection Status */}
        <div className="absolute top-16 md:top-20 left-1/2 transform -translate-x-1/2 flex space-x-2 md:space-x-3">
            {target.map((char, idx) => {
                const isCollected = collectedLetters.includes(idx);
                const color = GEMINI_COLORS[idx];

                return (
                    <div 
                        key={idx}
                        style={{
                            borderColor: isCollected ? color : 'rgba(75, 85, 99, 0.8)',
                            color: isCollected ? 'rgba(0, 0, 0, 0.85)' : 'rgba(156, 163, 175, 0.6)',
                            boxShadow: isCollected ? `0 0 22px ${color}` : 'none',
                            backgroundColor: isCollected ? color : 'rgba(0, 0, 0, 0.85)'
                        }}
                        className="w-8 h-10 md:w-10 md:h-12 flex items-center justify-center border-2 font-black text-lg md:text-xl font-cyber rounded-lg transform transition-all duration-300"
                    >
                        {char}
                    </div>
                );
            })}
        </div>

        {/* Bottom Overlay: Left Threat Badge & Right Speed Counter */}
        <div className="w-full flex justify-between items-end">
             {/* Hazard Threat Level Pill */}
             <div 
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-black/60 border backdrop-blur-md transition-colors"
                style={{ borderColor: currentHazard.color }}
             >
                 <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 animate-pulse" style={{ color: currentHazard.color }} />
                 <div className="flex flex-col">
                     <span className="font-cyber text-[10px] md:text-xs font-bold tracking-wider" style={{ color: currentHazard.color }}>
                         {currentHazard.name}
                     </span>
                     <span className="text-gray-400 font-mono text-[9px] md:text-[10px]">
                         DIFFICULTY {hazardMultiplier.toFixed(1)}x
                     </span>
                 </div>
             </div>

             {/* Speed Gauge */}
             <div className="flex items-center space-x-2 text-cyan-400 bg-black/60 px-3 py-1.5 rounded-lg border border-cyan-500/40 backdrop-blur-md">
                 <Zap className="w-4 h-4 md:w-5 md:h-5 animate-pulse text-cyan-300" />
                 <span className="font-mono text-sm md:text-lg font-bold">SPEED {Math.round((speed / RUN_SPEED_BASE) * 100)}%</span>
             </div>
        </div>
    </div>
  );
};
