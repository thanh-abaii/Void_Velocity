
export const CANVAS_WIDTH = window.innerWidth;
export const CANVAS_HEIGHT = window.innerHeight;

// Player
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 60;
export const PLAYER_SPEED = 8;
export const PLAYER_COLOR = '#00f0ff'; // Default Cyan

export const PLAYER_MAX_SHIELD = 1000;
export const SHIELD_REGEN_AMOUNT = 300;
export const SHIELD_PASSIVE_DRAIN = 0.2; // Reduced from 0.5 to be more reasonable

export const SHIP_COLORS = [
  '#00f0ff', // Cyan
  '#ff0055', // Red
  '#7000ff', // Purple
  '#00ff99', // Green
  '#ffcc00'  // Yellow
];

// Weapons
export const WEAPON_DOWNGRADE_SHOTS = 80; // Increased from 25 to 80 (approx 12-15s of shooting)

// Asteroids
export const MIN_ASTEROID_SIZE = 30;
export const MAX_ASTEROID_SIZE = 80;
export const ASTEROID_BASE_SPEED = 3;
export const SPAWN_RATE_MS = 800; // Spawn new asteroid every X ms

export const ASTEROID_VARIANTS = {
  CARBON: { 
    color: '#8899aa', 
    innerColor: '#4b5563',
    glow: null, 
    damageMult: 1, 
    hpMult: 1,
    jaggedness: 0.6 // Medium jagged
  },
  METALLIC: { 
    color: '#e5e7eb', 
    innerColor: '#9ca3af',
    glow: '#ffffff', 
    damageMult: 1.5, 
    hpMult: 2.5, // Very hard
    jaggedness: 0.9 // Very spiky
  },
  MAGMA: { 
    color: '#ff4400', 
    innerColor: '#7f1d1d',
    glow: '#ff4400', 
    damageMult: 2.0, // High damage
    hpMult: 0.8, // Brittle
    jaggedness: 0.5
  },
  ICE: { 
    color: '#a5f3fc', 
    innerColor: '#0891b2',
    glow: '#22d3ee', 
    damageMult: 0.6, // Low damage
    hpMult: 0.5, // Weak
    jaggedness: 0.7
  }
};

// Level System
export const LEVEL_THRESHOLDS = [0, 1000, 3000, 6000, 10000]; // Score needed for Level 1, 2, 3, 4, 5
export const LEVEL_NAMES = [
  "Sector Alpha", 
  "The Debris Field", 
  "Kessler Syndrome", 
  "The Deep Void", 
  "Event Horizon"
];
// Difficulty Scaling per level
export const LEVEL_SPEED_MULTIPLIER = 1.3; // Asteroids get 30% faster per level (Increased from 1.2)
export const LEVEL_SPAWN_RATE_REDUCTION = 120; // Spawn 120ms faster per level (Increased from 100)

// PowerUps
export const POWERUP_SIZE = 25;
export const POWERUP_SPEED = 2.5;
export const WEAPON_DURATION = 5000; // 5 seconds (if used as temporary) - we will use permanent levels now
export const SPEED_BOOST_DURATION = 5000; // 5 seconds

// Projectiles
export const PROJECTILE_WIDTH = 4;
export const PROJECTILE_HEIGHT = 15;
export const PROJECTILE_SPEED = 15;

// Visuals
export const STAR_COUNT = 150;
export const COLOR_PALETTE = {
  primary: '#00f0ff',
  secondary: '#7000ff',
  danger: '#ff0055',
  success: '#00ff99',
  warning: '#ffcc00',
  bg: '#050505',
  text: '#ffffff'
};

// High Scores
export const STORAGE_KEY_HIGH_SCORES = 'void_velocity_high_scores';
export const MAX_HIGH_SCORES = 5;

// Gemini Prompts
export const SYSTEM_INSTRUCTION = `You are VOID-AI, the onboard navigation computer of a solitary space shuttle. 
Your personality is calm, slightly sarcastic, and highly analytical. 
Keep responses short (max 2 sentences). Do not use markdown formatting.`;
