import React, { useEffect, useRef, useState } from 'react';
import { Bot, Check, Flame, User, Users, X } from 'lucide-react';
import {
  BIOMES,
  GLASSES_OPTIONS,
  HAT_OPTIONS,
  SKIN_OPTIONS,
  WAND_OPTIONS,
} from '../data/arsenal';
import { BiomeId, TeamConfig, WormCosmetics } from '../types/game';
import { drawPixelWorm } from '../utils/pixelArtRenderer';

interface WardrobeModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: TeamConfig[];
  activeTeamCount: number;
  selectedBiomeId: BiomeId;
  instantKODirectHit: boolean;
  onSaveConfig: (
    updatedTeams: TeamConfig[],
    newTeamCount: number,
    newBiomeId: BiomeId,
    newInstantKODirectHit: boolean,
    restartMatch: boolean
  ) => void;
}

export const WardrobeModal: React.FC<WardrobeModalProps> = ({
  isOpen,
  onClose,
  teams,
  activeTeamCount,
  selectedBiomeId,
  instantKODirectHit,
  onSaveConfig,
}) => {
  const [draftTeams, setDraftTeams] = useState<TeamConfig[]>(teams);
  const [teamCount, setTeamCount] = useState<number>(activeTeamCount);
  const [biomeId, setBiomeId] = useState<BiomeId>(selectedBiomeId);
  const [koDirectHit, setKoDirectHit] = useState<boolean>(instantKODirectHit);
  const [editingTeamIdx, setEditingTeamIdx] = useState<number>(0);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraftTeams(JSON.parse(JSON.stringify(teams)));
      setTeamCount(activeTeamCount);
      setBiomeId(selectedBiomeId);
      setKoDirectHit(instantKODirectHit);
    }
  }, [isOpen, teams, activeTeamCount, selectedBiomeId, instantKODirectHit]);

  const currentTeam = draftTeams[editingTeamIdx] || draftTeams[0];

  useEffect(() => {
    if (!isOpen || !previewCanvasRef.current || !currentTeam) return;
    let animId = 0;
    let tick = 0;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderPreview = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#141220';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#2D6A4F';
      ctx.fillRect(16, 66, canvas.width - 32, 14);
      ctx.fillStyle = '#52B788';
      ctx.fillRect(16, 62, canvas.width - 32, 5);

      ctx.save();
      ctx.scale(2.4, 2.4);
      drawPixelWorm(
        ctx,
        29,
        22,
        1,
        -0.25 + Math.sin(tick * 0.05) * 0.15,
        currentTeam.defaultCosmetics,
        true,
        tick
      );
      ctx.restore();

      animId = requestAnimationFrame(renderPreview);
    };

    animId = requestAnimationFrame(renderPreview);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, currentTeam]);

  if (!isOpen) return null;

  const updateCurrentTeam = (patch: Partial<TeamConfig>) => {
    setDraftTeams((prev) =>
      prev.map((t, i) => (i === editingTeamIdx ? { ...t, ...patch } : t))
    );
  };

  const updateCosmetics = (patch: Partial<WormCosmetics>) => {
    updateCurrentTeam({
      defaultCosmetics: {
        ...currentTeam.defaultCosmetics,
        ...patch,
      },
    });
  };

  const updateWormName = (wormIdx: 0 | 1 | 2, value: string) => {
    const names = [...currentTeam.wormNames] as [string, string, string];
    names[wormIdx] = value;
    updateCurrentTeam({ wormNames: names });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4">
      <div className="pixel-panel w-full max-w-4xl p-4 sm:p-6 text-[#F4F1DE] max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b-2 border-[#3D3859] pb-3 sm:pb-4">
          <div>
            <h2 className="font-pixel text-xs sm:text-base md:text-lg text-[#FFD166]">
              VESTIÁRIO, EQUIPES & REGRAS
            </h2>
            <p className="mt-1 text-[11px] sm:text-xs text-[#A7A9BE]">
              Personalize personagens, equipes locais/bots e regras de eliminação da partida.
            </p>
          </div>
          <button
            onClick={onClose}
            className="pixel-btn min-h-[44px] bg-[#252338] px-3.5 py-2 text-xs font-semibold text-[#F4F1DE] hover:bg-[#322F4B] flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <X className="w-4 h-4" />
            Fechar
          </button>
        </div>

        {/* Top Match Settings: Number of Teams, Biome & Direct-Hit KO Rule */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#141220] border-2 border-[#2E2A44] p-3.5 sm:p-4">
          {/* 1. Team Count */}
          <div>
            <label className="block text-[11px] font-silk text-[#A7A9BE] mb-2">
              EQUIPES NA PARTIDA
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setTeamCount(num);
                    if (editingTeamIdx >= num) setEditingTeamIdx(0);
                  }}
                  className={`pixel-btn min-h-[44px] px-2.5 py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    teamCount === num
                      ? 'bg-[#FFD166] text-[#0F0E17] border-[#FFD166]'
                      : 'bg-[#1F1D30] text-[#F4F1DE]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  {num} Eq.
                </button>
              ))}
            </div>
          </div>

          {/* 2. Direct-Hit Elimination Rule (Default: Off) */}
          <div>
            <label className="block text-[11px] font-silk text-[#A7A9BE] mb-2">
              ELIMINAÇÃO AO ACERTAR OPONENTE
            </label>
            <button
              onClick={() => setKoDirectHit((v) => !v)}
              className={`pixel-btn min-h-[44px] w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between gap-2 ${
                koDirectHit
                  ? 'bg-[#EF476F] text-[#F4F1DE] border-[#FFD166]'
                  : 'bg-[#1F1D30] text-[#A7A9BE] hover:text-[#F4F1DE]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Flame className="w-4 h-4 shrink-0 text-[#FFD166]" />
                <div className="truncate">
                  <div className="font-bold">
                    {koDirectHit ? 'ATIVADA: K.O. Fora do Cenário!' : 'PADRÃO: Dano por HP'}
                  </div>
                  <div className="text-[10px] opacity-85 truncate">
                    {koDirectHit
                      ? 'Acerto direto arremessa para fora do mapa'
                      : 'Não elimina de imediato (reduz barra de HP)'}
                  </div>
                </div>
              </div>
              <span className="font-mono-num text-[11px] px-1.5 py-0.5 bg-black/30 shrink-0">
                {koDirectHit ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>

          {/* 3. Map Biome */}
          <div>
            <label className="block text-[11px] font-silk text-[#A7A9BE] mb-2">
              CENÁRIO / BIOMA DESTRUTÍVEL
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {BIOMES.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBiomeId(b.id)}
                  className={`min-h-[38px] px-2.5 py-1 text-left text-[11px] border transition-colors truncate ${
                    biomeId === b.id
                      ? 'bg-[#2C2747] border-[#06D6A0] text-[#06D6A0] font-semibold'
                      : 'bg-[#1F1D30] border-[#3D3859] text-[#A7A9BE] hover:text-[#F4F1DE]'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Team Selector Tabs */}
        <div className="mt-4 flex items-center gap-2 border-b-2 border-[#2E2A44] pb-3 overflow-x-auto">
          {draftTeams.slice(0, teamCount).map((team, idx) => (
            <button
              key={team.id}
              onClick={() => setEditingTeamIdx(idx)}
              className={`pixel-btn min-h-[44px] px-3 py-2 text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 ${
                editingTeamIdx === idx
                  ? 'bg-[#2C2747] border-[#FFD166] text-[#FFD166]'
                  : 'bg-[#1B192B] text-[#A7A9BE] hover:text-[#F4F1DE]'
              }`}
            >
              <span
                className="w-3 h-3 border border-white/40 shrink-0"
                style={{ backgroundColor: team.color }}
              />
              <span>{team.name}</span>
              <span className="text-[10px] opacity-80">
                ({team.isBot ? 'BOT' : 'HUMANO'})
              </span>
            </button>
          ))}
        </div>

        {/* Selected Team Aesthetic & Roster Editor */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Column 1: Live Pixel Sprite Preview & Team Control */}
          <div className="bg-[#141220] border-2 border-[#2E2A44] p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-[#A7A9BE] mb-2">
                <span className="font-silk">PRÉVIA PIXEL ART 16-BIT</span>
                <span style={{ color: currentTeam.color }}>{currentTeam.badgeText}</span>
              </div>
              <div className="flex justify-center bg-[#09080E] border-2 border-[#3D3859] p-2">
                <canvas
                  ref={previewCanvasRef}
                  width={140}
                  height={92}
                  className="pixelated w-[190px] h-[125px]"
                />
              </div>

              <div className="mt-3">
                <label className="block text-xs text-[#A7A9BE] mb-1">Nome da Equipe</label>
                <input
                  type="text"
                  maxLength={22}
                  value={currentTeam.name}
                  onChange={(e) => updateCurrentTeam({ name: e.target.value })}
                  className="w-full min-h-[42px] bg-[#09080E] border-2 border-[#3D3859] px-3 py-1.5 text-xs text-[#F4F1DE] focus:border-[#FFD166] outline-none"
                />
              </div>

              <div className="mt-3">
                <label className="block text-xs text-[#A7A9BE] mb-1">Controlador do Turno</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateCurrentTeam({ isBot: false })}
                    className={`pixel-btn min-h-[44px] px-3 py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      !currentTeam.isBot
                        ? 'bg-[#06D6A0] text-[#0F0E17] border-[#06D6A0]'
                        : 'bg-[#1F1D30] text-[#A7A9BE]'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    Humano Local
                  </button>
                  <button
                    onClick={() => updateCurrentTeam({ isBot: true })}
                    className={`pixel-btn min-h-[44px] px-3 py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      currentTeam.isBot
                        ? 'bg-[#FFD166] text-[#0F0E17] border-[#FFD166]'
                        : 'bg-[#1F1D30] text-[#A7A9BE]'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    Bot IA
                  </button>
                </div>
              </div>
            </div>

            {/* Worm Individual Names */}
            <div className="mt-4 pt-3 border-t border-[#2E2A44]">
              <label className="block text-xs text-[#A7A9BE] mb-2">
                Nomes das 3 Minhocas da Equipe
              </label>
              <div className="space-y-2">
                {[0, 1, 2].map((wIdx) => (
                  <input
                    key={wIdx}
                    type="text"
                    maxLength={16}
                    value={currentTeam.wormNames[wIdx as 0 | 1 | 2]}
                    onChange={(e) =>
                      updateWormName(wIdx as 0 | 1 | 2, e.target.value)
                    }
                    className="w-full min-h-[38px] bg-[#09080E] border border-[#3D3859] px-2.5 py-1 text-xs text-[#F4F1DE] focus:border-[#FFD166] outline-none"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Column 2 & 3: Aesthetic Options (Skin, Hat, Glasses, Wand) */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Skin Color */}
            <div className="bg-[#141220] border-2 border-[#2E2A44] p-4">
              <h3 className="font-silk text-xs font-bold text-[#FFD166] mb-2.5">
                1. COR DE PELE / ESSÊNCIA PIXEL
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {SKIN_OPTIONS.map((skin) => (
                  <button
                    key={skin.id}
                    onClick={() => updateCosmetics({ skin: skin.id })}
                    className={`min-h-[42px] p-2 text-left text-xs border flex items-center gap-2 ${
                      currentTeam.defaultCosmetics.skin === skin.id
                        ? 'bg-[#2C2747] border-[#FFD166] text-[#F4F1DE] font-semibold'
                        : 'bg-[#1B192B] border-[#3D3859] text-[#A7A9BE]'
                    }`}
                  >
                    <span
                      className="w-4 h-4 shrink-0 border border-black/40"
                      style={{ backgroundColor: skin.primary }}
                    />
                    <span className="truncate">{skin.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hat / Headgear */}
            <div className="bg-[#141220] border-2 border-[#2E2A44] p-4">
              <h3 className="font-silk text-xs font-bold text-[#FFD166] mb-2.5">
                2. CHAPÉU / INSÍGNIA DE CABEÇA
              </h3>
              <div className="grid grid-cols-1 gap-1.5">
                {HAT_OPTIONS.map((hat) => (
                  <button
                    key={hat.id}
                    onClick={() => updateCosmetics({ hat: hat.id })}
                    className={`min-h-[40px] px-3 py-1.5 text-left text-xs border flex items-center justify-between ${
                      currentTeam.defaultCosmetics.hat === hat.id
                        ? 'bg-[#2C2747] border-[#FFD166] text-[#F4F1DE] font-semibold'
                        : 'bg-[#1B192B] border-[#3D3859] text-[#A7A9BE]'
                    }`}
                  >
                    <span>{hat.name}</span>
                    {currentTeam.defaultCosmetics.hat === hat.id && (
                      <Check className="w-3.5 h-3.5 text-[#FFD166]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Glasses */}
            <div className="bg-[#141220] border-2 border-[#2E2A44] p-4">
              <h3 className="font-silk text-xs font-bold text-[#FFD166] mb-2.5">
                3. ÓCULOS ACADÊMICOS
              </h3>
              <div className="grid grid-cols-1 gap-1.5">
                {GLASSES_OPTIONS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => updateCosmetics({ glasses: g.id })}
                    className={`min-h-[40px] px-3 py-1.5 text-left text-xs border flex items-center justify-between ${
                      currentTeam.defaultCosmetics.glasses === g.id
                        ? 'bg-[#2C2747] border-[#FFD166] text-[#F4F1DE] font-semibold'
                        : 'bg-[#1B192B] border-[#3D3859] text-[#A7A9BE]'
                    }`}
                  >
                    <span>{g.name}</span>
                    {currentTeam.defaultCosmetics.glasses === g.id && (
                      <Check className="w-3.5 h-3.5 text-[#FFD166]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Wand / School Focus */}
            <div className="bg-[#141220] border-2 border-[#2E2A44] p-4">
              <h3 className="font-silk text-xs font-bold text-[#FFD166] mb-2.5">
                4. VARINHA / OBJETO ESCOLAR
              </h3>
              <div className="grid grid-cols-1 gap-1.5">
                {WAND_OPTIONS.map((wand) => (
                  <button
                    key={wand.id}
                    onClick={() => updateCosmetics({ wand: wand.id })}
                    className={`min-h-[40px] px-3 py-1.5 text-left text-xs border flex items-center justify-between ${
                      currentTeam.defaultCosmetics.wand === wand.id
                        ? 'bg-[#2C2747] border-[#FFD166] text-[#F4F1DE] font-semibold'
                        : 'bg-[#1B192B] border-[#3D3859] text-[#A7A9BE]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-3 h-3 shrink-0"
                        style={{ backgroundColor: wand.color }}
                      />
                      <span className="truncate">{wand.name}</span>
                    </div>
                    {currentTeam.defaultCosmetics.wand === wand.id && (
                      <Check className="w-3.5 h-3.5 text-[#FFD166]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t-2 border-[#3D3859] flex flex-wrap items-center justify-end gap-3">
          <button
            onClick={() => {
              onSaveConfig(draftTeams, teamCount, biomeId, koDirectHit, false);
              onClose();
            }}
            className="pixel-btn min-h-[44px] bg-[#252338] hover:bg-[#322F4B] px-4 py-2 text-xs font-semibold text-[#F4F1DE] whitespace-nowrap shrink-0"
          >
            Aplicar na Partida Atual
          </button>
          <button
            onClick={() => {
              onSaveConfig(draftTeams, teamCount, biomeId, koDirectHit, true);
              onClose();
            }}
            className="pixel-btn min-h-[44px] bg-[#06D6A0] hover:bg-[#05B586] px-4 py-2 text-xs font-bold text-[#0F0E17] border-[#06D6A0] whitespace-nowrap shrink-0"
          >
            Salvar e Gerar Novo Mapa
          </button>
        </div>
      </div>
    </div>
  );
};
