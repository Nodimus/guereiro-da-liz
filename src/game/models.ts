/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { OrixaType } from './types';

// Pre-allocated math vectors for zero GC
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();

// Procedural Canvas Textures for PBR
export function createRuneTexture(colorHex: string, bgHex = '#1a1008'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 512);

  // Draw ancient Yoruba / Ponto Riscado ritual geometric lines
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 14;
  ctx.shadowColor = colorHex;
  ctx.shadowBlur = 25;

  ctx.beginPath();
  // Central ritual cross & circles
  ctx.arc(256, 256, 180, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(256, 256, 120, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(256, 40);
  ctx.lineTo(256, 472);
  ctx.moveTo(40, 256);
  ctx.lineTo(472, 256);
  ctx.stroke();

  // Diagonal arrows (Ogum & Oxóssi arrows)
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(130, 130);
  ctx.lineTo(382, 382);
  ctx.moveTo(130, 382);
  ctx.lineTo(382, 130);
  ctx.stroke();

  // Sacred stars & dots
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const x = 256 + Math.cos(angle) * 150;
    const y = 256 + Math.sin(angle) * 150;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Procedural Bark Texture for Forest & Tree Guardians
export function createBarkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#2d1e12';
  ctx.fillRect(0, 0, 512, 512);

  // Fiber lines
  ctx.strokeStyle = '#180f08';
  for (let i = 0; i < 200; i++) {
    ctx.lineWidth = Math.random() * 4 + 1;
    ctx.beginPath();
    const x = Math.random() * 512;
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(
      x + (Math.random() - 0.5) * 30,
      170,
      x + (Math.random() - 0.5) * 30,
      340,
      x + (Math.random() - 0.5) * 20,
      512
    );
    ctx.stroke();
  }

  // Moss spots
  ctx.fillStyle = 'rgba(46, 85, 33, 0.4)';
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 30 + 10, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Procedural Fire Scales for Boitatá
export function createFireScalesTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#7f1d1d');
  grad.addColorStop(0.5, '#ea580c');
  grad.addColorStop(1, '#facc15');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 3;
  const step = 32;
  for (let y = 0; y < 512; y += step) {
    for (let x = 0; x < 512; x += step) {
      ctx.beginPath();
      ctx.arc(x + (y % (step * 2) === 0 ? 0 : step / 2), y, step * 0.7, 0, Math.PI);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ==================== HERO CHARACTER (KALU - GUERREIRO ANCESTRAL) ====================

export interface HeroModelGroup extends THREE.Group {
  parts: {
    torso: THREE.Mesh;
    chestArmor: THREE.Mesh;
    head: THREE.Mesh;
    headCrown: THREE.Mesh;
    leftArmPivot: THREE.Group;
    rightArmPivot: THREE.Group;
    leftLegPivot: THREE.Group;
    rightLegPivot: THREE.Group;
    bladeLeft: THREE.Group;
    bladeRight: THREE.Group;
    xangoAxe: THREE.Group;
    iansaBlade: THREE.Group;
    oxossiBow: THREE.Group;
    oxumShield: THREE.Group;
    auraAxeRing: THREE.Mesh;
    runicMarkings: THREE.Mesh[];
  };
  setStance: (orixa: OrixaType) => void;
  animateMovement: (speed: number, time: number) => void;
  playAttackPose: (comboIndex: number, progress: number) => void;
  playHeavyPose: (progress: number) => void;
  playDodgePose: (progress: number) => void;
}

export function createHeroModel(): HeroModelGroup {
  const hero = new THREE.Group() as HeroModelGroup;
  hero.name = 'Hero_Kalu';

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x4a2e1b, // Rich bronze dark skin
    roughness: 0.65,
    metalness: 0.1,
  });

  const kiltMat = new THREE.MeshStandardMaterial({
    color: 0xc2410c, // Sacred vermilion / white Yoruba cloth
    roughness: 0.8,
    metalness: 0.05,
  });

  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x27272a, // Ogum forged darkened iron
    roughness: 0.25,
    metalness: 0.85,
  });

  const goldBrassMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Antique African brass & gold
    roughness: 0.3,
    metalness: 0.8,
  });

  const runeMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.2,
    roughness: 0.2,
  });

  const bladeMetalMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.15,
    metalness: 0.95,
  });

  const flameGlowMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xea580c,
    emissiveIntensity: 1.5,
    roughness: 0.3,
  });

  // --- 1. TORSO & CORE ---
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 1.0;

  // Athletic muscular torso
  const torsoGeo = new THREE.CylinderGeometry(0.38, 0.28, 0.75, 8);
  const torso = new THREE.Mesh(torsoGeo, skinMat);
  torso.castShadow = true;
  torso.receiveShadow = true;
  torsoGroup.add(torso);

  // Armored Chest Cuirass with cowrie shell brass medallion
  const chestArmorGeo = new THREE.CylinderGeometry(0.4, 0.35, 0.45, 8);
  const chestArmor = new THREE.Mesh(chestArmorGeo, armorMat);
  chestArmor.position.y = 0.12;
  chestArmor.castShadow = true;
  torsoGroup.add(chestArmor);

  // Center Brass Emblem
  const emblemGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12);
  emblemGeo.rotateX(Math.PI / 2);
  const emblem = new THREE.Mesh(emblemGeo, goldBrassMat);
  emblem.position.set(0, 0.15, 0.35);
  torsoGroup.add(emblem);

  // Waist Sash & War Kilt (Pano da Costa)
  const kiltGeo = new THREE.CylinderGeometry(0.32, 0.44, 0.6, 8);
  const kilt = new THREE.Mesh(kiltGeo, kiltMat);
  kilt.position.y = -0.4;
  kilt.castShadow = true;
  torsoGroup.add(kilt);

  // Runic chest markings (Pontos Riscados glowing on chest and shoulders)
  const runeBandGeo = new THREE.TorusGeometry(0.39, 0.02, 6, 16);
  runeBandGeo.rotateX(Math.PI / 2);
  const runeBand = new THREE.Mesh(runeBandGeo, runeMat);
  runeBand.position.y = 0.2;
  torsoGroup.add(runeBand);

  // --- 2. HEAD & ANCESTRAL CREST ---
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.55;

  const headGeo = new THREE.SphereGeometry(0.22, 12, 12);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.castShadow = true;
  headGroup.add(head);

  // Ancestral Braided Crown / War Headdress
  const crownGeo = new THREE.ConeGeometry(0.24, 0.35, 6);
  crownGeo.rotateX(Math.PI);
  const headCrown = new THREE.Mesh(crownGeo, goldBrassMat);
  headCrown.position.set(0, 0.22, -0.05);
  headGroup.add(headCrown);

  // Brass Eyes & Face War Paint
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.04), runeMat);
  eyeL.position.set(0.08, 0.02, 0.2);
  const eyeR = eyeL.clone();
  eyeR.position.x = -0.08;
  headGroup.add(eyeL, eyeR);

  torsoGroup.add(headGroup);

  // --- 3. ARMS & WEAPONS ---
  // Left Arm
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(0.48, 0.3, 0);

  const bicepGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.42, 6);
  bicepGeo.translate(0, -0.2, 0);
  const leftArm = new THREE.Mesh(bicepGeo, skinMat);
  leftArm.castShadow = true;
  leftArmPivot.add(leftArm);

  // Brass Pauldron (Left Shoulder Guard of Ogum)
  const pauldronGeo = new THREE.SphereGeometry(0.18, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const pauldron = new THREE.Mesh(pauldronGeo, armorMat);
  pauldron.position.set(0.02, 0.02, 0);
  leftArmPivot.add(pauldron);

  // Left Forearm with steel bracer
  const forearmGeo = new THREE.CylinderGeometry(0.085, 0.075, 0.4, 6);
  forearmGeo.translate(0, -0.55, 0);
  const leftForearm = new THREE.Mesh(forearmGeo, armorMat);
  leftForearm.castShadow = true;
  leftArmPivot.add(leftForearm);

  // Right Arm
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(-0.48, 0.3, 0);

  const rightArm = new THREE.Mesh(bicepGeo, skinMat);
  rightArm.castShadow = true;
  rightArmPivot.add(rightArm);

  const rightForearm = new THREE.Mesh(forearmGeo, armorMat);
  rightForearm.castShadow = true;
  rightArmPivot.add(rightForearm);

  torsoGroup.add(leftArmPivot, rightArmPivot);

  // --- 4. WEAPONS ATTACHMENTS ---
  // A. Twin Blades of Ogum (Lâminas da Forja)
  function createOgumBlade(): THREE.Group {
    const bladeGroup = new THREE.Group();
    // Handle
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6), armorMat);
    handle.position.y = -0.15;
    // Guard
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.08), goldBrassMat);
    // Blade
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.02), bladeMetalMat);
    blade.position.y = 0.45;
    blade.castShadow = true;
    // Glowing edge
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.85, 0.025), runeMat);
    edge.position.set(0.05, 0.45, 0);

    bladeGroup.add(handle, guard, blade, edge);
    bladeGroup.scale.set(1.2, 1.2, 1.2);
    return bladeGroup;
  }

  const bladeRight = createOgumBlade();
  bladeRight.position.set(0, -0.75, 0.1);
  bladeRight.rotation.x = Math.PI / 2;
  rightArmPivot.add(bladeRight);

  const bladeLeft = createOgumBlade();
  bladeLeft.position.set(0, -0.75, 0.1);
  bladeLeft.rotation.x = Math.PI / 2;
  leftArmPivot.add(bladeLeft);

  // B. Xangô Double Battleaxe (Oxé Flamejante)
  const xangoAxe = new THREE.Group();
  const axeShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), armorMat);
  const axeHeadL = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 3), flameGlowMat);
  axeHeadL.rotation.z = Math.PI / 2;
  axeHeadL.position.set(0.24, 0.5, 0);
  const axeHeadR = axeHeadL.clone();
  axeHeadR.position.x = -0.24;
  xangoAxe.add(axeShaft, axeHeadL, axeHeadR);
  xangoAxe.position.set(0, -0.65, 0.1);
  xangoAxe.rotation.x = Math.PI / 2;
  xangoAxe.visible = false;
  rightArmPivot.add(xangoAxe);

  // C. Iansã Storm Blade (Alfanje dos Ventos)
  const iansaBlade = new THREE.Group();
  const iansaHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 6), goldBrassMat);
  const iansaBladeCurve = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.025), bladeMetalMat);
  iansaBladeCurve.position.set(0.06, 0.55, 0);
  iansaBladeCurve.rotation.z = -0.08;
  const iansaWindGlow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.05, 0.03), runeMat);
  iansaWindGlow.position.set(0.1, 0.55, 0);
  iansaBlade.add(iansaHandle, iansaBladeCurve, iansaWindGlow);
  iansaBlade.position.set(0, -0.75, 0.1);
  iansaBlade.rotation.x = Math.PI / 2;
  iansaBlade.visible = false;
  rightArmPivot.add(iansaBlade);

  // D. Oxóssi Bow (Ofá da Mata)
  const oxossiBow = new THREE.Group();
  const bowCurveGeo = new THREE.TorusGeometry(0.65, 0.035, 6, 16, Math.PI * 0.85);
  bowCurveGeo.rotateZ(-Math.PI / 2);
  const bowCurve = new THREE.Mesh(bowCurveGeo, goldBrassMat);
  const bowString = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.2, 4), bladeMetalMat);
  bowString.position.x = -0.3;
  oxossiBow.add(bowCurve, bowString);
  oxossiBow.position.set(0, -0.7, 0.1);
  oxossiBow.visible = false;
  leftArmPivot.add(oxossiBow);

  // E. Oxum Shield (Abebé de Ouro)
  const oxumShield = new THREE.Group();
  const shieldGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.05, 16);
  shieldGeo.rotateX(Math.PI / 2);
  const shieldMesh = new THREE.Mesh(shieldGeo, goldBrassMat);
  const shieldRune = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.02, 6, 16), flameGlowMat);
  oxumShield.add(shieldMesh, shieldRune);
  oxumShield.position.set(0, -0.5, 0.15);
  oxumShield.visible = false;
  leftArmPivot.add(oxumShield);

  // --- 5. LEGS & GREAVES ---
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(0.2, 0.45, 0);

  const thighGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.5, 6);
  thighGeo.translate(0, -0.25, 0);
  const leftThigh = new THREE.Mesh(thighGeo, skinMat);
  leftThigh.castShadow = true;
  leftLegPivot.add(leftThigh);

  const shinGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.55, 6);
  shinGeo.translate(0, -0.65, 0);
  const leftShin = new THREE.Mesh(shinGeo, armorMat); // Armored Iron Greaves
  leftShin.castShadow = true;
  leftLegPivot.add(leftShin);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(-0.2, 0.45, 0);

  const rightThigh = new THREE.Mesh(thighGeo, skinMat);
  rightThigh.castShadow = true;
  rightLegPivot.add(rightThigh);

  const rightShin = new THREE.Mesh(shinGeo, armorMat);
  rightShin.castShadow = true;
  rightLegPivot.add(rightShin);

  hero.add(torsoGroup, leftLegPivot, rightLegPivot);

  // Ground Contact Shadow Disc
  const shadowGeo = new THREE.CircleGeometry(0.65, 16);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.position.y = 0.02;
  hero.add(shadowMesh);

  // Dynamic Axé Aura Ring (rotates on ground when using skills)
  const auraGeo = new THREE.RingGeometry(0.8, 0.95, 24);
  auraGeo.rotateX(-Math.PI / 2);
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });
  const auraAxeRing = new THREE.Mesh(auraGeo, auraMat);
  auraAxeRing.position.y = 0.04;
  hero.add(auraAxeRing);

  hero.parts = {
    torso,
    chestArmor,
    head,
    headCrown,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    bladeLeft,
    bladeRight,
    xangoAxe,
    iansaBlade,
    oxossiBow,
    oxumShield,
    auraAxeRing,
    runicMarkings: [runeBand, eyeL, eyeR],
  };

  // Stance Switch Method: updates weapon visibility and aura colors
  hero.setStance = (orixa: OrixaType) => {
    // Hide all first
    bladeLeft.visible = false;
    bladeRight.visible = false;
    xangoAxe.visible = false;
    iansaBlade.visible = false;
    oxossiBow.visible = false;
    oxumShield.visible = false;

    let hexColor = 0x38bdf8;
    let emissiveColor = 0x0284c7;

    switch (orixa) {
      case 'ogum':
        bladeLeft.visible = true;
        bladeRight.visible = true;
        hexColor = 0x38bdf8;
        emissiveColor = 0x0284c7;
        break;
      case 'xango':
        xangoAxe.visible = true;
        hexColor = 0xf97316;
        emissiveColor = 0xea580c;
        break;
      case 'iansa':
        iansaBlade.visible = true;
        bladeLeft.visible = true;
        hexColor = 0xfacc15;
        emissiveColor = 0xeab308;
        break;
      case 'oxossi':
        oxossiBow.visible = true;
        hexColor = 0x4ade80;
        emissiveColor = 0x16a34a;
        break;
      case 'oxum':
        oxumShield.visible = true;
        bladeRight.visible = true;
        hexColor = 0xfef08a;
        emissiveColor = 0xeab308;
        break;
    }

    runeMat.color.setHex(hexColor);
    runeMat.emissive.setHex(emissiveColor);
    auraMat.color.setHex(hexColor);
  };

  // Run / Idle Animation
  hero.animateMovement = (speed: number, time: number) => {
    if (speed > 0.1) {
      const freq = speed * 8;
      const swing = Math.sin(time * freq) * 0.6;
      leftLegPivot.rotation.x = swing;
      rightLegPivot.rotation.x = -swing;
      leftArmPivot.rotation.x = -swing * 0.7;
      rightArmPivot.rotation.x = swing * 0.7;
      torsoGroup.position.y = 1.0 + Math.abs(Math.sin(time * freq * 2)) * 0.08;
      headGroup.rotation.y = Math.sin(time * freq) * 0.05;
    } else {
      // Idle breathing
      const breath = Math.sin(time * 2) * 0.04;
      torsoGroup.position.y = 1.0 + breath;
      headGroup.rotation.x = breath * 0.5;
      leftArmPivot.rotation.x = breath * 0.8;
      rightArmPivot.rotation.x = breath * 0.8;
      leftLegPivot.rotation.x = 0;
      rightLegPivot.rotation.x = 0;
    }
    auraAxeRing.rotation.y += 0.02;
  };

  // Attack Pose for Combos
  hero.playAttackPose = (comboIndex: number, progress: number) => {
    const p = Math.sin(progress * Math.PI);
    if (comboIndex === 0) {
      // Horizontal Slash Right
      rightArmPivot.rotation.x = -Math.PI / 3 - p * 1.2;
      rightArmPivot.rotation.y = -p * 1.5;
      leftArmPivot.rotation.x = 0.3;
      torsoGroup.rotation.y = p * 0.5;
    } else if (comboIndex === 1) {
      // Cross Slash Left
      leftArmPivot.rotation.x = -Math.PI / 3 - p * 1.2;
      leftArmPivot.rotation.y = p * 1.5;
      rightArmPivot.rotation.x = 0.3;
      torsoGroup.rotation.y = -p * 0.5;
    } else if (comboIndex === 2) {
      // Dual Upward Cross Slash
      rightArmPivot.rotation.x = -Math.PI / 2 - p * 0.8;
      leftArmPivot.rotation.x = -Math.PI / 2 - p * 0.8;
      torsoGroup.rotation.x = -p * 0.3;
    } else {
      // 360 Spin Strike
      hero.rotation.y += p * 0.5;
      rightArmPivot.rotation.x = -Math.PI / 2;
      leftArmPivot.rotation.x = -Math.PI / 2;
    }
  };

  // Heavy Attack Pose (Slam down)
  hero.playHeavyPose = (progress: number) => {
    const p = Math.sin(progress * Math.PI);
    rightArmPivot.rotation.x = -Math.PI + p * 1.6;
    leftArmPivot.rotation.x = -Math.PI + p * 1.6;
    torsoGroup.rotation.x = p * 0.5;
    torsoGroup.position.y = 1.0 - p * 0.25;
  };

  // Dodge Roll Pose
  hero.playDodgePose = (progress: number) => {
    hero.rotation.x = progress * Math.PI * 2;
    hero.position.y = Math.sin(progress * Math.PI) * 0.4;
  };

  hero.setStance('ogum');
  return hero;
}

