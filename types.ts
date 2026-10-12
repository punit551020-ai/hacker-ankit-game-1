/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  SHOP = 'SHOP',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum ObjectType {
  OBSTACLE = 'OBSTACLE',
  GEM = 'GEM',
  LETTER = 'LETTER',
  SHOP_PORTAL = 'SHOP_PORTAL',
  ALIEN = 'ALIEN',
  MISSILE = 'MISSILE',
  MOVING_DRONE = 'MOVING_DRONE',
  LASER_GATE = 'LASER_GATE'
}

export interface GameObject {
  id: string;
  type: ObjectType;
  position: [number, number, number]; // x, y, z
  active: boolean;
  value?: string; // For letters (G, E, M...)
  color?: string;
  targetIndex?: number; // Index in the GEMINI target word
  points?: number; // Score value for gems
  hasFired?: boolean; // For Aliens
  baseX?: number; // Starting center X for moving hazards
  patrolSpeed?: number; // Frequency/speed of sway
  patrolAmplitude?: number; // Width of sway across lanes
  laserHeight?: number; // For laser gate collision calculation
  isTallLaser?: boolean; // If true, cannot be jumped over (must dodge)
  canSlideUnder?: boolean; // If true, can be dodged by sliding/ducking
}

export const LANE_WIDTH = 2.2;
export const JUMP_HEIGHT = 2.5;
export const JUMP_DURATION = 0.6; // seconds
export const RUN_SPEED_BASE = 22.5;
export const SPAWN_DISTANCE = 120;
export const REMOVE_DISTANCE = 20; // Behind player

// Google-ish Neon Colors: Blue, Red, Yellow, Blue, Green, Red
export const GEMINI_COLORS = [
    '#2979ff', // G - Blue
    '#ff1744', // E - Red
    '#ffea00', // M - Yellow
    '#2979ff', // I - Blue
    '#00e676', // N - Green
    '#ff1744', // I - Red
];

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    icon: any; // Lucide icon component
    oneTime?: boolean; // If true, remove from pool after buying
}

export interface CharacterSkin {
    id: string;
    name: string;
    subtitle: string;
    description: string;
    cost: number;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    glowColor: string;
    thrusterColor: string;
    passiveDesc: string;
    bonusJump?: number;
    bonusMaxLife?: number;
    bonusGemMultiplier?: number;
    startsDoubleJump?: boolean;
    startsImmortality?: boolean;
    immortalityDurationBonus?: number;
}

export const CHARACTER_SKINS: CharacterSkin[] = [
    {
        id: 'AERO_VORTEX',
        name: 'AERO VORTEX',
        subtitle: 'Mark IX Prototype',
        description: 'Aerodynamic speedster with balanced propulsion and responsive lateral thrusters.',
        cost: 0,
        primaryColor: '#00e5ff',
        secondaryColor: '#1e1b4b',
        accentColor: '#ff007f',
        glowColor: '#00ffff',
        thrusterColor: '#00f7ff',
        passiveDesc: 'Standard Thrusters: Baseline balanced agility and jump physics.'
    },
    {
        id: 'NEON_PHANTOM',
        name: 'NEON PHANTOM',
        subtitle: 'Cyber Stealth Unit',
        description: 'Sleek dark-matter chassis engineered for high-altitude leaps and evasive slides.',
        cost: 300,
        primaryColor: '#bf00ff',
        secondaryColor: '#090814',
        accentColor: '#00ffff',
        glowColor: '#ff00ea',
        thrusterColor: '#d946ef',
        passiveDesc: 'Agile Drift: +20% Higher Jump and swift slide recovery.',
        bonusJump: 1.2
    },
    {
        id: 'SOLAR_STRIKER',
        name: 'SOLAR STRIKER',
        subtitle: 'Heavy Magma Vanguard',
        description: 'Reinforced titanium alloy chassis powered by mini solar core reactors.',
        cost: 750,
        primaryColor: '#ff9900',
        secondaryColor: '#2b0c04',
        accentColor: '#ff003c',
        glowColor: '#ffdd00',
        thrusterColor: '#ff5500',
        passiveDesc: 'Magma Bulk: +1 Extra Max Life and Double Jump always unlocked!',
        bonusMaxLife: 1,
        startsDoubleJump: true
    },
    {
        id: 'QUANTUM_DRIFTER',
        name: 'QUANTUM DRIFTER',
        subtitle: 'Dimensional Collector',
        description: 'Harnesses tachyon field emitters that attract energy gems and amplify rewards.',
        cost: 1400,
        primaryColor: '#00ff9d',
        secondaryColor: '#031f17',
        accentColor: '#00e5ff',
        glowColor: '#5eead4',
        thrusterColor: '#10b981',
        passiveDesc: 'Flux Magnet: Gems yield +50% extra score and +2.5s Immortality duration.',
        bonusGemMultiplier: 1.5,
        immortalityDurationBonus: 2500
    },
    {
        id: 'HYPERION_TITAN',
        name: 'HYPERION TITAN',
        subtitle: 'Apex Celestial Frame',
        description: 'Supreme cyber-warrior forged in pure celestial chrome and radiant plasma.',
        cost: 2500,
        primaryColor: '#ffffff',
        secondaryColor: '#181829',
        accentColor: '#ffd700',
        glowColor: '#38bdf8',
        thrusterColor: '#38bdf8',
        passiveDesc: 'Apex Aegis: Starts with Immortality ability unlocked + 1 bonus Energy Shield!',
        startsImmortality: true,
        bonusMaxLife: 1
    }
];

