/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, Swords, Shield, Flame, Sparkles } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
  onOpenSkills: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onOpenSkills,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between p-6 md:p-12 pointer-events-none select-none">
      {/* Top Header: Mute & Lore Badge */}
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-amber-500/40 bg-black/60 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-500/90 block">
              Mitologia Iorubá & Folclore Brasileiro
            </span>
            <span className="text-xs text-zinc-400">RPG de Ação Hack and Slash 3D</span>
          </div>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={onToggleMute}
          className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-lg border border-zinc-700/60 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold tracking-wide transition-all shadow-lg backdrop-blur-none cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          <span>{isMuted ? 'Mudo' : 'Som Ativo'}</span>
        </button>
      </div>

      {/* Center: Bespoke Mythic Title Lockup & 35% Negative Space */}
      <div className="flex flex-col items-center justify-center my-auto text-center max-w-3xl mx-auto">
        {/* Decorative Mythic SVG Logo Icon */}
        <div className="relative mb-3 flex items-center justify-center">
          <svg className="w-24 h-24 text-amber-500" viewBox="0 0 100 100" fill="none">
            {/* Outer Ritual Sun Ring */}
            <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="2" strokeDasharray="6 3" />
            <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
            {/* Crossed Oxé (Double Axe of Xangô) & Blades of Ogum */}
            <path d="M25 50 L75 50" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
            <path d="M50 25 L50 75" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
            <polygon points="50,18 44,30 56,30" fill="#38bdf8" />
            <polygon points="50,82 44,70 56,70" fill="#38bdf8" />
            <polygon points="18,50 30,44 30,56" fill="#f97316" />
            <polygon points="82,50 70,44 70,56" fill="#f97316" />
            {/* Center Golden Core */}
            <circle cx="50" cy="50" r="8" fill="#eab308" />
          </svg>
        </div>

        {/* Title Lockup */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-wider font-mythic text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 drop-shadow-[0_4px_25px_rgba(217,119,6,0.6)]">
          AXÉ
        </h1>
        <h2 className="text-xl md:text-3xl font-semibold tracking-[0.25em] text-zinc-200 uppercase mt-1 mb-4 font-mythic">
          Guerra dos Ancestrais
        </h2>

        {/* Subtitle / Prologue */}
        <p className="text-sm md:text-base text-zinc-300/90 max-w-xl mx-auto leading-relaxed font-normal mb-8">
          Empunhe as lâminas de ferro forjado de <span className="text-sky-400 font-bold">Ogum</span>, o raio cósmico de <span className="text-orange-400 font-bold">Xangô</span> e a tempestade de <span className="text-red-400 font-bold">Iansã</span> contra os espíritos indomáveis do folclore de Pindorama: <span className="text-amber-300 font-semibold">Corpo-Seco</span>, <span className="text-red-400 font-semibold">Saci</span>, <span className="text-emerald-400 font-semibold">Curupira</span>, <span className="text-orange-500 font-semibold">Boitatá</span> e o titã <span className="text-red-500 font-bold">Mapinguari</span>.
        </p>

        {/* Primary Start CTA Button */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onStart}
            className="pointer-events-auto px-10 py-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-black font-extrabold tracking-wider text-base md:text-lg shadow-[0_0_35px_rgba(245,158,11,0.5)] active:scale-95 transition-transform flex items-center gap-3 cursor-pointer border border-amber-300/40"
          >
            <Swords className="w-5 h-5 text-black" />
            <span>INICIAR JORNADA ANCESTRAL</span>
          </button>

          <button
            onClick={onOpenSkills}
            className="pointer-events-auto px-6 py-4 rounded-xl border border-amber-500/50 bg-black/70 hover:bg-zinc-900 text-amber-400 font-bold tracking-wide text-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            <span>ÁRVORE DE IFÁ (BÊNÇÃOS)</span>
          </button>
        </div>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <div className="w-full flex justify-center pb-2">
        <div className="px-5 py-2.5 rounded-full border border-zinc-800 bg-black/80 text-zinc-400 text-xs tracking-wider flex items-center gap-2 md:gap-4 flex-wrap justify-center font-medium shadow-md">
          <span><strong className="text-zinc-200">WASD</strong> Mover</span>
          <span>·</span>
          <span><strong className="text-zinc-200">Botão Esq.</strong> Golpe Leve</span>
          <span>·</span>
          <span><strong className="text-zinc-200">Botão Dir.</strong> Golpe Pesado</span>
          <span>·</span>
          <span><strong className="text-zinc-200">Espaço</strong> Esquiva</span>
          <span>·</span>
          <span><strong className="text-zinc-200">1-5</strong> Troca de Orixá</span>
          <span>·</span>
          <span><strong className="text-zinc-200">Q</strong> Especial</span>
          <span>·</span>
          <span><strong className="text-zinc-200">R</strong> Axé Supremo</span>
          <span>·</span>
          <span><strong className="text-zinc-200">E</strong> Execução</span>
          <span>·</span>
          <span><strong className="text-zinc-200">Esc</strong> Pausa</span>
        </div>
      </div>
    </div>
  );
};
