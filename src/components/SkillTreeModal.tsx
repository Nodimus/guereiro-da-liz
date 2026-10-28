/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Swords,
  Flame,
  Wind,
  Crosshair,
  Heart,
  Check,
  Lock,
  Zap,
} from 'lucide-react';
import { ORIXAS_CONFIG } from '../game/constants';
import { OrixaType, SkillNode } from '../game/types';

interface SkillTreeModalProps {
  skills: SkillNode[];
  axePoints: number;
  onUnlockSkill: (id: string) => boolean;
  onClose: () => void;
}

export const SkillTreeModal: React.FC<SkillTreeModalProps> = ({
  skills,
  axePoints,
  onUnlockSkill,
  onClose,
}) => {
  const [selectedOrixa, setSelectedOrixa] = useState<OrixaType>('ogum');

  const orixas: OrixaType[] = ['ogum', 'xango', 'iansa', 'oxossi', 'oxum'];
  const currentOrixaData = ORIXAS_CONFIG[selectedOrixa];
  const filteredSkills = skills.filter((s) => s.orixa === selectedOrixa);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-amber-500/40 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(217,119,6,0.25)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold font-mythic text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                Árvore de Ifá — Bênçãos dos Orixás
              </h2>
              <p className="text-xs text-zinc-400">
                Consagre seu Axé e desperte as técnicas sagradas dos deuses ancestrais
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Axé Points Counter */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-zinc-300 font-semibold">Axé Disponível:</span>
              <span className="text-sm font-extrabold text-amber-300 font-mono tabular-nums">
                {axePoints}
              </span>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Orixá Navigation Tabs */}
        <div className="flex items-center gap-2 py-4 overflow-x-auto border-b border-zinc-800/80">
          {orixas.map((orixaKey) => {
            const data = ORIXAS_CONFIG[orixaKey];
            const isSelected = selectedOrixa === orixaKey;
            return (
              <button
                key={orixaKey}
                onClick={() => setSelectedOrixa(orixaKey)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/20 text-white shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                    : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                {orixaKey === 'ogum' && <Swords className="w-4 h-4 text-sky-400" />}
                {orixaKey === 'xango' && <Flame className="w-4 h-4 text-orange-400" />}
                {orixaKey === 'iansa' && <Wind className="w-4 h-4 text-yellow-400" />}
                {orixaKey === 'oxossi' && <Crosshair className="w-4 h-4 text-emerald-400" />}
                {orixaKey === 'oxum' && <Sparkles className="w-4 h-4 text-amber-300" />}
                <span>{data.name}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Orixá Lore Card */}
        <div className="my-4 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
            style={{
              borderColor: currentOrixaData.color,
              backgroundColor: `${currentOrixaData.color}22`,
            }}
          >
            {selectedOrixa === 'ogum' && <Swords className="w-6 h-6 text-sky-400" />}
            {selectedOrixa === 'xango' && <Flame className="w-6 h-6 text-orange-400" />}
            {selectedOrixa === 'iansa' && <Wind className="w-6 h-6 text-yellow-400" />}
            {selectedOrixa === 'oxossi' && <Crosshair className="w-6 h-6 text-emerald-400" />}
            {selectedOrixa === 'oxum' && <Sparkles className="w-6 h-6 text-amber-300" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <span>{currentOrixaData.name}</span>
              <span className="text-xs text-amber-400 font-normal">({currentOrixaData.title})</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {currentOrixaData.description}
            </p>
            <div className="mt-2 text-[11px] font-semibold text-zinc-300 flex items-center gap-3">
              <span>Elemento: <strong className="text-white">{currentOrixaData.element}</strong></span>
              <span>·</span>
              <span>Arma: <strong className="text-white">{currentOrixaData.weaponName}</strong></span>
            </div>
          </div>
        </div>

        {/* Skill Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSkills.map((skill) => {
            const canAfford = axePoints >= skill.cost;

            return (
              <div
                key={skill.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  skill.unlocked
                    ? 'border-emerald-500/50 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : canAfford
                    ? 'border-amber-500/40 bg-zinc-900/80 hover:border-amber-400'
                    : 'border-zinc-800 bg-zinc-900/40 opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Camada {skill.tier}
                    </span>
                    {skill.unlocked ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-500/50 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Desperto
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                        {skill.cost} Axé
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-extrabold text-zinc-100 font-mythic">
                    {skill.name}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                    {skill.description}
                  </p>
                </div>

                {/* Unlock Button */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500 capitalize">
                    {skill.effectType.replace('_', ' ')}
                  </span>

                  {skill.unlocked ? (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Ativo no Guerreiro
                    </span>
                  ) : (
                    <button
                      onClick={() => onUnlockSkill(skill.id)}
                      disabled={!canAfford}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-95'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700/60 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Despertar Bênção</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Falta {skill.cost - axePoints} Axé</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
