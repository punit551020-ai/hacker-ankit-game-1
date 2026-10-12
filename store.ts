/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { create } from 'zustand';
import { GameStatus, RUN_SPEED_BASE, CharacterSkin, CHARACTER_SKINS } from './types';
import { audio } from './components/System/Audio';

const STORAGE_KEYS = {
  WALLET_GEMS: 'gemini_runner_wallet_gems',
  UNLOCKED_SKINS: 'gemini_runner_unlocked_skins',
  EQUIPPED_SKIN: 'gemini_runner_equipped_skin',
  HIGH_SCORE: 'gemini_runner_high_score',
};

const getStoredWalletGems = (): number => {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.WALLET_GEMS);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
};

const getStoredUnlockedSkins = (): string[] => {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.UNLOCKED_SKINS);
    return val ? JSON.parse(val) : ['AERO_VORTEX'];
  } catch {
    return ['AERO_VORTEX'];
  }
};

const getStoredEquippedSkin = (): string => {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.EQUIPPED_SKIN);
    return val || 'AERO_VORTEX';
  } catch {
    return 'AERO_VORTEX';
  }
};

const getStoredHighScore = (): number => {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
};

interface GameState {
  status: GameStatus;
  score: number;
  highScore: number;
  lives: number;
  maxLives: number;
  speed: number;
  collectedLetters: number[]; 
  level: number;
  laneCount: number;
  gemsCollected: number; // In current run
  walletGems: number;    // Persistent player bank
  distance: number;
  hazardTier: number;
  hazardMultiplier: number;
  
  // Skins & Economy
  unlockedSkinIds: string[];
  equippedSkinId: string;

  // Inventory / Abilities
  hasDoubleJump: boolean;
  hasImmortality: boolean;
  isImmortalityActive: boolean;
  isSliding: boolean;

  // Actions
  startGame: () => void;
  restartGame: () => void;
  takeDamage: () => void;
  addScore: (amount: number) => void;
  collectGem: (value: number) => void;
  collectLetter: (index: number) => void;
  setStatus: (status: GameStatus) => void;
  setDistance: (dist: number) => void;
  updateDistanceAndHazard: (dist: number) => void;
  setSpeed: (speed: number) => void;
  setIsSliding: (sliding: boolean) => void;
  
  // Shop & Skins
  buyItem: (type: 'DOUBLE_JUMP' | 'MAX_LIFE' | 'HEAL' | 'IMMORTAL', cost: number) => boolean;
  buySkin: (skinId: string) => boolean;
  equipSkin: (skinId: string) => void;
  getEquippedSkin: () => CharacterSkin;
  advanceLevel: () => void;
  openShop: () => void;
  closeShop: () => void;
  activateImmortality: () => void;
}

const GEMINI_TARGET = ['G', 'E', 'M', 'I', 'N', 'I'];

