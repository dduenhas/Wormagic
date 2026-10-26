import { SKIN_OPTIONS, WAND_OPTIONS } from '../data/arsenal';
import {
  ActiveProjectile,
  BiomeConfig,
  ShockwaveRing,
  SupplyCrate,
  ThermalZone,
  WeaponId,
  WeatherState,
  WormCosmetics,
} from '../types/game';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function generatePixelTerrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  biome: BiomeConfig,
  seed: number = Math.random() * 1000
) {
  ctx.clearRect(0, 0, width, height);
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  const [topR, topG, topB] = hexToRgb(biome.topSoilColor);
  const [midR, midG, midB] = hexToRgb(biome.midSoilColor);
  const [deepR, deepG, deepB] = hexToRgb(biome.deepRockColor);

  const waterLevel = height - 42;

  for (let x = 0; x < width; x++) {
    const px = Math.floor(x / 2) * 2;
    const normX = px / width;

    const hill1 = Math.sin(normX * Math.PI * 2.5 + seed) * 75;
    const hill2 = Math.cos(normX * Math.PI * 6.0 - seed * 0.7) * 34;
    const hill3 = Math.sin(normX * Math.PI * 13.0 + seed * 1.3) * 12;

    const islandEnvelope = Math.sin(normX * Math.PI);
    const baseSurface = Math.floor(
      height * 0.56 - (hill1 + hill2 + hill3) * islandEnvelope - (islandEnvelope * 48 - 20)
    );

    const isFloatingIsland = normX > 0.36 && normX < 0.64;
    const floatTop = Math.floor(height * 0.27 + Math.sin(normX * Math.PI * 8 + seed) * 8);
    const floatBottom = Math.floor(
      height * 0.34 + Math.cos(normX * Math.PI * 10 - seed) * 10
    );

    for (let y = 0; y < height; y++) {
      let isSolid = false;
      let depth = 0;

      if (isFloatingIsland && y >= floatTop && y <= floatBottom) {
        isSolid = true;
        depth = y - floatTop;
      } else if (y >= baseSurface && y < waterLevel + 24) {
        const caveNoise = Math.sin(px * 0.032 + seed) * Math.cos(y * 0.045 - seed);
        if (!(y > baseSurface + 45 && y < waterLevel - 20 && caveNoise > 0.68)) {
          isSolid = true;
          depth = y - baseSurface;
        }
      }

      if (!isSolid) continue;

      const idx = (y * width + x) * 4;
      const dither = (Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0;

      if (depth < 7) {
        data[idx] = topR;
        data[idx + 1] = topG;
        data[idx + 2] = topB;
        data[idx + 3] = 255;
      } else if (depth < 14 && dither) {
        data[idx] = topR;
        data[idx + 1] = topG;
        data[idx + 2] = topB;
        data[idx + 3] = 255;
      } else if (depth < 68) {
        const isGridLine = x % 24 === 0 || y % 24 === 0;
        const boost = isGridLine ? 14 : 0;
        data[idx] = Math.min(255, midR + boost);
        data[idx + 1] = Math.min(255, midG + boost);
        data[idx + 2] = Math.min(255, midB + boost);
        data[idx + 3] = 255;
      } else {
        const noise = (x * 13 + y * 7) % 17 < 3 ? 18 : 0;
        data[idx] = Math.min(255, deepR + noise);
        data[idx + 1] = Math.min(255, deepG + noise);
        data[idx + 2] = Math.min(255, deepB + noise);
        data[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

export function carveTerrainCrater(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
) {
  const r = Math.ceil(radius);
  const burnRing = r + 5;
  const startX = Math.max(0, Math.floor(cx - burnRing));
  const startY = Math.max(0, Math.floor(cy - burnRing));
  const w = Math.min(ctx.canvas.width - startX, burnRing * 2);
  const h = Math.min(ctx.canvas.height - startY, burnRing * 2);
  if (w <= 0 || h <= 0) return;

  const imgData = ctx.getImageData(startX, startY, w, h);
  const data = imgData.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = startX + x;
      const py = startY + y;
      const dx = px - cx;
      const dy = py - cy;
      const distSq = dx * dx + dy * dy;

      const idx = (y * w + x) * 4;
      if (distSq <= r * r) {
        data[idx + 3] = 0;
      } else if (distSq <= burnRing * burnRing && data[idx + 3] > 0) {
        data[idx] = Math.max(20, Math.floor(data[idx] * 0.55));
        data[idx + 1] = Math.max(18, Math.floor(data[idx + 1] * 0.55));
        data[idx + 2] = Math.max(28, Math.floor(data[idx + 2] * 0.62));
      }
    }
  }

  ctx.putImageData(imgData, startX, startY);
}

export function buildThornMound(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
) {
  const r = Math.ceil(radius * 0.65);
  const startX = Math.max(0, Math.floor(cx - r));
  const startY = Math.max(0, Math.floor(cy - r));
  const w = Math.min(ctx.canvas.width - startX, r * 2);
  const h = Math.min(ctx.canvas.height - startY, r * 2);
  if (w <= 0 || h <= 0) return;

  const imgData = ctx.getImageData(startX, startY, w, h);
  const data = imgData.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = startX + x;
      const py = startY + y;
      const dx = px - cx;
      const dy = py - cy;
      if (dx * dx + dy * dy <= r * r && dy <= 4) {
        const idx = (y * w + x) * 4;
        const isSpike = (x + y) % 5 === 0;
        data[idx] = isSpike ? 180 : 56;
        data[idx + 1] = isSpike ? 240 : 176;
        data[idx + 2] = isSpike ? 70 : 0;
        data[idx + 3] = 255;
      }
    }
  }
  ctx.putImageData(imgData, startX, startY);
}

export function drawWindStreamlines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  weather: WeatherState,
  tick: number
) {
  const windX = weather.currentWindX;
  const windY = weather.currentWindY;
  const speedMag = Math.hypot(windX, windY);
  if (speedMag < 0.15) return;

  ctx.save();
  const ribbonCount = Math.min(26, Math.floor(8 + speedMag * 3.2));
  const ribbonLength = Math.floor(22 + speedMag * 12);

  for (let i = 0; i < ribbonCount; i++) {
    const seedX = (i * 293) % width;
    const seedY = 45 + ((i * 137) % (height - 150));

    // Stream position wraps smoothly across screen based on wind vector
    const rawX = (seedX + tick * windX * 1.9) % width;
    const x = rawX < 0 ? rawX + width : rawX;
    const y = seedY + Math.sin(tick * 0.04 + i) * 8 + windY * 12;

    const alpha = 0.12 + ((i % 4) * 0.04) + Math.min(0.18, speedMag * 0.025);
    ctx.strokeStyle =
      weather.conditionId === 'UPDRAFT_THERMAL'
        ? `rgba(6, 214, 160, ${alpha})`
        : weather.conditionId === 'GALE_STORM'
        ? `rgba(255, 209, 102, ${alpha})`
        : `rgba(168, 218, 220, ${alpha})`;
    ctx.lineWidth = i % 3 === 0 ? 2 : 1;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (windX >= 0 ? 1 : -1) * ribbonLength, y + windY * 14);
    ctx.stroke();

    // Small pixel leaf/chalk mote at the tip of every 3rd ribbon
    if (i % 3 === 0) {
      ctx.fillStyle = windX >= 0 ? '#06D6A0' : '#FFD166';
      ctx.fillRect(
        Math.round(x + (windX >= 0 ? 1 : -1) * ribbonLength),
        Math.round(y + windY * 14),
        3,
        3
      );
    }
  }
  ctx.restore();
}

