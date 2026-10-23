import React, { useEffect, useRef } from 'react';
import { Compass, Palette, Play, Sparkles, Wind } from 'lucide-react';
import { GameplayMode, PlayerProgression } from '../types/game';
import { drawPixelWorm, drawWindStreamlines } from '../utils/pixelArtRenderer';

interface TitleScreenProps {
  currentMode: GameplayMode;
  progression: PlayerProgression;
  onSelectModeAndStart: (mode: GameplayMode) => void;
  onOpenWardrobe: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  currentMode,
  progression,
  onSelectModeAndStart,
  onOpenWardrobe,
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

        // Classic dark slate backdrop
        const bgGrad = cCtx.createLinearGradient(0, 0, 0, cCanvas.height);
        bgGrad.addColorStop(0, '#12111E');
        bgGrad.addColorStop(1, '#1E1D32');
        cCtx.fillStyle = bgGrad;
        cCtx.fillRect(0, 0, cCanvas.width, cCanvas.height);

        // Simple flat pixel terrain platform
        cCtx.fillStyle = '#2D6A4F';
        cCtx.fillRect(24, 96, cCanvas.width - 48, 24);
        cCtx.fillStyle = '#52B788';
        cCtx.fillRect(24, 90, cCanvas.width - 48, 6);

        // Static wind arrow indicator
        cCtx.fillStyle = '#FFD166';
        cCtx.font = 'bold 9px "JetBrains Mono", monospace';
        cCtx.fillText('VENTO FIXO: +1.5', 14, 20);

        // Classic Worm Sprite
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

        // Dynamic Wind Streamlines in background
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

        // Thermal Updraft Glow
        const tGrad = mCtx.createLinearGradient(0, mCanvas.height, 0, 20);
        tGrad.addColorStop(0, 'rgba(6, 214, 160, 0.25)');
        tGrad.addColorStop(1, 'rgba(6, 214, 160, 0)');
        mCtx.fillStyle = tGrad;
        mCtx.fillRect(135, 16, 46, mCanvas.height - 16);

        // Terrain platform
        mCtx.fillStyle = '#38A3A5';
        mCtx.fillRect(24, 96, mCanvas.width - 48, 24);
        mCtx.fillStyle = '#80ED99';
        mCtx.fillRect(24, 90, mCanvas.width - 48, 6);

        // Dynamic bouncing/jumping worm with squash & stretch
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

