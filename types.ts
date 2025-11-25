
export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export type ShipShape = 'X-VANGUARD' | 'A-VELOCITY' | 'Y-FORTRESS';
export type PowerUpType = 'SHIELD' | 'WEAPON' | 'FUEL';
export type AsteroidType = 'CARBON' | 'METALLIC' | 'MAGMA' | 'ICE';

export interface Point {
  x: number;
  y: number;
}

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  color: string;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
}

export interface Player extends Entity {
  shield: number; // 0-1000
  maxShield: number;
  weaponLevel: number; // 1, 2, 3
  shotCount: number; // Tracks shots fired to degrade weapon
  speedBoostTimer: number; // Time remaining for speed boost in ms
  shape: ShipShape;
}

export interface Asteroid extends Entity {
  type: AsteroidType;
  rotation: number;
  rotationSpeed: number;
  points: Point[]; // Polygon points for drawing
  hp: number;
  damage: number; // Damage dealt on impact
}

export interface PowerUp extends Entity {
  type: PowerUpType;
  pulse: number; // For visual animation
}

export interface Projectile extends Entity {
  active: boolean;
}

export interface HighScoreEntry {
  score: number;
  date: string; // ISO string
}

export interface GameAssets {
  ship: string | null;
  asteroids: Record<AsteroidType, string | null>;
}