// ==================== FOLKLORE ENEMIES PROCEDURAL 3D MODELS ====================

// 1. CORPO-SECO (Petrified cursed bark ghoul)
export function createCorpoSecoModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Enemy_CorpoSeco';

  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x3d2817,
    roughness: 0.9,
    metalness: 0.05,
  });

  const glowingEyeMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xeab308,
    emissiveIntensity: 1.8,
  });

  const thornMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.5,
  });

  // Torso - Gnarled wooden ribcage
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.18, 0.7, 6), barkMat);
  torso.position.y = 0.85;
  torso.castShadow = true;
  group.add(torso);

  // Thorny vines wrapped around ribs
  const vine = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 4, 12), thornMat);
  vine.position.y = 0.95;
  vine.rotation.x = 0.3;
  group.add(vine);

  // Skull Head
  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.28), barkMat);
  skull.position.set(0, 1.35, 0.05);
  skull.castShadow = true;
  group.add(skull);

  // Yellow hollow evil eyes
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), glowingEyeMat);
  eyeL.position.set(0.08, 1.38, 0.18);
  const eyeR = eyeL.clone();
  eyeR.position.x = -0.08;
  group.add(eyeL, eyeR);

  // Long twisted branch arms with claw fingers
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.9, 5), barkMat);
  armL.position.set(0.38, 0.75, 0.2);
  armL.rotation.x = -0.5;
  armL.castShadow = true;
  const armR = armL.clone();
  armR.position.x = -0.38;
  group.add(armL, armR);

  // Legs - Twisted root limbs
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.75, 5), barkMat);
  legL.position.set(0.16, 0.38, 0);
  legL.castShadow = true;
  const legR = legL.clone();
  legR.position.x = -0.16;
  group.add(legL, legR);

  // Shadow
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.45, 12),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  return group;
}

