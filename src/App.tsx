/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameOverModal, PauseModal, VictoryModal } from './components/GameModals';
import { HUD } from './components/HUD';
import { SkillTreeModal } from './components/SkillTreeModal';
import { TitleScreen } from './components/TitleScreen';
import { soundManager } from './game/audio';
import { GameEngine } from './game/engine';
import { DamageNumber, EnemyStats, OrixaType, PlayerStats, SkillNode } from './game/types';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // UI State
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'gameover' | 'victory'>('title');
  const [stats, setStats] = useState<PlayerStats>({
    hp: 100,
    maxHp: 100,
    axe: 100,
    maxAxe: 100,
    axePoints: 120,
    attackPower: 25,
    defense: 10,
    speed: 8.5,
    level: 1,
    comboCount: 0,
    comboScore: 0,
    comboRank: 'D',
    activeOrixa: 'ogum',
  });
  const [boss, setBoss] = useState<EnemyStats | null>(null);
  const [cooldowns, setCooldowns] = useState<Record<OrixaType, number>>({
    ogum: 0,
    xango: 0,
    iansa: 0,
    oxossi: 0,
    oxum: 0,
  });
  const [damagePopups, setDamagePopups] = useState<DamageNumber[]>([]);
  const [waveNotification, setWaveNotification] = useState<{ title: string; subtitle: string } | null>(null);
  const [executionPrompt, setExecutionPrompt] = useState<{ show: boolean; enemyName?: string }>({ show: false });
  const [showSkillTree, setShowSkillTree] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const waveTimeoutRef = useRef<number | null>(null);

  // Initialize Three.js Game Engine once on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current, {
      onStatsUpdate: (newStats) => setStats(newStats),
      onBossUpdate: (newBoss) => setBoss(newBoss),
      onSkillCooldowns: (newCooldowns) => setCooldowns(newCooldowns),
      onDamagePopups: (popups) => setDamagePopups(popups),
      onGameStateChange: (newState) => setGameState(newState),
      onWaveNotification: (title, subtitle) => {
        setWaveNotification({ title, subtitle });
        if (waveTimeoutRef.current) window.clearTimeout(waveTimeoutRef.current);
        waveTimeoutRef.current = window.setTimeout(() => setWaveNotification(null), 4000);
      },
      onExecutionPrompt: (show, enemyName) => {
        setExecutionPrompt({ show, enemyName });
      },
    });

    engineRef.current = engine;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Toggle Skill Tree with Tab or B (Bênçãos) - KeyK reserved for Heavy Attack
      if (e.code === 'Tab' || e.code === 'KeyB') {
        e.preventDefault();
        setShowSkillTree((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      if (waveTimeoutRef.current) {
        window.clearTimeout(waveTimeoutRef.current);
        waveTimeoutRef.current = null;
      }
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Handlers
  const handleStartGame = () => {
    engineRef.current?.startGame();
  };

  const handlePause = () => {
    engineRef.current?.pauseGame();
  };

  const handleResume = () => {
    engineRef.current?.resumeGame();
  };

  const handleRestart = () => {
    engineRef.current?.startGame();
  };

  const handleSwitchStance = (orixa: OrixaType) => {
    engineRef.current?.switchStance(orixa);
  };

  const handleTriggerSkill = () => {
    engineRef.current?.triggerActiveSkill();
  };

  const handleTriggerUltimate = () => {
    engineRef.current?.triggerUltimate();
  };

  const handleTriggerDodge = () => {
    engineRef.current?.triggerDodge();
  };

  const handleTriggerExecution = () => {
    engineRef.current?.triggerExecution();
  };

  const handleUnlockSkill = (skillId: string): boolean => {
    if (!engineRef.current) return false;
    return engineRef.current.unlockSkill(skillId);
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Isolated Three.js WebGL Canvas Mount Container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full cursor-crosshair z-0"
      />

      {/* Floating 3D Damage Numbers */}
      {damagePopups.map((popup) => (
        <div
          key={popup.id}
          className="absolute pointer-events-none font-mono font-black text-sm md:text-base transition-opacity duration-100 z-20"
          style={{
            left: `${popup.x}px`,
            top: `${popup.y}px`,
            color: popup.color,
            opacity: popup.opacity,
            transform: `translate(-50%, -50%) scale(${popup.isCrit ? 1.35 : 1})`,
            textShadow: '0 0 10px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.9)',
          }}
        >
          {popup.text}
        </div>
      ))}

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          onStart={handleStartGame}
          onOpenSkills={() => setShowSkillTree(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Playing HUD Overlay */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <HUD
          stats={stats}
          boss={boss}
          cooldowns={cooldowns}
          waveNotification={waveNotification}
          executionPrompt={executionPrompt}
          onSwitchStance={handleSwitchStance}
          onTriggerSkill={handleTriggerSkill}
          onTriggerUltimate={handleTriggerUltimate}
          onTriggerDodge={handleTriggerDodge}
          onTriggerExecution={handleTriggerExecution}
          onOpenSkills={() => setShowSkillTree(true)}
          onPause={handlePause}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Modals */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onOpenSkills={() => setShowSkillTree(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {gameState === 'gameover' && (
        <GameOverModal stats={stats} onRestart={handleRestart} />
      )}

      {gameState === 'victory' && (
        <VictoryModal stats={stats} onRestart={handleRestart} />
      )}

      {/* Ancestral Skill Tree Modal (Árvore de Ifá) */}
      {showSkillTree && engineRef.current && (
        <SkillTreeModal
          skills={engineRef.current.skills}
          axePoints={stats.axePoints}
          onUnlockSkill={handleUnlockSkill}
          onClose={() => setShowSkillTree(false)}
        />
      )}
    </div>
  );
}
