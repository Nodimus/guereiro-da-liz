/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemyType, OrixaType } from './types';

// ==================== COMBAT FRAME DATA & TIMINGS ====================

export interface AttackFrameData {
  phase: number;
  startup: number;   // Window before blade reaches impact point
  active: number;    // Window where hit detection is active
  recovery: number;  // Recovery window after impact
  totalDuration: number;
  range: number;     // Effective range in meters
  arcCos: number;    // Cosine of half-arc angle for dot product check
  damageMultiplier: number;
  staggerDuration: number;
  pushback: number;
  canDodgeCancelFrom: number; // Earliest timestamp (relative to attack start) to allow dodge-cancel
}

export const LIGHT_ATTACK_COMBOS: AttackFrameData[] = [
  // Phase 0: Horizontal Slash Right (Quick opener)
  {
    phase: 0,
    startup: 0.08,
    active: 0.16,
    recovery: 0.12,
    totalDuration: 0.36,
    range: 3.0,
    arcCos: 0.25, // ~150° forward arc
    damageMultiplier: 1.0,
    staggerDuration: 0.25,
    pushback: 0.6,
    canDodgeCancelFrom: 0.22,
  },
  // Phase 1: Cross Slash Left (Follow-through)
  {
    phase: 1,
    startup: 0.07,
    active: 0.15,
    recovery: 0.14,
    totalDuration: 0.36,
    range: 3.2,
    arcCos: 0.25,
    damageMultiplier: 1.15,
    staggerDuration: 0.28,
    pushback: 0.8,
    canDodgeCancelFrom: 0.20,
  },
  // Phase 2: Dual Upward Thrust / Cleave (High stagger)
  {
    phase: 2,
    startup: 0.09,
    active: 0.18,
    recovery: 0.16,
    totalDuration: 0.43,
    range: 3.5,
    arcCos: 0.45, // ~125° focused forward cone
    damageMultiplier: 1.35,
    staggerDuration: 0.35,
    pushback: 1.1,
    canDodgeCancelFrom: 0.25,
  },
  // Phase 3: 360° Whirlwind Finisher (Crowd clearing knockback)
  {
    phase: 3,
    startup: 0.12,
    active: 0.22,
    recovery: 0.20,
    totalDuration: 0.54,
    range: 3.8,
    arcCos: -1.0, // Full 360 degrees
    damageMultiplier: 1.85,
    staggerDuration: 0.55,
    pushback: 1.8,
    canDodgeCancelFrom: 0.32,
  },
];

export const HEAVY_ATTACK_FRAME_DATA: AttackFrameData = {
  phase: -1,
  startup: 0.20,     // Windup jump
  active: 0.18,      // Earth slam impact
  recovery: 0.24,    // Follow-through recovery
  totalDuration: 0.62,
  range: 4.8,
  arcCos: -1.0,      // Full 360° ground shockwave
  damageMultiplier: 2.5,
  staggerDuration: 0.65,
  pushback: 2.4,
  canDodgeCancelFrom: 0.38,
};

export const DODGE_FRAME_DATA = {
  totalDuration: 0.42,
  invulnerableStart: 0.04,  // I-Frames start quickly
  invulnerableEnd: 0.30,    // 0.26s total invincible window
  rollSpeed: 16.5,
};

export const COMBO_RESET_TIMEOUT = 1.1; // Seconds of inactivity before combo resets to phase 0
export const INPUT_BUFFER_WINDOW = 0.24; // Seconds to queue next attack if pressed during active/recovery

// ==================== ENEMY BEHAVIOR ARCHETYPES ====================

export interface EnemyCombatConfig {
  attackRange: number;
  windupDuration: number;
  activeDuration: number;
  recoveryDuration: number;
  baseDefense: number;
  staggerResist: number; // 0 = standard, 1 = super-armor boss
  pushbackResist: number; // 0 = standard, 1 = immovable boss
}