export function drawThermalZones(
  ctx: CanvasRenderingContext2D,
  zones: ThermalZone[],
  tick: number
) {
  ctx.save();
  zones.forEach((z) => {
    // Subtle vertical column border
    const grad = ctx.createLinearGradient(z.x, z.y + z.height, z.x, z.y);
    grad.addColorStop(0, 'rgba(6, 214, 160, 0.18)');
    grad.addColorStop(0.5, 'rgba(76, 201, 240, 0.09)');
    grad.addColorStop(1, 'rgba(6, 214, 160, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(z.x, z.y, z.width, z.height);

    // Rising pixel chevrons inside the thermal column
    ctx.fillStyle = 'rgba(6, 214, 160, 0.45)';
    for (let p = 0; p < 6; p++) {
      const py =
        z.y +
        z.height -
        (((tick * 2.2 + p * (z.height / 6)) % z.height) + z.height) % z.height;
      const px = z.x + z.width * 0.25 + ((p * 19) % (z.width * 0.5));
      ctx.fillRect(Math.round(px), Math.round(py), 6, 2);
      ctx.fillRect(Math.round(px) + 2, Math.round(py) - 2, 2, 2);
    }

    // Label at bottom of thermal column
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(6, 214, 160, 0.75)';
    ctx.textAlign = 'center';
    ctx.fillText(z.label, z.x + z.width / 2, z.y + z.height - 6);
  });
  ctx.restore();
}

export function drawShockwaves(
  ctx: CanvasRenderingContext2D,
  rings: ShockwaveRing[]
) {
  ctx.save();
  rings.forEach((ring) => {
    ctx.strokeStyle = ring.color;
    ctx.globalAlpha = Math.max(0, ring.alpha);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(Math.round(ring.x), Math.round(ring.y), ring.radius, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();
}

export function drawWormAimHUD(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: 1 | -1,
  aimAngle: number,
  isCharging: boolean,
  power: number,
  stamina: number
) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y - 2));

  const worldAngle = facing === 1 ? aimAngle : Math.PI - aimAngle;
  const radius = 32;

  // 1. Subtle Tactical Aiming Arc
  ctx.strokeStyle = 'rgba(244, 241, 222, 0.22)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (facing === 1) {
    ctx.arc(0, 0, radius, -1.42, 0.85);
  } else {
    ctx.arc(0, 0, radius, Math.PI - 0.85, Math.PI + 1.42);
  }
  ctx.stroke();

  // 2. Crosshair Reticle & Degree Readout
  const reticleX = Math.cos(worldAngle) * (radius + 6);
  const reticleY = Math.sin(worldAngle) * (radius + 6);
  ctx.fillStyle = '#FFD166';
  ctx.fillRect(Math.round(reticleX) - 3, Math.round(reticleY) - 3, 6, 6);

  const deg = Math.round((-aimAngle * 180) / Math.PI);
  ctx.font = 'bold 9px "JetBrains Mono", monospace';
  ctx.fillStyle = '#FFD166';
  ctx.textAlign = facing === 1 ? 'left' : 'right';
  ctx.fillText(
    `${deg}°`,
    reticleX + (facing === 1 ? 8 : -8),
    reticleY + 3
  );

  // 3. Stamina / Mobility Fuel Micro-Bar under worm's feet
  if (stamina < 100) {
    const stW = 24;
    ctx.fillStyle = '#09080E';
    ctx.fillRect(-12, 13, stW, 4);
    ctx.fillStyle = '#4CC9F0';
    ctx.fillRect(-12, 13, Math.round((stamina / 100) * stW), 3);
  }

  // 4. Radial Power Charge Meter + Critical Sweet-Spot Zone (86% - 96%)
  if (isCharging) {
    const barW = 46;
    const barH = 7;
    const bx = -barW / 2;
    const by = 18;

    ctx.fillStyle = '#09080E';
    ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);

    // Sweet-spot critical zone highlight (86%..96%)
    const critStart = bx + Math.floor(0.86 * barW);
    const critWidth = Math.ceil(0.1 * barW);
    ctx.fillStyle = 'rgba(255, 209, 102, 0.35)';
    ctx.fillRect(critStart, by, critWidth, barH);

    // Current Power Fill
    const isCrit = power >= 86 && power <= 96;
    ctx.fillStyle = isCrit ? '#00F5D4' : power > 96 ? '#EF476F' : '#FFD166';
    ctx.fillRect(bx, by, Math.round((power / 100) * barW), barH);

    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = isCrit ? '#00F5D4' : '#F4F1DE';
    ctx.fillText(
      isCrit ? `${Math.round(power)}% CRÍTICO!` : `${Math.round(power)}%`,
      0,
      by + 16
    );
  }

  ctx.restore();
}

