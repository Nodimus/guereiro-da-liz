/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Swords,
  Flame,
  Wind,
  Crosshair,
  Sparkles,
  Zap,
  Shield,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  BookOpen,
} from 'lucide-react';
import { ORIXAS_CONFIG } from '../game/constants';
import { EnemyStats, OrixaType, PlayerStats } from '../game/types';

interface HUDProps {
  stats: PlayerStats;
  boss: EnemyStats | null;
  cooldowns: Record<OrixaType, number>;
  waveNotification: { title: string; subtitle: string } | null;
  executionPrompt: { show: boolean; enemyName?: string };
  onSwitchStance: (orixa: OrixaType) => void;
  onTriggerSkill: () => void;
  onTriggerUltimate: () => void;
  onTriggerDodge: () => void;
  onTriggerExecution: () => void;
  onOpenSkills: () => void;
  onPause: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  boss,
  cooldowns,
  waveNotification,
  executionPrompt,
  onSwitchStance,
  onTriggerSkill,
  onTriggerUltimate,
  onTriggerDodge,
  onTriggerExecution,
  onOpenSkills,
  onPause,
  isMuted,
  onToggleMute,
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  const activeOrixaData = ORIXAS_CONFIG[stats.activeOrixa];
  const activeCooldown = cooldowns[stats.activeOrixa] || 0;
  const isUltimateReady = stats.axe >= 75;

  const hpPercent = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const axePercent = Math.max(0, Math.min(100, (stats.axe / stats.maxAxe) * 100));