export const ENEMY_COMBAT_CONFIGS: Record<EnemyType, EnemyCombatConfig> = {
  corpo_seco: {
    attackRange: 2.2,
    windupDuration: 0.45,
    activeDuration: 0.18,
    recoveryDuration: 0.40,
    baseDefense: 8,
    staggerResist: 0.0,
    pushbackResist: 0.0,
  },
  saci: {
    attackRange: 2.6,
    windupDuration: 0.38,
    activeDuration: 0.16,
    recoveryDuration: 0.35,
    baseDefense: 12,
    staggerResist: 0.1,
    pushbackResist: 0.1,
  },
  curupira: {
    attackRange: 3.2,
    windupDuration: 0.52,
    activeDuration: 0.20,
    recoveryDuration: 0.48,
    baseDefense: 18,
    staggerResist: 0.25,
    pushbackResist: 0.2,
  },
  boitata: {
    attackRange: 4.0,
    windupDuration: 0.62,
    activeDuration: 0.26,
    recoveryDuration: 0.55,
    baseDefense: 25,
    staggerResist: 0.5,
    pushbackResist: 0.4,
  },
  mapinguari: {
    attackRange: 5.2,
    windupDuration: 0.82,
    activeDuration: 0.32,
    recoveryDuration: 0.85,
    baseDefense: 40,
    staggerResist: 0.85, // Heavy boss super-armor
    pushbackResist: 0.8,
  },
};

// ==================== DAMAGE & MITIGATION FORMULAS ====================

export interface DamageCalculationResult {
  finalDamage: number;
  isCrit: boolean;
  isArmorBreak: boolean;
  elementColor: string;
}

export function calculatePlayerDamage(
  attackerPower: number,
  moveMultiplier: number,
  targetDefense: number,
  activeOrixa: OrixaType,
  isHeavy: boolean
): DamageCalculationResult {
  let critChance = 0.15;
  let critMultiplier = 1.75;
  let armorPenetration = 0;
  let elementColor = '#38bdf8'; // Ogum blue

  switch (activeOrixa) {
    case 'ogum':
      // Ogum: Forged iron sharp cuts (+15% base damage)
      attackerPower *= 1.15;
      elementColor = '#38bdf8';
      break;
    case 'xango':
      // Xangô: Volcanic impact ignores 35% of enemy armor
      elementColor = '#f97316';
      if (isHeavy) {
        armorPenetration = 0.45;
      }
      break;
    case 'iansa':
      // Iansã: Lightning speed strikes (+10% crit chance)
      critChance += 0.10;
      elementColor = '#facc15';
      break;
    case 'oxossi':
      // Oxóssi: Hunter's lethal precision (+25% crit chance, 2.0x crit damage)
      critChance += 0.25;
      critMultiplier = 2.0;
      elementColor = '#4ade80';
      break;
    case 'oxum':
      // Oxum: Golden vital flow
      elementColor = '#fef08a';
      break;
  }

  const effectiveDefense = Math.max(0, targetDefense * (1 - armorPenetration));
  const defenseMitigation = 100 / (100 + effectiveDefense);
  const rawDamage = attackerPower * moveMultiplier * defenseMitigation;

  const isCrit = Math.random() < critChance;
  const finalDamage = Math.max(1, Math.round(rawDamage * (isCrit ? critMultiplier : 1.0)));

  return {
    finalDamage,
    isCrit,
    isArmorBreak: armorPenetration > 0,
    elementColor,
  };
}

export function calculateEnemyDamageToPlayer(
  enemyAttack: number,
  playerDefense: number,
  activeOrixa: OrixaType
): number {
  let effectiveDefense = playerDefense;
  if (activeOrixa === 'oxum') {
    effectiveDefense += 15; // Oxum golden shield blessing
  }
  const mitigation = 100 / (100 + effectiveDefense * 1.5);
  const raw = enemyAttack * mitigation;
  return Math.max(4, Math.round(raw));
}

// Check if player is currently in I-Frames during dodge
export function isDodgeInvulnerable(dodgeProgressTime: number): boolean {
  return (
    dodgeProgressTime >= DODGE_FRAME_DATA.invulnerableStart &&
    dodgeProgressTime <= DODGE_FRAME_DATA.invulnerableEnd
  );
}