export function drawPixelWorm(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: 1 | -1,
  aimAngle: number,
  cosmetics: WormCosmetics,
  isCurrentTurn: boolean,
  timeTick: number,
  vy: number = 0,
  launchSpin: number = 0
) {
  const skin = SKIN_OPTIONS.find((s) => s.id === cosmetics.skin) || SKIN_OPTIONS[0];
  const wand = WAND_OPTIONS.find((w) => w.id === cosmetics.wand) || WAND_OPTIONS[0];

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  if (launchSpin !== 0) {
    ctx.rotate(launchSpin);
    ctx.scale(1.18, 1.18);
  } else {
    // Squash & Stretch based on vertical velocity for modern responsive feel
    const stretchY = Math.max(0.84, Math.min(1.18, 1 - vy * 0.025));
    const squashX = 1 / stretchY;
    ctx.scale(facing * squashX, stretchY);
  }

  const bob = launchSpin !== 0 ? 0 : Math.sin(timeTick * 0.12) > 0 ? -1 : 0;

  // 1. Tail & Lower Body Segments
  ctx.fillStyle = skin.shade;
  ctx.fillRect(-10, 4, 8, 6);
  ctx.fillRect(-6, 2, 12, 8);

  ctx.fillStyle = skin.primary;
  ctx.fillRect(-9, 3, 7, 5);
  ctx.fillRect(-5, 0 + bob, 10, 8);

  ctx.fillStyle = skin.belly;
  ctx.fillRect(-2, 2 + bob, 6, 5);

  // 2. Torso & Head
  ctx.fillStyle = skin.shade;
  ctx.fillRect(-4, -10 + bob, 11, 12);
  ctx.fillStyle = skin.primary;
  ctx.fillRect(-3, -9 + bob, 9, 10);

  // 3. Expressive Pixel Eyes (Star/Dizzy eyes if being launched out!)
  ctx.fillStyle = launchSpin !== 0 ? '#FFD166' : '#FFFFFF';
  ctx.fillRect(1, -7 + bob, 3, 4);
  ctx.fillRect(4, -7 + bob, 3, 4);

  ctx.fillStyle = '#0F0E17';
  ctx.fillRect(3, -6 + bob, 1, 2);
  ctx.fillRect(6, -6 + bob, 1, 2);

  // 4. Glasses Cosmetic
  if (cosmetics.glasses === 'round_nerd') {
    ctx.strokeStyle = '#FFD166';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, -7.5 + bob, 4, 5);
    ctx.strokeRect(4.5, -7.5 + bob, 4, 5);
  } else if (cosmetics.glasses === 'sun_shades') {
    ctx.fillStyle = '#0F0E17';
    ctx.fillRect(0, -7 + bob, 8, 3);
    ctx.fillStyle = '#4CC9F0';
    ctx.fillRect(1, -7 + bob, 2, 1);
  } else if (cosmetics.glasses === 'monocle') {
    ctx.strokeStyle = '#FFD166';
    ctx.lineWidth = 1;
    ctx.strokeRect(3.5, -7.5 + bob, 4, 5);
    ctx.fillStyle = '#FFD166';
    ctx.fillRect(6, -2 + bob, 1, 5);
  }

  // 5. Hat / Headgear Cosmetic
  if (cosmetics.hat === 'wizard') {
    ctx.fillStyle = '#3A0CA3';
    ctx.fillRect(-6, -11 + bob, 15, 2);
    ctx.fillRect(-4, -15 + bob, 10, 4);
    ctx.fillRect(-2, -19 + bob, 6, 4);
    ctx.fillRect(0, -22 + bob, 3, 3);
    ctx.fillStyle = '#FFD166';
    ctx.fillRect(-4, -12 + bob, 10, 1);
    ctx.fillRect(0, -16 + bob, 2, 2);
  } else if (cosmetics.hat === 'grad_cap') {
    ctx.fillStyle = '#1A1829';
    ctx.fillRect(-4, -12 + bob, 11, 3);
    ctx.fillRect(-7, -14 + bob, 17, 2);
    ctx.fillStyle = '#FFD166';
    ctx.fillRect(7, -13 + bob, 2, 6);
  } else if (cosmetics.hat === 'leaf_crown') {
    ctx.fillStyle = '#2B9348';
    ctx.fillRect(-4, -11 + bob, 11, 3);
    ctx.fillStyle = '#70E000';
    ctx.fillRect(-3, -13 + bob, 3, 2);
    ctx.fillRect(1, -14 + bob, 3, 3);
    ctx.fillRect(5, -13 + bob, 2, 2);
  } else if (cosmetics.hat === 'beret') {
    ctx.fillStyle = '#EF476F';
    ctx.fillRect(-5, -13 + bob, 12, 4);
    ctx.fillRect(-1, -15 + bob, 2, 2);
  } else if (cosmetics.hat === 'headband') {
    ctx.fillStyle = '#EF476F';
    ctx.fillRect(-4, -9 + bob, 10, 2);
    ctx.fillRect(-7, -8 + bob, 3, 3);
  } else if (cosmetics.hat === 'witch_hat') {
    ctx.fillStyle = '#240046';
    ctx.fillRect(-7, -11 + bob, 17, 2);
    ctx.fillRect(-4, -16 + bob, 9, 5);
    ctx.fillRect(-3, -20 + bob, 5, 4);
    ctx.fillStyle = '#06D6A0';
    ctx.fillRect(-4, -12 + bob, 9, 1);
  }

  // 6. Held Wand / School Weapon pointing along aimAngle
  ctx.save();
  ctx.translate(2, -2 + bob);
  ctx.rotate(aimAngle);

  ctx.fillStyle = wand.color;
  ctx.fillRect(0, -1, 12, 3);
  ctx.fillStyle = wand.tipColor;
  ctx.fillRect(11, -2, 4, 5);

  ctx.restore();
  ctx.restore();
}

