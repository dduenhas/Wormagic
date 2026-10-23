export type GameplayMode = 'CLASSIC_V1' | 'MODERN_V2';

export type ElementCategory = 'ESCOLAR' | 'FOGO' | 'AGUA' | 'VENTO' | 'TERRA' | 'RAIO' | 'ARCANO';

export type WeaponId =
  | 'eraser_bomb'
  | 'chalk_cluster'
  | 'gouache_jet'
  | 'solar_fireball'
  | 'paper_plane'
  | 'compass_lightning'
  | 'thorn_seed'
  | 'heavy_backpack'
  | 'meteor_protractor'
  | 'crystal_ruler_tp';

export interface SpellWeapon {
  id: WeaponId;
  name: string;
  subtitle: string;
  category: ElementCategory;
  unlockLevel: number;
  damage: number;
  blastRadius: number;
  knockback: number;
  windFactor: number; // 0 = unaffected, 1 = standard wind, 1.8 = high wind
  bounces: number;
  ammoPerMatch: number; // -1 for infinite
  projectileType:
    | 'ballistic'
    | 'bouncing'
    | 'stream'
    | 'glider'
    | 'sky_strike'
    | 'seed'
    | 'heavy_drop'
    | 'meteor_shower'
    | 'teleport';
  color: string;
  secondaryColor: string;
  description: string;
}

export type HatId = 'wizard' | 'grad_cap' | 'leaf_crown' | 'beret' | 'headband' | 'witch_hat' | 'none';
export type GlassesId = 'none' | 'round_nerd' | 'sun_shades' | 'monocle';
export type WandId = 'hb_pencil' | 'oak_branch' | 'fountain_pen' | 'crystal_ruler';
export type SkinId =
  | 'classic_pink'
  | 'forest_moss'
  | 'glacial_blue'
  | 'astral_violet'
  | 'solar_amber'
  | 'chalk_white';

export interface WormCosmetics {
  skin: SkinId;
  hat: HatId;
  glasses: GlassesId;
  wand: WandId;
}

export interface WormUnit {
  id: string;
  teamId: number;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  facing: 1 | -1;
  aimAngle: number; // radians, relative to facing
  isGrounded: boolean;
  jumpsUsed: number;
  stamina: number; // 0..100 per turn for jetpack/dash/walk
  isAlive: boolean;
  cosmetics: WormCosmetics;
  speechBubble?: { text: string; timer: number };
  burnStacks?: number;
}

export interface TeamConfig {
  id: number;
  name: string;
  color: string;
  badgeText: string;
  isBot: boolean;
  defaultCosmetics: WormCosmetics;
  wormNames: [string, string, string];
  ammo: Record<WeaponId, number>;
}

export interface ActiveProjectile {
  id: string;
  weaponId: WeaponId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  bouncesLeft: number;
  fuseTimer: number; // frames remaining for bouncing grenades
  age: number;
  color: string;
  secondaryColor: string;
  isChildFragment?: boolean;
  isCriticalShot?: boolean;
  trailHistory: { x: number; y: number }[];
}

export interface PixelParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  gravity: number;
  windAffected?: boolean;
}

export interface ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

export interface ThermalZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  liftForce: number; // negative vy (updraft) or vortex
  swirlForce: number;
  label: string;
}

export type WeatherConditionId = 'CALM_BREEZE' | 'GALE_STORM' | 'UPDRAFT_THERMAL' | 'TURBULENT_GUSTS' | 'TAILWIND_RUSH';

export interface WeatherState {
  conditionId: WeatherConditionId;
  name: string;
  description: string;
  baseWindX: number;
  currentWindX: number;
  currentWindY: number; // vertical updraft/downdraft
  gustPhase: number;
  gustAmplitude: number;
  gustFrequency: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  scale?: number;
}

export interface SupplyCrate {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'XP_TOME' | 'APPLE_HEAL';
  collected: boolean;
}

export type BiomeId =
  | 'blackboard_forest'
  | 'gouache_archipelago'
  | 'library_ruins'
  | 'botanical_desk';

export interface BiomeConfig {
  id: BiomeId;
  name: string;
  subtitle: string;
  skyTop: string;
  skyBottom: string;
  topSoilColor: string;
  midSoilColor: string;
  deepRockColor: string;
  waterColor: string;
}

export interface PlayerProgression {
  xp: number;
  level: number;
  matchesPlayed: number;
  totalDamageDealt: number;
  wormsEliminated: number;
  unlockAllSandbox: boolean;
}