        // Critical Sweet-spot preview badge
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F0E17]/95 p-4 md:p-8 overflow-y-auto">
      <div className="w-full max-w-5xl my-auto">
        {/* Top Title Header */}
        <div className="text-center mb-6">
          <div className="text-xs font-mono-num text-[#06D6A0] mb-2">
            ARTILHARIA EM PIXEL ART 16-BIT · MULTIPLAYER LOCAL · NÍVEL ATUAL {progression.level}/5 ({progression.xp} XP)
          </div>
          <h1 className="font-pixel text-xl sm:text-2xl md:text-3xl text-[#FFD166] tracking-tight">
            GRIMÓRIO DE GIZ: WORMS ARCANO
          </h1>
          <p className="mt-2.5 text-xs sm:text-sm text-[#A7A9BE] max-w-2xl mx-auto">
            Escolha seu personagem-guia abaixo para iniciar a batalha com a{' '}
            <strong className="text-[#F4F1DE]">1ª Versão (Mecânicas Simples)</strong> ou a{' '}
            <strong className="text-[#06D6A0]">2ª Versão (Mecânicas Modernas)</strong>.
          </p>
        </div>

        {/* Two Large Character Selection Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* =================================================================
              LARGE CHARACTER BUTTON 1: 1ª VERSÃO (MECÂNICAS SIMPLES)
             ================================================================= */}
          <button
            onClick={() => onSelectModeAndStart('CLASSIC_V1')}
            className={`group text-left pixel-panel p-5 sm:p-6 transition-transform hover:-translate-y-1 flex flex-col justify-between cursor-pointer ${
              currentMode === 'CLASSIC_V1'
                ? 'border-[#FFD166] bg-[#1E1B30]'
                : 'border-[#3D3859] hover:border-[#FFD166]'
            }`}
          >
            <div>
              {/* Top Kicker & Version Label */}
              <div className="flex items-center justify-between gap-2 text-xs font-mono-num text-[#FFD166] mb-3">
                <span>1ª VERSÃO · TRADICIONAL 1995</span>
                <span>·</span>
                <span>FOCO EM CÁLCULO PURO</span>
              </div>

              {/* Live Pixel-Art Character Portrait Canvas */}
              <div className="relative w-full bg-[#09080E] border-2 border-[#3D3859] group-hover:border-[#FFD166] overflow-hidden flex justify-center">
                <canvas
                  ref={classicCanvasRef}
                  width={220}
                  height={120}
                  className="pixelated w-full h-[155px] object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-[#09080E]/90 border border-[#3D3859] px-2 py-0.5 text-[10px] font-silk text-[#F4F1DE]">
                  Mestre Pitágoras
                </div>
              </div>

              {/* Character & Mode Title */}
              <div className="mt-4 flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#FFD166] shrink-0" />
                <h2 className="font-pixel text-sm sm:text-base text-[#F4F1DE] group-hover:text-[#FFD166] transition-colors">
                  MECÂNICAS SIMPLES
                </h2>
              </div>

              <p className="mt-2 text-xs text-[#A7A9BE] leading-relaxed">
                A experiência clássica e direta inspirada no *Worms 1* original de 1995. Ideal para quem prefere turnos cadenciados, física previsível e precisão matemática.
              </p>

              {/* Textual Feature Breakdown */}
              <ul className="mt-4 space-y-2 text-xs text-[#F4F1DE] border-t border-[#2E2A44] pt-3">
                <li className="flex items-start gap-2">
                  <span className="text-[#FFD166] font-mono-num">01.</span>
                  <span>
                    <strong>Vento Fixo por Turno:</strong> A velocidade do vento permanece constante durante toda a jogada, sem rajadas ou colunas térmicas.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FFD166] font-mono-num">02.</span>
                  <span>
                    <strong>Movimentação Tradicional:</strong> Caminhada passo a passo e pulo simples clássico, sem consumo de energia ou acrobacias aéreas.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FFD166] font-mono-num">03.</span>
                  <span>
                    <strong>Mira & Força Direta:</strong> Ajuste de ângulo tradicional (W/S ou clique no mapa) e barra de força linear de 0% a 100%.
                  </span>
                </li>
              </ul>
            </div>

            {/* Bottom Call-To-Action inside the Large Button */}
            <div className="mt-6 pt-3 border-t border-[#2E2A44] flex items-center justify-between">
              <span className="text-xs font-mono-num text-[#A7A9BE]">
                10 Magias Escolares · 2 a 4 Equipes
              </span>
              <span className="pixel-btn bg-[#FFD166] text-[#0F0E17] border-[#FFD166] px-4 py-2 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                <Play className="w-3.5 h-3.5 fill-current" />
                Jogar 1ª Versão
              </span>
            </div>
          </button>

          {/* =================================================================
              LARGE CHARACTER BUTTON 2: 2ª VERSÃO (MECÂNICAS MODERNAS)
             ================================================================= */}
          <button
            onClick={() => onSelectModeAndStart('MODERN_V2')}
            className={`group text-left pixel-panel p-5 sm:p-6 transition-transform hover:-translate-y-1 flex flex-col justify-between cursor-pointer ${
              currentMode === 'MODERN_V2'
                ? 'border-[#06D6A0] bg-[#16242B]'
                : 'border-[#3D3859] hover:border-[#06D6A0]'
            }`}
          >
            <div>
              {/* Top Kicker & Version Label */}
              <div className="flex items-center justify-between gap-2 text-xs font-mono-num text-[#06D6A0] mb-3">
                <span>2ª VERSÃO · EVOLUÇÃO DINÂMICA</span>
                <span>·</span>
                <span>AÇÃO ÁGIL & CLIMA VIVO</span>
              </div>

              {/* Live Pixel-Art Character Portrait Canvas */}
              <div className="relative w-full bg-[#09080E] border-2 border-[#3D3859] group-hover:border-[#06D6A0] overflow-hidden flex justify-center">
                <canvas
                  ref={modernCanvasRef}
                  width={220}
                  height={120}
                  className="pixelated w-full h-[155px] object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-[#09080E]/90 border border-[#3D3859] px-2 py-0.5 text-[10px] font-silk text-[#06D6A0]">
                  Arquimago Eólico
                </div>
              </div>

              {/* Character & Mode Title */}
              <div className="mt-4 flex items-center gap-2">
                <Wind className="w-5 h-5 text-[#06D6A0] shrink-0" />
                <h2 className="font-pixel text-sm sm:text-base text-[#F4F1DE] group-hover:text-[#06D6A0] transition-colors">
                  MECÂNICAS MODERNAS
                </h2>
              </div>

              <p className="mt-2 text-xs text-[#A7A9BE] leading-relaxed">
                Jogabilidade acelerada e responsiva com ventos vivos, acrobacias aéreas, mira contínua pelo mouse e sistema de acerto crítico.
              </p>

              {/* Textual Feature Breakdown */}
              <ul className="mt-4 space-y-2 text-xs text-[#F4F1DE] border-t border-[#2E2A44] pt-3">
                <li className="flex items-start gap-2">
                  <span className="text-[#06D6A0] font-mono-num">01.</span>
                  <span>
                    <strong>Ventos Vivos & Colunas Térmicas:</strong> Rajadas que oscilam em tempo real e túneis de ar ascendente (`↑ TÉRMICA`) que elevam projéteis e minhocas.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#06D6A0] font-mono-num">02.</span>
                  <span>
                    <strong>Pulo Duplo & Mortal Acrobático:</strong> Movimentação fluida por declives com Pulo Duplo aéreo (`W`) e Mortal (`Q`) usando barra de energia.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#06D6A0] font-mono-num">03.</span>
                  <span>
                    <strong>Mira Mouse & Disparo Crítico:</strong> Mira segue o cursor com alerta de `ALVO NA MIRA` e zona *sweet-spot* (86%–96%) que causa <strong>+25% de Dano Crítico</strong>.
                  </span>
                </li>
              </ul>
            </div>

            {/* Bottom Call-To-Action inside the Large Button */}
            <div className="mt-6 pt-3 border-t border-[#2E2A44] flex items-center justify-between">
              <span className="text-xs font-mono-num text-[#A7A9BE]">
                Clima Dinâmico · Hit-Stop & Crítico
              </span>
              <span className="pixel-btn bg-[#06D6A0] text-[#0F0E17] border-[#06D6A0] px-4 py-2 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                Jogar 2ª Versão
              </span>
            </div>
          </button>
        </div>

        {/* Bottom Secondary Action Bar: Customize Teams before starting */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pixel-panel px-5 py-3">
          <div className="text-xs text-[#A7A9BE]">
            Você pode alternar entre a <strong className="text-[#FFD166]">1ª Versão</strong> e a{' '}
            <strong className="text-[#06D6A0]">2ª Versão</strong> a qualquer momento pelo menu superior.
          </div>
          <button
            onClick={onOpenWardrobe}
            className="pixel-btn bg-[#252338] hover:bg-[#322F4B] px-3.5 py-1.5 text-xs font-semibold text-[#F4F1DE] flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Palette className="w-3.5 h-3.5 text-[#06D6A0]" />
            Personalizar Personagens & Equipes
          </button>
        </div>
      </div>
    </div>
  );
};
