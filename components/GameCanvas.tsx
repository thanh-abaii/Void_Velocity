
import React, { useEffect, useRef, useState } from 'react';
import { GameState, Player, Asteroid, Star, Point, ShipShape, PowerUp, PowerUpType, Projectile, Entity, AsteroidType } from '../types';
import { 
  PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_COLOR, 
  MIN_ASTEROID_SIZE, MAX_ASTEROID_SIZE, ASTEROID_BASE_SPEED,
  STAR_COUNT, COLOR_PALETTE,
  POWERUP_SIZE, POWERUP_SPEED, SPEED_BOOST_DURATION,
  PROJECTILE_WIDTH, PROJECTILE_HEIGHT, PROJECTILE_SPEED,
  PLAYER_MAX_SHIELD, SHIELD_REGEN_AMOUNT, SHIELD_PASSIVE_DRAIN,
  LEVEL_SPEED_MULTIPLIER, LEVEL_SPAWN_RATE_REDUCTION, WEAPON_DOWNGRADE_SHOTS,
  ASTEROID_VARIANTS
} from '../constants';
import { startThruster, stopThruster, playExplosion, playPowerUp, playShoot, playShieldBreak, playDamage } from '../services/audioService';

interface GameCanvasProps {
  gameState: GameState;
  onGameOver: (score: number, time: number) => void;
  setScore: (score: number) => void;
  setShield: (shield: number) => void;
  setWeaponLevel: (level: number) => void;
  shipColor: string;
  shipShape: ShipShape;
  level: number;
  generatedShipSprite: string | null;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, onGameOver, setScore, setShield, setWeaponLevel, 
  shipColor, shipShape, level, generatedShipSprite 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  
  // Game Entities Refs
  const playerRef = useRef<Player>({
    x: 0, 
    y: 0, 
    width: PLAYER_WIDTH, 
    height: PLAYER_HEIGHT, 
    vx: 0, 
    vy: 0, 
    color: PLAYER_COLOR, 
    shield: PLAYER_MAX_SHIELD,
    maxShield: PLAYER_MAX_SHIELD,
    weaponLevel: 1,
    shotCount: 0,
    speedBoostTimer: 0, 
    shape: 'STRIKER'
  });
  
