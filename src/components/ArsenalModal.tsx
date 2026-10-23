import React from 'react';
import { Lock, Sparkles, X, Zap } from 'lucide-react';
import { LEVEL_THRESHOLDS, SPELL_ARSENAL } from '../data/arsenal';
import { PlayerProgression, SpellWeapon, TeamConfig, WeaponId } from '../types/game';

interface ArsenalModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWeaponId: WeaponId;
  onSelectWeapon: (id: WeaponId) => void;
  progression: PlayerProgression;
  currentTeam: TeamConfig;
  onGrantStudyXp: () => void;
  onToggleSandboxUnlock: () => void;
}

export const ArsenalModal: React.FC<ArsenalModalProps> = ({
  isOpen,
  onClose,
  selectedWeaponId,
  onSelectWeapon,
  progression,
  currentTeam,
  onGrantStudyXp,
  onToggleSandboxUnlock,
}) => {
  if (!isOpen) return null;

  const currentThreshold =
    LEVEL_THRESHOLDS.find((l) => l.level === progression.level) || LEVEL_THRESHOLDS[0];
  const nextThreshold = LEVEL_THRESHOLDS.find((l) => l.level === progression.level + 1);

  const xpProgressPercent = nextThreshold
    ? Math.min(
        100,
        Math.max(
          0,
          ((progression.xp - currentThreshold.xpRequired) /
            (nextThreshold.xpRequired - currentThreshold.xpRequired)) *
            100
        )
      )
    : 100;

  const isWeaponUnlocked = (w: SpellWeapon) =>
    progression.unlockAllSandbox || progression.level >= w.unlockLevel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="pixel-panel w-full max-w-4xl p-6 text-[#F4F1DE]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#3D3859] pb-4">
          <div>
            <h2 className="font-pixel text-base md:text-lg text-[#FFD166]">
              GRIMÓRIO ESCOLAR & ELEMENTAL
            </h2>
            <p className="mt-1 text-xs text-[#A7A9BE]">
              Ganhe XP causando dano, coletando tomos e vencendo turnos para desbloquear novos feitiços.
            </p>
          </div>
          <button
            onClick={onClose}
            className="pixel-btn bg-[#252338] px-3 py-1.5 text-xs font-semibold text-[#F4F1DE] hover:bg-[#322F4B] flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <X className="w-4 h-4" />
            Fechar (ESC)
          </button>
        </div>

        {/* Progression & XP Bar */}
        <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#141220] border-2 border-[#2E2A44] p-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-silk font-bold text-[#06D6A0]">
                NÍVEL {progression.level} · {currentThreshold.title.toUpperCase()}
              </span>
              <span className="font-mono-num text-[#FFD166]">
                {progression.xp} XP{' '}
                {nextThreshold ? `/ ${nextThreshold.xpRequired} XP (Próx. Nível)` : '· NÍVEL MÁXIMO'}
              </span>
            </div>
            <div className="mt-2 h-3 w-full bg-[#09080E] border border-[#3D3859] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#06D6A0] to-[#FFD166] transition-all duration-150"
                style={{ width: `${xpProgressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onGrantStudyXp}
              className="pixel-btn bg-[#2A244D] hover:bg-[#39306B] px-3 py-2 text-xs font-semibold text-[#FFD166] flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="Adiciona +200 XP imediatamente para testar desbloqueios de níveis"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Estudar Grimório (+200 XP)
            </button>
            <button
              onClick={onToggleSandboxUnlock}
              className={`pixel-btn px-3 py-2 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                progression.unlockAllSandbox
                  ? 'bg-[#06D6A0] text-[#0F0E17] border-[#06D6A0]'
                  : 'bg-[#1F1D30] text-[#A7A9BE] hover:text-[#F4F1DE]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              {progression.unlockAllSandbox ? 'Modo Livre: Ativo' : 'Liberar Tudo'}
            </button>
          </div>
        </div>

        {/* 2x5 Arsenal Grid */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 max-h-[55vh] overflow-y-auto pr-1">
          {SPELL_ARSENAL.map((weapon, idx) => {
            const unlocked = isWeaponUnlocked(weapon);
            const ammoCount = currentTeam.ammo[weapon.id];
            const outOfAmmo = ammoCount === 0;
            const isSelected = selectedWeaponId === weapon.id;

            return (
              <button
                key={weapon.id}
                disabled={!unlocked || outOfAmmo}
                onClick={() => {
                  onSelectWeapon(weapon.id);
                  onClose();
                }}
                className={`text-left p-3 border-2 transition-transform flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#2C2747] border-[#FFD166]'
                    : unlocked && !outOfAmmo
                    ? 'bg-[#1E1C2E] border-[#3D3859] hover:border-[#A7A9BE]'
                    : 'bg-[#13121D] border-[#252238] opacity-65 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 text-[11px] font-mono-num text-[#A7A9BE]">
                    <span>[{idx === 9 ? 0 : idx + 1}]</span>
                    <span>
                      {unlocked ? (
                        ammoCount === -1 ? (
                          'MUNIÇÃO: ∞'
                        ) : (
                          `USOS: ${ammoCount}x`
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#EF476F]">
                          <Lock className="w-3 h-3" /> NV. {weapon.unlockLevel}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className="w-4 h-4 shrink-0 border border-white/30"
                      style={{
                        background: `linear-gradient(135deg, ${weapon.color} 50%, ${weapon.secondaryColor} 50%)`,
                      }}
                    />
                    <h3 className="font-silk text-xs font-bold text-[#F4F1DE] leading-tight">
                      {weapon.name}
                    </h3>
                  </div>

                  <p className="mt-1 text-[11px] text-[#FFD166]">{weapon.subtitle}</p>
                  <p className="mt-2 text-[11px] text-[#A7A9BE] leading-relaxed">
                    {weapon.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#2E2A44] flex items-center justify-between text-[11px] font-mono-num text-[#F4F1DE]">
                  <span>DANO: {weapon.damage > 0 ? weapon.damage : 'TP'}</span>
                  <span>·</span>
                  <span>RAIO: {weapon.blastRadius}px</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
