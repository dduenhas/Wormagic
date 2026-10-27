import React, { useEffect, useRef } from 'react';
import {
  Bot,
  Compass,
  Flame,
  GraduationCap,
  Palette,
  Play,
  Sparkles,
  Users,
  Wind,
} from 'lucide-react';
import { GameplayMode, PlayerProgression } from '../types/game';
import { drawPixelWorm, drawWindStreamlines } from '../utils/pixelArtRenderer';

export type OpponentMatchMode = 'PLAYER_VS_CPU' | 'LOCAL_MULTIPLAYER';

interface TitleScreenProps {
  currentMode: GameplayMode;
  opponentMode: OpponentMatchMode;
  onChangeOpponentMode: (mode: OpponentMatchMode) => void;
  progression: PlayerProgression;
  instantKODirectHit: boolean;
  onToggleInstantKO: () => void;
  onSelectModeAndStart: (mode: GameplayMode, opponentOverride?: OpponentMatchMode) => void;
  onOpenWardrobe: () => void;
  onOpenPedagogical: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  currentMode,
  opponentMode,
  onChangeOpponentMode,
  progression,
  instantKODirectHit,
  onToggleInstantKO,
  onSelectModeAndStart,
  onOpenWardrobe,
  onOpenPedagogical,
}) => {
  const classicCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const modernCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId = 0;
    let tick = 0;

    const renderCharacterStages = () => {
      tick++;

      // 1. Render Classic V1 Character Stage (Pitágoras - Tradicional 1995)
      const cCanvas = classicCanvasRef.current;
      const cCtx = cCanvas?.getContext('2d');
      if (cCanvas && cCtx) {
        cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);

        const bgGrad = cCtx.createLinearGradient(0, 0, 0, cCanvas.height);
        bgGrad.addColorStop(0, '#12111E');
        bgGrad.addColorStop(1, '#1E1D32');
        cCtx.fillStyle = bgGrad;
        cCtx.fillRect(0, 0, cCanvas.width, cCanvas.height);

        cCtx.fillStyle = '#2D6A4F';
        cCtx.fillRect(24, 96, cCanvas.width - 48, 24);
        cCtx.fillStyle = '#52B788';
        cCtx.fillRect(24, 90, cCanvas.width - 48, 6);

        cCtx.fillStyle = '#FFD166';
        cCtx.font = 'bold 9px "JetBrains Mono", monospace';
        cCtx.fillText('VENTO FIXO: +1.5', 14, 20);

        cCtx.save();
        cCtx.scale(2.8, 2.8);
        drawPixelWorm(
          cCtx,
          36,
          29,
          1,
          -0.4,
          {
            skin: 'classic_pink',
            hat: 'grad_cap',
            glasses: 'round_nerd',
            wand: 'hb_pencil',
          },
          true,
          tick,
          0
        );
        cCtx.restore();
      }

      // 2. Render Modern V2 Character Stage (Arquimedes - Dinâmico & Acrobático)
      const mCanvas = modernCanvasRef.current;
      const mCtx = mCanvas?.getContext('2d');
      if (mCanvas && mCtx) {
        mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);

        const bgGrad = mCtx.createLinearGradient(0, 0, 0, mCanvas.height);
        bgGrad.addColorStop(0, '#101828');
        bgGrad.addColorStop(1, '#1D2939');
        mCtx.fillStyle = bgGrad;
        mCtx.fillRect(0, 0, mCanvas.width, mCanvas.height);

        drawWindStreamlines(
          mCtx,
          mCanvas.width,
          mCanvas.height,
          {
            conditionId: 'UPDRAFT_THERMAL',
            name: 'Corrente Ascendente',
            description: '',
            baseWindX: 3.4,
            currentWindX: 3.4 + Math.sin(tick * 0.05) * 1.5,
            currentWindY: -0.05,
            gustPhase: tick * 0.05,
            gustAmplitude: 1.5,
            gustFrequency: 0.05,
          },
          tick
        );

        const tGrad = mCtx.createLinearGradient(0, mCanvas.height, 0, 20);
        tGrad.addColorStop(0, 'rgba(6, 214, 160, 0.25)');
        tGrad.addColorStop(1, 'rgba(6, 214, 160, 0)');
        mCtx.fillStyle = tGrad;
        mCtx.fillRect(135, 16, 46, mCanvas.height - 16);

        mCtx.fillStyle = '#38A3A5';
        mCtx.fillRect(24, 96, mCanvas.width - 48, 24);
        mCtx.fillStyle = '#80ED99';
        mCtx.fillRect(24, 90, mCanvas.width - 48, 6);

        const jumpOffset = Math.max(0, Math.sin(tick * 0.07) * 10);
        const vySim = Math.cos(tick * 0.07) * 2.5;

        mCtx.save();
        mCtx.scale(2.8, 2.8);
        drawPixelWorm(
          mCtx,
          36,
          29 - jumpOffset * 0.35,
          1,
          -0.45 + Math.sin(tick * 0.06) * 0.28,
          {
            skin: 'forest_moss',
            hat: 'wizard',
            glasses: 'sun_shades',
            wand: 'crystal_ruler',
          },
          true,
          tick,
          vySim
        );
        mCtx.restore();

        mCtx.fillStyle = '#00F5D4';
        mCtx.font = 'bold 9px "JetBrains Mono", monospace';
        mCtx.fillText('↑ TÉRMICA + CRÍTICO', 14, 20);
      }

      animId = requestAnimationFrame(renderCharacterStages);
    };

    animId = requestAnimationFrame(renderCharacterStages);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-[#0F0E17]/95 p-3 sm:p-5 md:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl my-auto py-1">
        {/* Top Title Header */}
        <div className="text-center mb-3 sm:mb-4">
          <div className="text-[11px] sm:text-xs font-mono-num text-[#06D6A0] mb-1">
            ARTILHARIA PIXEL ART 16-BIT · NÍVEL {progression.level}/5 ({progression.xp} XP)
          </div>
          <h1 className="font-pixel text-base sm:text-2xl md:text-3xl text-[#FFD166] tracking-tight leading-snug">
            GRIMÓRIO DE GIZ: WORMS ARCANO
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#A7A9BE] max-w-2xl mx-auto">
            Escolha se deseja enfrentar o{' '}
            <strong className="text-[#4CC9F0]">Computador (Player vs CPU)</strong> ou{' '}
            <strong className="text-[#FFD166]">Multiplayer Local</strong>, e toque em uma das versões abaixo!
          </p>
        </div>

        {/* =================================================================
            OPPONENT MODE SELECTOR: PLAYER VS CPU or MULTIPLAYER LOCAL
           ================================================================= */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => onChangeOpponentMode('PLAYER_VS_CPU')}
            className={`pixel-btn p-3 text-left flex items-center justify-between gap-3 transition-all ${
              opponentMode === 'PLAYER_VS_CPU'
                ? 'bg-[#172836] border-[#4CC9F0] text-[#F4F1DE]'
                : 'bg-[#151324] border-[#3D3859] text-[#A7A9BE] hover:text-[#F4F1DE]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 shrink-0 border-2 flex items-center justify-center ${
                  opponentMode === 'PLAYER_VS_CPU'
                    ? 'bg-[#4CC9F0] text-[#0F0E17] border-white'
                    : 'bg-[#221F36] text-[#4CC9F0] border-[#3D3859]'
                }`}
              >
                <Bot className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-silk text-xs sm:text-sm font-bold text-[#4CC9F0] truncate">
                  JOGAR CONTRA O COMPUTADOR (1P vs CPU)
                </div>
                <div className="text-[11px] text-[#A7A9BE] truncate">
                  Você enfrenta a IA Balística da Academia Arcana
                </div>
              </div>
            </div>
            <span
              className={`font-mono-num text-[10px] font-bold px-2 py-1 shrink-0 ${
                opponentMode === 'PLAYER_VS_CPU'
                  ? 'bg-[#4CC9F0] text-[#0F0E17]'
                  : 'bg-[#221F36] text-[#A7A9BE]'
              }`}
            >
              {opponentMode === 'PLAYER_VS_CPU' ? 'SELECIONADO' : 'ESCOLHER'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChangeOpponentMode('LOCAL_MULTIPLAYER')}
            className={`pixel-btn p-3 text-left flex items-center justify-between gap-3 transition-all ${
              opponentMode === 'LOCAL_MULTIPLAYER'
                ? 'bg-[#292218] border-[#FFD166] text-[#F4F1DE]'
                : 'bg-[#151324] border-[#3D3859] text-[#A7A9BE] hover:text-[#F4F1DE]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 shrink-0 border-2 flex items-center justify-center ${
                  opponentMode === 'LOCAL_MULTIPLAYER'
                    ? 'bg-[#FFD166] text-[#0F0E17] border-white'
                    : 'bg-[#221F36] text-[#FFD166] border-[#3D3859]'
                }`}
              >
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-silk text-xs sm:text-sm font-bold text-[#FFD166] truncate">
                  MULTIPLAYER LOCAL (JOGADOR vs JOGADOR)
                </div>
                <div className="text-[11px] text-[#A7A9BE] truncate">
                  2 a 4 jogadores dividindo o mesmo dispositivo
                </div>
              </div>
            </div>
            <span
              className={`font-mono-num text-[10px] font-bold px-2 py-1 shrink-0 ${
                opponentMode === 'LOCAL_MULTIPLAYER'
                  ? 'bg-[#FFD166] text-[#0F0E17]'
                  : 'bg-[#221F36] text-[#A7A9BE]'
              }`}
            >
              {opponentMode === 'LOCAL_MULTIPLAYER' ? 'SELECIONADO' : 'ESCOLHER'}
            </span>
          </button>
        </div>

        {/* Two Large Character Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
          {/* =================================================================
              LARGE CHARACTER CARD 1: 1ª VERSÃO (MECÂNICAS SIMPLES)
             ================================================================= */}
          <div
            onClick={() => onSelectModeAndStart('CLASSIC_V1')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectModeAndStart('CLASSIC_V1');
              }
            }}
            className={`group text-left pixel-panel p-4 sm:p-5 transition-transform sm:hover:-translate-y-1 flex flex-col justify-between cursor-pointer ${
              currentMode === 'CLASSIC_V1'
                ? 'border-[#FFD166] bg-[#1E1B30]'
                : 'border-[#3D3859] hover:border-[#FFD166]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs font-mono-num text-[#FFD166] mb-2">
                <span>1ª VERSÃO · TRADICIONAL 1995</span>
                <span>·</span>
                <span>CÁLCULO PURO</span>
              </div>

              <div className="relative w-full bg-[#09080E] border-2 border-[#3D3859] group-hover:border-[#FFD166] overflow-hidden flex justify-center">
                <canvas
                  ref={classicCanvasRef}
                  width={220}
                  height={120}
                  className="pixelated w-full h-[115px] sm:h-[140px] object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-[#09080E]/90 border border-[#3D3859] px-2 py-0.5 text-[10px] font-silk text-[#F4F1DE]">
                  Mestre Pitágoras
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#FFD166] shrink-0" />
                <h2 className="font-pixel text-xs sm:text-base text-[#F4F1DE] group-hover:text-[#FFD166] transition-colors">
                  MECÂNICAS SIMPLES
                </h2>
              </div>

              <p className="mt-1.5 text-xs text-[#A7A9BE] leading-relaxed">
                A experiência clássica e direta inspirada no *Worms 1* original de 1995. Turnos cadenciados, física previsível e precisão matemática.
              </p>

              <ul className="mt-2.5 space-y-1.5 text-xs text-[#F4F1DE] border-t border-[#2E2A44] pt-2.5">
                <li className="flex items-start gap-2">
                  <span className="text-[#FFD166] font-mono-num">01.</span>
                  <span>
                    <strong>Vento Fixo por Turno:</strong> Velocidade constante durante a jogada, sem rajadas ou colunas térmicas.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FFD166] font-mono-num">02.</span>
                  <span>
                    <strong>Movimentação Tradicional:</strong> Caminhada passo a passo e pulo simples clássico.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FFD166] font-mono-num">03.</span>
                  <span>
                    <strong>Mira & Força Direta:</strong> Ângulo tradicional e barra de força linear de 0% a 100%.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-4 pt-3 border-t border-[#2E2A44] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectModeAndStart('CLASSIC_V1', 'PLAYER_VS_CPU');
                  }}
                  className="pixel-btn min-h-[38px] bg-[#172836] hover:bg-[#20384B] text-[#4CC9F0] border-[#4CC9F0] px-2.5 py-1.5 text-[11px] font-bold flex items-center gap-1 whitespace-nowrap"
                  title="Jogar 1ª Versão contra o Computador (CPU)"
                >
                  <Bot className="w-3.5 h-3.5" />
                  vs CPU
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectModeAndStart('CLASSIC_V1', 'LOCAL_MULTIPLAYER');
                  }}
                  className="pixel-btn min-h-[38px] bg-[#252338] hover:bg-[#322F4B] text-[#F4F1DE] border-[#3D3859] px-2.5 py-1.5 text-[11px] font-bold flex items-center gap-1 whitespace-nowrap"
                  title="Jogar 1ª Versão em Multiplayer Local"
                >
                  <Users className="w-3.5 h-3.5 text-[#FFD166]" />
                  2P Local
                </button>
              </div>

              <span className="pixel-btn min-h-[40px] bg-[#FFD166] text-[#0F0E17] border-[#FFD166] px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                <Play className="w-3.5 h-3.5 fill-current" />
                Jogar 1ª Versão
              </span>
            </div>
          </div>

          {/* =================================================================
              LARGE CHARACTER CARD 2: 2ª VERSÃO (MECÂNICAS MODERNAS)
             ================================================================= */}
          <div
            onClick={() => onSelectModeAndStart('MODERN_V2')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectModeAndStart('MODERN_V2');
              }
            }}
            className={`group text-left pixel-panel p-4 sm:p-5 transition-transform sm:hover:-translate-y-1 flex flex-col justify-between cursor-pointer ${
              currentMode === 'MODERN_V2'
                ? 'border-[#06D6A0] bg-[#16242B]'
                : 'border-[#3D3859] hover:border-[#06D6A0]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs font-mono-num text-[#06D6A0] mb-2">
                <span>2ª VERSÃO · EVOLUÇÃO DINÂMICA</span>
                <span>·</span>
                <span>AÇÃO ÁGIL & CLIMA VIVO</span>
              </div>

              <div className="relative w-full bg-[#09080E] border-2 border-[#3D3859] group-hover:border-[#06D6A0] overflow-hidden flex justify-center">
                <canvas
                  ref={modernCanvasRef}
                  width={220}
                  height={120}
                  className="pixelated w-full h-[115px] sm:h-[140px] object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-[#09080E]/90 border border-[#3D3859] px-2 py-0.5 text-[10px] font-silk text-[#06D6A0]">
                  Arquimago Eólico
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Wind className="w-5 h-5 text-[#06D6A0] shrink-0" />
                <h2 className="font-pixel text-xs sm:text-base text-[#F4F1DE] group-hover:text-[#06D6A0] transition-colors">
                  MECÂNICAS MODERNAS
                </h2>
              </div>

              <p className="mt-1.5 text-xs text-[#A7A9BE] leading-relaxed">
                Jogabilidade acelerada e responsiva com ventos vivos, acrobacias aéreas, mira contínua e disparo crítico.
              </p>

              <ul className="mt-2.5 space-y-1.5 text-xs text-[#F4F1DE] border-t border-[#2E2A44] pt-2.5">
                <li className="flex items-start gap-2">
                  <span className="text-[#06D6A0] font-mono-num">01.</span>
                  <span>
                    <strong>Ventos Vivos & Colunas Térmicas:</strong> Rajadas em tempo real e túneis de ar ascendente (<code>↑ TÉRMICA</code>).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#06D6A0] font-mono-num">02.</span>
                  <span>
                    <strong>Pulo Duplo & Mortal Acrobático:</strong> Movimentação fluida com Pulo Duplo aéreo e Mortal usando energia.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#06D6A0] font-mono-num">03.</span>
                  <span>
                    <strong>Mira Fluida & Disparo Crítico:</strong> Alerta <code>ALVO NA MIRA</code> e zona <em>sweet-spot</em> (86%–96%) com <strong>+25% de Dano Crítico</strong>.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-4 pt-3 border-t border-[#2E2A44] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectModeAndStart('MODERN_V2', 'PLAYER_VS_CPU');
                  }}
                  className="pixel-btn min-h-[38px] bg-[#172836] hover:bg-[#20384B] text-[#4CC9F0] border-[#4CC9F0] px-2.5 py-1.5 text-[11px] font-bold flex items-center gap-1 whitespace-nowrap"
                  title="Jogar 2ª Versão contra o Computador (CPU)"
                >
                  <Bot className="w-3.5 h-3.5" />
                  vs CPU
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectModeAndStart('MODERN_V2', 'LOCAL_MULTIPLAYER');
                  }}
                  className="pixel-btn min-h-[38px] bg-[#252338] hover:bg-[#322F4B] text-[#F4F1DE] border-[#3D3859] px-2.5 py-1.5 text-[11px] font-bold flex items-center gap-1 whitespace-nowrap"
                  title="Jogar 2ª Versão em Multiplayer Local"
                >
                  <Users className="w-3.5 h-3.5 text-[#FFD166]" />
                  2P Local
                </button>
              </div>

              <span className="pixel-btn min-h-[40px] bg-[#06D6A0] text-[#0F0E17] border-[#06D6A0] px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                Jogar 2ª Versão
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Quick Settings, Pedagogical Foundation (Graduation Cap) & Customization Bar */}
        <div className="mt-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 pixel-panel px-4 py-3">
          {/* Quick Toggle for Direct-Hit KO Out of Bounds */}
          <button
            type="button"
            onClick={onToggleInstantKO}
            className={`pixel-btn min-h-[42px] px-3 py-2 text-xs font-semibold flex items-center justify-between sm:justify-start gap-2 ${
              instantKODirectHit
                ? 'bg-[#EF476F] text-[#F4F1DE] border-[#FFD166]'
                : 'bg-[#1F1D30] text-[#A7A9BE] hover:text-[#F4F1DE]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#FFD166] shrink-0" />
              <span>
                Eliminação ao Acertar:{' '}
                <strong className="text-[#FFD166]">
                  {instantKODirectHit ? 'ATIVADA (K.O. Direto!)' : 'PADRÃO (HP)'}
                </strong>
              </span>
            </div>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Graduation Cap Button -> Pedagogical & BNCC Foundation */}
            <button
              type="button"
              onClick={onOpenPedagogical}
              className="pixel-btn min-h-[42px] bg-[#2A1D3D] hover:bg-[#382752] border-[#FFD166] px-3.5 py-2 text-xs font-bold text-[#FFD166] flex items-center justify-center gap-2 flex-1 sm:flex-initial whitespace-nowrap"
              title="Abrir Fundamentação Pedagógica, Filosofia do Jogo e BNCC"
            >
              <GraduationCap className="w-4 h-4 text-[#FFD166] shrink-0" />
              <span>Pedagogia & BNCC</span>
            </button>

            <button
              type="button"
              onClick={onOpenWardrobe}
              className="pixel-btn min-h-[42px] bg-[#252338] hover:bg-[#322F4B] px-3.5 py-2 text-xs font-semibold text-[#F4F1DE] flex items-center justify-center gap-1.5 flex-1 sm:flex-initial whitespace-nowrap"
            >
              <Palette className="w-4 h-4 text-[#06D6A0] shrink-0" />
              <span>Equipes & Cenários</span>
            </button>
          </div>
        </div>

        {/* Author Credit Line */}
        <div className="mt-2.5 text-center text-[11px] font-mono-num text-[#A7A9BE]">
          Design e Desenvolvimento:{' '}
          <a
            href="https://diegoduenhas.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FFD166] hover:text-[#06D6A0] underline font-bold"
          >
            Diego Duenhas - diegoduenhas.com.br
          </a>
        </div>
      </div>
    </div>
  );
};