export const useStore = create<GameState>((set, get) => ({
  status: GameStatus.MENU,
  score: 0,
  highScore: getStoredHighScore(),
  lives: 3,
  maxLives: 3,
  speed: 0,
  collectedLetters: [],
  level: 1,
  laneCount: 3,
  gemsCollected: 0,
  walletGems: getStoredWalletGems(),
  distance: 0,
  hazardTier: 1,
  hazardMultiplier: 1.0,

  unlockedSkinIds: getStoredUnlockedSkins(),
  equippedSkinId: getStoredEquippedSkin(),
  
  hasDoubleJump: false,
  hasImmortality: false,
  isImmortalityActive: false,
  isSliding: false,

  getEquippedSkin: () => {
    const { equippedSkinId } = get();
    return CHARACTER_SKINS.find(s => s.id === equippedSkinId) || CHARACTER_SKINS[0];
  },

  startGame: () => {
    const skin = get().getEquippedSkin();
    const baseLives = 3 + (skin.bonusMaxLife || 0);

    set({ 
      status: GameStatus.PLAYING, 
      score: 0, 
      lives: baseLives, 
      maxLives: baseLives,
      speed: RUN_SPEED_BASE,
      collectedLetters: [],
      level: 1,
      laneCount: 3,
      gemsCollected: 0,
      distance: 0,
      hazardTier: 1,
      hazardMultiplier: 1.0,
      hasDoubleJump: !!skin.startsDoubleJump,
      hasImmortality: !!skin.startsImmortality,
      isImmortalityActive: false,
      isSliding: false,
    });
  },

  restartGame: () => {
    const skin = get().getEquippedSkin();
    const baseLives = 3 + (skin.bonusMaxLife || 0);

    set({ 
      status: GameStatus.PLAYING, 
      score: 0, 
      lives: baseLives, 
      maxLives: baseLives,
      speed: RUN_SPEED_BASE,
      collectedLetters: [],
      level: 1,
      laneCount: 3,
      gemsCollected: 0,
      distance: 0,
      hazardTier: 1,
      hazardMultiplier: 1.0,
      hasDoubleJump: !!skin.startsDoubleJump,
      hasImmortality: !!skin.startsImmortality,
      isImmortalityActive: false,
      isSliding: false,
    });
  },

  takeDamage: () => {
    const { lives, isImmortalityActive } = get();
    if (isImmortalityActive) return;

    if (lives > 1) {
      set({ lives: lives - 1 });
    } else {
      const currentScore = get().score;
      const currentHigh = get().highScore;
      if (currentScore > currentHigh) {
        localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, currentScore.toString());
        set({ highScore: currentScore });
      }
      set({ lives: 0, status: GameStatus.GAME_OVER, speed: 0 });
    }
  },

  addScore: (amount) => set((state) => ({ score: state.score + amount })),
  
  collectGem: (value) => {
    const skin = get().getEquippedSkin();
    const multiplier = skin.bonusGemMultiplier || 1.0;
    const finalValue = Math.round(value * multiplier);

    const newGemsCollected = get().gemsCollected + 1;
    const newWalletGems = get().walletGems + 1;

    try {
      localStorage.setItem(STORAGE_KEYS.WALLET_GEMS, newWalletGems.toString());
    } catch {}

    set((state) => ({ 
      score: state.score + finalValue, 
      gemsCollected: newGemsCollected,
      walletGems: newWalletGems
    }));
  },

  setDistance: (dist) => set({ distance: dist }),

  updateDistanceAndHazard: (dist) => {
    const { level } = get();
    // Dynamic difficulty based on distance and endless level progression
    const levelBonus = (level - 1) * 0.4;
    const distanceMult = dist / 500;
    const totalHazard = 1 + distanceMult + levelBonus;

    let tier = 1;
    if (totalHazard >= 4.0 || dist >= 2200) tier = 5;
    else if (totalHazard >= 3.0 || dist >= 1400) tier = 4;
    else if (totalHazard >= 2.2 || dist >= 750) tier = 3;
    else if (totalHazard >= 1.5 || dist >= 300) tier = 2;

    set({
      distance: dist,
      hazardTier: tier,
      hazardMultiplier: Math.round(totalHazard * 10) / 10
    });
  },

  setSpeed: (speed) => set({ speed }),
  setIsSliding: (sliding) => set({ isSliding: sliding }),

  collectLetter: (index) => {
    const { collectedLetters, speed } = get();
    
    if (!collectedLetters.includes(index)) {
      const newLetters = [...collectedLetters, index];
      const speedIncrease = RUN_SPEED_BASE * 0.08;
      const nextSpeed = speed + speedIncrease;

      set({ 
        collectedLetters: newLetters,
        speed: nextSpeed
      });

      // Complete GEMINI word -> Endless advancement to Level 2, 3, 4, 5... infinitely!
      if (newLetters.length === GEMINI_TARGET.length) {
        get().advanceLevel();
      }
    }
  },

  advanceLevel: () => {
    const { level, laneCount, speed, score, walletGems } = get();
    const nextLevel = level + 1;
    
    // Reward player with score bonus & wallet gems
    const levelScoreBonus = 2500 + (level * 500);
    const gemBonus = 50 + (level * 25);
    const newWalletGems = walletGems + gemBonus;

    try {
      localStorage.setItem(STORAGE_KEYS.WALLET_GEMS, newWalletGems.toString());
    } catch {}

    audio.playLevelUp();

    // Alternate track expansion: level 1-2 (3 lanes), level 3-4 (5 lanes), level 5+ (5 or 7 lanes)
    let nextLanes = 3;
    if (nextLevel >= 5) nextLanes = 7;
    else if (nextLevel >= 3) nextLanes = 5;

    // Gradual linear speed scaling with soft cap
    const speedIncrease = RUN_SPEED_BASE * 0.25;
    const newSpeed = Math.min(speed + speedIncrease, RUN_SPEED_BASE * 2.4);

    set({
      level: nextLevel,
      score: score + levelScoreBonus,
      walletGems: newWalletGems,
      laneCount: nextLanes,
      status: GameStatus.PLAYING,
      speed: newSpeed,
      collectedLetters: [] // Reset letters for the new level
    });
  },

  openShop: () => set({ status: GameStatus.SHOP }),
  
  closeShop: () => {
    const prevStatus = get().status;
    if (prevStatus === GameStatus.SHOP) {
      set({ status: get().lives > 0 && get().speed > 0 ? GameStatus.PLAYING : GameStatus.MENU });
    }
  },

  buyItem: (type, cost) => {
    const { score, maxLives, lives } = get();
    
    if (score >= cost) {
      set({ score: score - cost });
      audio.playPurchase();
      
      switch (type) {
        case 'DOUBLE_JUMP':
          set({ hasDoubleJump: true });
          break;
        case 'MAX_LIFE':
          set({ maxLives: maxLives + 1, lives: lives + 1 });
          break;
        case 'HEAL':
          set({ lives: Math.min(lives + 1, maxLives) });
          break;
        case 'IMMORTAL':
          set({ hasImmortality: true });
          break;
      }
      return true;
    }
    return false;
  },

  buySkin: (skinId: string) => {
    const { walletGems, unlockedSkinIds } = get();
    const skin = CHARACTER_SKINS.find(s => s.id === skinId);
    if (!skin || unlockedSkinIds.includes(skinId)) return false;

    if (walletGems >= skin.cost) {
      const newWallet = walletGems - skin.cost;
      const newUnlocked = [...unlockedSkinIds, skinId];
      
      try {
        localStorage.setItem(STORAGE_KEYS.WALLET_GEMS, newWallet.toString());
        localStorage.setItem(STORAGE_KEYS.UNLOCKED_SKINS, JSON.stringify(newUnlocked));
        localStorage.setItem(STORAGE_KEYS.EQUIPPED_SKIN, skinId);
      } catch {}

      audio.playPurchase();
      set({
        walletGems: newWallet,
        unlockedSkinIds: newUnlocked,
        equippedSkinId: skinId
      });
      return true;
    }
    return false;
  },

  equipSkin: (skinId: string) => {
    const { unlockedSkinIds } = get();
    if (!unlockedSkinIds.includes(skinId)) return;

    try {
      localStorage.setItem(STORAGE_KEYS.EQUIPPED_SKIN, skinId);
    } catch {}

    set({ equippedSkinId: skinId });
  },

  activateImmortality: () => {
    const { hasImmortality, isImmortalityActive } = get();
    const skin = get().getEquippedSkin();
    const bonusDuration = skin.immortalityDurationBonus || 0;

    if (hasImmortality && !isImmortalityActive) {
      set({ isImmortalityActive: true });
      
      // Lasts 5 seconds + skin passive duration
      setTimeout(() => {
        set({ isImmortalityActive: false });
      }, 5000 + bonusDuration);
    }
  },

  setStatus: (status) => set({ status }),
}));
