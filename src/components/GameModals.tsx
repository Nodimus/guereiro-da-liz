/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Trophy, Skull, Sparkles, BookOpen } from 'lucide-react';
import { PlayerStats } from '../game/types';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSkills: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenSkills,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 text-center shadow-2xl">
        <h2 className="text-2xl font-bold font-mythic text-zinc-100 tracking-wider mb-2">
          Jornada Pausada
        </h2>
        <p className="text-xs text-zinc-400 mb-6">
          Aquiete o espírito antes de retomar a batalha ancestral
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>RETOMAR COMBATE</span>
          </button>

          <button
            onClick={onOpenSkills}
            className="w-full py-3 rounded-xl bg-zinc-900 border border-amber-500/40 hover:bg-zinc-800 text-amber-400 font-bold text-xs tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>ÁRVORE DE IFÁ (BÊNÇÃOS)</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            <span>{isMuted ? 'Ativar Música e Efeitos' : 'Mutar Áudio'}</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:bg-red-950/40 text-red-400 hover:text-red-300 font-semibold text-xs tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all mt-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reiniciar do Início</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  stats: PlayerStats;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ stats, onRestart }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 select-none">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-red-900/60 rounded-3xl p-6 md:p-8 text-center shadow-[0_0_50px_rgba(220,38,38,0.3)]">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-950/60 border border-red-700/50 flex items-center justify-center text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
          <Skull className="w-8 h-8" />
        </div>

        <h2 className="text-3xl font-extrabold font-mythic text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-500 tracking-wider mb-2">
          O Axé Adormeceu
        </h2>
        <p className="text-xs text-zinc-400 mb-6 max-w-sm mx-auto leading-relaxed">
          As forças do folclore subjugaram suas defesas nesta batalha. Mas os ancestrais de Aruanda nunca abandonam quem tem bravura.
        </p>

        {/* Stats Recap */}
        <div className="grid grid-cols-2 gap-3 mb-6 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase block font-semibold">
              Pontuação de Combo
            </span>
            <span className="text-lg font-bold text-amber-400 font-mono">
              {stats.comboScore}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase block font-semibold">
              Axé Acumulado
            </span>
            <span className="text-lg font-bold text-amber-400 font-mono">
              {stats.axePoints}
            </span>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-black font-extrabold text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_25px_rgba(245,158,11,0.4)] active:scale-95"
        >
          <RotateCcw className="w-4 h-4 fill-black" />
          <span>RENASCER COM A FORÇA DOS ORIXÁS</span>
        </button>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  stats: PlayerStats;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ stats, onRestart }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 select-none">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-amber-500/60 rounded-3xl p-6 md:p-8 text-center shadow-[0_0_60px_rgba(245,158,11,0.4)]">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="text-3xl font-extrabold font-mythic text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 tracking-wider mb-2">
          Glória de Aruanda!
        </h2>
        <p className="text-xs text-zinc-300 mb-6 max-w-sm mx-auto leading-relaxed">
          Você derrotou o lendário <strong className="text-amber-400">Mapinguari Ancestral</strong>, acalmou os espíritos da mata e harmonizou as forças de Pindorama com as bênçãos sagradas dos Orixás!
        </p>

        {/* Stats Recap */}
        <div className="grid grid-cols-3 gap-3 mb-6 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase block font-semibold">
              Combo Máximo
            </span>
            <span className="text-lg font-bold text-amber-400 font-mono">
              {stats.comboRank}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase block font-semibold">
              Pontuação
            </span>
            <span className="text-lg font-bold text-amber-400 font-mono">
              {stats.comboScore}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase block font-semibold">
              Axé Total
            </span>
            <span className="text-lg font-bold text-amber-400 font-mono">
              {stats.axePoints}
            </span>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_30px_rgba(245,158,11,0.5)] active:scale-95"
        >
          <Sparkles className="w-4 h-4 fill-black" />
          <span>INICIAR NOVA JORNADA</span>
        </button>
      </div>
    </div>
  );
};
