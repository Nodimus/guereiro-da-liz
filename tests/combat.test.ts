/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePlayerDamage,
  calculateEnemyDamageToPlayer,
  isDodgeInvulnerable,
  LIGHT_ATTACK_COMBOS,
  HEAVY_ATTACK_FRAME_DATA,
  DODGE_FRAME_DATA,
  ENEMY_COMBAT_CONFIGS,
} from '../src/game/combat';

describe('Combat System - Damage Calculations', () => {
  test('Player damage decreases with higher target defense', () => {
    const lowDefResult = calculatePlayerDamage(50, 1.0, 10, 'ogum', false);
    const highDefResult = calculatePlayerDamage(50, 1.0, 100, 'ogum', false);

    assert.ok(
      lowDefResult.finalDamage > highDefResult.finalDamage,
      `Damage against 10 def (${lowDefResult.finalDamage}) should be higher than against 100 def (${highDefResult.finalDamage})`
    );
  });

  test('Ogum stance applies +15% attack power bonus', () => {
    // Non-crit scenario check
    const ogumDmg = calculatePlayerDamage(100, 1.0, 0, 'ogum', false);
    // Base 100 * 1.15 = 115 minimum (or higher if crit)
    assert.ok(ogumDmg.finalDamage >= 115, `Ogum damage should be at least 115, got ${ogumDmg.finalDamage}`);
  });

  test('Xango heavy attack triggers armor penetration', () => {
    const xangoHeavy = calculatePlayerDamage(100, 1.0, 50, 'xango', true);
    assert.equal(xangoHeavy.isArmorBreak, true, 'Xango heavy attack should flag armor break');
  });

  test('Enemy damage to player is mitigated by player defense', () => {
    const dmgLowDef = calculateEnemyDamageToPlayer(40, 5, 'ogum');
    const dmgHighDef = calculateEnemyDamageToPlayer(40, 40, 'ogum');

    assert.ok(
      dmgLowDef > dmgHighDef,
      `Damage against 5 def (${dmgLowDef}) must be greater than against 40 def (${dmgHighDef})`
    );
  });

  test('Oxum stance provides defensive bonus against enemy damage', () => {
    const dmgOgum = calculateEnemyDamageToPlayer(40, 10, 'ogum');
    const dmgOxum = calculateEnemyDamageToPlayer(40, 10, 'oxum');

    assert.ok(
      dmgOxum <= dmgOgum,
      `Oxum damage taken (${dmgOxum}) should be <= standard damage taken (${dmgOgum})`
    );
  });
});

describe('Combat System - Frame Data & I-Frames', () => {
  test('Light attack combo has 4 progression phases with increasing damage', () => {
    assert.equal(LIGHT_ATTACK_COMBOS.length, 4);

    for (let i = 0; i < LIGHT_ATTACK_COMBOS.length - 1; i++) {
      assert.ok(
        LIGHT_ATTACK_COMBOS[i + 1].damageMultiplier >= LIGHT_ATTACK_COMBOS[i].damageMultiplier,
        `Phase ${i + 1} multiplier must be >= Phase ${i}`
      );
    }
  });

  test('Every attack phase allows dodge-canceling during recovery', () => {
    LIGHT_ATTACK_COMBOS.forEach((combo) => {
      assert.ok(
        combo.canDodgeCancelFrom < combo.totalDuration,
        `Phase ${combo.phase} must allow dodge cancel before total duration finishes`
      );
    });

    assert.ok(
      HEAVY_ATTACK_FRAME_DATA.canDodgeCancelFrom < HEAVY_ATTACK_FRAME_DATA.totalDuration,
      'Heavy attack must allow dodge cancel in recovery'
    );
  });

  test('Dodge roll invulnerability window (I-Frames) is precisely bounded', () => {
    // Before invulnerable start
    assert.equal(isDodgeInvulnerable(0.01), false, '0.01s should be vulnerable startup');
    // Inside I-frames
    assert.equal(isDodgeInvulnerable(0.15), true, '0.15s should be invulnerable');
    assert.equal(isDodgeInvulnerable(DODGE_FRAME_DATA.invulnerableStart), true);
    assert.equal(isDodgeInvulnerable(DODGE_FRAME_DATA.invulnerableEnd), true);
    // After invulnerable end (recovery)
    assert.equal(isDodgeInvulnerable(0.38), false, '0.38s should be vulnerable recovery');
  });

  test('Enemy configs define full combat telegraph cycles', () => {
    const enemyTypes = ['corpo_seco', 'saci', 'curupira', 'boitata', 'mapinguari'] as const;

    enemyTypes.forEach((type) => {
      const config = ENEMY_COMBAT_CONFIGS[type];
      assert.ok(config.attackRange > 0, `${type} must have positive attack range`);
      assert.ok(config.windupDuration > 0, `${type} must have telegraph windup duration`);
      assert.ok(config.activeDuration > 0, `${type} must have active attack duration`);
      assert.ok(config.recoveryDuration > 0, `${type} must have recovery duration`);
    });

    // Mapinguari boss should have the highest stagger resist (super-armor)
    assert.ok(
      ENEMY_COMBAT_CONFIGS.mapinguari.staggerResist > ENEMY_COMBAT_CONFIGS.corpo_seco.staggerResist,
      'Boss must have higher stagger resistance than base minions'
    );
  });
});