export function drawPixelProjectile(
  ctx: CanvasRenderingContext2D,
  proj: ActiveProjectile
) {
  // Draw Ribbon Trail History first
  if (proj.trailHistory.length > 1) {
    ctx.save();
    for (let i = 0; i < proj.trailHistory.length - 1; i++) {
      const pt = proj.trailHistory[i];
      const ratio = (i + 1) / proj.trailHistory.length;
      ctx.fillStyle = proj.isCriticalShot
        ? `rgba(0, 245, 212, ${ratio * 0.65})`
        : `rgba(255, 209, 102, ${ratio * 0.45})`;
      const s = Math.max(2, Math.round(ratio * 6));
      ctx.fillRect(Math.round(pt.x - s / 2), Math.round(pt.y - s / 2), s, s);
    }
    ctx.restore();
  }

  ctx.save();
  ctx.translate(Math.round(proj.x), Math.round(proj.y));
  const angle = Math.atan2(proj.vy, proj.vx);
  ctx.rotate(angle);

  if (proj.weaponId === 'eraser_bomb') {
    ctx.fillStyle = '#EF476F';
    ctx.fillRect(-6, -4, 7, 8);
    ctx.fillStyle = '#118AB2';
    ctx.fillRect(1, -4, 5, 8);
    ctx.strokeStyle = proj.isCriticalShot ? '#00F5D4' : '#F4F1DE';
    ctx.lineWidth = 1;
    ctx.strokeRect(-6, -4, 12, 8);
  } else if (proj.weaponId === 'chalk_cluster') {
    ctx.fillStyle = proj.color;
    ctx.fillRect(-5, -2, 10, 5);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(3, -2, 2, 5);
  } else if (proj.weaponId === 'paper_plane') {
    ctx.fillStyle = '#F4F1DE';
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-7, -5);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-7, 5);
    ctx.closePath();
    ctx.fill();
  } else if (proj.weaponId === 'heavy_backpack') {
    ctx.fillStyle = '#9B5DE5';
    ctx.fillRect(-7, -7, 14, 14);
    ctx.fillStyle = '#FFD166';
    ctx.fillRect(-5, -2, 10, 4);
  } else {
    ctx.fillStyle = proj.secondaryColor;
    ctx.fillRect(-5, -5, 10, 10);
    ctx.fillStyle = proj.color;
    ctx.fillRect(-3, -3, 6, 6);
  }

  ctx.restore();
}

