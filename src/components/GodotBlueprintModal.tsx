import React, { useState } from 'react';
import { Check, Code2, Copy, Cpu, Flame, X } from 'lucide-react';

interface GodotBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  showTrajectory: boolean;
  onToggleTrajectory: () => void;
  highParticles: boolean;
  onToggleParticles: () => void;
  instantKODirectHit: boolean;
  onToggleInstantKO: () => void;
}

const GODOT_SCRIPTS: Record<string, { title: string; filename: string; code: string }> = {
  terrain: {
    title: 'Terreno Destrutível (Image + BitMap Chunking)',
    filename: 'res://scripts/DestructibleTerrain.gd',
    code: `extends Node2D
class_name DestructibleTerrain

# Otimização Godot 4.x: Terreno Pixel Art com máscara Image em RAM
# e atualização localizada de CollisionPolygon2D por quadrantes (Chunks 128x128)
@export var terrain_width: int = 1280
@export var terrain_height: int = 720

var terrain_image: Image
var terrain_texture: ImageTexture
@onready var sprite: Sprite2D = $TerrainSprite
@onready var static_body: StaticBody2D = $TerrainBody

func _ready() -> void:
    terrain_image = Image.create(terrain_width, terrain_height, false, Image.FORMAT_RGBA8)
    _generate_pixel_hills()
    terrain_texture = ImageTexture.create_from_image(terrain_image)
    sprite.texture = terrain_texture
    sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
    _rebuild_collision_bitmap()

func carve_crater(center: Vector2i, radius: int) -> void:
    var r_sq := radius * radius
    var burn_sq := (radius + 4) * (radius + 4)
    for y in range(max(0, center.y - radius - 4), min(terrain_height, center.y + radius + 4)):
        for x in range(max(0, center.x - radius - 4), min(terrain_width, center.x + radius + 4)):
            var dx := x - center.x
            var dy := y - center.y
            var d_sq := dx * dx + dy * dy
            if d_sq <= r_sq:
                terrain_image.set_pixel(x, y, Color(0, 0, 0, 0))
            elif d_sq <= burn_sq and terrain_image.get_pixel(x, y).a > 0.1:
                var c := terrain_image.get_pixel(x, y).darkened(0.45)
                terrain_image.set_pixel(x, y, c)
    terrain_texture.update(terrain_image)
    _rebuild_collision_bitmap()

func _rebuild_collision_bitmap() -> void:
    for child in static_body.get_children():
        child.queue_free()
    var bm := BitMap.new()
    bm.create_from_image_alpha(terrain_image, 0.5)
    var polygons := bm.opaque_to_polygons(Rect2i(0, 0, terrain_width, terrain_height), 2.0)
    for poly in polygons:
        var col := CollisionPolygon2D.new()
        col.polygon = poly
        static_body.add_child(col)`,
  },
  worm: {
    title: 'Minhoca Arcana & Arremesso K.O. (CharacterBody2D)',
    filename: 'res://scripts/ArcaneWorm.gd',
    code: `extends CharacterBody2D
class_name ArcaneWorm

@export var team_id: int = 0
@export var worm_name: String = "Pitágoras"
@export var instant_ko_direct_hit: bool = false
var hp: int = 100
var is_launching_out: bool = false

func apply_blast_impulse(origin: Vector2, blast_radius: float, max_damage: int, knockback: float, direct_hit: bool) -> void:
    if instant_ko_direct_hit and direct_hit:
        # Eliminação imediata jogando o oponente girando para fora do cenário
        is_launching_out = true
        collision_layer = 0
        collision_mask = 0
        var dir_x := 1.0 if global_position.x >= origin.x else -1.0
        velocity = Vector2(dir_x * 920.0, -980.0)
        return
    var dist := global_position.distance_to(origin)
    if dist > blast_radius:
        return
    var factor := 1.0 - (dist / blast_radius)
    hp = max(0, hp - int(round(max_damage * factor)))
    var dir := (global_position - origin).normalized()
    velocity = dir * (knockback * 45.0 * factor) + Vector2(0, -140.0)`,
  },
  progression: {
    title: 'Progressão de Níveis & Arsenal Escolar (Resource)',
    filename: 'res://scripts/SpellProgression.gd',
    code: `extends Node
class_name SpellProgression

signal level_up(new_level: int)

var current_xp: int = 0
var current_level: int = 1
const THRESHOLDS := {1: 0, 2: 150, 3: 350, 4: 600, 5: 900}

func add_xp(amount: int) -> void:
    current_xp += amount
    for lvl in range(5, 1, -1):
        if current_xp >= THRESHOLDS[lvl] and current_level < lvl:
            current_level = lvl
            level_up.emit(current_level)
            break`,
  },
};