// 2. SACI-PERERÊ (Whirlwind trickster with iconic red cap and pipe)
export function createSaciModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Enemy_Saci';

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1e1510, // Dark athletic frame
    roughness: 0.7,
    metalness: 0.1,
  });

  const redCapMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Bright scarlet cap
    roughness: 0.4,
  });

  const smokeMat = new THREE.MeshBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.6,
  });

  // Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.6, 6), bodyMat);
  torso.position.y = 0.95;
  torso.castShadow = true;
  group.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), bodyMat);
  head.position.set(0, 1.35, 0);
  head.castShadow = true;
  group.add(head);

  // Scarlet Phrygian Cap (Gorro Vermelho Flamejante)
  const capGeo = new THREE.ConeGeometry(0.22, 0.5, 8);
  capGeo.rotateZ(0.3);
  const cap = new THREE.Mesh(capGeo, redCapMat);
  cap.position.set(-0.06, 1.62, 0);
  cap.castShadow = true;
  group.add(cap);

  // Wooden Pipe (Pito com brasa)
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 4), new THREE.MeshStandardMaterial({ color: 0x78350f }));
  pipe.position.set(0, 1.25, 0.2);
  pipe.rotation.x = Math.PI / 3;
  const ember = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
  ember.position.set(0, 1.18, 0.32);
  group.add(pipe, ember);

  // Arms ready to strike
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.5, 5), bodyMat);
  armL.position.set(0.28, 0.9, 0.15);
  armL.rotation.x = -Math.PI / 4;
  const armR = armL.clone();
  armR.position.x = -0.28;
  group.add(armL, armR);

  // Single Leg
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.7, 6), bodyMat);
  leg.position.set(0, 0.45, 0);
  leg.castShadow = true;
  group.add(leg);

  // Dust Whirlwind vortex at base
  const vortexGeo = new THREE.ConeGeometry(0.45, 0.5, 12, 1, true);
  vortexGeo.rotateX(Math.PI);
  const vortexMat = new THREE.MeshBasicMaterial({
    color: 0xd97706,
    wireframe: true,
    transparent: true,
    opacity: 0.5,
  });
  const vortex = new THREE.Mesh(vortexGeo, vortexMat);
  vortex.position.y = 0.25;
  group.add(vortex);

  return group;
}