  // Combo Rank Colors
  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'SSS':
        return 'text-amber-300 drop-shadow-[0_0_15px_rgba(252,211,77,0.9)]';
      case 'S':
        return 'text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.8)]';
      case 'A':
        return 'text-red-400';
      case 'B':
        return 'text-sky-400';
      case 'C':
        return 'text-emerald-400';
      default:
        return 'text-zinc-400';
    }
  };

  return (
    <div className="absolute inset-0 z-30 pointer-events-none select-none flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      {/* ================= TOP PERIMETER STATUS CLUSTERS ================= */}
      <div className="flex justify-between items-start w-full">
        {/* Top-Left: Hero Health, Axé and Active Orixá */}
        <div className="pointer-events-auto flex items-start gap-3.5 bg-zinc-950/85 border border-zinc-800/80 p-3.5 rounded-2xl shadow-2xl backdrop-blur-none max-w-sm">
          {/* Active Orixá Emblem */}
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border shadow-inner transition-colors"
            style={{
              borderColor: activeOrixaData.color,
              backgroundColor: `${activeOrixaData.color}22`,
            }}
          >
            {stats.activeOrixa === 'ogum' && <Swords className="w-7 h-7 text-sky-400" />}
            {stats.activeOrixa === 'xango' && <Flame className="w-7 h-7 text-orange-400" />}
            {stats.activeOrixa === 'iansa' && <Wind className="w-7 h-7 text-yellow-400" />}
            {stats.activeOrixa === 'oxossi' && <Crosshair className="w-7 h-7 text-emerald-400" />}
            {stats.activeOrixa === 'oxum' && <Sparkles className="w-7 h-7 text-amber-300" />}
          </div>

          {/* Health & Mana Gauges */}
          <div className="flex-1 min-w-[170px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-100 flex items-center gap-1.5">
                <span>KALU</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 font-medium">
                  {activeOrixaData.name}
                </span>
              </span>
              <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
                {Math.round(stats.hp)} / {stats.maxHp}
              </span>
            </div>

            {/* Health Bar */}
            <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-700/60 p-[1px] mb-2">
              <div
                className="h-full rounded-full transition-all duration-150 ease-out"
                style={{
                  width: `${hpPercent}%`,
                  background: 'linear-gradient(90deg, #dc2626, #ef4444, #f87171)',
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
                }}
              />
            </div>

            {/* Axé (Energy) Bar */}
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-0.5 font-medium">
              <span className="flex items-center gap-1 text-sky-400 font-bold">
                <Zap className="w-3 h-3" /> AXÉ
              </span>
              <span className="font-mono tabular-nums">{Math.round(stats.axe)}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-700/60 p-[1px]">
              <div
                className="h-full rounded-full transition-all duration-150 ease-out"
                style={{
                  width: `${axePercent}%`,
                  background: `linear-gradient(90deg, #0284c7, ${activeOrixaData.accentColor})`,
                  boxShadow: `0 0 8px ${activeOrixaData.accentColor}88`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Top-Center: Boss Health Bar (if active) */}
        {boss && boss.hp > 0 && (
          <div className="pointer-events-none flex flex-col items-center max-w-md w-full px-4">
            <div className="flex items-center justify-between w-full mb-1 text-xs">
              <span className="font-mythic font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                {boss.name}
              </span>
              <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
                {Math.round(boss.hp)} / {boss.maxHp}
              </span>
            </div>
            <div className="w-full h-3.5 bg-black/80 rounded-full border border-red-900/80 p-[1px] shadow-[0_0_20px_rgba(220,38,38,0.4)]">
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`,
                  background: 'linear-gradient(90deg, #7f1d1d, #dc2626, #f97316)',
                }}
              />
            </div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest mt-0.5">
              {boss.title}
            </span>
          </div>
        )}

        {/* Top-Right: Combo Rank & Axé Currency */}
        <div className="pointer-events-auto flex flex-col items-end gap-2.5">
          {/* Axé Points Currency Badge */}
          <div className="flex items-center gap-2 bg-zinc-950/85 border border-amber-500/40 px-3.5 py-1.5 rounded-xl shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 uppercase block font-semibold leading-none">
                Pontos de Axé
              </span>
              <span className="text-sm font-extrabold text-amber-300 font-mono tabular-nums leading-tight">
                {stats.axePoints}
              </span>
            </div>
          </div>

          {/* Dynamic Combo Rank Meter */}
          {stats.comboCount > 0 && (
            <div className="flex flex-col items-end pr-1">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-4xl md:text-5xl font-extrabold font-mythic ${getRankColor(stats.comboRank)}`}>
                  {stats.comboRank}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  RANK
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-amber-400 tracking-wider">
                {stats.comboCount} <span className="text-zinc-400 font-sans">GOLPES</span>
              </div>
            </div>
          )}

          {/* Quick Header Buttons: Skill Tree, Pause, Sound */}
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={onOpenSkills}
              title="Abrir Bênçãos de Ifá"
              className="p-2 rounded-lg bg-zinc-900/90 border border-amber-500/40 text-amber-400 hover:bg-zinc-800 transition-colors shadow-md cursor-pointer flex items-center gap-1.5 text-xs font-bold px-2.5"
            >
              <BookOpen className="w-4 h-4" />
              <span>Bênçãos</span>
            </button>

            <button
              onClick={onToggleMute}
              className="p-2 rounded-lg bg-zinc-900/90 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors shadow-md cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

            <button
              onClick={onPause}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs font-bold transition-colors shadow-md cursor-pointer"
            >
              Pausa
            </button>
          </div>
        </div>
      </div>

      {/* ================= CENTER NOTIFICATIONS ================= */}
      {/* Wave Toast */}
      {waveNotification && (
        <div className="mx-auto my-auto text-center pointer-events-none transition-all duration-300 transform scale-100">
          <div className="bg-black/90 border border-amber-500/50 px-8 py-4 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.4)]">
            <h3 className="text-xl md:text-2xl font-extrabold font-mythic text-amber-300 tracking-wider">
              {waveNotification.title}
            </h3>
            <p className="text-xs md:text-sm text-zinc-300 mt-1 font-medium">
              {waveNotification.subtitle}
            </p>
          </div>
        </div>
      )}

      {/* God of War Visceral Execution Prompt */}
      {executionPrompt.show && (
        <div className="mx-auto mb-6 pointer-events-auto">
          <button
            onClick={onTriggerExecution}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-sm md:text-base tracking-wider shadow-[0_0_35px_rgba(239,68,68,0.8)] border border-red-300 flex items-center gap-3 cursor-pointer active:scale-95 transition-transform"
          >
            <span className="w-7 h-7 rounded-lg bg-black text-amber-400 font-mono font-bold flex items-center justify-center text-xs border border-amber-400">
              E
            </span>
            <span>EXECUTAR {executionPrompt.enemyName?.toUpperCase() || 'INIMIGO'}!</span>
          </button>
        </div>
      )}

      {/* ================= COLLAPSIBLE BOTTOM DOCK (ZERO VIEWPORT OCCLUSION) ================= */}
      <div className="w-full flex flex-col items-center pointer-events-none pb-1">
        {/* Dock Collapse Toggle */}
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="pointer-events-auto mb-2 px-3 py-1 rounded-full bg-zinc-950/80 border border-zinc-800 text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all shadow-md flex items-center gap-1 cursor-pointer"
        >
          {isDockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Mostrar Controles</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Ocultar Painel</span>
            </>
          )}
        </button>

        {/* Main Dock Container */}
        <div
          className={`pointer-events-auto transition-all duration-300 ease-out transform ${
            isDockCollapsed
              ? 'translate-y-32 opacity-0 pointer-events-none'
              : 'translate-y-0 opacity-100'
          } bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-3 shadow-2xl flex flex-wrap items-center justify-center gap-3 md:gap-4 max-w-4xl`}
        >
          {/* Stance Quick-Switches (1 to 5) */}
          <div className="flex items-center gap-1.5 border-r border-zinc-800 pr-3">
            {(['ogum', 'xango', 'iansa', 'oxossi', 'oxum'] as OrixaType[]).map((orixaKey, idx) => {
              const data = ORIXAS_CONFIG[orixaKey];
              const isActive = stats.activeOrixa === orixaKey;
              const cd = cooldowns[orixaKey] || 0;

              return (
                <button
                  key={orixaKey}
                  onClick={() => onSwitchStance(orixaKey)}
                  className={`relative p-2.5 rounded-xl border flex flex-col items-center justify-center min-w-[56px] transition-all cursor-pointer ${
                    isActive
                      ? 'border-amber-400 bg-amber-500/20 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-zinc-500 absolute top-1 left-1.5">
                    {idx + 1}
                  </span>
                  <div className="mt-1">
                    {orixaKey === 'ogum' && <Swords className="w-5 h-5 text-sky-400" />}
                    {orixaKey === 'xango' && <Flame className="w-5 h-5 text-orange-400" />}
                    {orixaKey === 'iansa' && <Wind className="w-5 h-5 text-yellow-400" />}
                    {orixaKey === 'oxossi' && <Crosshair className="w-5 h-5 text-emerald-400" />}
                    {orixaKey === 'oxum' && <Sparkles className="w-5 h-5 text-amber-300" />}
                  </div>
                  <span className="text-[10px] font-bold mt-1 tracking-tight">{data.name}</span>

                  {/* Cooldown overlay */}
                  {cd > 0 && (
                    <div className="absolute inset-0 bg-black/75 rounded-xl flex items-center justify-center text-xs font-mono font-bold text-amber-400">
                      {Math.ceil(cd)}s
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-2">
            {/* Active Special Ability (Q) */}
            <button
              onClick={onTriggerSkill}
              disabled={activeCooldown > 0}
              className={`px-4 py-2.5 rounded-xl border flex items-center gap-2.5 font-bold text-xs tracking-wider transition-all cursor-pointer ${
                activeCooldown > 0
                  ? 'border-zinc-800 bg-zinc-900/50 text-zinc-500 cursor-not-allowed'
                  : 'border-sky-500/50 bg-sky-950/60 hover:bg-sky-900 text-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
              }`}
            >
              <span className="px-1.5 py-0.5 rounded bg-sky-900/80 text-sky-300 font-mono text-[10px] border border-sky-600/40">
                Q
              </span>
              <div className="text-left">
                <span className="block text-[11px] font-extrabold text-white">
                  {activeOrixaData.skillName}
                </span>
                <span className="text-[9px] text-sky-300/80">
                  {activeCooldown > 0 ? `Espera: ${Math.ceil(activeCooldown)}s` : 'Pronto'}
                </span>
              </div>
            </button>

            {/* Ultimate Axé Supremo (R) */}
            <button
              onClick={onTriggerUltimate}
              disabled={!isUltimateReady}
              className={`px-4 py-2.5 rounded-xl border flex items-center gap-2.5 font-extrabold text-xs tracking-wider transition-all cursor-pointer ${
                isUltimateReady
                  ? 'border-amber-400 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.6)] active:scale-95'
                  : 'border-zinc-800 bg-zinc-900/40 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <span className="px-1.5 py-0.5 rounded bg-black/40 text-amber-200 font-mono text-[10px]">
                R
              </span>
              <div className="text-left">
                <span className="block text-[11px] font-black uppercase">Fúria Suprema</span>
                <span className="text-[9px] opacity-90">
                  {isUltimateReady ? 'ATIVAR AXÉ (100%)' : `Axé: ${Math.round(stats.axe)}/75`}
                </span>
              </div>
            </button>

            {/* Dodge Roll (Space) */}
            <button
              onClick={onTriggerDodge}
              className="px-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span className="px-1 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400">
                Espaço
              </span>
              <span>Esquiva</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