export interface LevelTheme {
    levelNumber: number;
    name: string;
    tagline: string;
    skyColor: string;
    fogColor: string;
    ambientColor: string;
    directionalColor: string;
    fillColor: string;
    trackColor: string;
    trackGlowColor: string;
    railLeftColor: string;
    railRightColor: string;
    separatorColor: string;
    sunTopColor: string;
    sunBottomColor: string;
    gridColor: string;
    chevronColor: string;
}

export const LEVEL_THEMES: Omit<LevelTheme, 'levelNumber'>[] = [
    {
        name: 'NEON SYNTHWAVE',
        tagline: 'Retro-Futuristic Twilight Corridor',
        skyColor: '#10072b',
        fogColor: '#10072b',
        ambientColor: '#7550a8',
        directionalColor: '#eef8ff',
        fillColor: '#ff2e93',
        trackColor: '#200d3d',
        trackGlowColor: '#120424',
        railLeftColor: '#00ffff',
        railRightColor: '#ff007f',
        separatorColor: '#8833ff',
        sunTopColor: '#fff056',
        sunBottomColor: '#ff007f',
        gridColor: '#b030ff',
        chevronColor: '#00e5ff',
    },
    {
        name: 'CYBER MATRIX',
        tagline: 'Hyperdrive Emerald Data Network',
        skyColor: '#041812',
        fogColor: '#041812',
        ambientColor: '#1a664e',
        directionalColor: '#e0fff4',
        fillColor: '#00ffaa',
        trackColor: '#06261c',
        trackGlowColor: '#021a12',
        railLeftColor: '#00ff88',
        railRightColor: '#00f0ff',
        separatorColor: '#059669',
        sunTopColor: '#6ee7b7',
        sunBottomColor: '#059669',
        gridColor: '#10b981',
        chevronColor: '#34d399',
    },
    {
        name: 'SOLAR INFERNO',
        tagline: 'Magma Flare Atmospheric Rift',
        skyColor: '#1a0707',
        fogColor: '#1a0707',
        ambientColor: '#852b1d',
        directionalColor: '#fff1e0',
        fillColor: '#ff3b30',
        trackColor: '#2a0a0a',
        trackGlowColor: '#170303',
        railLeftColor: '#ff8800',
        railRightColor: '#ff003c',
        separatorColor: '#dc2626',
        sunTopColor: '#ffdd00',
        sunBottomColor: '#ff1100',
        gridColor: '#f97316',
        chevronColor: '#fbbf24',
    },
    {
        name: 'ABYSSAL VOID',
        tagline: 'Deep Amethyst & Stellar Shards',
        skyColor: '#0d0421',
        fogColor: '#0d0421',
        ambientColor: '#6d28d9',
        directionalColor: '#ede9fe',
        fillColor: '#8b5cf6',
        trackColor: '#1b0a38',
        trackGlowColor: '#0f0321',
        railLeftColor: '#bf00ff',
        railRightColor: '#38bdf8',
        separatorColor: '#7c3aed',
        sunTopColor: '#e879f9',
        sunBottomColor: '#6366f1',
        gridColor: '#8b5cf6',
        chevronColor: '#c084fc',
    },
    {
        name: 'QUANTUM AURORA',
        tagline: 'Golden Nexus & Prismatic Highway',
        skyColor: '#161203',
        fogColor: '#161203',
        ambientColor: '#a16207',
        directionalColor: '#fef3c7',
        fillColor: '#f59e0b',
        trackColor: '#261e05',
        trackGlowColor: '#140f02',
        railLeftColor: '#ffd700',
        railRightColor: '#00f0ff',
        separatorColor: '#ca8a04',
        sunTopColor: '#fef08a',
        sunBottomColor: '#d97706',
        gridColor: '#eab308',
        chevronColor: '#fde047',
    }
];

export const getThemeForLevel = (level: number): LevelTheme => {
    const index = Math.max(0, (level - 1) % LEVEL_THEMES.length);
    return {
        ...LEVEL_THEMES[index],
        levelNumber: level
    };
};