export function drawSupplyCrate(
  ctx: CanvasRenderingContext2D,
  crate: SupplyCrate,
  timeTick: number
) {
  ctx.save();
  ctx.translate(Math.round(crate.x), Math.round(crate.y));

  if (crate.vy > 0.2) {
    ctx.fillStyle = '#F4F1DE';
    ctx.fillRect(-10, -20, 20, 6);
    ctx.fillStyle = '#EF476F';
    ctx.fillRect(-4, -22, 8, 4);
    ctx.strokeStyle = '#A7A9BE';
    ctx.beginPath();
    ctx.moveTo(-8, -14);
    ctx.lineTo(-4, -6);
    ctx.moveTo(8, -14);
    ctx.lineTo(4, -6);
    ctx.stroke();
  }

  ctx.fillStyle = crate.type === 'XP_TOME' ? '#560BAD' : '#2B9348';
  ctx.fillRect(-8, -8, 16, 16);
  ctx.strokeStyle = '#FFD166';
  ctx.lineWidth = 2;
  ctx.strokeRect(-8, -8, 16, 16);

  ctx.fillStyle = '#FFD166';
  if (crate.type === 'XP_TOME') {
    ctx.fillRect(-4, -3, 8, 6);
  } else {
    ctx.fillStyle = '#EF476F';
    ctx.fillRect(-3, -3, 6, 6);
    ctx.fillStyle = '#70E000';
    ctx.fillRect(0, -5, 2, 2);
  }

  if (Math.floor(timeTick / 15) % 2 === 0) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-6, -6, 2, 2);
  }

  ctx.restore();
}

export function renderWeaponPixelIcon(weaponId: WeaponId): string {
  switch (weaponId) {
    case 'eraser_bomb':
      return '🧽';
    case 'chalk_cluster':
      return '🖍️';
    case 'gouache_jet':
      return '🌊';
    case 'solar_fireball':
      return '☀️';
    case 'paper_plane':
      return '✈️';
    case 'compass_lightning':
      return '⚡';
    case 'thorn_seed':
      return '🌿';
    case 'heavy_backpack':
      return '🎒';
    case 'meteor_protractor':
      return '☄️';
    case 'crystal_ruler_tp':
      return '📏';
  }
}