// 3. CURUPIRA DA FLORESTA (Guardian with reversed feet, fiery hair & spear)
export function createCurupiraModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Enemy_Curupira';

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x854d0e, // Wild terracotta tone
    roughness: 0.6,
  });

  const fireHairMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xd97706,
    emissiveIntensity: 1.6,
    roughness: 0.3,
  });

  const spearMat = new THREE.MeshStandardMaterial({
    color: 0x262626,
    roughness: 0.2,
    metalness: 0.8,
  });

  // Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.65, 8), skinMat);
  torso.position.y = 0.85;
  torso.castShadow = true;
  group.add(torso);

  // Wild Animal Hide Kilt
  const kilt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.35, 0.35, 6), new THREE.MeshStandardMaterial({ color: 0x3f2e1e }));
  kilt.position.y = 0.52;
  group.add(kilt);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), skinMat);
  head.position.set(0, 1.25, 0);
  head.castShadow = true;
  group.add(head);

  // Flaming Spiky Hair Crest (Cabelos de Fogo)
  for (let i = 0; i < 5; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 4), fireHairMat);
    spike.position.set((i - 2) * 0.08, 1.48 + Math.random() * 0.05, -0.05 + Math.random() * 0.08);
    spike.rotation.x = -0.2 + (Math.random() - 0.5) * 0.2;
    group.add(spike);
  }

  // Legs with Reversed Feet (Pés Virados para Trás)
  const legL = new THREE.Group();
  legL.position.set(0.16, 0.45, 0);
  const legThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.5, 6), skinMat);
  legThigh.position.y = -0.25;
  // Reversed foot pointing BACKWARDS (+Z is front, so foot points -Z)
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.25), skinMat);
  foot.position.set(0, -0.48, -0.08); // Facing backwards!
  legL.add(legThigh, foot);
  legL.castShadow = true;

  const legR = legL.clone();
  legR.position.x = -0.16;
  group.add(legL, legR);

  // Arm holding enchanted Obsidian Spear
  const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.55, 6), skinMat);
  armR.position.set(-0.35, 0.85, 0.1);
  armR.rotation.x = -Math.PI / 4;
  group.add(armR);

  const spear = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.8, 6), new THREE.MeshStandardMaterial({ color: 0x451a03 }));
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 4), spearMat);
  tip.position.y = 0.95;
  const flameTip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), fireHairMat);
  flameTip.position.y = 0.95;
  spear.add(shaft, tip, flameTip);
  spear.position.set(-0.4, 0.9, 0.3);
  spear.rotation.x = Math.PI / 3;
  group.add(spear);

  // Shadow
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 12),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  return group;
}

