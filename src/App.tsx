import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Compass,
  Cpu,
  Flame,
  Layers,
  Palette,
  RotateCcw,
  Settings,
  SkipForward,
  Sparkles,
  Volume2,
  VolumeX,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import { ArsenalModal } from './components/ArsenalModal';
import { GodotBlueprintModal } from './components/GodotBlueprintModal';
import { TitleScreen } from './components/TitleScreen';
import { WardrobeModal } from './components/WardrobeModal';
import {
  BATTLE_CRIES,
  BIOMES,
  createInitialAmmo,
  INITIAL_TEAMS,
  LEVEL_THRESHOLDS,
  SPELL_ARSENAL,
} from './data/arsenal';
import {
  ActiveProjectile,
  BiomeId,
  FloatingText,
  GameplayMode,
  PixelParticle,
  PlayerProgression,
  ShockwaveRing,
  SupplyCrate,
  TeamConfig,
  ThermalZone,
  WeaponId,
  WeatherConditionId,
  WeatherState,
  WormUnit,
} from './types/game';
import {
  buildThornMound,
  carveTerrainCrater,
  drawPixelProjectile,
  drawPixelWorm,
  drawShockwaves,
  drawSupplyCrate,
  drawThermalZones,
  drawWindStreamlines,
  drawWormAimHUD,
  generatePixelTerrain,
  renderWeaponPixelIcon,
} from './utils/pixelArtRenderer';
import { soundFX } from './utils/sound';

const CANVAS_W = 1280;
const CANVAS_H = 720;
const WATER_Y = CANVAS_H - 42;
const TURN_TIME_SECONDS = 40;
const SPOTLIGHT_TOTAL_FRAMES = 74; // ~1.2s zoom-in on active worm then rapid return to wide shot

const STORAGE_KEY_PROGRESSION = 'grimorio_giz_progression_v1';
const STORAGE_KEY_JOYSTICK = 'grimorio_giz_joystick_config_v2';
const MIN_AIM_ANGLE = -1.42; // ~ -81 deg (high lob)
const MAX_AIM_ANGLE = 0.42; // ~ +24 deg (safe downward angle so shots don't hit own feet)

interface JoystickConfig {
  aimSensitivity: number; // 0.25 to 2.5 (1.0 = 100%)
  walkSensitivity: number; // 0.4 to 2.0 (1.0 = 100%)
  deadzone: number; // 0.08 to 0.45 (default 0.20 = 20%)
  size: 'SM' | 'MD' | 'LG';
  aimMode: 'INCREMENTAL' | 'DIRECTIONAL';
  invertY: boolean;
  touchCanvasAim: boolean;
}

const DEFAULT_JOYSTICK_CONFIG: JoystickConfig = {
  aimSensitivity: 1.0,
  walkSensitivity: 1.0,
  deadzone: 0.2,
  size: 'MD',
  aimMode: 'INCREMENTAL',
  invertY: false,
  touchCanvasAim: false,
};

const WEATHER_PRESETS: {
  id: WeatherConditionId;
  name: string;
  description: string;
  gustAmp: number;
  gustFreq: number;
  windY: number;
}[] = [
  {
    id: 'CALM_BREEZE',
    name: 'Brisa do Pátio',
    description: 'Vento suave com leve oscilação contínua',
    gustAmp: 1.1,
    gustFreq: 0.018,
    windY: 0,
  },
  {
    id: 'GALE_STORM',
    name: 'Vendaval de Giz',
    description: 'Rajadas horizontais intensas que curvam disparos longos',
    gustAmp: 2.8,
    gustFreq: 0.032,
    windY: 0.02,
  },
  {
    id: 'UPDRAFT_THERMAL',
    name: 'Corrente Ascendente',
    description: 'Ar quente reduz a gravidade dos projéteis e amplia o alcance',
    gustAmp: 1.5,
    gustFreq: 0.024,
    windY: -0.065,
  },
  {
    id: 'TURBULENT_GUSTS',
    name: 'Vórtice Ciclônico',
    description: 'O vento inverte de direção em pulsos rítmicos durante o turno',
    gustAmp: 3.6,
    gustFreq: 0.045,
    windY: -0.02,
  },
  {
    id: 'TAILWIND_RUSH',
    name: 'Frente de Tempestade',
    description: 'Corrente veloz constante com turbilhões térmicos ativos',
    gustAmp: 1.9,
    gustFreq: 0.028,
    windY: 0.035,
  },
];

function createWeatherForMode(mode: GameplayMode): WeatherState {
  if (mode === 'CLASSIC_V1') {
    const fixedWind = Number(((Math.random() - 0.5) * 5.0).toFixed(1));
    return {
      conditionId: 'CALM_BREEZE',
      name: 'Vento Clássico Fixo',
      description: 'Velocidade constante durante todo o turno',
      baseWindX: fixedWind,
      currentWindX: fixedWind,
      currentWindY: 0,
      gustPhase: 0,
      gustAmplitude: 0,
      gustFrequency: 0,
    };
  }

  const preset = WEATHER_PRESETS[Math.floor(Math.random() * WEATHER_PRESETS.length)];
  const baseWindX = Number(((Math.random() - 0.5) * 6.4).toFixed(2));
  return {
    conditionId: preset.id,
    name: preset.name,
    description: preset.description,
    baseWindX,
    currentWindX: baseWindX,
    currentWindY: preset.windY,
    gustPhase: Math.random() * Math.PI * 2,
    gustAmplitude: preset.gustAmp,
    gustFrequency: preset.gustFreq,
  };
}

function createThermalZones(mode: GameplayMode): ThermalZone[] {
  if (mode === 'CLASSIC_V1') return [];
  const x1 = Math.floor(260 + Math.random() * 260);
  const x2 = Math.floor(720 + Math.random() * 280);
  return [
    {
      id: 'thermal-1',
      x: x1,
      y: 120,
      width: 68,
      height: WATER_Y - 140,
      liftForce: -0.16,
      swirlForce: 0.04,
      label: '↑ TÉRMICA',
    },
    {
      id: 'thermal-2',
      x: x2,
      y: 150,
      width: 68,
      height: WATER_Y - 170,
      liftForce: -0.15,
      swirlForce: -0.04,
      label: '↑ TÉRMICA',
    },
  ];
}

