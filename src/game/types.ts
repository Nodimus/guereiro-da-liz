/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OrixaType = 'ogum' | 'xango' | 'iansa' | 'oxossi' | 'oxum';

export interface OrixaData {
  id: OrixaType;
  name: string;
  title: string;
  element: string;
  color: string;
  accentColor: string;
  weaponName: string;
  description: string;
  skillName: string;
  skillDesc: string;
  skillCooldown: number; // in seconds
  icon: string;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  axe: number; // Spiritual energy (Mana / Ultimate resource)
  maxAxe: number;
  axePoints: number; // Progression currency earned to unlock skills
  attackPower: number;
  defense: number;
  speed: number;
  level: number;
  comboCount: number;
  comboScore: number;
  comboRank: 'D' | 'C' | 'B' | 'A' | 'S' | 'SSS';
  activeOrixa: OrixaType;
}

export type EnemyType = 'corpo_seco' | 'saci' | 'curupira' | 'boitata' | 'mapinguari';

export interface EnemyStats {
  id: string;
  type: EnemyType;
  name: string;
  title: string;
  hp: number;
  maxHp: number;
  attackPower: number;
  speed: number;
  isBoss: boolean;
  canBeExecuted: boolean;
  state: 'idle' | 'patrol' | 'chase' | 'windup' | 'attack' | 'hit' | 'stunned' | 'dying';
}

export interface DamageNumber {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  isCrit: boolean;
  opacity: number;
}

export interface SkillNode {
  id: string;
  name: string;
  orixa: OrixaType;
  cost: number;
  unlocked: boolean;
  description: string;
  effectType: 'passive_atk' | 'passive_hp' | 'passive_axe' | 'combo_ext' | 'skill_enhance' | 'ultimate';
  tier: number;
  iconName: string;
}