// 4. BOITATÁ DA MATA ESCURA (Colossal flaming serpent with glowing eyes)
export interface BoitataModelGroup extends THREE.Group {
  segments: THREE.Mesh[];
  animateSerpent: (time: number) => void;
}

export function createBoitataModel(): BoitataModelGroup {
  const group = new THREE.Group() as BoitataModelGroup;
  group.name = 'Enemy_Boitata';

  const fireBodyMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xd97706,
    emissiveIntensity: 1.4,
    roughness: 0.3,
    metalness: 0.2,
  });

  const fireEyeMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });

  // Serpent Head
  const headGeo = new THREE.ConeGeometry(0.45, 0.9, 8);
  headGeo.rotateX(-Math.PI / 2);
  const head = new THREE.Mesh(headGeo, fireBodyMat);
  head.position.set(0, 0.6, 1.2);
  head.castShadow = true;
  group.add(head);

  // Fiery Eyes (Olhos de Fogo Ancestrais)
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), fireEyeMat);
  eyeL.position.set(0.2, 0.75, 1.3);
  const eyeR = eyeL.clone();
  eyeR.position.x = -0.2;
  group.add(eyeL, eyeR);

  // Serpentine Body Segments
  const segments: THREE.Mesh[] = [];
  const numSegments = 9;
  for (let i = 0; i < numSegments; i++) {
    const radius = 0.42 * (1 - (i / numSegments) * 0.6);
    const seg = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 8), fireBodyMat);
    seg.position.set(0, 0.4 + (i % 2 === 0 ? 0.15 : 0), -i * 0.55 + 0.6);
    seg.castShadow = true;
    group.add(seg);
    segments.push(seg);

    // Spine flame crest
    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 4), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    crest.position.y = radius + 0.12;
    seg.add(crest);
  }

  group.segments = segments;
  group.animateSerpent = (time: number) => {
    head.position.y = 0.6 + Math.sin(time * 3) * 0.2;
    head.rotation.y = Math.cos(time * 2.5) * 0.3;
    segments.forEach((seg, idx) => {
      seg.position.x = Math.sin(time * 3 - idx * 0.6) * 0.45;
      seg.position.y = 0.35 + Math.sin(time * 4 - idx * 0.5) * 0.15;
    });
  };

  return group;
}