export default function App() {
  // Gameplay Mode: 1st Version (Simple/Classic) vs 2nd Version (Modern/Dynamic)
  const [gameplayMode, setGameplayMode] = useState<GameplayMode>('MODERN_V2');
  const [isTitleScreenOpen, setIsTitleScreenOpen] = useState<boolean>(true);

  // Direct-Hit Knockout Option (Default: false, keeps standard HP reduction)
  const [instantKODirectHit, setInstantKODirectHit] = useState<boolean>(false);

  // Virtual Joystick visual knob state & customizable sensitivity config
  const [joystickKnob, setJoystickKnob] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const [isJoystickSettingsOpen, setIsJoystickSettingsOpen] = useState<boolean>(false);
  const [joystickConfig, setJoystickConfig] = useState<JoystickConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_JOYSTICK);
      if (saved) {
        return { ...DEFAULT_JOYSTICK_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_JOYSTICK_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_JOYSTICK, JSON.stringify(joystickConfig));
    } catch {
      // ignore storage errors
    }
  }, [joystickConfig]);

  // Persistent Level & XP Progression
  const [progression, setProgression] = useState<PlayerProgression>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROGRESSION);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage errors
    }
    return {
      xp: 0,
      level: 1,
      matchesPlayed: 0,
      totalDamageDealt: 0,
      wormsEliminated: 0,
      unlockAllSandbox: false,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESSION, JSON.stringify(progression));
    } catch {
      // ignore
    }
  }, [progression]);

  // Game Config State
  const [teams, setTeams] = useState<TeamConfig[]>(INITIAL_TEAMS);
  const [activeTeamCount, setActiveTeamCount] = useState<number>(2);
  const [selectedBiomeId, setSelectedBiomeId] = useState<BiomeId>('blackboard_forest');
  const [selectedWeaponId, setSelectedWeaponId] = useState<WeaponId>('eraser_bomb');

  // Modals & UI Overlays
  const [isArsenalOpen, setIsArsenalOpen] = useState(false);
  const [isWardrobeOpen, setIsWardrobeOpen] = useState(false);
  const [isGodotModalOpen, setIsGodotModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showTrajectory, setShowTrajectory] = useState(true);
  const [highParticles, setHighParticles] = useState(true);
  const [mouseAimEnabled, setMouseAimEnabled] = useState(true);
  const [levelUpBanner, setLevelUpBanner] = useState<{ level: number; title: string } | null>(
    null
  );
  const [victoryTeam, setVictoryTeam] = useState<TeamConfig | null>(null);

  // HUD Reactive State synced from Engine Ref
  const [activeTeamIndex, setActiveTeamIndex] = useState<number>(0);
  const [turnTimer, setTurnTimer] = useState<number>(TURN_TIME_SECONDS);
  const [hudWeather, setHudWeather] = useState<WeatherState>(() =>
    createWeatherForMode('MODERN_V2')
  );
  const [chargePower, setChargePower] = useState<number>(0);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [activeStamina, setActiveStamina] = useState<number>(100);
  const [turnPhase, setTurnPhase] = useState<'MOVE_AND_AIM' | 'PROJECTILE_FLYING' | 'POST_SHOT'>(
    'MOVE_AND_AIM'
  );
  const [teamHpSummary, setTeamHpSummary] = useState<
    { id: number; totalHp: number; aliveCount: number }[]
  >([]);

  // Offscreen Terrain Canvas & Main Display Canvas
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const terrainCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable Real-Time Game State Ref for 60FPS loop
  const engineRef = useRef<{
    worms: WormUnit[];
    projectiles: ActiveProjectile[];
    particles: PixelParticle[];
    shockwaves: ShockwaveRing[];
    thermals: ThermalZone[];
    floatingTexts: FloatingText[];
    crates: SupplyCrate[];
    activeTeamIdx: number;
    teamWormTurnPointer: number[];
    activeWormId: string;
    weather: WeatherState;
    turnTimeLeft: number;
    phase: 'MOVE_AND_AIM' | 'PROJECTILE_FLYING' | 'POST_SHOT';
    postShotDelay: number;
    charging: boolean;
    power: number;
    powerDirection: 1 | -1;
    keys: Record<string, boolean>;
    touchMoveDir: -1 | 0 | 1;
    touchAimDir: -1 | 0 | 1;
    joystickVector: { x: number; y: number; active: boolean };
    mouseCanvasPos: { x: number; y: number } | null;
    lastInputMode: 'MOUSE' | 'CONTROLLER';
    cameraShake: number;
    cameraX: number;
    cameraY: number;
    cameraZoom: number;
    turnSpotlightTimer: number; // Counts down from SPOTLIGHT_TOTAL_FRAMES -> 0 on each turn start
    hitStopFrames: number;
    lightningBolts: { x: number; y: number; life: number }[];
    tick: number;
    botThinkingTimer: number;
  }>({
    worms: [],
    projectiles: [],
    particles: [],
    shockwaves: [],
    thermals: [],
    floatingTexts: [],
    crates: [],
    activeTeamIdx: 0,
    teamWormTurnPointer: [0, 0, 0, 0],
    activeWormId: '',
    weather: createWeatherForMode('MODERN_V2'),
    turnTimeLeft: TURN_TIME_SECONDS,
    phase: 'MOVE_AND_AIM',
    postShotDelay: 0,
    charging: false,
    power: 0,
    powerDirection: 1,
    keys: {},
    touchMoveDir: 0,
    touchAimDir: 0,
    joystickVector: { x: 0, y: 0, active: false },
    mouseCanvasPos: null,
    lastInputMode: 'CONTROLLER',
    cameraShake: 0,
    cameraX: CANVAS_W / 2,
    cameraY: CANVAS_H / 2,
    cameraZoom: 1,
    turnSpotlightTimer: SPOTLIGHT_TOTAL_FRAMES,
    hitStopFrames: 0,
    lightningBolts: [],
    tick: 0,
    botThinkingTimer: 0,
  });

  // Helper to grant XP and check for Level Up
  const awardXp = useCallback(
    (amount: number, reasonText?: string, fxX?: number, fxY?: number) => {
      if (amount <= 0) return;

      if (reasonText && fxX !== undefined && fxY !== undefined) {
        engineRef.current.floatingTexts.push({
          id: `${Date.now()}-${Math.random()}`,
          x: fxX,
          y: fxY - 18,
          vy: -1.0,
          text: `+${amount} XP (${reasonText})`,
          color: '#FFD166',
          life: 75,
        });
      }

      setProgression((prev) => {
        const nextXp = prev.xp + amount;
        let nextLevel = prev.level;
        let unlockedNewLevel = false;

        for (const t of LEVEL_THRESHOLDS) {
          if (nextXp >= t.xpRequired && t.level > nextLevel) {
            nextLevel = t.level;
            unlockedNewLevel = true;
          }
        }

        if (unlockedNewLevel) {
          const thresholdObj =
            LEVEL_THRESHOLDS.find((l) => l.level === nextLevel) || LEVEL_THRESHOLDS[0];
          soundFX.playLevelUp();
          setLevelUpBanner({ level: nextLevel, title: thresholdObj.title });
          setTimeout(() => setLevelUpBanner(null), 4200);
        }

        return {
          ...prev,
          xp: nextXp,
          level: nextLevel,
        };
      });
    },
    []
  );

  // Pixel terrain collision helper
  const isPixelSolid = useCallback((x: number, y: number): boolean => {
    const tCanvas = terrainCanvasRef.current;
    if (!tCanvas) return false;
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= CANVAS_W || iy >= CANVAS_H) return false;
    if (iy < 0) return false;
    const ctx = tCanvas.getContext('2d');
    if (!ctx) return false;
    const pixel = ctx.getImageData(ix, iy, 1, 1).data;
    return pixel[3] > 80;
  }, []);

  // Find surface Y at given X for spawning worms or crates
  const findSurfaceY = useCallback(
    (x: number, startY = 60): number => {
      for (let y = startY; y < WATER_Y - 10; y += 2) {
        if (isPixelSolid(x, y)) {
          return y - 10;
        }
      }
      return 200;
    },
    [isPixelSolid]
  );

  // Initialize / Reset a Match
  const initMatch = useCallback(
    (
      customTeams: TeamConfig[] = teams,
      teamCount: number = activeTeamCount,
      biomeId: BiomeId = selectedBiomeId,
      modeOverride: GameplayMode = gameplayMode
    ) => {
      if (!terrainCanvasRef.current) {
        const off = document.createElement('canvas');
        off.width = CANVAS_W;
        off.height = CANVAS_H;
        terrainCanvasRef.current = off;
      }

      const biome = BIOMES.find((b) => b.id === biomeId) || BIOMES[0];
      const tCtx = terrainCanvasRef.current.getContext('2d');
      if (tCtx) {
        generatePixelTerrain(tCtx, CANVAS_W, CANVAS_H, biome, Math.random() * 9999);
      }

      const refreshedTeams = customTeams.map((t) => ({
        ...t,
        ammo: createInitialAmmo(),
      }));
      setTeams(refreshedTeams);

      const spawnedWorms: WormUnit[] = [];
      const totalWorms = teamCount * 3;
      for (let tIdx = 0; tIdx < teamCount; tIdx++) {
        const team = refreshedTeams[tIdx];
        for (let wIdx = 0; wIdx < 3; wIdx++) {
          const slotIndex = tIdx + wIdx * teamCount;
          const xPos = Math.floor(
            130 + (slotIndex / Math.max(1, totalWorms - 1)) * (CANVAS_W - 260)
          );
          const yPos = findSurfaceY(xPos, 40);
          spawnedWorms.push({
            id: `worm-${tIdx}-${wIdx}`,
            teamId: tIdx,
            name: team.wormNames[wIdx] || `Minhoca ${wIdx + 1}`,
            x: xPos,
            y: yPos,
            vx: 0,
            vy: 0,
            hp: 100,
            maxHp: 100,
            facing: xPos < CANVAS_W / 2 ? 1 : -1,
            aimAngle: -0.35,
            isGrounded: false,
            jumpsUsed: 0,
            stamina: 100,
            isAlive: true,
            isLaunchingOut: false,
            launchSpin: 0,
            cosmetics: { ...team.defaultCosmetics },
          });
        }
      }

      const crateX = Math.floor(CANVAS_W * 0.48 + (Math.random() - 0.5) * 220);
      const initialCrate: SupplyCrate = {
        id: `crate-init`,
        x: crateX,
        y: 60,
        vx: 0,
        vy: 1.2,
        type: 'XP_TOME',
        collected: false,
      };

      const initialWeather = createWeatherForMode(modeOverride);
      const firstWorm = spawnedWorms[0];

      engineRef.current = {
        worms: spawnedWorms,
        projectiles: [],
        particles: [],
        shockwaves: [],
        thermals: createThermalZones(modeOverride),
        floatingTexts: [],
        crates: [initialCrate],
        activeTeamIdx: 0,
        teamWormTurnPointer: [0, 0, 0, 0],
        activeWormId: firstWorm ? firstWorm.id : '',
        weather: initialWeather,
        turnTimeLeft: TURN_TIME_SECONDS,
        phase: 'MOVE_AND_AIM',
        postShotDelay: 0,
        charging: false,
        power: 0,
        powerDirection: 1,
        keys: {},
        touchMoveDir: 0,
        touchAimDir: 0,
        joystickVector: { x: 0, y: 0, active: false },
        mouseCanvasPos: null,
        lastInputMode: 'CONTROLLER',
        cameraShake: 0,
        cameraX: CANVAS_W / 2,
        cameraY: CANVAS_H / 2,
        cameraZoom: 1,
        turnSpotlightTimer: SPOTLIGHT_TOTAL_FRAMES,
        hitStopFrames: 0,
        lightningBolts: [],
        tick: 0,
        botThinkingTimer: 95,
      };

      setVictoryTeam(null);
      setActiveTeamIndex(0);
      setHudWeather(initialWeather);
      setTurnTimer(TURN_TIME_SECONDS);
      setTurnPhase('MOVE_AND_AIM');
      setActiveStamina(100);
      setSelectedWeaponId('eraser_bomb');
      soundFX.playTurnStart();
    },
    [teams, activeTeamCount, selectedBiomeId, gameplayMode, findSurfaceY]
  );

  // Advance to next alive team & worm turn (triggers the Turn Spotlight Zoom-In -> Wide Overview camera!)
  const advanceTurn = useCallback(() => {
    const st = engineRef.current;
    const aliveTeams = new Set(
      st.worms.filter((w) => w.isAlive && !w.isLaunchingOut).map((w) => w.teamId)
    );

    if (aliveTeams.size <= 1) {
      const winnerId = Array.from(aliveTeams)[0];
      const winTeam = teams[winnerId] || teams[0];
      setVictoryTeam(winTeam);
      awardXp(120, 'Vitória na Partida');
      return;
    }

    let nextTeam = (st.activeTeamIdx + 1) % activeTeamCount;
    for (let i = 0; i < activeTeamCount; i++) {
      const candidate = (st.activeTeamIdx + 1 + i) % activeTeamCount;
      if (aliveTeams.has(candidate)) {
        nextTeam = candidate;
        break;
      }
    }

    const teamWorms = st.worms.filter(
      (w) => w.teamId === nextTeam && w.isAlive && !w.isLaunchingOut
    );
    const pointer = st.teamWormTurnPointer[nextTeam] % teamWorms.length;
    const chosenWorm = teamWorms[pointer];
    st.teamWormTurnPointer[nextTeam] = pointer + 1;

    chosenWorm.stamina = 100;
    chosenWorm.jumpsUsed = 0;

    const nextWeather = createWeatherForMode(gameplayMode);
    st.activeTeamIdx = nextTeam;
    st.activeWormId = chosenWorm.id;
    st.weather = nextWeather;
    st.turnTimeLeft = TURN_TIME_SECONDS;
    st.phase = 'MOVE_AND_AIM';
    st.charging = false;
    st.power = 0;
    st.powerDirection = 1;
    st.touchMoveDir = 0;
    st.touchAimDir = 0;
    st.joystickVector = { x: 0, y: 0, active: false };
    st.mouseCanvasPos = null;
    st.lastInputMode = 'CONTROLLER';
    st.turnSpotlightTimer = SPOTLIGHT_TOTAL_FRAMES;
    st.botThinkingTimer = 105; // Wait for spotlight zoom to finish before bot fires

    if (Math.random() < 0.5 && st.crates.filter((c) => !c.collected).length < 3) {
      st.crates.push({
        id: `crate-${Date.now()}`,
        x: Math.floor(180 + Math.random() * (CANVAS_W - 360)),
        y: 20,
        vx: 0,
        vy: 1.0,
        type: Math.random() < 0.6 ? 'XP_TOME' : 'APPLE_HEAL',
        collected: false,
      });
    }

    setActiveTeamIndex(nextTeam);
    setHudWeather(nextWeather);
    setTurnTimer(TURN_TIME_SECONDS);
    setTurnPhase('MOVE_AND_AIM');
    setChargePower(0);
    setIsCharging(false);
    setActiveStamina(100);
    setJoystickKnob({ x: 0, y: 0, active: false });
    soundFX.playTurnStart();
  }, [activeTeamCount, teams, gameplayMode, awardXp]);

  // Fire currently selected weapon with given power (10..100)
  const fireSelectedWeapon = useCallback(
    (powerPercent: number) => {
      const st = engineRef.current;
      if (st.phase !== 'MOVE_AND_AIM') return;
      const shooter = st.worms.find((w) => w.id === st.activeWormId && w.isAlive);
      if (!shooter) return;

      const weapon =
        SPELL_ARSENAL.find((w) => w.id === selectedWeaponId) || SPELL_ARSENAL[0];

      const teamAmmo = teams[shooter.teamId]?.ammo[weapon.id] ?? -1;
      if (teamAmmo === 0) return;

      if (teamAmmo > 0) {
        setTeams((prev) =>
          prev.map((t, idx) =>
            idx === shooter.teamId
              ? { ...t, ammo: { ...t.ammo, [weapon.id]: t.ammo[weapon.id] - 1 } }
              : t
          )
        );
      }

      const safePower = Math.max(24, Math.min(100, powerPercent));
      const isCrit =
        gameplayMode === 'MODERN_V2' && safePower >= 86 && safePower <= 96;
      const cry = isCrit
        ? 'DISPARO CRÍTICO PERFEITO!'
        : BATTLE_CRIES[Math.floor(Math.random() * BATTLE_CRIES.length)];
      shooter.speechBubble = { text: cry, timer: 95 };

      const clampedAim = Math.max(MIN_AIM_ANGLE, Math.min(MAX_AIM_ANGLE, shooter.aimAngle));
      shooter.aimAngle = clampedAim;
      const worldAngle =
        shooter.facing === 1 ? clampedAim : Math.PI - clampedAim;
      const speed = (safePower / 100) * 15.0 + 2.6;
      const spawnX = shooter.x + Math.cos(worldAngle) * 18;
      const spawnY = shooter.y - 6 + Math.sin(worldAngle) * 18;

      if (gameplayMode === 'MODERN_V2') {
        shooter.vx -= Math.cos(worldAngle) * 1.4;
        shooter.vy -= Math.sin(worldAngle) * 0.9;
      }

      soundFX.playCastSpell(weapon.category === 'RAIO' ? 1.4 : 1.0, isCrit);

      if (gameplayMode === 'MODERN_V2') {
        st.shockwaves.push({
          x: spawnX,
          y: spawnY,
          radius: 4,
          maxRadius: isCrit ? 28 : 18,
          color: isCrit ? '#00F5D4' : weapon.color,
          alpha: 0.9,
        });
      }

      if (weapon.projectileType === 'stream') {
        for (let i = 0; i < 3; i++) {
          const spread = (i - 1) * 0.04;
          st.projectiles.push({
            id: `proj-${Date.now()}-${i}`,
            weaponId: weapon.id,
            shooterId: shooter.id,
            x: spawnX + Math.cos(worldAngle) * (i * 6),
            y: spawnY + Math.sin(worldAngle) * (i * 6),
            vx: Math.cos(worldAngle + spread) * (speed * (0.94 + i * 0.05)),
            vy: Math.sin(worldAngle + spread) * (speed * (0.94 + i * 0.05)),
            radius: 5,
            bouncesLeft: 0,
            fuseTimer: 0,
            age: 0,
            color: weapon.color,
            secondaryColor: weapon.secondaryColor,
            isCriticalShot: isCrit,
            trailHistory: [],
          });
        }
      } else {
        st.projectiles.push({
          id: `proj-${Date.now()}`,
          weaponId: weapon.id,
          shooterId: shooter.id,
          x: spawnX,
          y: spawnY,
          vx: Math.cos(worldAngle) * speed,
          vy: Math.sin(worldAngle) * speed,
          radius: weapon.projectileType === 'heavy_drop' ? 8 : 5,
          bouncesLeft: weapon.bounces,
          fuseTimer: weapon.bounces > 0 ? 160 : 0,
          age: 0,
          color: weapon.color,
          secondaryColor: weapon.secondaryColor,
          isCriticalShot: isCrit,
          trailHistory: [],
        });
      }

      st.charging = false;
      st.power = 0;
      st.turnSpotlightTimer = 0; // Ensure wide view when firing
      st.phase = 'PROJECTILE_FLYING';
      setIsCharging(false);
      setChargePower(0);
      setTurnPhase('PROJECTILE_FLYING');
    },
    [selectedWeaponId, teams, gameplayMode]
  );

  // Detonate a projectile at (cx, cy)
  const triggerDetonation = useCallback(
    (proj: ActiveProjectile) => {
      const st = engineRef.current;
      const weapon =
        SPELL_ARSENAL.find((w) => w.id === proj.weaponId) || SPELL_ARSENAL[0];
      const tCtx = terrainCanvasRef.current?.getContext('2d');

      if (weapon.projectileType === 'teleport') {
        const activeWorm = st.worms.find((w) => w.id === st.activeWormId && w.isAlive);
        if (activeWorm) {
          st.shockwaves.push({
            x: activeWorm.x,
            y: activeWorm.y,
            radius: 4,
            maxRadius: 34,
            color: '#9B5DE5',
            alpha: 0.9,
          });
          activeWorm.x = Math.max(24, Math.min(CANVAS_W - 24, proj.x));
          activeWorm.y = Math.max(24, proj.y - 12);
          activeWorm.vx = 0;
          activeWorm.vy = 0;
          soundFX.playCastSpell(1.6, true);
          for (let i = 0; i < 28; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 1 + Math.random() * 4.5;
            st.particles.push({
              x: activeWorm.x,
              y: activeWorm.y,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              color: i % 2 === 0 ? '#00F5D4' : '#9B5DE5',
              size: 4,
              life: 35,
              maxLife: 35,
              gravity: 0.04,
            });
          }
        }
        return;
      }

      if (weapon.projectileType === 'meteor_shower' && !proj.isChildFragment) {
        soundFX.playCastSpell(0.8, true);
        for (let m = -1; m <= 1; m++) {
          st.projectiles.push({
            id: `meteor-${Date.now()}-${m}`,
            weaponId: weapon.id,
            x: Math.max(40, Math.min(CANVAS_W - 40, proj.x + m * 55 - 40)),
            y: 15 + Math.abs(m) * 25,
            vx: 1.5 + st.weather.currentWindX * 0.25,
            vy: 8.5,
            radius: 7,
            bouncesLeft: 0,
            fuseTimer: 0,
            age: 0,
            color: '#F15BB5',
            secondaryColor: '#FEE440',
            isChildFragment: true,
            isCriticalShot: proj.isCriticalShot,
            trailHistory: [],
          });
        }
        return;
      }

      if (weapon.projectileType === 'sky_strike') {
        st.lightningBolts.push({ x: proj.x, y: proj.y, life: 26 });
      }

      const critMultiplier = proj.isCriticalShot ? 1.25 : 1.0;
      const blastR = Math.round(
        (proj.isChildFragment ? weapon.blastRadius * 0.75 : weapon.blastRadius) *
          (proj.isCriticalShot ? 1.15 : 1.0)
      );
      const maxDmg = Math.round(
        (proj.isChildFragment ? weapon.damage * 0.7 : weapon.damage) * critMultiplier
      );

      if (tCtx) {
        carveTerrainCrater(tCtx, proj.x, proj.y, blastR);
        if (weapon.projectileType === 'seed') {
          buildThornMound(tCtx, proj.x, proj.y, blastR);
        }
      }

      if (gameplayMode === 'MODERN_V2' || instantKODirectHit) {
        st.shockwaves.push({
          x: proj.x,
          y: proj.y,
          radius: 6,
          maxRadius: blastR * 1.45,
          color: proj.isCriticalShot ? '#00F5D4' : proj.color,
          alpha: 1.0,
        });
      }

      if (weapon.id === 'chalk_cluster' && !proj.isChildFragment) {
        const colors = ['#EF476F', '#FFD166', '#06D6A0', '#4CC9F0'];
        for (let c = 0; c < 4; c++) {
          const angle = -Math.PI * 0.75 + (c / 3) * (Math.PI * 0.5);
          st.projectiles.push({
            id: `frag-${Date.now()}-${c}`,
            weaponId: weapon.id,
            x: proj.x,
            y: proj.y - 6,
            vx: Math.cos(angle) * (4.4 + Math.random() * 1.6),
            vy: Math.sin(angle) * (5.4 + Math.random() * 1.6),
            radius: 4,
            bouncesLeft: 0,
            fuseTimer: 0,
            age: 0,
            color: colors[c],
            secondaryColor: '#FFFFFF',
            isChildFragment: true,
            isCriticalShot: proj.isCriticalShot,
            trailHistory: [],
          });
        }
      }

      soundFX.playExplosion(blastR / 32, proj.isCriticalShot);
      st.cameraShake = Math.min(22, Math.floor(blastR / 2.6));
      if (gameplayMode === 'MODERN_V2') {
        st.hitStopFrames = proj.isCriticalShot ? 4 : 2;
      }

      const particleCount = highParticles ? 40 : 18;
      for (let i = 0; i < particleCount; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 1.4 + Math.random() * 7.2;
        st.particles.push({
          x: proj.x,
          y: proj.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 1.8,
          color: i % 2 === 0 ? proj.color : proj.secondaryColor,
          size: i % 3 === 0 ? 5 : 3,
          life: 28 + Math.floor(Math.random() * 28),
          maxLife: 56,
          gravity: 0.17,
          windAffected: gameplayMode === 'MODERN_V2',
        });
      }

      let totalHitDmg = 0;
      let eliminations = 0;
      const hitRadius = blastR + 20;

      st.worms.forEach((w) => {
        if (!w.isAlive || w.isLaunchingOut) return;
        const dx = w.x - proj.x;
        const dy = w.y - proj.y;
        const dist = Math.hypot(dx, dy);

        const isDirectHitOnWorm =
          proj.directHitWormId === w.id || dist <= Math.max(24, blastR * 0.58);

        if (instantKODirectHit && isDirectHitOnWorm) {
          w.isLaunchingOut = true;
          w.launchSpin = 0.15;
          const launchDirX =
            Math.abs(dx) > 3 ? Math.sign(dx) : proj.vx >= 0 ? 1 : -1;
          w.vx = launchDirX * (15.5 + Math.random() * 4.5);
          w.vy = -18.5 - Math.random() * 3.5;
          w.isGrounded = false;
          totalHitDmg += w.hp;
          eliminations++;

          soundFX.playKnockoutLaunch();
          st.cameraShake = 26;
          st.hitStopFrames = 5;

          st.shockwaves.push({
            x: w.x,
            y: w.y,
            radius: 6,
            maxRadius: 68,
            color: '#FFD166',
            alpha: 1.0,
          });

          st.floatingTexts.push({
            id: `ko-launch-${Date.now()}-${w.id}`,
            x: w.x,
            y: w.y - 32,
            vy: -1.5,
            text: 'FORA DO CENÁRIO! K.O.!',
            color: '#FFD166',
            life: 95,
          });
          return;
        }

        if (dist <= hitRadius) {
          const falloff = Math.max(0.28, 1 - dist / (hitRadius + 8));
          const dmg = Math.max(1, Math.round(maxDmg * falloff));
          w.hp = Math.max(0, w.hp - dmg);
          totalHitDmg += dmg;

          const normX = dist > 0.1 ? dx / dist : 0;
          const normY = dist > 0.1 ? dy / dist : -1;
          const kbForce = weapon.knockback * falloff * (proj.isCriticalShot ? 1.2 : 1.0);
          w.vx += normX * kbForce;
          w.vy += Math.min(-3.6, normY * kbForce - 2.8);
          w.isGrounded = false;

          st.floatingTexts.push({
            id: `dmg-${Date.now()}-${w.id}-${Math.random()}`,
            x: w.x,
            y: w.y - 24,
            vy: -1.25,
            text: proj.isCriticalShot ? `CRIT -${dmg} HP!` : `-${dmg} HP`,
            color: proj.isCriticalShot ? '#00F5D4' : '#EF476F',
            life: 72,
          });

          if (w.hp <= 0) {
            w.isAlive = false;
            eliminations++;
            st.floatingTexts.push({
              id: `ko-${Date.now()}-${w.id}`,
              x: w.x,
              y: w.y - 38,
              vy: -1.4,
              text: 'REPROVADO!',
              color: '#FFD166',
              life: 90,
            });
          }
        }
      });

      if (totalHitDmg > 0) {
        const xpEarned = Math.round(totalHitDmg * 1.25) + eliminations * 65;
        awardXp(
          xpEarned,
          instantKODirectHit && eliminations > 0
            ? 'K.O. Fora do Cenário'
            : proj.isCriticalShot
            ? 'Crítico Arcano'
            : 'Impacto Arcano',
          proj.x,
          proj.y
        );
      }
    },
    [awardXp, highParticles, gameplayMode, instantKODirectHit]
  );

  // Initialize first match on mount
  useEffect(() => {
    initMatch(INITIAL_TEAMS, 2, 'blackboard_forest', 'MODERN_V2');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Perform Jump
  const performJump = useCallback(() => {
    const st = engineRef.current;
    const activeWorm = st.worms.find((w) => w.id === st.activeWormId && w.isAlive);
    if (!activeWorm || st.phase !== 'MOVE_AND_AIM') return;

    if (activeWorm.isGrounded) {
      activeWorm.vy = -6.3;
      activeWorm.vx = activeWorm.facing * 2.4;
      activeWorm.isGrounded = false;
      activeWorm.jumpsUsed = 1;
      soundFX.playJump(false);
    } else if (
      gameplayMode === 'MODERN_V2' &&
      activeWorm.jumpsUsed < 2 &&
      activeWorm.stamina >= 20
    ) {
      activeWorm.vy = -5.8;
      activeWorm.vx = activeWorm.facing * 3.4;
      activeWorm.jumpsUsed = 2;
      activeWorm.stamina = Math.max(0, activeWorm.stamina - 20);
      setActiveStamina(Math.round(activeWorm.stamina));
      soundFX.playJump(true);
      st.shockwaves.push({
        x: activeWorm.x,
        y: activeWorm.y + 6,
        radius: 3,
        maxRadius: 20,
        color: '#06D6A0',
        alpha: 0.85,
      });
      for (let i = 0; i < 12; i++) {
        st.particles.push({
          x: activeWorm.x,
          y: activeWorm.y + 6,
          vx: (Math.random() - 0.5) * 4,
          vy: 1.5 + Math.random() * 2,
          color: '#06D6A0',
          size: 3,
          life: 22,
          maxLife: 22,
          gravity: 0.06,
        });
      }
    }
  }, [gameplayMode]);

  // Perform Acrobatic Backflip / Dash
  const performAcrobaticDash = useCallback(() => {
    if (gameplayMode !== 'MODERN_V2') return;
    const st = engineRef.current;
    const activeWorm = st.worms.find((w) => w.id === st.activeWormId && w.isAlive);
    if (!activeWorm || st.phase !== 'MOVE_AND_AIM' || activeWorm.stamina < 25) return;

    activeWorm.stamina = Math.max(0, activeWorm.stamina - 25);
    setActiveStamina(Math.round(activeWorm.stamina));
    activeWorm.vy = -7.2;
    activeWorm.vx = -activeWorm.facing * 4.2;
    activeWorm.isGrounded = false;
    soundFX.playDash();

    st.floatingTexts.push({
      id: `flip-${Date.now()}`,
      x: activeWorm.x,
      y: activeWorm.y - 20,
      vy: -0.9,
      text: 'SALTO ACROBÁTICO!',
      color: '#4CC9F0',
      life: 42,
    });
  }, [gameplayMode]);

  // Keyboard Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTitleScreenOpen || isArsenalOpen || isWardrobeOpen || isGodotModalOpen) {
        if (e.key === 'Escape') {
          setIsArsenalOpen(false);
          setIsWardrobeOpen(false);
          setIsGodotModalOpen(false);
        }
        return;
      }

      const st = engineRef.current;
      st.keys[e.code] = true;
      st.lastInputMode = 'CONTROLLER';
      st.mouseCanvasPos = null;

      if (e.key >= '0' && e.key <= '9') {
        const idx = e.key === '0' ? 9 : parseInt(e.key, 10) - 1;
        const w = SPELL_ARSENAL[idx];
        if (
          w &&
          (progression.unlockAllSandbox || progression.level >= w.unlockLevel)
        ) {
          setSelectedWeaponId(w.id);
        }
      }

      if (e.code === 'KeyE' || e.code === 'Tab') {
        e.preventDefault();
        setIsArsenalOpen((prev) => !prev);
      }

      if (
        e.code === 'Enter' ||
        (gameplayMode === 'MODERN_V2' && e.code === 'KeyW')
      ) {
        if (!e.repeat) {
          performJump();
        }
      }

      if (
        gameplayMode === 'MODERN_V2' &&
        (e.code === 'KeyQ' || e.code === 'ShiftLeft') &&
        !e.repeat
      ) {
        performAcrobaticDash();
      }

      if (e.code === 'Space' && st.phase === 'MOVE_AND_AIM') {
        e.preventDefault();
        const currentTeam = teams[st.activeTeamIdx];
        if (!currentTeam?.isBot && !st.charging) {
          st.charging = true;
          st.power = 12;
          st.powerDirection = 1;
          st.turnSpotlightTimer = 0;
          setIsCharging(true);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const st = engineRef.current;
      st.keys[e.code] = false;

      if (e.code === 'Space' && st.charging && st.phase === 'MOVE_AND_AIM') {
        e.preventDefault();
        const finalPower = Math.max(15, st.power);
        fireSelectedWeapon(finalPower);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [
    isTitleScreenOpen,
    isArsenalOpen,
    isWardrobeOpen,
    isGodotModalOpen,
    gameplayMode,
    progression.level,
    progression.unlockAllSandbox,
    teams,
    fireSelectedWeapon,
    performJump,
    performAcrobaticDash,
  ]);

  // 1-Second Turn Countdown Timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (
        isTitleScreenOpen ||
        isArsenalOpen ||
        isWardrobeOpen ||
        isGodotModalOpen ||
        isJoystickSettingsOpen ||
        victoryTeam
      )
        return;
      const st = engineRef.current;
      if (st.phase === 'MOVE_AND_AIM') {
        st.turnTimeLeft -= 1;
        setTurnTimer(Math.max(0, st.turnTimeLeft));
        if (st.turnTimeLeft <= 0) {
          advanceTurn();
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [
    isTitleScreenOpen,
    isArsenalOpen,
    isWardrobeOpen,
    isGodotModalOpen,
    isJoystickSettingsOpen,
    victoryTeam,
    advanceTurn,
  ]);

  // Main 60FPS Game Loop
  useEffect(() => {
    let animationFrameId = 0;

    const updateAndRender = () => {
      const st = engineRef.current;

      if (st.hitStopFrames > 0) {
        st.hitStopFrames--;
        animationFrameId = requestAnimationFrame(updateAndRender);
        return;
      }

      st.tick++;

      // 0. Update Wind based on GameplayMode
      if (gameplayMode === 'MODERN_V2') {
        st.weather.gustPhase += st.weather.gustFrequency;
        const liveGust = Math.sin(st.weather.gustPhase) * st.weather.gustAmplitude;
        const microTurbulence = Math.cos(st.tick * 0.09) * 0.25;
        st.weather.currentWindX = Number(
          Math.max(
            -8.5,
            Math.min(8.5, st.weather.baseWindX + liveGust + microTurbulence)
          ).toFixed(2)
        );
        if (st.tick % 10 === 0) {
          setHudWeather({ ...st.weather });
        }
      } else {
        st.weather.currentWindX = st.weather.baseWindX;
        st.weather.currentWindY = 0;
      }

      const activeWorm = st.worms.find((w) => w.id === st.activeWormId && w.isAlive);
      const currentTeam = teams[st.activeTeamIdx];

      // 1. Handle Human Input (Keyboard + Virtual Joystick) or Bot AI during MOVE_AND_AIM
      if (
        !isTitleScreenOpen &&
        st.phase === 'MOVE_AND_AIM' &&
        activeWorm &&
        !victoryTeam
      ) {
        if (!currentTeam?.isBot) {
          const joy = st.joystickVector;
          const dz = joystickConfig.deadzone;
          const joyYAdjusted = joystickConfig.invertY ? -joy.y : joy.y;
          const joyMag = Math.hypot(joy.x, joy.y);

          // If aiming primarily vertically on the joystick, suppress accidental horizontal walking
          const isVerticalAimDominant =
            joy.active &&
            Math.abs(joyYAdjusted) > Math.abs(joy.x) * 1.35 &&
            Math.abs(joy.x) < dz + 0.16;

          // Allow flipping left/right facing with a gentle horizontal tilt even without walking far
          if (joy.active && Math.abs(joy.x) > dz * 0.85) {
            activeWorm.facing = joy.x < 0 ? -1 : 1;
          }

          const joyMoveLeft =
            joy.active && !st.charging && !isVerticalAimDominant && joy.x < -dz;
          const joyMoveRight =
            joy.active && !st.charging && !isVerticalAimDominant && joy.x > dz;
          const joyAimUp =
            joy.active &&
            joystickConfig.aimMode === 'INCREMENTAL' &&
            joyYAdjusted < -dz;
          const joyAimDown =
            joy.active &&
            joystickConfig.aimMode === 'INCREMENTAL' &&
            joyYAdjusted > dz;

          // Direct 360° Joystick Aim Mode (when enabled in Gear settings):
          // Points crosshair in the direction of the stick and locks when finger is released!
          if (
            joy.active &&
            joystickConfig.aimMode === 'DIRECTIONAL' &&
            joyMag > dz
          ) {
            if (Math.abs(joy.x) > 0.12) {
              activeWorm.facing = joy.x < 0 ? -1 : 1;
            }
            const rawTargetAngle = Math.atan2(
              joyYAdjusted,
              Math.max(0.15, Math.abs(joy.x))
            );
            const clampedTarget = Math.max(
              MIN_AIM_ANGLE,
              Math.min(MAX_AIM_ANGLE, rawTargetAngle)
            );
            const lerpRate = Math.min(0.45, 0.16 * joystickConfig.aimSensitivity);
            activeWorm.aimAngle += (clampedTarget - activeWorm.aimAngle) * lerpRate;
          }

          // Smooth exponential curve for analog intensity so small tilts give fine aim control
          const normWalkTilt = joy.active
            ? Math.max(0, (Math.abs(joy.x) - dz) / Math.max(0.1, 1 - dz))
            : 0;
          const normAimTilt = joy.active
            ? Math.max(0, (Math.abs(joyYAdjusted) - dz) / Math.max(0.1, 1 - dz))
            : 0;

          const joyWalkIntensity = joy.active
            ? Math.min(1.5, Math.max(0.25, Math.pow(normWalkTilt, 1.15))) *
              joystickConfig.walkSensitivity
            : 1.0;
          const joyAimIntensity = joy.active
            ? Math.min(1.85, Math.max(0.15, Math.pow(normAimTilt, 1.35))) *
              joystickConfig.aimSensitivity
            : joystickConfig.aimSensitivity;

          const moveLeft =
            !st.charging &&
            (st.keys['ArrowLeft'] ||
              st.keys['KeyA'] ||
              st.touchMoveDir === -1 ||
              joyMoveLeft);
          const moveRight =
            !st.charging &&
            (st.keys['ArrowRight'] ||
              st.keys['KeyD'] ||
              st.touchMoveDir === 1 ||
              joyMoveRight);
          const aimUp =
            st.keys['ArrowUp'] ||
            (gameplayMode === 'CLASSIC_V1' && st.keys['KeyW']) ||
            st.touchAimDir === -1 ||
            joyAimUp;
          const aimDown =
            st.keys['ArrowDown'] ||
            st.keys['KeyS'] ||
            st.touchAimDir === 1 ||
            joyAimDown;

          // If player moves or aims manually, finish the turn spotlight zoom immediately so they see the full field
          if (moveLeft || moveRight || aimUp || aimDown || joy.active || st.charging) {
            if (st.turnSpotlightTimer > 18) {
              st.turnSpotlightTimer = 18;
            }
          }

          if (gameplayMode === 'CLASSIC_V1') {
            const classicWalkSpeed = 0.88 * (joy.active ? joyWalkIntensity : 1.0);
            const classicAimStep = 0.024 * joyAimIntensity;

            if (moveLeft) {
              activeWorm.facing = -1;
              activeWorm.vx = activeWorm.vx * 0.55 - classicWalkSpeed;
            } else if (moveRight) {
              activeWorm.facing = 1;
              activeWorm.vx = activeWorm.vx * 0.55 + classicWalkSpeed;
            }

            if (aimUp) {
              activeWorm.aimAngle = Math.max(
                MIN_AIM_ANGLE,
                activeWorm.aimAngle - classicAimStep
              );
            } else if (aimDown) {
              activeWorm.aimAngle = Math.min(
                MAX_AIM_ANGLE,
                activeWorm.aimAngle + classicAimStep
              );
            }

            if (st.charging) {
              st.power = Math.min(100, st.power + 1.45);
              setChargePower(Math.round(st.power));
              if (st.power >= 100) {
                fireSelectedWeapon(100);
              }
            }
          } else {
            const modernWalkSpeed = 0.95 * (joy.active ? joyWalkIntensity : 1.0);
            const modernAimStep = 0.026 * joyAimIntensity;

            if (moveLeft || moveRight) {
              const dir = moveLeft ? -1 : 1;
              activeWorm.facing = dir;
              if (activeWorm.stamina > 0) {
                activeWorm.vx = activeWorm.vx * 0.65 + dir * modernWalkSpeed;
                activeWorm.stamina = Math.max(0, activeWorm.stamina - 0.11);
                if (st.tick % 6 === 0) {
                  setActiveStamina(Math.round(activeWorm.stamina));
                }
              }
            }

            if (aimUp) {
              activeWorm.aimAngle = Math.max(
                MIN_AIM_ANGLE,
                activeWorm.aimAngle - modernAimStep
              );
            } else if (aimDown) {
              activeWorm.aimAngle = Math.min(
                MAX_AIM_ANGLE,
                activeWorm.aimAngle + modernAimStep
              );
            } else if (
              mouseAimEnabled &&
              st.lastInputMode === 'MOUSE' &&
              st.mouseCanvasPos &&
              !moveLeft &&
              !moveRight &&
              !joy.active
            ) {
              const dx = st.mouseCanvasPos.x - activeWorm.x;
              const dy = st.mouseCanvasPos.y - (activeWorm.y - 4);
              if (Math.hypot(dx, dy) > 22) {
                activeWorm.facing = dx >= 0 ? 1 : -1;
                const targetAngle = Math.max(
                  MIN_AIM_ANGLE,
                  Math.min(MAX_AIM_ANGLE, Math.atan2(dy, Math.abs(dx)))
                );
                activeWorm.aimAngle += (targetAngle - activeWorm.aimAngle) * 0.25;
              }
            }

            if (st.charging) {
              st.power += st.powerDirection * 1.55;
              if (st.power >= 100) {
                st.power = 100;
                st.powerDirection = -1;
              } else if (st.power <= 15) {
                st.power = 15;
                st.powerDirection = 1;
              }
              if (st.tick % 4 === 0) {
                soundFX.playChargeTick(st.power);
              }
              setChargePower(Math.round(st.power));
            }
          }
        } else {
          // Smart Ballistic Bot AI: simulates candidate arcs to avoid blowing itself up on hills
          st.botThinkingTimer--;
          if (st.botThinkingTimer === 35) {
            const enemies = st.worms.filter(
              (w) => w.isAlive && !w.isLaunchingOut && w.teamId !== activeWorm.teamId
            );
            if (enemies.length > 0) {
              const weapon =
                SPELL_ARSENAL.find((w) => w.id === selectedWeaponId) || SPELL_ARSENAL[0];
              const grav =
                weapon.projectileType === 'glider'
                  ? 0.085
                  : weapon.projectileType === 'heavy_drop'
                  ? 0.34
                  : 0.21;

              let bestScore = Infinity;
              let bestAngle = -0.72;
              let bestPower = 68;
              let bestFacing: 1 | -1 = activeWorm.facing;

              for (const target of enemies) {
                const facingDir: 1 | -1 = target.x >= activeWorm.x ? 1 : -1;
                const candidateAngles = [-1.18, -0.95, -0.78, -0.62, -0.46];
                const candidatePowers = [48, 64, 78, 92];

                for (const candAngle of candidateAngles) {
                  for (const candPower of candidatePowers) {
                    const worldAng =
                      facingDir === 1 ? candAngle : Math.PI - candAngle;
                    const spd = (candPower / 100) * 15.0 + 2.6;
                    let sx = activeWorm.x + Math.cos(worldAng) * 18;
                    let sy = activeWorm.y - 6 + Math.sin(worldAng) * 18;
                    let svx = Math.cos(worldAng) * spd;
                    let svy = Math.sin(worldAng) * spd;
                    let minTargetDist = Infinity;
                    let hitSelfRisk = false;

                    for (let step = 0; step < 85; step++) {
                      svx += st.weather.currentWindX * 0.011 * weapon.windFactor;
                      svy += grav + st.weather.currentWindY * weapon.windFactor;
                      sx += svx;
                      sy += svy;

                      const dToTarget = Math.hypot(sx - target.x, sy - target.y);
                      if (dToTarget < minTargetDist) minTargetDist = dToTarget;

                      if (step > 5 && isPixelSolid(sx, sy)) {
                        if (Math.hypot(sx - activeWorm.x, sy - activeWorm.y) < 55) {
                          hitSelfRisk = true;
                        }
                        break;
                      }
                      if (sx < 0 || sx > CANVAS_W || sy >= WATER_Y) break;
                    }

                    if (!hitSelfRisk && minTargetDist < bestScore) {
                      bestScore = minTargetDist;
                      bestAngle = candAngle;
                      bestPower = candPower;
                      bestFacing = facingDir;
                    }
                  }
                }
              }

              activeWorm.facing = bestFacing;
              activeWorm.aimAngle = Math.max(
                MIN_AIM_ANGLE,
                Math.min(MAX_AIM_ANGLE, bestAngle + (Math.random() - 0.5) * 0.06)
              );
              st.charging = true;
              st.power = Math.min(
                96,
                Math.max(38, Math.round(bestPower + (Math.random() - 0.5) * 8))
              );
              setIsCharging(true);
              setChargePower(Math.round(st.power));
            }
          } else if (st.botThinkingTimer <= 0) {
            fireSelectedWeapon(st.power || 68);
          }
        }
      }

      // 2. Update All Worms Physics (including Out-of-Stage Knockout Launch!)
      let anyWormLaunching = false;
      st.worms.forEach((w) => {
        if (!w.isAlive) return;

        if (w.isLaunchingOut) {
          anyWormLaunching = true;
          w.x += w.vx;
          w.y += w.vy;
          w.vy += 0.22;
          w.launchSpin = (w.launchSpin || 0.1) + (w.vx >= 0 ? 0.44 : -0.44);

          if (st.tick % 2 === 0) {
            const colors = ['#FFD166', '#00F5D4', '#EF476F', '#FFFFFF'];
            for (let k = 0; k < 2; k++) {
              st.particles.push({
                x: w.x + (Math.random() - 0.5) * 10,
                y: w.y + (Math.random() - 0.5) * 10,
                vx: -w.vx * 0.15 + (Math.random() - 0.5) * 2,
                vy: -w.vy * 0.15 + (Math.random() - 0.5) * 2,
                color: colors[(st.tick + k) % colors.length],
                size: k === 0 ? 5 : 3,
                life: 24,
                maxLife: 24,
                gravity: 0.02,
              });
            }
          }

          if (
            w.x < -35 ||
            w.x > CANVAS_W + 35 ||
            w.y < -55 ||
            w.y >= WATER_Y + 15
          ) {
            w.isAlive = false;
            w.isLaunchingOut = false;
            w.hp = 0;
            soundFX.playStarKO();
            st.cameraShake = 16;

            const clampX = Math.max(32, Math.min(CANVAS_W - 32, w.x));
            const clampY = Math.max(32, Math.min(WATER_Y - 12, w.y));

            st.shockwaves.push({
              x: clampX,
              y: clampY,
              radius: 8,
              maxRadius: 85,
              color: '#FFD166',
              alpha: 1.0,
            });
            st.shockwaves.push({
              x: clampX,
              y: clampY,
              radius: 4,
              maxRadius: 52,
              color: '#00F5D4',
              alpha: 1.0,
            });

            for (let s = 0; s < 32; s++) {
              const ang = (s / 32) * Math.PI * 2;
              const spd = 2.5 + (s % 3) * 2.2;
              st.particles.push({
                x: clampX,
                y: clampY,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                color: s % 2 === 0 ? '#FFD166' : '#00F5D4',
                size: s % 3 === 0 ? 6 : 4,
                life: 36,
                maxLife: 36,
                gravity: 0.04,
              });
            }
          }
          return;
        }

        if (w.speechBubble) {
          w.speechBubble.timer--;
          if (w.speechBubble.timer <= 0) w.speechBubble = undefined;
        }

        if (gameplayMode === 'MODERN_V2' && !w.isGrounded) {
          for (const tz of st.thermals) {
            if (
              w.x >= tz.x &&
              w.x <= tz.x + tz.width &&
              w.y >= tz.y &&
              w.y <= tz.y + tz.height
            ) {
              w.vy += tz.liftForce * 0.65;
              w.vx += st.weather.currentWindX * 0.015;
            }
          }
        }

        w.vy += 0.25;
        w.vx *= w.isGrounded ? 0.78 : 0.94;

        const nextX = w.x + w.vx;
        const nextY = w.y + w.vy;

        if (Math.abs(w.vx) > 0.05) {
          const maxClimb = gameplayMode === 'MODERN_V2' ? 10 : 6;
          let climbed = false;
          for (let step = 0; step <= maxClimb; step += 2) {
            if (!isPixelSolid(nextX, w.y - 3 - step)) {
              w.x = Math.max(14, Math.min(CANVAS_W - 14, nextX));
              w.y -= step * 0.65;
              climbed = true;
              break;
            }
          }
          if (!climbed) {
            w.vx = -w.vx * 0.25;
          }
        }

        if (w.vy >= 0) {
          if (isPixelSolid(w.x, nextY + 6)) {
            let surfaceY = Math.floor(nextY);
            while (surfaceY > w.y - 10 && isPixelSolid(w.x, surfaceY + 5)) {
              surfaceY--;
            }
            w.y = surfaceY;
            w.vy = 0;
            w.isGrounded = true;
            w.jumpsUsed = 0;
          } else {
            w.y = nextY;
            w.isGrounded = false;
          }
        } else {
          if (isPixelSolid(w.x, nextY - 10)) {
            w.vy = 0;
          } else {
            w.y = nextY;
          }
        }

        if (w.y >= WATER_Y - 2) {
          w.isAlive = false;
          w.hp = 0;
          soundFX.playSplash();
          st.floatingTexts.push({
            id: `splash-${Date.now()}-${w.id}`,
            x: w.x,
            y: WATER_Y - 16,
            vy: -1.1,
            text: 'AFOGOU NA TINTA!',
            color: '#4CC9F0',
            life: 80,
          });
          for (let s = 0; s < 18; s++) {
            st.particles.push({
              x: w.x,
              y: WATER_Y,
              vx: (Math.random() - 0.5) * 4,
              vy: -2 - Math.random() * 4,
              color: '#00BBF9',
              size: 4,
              life: 30,
              maxLife: 30,
              gravity: 0.2,
            });
          }
          if (w.id === st.activeWormId && st.phase === 'MOVE_AND_AIM') {
            st.phase = 'POST_SHOT';
            st.postShotDelay = 55;
            setTurnPhase('POST_SHOT');
          }
        }
      });

      // 3. Update Supply Crates
      st.crates.forEach((crate) => {
        if (crate.collected) return;
        if (!isPixelSolid(crate.x, crate.y + 8)) {
          crate.vx =
            gameplayMode === 'MODERN_V2' ? st.weather.currentWindX * 0.22 : 0;
          crate.x = Math.max(24, Math.min(CANVAS_W - 24, crate.x + crate.vx));
          crate.y += crate.vy;
          crate.vy = 1.2;
        } else {
          crate.vx = 0;
          crate.vy = 0;
        }
        if (crate.y >= WATER_Y) {
          crate.collected = true;
        }

        st.worms.forEach((w) => {
          if (!w.isAlive || w.isLaunchingOut || crate.collected) return;
          if (Math.hypot(w.x - crate.x, w.y - crate.y) < 24) {
            crate.collected = true;
            soundFX.playLevelUp();
            if (crate.type === 'XP_TOME') {
              awardXp(85, 'Tomo Escolar', crate.x, crate.y);
            } else {
              w.hp = Math.min(w.maxHp + 25, w.hp + 35);
              st.floatingTexts.push({
                id: `heal-${Date.now()}`,
                x: w.x,
                y: w.y - 24,
                vy: -1.0,
                text: '+35 HP (Maçã)',
                color: '#06D6A0',
                life: 70,
              });
            }
          }
        });
      });

      // 4. Update Flying Projectiles
      for (let i = st.projectiles.length - 1; i >= 0; i--) {
        const p = st.projectiles[i];
        const weapon =
          SPELL_ARSENAL.find((w) => w.id === p.weaponId) || SPELL_ARSENAL[0];

        p.age++;
        if (gameplayMode === 'MODERN_V2') {
          p.trailHistory.push({ x: p.x, y: p.y });
          if (p.trailHistory.length > 14) {
            p.trailHistory.shift();
          }
        }

        const baseGravity =
          weapon.projectileType === 'glider'
            ? 0.085
            : weapon.projectileType === 'heavy_drop'
            ? 0.34
            : 0.21;

        p.vx += st.weather.currentWindX * 0.011 * weapon.windFactor;
        p.vy += baseGravity + st.weather.currentWindY * weapon.windFactor;

        if (gameplayMode === 'MODERN_V2') {
          for (const tz of st.thermals) {
            if (
              p.x >= tz.x &&
              p.x <= tz.x + tz.width &&
              p.y >= tz.y &&
              p.y <= tz.y + tz.height
            ) {
              p.vy += tz.liftForce * weapon.windFactor;
              p.vx += tz.swirlForce;
            }
          }
        }

        p.x += p.vx;
        p.y += p.vy;

        if (st.tick % 2 === 0) {
          st.particles.push({
            x: p.x,
            y: p.y,
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.6,
            color: p.isCriticalShot
              ? '#00F5D4'
              : p.age % 4 < 2
              ? p.color
              : p.secondaryColor,
            size: 3,
            life: 16,
            maxLife: 16,
            gravity: 0,
          });
        }

        if (p.x < -50 || p.x > CANVAS_W + 50 || p.y >= WATER_Y) {
          if (p.y >= WATER_Y) soundFX.playSplash();
          st.projectiles.splice(i, 1);
          continue;
        }

        if (p.fuseTimer > 0) {
          p.fuseTimer--;
          if (p.fuseTimer <= 0) {
            triggerDetonation(p);
            st.projectiles.splice(i, 1);
            continue;
          }
        }

        let hitWormId: string | undefined;
        if (p.age > 5 && p.fuseTimer === 0) {
          for (const w of st.worms) {
            // Prevent outgoing projectile from colliding with its own shooter during muzzle exit
            if (w.id === p.shooterId && p.age <= 24) continue;
            if (
              w.isAlive &&
              !w.isLaunchingOut &&
              Math.hypot(w.x - p.x, w.y - p.y) < 16
            ) {
              hitWormId = w.id;
              break;
            }
          }
        }

        // Prevent immediate barrel terrain detonation if shooter is standing on a steep slope
        const shooterWorm = p.shooterId
          ? st.worms.find((w) => w.id === p.shooterId)
          : undefined;
        const isClearingMuzzle =
          p.age <= 5 &&
          shooterWorm &&
          Math.hypot(p.x - shooterWorm.x, p.y - (shooterWorm.y - 4)) < 24 &&
          p.vy < 3.0;

        if (hitWormId || (!isClearingMuzzle && isPixelSolid(p.x, p.y))) {
          if (p.bouncesLeft > 0 && !hitWormId) {
            p.bouncesLeft--;
            p.vy = -p.vy * 0.66;
            p.vx *= 0.82;
            p.y -= 4;
            soundFX.playBounce();
          } else {
            p.directHitWormId = hitWormId;
            triggerDetonation(p);
            st.projectiles.splice(i, 1);
          }
        }
      }

      if (
        st.phase === 'PROJECTILE_FLYING' &&
        st.projectiles.length === 0 &&
        !anyWormLaunching
      ) {
        st.phase = 'POST_SHOT';
        st.postShotDelay = 55;
        setTurnPhase('POST_SHOT');
      } else if (st.phase === 'POST_SHOT') {
        if (!anyWormLaunching) {
          st.postShotDelay--;
          if (st.postShotDelay <= 0) {
            advanceTurn();
          }
        }
      }

      // 5. Update Particles, Shockwaves & Floating Texts
      for (let i = st.particles.length - 1; i >= 0; i--) {
        const pt = st.particles[i];
        if (pt.windAffected) {
          pt.vx += st.weather.currentWindX * 0.006;
        }
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += pt.gravity;
        pt.life--;
        if (pt.life <= 0) st.particles.splice(i, 1);
      }

      for (let i = st.shockwaves.length - 1; i >= 0; i--) {
        const sw = st.shockwaves[i];
        sw.radius += (sw.maxRadius - sw.radius) * 0.22 + 1.2;
        sw.alpha -= 0.06;
        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
          st.shockwaves.splice(i, 1);
        }
      }

      for (let i = st.floatingTexts.length - 1; i >= 0; i--) {
        const ft = st.floatingTexts[i];
        ft.y += ft.vy;
        ft.life--;
        if (ft.life <= 0) st.floatingTexts.splice(i, 1);
      }

      for (let i = st.lightningBolts.length - 1; i >= 0; i--) {
        st.lightningBolts[i].life--;
        if (st.lightningBolts[i].life <= 0) st.lightningBolts.splice(i, 1);
      }

      if (st.tick % 12 === 0) {
        const summary = teams.slice(0, activeTeamCount).map((t, idx) => {
          const teamWorms = st.worms.filter(
            (w) => w.teamId === idx && w.isAlive && !w.isLaunchingOut
          );
          const totalHp = teamWorms.reduce((acc, w) => acc + w.hp, 0);
          return { id: t.id, totalHp, aliveCount: teamWorms.length };
        });
        setTeamHpSummary(summary);
      }

      // ====================================================================
      // TURN SPOTLIGHT CAMERA CHOREOGRAPHY:
      // Zooms in on the active player at the start of the turn to highlight
      // whose turn it is, then rapidly returns to the 1.0x Wide Overview!
      // ====================================================================
      if (!isTitleScreenOpen && st.turnSpotlightTimer > 0) {
        st.turnSpotlightTimer--;
      }

      if (st.turnSpotlightTimer > 24 && activeWorm) {
        // Phase A: Smooth Zoom-In on the Active Worm (2.15x)
        const targetZoom = 2.15;
        st.cameraZoom += (targetZoom - st.cameraZoom) * 0.16;
        const halfViewW = CANVAS_W / (2 * st.cameraZoom);
        const halfViewH = CANVAS_H / (2 * st.cameraZoom);
        const targetX = Math.max(
          halfViewW,
          Math.min(CANVAS_W - halfViewW, activeWorm.x)
        );
        const targetY = Math.max(
          halfViewH,
          Math.min(CANVAS_H - halfViewH, activeWorm.y - 12)
        );
        st.cameraX += (targetX - st.cameraX) * 0.22;
        st.cameraY += (targetY - st.cameraY) * 0.22;
      } else {
        // Phase B: Rapidly return to Wide Shot (Plano Geral 1.0x) so all opponents are visible!
        st.cameraZoom += (1.0 - st.cameraZoom) * 0.22;
        st.cameraX += (CANVAS_W / 2 - st.cameraX) * 0.24;
        st.cameraY += (CANVAS_H / 2 - st.cameraY) * 0.24;
        if (Math.abs(st.cameraZoom - 1.0) < 0.01) {
          st.cameraZoom = 1.0;
          st.cameraX = CANVAS_W / 2;
          st.cameraY = CANVAS_H / 2;
        }
      }

      // ====================================================================
      // 6. RENDER BATTLEFIELD ON DISPLAY CANVAS
      // ====================================================================
      const canvas = displayCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        const biome = BIOMES.find((b) => b.id === selectedBiomeId) || BIOMES[0];

        ctx.save();

        // Apply Turn Spotlight Camera Zoom & Pan
        if (st.cameraZoom > 1.005) {
          ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
          ctx.scale(st.cameraZoom, st.cameraZoom);
          ctx.translate(-st.cameraX, -st.cameraY);
        }

        if (st.cameraShake > 0) {
          const sx = (Math.random() - 0.5) * st.cameraShake;
          const sy = (Math.random() - 0.5) * st.cameraShake;
          ctx.translate(sx, sy);
          st.cameraShake = Math.max(0, st.cameraShake - 1);
        }

        // Sky Gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
        skyGrad.addColorStop(0, biome.skyTop);
        skyGrad.addColorStop(1, biome.skyBottom);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        if (gameplayMode === 'MODERN_V2') {
          drawWindStreamlines(ctx, CANVAS_W, CANVAS_H, st.weather, st.tick);
          drawThermalZones(ctx, st.thermals, st.tick);
        } else {
          ctx.fillStyle = 'rgba(244, 241, 222, 0.14)';
          for (let s = 0; s < 28; s++) {
            const sx = (s * 173) % CANVAS_W;
            const sy = (s * 89) % (CANVAS_H * 0.55);
            ctx.fillRect(sx, sy, 2, 2);
          }
        }

        // Draw Offscreen Destructible Terrain Bitmap
        if (terrainCanvasRef.current) {
          ctx.drawImage(terrainCanvasRef.current, 0, 0);
        }

        // Draw Supply Crates
        st.crates.forEach((c) => {
          if (!c.collected) drawSupplyCrate(ctx, c, st.tick);
        });

        // Draw Aiming Trajectory Preview
        let lockedWormIds = new Set<string>();
        if (
          showTrajectory &&
          st.phase === 'MOVE_AND_AIM' &&
          activeWorm &&
          !currentTeam?.isBot
        ) {
          const weapon =
            SPELL_ARSENAL.find((w) => w.id === selectedWeaponId) || SPELL_ARSENAL[0];
          const worldAngle =
            activeWorm.facing === 1
              ? activeWorm.aimAngle
              : Math.PI - activeWorm.aimAngle;
          const previewPower = st.charging ? Math.max(24, st.power) : 64;
          const speed = (previewPower / 100) * 15.0 + 2.6;
          let simX = activeWorm.x + Math.cos(worldAngle) * 18;
          let simY = activeWorm.y - 6 + Math.sin(worldAngle) * 18;
          let simVx = Math.cos(worldAngle) * speed;
          let simVy = Math.sin(worldAngle) * speed;
          const grav =
            weapon.projectileType === 'glider'
              ? 0.085
              : weapon.projectileType === 'heavy_drop'
              ? 0.34
              : 0.21;

          const maxSteps = gameplayMode === 'MODERN_V2' ? 48 : 32;
          for (let step = 0; step < maxSteps; step++) {
            simVx += st.weather.currentWindX * 0.011 * weapon.windFactor;
            simVy += grav + st.weather.currentWindY * weapon.windFactor;

            if (gameplayMode === 'MODERN_V2') {
              for (const tz of st.thermals) {
                if (
                  simX >= tz.x &&
                  simX <= tz.x + tz.width &&
                  simY >= tz.y &&
                  simY <= tz.y + tz.height
                ) {
                  simVy += tz.liftForce * weapon.windFactor;
                  simVx += tz.swirlForce;
                }
              }
            }

            simX += simVx;
            simY += simVy;

            if (gameplayMode === 'MODERN_V2' || instantKODirectHit) {
              st.worms.forEach((ew) => {
                if (
                  ew.isAlive &&
                  !ew.isLaunchingOut &&
                  ew.id !== activeWorm.id &&
                  Math.hypot(ew.x - simX, ew.y - simY) <= weapon.blastRadius + 14
                ) {
                  lockedWormIds.add(ew.id);
                }
              });
            }

            const isClearingSimMuzzle =
              step <= 5 &&
              Math.hypot(simX - activeWorm.x, simY - (activeWorm.y - 4)) < 24;

            if ((!isClearingSimMuzzle && isPixelSolid(simX, simY)) || simY >= WATER_Y) {
              if (gameplayMode === 'MODERN_V2') {
                ctx.strokeStyle = 'rgba(239, 71, 111, 0.55)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(simX, simY, weapon.blastRadius, 0, Math.PI * 2);
                ctx.stroke();
              }
              break;
            }

            if (step % 2 === 0) {
              const isCrit =
                gameplayMode === 'MODERN_V2' &&
                st.charging &&
                st.power >= 86 &&
                st.power <= 96;
              ctx.fillStyle = isCrit
                ? 'rgba(0, 245, 212, 0.85)'
                : step < 18
                ? 'rgba(255, 209, 102, 0.85)'
                : 'rgba(255, 209, 102, 0.35)';
              ctx.fillRect(Math.round(simX) - 2, Math.round(simY) - 2, 4, 4);
            }
          }
        }

        // Draw Worms
        st.worms.forEach((w) => {
          if (!w.isAlive) return;
          const isTurn = w.id === st.activeWormId && !w.isLaunchingOut;
          const team = teams[w.teamId] || teams[0];

          // Turn Spotlight Halo Ring when camera zooms in at turn start
          if (isTurn && st.turnSpotlightTimer > 15) {
            ctx.save();
            ctx.strokeStyle = '#FFD166';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(
              Math.round(w.x),
              Math.round(w.y - 4),
              22 + Math.sin(st.tick * 0.25) * 4,
              0,
              Math.PI * 2
            );
            ctx.stroke();
            ctx.restore();
          }

          drawPixelWorm(
            ctx,
            w.x,
            w.y,
            w.facing,
            w.aimAngle,
            w.cosmetics,
            isTurn,
            st.tick,
            gameplayMode === 'MODERN_V2' ? w.vy : 0,
            w.isLaunchingOut ? w.launchSpin || 0 : 0
          );

          if (w.isLaunchingOut) return;

          if (isTurn && st.phase === 'MOVE_AND_AIM') {
            drawWormAimHUD(
              ctx,
              w.x,
              w.y,
              w.facing,
              w.aimAngle,
              st.charging,
              st.power,
              gameplayMode === 'MODERN_V2' ? w.stamina : 100
            );

            const arrowBob = Math.floor(Math.sin(st.tick * 0.15) * 4);
            ctx.fillStyle = '#FFD166';
            ctx.fillRect(Math.round(w.x) - 3, Math.round(w.y) - 48 + arrowBob, 6, 8);
            ctx.fillRect(Math.round(w.x) - 6, Math.round(w.y) - 42 + arrowBob, 12, 3);
          }

          if (lockedWormIds.has(w.id)) {
            ctx.strokeStyle = '#EF476F';
            ctx.lineWidth = 2;
            ctx.strokeRect(Math.round(w.x) - 14, Math.round(w.y) - 18, 28, 28);
            ctx.font = 'bold 9px "JetBrains Mono", monospace';
            ctx.fillStyle = '#EF476F';
            ctx.textAlign = 'center';
            ctx.fillText(
              instantKODirectHit ? 'K.O. DIRETO!' : 'ALVO NA MIRA',
              Math.round(w.x),
              Math.round(w.y) + 22
            );
          }

          const labelY = Math.round(w.y) - 31;
          ctx.font = 'bold 10px "Silkscreen", monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#09080E';
          ctx.fillText(w.name, Math.round(w.x) + 1, labelY + 1);
          ctx.fillStyle = team.color;
          ctx.fillText(w.name, Math.round(w.x), labelY);

          const barW = 30;
          const barX = Math.round(w.x) - 15;
          const barY = labelY + 3;
          ctx.fillStyle = '#09080E';
          ctx.fillRect(barX - 1, barY - 1, barW + 2, 5);
          ctx.fillStyle = team.color;
          ctx.fillRect(barX, barY, Math.max(2, Math.round((w.hp / w.maxHp) * barW)), 3);

          if (w.speechBubble) {
            ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
            const textW = ctx.measureText(w.speechBubble.text).width + 12;
            const bx = Math.round(w.x - textW / 2);
            const by = labelY - 22;
            ctx.fillStyle = '#F4F1DE';
            ctx.fillRect(bx, by, textW, 16);
            ctx.strokeStyle = '#0F0E17';
            ctx.strokeRect(bx, by, textW, 16);
            ctx.fillStyle = '#0F0E17';
            ctx.fillText(w.speechBubble.text, Math.round(w.x), by + 11);
          }
        });

        drawShockwaves(ctx, st.shockwaves);

        st.projectiles.forEach((p) => {
          drawPixelProjectile(ctx, p);
          if (p.fuseTimer > 0) {
            const sec = Math.ceil(p.fuseTimer / 60);
            ctx.font = 'bold 11px "JetBrains Mono", monospace';
            ctx.fillStyle = '#FFD166';
            ctx.textAlign = 'center';
            ctx.fillText(`${sec}s`, Math.round(p.x), Math.round(p.y) - 10);
          }
        });

        st.lightningBolts.forEach((bolt) => {
          ctx.strokeStyle = bolt.life % 2 === 0 ? '#FEE440' : '#00F5D4';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(bolt.x, 0);
          for (let ly = 0; ly < bolt.y; ly += 24) {
            ctx.lineTo(bolt.x + (Math.random() - 0.5) * 28, ly);
          }
          ctx.lineTo(bolt.x, bolt.y);
          ctx.stroke();
        });

        st.particles.forEach((pt) => {
          ctx.fillStyle = pt.color;
          ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size, pt.size);
        });

        ctx.fillStyle = biome.waterColor;
        ctx.fillRect(0, WATER_Y, CANVAS_W, CANVAS_H - WATER_Y);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
        for (let wx = 0; wx < CANVAS_W; wx += 16) {
          const waveOffset = Math.floor(
            Math.sin(wx * 0.05 - st.tick * 0.05 * st.weather.currentWindX) * 3.5
          );
          ctx.fillRect(wx, WATER_Y + waveOffset, 10, 3);
        }

        st.floatingTexts.forEach((ft) => {
          ctx.font = 'bold 12px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#09080E';
          ctx.fillText(ft.text, Math.round(ft.x) + 2, Math.round(ft.y) + 2);
          ctx.fillStyle = ft.color;
          ctx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
        });

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(updateAndRender);
    };

    animationFrameId = requestAnimationFrame(updateAndRender);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    isTitleScreenOpen,
    gameplayMode,
    instantKODirectHit,
    joystickConfig,
    teams,
    activeTeamCount,
    selectedBiomeId,
    selectedWeaponId,
    showTrajectory,
    mouseAimEnabled,
    victoryTeam,
    isPixelSolid,
    fireSelectedWeapon,
    triggerDetonation,
    advanceTurn,
    awardXp,
  ]);

  const currentWeapon =
    SPELL_ARSENAL.find((w) => w.id === selectedWeaponId) || SPELL_ARSENAL[0];
  const currentTeam = teams[activeTeamIndex] || teams[0];

  // Convert client screen coordinates to internal 1280x720 world coordinates
  const clientToWorldCoords = (clientX: number, clientY: number) => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return { x: CANVAS_W / 2, y: CANVAS_H / 2 };
    const rect = canvas.getBoundingClientRect();
    const rawX = ((clientX - rect.left) / rect.width) * CANVAS_W;
    const rawY = ((clientY - rect.top) / rect.height) * CANVAS_H;

    const st = engineRef.current;
    if (st.cameraZoom > 1.01) {
      return {
        x: (rawX - CANVAS_W / 2) / st.cameraZoom + st.cameraX,
        y: (rawY - CANVAS_H / 2) / st.cameraZoom + st.cameraY,
      };
    }
    return { x: rawX, y: rawY };
  };

  // Desktop Mouse Aiming & Firing (Strictly isolated to real mouse pointers so touch/mobile never triggers it!)
  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType !== 'mouse') return;
    const st = engineRef.current;
    st.lastInputMode = 'MOUSE';
    st.mouseCanvasPos = clientToWorldCoords(e.clientX, e.clientY);
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const st = engineRef.current;
    if (st.phase !== 'MOVE_AND_AIM' || currentTeam?.isBot) return;
    const activeWorm = st.worms.find((w) => w.id === st.activeWormId && w.isAlive);
    if (!activeWorm) return;

    if (e.pointerType === 'mouse') {
      if (e.button !== 0) return;
      st.lastInputMode = 'MOUSE';
      const worldPt = clientToWorldCoords(e.clientX, e.clientY);
      st.mouseCanvasPos = worldPt;
      const dx = worldPt.x - activeWorm.x;
      const dy = worldPt.y - (activeWorm.y - 4);
      activeWorm.facing = dx >= 0 ? 1 : -1;
      activeWorm.aimAngle = Math.max(
        MIN_AIM_ANGLE,
        Math.min(MAX_AIM_ANGLE, Math.atan2(dy, Math.abs(dx)))
      );

      if (gameplayMode === 'MODERN_V2') {
        st.charging = true;
        st.power = 18;
        st.powerDirection = 1;
        st.turnSpotlightTimer = 0;
        setIsCharging(true);
      }
      return;
    }

    // Touch Aiming on the Battlefield Canvas (Only if explicitly enabled in Gear settings, and ignoring bottom/top HUD zones)
    if (joystickConfig.touchCanvasAim && !st.joystickVector.active) {
      const canvas = displayCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      // Ignore touches near the bottom controls or top bar so thumbs pressing buttons never pull aim down!
      if (
        e.clientY > rect.bottom - 135 ||
        e.clientY < rect.top + 48
      ) {
        return;
      }
      st.lastInputMode = 'CONTROLLER';
      st.mouseCanvasPos = null;
      const worldPt = clientToWorldCoords(e.clientX, e.clientY);
      const dx = worldPt.x - activeWorm.x;
      const dy = worldPt.y - (activeWorm.y - 4);
      if (Math.hypot(dx, dy) > 28) {
        activeWorm.facing = dx >= 0 ? 1 : -1;
        activeWorm.aimAngle = Math.max(
          MIN_AIM_ANGLE,
          Math.min(MAX_AIM_ANGLE, Math.atan2(dy, Math.abs(dx)))
        );
      }
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType !== 'mouse') return;
    const st = engineRef.current;
    if (gameplayMode === 'MODERN_V2' && st.charging && st.phase === 'MOVE_AND_AIM') {
      fireSelectedWeapon(Math.max(24, st.power));
    }
  };

  // Virtual Translucent Analog Joystick Handlers for Mobile/Touch
  const updateJoystickFromPoint = (clientX: number, clientY: number) => {
    const base = joystickBaseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2 - 12;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(maxRadius, dist);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;
    const normX = knobX / maxRadius;
    const normY = knobY / maxRadius;

    // Clear any desktop mouse position so releasing the joystick NEVER pulls or resets the aim!
    engineRef.current.lastInputMode = 'CONTROLLER';
    engineRef.current.mouseCanvasPos = null;
    engineRef.current.joystickVector = { x: normX, y: normY, active: true };
    setJoystickKnob({ x: knobX, y: knobY, active: true });
  };

  const resetJoystick = () => {
    engineRef.current.lastInputMode = 'CONTROLLER';
    engineRef.current.mouseCanvasPos = null;
    engineRef.current.joystickVector = { x: 0, y: 0, active: false };
    setJoystickKnob({ x: 0, y: 0, active: false });
  };

  return (
    <div className="relative w-screen h-dvh overflow-hidden bg-[#0F0E17] select-none flex flex-col">
      {/* ====================================================================
          TOP NAVIGATION BAR (Desktop Only - Hidden on Mobile/Tablet so Canvas is 100% Fullscreen!)
         ==================================================================== */}
      <header className="hidden lg:flex z-20 items-center justify-between gap-6 px-5 py-2.5 bg-[#161426]/95 border-b-2 border-[#3D3859]">
        {/* Zone 1: Brand Title */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setIsTitleScreenOpen(true);
          }}
          className="font-pixel text-xs md:text-sm text-[#FFD166] tracking-tight whitespace-nowrap shrink-0"
        >
          GRIMÓRIO DE GIZ
        </a>

        {/* Zone 2: Concise Single-Line Action Links */}
        <nav className="flex items-center gap-5 text-xs font-medium text-[#A7A9BE] overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setIsTitleScreenOpen(true)}
            className="hover:text-[#FFD166] transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <Layers className="w-3.5 h-3.5" />
            {gameplayMode === 'CLASSIC_V1' ? '1ª Versão' : '2ª Versão'}
          </button>
          <button
            onClick={() => setIsArsenalOpen(true)}
            className="hover:text-[#FFD166] transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Grimório (Nv.{progression.level})
          </button>
          <button
            onClick={() => setIsWardrobeOpen(true)}
            className="hover:text-[#06D6A0] transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <Palette className="w-3.5 h-3.5" />
            Config & Equipes
          </button>
          <button
            onClick={() => setIsGodotModalOpen(true)}
            className="hover:text-[#4CC9F0] transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <Cpu className="w-3.5 h-3.5" />
            Opções & Godot
          </button>
          <button
            onClick={() => setIsJoystickSettingsOpen(true)}
            className="hover:text-[#FFD166] transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
            title="Configurar Sensibilidade do Joystick"
          >
            <Settings className="w-3.5 h-3.5" />
            Joystick
          </button>
          <button
            onClick={() =>
              initMatch(teams, activeTeamCount, selectedBiomeId, gameplayMode)
            }
            className="hover:text-[#F4F1DE] transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Novo Mapa
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action Button */}
        <div className="flex items-center shrink-0">
          <button
            onClick={advanceTurn}
            className="pixel-btn min-h-[38px] bg-[#EF476F] hover:bg-[#D93860] px-3.5 py-1 text-xs font-bold text-[#F4F1DE] border-[#EF476F] flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Passar Turno
          </button>
        </div>
      </header>

      {/* ====================================================================
          MAIN FULL-VIEWPORT PIXEL BATTLEFIELD CANVAS
         ==================================================================== */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <canvas
          ref={displayCanvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onPointerMove={handleCanvasPointerMove}
          onPointerDown={handleCanvasPointerDown}
          onPointerUp={handleCanvasPointerUp}
          className="pixelated w-full h-full object-fill cursor-crosshair touch-none"
        />

        {/* ==================================================================
            TRANSLUCENT TOP BAR OVERLAY FOR MOBILE / LANDSCAPE (< 1024px)
           ================================================================== */}
        <div className="lg:hidden absolute top-2 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
          {/* Left: Translucent Timer + Active Team + Spotlight Replay button */}
          <div className="pointer-events-auto flex items-center gap-2 bg-black/35 backdrop-blur-[2px] border border-white/20 rounded-full px-3 py-1">
            <span
              className="font-mono-num text-sm font-bold"
              style={{ color: turnTimer <= 8 ? '#EF476F' : '#FFD166' }}
            >
              {String(turnTimer).padStart(2, '0')}s
            </span>
            <span className="text-white/30">·</span>
            <button
              onClick={() => {
                // Re-trigger quick spotlight zoom on active worm if tapped!
                engineRef.current.turnSpotlightTimer = SPOTLIGHT_TOTAL_FRAMES;
              }}
              className="font-silk text-[11px] font-bold truncate max-w-[110px]"
              style={{ color: currentTeam?.color }}
              title="Tocar para focar no jogador da vez"
            >
              {currentTeam?.name}
            </button>
          </div>

          {/* Center: Translucent Wind Pill */}
          <div className="pointer-events-none flex items-center gap-1.5 bg-black/35 backdrop-blur-[2px] border border-white/20 rounded-full px-3 py-1 text-[11px] font-mono-num">
            <Wind className="w-3.5 h-3.5 text-[#4CC9F0]" />
            <span
              className="font-bold"
              style={{
                color:
                  hudWeather.currentWindX > 0.3
                    ? '#06D6A0'
                    : hudWeather.currentWindX < -0.3
                    ? '#EF476F'
                    : '#FFD166',
              }}
            >
              {hudWeather.currentWindX > 0
                ? `→ +${hudWeather.currentWindX}`
                : `← ${hudWeather.currentWindX}`}
            </span>
          </div>

          {/* Right: Compact Translucent Utility Icons */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              onClick={() => setIsTitleScreenOpen(true)}
              className="h-8 px-2.5 rounded-full bg-black/35 backdrop-blur-[2px] border border-white/20 text-[10px] font-semibold text-[#FFD166] flex items-center gap-1"
            >
              <Layers className="w-3 h-3" />
              Modo
            </button>
            <button
              onClick={() => setIsJoystickSettingsOpen(true)}
              className="h-8 w-8 rounded-full bg-black/35 backdrop-blur-[2px] border border-white/20 text-[#FFD166] flex items-center justify-center"
              title="Sensibilidade do Joystick"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsWardrobeOpen(true)}
              className="h-8 w-8 rounded-full bg-black/35 backdrop-blur-[2px] border border-white/20 text-[#06D6A0] flex items-center justify-center"
              title="Configurações & Equipes"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={advanceTurn}
              className="h-8 px-2.5 rounded-full bg-[#EF476F]/65 backdrop-blur-[2px] border border-[#EF476F] text-[10px] font-bold text-white flex items-center gap-1"
            >
              <SkipForward className="w-3 h-3" />
              Turno
            </button>
          </div>
        </div>

        {/* ==================================================================
            DESKTOP TOP HUD (Hidden on Mobile so screen stays clean)
           ================================================================== */}
        <div className="hidden lg:flex pointer-events-none absolute top-3 left-4 items-center gap-3">
          <div className="pixel-panel px-3.5 py-2 flex items-center gap-3">
            <div
              className="font-mono-num text-2xl font-bold"
              style={{ color: turnTimer <= 8 ? '#EF476F' : '#FFD166' }}
            >
              {String(turnTimer).padStart(2, '0')}s
            </div>
            <div className="border-l border-[#3D3859] pl-3">
              <div className="text-[10px] font-mono-num text-[#A7A9BE]">
                {instantKODirectHit ? 'K.O. DIRETO · ' : ''}
                {gameplayMode === 'CLASSIC_V1'
                  ? '1ª VERSÃO'
                  : `ENERGIA ${activeStamina}%`}
              </div>
              <div
                className="font-silk text-xs font-bold truncate max-w-[180px]"
                style={{ color: currentTeam?.color }}
              >
                {currentTeam?.name}
              </div>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-2">
            {teams.slice(0, activeTeamCount).map((t, idx) => {
              const stat = teamHpSummary.find((s) => s.id === t.id);
              return (
                <div
                  key={t.id}
                  className={`pixel-panel px-3 py-1.5 text-xs font-mono-num flex items-center gap-2 ${
                    idx === activeTeamIndex ? 'border-[#FFD166]' : ''
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 shrink-0"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="truncate max-w-[110px] text-[#F4F1DE]">{t.name}</span>
                  <span className="text-[#A7A9BE]">·</span>
                  <span style={{ color: t.color }}>{stat ? stat.totalHp : 300} HP</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="hidden lg:flex absolute top-3 right-4 items-center gap-2">
          <div className="pixel-panel px-3.5 py-2 flex items-center gap-3 text-xs font-mono-num">
            <Wind className="w-4 h-4 text-[#4CC9F0] shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-silk text-[11px] font-bold text-[#F4F1DE]">
                  {hudWeather.name.toUpperCase()} ·
                </span>
                <span
                  className="font-bold"
                  style={{
                    color:
                      hudWeather.currentWindX > 0.3
                        ? '#06D6A0'
                        : hudWeather.currentWindX < -0.3
                        ? '#EF476F'
                        : '#FFD166',
                  }}
                >
                  {hudWeather.currentWindX > 0
                    ? `→ +${hudWeather.currentWindX}`
                    : `← ${hudWeather.currentWindX}`}
                </span>
              </div>
              {gameplayMode === 'MODERN_V2' && (
                <div className="mt-1 h-1.5 w-32 bg-[#09080E] border border-[#3D3859] relative overflow-hidden">
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#F4F1DE]/50" />
                  <div
                    className="h-full transition-all duration-100"
                    style={{
                      width: `${Math.min(50, Math.abs(hudWeather.currentWindX) * 6)}%`,
                      marginLeft:
                        hudWeather.currentWindX >= 0
                          ? '50%'
                          : `${Math.max(
                              0,
                              50 - Math.abs(hudWeather.currentWindX) * 6
                            )}%`,
                      backgroundColor:
                        hudWeather.currentWindX >= 0 ? '#06D6A0' : '#EF476F',
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              soundFX.muted = !isMuted;
              setIsMuted(!isMuted);
            }}
            className="pixel-btn min-h-[40px] min-w-[40px] bg-[#1A1829] p-2 text-[#F4F1DE] hover:text-[#FFD166] flex items-center justify-center"
            title={isMuted ? 'Ativar Som 16-Bit' : 'Silenciar Som'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Level Up Celebration Toast */}
        {levelUpBanner && (
          <div className="pointer-events-none absolute top-14 sm:top-16 left-1/2 -translate-x-1/2 z-30 pixel-panel border-[#FFD166] bg-[#241B35] px-4 sm:px-6 py-2.5 text-center animate-bounce w-[90vw] max-w-md">
            <div className="font-pixel text-xs text-[#FFD166]">
              SUBIU PARA O NÍVEL {levelUpBanner.level}!
            </div>
            <div className="mt-1 text-[11px] sm:text-xs text-[#06D6A0] font-semibold">
              Novo título: {levelUpBanner.title} · Novos Feitiços Desbloqueados!
            </div>
          </div>
        )}

        {/* ====================================================================
            MOBILE / TABLET TRANSLUCENT JOYSTICK & ARCADE BUTTONS (< 1024px)
            Zero opaque boxes — clean translucent controls in bottom corners!
           ==================================================================== */}
        <div className="lg:hidden pointer-events-none absolute inset-x-0 bottom-0 p-3 flex items-end justify-between z-20">
          {/* Bottom-Left: Translucent Virtual Thumbstick + Gear Settings Button */}
          <div className="pointer-events-auto flex items-end gap-2">
            <div
              ref={joystickBaseRef}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                updateJoystickFromPoint(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (joystickKnob.active) {
                  updateJoystickFromPoint(e.clientX, e.clientY);
                }
              }}
              onPointerUp={resetJoystick}
              onPointerCancel={resetJoystick}
              className={`relative rounded-full bg-white/10 backdrop-blur-[2px] border-2 border-white/25 flex items-center justify-center touch-none shadow-lg transition-all ${
                joystickConfig.size === 'SM'
                  ? 'w-20 h-20'
                  : joystickConfig.size === 'LG'
                  ? 'w-32 h-32'
                  : 'w-24 h-24 sm:w-28 sm:h-28'
              }`}
            >
              {/* Deadzone visual ring inside Joystick */}
              <div
                className="pointer-events-none absolute rounded-full border border-dashed border-white/15"
                style={{
                  width: `${Math.round(joystickConfig.deadzone * 100)}%`,
                  height: `${Math.round(joystickConfig.deadzone * 100)}%`,
                }}
              />
              {/* Crosshair Axis Guides inside Joystick */}
              <div className="pointer-events-none absolute inset-x-3 h-px bg-white/15" />
              <div className="pointer-events-none absolute inset-y-3 w-px bg-white/15" />
              <span className="pointer-events-none absolute top-1.5 text-[9px] font-mono-num text-white/50">
                MIRA
              </span>
              <span className="pointer-events-none absolute bottom-1.5 text-[9px] font-mono-num text-white/50">
                ANDAR
              </span>

              {/* Movable Translucent Thumb Knob */}
              <div
                className="pointer-events-none w-10 h-10 rounded-full bg-[#FFD166]/65 border-2 border-white shadow-md transition-transform duration-75"
                style={{
                  transform: `translate(${joystickKnob.x}px, ${joystickKnob.y}px)`,
                }}
              />
            </div>

            {/* Dedicated Translucent Gear Button right next to the Joystick */}
            <button
              onClick={() => setIsJoystickSettingsOpen(true)}
              className="w-9 h-9 mb-1 rounded-full bg-black/40 active:bg-black/75 backdrop-blur-[2px] border border-white/25 flex items-center justify-center text-[#FFD166] shadow-md"
              title="Sensibilidade do Joystick"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Center Floating Translucent Power Gauge (Only visible while charging!) */}
          {isCharging && (
            <div className="pointer-events-none mb-6 flex flex-col items-center">
              <div className="px-3 py-1 rounded-full bg-black/55 backdrop-blur-sm border border-white/20 text-xs font-mono-num font-bold text-[#FFD166]">
                {gameplayMode === 'MODERN_V2' &&
                chargePower >= 86 &&
                chargePower <= 96
                  ? `${chargePower}% CRÍTICO!`
                  : `${chargePower}%`}
              </div>
            </div>
          )}

          {/* Bottom-Right: Translucent Circular Arcade Action Cluster */}
          <div className="pointer-events-auto flex items-end gap-2.5 sm:gap-3">
            {/* Spell / Grimório Circular Button */}
            <button
              onClick={() => setIsArsenalOpen(true)}
              className="w-12 h-12 rounded-full bg-[#9B5DE5]/35 active:bg-[#9B5DE5]/70 backdrop-blur-[2px] border-2 border-white/35 flex flex-col items-center justify-center text-white shadow-lg"
              title="Escolher Magia"
            >
              <span className="text-sm leading-none">
                {renderWeaponPixelIcon(currentWeapon.id)}
              </span>
              <span className="text-[8px] font-mono-num font-bold text-[#FFD166] mt-0.5">
                MAGIA
              </span>
            </button>

            {/* Acrobatic Flip Button (Modern V2) */}
            {gameplayMode === 'MODERN_V2' && (
              <button
                onClick={performAcrobaticDash}
                disabled={turnPhase !== 'MOVE_AND_AIM' || currentTeam?.isBot}
                className="w-12 h-12 rounded-full bg-[#4CC9F0]/30 active:bg-[#4CC9F0]/65 backdrop-blur-[2px] border-2 border-[#4CC9F0]/70 flex flex-col items-center justify-center text-white shadow-lg"
              >
                <Zap className="w-4 h-4 text-[#4CC9F0]" />
                <span className="text-[8px] font-mono-num font-bold mt-0.5">
                  MORTAL
                </span>
              </button>
            )}

            {/* Jump / Double Jump Circular Button */}
            <button
              onClick={performJump}
              disabled={turnPhase !== 'MOVE_AND_AIM' || currentTeam?.isBot}
              className="w-13 h-13 rounded-full bg-[#06D6A0]/30 active:bg-[#06D6A0]/65 backdrop-blur-[2px] border-2 border-[#06D6A0]/75 flex flex-col items-center justify-center text-white shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-[#06D6A0]" />
              <span className="text-[9px] font-mono-num font-bold mt-0.5">
                {gameplayMode === 'CLASSIC_V1' ? 'PULO' : 'PULO 2X'}
              </span>
            </button>

            {/* Primary Large Translucent Hold-to-Fire Button */}
            <button
              disabled={turnPhase !== 'MOVE_AND_AIM' || currentTeam?.isBot}
              onPointerDown={(e) => {
                e.preventDefault();
                const st = engineRef.current;
                if (st.phase === 'MOVE_AND_AIM' && !currentTeam?.isBot) {
                  st.charging = true;
                  st.power = 15;
                  st.powerDirection = 1;
                  st.turnSpotlightTimer = 0;
                  setIsCharging(true);
                }
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                const st = engineRef.current;
                if (st.charging) {
                  fireSelectedWeapon(Math.max(20, st.power));
                }
              }}
              onPointerCancel={() => {
                const st = engineRef.current;
                if (st.charging) {
                  fireSelectedWeapon(Math.max(20, st.power));
                }
              }}
              className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#EF476F]/45 active:bg-[#EF476F]/80 backdrop-blur-[2px] border-2 border-[#FFD166] flex flex-col items-center justify-center text-white shadow-xl touch-none"
            >
              <Flame className="w-5 h-5 text-[#FFD166]" />
              <span className="text-[9px] font-mono-num font-bold tracking-tight mt-0.5">
                ATIRAR
              </span>
            </button>
          </div>
        </div>

        {/* ====================================================================
            DESKTOP BOTTOM DOCK (Only visible on Desktop >= 1024px)
           ==================================================================== */}
        <div className="hidden lg:flex absolute bottom-3 left-4 right-4 items-end justify-between gap-3 pointer-events-none">
          {/* Left: Equipped Spell Card */}
          <div className="pointer-events-auto pixel-panel p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 shrink-0 border-2 border-[#F4F1DE]/40 flex items-center justify-center font-pixel text-xs"
                style={{
                  background: `linear-gradient(135deg, ${currentWeapon.color} 50%, ${currentWeapon.secondaryColor} 50%)`,
                }}
              >
                NV{currentWeapon.unlockLevel}
              </div>
              <div>
                <div className="text-[10px] font-mono-num text-[#A7A9BE]">
                  DANO {currentWeapon.damage > 0 ? currentWeapon.damage : 'TP'} ·{' '}
                  {instantKODirectHit ? 'K.O. DIRETO ATIVO' : `RAIO ${currentWeapon.blastRadius}px`}
                </div>
                <div className="font-silk text-xs font-bold text-[#FFD166]">
                  {currentWeapon.name}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsArsenalOpen(true)}
              className="pixel-btn min-h-[40px] bg-[#2C2747] hover:bg-[#3B345E] px-3 py-1.5 text-xs font-semibold text-[#F4F1DE] border-[#FFD166] whitespace-nowrap shrink-0"
            >
              Magias (E)
            </button>
          </div>

          {/* Center: Desktop Power Bar & Controls */}
          <div className="pointer-events-auto pixel-panel p-3 flex flex-col gap-2 flex-1 max-w-xl">
            <div className="flex items-center justify-between text-[11px] font-mono-num gap-2">
              <span className="text-[#A7A9BE]">
                {gameplayMode === 'CLASSIC_V1'
                  ? '1ª Versão: A/D Andar · W/S Mirar · Enter Pular · Espaço Força'
                  : '2ª Versão: Mouse Mira/Atira · A/D Andar · W Pulo Duplo · Q Mortal'}
              </span>
              <span
                className="font-bold shrink-0"
                style={{
                  color:
                    gameplayMode === 'MODERN_V2' &&
                    isCharging &&
                    chargePower >= 86 &&
                    chargePower <= 96
                      ? '#00F5D4'
                      : '#FFD166',
                }}
              >
                {isCharging
                  ? gameplayMode === 'MODERN_V2' &&
                    chargePower >= 86 &&
                    chargePower <= 96
                    ? `${chargePower}% CRÍTICO!`
                    : `FORÇA: ${chargePower}%`
                  : 'SEGURE ESPAÇO OU CLIQUE'}
              </span>
            </div>

            <div className="relative h-3 w-full bg-[#09080E] border border-[#3D3859] overflow-hidden">
              {gameplayMode === 'MODERN_V2' && (
                <div
                  className="absolute top-0 bottom-0 bg-[#00F5D4]/30 border-x border-[#00F5D4]"
                  style={{ left: '86%', width: '10%' }}
                  title="Zona de Disparo Crítico (86% a 96%)"
                />
              )}
              <div
                className="h-full bg-gradient-to-r from-[#06D6A0] via-[#FFD166] to-[#EF476F] transition-all duration-75"
                style={{ width: `${isCharging ? chargePower : 0}%` }}
              />
            </div>
          </div>

          {/* Right: XP & Level Progression Status Card */}
          <div className="pointer-events-auto pixel-panel p-3 hidden xl:flex items-center gap-3">
            <Compass className="w-5 h-5 text-[#06D6A0] shrink-0" />
            <div>
              <div className="text-[10px] font-mono-num text-[#A7A9BE]">
                PROGRESSÃO ESCOLAR · NÍVEL {progression.level}/5
              </div>
              <div className="text-xs font-mono-num text-[#F4F1DE]">
                {progression.xp} XP ·{' '}
                <button
                  onClick={() => setIsArsenalOpen(true)}
                  className="text-[#FFD166] underline hover:text-[#06D6A0]"
                >
                  Desbloqueios
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Victory / End of Match Modal */}
        {victoryTeam && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4">
            <div className="pixel-panel max-w-md w-full p-6 text-center">
              <div className="font-pixel text-base text-[#FFD166]">
                VITÓRIA ACADÊMICA!
              </div>
              <div
                className="mt-3 font-silk text-lg font-bold"
                style={{ color: victoryTeam.color }}
              >
                {victoryTeam.name}
              </div>
              <p className="mt-2 text-xs text-[#A7A9BE]">
                Dominou o quadro-negro e recebeu +120 XP de bônus de progressão!
              </p>
              <div className="mt-4 bg-[#141220] border border-[#3D3859] p-3 text-xs font-mono-num text-[#F4F1DE]">
                Nível Atual: {progression.level} · Total: {progression.xp} XP
              </div>
              <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={() => setIsTitleScreenOpen(true)}
                  className="pixel-btn min-h-[44px] bg-[#252338] px-4 py-2 text-xs font-semibold text-[#FFD166] whitespace-nowrap"
                >
                  Escolher Versão
                </button>
                <button
                  onClick={() =>
                    initMatch(teams, activeTeamCount, selectedBiomeId, gameplayMode)
                  }
                  className="pixel-btn min-h-[44px] bg-[#06D6A0] px-4 py-2 text-xs font-bold text-[#0F0E17] border-[#06D6A0] whitespace-nowrap"
                >
                  Jogar Novamente
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Initial Mode Selection Title Screen */}
      {isTitleScreenOpen && (
        <TitleScreen
          currentMode={gameplayMode}
          progression={progression}
          instantKODirectHit={instantKODirectHit}
          onToggleInstantKO={() => setInstantKODirectHit((v) => !v)}
          onSelectModeAndStart={(chosenMode) => {
            setGameplayMode(chosenMode);
            setIsTitleScreenOpen(false);
            initMatch(teams, activeTeamCount, selectedBiomeId, chosenMode);
          }}
          onOpenWardrobe={() => {
            setIsWardrobeOpen(true);
          }}
        />
      )}

      {/* Modals */}
      <ArsenalModal
        isOpen={isArsenalOpen}
        onClose={() => setIsArsenalOpen(false)}
        selectedWeaponId={selectedWeaponId}
        onSelectWeapon={(id) => setSelectedWeaponId(id)}
        progression={progression}
        currentTeam={currentTeam}
        onGrantStudyXp={() => awardXp(200, 'Estudo do Grimório')}
        onToggleSandboxUnlock={() =>
          setProgression((prev) => ({
            ...prev,
            unlockAllSandbox: !prev.unlockAllSandbox,
          }))
        }
      />

      <WardrobeModal
        isOpen={isWardrobeOpen}
        onClose={() => setIsWardrobeOpen(false)}
        teams={teams}
        activeTeamCount={activeTeamCount}
        selectedBiomeId={selectedBiomeId}
        instantKODirectHit={instantKODirectHit}
        onSaveConfig={(
          updatedTeams,
          newCount,
          newBiome,
          newInstantKO,
          shouldRestart
        ) => {
          setTeams(updatedTeams);
          setActiveTeamCount(newCount);
          setSelectedBiomeId(newBiome);
          setInstantKODirectHit(newInstantKO);
          if (shouldRestart) {
            initMatch(updatedTeams, newCount, newBiome, gameplayMode);
          } else {
            engineRef.current.worms.forEach((w) => {
              const t = updatedTeams[w.teamId];
              if (t) {
                w.cosmetics = { ...t.defaultCosmetics };
              }
            });
          }
        }}
      />

      <GodotBlueprintModal
        isOpen={isWardrobeOpen ? false : isGodotModalOpen}
        onClose={() => setIsGodotModalOpen(false)}
        showTrajectory={showTrajectory}
        onToggleTrajectory={() => setShowTrajectory((v) => !v)}
        highParticles={highParticles}
        onToggleParticles={() => setHighParticles((v) => !v)}
        instantKODirectHit={instantKODirectHit}
        onToggleInstantKO={() => setInstantKODirectHit((v) => !v)}
      />

      {/* ====================================================================
          JOYSTICK SENSITIVITY & CALIBRATION MODAL (Opened via Gear Button)
         ==================================================================== */}
      {isJoystickSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4">
          <div className="pixel-panel w-full max-w-md max-h-[92dvh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 bg-[#242038] border-b-2 border-[#3D3859]">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#FFD166]" />
                <h2 className="font-pixel text-xs text-[#FFD166]">
                  CALIBRAGEM DO JOYSTICK
                </h2>
              </div>
              <button
                onClick={() => setIsJoystickSettingsOpen(false)}
                className="pixel-btn min-h-[34px] min-w-[34px] bg-[#EF476F] p-1.5 text-[#F4F1DE] flex items-center justify-center"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Quick Presets */}
              <div>
                <div className="font-silk font-bold text-[#F4F1DE] mb-1.5">
                  Predefinições Rápidas
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() =>
                      setJoystickConfig((prev) => ({
                        ...prev,
                        aimSensitivity: 0.6,
                        walkSensitivity: 0.8,
                        deadzone: 0.26,
                      }))
                    }
                    className={`pixel-btn py-2 px-2 text-center font-mono-num text-[11px] ${
                      Math.abs(joystickConfig.aimSensitivity - 0.6) < 0.05
                        ? 'bg-[#06D6A0] text-[#0F0E17] font-bold border-[#06D6A0]'
                        : 'bg-[#141220] text-[#F4F1DE]'
                    }`}
                  >
                    Preciso (60%)
                  </button>
                  <button
                    onClick={() =>
                      setJoystickConfig((prev) => ({
                        ...prev,
                        aimSensitivity: 1.0,
                        walkSensitivity: 1.0,
                        deadzone: 0.22,
                      }))
                    }
                    className={`pixel-btn py-2 px-2 text-center font-mono-num text-[11px] ${
                      Math.abs(joystickConfig.aimSensitivity - 1.0) < 0.05 &&
                      Math.abs(joystickConfig.walkSensitivity - 1.0) < 0.05
                        ? 'bg-[#FFD166] text-[#0F0E17] font-bold border-[#FFD166]'
                        : 'bg-[#141220] text-[#F4F1DE]'
                    }`}
                  >
                    Padrão (100%)
                  </button>
                  <button
                    onClick={() =>
                      setJoystickConfig((prev) => ({
                        ...prev,
                        aimSensitivity: 1.6,
                        walkSensitivity: 1.35,
                        deadzone: 0.14,
                      }))
                    }
                    className={`pixel-btn py-2 px-2 text-center font-mono-num text-[11px] ${
                      Math.abs(joystickConfig.aimSensitivity - 1.6) < 0.05
                        ? 'bg-[#4CC9F0] text-[#0F0E17] font-bold border-[#4CC9F0]'
                        : 'bg-[#141220] text-[#F4F1DE]'
                    }`}
                  >
                    Ágil (160%)
                  </button>
                </div>
              </div>

              {/* Aim Mode Selector: Incremental (Lock on release) vs 360 Directional */}
              <div className="bg-[#141220] border border-[#3D3859] p-3 space-y-2">
                <div className="font-silk font-bold text-[#FFD166]">
                  Comportamento da Mira no Analógico
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      setJoystickConfig((prev) => ({
                        ...prev,
                        aimMode: 'INCREMENTAL',
                      }))
                    }
                    className={`pixel-btn p-2 text-left ${
                      joystickConfig.aimMode === 'INCREMENTAL'
                        ? 'bg-[#2A1D3D] border-[#FFD166] text-[#FFD166]'
                        : 'bg-[#1D1A2F] text-[#A7A9BE]'
                    }`}
                  >
                    <div className="font-silk text-[11px] font-bold">
                      Incremental (Trava)
                    </div>
                    <div className="text-[10px] text-[#F4F1DE]/80 mt-0.5">
                      Sobe/desce o ângulo e trava onde parar ao soltar o dedo
                    </div>
                  </button>
                  <button
                    onClick={() =>
                      setJoystickConfig((prev) => ({
                        ...prev,
                        aimMode: 'DIRECTIONAL',
                      }))
                    }
                    className={`pixel-btn p-2 text-left ${
                      joystickConfig.aimMode === 'DIRECTIONAL'
                        ? 'bg-[#172B2E] border-[#06D6A0] text-[#06D6A0]'
                        : 'bg-[#1D1A2F] text-[#A7A9BE]'
                    }`}
                  >
                    <div className="font-silk text-[11px] font-bold">
                      Direcional 360°
                    </div>
                    <div className="text-[10px] text-[#F4F1DE]/80 mt-0.5">
                      Aponta na direção do analógico e mantém ao soltar
                    </div>
                  </button>
                </div>
              </div>

              {/* Vertical Aim Sensitivity Slider */}
              <div className="bg-[#141220] border border-[#3D3859] p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-silk font-bold text-[#FFD166]">
                    Sensibilidade da Mira (Vertical)
                  </span>
                  <span className="font-mono-num font-bold text-[#06D6A0]">
                    {Math.round(joystickConfig.aimSensitivity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={25}
                  max={250}
                  step={5}
                  value={Math.round(joystickConfig.aimSensitivity * 100)}
                  onChange={(e) =>
                    setJoystickConfig((prev) => ({
                      ...prev,
                      aimSensitivity: Number(e.target.value) / 100,
                    }))
                  }
                  className="w-full accent-[#FFD166] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono-num text-[#A7A9BE]">
                  <span>25% (Mais Fina)</span>
                  <span>100%</span>
                  <span>250% (Mais Rápida)</span>
                </div>
              </div>

              {/* Horizontal Walk Sensitivity Slider */}
              <div className="bg-[#141220] border border-[#3D3859] p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-silk font-bold text-[#4CC9F0]">
                    Sensibilidade de Caminhada (Horizontal)
                  </span>
                  <span className="font-mono-num font-bold text-[#4CC9F0]">
                    {Math.round(joystickConfig.walkSensitivity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={200}
                  step={5}
                  value={Math.round(joystickConfig.walkSensitivity * 100)}
                  onChange={(e) =>
                    setJoystickConfig((prev) => ({
                      ...prev,
                      walkSensitivity: Number(e.target.value) / 100,
                    }))
                  }
                  className="w-full accent-[#4CC9F0] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono-num text-[#A7A9BE]">
                  <span>40% (Passos Curtos)</span>
                  <span>100%</span>
                  <span>200% (Passos Rápidos)</span>
                </div>
              </div>

              {/* Deadzone Slider */}
              <div className="bg-[#141220] border border-[#3D3859] p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-silk font-bold text-[#F4F1DE]">
                    Zona Morta Central (Deadzone)
                  </span>
                  <span className="font-mono-num font-bold text-[#FFD166]">
                    {Math.round(joystickConfig.deadzone * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={45}
                  step={2}
                  value={Math.round(joystickConfig.deadzone * 100)}
                  onChange={(e) =>
                    setJoystickConfig((prev) => ({
                      ...prev,
                      deadzone: Number(e.target.value) / 100,
                    }))
                  }
                  className="w-full accent-[#06D6A0] cursor-pointer"
                />
                <p className="text-[10px] text-[#A7A9BE]">
                  Evita que o personagem ande sem querer enquanto você ajusta apenas a mira vertical.
                </p>
              </div>

              {/* Joystick Size Selector */}
              <div className="bg-[#141220] border border-[#3D3859] p-3 space-y-2">
                <div className="font-silk font-bold text-[#F4F1DE]">
                  Tamanho do Analógico na Tela
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'SM', label: 'Compacto' },
                      { id: 'MD', label: 'Médio' },
                      { id: 'LG', label: 'Grande' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() =>
                        setJoystickConfig((prev) => ({ ...prev, size: opt.id }))
                      }
                      className={`pixel-btn py-1.5 text-[11px] font-mono-num ${
                        joystickConfig.size === opt.id
                          ? 'bg-[#9B5DE5] text-white font-bold border-[#FFD166]'
                          : 'bg-[#1D1A2F] text-[#A7A9BE]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extra Toggles: Invert Y & Touch Canvas Aim */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    setJoystickConfig((prev) => ({
                      ...prev,
                      invertY: !prev.invertY,
                    }))
                  }
                  className={`pixel-btn p-2.5 text-left flex items-center justify-between ${
                    joystickConfig.invertY
                      ? 'bg-[#2A1D3D] border-[#FFD166]'
                      : 'bg-[#141220] border-[#3D3859]'
                  }`}
                >
                  <div>
                    <div className="font-silk text-[11px] font-bold text-[#F4F1DE]">
                      Inverter Eixo Y
                    </div>
                    <div className="text-[10px] text-[#A7A9BE]">
                      Tipo manche de avião
                    </div>
                  </div>
                  <span
                    className={`font-mono-num text-[10px] font-bold px-2 py-0.5 ${
                      joystickConfig.invertY
                        ? 'bg-[#FFD166] text-[#0F0E17]'
                        : 'bg-[#242038] text-[#A7A9BE]'
                    }`}
                  >
                    {joystickConfig.invertY ? 'ATIVO' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() =>
                    setJoystickConfig((prev) => ({
                      ...prev,
                      touchCanvasAim: !prev.touchCanvasAim,
                    }))
                  }
                  className={`pixel-btn p-2.5 text-left flex items-center justify-between ${
                    joystickConfig.touchCanvasAim
                      ? 'bg-[#172B2E] border-[#06D6A0]'
                      : 'bg-[#141220] border-[#3D3859]'
                  }`}
                >
                  <div>
                    <div className="font-silk text-[11px] font-bold text-[#F4F1DE]">
                      Toque no Cenário
                    </div>
                    <div className="text-[10px] text-[#A7A9BE]">
                      Mirar ao tocar na tela
                    </div>
                  </div>
                  <span
                    className={`font-mono-num text-[10px] font-bold px-2 py-0.5 ${
                      joystickConfig.touchCanvasAim
                        ? 'bg-[#06D6A0] text-[#0F0E17]'
                        : 'bg-[#242038] text-[#A7A9BE]'
                    }`}
                  >
                    {joystickConfig.touchCanvasAim ? 'ATIVO' : 'OFF'}
                  </span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-[#1A1829] border-t-2 border-[#3D3859] flex items-center justify-between gap-2">
              <button
                onClick={() => setJoystickConfig(DEFAULT_JOYSTICK_CONFIG)}
                className="pixel-btn min-h-[38px] bg-[#242038] px-3 py-1.5 text-xs text-[#A7A9BE] hover:text-[#F4F1DE]"
              >
                Restaurar Padrão
              </button>
              <button
                onClick={() => setIsJoystickSettingsOpen(false)}
                className="pixel-btn min-h-[38px] bg-[#06D6A0] px-5 py-1.5 text-xs font-bold text-[#0F0E17] border-[#06D6A0]"
              >
                Pronto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
