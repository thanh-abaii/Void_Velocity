
export const CANVAS_WIDTH = window.innerWidth;
export const CANVAS_HEIGHT = window.innerHeight;

// Player
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 60;
export const PLAYER_SPEED = 8;
export const PLAYER_COLOR = '#00f0ff'; // Default Cyan

export const PLAYER_MAX_SHIELD = 1000;
export const SHIELD_REGEN_AMOUNT = 300;

export const SHIP_COLORS = [
  '#00f0ff', // Cyan
  '#ff0055', // Red
  '#7000ff', // Purple
  '#00ff99', // Green
  '#ffcc00'  // Yellow
];

// Asteroids
export const MIN_ASTEROID_SIZE = 30;
export const MAX_ASTEROID_SIZE = 80;
export const ASTEROID_BASE_SPEED = 3;
export const SPAWN_RATE_MS = 800; // Spawn new asteroid every X ms

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

// Gemini Prompts
export const SYSTEM_INSTRUCTION = `You are VOID-AI, the onboard navigation computer of a solitary space shuttle. 
Your personality is calm, slightly sarcastic, and highly analytical. 
Keep responses short (max 2 sentences). Do not use markdown formatting.`;