// 5. MAPINGUARI ANCESTRAL (Colossal Titan Boss with belly mouth & cyclops eye)
export interface MapinguariModelGroup extends THREE.Group {
  bellyMaw: THREE.Mesh;
  cyclopsEye: THREE.Mesh;
  fists: THREE.Mesh[];
  animateBoss: (time: number, isAttacking: boolean) => void;
}

export function createMapinguariModel(): MapinguariModelGroup {
  const group = new THREE.Group() as MapinguariModelGroup;
  group.name = 'Enemy_Mapinguari_Boss';

  const furStoneMat = new THREE.MeshStandardMaterial({
    color: 0x27272a, // Stony dark pelt
    roughness: 0.95,
    metalness: 0.1,
  });

  const boneArmorMat = new THREE.MeshStandardMaterial({
    color: 0xa8a29e, // Bone plates
    roughness: 0.4,
    metalness: 0.3,
  });

  const bellyMawMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b, // Gaping visceral mouth
    roughness: 0.3,
    emissive: 0x450a0a,
    emissiveIntensity: 0.8,
  });

  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 2.0,
  });

  // Scale boss to 2.5x player size
  const scale = 2.4;
  group.scale.set(scale, scale, scale);

  // Massive Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.65, 1.2, 8), furStoneMat);
  torso.position.y = 1.25;
  torso.castShadow = true;
  group.add(torso);

  // Gaping Belly Maw (A Bocarra no Ventre)
  const bellyMawGeo = new THREE.BoxGeometry(0.5, 0.7, 0.25);
  const bellyMaw = new THREE.Mesh(bellyMawGeo, bellyMawMat);
  bellyMaw.position.set(0, 1.1, 0.4);
  group.add(bellyMaw);

  // Belly Teeth / Jagged Fangs
  for (let i = 0; i < 6; i++) {
    const toothT = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.15, 4), boneArmorMat);
    toothT.position.set((i - 2.5) * 0.08, 1.4, 0.52);
    toothT.rotation.x = Math.PI;
    const toothB = toothT.clone();
    toothB.position.y = 0.8;
    toothB.rotation.x = 0;
    group.add(toothT, toothB);
  }

  // Hunched Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 10), furStoneMat);
  head.position.set(0, 1.95, 0.2);
  head.castShadow = true;
  group.add(head);

  // Single Giant Cyclopean Eye (Olho Central Aterrorizante)
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), eyeMat);
  eye.position.set(0, 2.05, 0.55);
  group.add(eye);

  // Mammoth Stone Pauldrons
  const pauldronL = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6, 6), boneArmorMat);
  pauldronL.position.set(0.9, 1.8, 0);
  const pauldronR = pauldronL.clone();
  pauldronR.position.x = -0.9;
  group.add(pauldronL, pauldronR);

  // Colossal Fist Arms
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 1.2, 6), furStoneMat);
  armL.position.set(0.85, 1.05, 0.2);
  armL.rotation.x = -0.3;
  armL.castShadow = true;
  const fistL = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 6), boneArmorMat);
  fistL.position.set(0, -0.65, 0);
  armL.add(fistL);

  const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 1.2, 6), furStoneMat);
  armR.position.set(-0.85, 1.05, 0.2);
  armR.rotation.x = -0.3;
  armR.castShadow = true;
  const fistR = fistL.clone();
  armR.add(fistR);

  group.add(armL, armR);

  // Thick Pillar Legs
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.9, 6), furStoneMat);
  legL.position.set(0.4, 0.45, 0);
  legL.castShadow = true;
  const legR = legL.clone();
  legR.position.x = -0.4;
  group.add(legL, legR);

  // Boss Shadow
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.4, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  group.bellyMaw = bellyMaw;
  group.cyclopsEye = eye;
  group.fists = [fistL, fistR];

  group.animateBoss = (time: number, isAttacking: boolean) => {
    if (isAttacking) {
      armL.rotation.x = -Math.PI / 1.5 + Math.sin(time * 8) * 0.5;
      armR.rotation.x = -Math.PI / 1.5 + Math.sin(time * 8) * 0.5;
      bellyMaw.scale.y = 1.0 + Math.abs(Math.sin(time * 6)) * 0.5;
    } else {
      torso.position.y = 1.25 + Math.sin(time * 2) * 0.05;
      head.position.y = 1.95 + Math.sin(time * 2) * 0.04;
      armL.rotation.x = -0.2 + Math.sin(time * 2) * 0.1;
      armR.rotation.x = -0.2 - Math.sin(time * 2) * 0.1;
    }
  };

  return group;
}