  const asteroidsRef = useRef<Asteroid[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const starsRef = useRef<Star[]>([]);
  
  // AI Sprite Management
  const [processedShipImage, setProcessedShipImage] = useState<HTMLImageElement | null>(null);

  const lastSpawnTimeRef = useRef<number>(0);
  const lastPowerUpSpawnTimeRef = useRef<number>(0);
  const lastShotTimeRef = useRef<number>(0);
  const mouseXRef = useRef<number>(window.innerWidth / 2);

  // Optimization to avoid excessive React state updates
  const lastReportedShieldRef = useRef<number>(PLAYER_MAX_SHIELD);
  const lastReportedWeaponLevelRef = useRef<number>(1);

  // Process AI Image: Remove black background
  useEffect(() => {
    if (!generatedShipSprite) {
      setProcessedShipImage(null);
      return;
    }

    const img = new Image();
    img.src = generatedShipSprite;
    img.onload = () => {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = img.width;
      offCanvas.height = img.height;
      const ctx = offCanvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;

      // Simple black removal keying
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // If pixel is very dark (black), make it transparent
        if (r < 30 && g < 30 && b < 30) {
          data[i + 3] = 0;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      
      const processedImg = new Image();
      processedImg.src = offCanvas.toDataURL();
      setProcessedShipImage(processedImg);
    };
  }, [generatedShipSprite]);

  // Initialize Stars
  const initStars = (width: number, height: number) => {
    const stars: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 2 + 0.2,
        brightness: Math.random()
      });
    }
    starsRef.current = stars;
  };

  const createAsteroid = (width: number): Asteroid => {
    // Determine Type
    const randType = Math.random();
    let type: AsteroidType = 'CARBON';
    if (randType > 0.6 && randType <= 0.75) type = 'METALLIC'; // 15%
    else if (randType > 0.75 && randType <= 0.85) type = 'MAGMA'; // 10%
    else if (randType > 0.85) type = 'ICE'; // 15%
    // 60% Carbon

    const variant = ASTEROID_VARIANTS[type];
    const size = Math.random() * (MAX_ASTEROID_SIZE - MIN_ASTEROID_SIZE) + MIN_ASTEROID_SIZE;
    const points: Point[] = [];
    
    // Create jagged polygon
    const numPoints = 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      // Variance for jaggedness
      const variance = variant.jaggedness + Math.random() * 0.4;
      const r = (size / 2) * (1 - (Math.random() * variance * 0.5)); 
      points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }

    const levelSpeedBonus = ASTEROID_BASE_SPEED * ((level - 1) * (LEVEL_SPEED_MULTIPLIER - 1));
    // Ice asteroids are faster
    const typeSpeedMod = type === 'ICE' ? 1.5 : type === 'METALLIC' ? 0.8 : 1.0; 
    
    const finalSpeed = (ASTEROID_BASE_SPEED + levelSpeedBonus + Math.random() * 2) * typeSpeedMod + (scoreRef.current / 1000);

    const baseHp = Math.floor(size / 20);
    const finalHp = Math.max(1, Math.floor(baseHp * variant.hpMult));

    const baseDamage = Math.floor(size * 8);
    const finalDamage = Math.floor(baseDamage * variant.damageMult);

    return {
      type,
      x: Math.random() * (width - size),
      y: -size * 2,
      width: size,
      height: size,
      vx: (Math.random() - 0.5) * 2,
      vy: finalSpeed,
      color: variant.color,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * (type === 'METALLIC' ? 0.05 : 0.1),
      points,
      hp: finalHp,
      damage: finalDamage
    };
  };

  const createPowerUp = (width: number): PowerUp => {
    const rand = Math.random();
    let type: PowerUpType = 'FUEL';
    
    // Adjusted probabilities: 35% Shield, 40% Weapon, 25% Fuel
    if (rand < 0.35) type = 'SHIELD'; 
    else if (rand < 0.75) type = 'WEAPON';

    return {
      x: Math.random() * (width - POWERUP_SIZE),
      y: -POWERUP_SIZE * 2,
      width: POWERUP_SIZE,
      height: POWERUP_SIZE,
      vx: 0,
      vy: POWERUP_SPEED,
      color: type === 'SHIELD' ? COLOR_PALETTE.primary : type === 'WEAPON' ? COLOR_PALETTE.danger : COLOR_PALETTE.warning,
      type,
      pulse: 0
    };
  };

  const checkCollision = (r1: Entity, r2: Entity) => {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  };

  const checkRadialCollision = (p: Entity, target: Entity, safeZone: number = 0.7) => {
    const dx = (p.x + p.width / 2) - (target.x + target.width / 2);
    const dy = (p.y + p.height / 2) - (target.y + target.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = (p.width / 2) + (target.width / 2) * safeZone;
    return distance < minDistance;
  };

  const update = (time: number, width: number, height: number) => {
    if (gameState !== GameState.PLAYING) return;

    // 1. Update Player
    const lerpFactor = playerRef.current.speedBoostTimer > 0 ? 0.3 : 0.15;
    const targetX = mouseXRef.current - PLAYER_WIDTH / 2;
    playerRef.current.x += (targetX - playerRef.current.x) * lerpFactor;
    playerRef.current.y = height - PLAYER_HEIGHT - 50;

    if (playerRef.current.x < 0) playerRef.current.x = 0;
    if (playerRef.current.x > width - PLAYER_WIDTH) playerRef.current.x = width - PLAYER_WIDTH;

    // Passive Shield Drain (Life Support Cost)
    // Modified: Drain stops at 1 HP. Player cannot die from passive drain.
    if (playerRef.current.shield > 1) {
        playerRef.current.shield = Math.max(1, playerRef.current.shield - SHIELD_PASSIVE_DRAIN);
    }
    
    // Decrease Timers
    const dt = 16; // approx 60fps
    if (playerRef.current.speedBoostTimer > 0) playerRef.current.speedBoostTimer -= dt;

    // Report stats if changed
    if (Math.abs(playerRef.current.shield - lastReportedShieldRef.current) > 1) { // Throttle updates slightly
        setShield(Math.max(0, Math.floor(playerRef.current.shield)));
        lastReportedShieldRef.current = playerRef.current.shield;
    }
    if (playerRef.current.weaponLevel !== lastReportedWeaponLevelRef.current) {
        setWeaponLevel(playerRef.current.weaponLevel);
        lastReportedWeaponLevelRef.current = playerRef.current.weaponLevel;
    }

    // 2. Spawning
    const levelSpawnReduction = (level - 1) * LEVEL_SPAWN_RATE_REDUCTION;
    const spawnRate = Math.max(200, 800 - levelSpawnReduction - (scoreRef.current / 5));
    
    if (time - lastSpawnTimeRef.current > spawnRate) {
      asteroidsRef.current.push(createAsteroid(width));
      lastSpawnTimeRef.current = time;
    }

    // Updated spawn timing: 3-8 seconds (was 5-13) to provide more weapons/shields
    if (time - lastPowerUpSpawnTimeRef.current > 3000 + Math.random() * 5000) {
      powerUpsRef.current.push(createPowerUp(width));
      lastPowerUpSpawnTimeRef.current = time;
    }

    // 3. Weapons Fire
    const fireRate = 150;
    if (time - lastShotTimeRef.current > fireRate) {
      const px = playerRef.current.x + PLAYER_WIDTH / 2 - PROJECTILE_WIDTH / 2;
      const py = playerRef.current.y;
      
      // Handle Weapon Overheat/Degradation
      if (playerRef.current.weaponLevel > 1) {
          playerRef.current.shotCount++;
          if (playerRef.current.shotCount >= WEAPON_DOWNGRADE_SHOTS) {
              playerRef.current.weaponLevel--;
              playerRef.current.shotCount = 0; // Reset count after downgrade
          }
      }

      // Level 1: Single Shot
      if (playerRef.current.weaponLevel >= 1) {
        projectilesRef.current.push({
            x: px, y: py, width: PROJECTILE_WIDTH, height: PROJECTILE_HEIGHT, vx: 0, vy: -PROJECTILE_SPEED, color: COLOR_PALETTE.danger, active: true
        });
      }
      // Level 2: Dual Side Shots
      if (playerRef.current.weaponLevel >= 2) {
         projectilesRef.current.push({
            x: px - 10, y: py + 5, width: PROJECTILE_WIDTH, height: PROJECTILE_HEIGHT, vx: -1, vy: -PROJECTILE_SPEED * 0.9, color: COLOR_PALETTE.danger, active: true
        });
         projectilesRef.current.push({
            x: px + 10, y: py + 5, width: PROJECTILE_WIDTH, height: PROJECTILE_HEIGHT, vx: 1, vy: -PROJECTILE_SPEED * 0.9, color: COLOR_PALETTE.danger, active: true
        });
      }
      // Level 3: Wide Spread
      if (playerRef.current.weaponLevel >= 3) {
        projectilesRef.current.push({
            x: px - 20, y: py + 10, width: PROJECTILE_WIDTH, height: PROJECTILE_HEIGHT, vx: -3, vy: -PROJECTILE_SPEED * 0.8, color: COLOR_PALETTE.danger, active: true
        });
         projectilesRef.current.push({
            x: px + 20, y: py + 10, width: PROJECTILE_WIDTH, height: PROJECTILE_HEIGHT, vx: 3, vy: -PROJECTILE_SPEED * 0.8, color: COLOR_PALETTE.danger, active: true
        });
      }

      playShoot();
      lastShotTimeRef.current = time;
    }

    // 4. Update Environment (Stars)
    const levelWarpSpeed = level * 2;
    starsRef.current.forEach(star => {
      star.y += star.speed + levelWarpSpeed + (scoreRef.current / 2000) + (playerRef.current.speedBoostTimer > 0 ? 5 : 0);
      if (star.y > height) {
        star.y = 0;
        star.x = Math.random() * width;
      }
    });

    // 5. Update Projectiles
    for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
      const p = projectilesRef.current[i];
      p.y += p.vy;
      p.x += p.vx;
      if (p.y < -50) {
        projectilesRef.current.splice(i, 1);
      }
    }

    // 6. Update PowerUps
    for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
      const pup = powerUpsRef.current[i];
      pup.y += pup.vy;
      pup.pulse += 0.1;

      if (checkCollision(playerRef.current, pup)) {
        playPowerUp();
        if (pup.type === 'SHIELD') {
            playerRef.current.shield = Math.min(playerRef.current.maxShield, playerRef.current.shield + SHIELD_REGEN_AMOUNT);
        }
        if (pup.type === 'WEAPON') {
            playerRef.current.weaponLevel = Math.min(3, playerRef.current.weaponLevel + 1);
            playerRef.current.shotCount = 0; // Reset degradation counter on pickup
        }
        if (pup.type === 'FUEL') {
            playerRef.current.speedBoostTimer = SPEED_BOOST_DURATION;
            scoreRef.current += 100;
            setScore(scoreRef.current);
        }
        
        powerUpsRef.current.splice(i, 1);
        continue;
      }

      if (pup.y > height) {
        powerUpsRef.current.splice(i, 1);
      }
    }

    // 7. Update Asteroids & Collisions
    for (let i = asteroidsRef.current.length - 1; i >= 0; i--) {
      const ast = asteroidsRef.current[i];
      ast.y += ast.vy;
      ast.x += ast.vx;
      ast.rotation += ast.rotationSpeed;

      // Check Projectile Collision
      let destroyedByLaser = false;
      for (let j = projectilesRef.current.length - 1; j >= 0; j--) {
        const proj = projectilesRef.current[j];
        if (checkCollision(proj, ast)) {
          projectilesRef.current.splice(j, 1); // remove bullet
          ast.hp--;
          if (ast.hp <= 0) {
             destroyedByLaser = true;
             playExplosion();
             scoreRef.current += 50; // Bonus for shooting
             setScore(scoreRef.current);
             asteroidsRef.current.splice(i, 1);
             break;
          }
        }
      }
      if (destroyedByLaser) continue;

      // Check Player Collision
      if (checkRadialCollision(playerRef.current, ast)) {
        playDamage();
        playerRef.current.shield -= ast.damage;
        asteroidsRef.current.splice(i, 1);

        if (playerRef.current.shield <= 0) {
            playExplosion();
            onGameOver(scoreRef.current, (Date.now() - startTimeRef.current) / 1000);
            return;
        } else {
            playShieldBreak();
        }
      }

      if (ast.y > height + 100) {
        asteroidsRef.current.splice(i, 1);
        scoreRef.current += 10; // Distance bonus
        setScore(scoreRef.current);
      }
    }
  };

  const drawPowerUp = (ctx: CanvasRenderingContext2D, p: PowerUp) => {
    ctx.save();
    ctx.translate(p.x + p.width/2, p.y + p.height/2);
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    
    if (p.type === 'SHIELD') {
      ctx.arc(0, 0, p.width/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', 0, 1);
    } else if (p.type === 'WEAPON') {
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-p.width/2.5, -p.height/2.5, p.width/1.25, p.height/1.25);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('W', 0, 1);
    } else {
      ctx.fillRect(-p.width/3, -p.height/2, p.width/1.5, p.height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('F', 0, 1);
    }
    ctx.restore();
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, p: Player) => {
    ctx.save();
    ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
    
    // Shield Visual
    if (p.shield > 0) {
      const shieldOpacity = (p.shield / p.maxShield) * 0.5;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(0, 240, 255, ${shieldOpacity + 0.2})`;
      ctx.lineWidth = 2;
      ctx.arc(0, 0, p.height / 1.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(0, 240, 255, ${shieldOpacity})`; 
      ctx.fill();
    }

    // Engine trail
    ctx.beginPath();
    const flicker = Math.random() * 10;
    const boostLength = p.speedBoostTimer > 0 ? 40 : 20;
    const engineColor = level > 3 ? '#ff4400' : (p.speedBoostTimer > 0 ? COLOR_PALETTE.warning : COLOR_PALETTE.secondary);

    ctx.moveTo(-5, p.height/2 - 10);
    ctx.lineTo(0, p.height/2 + flicker + boostLength);
    ctx.lineTo(5, p.height/2 - 10);
    ctx.fillStyle = engineColor;
    ctx.fill();
    
    // Draw Ship
    if (processedShipImage) {
      // Draw realistic AI generated ship
      ctx.drawImage(
        processedShipImage, 
        -p.width * 1.5 / 2, -p.height * 1.5 / 2, 
        p.width * 1.5, p.height * 1.5
      );
    } else {
      // Draw Vector Fallback
      ctx.beginPath();
      if (p.shape === 'STRIKER') {
        ctx.moveTo(0, -p.height / 2); 
        ctx.lineTo(p.width / 2, p.height / 2); 
        ctx.lineTo(0, p.height / 2 - 10); 
        ctx.lineTo(-p.width / 2, p.height / 2); 
      } 
      else if (p.shape === 'INTERCEPTOR') {
        ctx.moveTo(0, -p.height / 2); 
        ctx.lineTo(p.width / 2 - 5, p.height / 4); 
        ctx.lineTo(p.width / 2 + 5, p.height / 2); 
        ctx.lineTo(5, p.height / 2 - 5); 
        ctx.lineTo(-5, p.height / 2 - 5); 
        ctx.lineTo(-(p.width / 2 + 5), p.height / 2); 
        ctx.lineTo(-(p.width / 2 - 5), p.height / 4); 
      }
      else if (p.shape === 'TITAN') {
        ctx.moveTo(0, -p.height / 2); 
        ctx.lineTo(p.width / 2, -p.height / 4); 
        ctx.lineTo(p.width / 2, p.height / 2); 
        ctx.lineTo(10, p.height / 2 - 5); 
        ctx.lineTo(-10, p.height / 2 - 5); 
        ctx.lineTo(-p.width / 2, p.height / 2); 
        ctx.lineTo(-p.width / 2, -p.height / 4); 
      }

      ctx.closePath();
      ctx.fillStyle = COLOR_PALETTE.bg;
      ctx.fill();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Cockpit
      ctx.beginPath();
      ctx.fillStyle = p.color;
      if (p.shape === 'STRIKER') {
        ctx.moveTo(0, -10);
        ctx.lineTo(5, 5);
        ctx.lineTo(-5, 5);
      } else if (p.shape === 'INTERCEPTOR') {
        ctx.rect(-3, -15, 6, 20);
      } else if (p.shape === 'TITAN') {
        ctx.rect(-10, -5, 20, 8);
      }
      ctx.fill();
    }

    ctx.restore();
  };

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = COLOR_PALETTE.bg;
    ctx.fillRect(0, 0, width, height);

    // Draw Stars
    starsRef.current.forEach(star => {
      ctx.globalAlpha = star.brightness;
      ctx.fillStyle = 'white';
      if (level > 1) {
         ctx.fillRect(star.x, star.y, 1 + (level * 0.5), star.size * (1 + level));
      } else {
         ctx.beginPath();
         ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
         ctx.fill();
      }
    });
    ctx.globalAlpha = 1;

    powerUpsRef.current.forEach(pup => drawPowerUp(ctx, pup));

    ctx.fillStyle = COLOR_PALETTE.danger;
    projectilesRef.current.forEach(proj => {
      ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
    });

    // DRAW ASTEROIDS WITH VARIANTS
    asteroidsRef.current.forEach(ast => {
      ctx.save();
      const variant = ASTEROID_VARIANTS[ast.type];
      const astCenterX = ast.x + ast.width / 2;
      const astCenterY = ast.y + ast.height / 2;
      
      // -- Proximity Glow --
      const playerCenterX = playerRef.current.x + playerRef.current.width / 2;
      const playerCenterY = playerRef.current.y + playerRef.current.height / 2;
      const dx = astCenterX - playerCenterX;
      const dy = astCenterY - playerCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const glowThreshold = 250; 

      // Danger Warning Glow (Red) if close
      if (dist < glowThreshold) {
        const intensity = Math.pow(1 - (dist / glowThreshold), 2); 
        ctx.shadowColor = 'rgba(255, 68, 68, 0.6)'; 
        ctx.shadowBlur = 25 * intensity;
      } 
      // Magma/Metallic innate glow
      else if (variant.glow) {
        ctx.shadowColor = variant.glow;
        ctx.shadowBlur = ast.type === 'MAGMA' ? 15 : 10;
      } 
      else {
        ctx.shadowBlur = 0;
      }

      ctx.translate(astCenterX, astCenterY);
      ctx.rotate(ast.rotation);
      
      // -- Opacity for ICE --
      if (ast.type === 'ICE') {
        ctx.globalAlpha = 0.8;
      }

      ctx.beginPath();
      if (ast.points.length > 0) {
        ctx.moveTo(ast.points[0].x, ast.points[0].y);
        for (let i = 1; i < ast.points.length; i++) {
          ctx.lineTo(ast.points[i].x, ast.points[i].y);
        }
      }
      ctx.closePath();

      // -- Gradients per Type --
      const gradient = ctx.createRadialGradient(
        -ast.width * 0.2, -ast.height * 0.2, ast.width * 0.1,
        0, 0, ast.width * 0.7
      );
      
      if (ast.type === 'MAGMA') {
        gradient.addColorStop(0, '#fdba74'); // Orange light
        gradient.addColorStop(0.4, variant.color); // Red/Orange
        gradient.addColorStop(1, variant.innerColor || '#450a0a'); // Dark Red/Black
      } else if (ast.type === 'ICE') {
        gradient.addColorStop(0, '#ffffff'); 
        gradient.addColorStop(0.5, variant.color); 
        gradient.addColorStop(1, variant.innerColor || '#155e75'); 
      } else if (ast.type === 'METALLIC') {
        gradient.addColorStop(0, '#ffffff'); // Shine
        gradient.addColorStop(0.3, variant.color); // Silver
        gradient.addColorStop(1, variant.innerColor || '#374151'); // Dark Metal
      } else {
        // CARBON (Default)
        gradient.addColorStop(0, '#9ca3af'); 
        gradient.addColorStop(0.5, variant.color); 
        gradient.addColorStop(1, variant.innerColor || '#1f2937'); 
      }

      ctx.fillStyle = gradient;
      ctx.fill();

      // -- Stroke / Detail --
      ctx.lineWidth = ast.type === 'METALLIC' ? 3 : 2;
      ctx.strokeStyle = ast.type === 'MAGMA' ? '#f97316' : 
                        ast.type === 'ICE' ? '#cffafe' : 
                        ast.type === 'METALLIC' ? '#f3f4f6' : '#374151';
      ctx.stroke();

      // -- Internal "Cracks" or Details (Simple Lines) --
      if (ast.type !== 'ICE') { // Ice is clear
         ctx.beginPath();
         ctx.strokeStyle = 'rgba(0,0,0,0.2)';
         ctx.moveTo(0, 0);
         ctx.lineTo(ast.width/4, ast.height/4);
         ctx.stroke();
      }

      ctx.restore();
      ctx.globalAlpha = 1; // Reset
    });

    drawPlayer(ctx, playerRef.current);
  };

  const loop = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    update(time, canvas.width, canvas.height);
    draw(ctx, canvas.width, canvas.height);

    if (gameState === GameState.PLAYING || gameState === GameState.MENU || gameState === GameState.GAME_OVER) {
       requestRef.current = requestAnimationFrame(loop);
    }
  };

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      startThruster();
    } else {
      stopThruster();
    }
    return () => {
      stopThruster();
    };
  }, [gameState]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        initStars(window.innerWidth, window.innerHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    const handleMouseMove = (e: MouseEvent) => {
      mouseXRef.current = e.clientX;
    };
    const handleTouchMove = (e: TouchEvent) => {
      mouseXRef.current = e.touches[0].clientX;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    playerRef.current.color = shipColor;
    playerRef.current.shape = shipShape;
  }, [shipColor, shipShape]);

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      if (scoreRef.current === 0) {
        asteroidsRef.current = [];
        powerUpsRef.current = [];
        projectilesRef.current = [];
        startTimeRef.current = Date.now();
        playerRef.current.shield = PLAYER_MAX_SHIELD;
        playerRef.current.weaponLevel = 1;
        playerRef.current.speedBoostTimer = 0;
        playerRef.current.shotCount = 0;
        setShield(PLAYER_MAX_SHIELD);
        setWeaponLevel(1);
        lastSpawnTimeRef.current = performance.now();
      }
      playerRef.current.color = shipColor;
      playerRef.current.shape = shipShape;
      if (canvasRef.current) {
         playerRef.current.x = canvasRef.current.width / 2;
      }
    } else {
        scoreRef.current = 0;
    }
  }, [gameState, shipColor, shipShape, setShield, setWeaponLevel]);

  return (
    <canvas
      ref={canvasRef}
      className="block absolute top-0 left-0 w-full h-full z-0 touch-none cursor-none"
    />
  );
};

export default GameCanvas;