export const GodotBlueprintModal: React.FC<GodotBlueprintModalProps> = ({
  isOpen,
  onClose,
  showTrajectory,
  onToggleTrajectory,
  highParticles,
  onToggleParticles,
  instantKODirectHit,
  onToggleInstantKO,
}) => {
  const [activeTab, setActiveTab] = useState<'terrain' | 'worm' | 'progression'>('terrain');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentScript = GODOT_SCRIPTS[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentScript.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4">
      <div className="pixel-panel w-full max-w-4xl p-4 sm:p-6 text-[#F4F1DE] max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b-2 border-[#3D3859] pb-3 sm:pb-4">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-[#4CC9F0] shrink-0" />
            <div>
              <h2 className="font-pixel text-xs sm:text-base md:text-lg text-[#4CC9F0]">
                OPÇÕES DE MOTOR & SCRIPTS GODOT 4.X
              </h2>
              <p className="mt-1 text-[11px] sm:text-xs text-[#A7A9BE]">
                Configure regras de física, eliminação direta e exporte os scripts GDScript.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="pixel-btn min-h-[44px] bg-[#252338] px-3.5 py-2 text-xs font-semibold text-[#F4F1DE] hover:bg-[#322F4B] flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <X className="w-4 h-4" />
            Fechar
          </button>
        </div>

        {/* Live Engine & Rule Toggles */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#141220] border-2 border-[#2E2A44] p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-3 bg-[#1B192B] p-2.5 border border-[#3D3859]">
            <div>
              <div className="text-xs font-semibold text-[#FFD166] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                Eliminação ao Acertar
              </div>
              <div className="text-[11px] text-[#A7A9BE]">
                Joga o oponente para fora do cenário
              </div>
            </div>
            <button
              onClick={onToggleInstantKO}
              className={`pixel-btn min-h-[40px] px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 ${
                instantKODirectHit
                  ? 'bg-[#EF476F] text-[#F4F1DE] border-[#FFD166]'
                  : 'bg-[#1F1D30] text-[#A7A9BE]'
              }`}
            >
              {instantKODirectHit ? 'ATIVADA' : 'PADRÃO (OFF)'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 bg-[#1B192B] p-2.5 border border-[#3D3859]">
            <div>
              <div className="text-xs font-semibold text-[#F4F1DE]">
                Trajetória Previsora
              </div>
              <div className="text-[11px] text-[#A7A9BE]">
                Calcula gravidade + vento
              </div>
            </div>
            <button
              onClick={onToggleTrajectory}
              className={`pixel-btn min-h-[40px] px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${
                showTrajectory
                  ? 'bg-[#06D6A0] text-[#0F0E17] border-[#06D6A0]'
                  : 'bg-[#1F1D30] text-[#A7A9BE]'
              }`}
            >
              {showTrajectory ? 'Ativada' : 'Oculta'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 bg-[#1B192B] p-2.5 border border-[#3D3859]">
            <div>
              <div className="text-xs font-semibold text-[#F4F1DE]">
                Partículas Pixel 16-Bit
              </div>
              <div className="text-[11px] text-[#A7A9BE]">
                Detritos de giz e faíscas
              </div>
            </div>
            <button
              onClick={onToggleParticles}
              className={`pixel-btn min-h-[40px] px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${
                highParticles
                  ? 'bg-[#FFD166] text-[#0F0E17] border-[#FFD166]'
                  : 'bg-[#1F1D30] text-[#A7A9BE]'
              }`}
            >
              {highParticles ? 'Alta' : 'Leve'}
            </button>
          </div>
        </div>

        {/* GDScript Tabs */}
        <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {(
              [
                ['terrain', 'DestructibleTerrain.gd'],
                ['worm', 'ArcaneWorm.gd'],
                ['progression', 'SpellProgression.gd'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`pixel-btn min-h-[40px] px-3 py-1.5 text-xs font-mono-num flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === key
                    ? 'bg-[#2C2747] border-[#4CC9F0] text-[#4CC9F0]'
                    : 'bg-[#1B192B] text-[#A7A9BE]'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="pixel-btn min-h-[40px] bg-[#252338] hover:bg-[#322F4B] px-3 py-1.5 text-xs font-semibold text-[#FFD166] flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado!' : 'Copiar GDScript'}
          </button>
        </div>

        {/* Code Viewer */}
        <div className="mt-3 bg-[#09080E] border-2 border-[#3D3859] p-3.5 sm:p-4 max-h-[38dvh] overflow-y-auto">
          <div className="text-[11px] font-mono-num text-[#A7A9BE] mb-2">
            {currentScript.title} · {currentScript.filename}
          </div>
          <pre className="text-xs font-mono-num text-[#06D6A0] leading-relaxed overflow-x-auto">
            <code>{currentScript.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