// ==================== SACRED ENVIRONMENT: BAOBAB, MONOLITHS & RUINS ====================

export function createSacredBaobabTree(): THREE.Group {
  const treeGroup = new THREE.Group();
  treeGroup.name = 'Sacred_Baobab_Tree';

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x3d271d,
    roughness: 0.9,
    metalness: 0.05,
  });

  const leavesMat = new THREE.MeshStandardMaterial({
    color: 0x15803d, // Vibrant emerald jungle foliage
    roughness: 0.7,
  });

  const glowRuneMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.8,
  });

  // Massive Trunk
  const trunkGeo = new THREE.CylinderGeometry(2.2, 3.4, 10, 10);
  const trunk = new THREE.Mesh(trunkGeo, woodMat);
  trunk.position.y = 5.0;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  treeGroup.add(trunk);

  // Sacred Ponto Riscado carved into the tree bark
  const runeBand = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.15, 6, 24), glowRuneMat);
  runeBand.position.y = 3.5;
  runeBand.rotation.x = Math.PI / 2;
  treeGroup.add(runeBand);

  // Big Arching Roots (4 roots grounding to the earth)
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const rootGeo = new THREE.CylinderGeometry(0.6, 1.2, 4.5, 6);
    rootGeo.rotateZ(0.6);
    const root = new THREE.Mesh(rootGeo, woodMat);
    root.position.set(Math.cos(angle) * 3.2, 1.5, Math.sin(angle) * 3.2);
    root.rotation.y = angle;
    root.castShadow = true;
    treeGroup.add(root);
  }

  // Giant Canopy Spheres
  for (let i = 0; i < 7; i++) {
    const angle = (i * Math.PI * 2) / 6;
    const dist = i === 6 ? 0 : 3.5;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(2.8, 8, 8), leavesMat);
    leaf.position.set(Math.cos(angle) * dist, 10.5 + (i === 6 ? 1.5 : 0), Math.sin(angle) * dist);
    leaf.castShadow = true;
    treeGroup.add(leaf);
  }

  return treeGroup;
}

export function createSacredMonolith(pontoColorHex: string): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x3f3f46,
    roughness: 0.85,
    metalness: 0.15,
  });

  const runeTex = createRuneTexture(pontoColorHex);
  const runeMat = new THREE.MeshStandardMaterial({
    map: runeTex,
    roughness: 0.4,
    emissive: new THREE.Color(pontoColorHex),
    emissiveIntensity: 0.8,
  });

  // Tall ancient obelisk pillar
  const stone = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.2, 0.8), stoneMat);
  stone.position.y = 1.6;
  stone.castShadow = true;
  stone.receiveShadow = true;
  group.add(stone);

  // Carved runic tablet on face
  const tablet = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 2.4), runeMat);
  tablet.position.set(0, 1.6, 0.41);
  group.add(tablet);

  return group;
}
