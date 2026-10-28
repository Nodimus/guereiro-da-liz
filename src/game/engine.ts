/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { soundManager } from './audio';
import { INITIAL_SKILLS, ORIXAS_CONFIG } from './constants';
import {
  BoitataModelGroup,
  createBoitataModel,
  createCorpoSecoModel,
  createCurupiraModel,
  createHeroModel,
  createMapinguariModel,
  createSacredBaobabTree,
  createSacredMonolith,
  createSaciModel,
  HeroModelGroup,
  MapinguariModelGroup,
} from './models';
import { DamageNumber, EnemyStats, EnemyType, OrixaType, PlayerStats, SkillNode } from './types';

// Pre-allocated vectors for 60fps zero GC
const _tempVec = new THREE.Vector3();
const _camOffset = new THREE.Vector3();
const _camLook = new THREE.Vector3();

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: PlayerStats) => void;
  onBossUpdate: (boss: EnemyStats | null) => void;
  onSkillCooldowns: (cooldowns: Record<OrixaType, number>) => void;
  onDamagePopups: (popups: DamageNumber[]) => void;
  onGameStateChange: (state: 'title' | 'playing' | 'paused' | 'gameover' | 'victory') => void;
  onWaveNotification: (title: string, subtitle: string) => void;
  onExecutionPrompt: (show: boolean, enemyName?: string) => void;
}

export interface EnemyEntity {
  id: string;
  type: EnemyType;
  mesh: THREE.Group;
  stats: EnemyStats;
  targetPos: THREE.Vector3;
  velocity: THREE.Vector3;
  attackTimer: number;
  hitTimer: number;
  stunTimer: number;
  deathTimer: number;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;

  // Three.js Core
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock!: THREE.Clock;
  private animFrameId: number = 0;
  private isSoftwareGl: boolean = false;
  private softwareTimeoutId: number | null = null;
  private isDisposed: boolean = false;

  // Lifecycle & Event management
  private abortController = new AbortController();
  private waveSpawnTimer: number | null = null;

  // Scene Objects
  private hero!: HeroModelGroup;
  private enemies: EnemyEntity[] = [];
  private particleGroup!: THREE.Group;
  private sacredAltar!: THREE.Mesh;

  // Pre-allocated Particle Pool
  private sparkGeo = new THREE.SphereGeometry(0.08, 4, 4);
  private sparkMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
  private sparkPool: THREE.Mesh[] = [];
  private activeSparks: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; maxLife: number }[] = [];
  private ringGeo = new THREE.RingGeometry(0.5, 2.5, 16);
  private auraRingPool: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial }[] = [];
  private activeAuras: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; life: number; maxLife: number; scale: number }[] = [];

  // Player State
  public stats: PlayerStats = {
    hp: 100,
    maxHp: 100,
    axe: 100,
    maxAxe: 100,
    axePoints: 120, // Start with some Axé to try the skill tree right away!
    attackPower: 25,
    defense: 10,
    speed: 8.5,
    level: 1,
    comboCount: 0,
    comboScore: 0,
    comboRank: 'D',
    activeOrixa: 'ogum',
  };

  public skills: SkillNode[] = [...INITIAL_SKILLS];
  private skillCooldowns: Record<OrixaType, number> = {
    ogum: 0,
    xango: 0,
    iansa: 0,
    oxossi: 0,
    oxum: 0,
  };

  // Combat State
  private isAttacking: boolean = false;
  private attackPhase: number = 0; // combo index 0..3
  private attackTimer: number = 0;
  private attackDuration: number = 0.35;
  private isHeavyAttacking: boolean = false;
  private isDodging: boolean = false;
  private dodgeTimer: number = 0;
  private dodgeDuration: number = 0.42;
  private dodgeDir = new THREE.Vector3();
  private hitstopTimer: number = 0;
  private cameraShakeIntensity: number = 0;
  private executionTarget: EnemyEntity | null = null;
  private isExecuting: boolean = false;
  private executionTimer: number = 0;

  // Exploration & Waves
  private currentWave: number = 1;
  private maxWaves: number = 4;
  private waveClearTimer: number = 0;
  public gameState: 'title' | 'playing' | 'paused' | 'gameover' | 'victory' = 'title';

  // Input State
  private keys: Record<string, boolean> = {};
  private mousePos = { x: 0, y: 0 };
  private cameraPitch: number = 0.28;
  private cameraYaw: number = 0;
  private cameraDist: number = 6.8;

  // Damage Popups
  private damagePopups: DamageNumber[] = [];
  private nextPopupId: number = 1;
  private popupUpdateTimer: number = 0;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.init();
  }

  private init() {
    // Detect software GL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    // 2. Scene & Fog
    this.scene = new THREE.Scene();
    const fogColor = new THREE.Color(0x0a1017); // Mystical dark dawn rainforest horizon
    this.scene.background = fogColor;
    this.scene.fog = new THREE.FogExp2(fogColor.getHex(), 0.022);

    // 3. Camera
    this.camera = new THREE.PerspectiveCamera(
      52,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      180
    );
    this.camera.position.set(0, 5, 10);

    // 4. Studio Environment Lighting
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 3-Point Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x14532d, 0.7); // Sky blue to lush jungle earth
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.8); // Warm sunbeam through ancient canopy
    dirLight.position.set(24, 40, 20);
    dirLight.castShadow = !this.isSoftwareGl;
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 100;
      const d = 35;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0004;
    }
    this.scene.add(dirLight);

    // Subtle golden rim light
    const rimLight = new THREE.DirectionalLight(0xd97706, 0.9);
    rimLight.position.set(-20, 15, -20);
    this.scene.add(rimLight);

    // 5. Build Mystical Arena & Environment
    this.buildWorld();

    // 6. Spawn Hero
    this.hero = createHeroModel();
    this.hero.position.set(0, 0, 0);
    this.scene.add(this.hero);

    // 7. Particle System (Sparks, embers, ancestral runes)
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);

    // 8. Event Listeners
    this.setupInputs();

    this.clock = new THREE.Clock();
    this.loop = this.loop.bind(this);
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  // ==================== WORLD GENERATION ====================
  private buildWorld() {
    // Ground Terrain (Mossy Earth & Sacred Stone Markings)
    const groundGeo = new THREE.PlaneGeometry(160, 160, 32, 32);
    groundGeo.rotateX(-Math.PI / 2);

    const groundTex = this.createGroundTexture();
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.85,
      metalness: 0.1,
    });

    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Sacred Central Altar with Pontos Riscados (Pátio Sagrado)
    const altarGeo = new THREE.CylinderGeometry(8, 8.5, 0.4, 24);
    const altarTex = this.createAltarTexture();
    const altarMat = new THREE.MeshStandardMaterial({
      map: altarTex,
      roughness: 0.6,
      metalness: 0.2,
    });
    this.sacredAltar = new THREE.Mesh(altarGeo, altarMat);
    this.sacredAltar.position.set(0, 0.2, 0);
    this.sacredAltar.receiveShadow = true;
    this.scene.add(this.sacredAltar);

    // Giant Sacred Baobab Tree in the center background
    const baobab = createSacredBaobabTree();
    baobab.position.set(0, 0, -22);
    this.scene.add(baobab);

    // 4 Monoliths of the Directions (Orixá Altars)
    const monolithColors = ['#0284c7', '#ea580c', '#dc2626', '#16a34a'];
    const positions = [
      new THREE.Vector3(12, 0, 10),
      new THREE.Vector3(-12, 0, 10),
      new THREE.Vector3(14, 0, -10),
      new THREE.Vector3(-14, 0, -10),
    ];
    positions.forEach((pos, idx) => {
      const monolith = createSacredMonolith(monolithColors[idx]);
      monolith.position.copy(pos);
      this.scene.add(monolith);
    });

    // Natural Outdoor Perimeter: Cliffs, Rocks & Sacred Rainforest Trees
    this.createPerimeterBarriers();

    // Floating Golden Fireflies / Spirit Embers
    this.createSpiritEmbers();
  }

  private createGroundTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Forest dark soil & moss green
    ctx.fillStyle = '#1c2217';
    ctx.fillRect(0, 0, 1024, 1024);

    // Organic grass patches
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(34, 75, 27, 0.35)' : 'rgba(21, 50, 18, 0.4)';
      ctx.beginPath();
      ctx.arc(Math.random() * 1024, Math.random() * 1024, Math.random() * 70 + 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dirt trails
    ctx.strokeStyle = 'rgba(75, 48, 28, 0.3)';
    ctx.lineWidth = 45;
    ctx.beginPath();
    ctx.moveTo(0, 512);
    ctx.bezierCurveTo(300, 480, 700, 560, 1024, 512);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    return tex;
  }

  private createAltarTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#292524';
    ctx.fillRect(0, 0, 512, 512);

    // Glowing sacred concentric runes
    ctx.strokeStyle = '#eab308';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 15;
    ctx.lineWidth = 8;

    ctx.beginPath();
    ctx.arc(256, 256, 220, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(256, 256, 150, 0, Math.PI * 2);
    ctx.stroke();

    // Sacred geometric crossroads of Exu & Ogum
    ctx.beginPath();
    ctx.moveTo(256, 40);
    ctx.lineTo(256, 472);
    ctx.moveTo(40, 256);
    ctx.lineTo(472, 256);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private createPerimeterBarriers() {
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.9,
    });
    const treeTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x3f2e1e,
      roughness: 0.85,
    });
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x14532d,
      roughness: 0.7,
    });

    const numBarriers = 36;
    for (let i = 0; i < numBarriers; i++) {
      const angle = (i / numBarriers) * Math.PI * 2;
      const radius = 38 + (Math.random() - 0.5) * 6;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Rock cluster
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(2.5 + Math.random() * 2.5),
        rockMat
      );
      rock.position.set(x, 1.5, z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);

      // Surrounding Dense Canopy Trees
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 9, 6), treeTrunkMat);
      trunk.position.y = 4.5;
      const foliage = new THREE.Mesh(new THREE.ConeGeometry(3.5, 8, 6), foliageMat);
      foliage.position.y = 9;
      tree.add(trunk, foliage);
      tree.position.set(x * 1.15, 0, z * 1.15);
      tree.scale.setScalar(0.8 + Math.random() * 0.5);
      tree.castShadow = true;
      this.scene.add(tree);
    }
  }

  private createSpiritEmbers() {
    const particleCount = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 8 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

      // Gold & sacred cyan spiritual particles
      if (Math.random() > 0.5) {
        colors[i * 3] = 0.98; // R
        colors[i * 3 + 1] = 0.75; // G
        colors[i * 3 + 2] = 0.15; // B
      } else {
        colors[i * 3] = 0.22;
        colors[i * 3 + 1] = 0.74;
        colors[i * 3 + 2] = 0.97;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);
  }

  // ==================== INPUT & CONTROLS ====================
  private setupInputs() {
    const signal = this.abortController.signal;

    window.addEventListener(
      'keydown',
      (e) => {
        this.keys[e.code] = true;

        // Title screen quick-start
        if (this.gameState === 'title' && (e.code === 'Space' || e.code === 'Enter')) {
          this.startGame();
          return;
        }

        // Pause toggle
        if (e.code === 'Escape') {
          if (this.gameState === 'playing') {
            this.pauseGame();
          } else if (this.gameState === 'paused') {
            this.resumeGame();
          }
          return;
        }

        // Stance Switching (1 to 5)
        if (this.gameState === 'playing') {
          if (e.code === 'Digit1') this.switchStance('ogum');
          if (e.code === 'Digit2') this.switchStance('xango');
          if (e.code === 'Digit3') this.switchStance('iansa');
          if (e.code === 'Digit4') this.switchStance('oxossi');
          if (e.code === 'Digit5') this.switchStance('oxum');

          // Special Orixá Skill (Q)
          if (e.code === 'KeyQ') this.triggerActiveSkill();

          // Ultimate Axé Burst (R or F)
          if (e.code === 'KeyR' || e.code === 'KeyF') this.triggerUltimate();

          // Brutal Finisher Execution (E)
          if (e.code === 'KeyE') this.triggerExecution();

          // Dodge Roll (Space or Shift)
          if (e.code === 'Space' || e.code === 'ShiftLeft') this.triggerDodge();

          // Keyboard attack alternatives (J / K)
          if (e.code === 'KeyJ') this.triggerLightAttack();
          if (e.code === 'KeyK') this.triggerHeavyAttack();
        }
      },
      { signal }
    );

    window.addEventListener(
      'keyup',
      (e) => {
        this.keys[e.code] = false;
      },
      { signal }
    );

    window.addEventListener(
      'blur',
      () => {
        this.keys = {};
      },
      { signal }
    );

    // Mouse Controls
    this.container.addEventListener(
      'mousedown',
      (e) => {
        soundManager.resume();
        if (this.gameState !== 'playing') return;

        if (e.button === 0) {
          // Left Click: Light Attack Combo
          this.triggerLightAttack();
        } else if (e.button === 2) {
          // Right Click: Heavy Attack Slam
          e.preventDefault();
          this.triggerHeavyAttack();
        }
      },
      { signal }
    );

    this.container.addEventListener(
      'contextmenu',
      (e) => e.preventDefault(),
      { signal }
    );

    // Mouse camera rotation: Right-drag, Middle-drag, or Pointer Lock
    this.container.addEventListener(
      'mousemove',
      (e) => {
        const isRightOrMiddleDrag = (e.buttons & 2) !== 0 || (e.buttons & 4) !== 0;
        if (document.pointerLockElement === this.container || isRightOrMiddleDrag) {
          this.cameraYaw -= e.movementX * 0.0035;
          this.cameraPitch = Math.max(0.08, Math.min(1.2, this.cameraPitch + e.movementY * 0.0035));
        }
      },
      { signal }
    );

    // Resize
    window.addEventListener(
      'resize',
      () => {
        if (!this.renderer || !this.camera || this.isDisposed) return;
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        if (height === 0) return;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
      },
      { signal }
    );
  }

  // ==================== GAME FLOW ====================
  public startGame() {
    soundManager.init();
    soundManager.resume();

    if (this.waveSpawnTimer !== null) {
      window.clearTimeout(this.waveSpawnTimer);
      this.waveSpawnTimer = null;
    }

    this.gameState = 'playing';
    this.callbacks.onGameStateChange('playing');

    // Deterministic Hero Reset
    this.hero.position.set(0, 0, 0);
    this.hero.rotation.set(0, 0, 0);
    this.stats.hp = this.stats.maxHp;
    this.stats.axe = 80;
    this.stats.comboCount = 0;
    this.stats.comboScore = 0;
    this.stats.comboRank = 'D';
    this.currentWave = 1;

    // Reset Combat & Camera flags
    this.isAttacking = false;
    this.isHeavyAttacking = false;
    this.isDodging = false;
    this.isExecuting = false;
    this.executionTarget = null;
    this.hitstopTimer = 0;
    this.cameraShakeIntensity = 0;
    this.cameraYaw = 0;
    this.cameraPitch = 0.28;
    this.cameraDist = 6.8;
    this.keys = {};

    this.damagePopups = [];
    this.callbacks.onDamagePopups([]);
    this.callbacks.onExecutionPrompt(false);
    this.callbacks.onStatsUpdate({ ...this.stats });

    // Clear existing enemies and spawn first wave
    this.clearAllEnemies();
    this.spawnWave(1);
  }

  public pauseGame() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      this.callbacks.onGameStateChange('paused');
    }
  }

  public resumeGame() {
    if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.keys = {};
      this.callbacks.onGameStateChange('playing');
    }
  }

  public switchStance(orixa: OrixaType) {
    if (this.stats.activeOrixa === orixa) return;
    this.stats.activeOrixa = orixa;
    this.hero.setStance(orixa);
    soundManager.playClash();
    this.spawnElementalAuraBurst(this.hero.position, orixa);
    this.callbacks.onStatsUpdate({ ...this.stats });
  }

  // ==================== COMBAT ACTIONS ====================

  // 1. Light Attack Combo (4-hit chain)
  public triggerLightAttack() {
    if (this.isAttacking || this.isDodging || this.isExecuting) return;

    this.isAttacking = true;
    this.isHeavyAttacking = false;
    this.attackTimer = 0;
    this.attackDuration = 0.32;

    soundManager.playSlash(1.0 + this.attackPhase * 0.15);

    // Hit-check
    this.performAttackHit(false);

    // Advance combo chain
    this.attackPhase = (this.attackPhase + 1) % 4;
  }

  // 2. Heavy Attack (Xangô slam or charged strike)
  public triggerHeavyAttack() {
    if (this.isAttacking || this.isDodging || this.isExecuting) return;

    this.isAttacking = true;
    this.isHeavyAttacking = true;
    this.attackTimer = 0;
    this.attackDuration = 0.48;

    soundManager.playHeavyImpact();
    this.performAttackHit(true);
    this.triggerCameraShake(0.35);
  }

  // 3. Dodge Roll
  public triggerDodge() {
    if (this.isDodging || this.isExecuting) return;

    this.isDodging = true;
    this.dodgeTimer = 0;
    this.isAttacking = false;

    // Determine roll direction based on held keys
    const forward = _tempVec.set(0, 0, -1).applyAxisAngle(THREE.Object3D.DEFAULT_UP, this.cameraYaw);
    const right = _camOffset.set(1, 0, 0).applyAxisAngle(THREE.Object3D.DEFAULT_UP, this.cameraYaw);

    this.dodgeDir.set(0, 0, 0);
    if (this.keys['KeyW']) this.dodgeDir.add(forward);
    if (this.keys['KeyS']) this.dodgeDir.sub(forward);
    if (this.keys['KeyD']) this.dodgeDir.add(right);
    if (this.keys['KeyA']) this.dodgeDir.sub(right);

    if (this.dodgeDir.lengthSq() < 0.01) {
      this.dodgeDir.copy(forward);
    }
    this.dodgeDir.normalize();

    soundManager.playDodge();

    // Iansã Lightning trail if unlocked
    if (this.stats.activeOrixa === 'iansa') {
      soundManager.playIansaWind();
      this.spawnElementalAuraBurst(this.hero.position, 'iansa');
    }
  }

  // 4. Special Orixá Skill (Active ability)
  public triggerActiveSkill() {
    const current = this.stats.activeOrixa;
    if (this.skillCooldowns[current] > 0) return;

    const config = ORIXAS_CONFIG[current];
    this.skillCooldowns[current] = config.skillCooldown;

    switch (current) {
      case 'ogum':
        // Seven Lines Blade Spin
        soundManager.playClash();
        soundManager.playSlash(1.4);
        this.dealAreaDamage(this.hero.position, 6.0, 65, 'Aço Divino');
        this.triggerCameraShake(0.3);
        this.spawnElementalAuraBurst(this.hero.position, 'ogum');
        break;

      case 'xango':
        // Cosmic Lava Eruption
        soundManager.playXangoThunder();
        this.dealAreaDamage(this.hero.position, 8.5, 95, 'Fogo Cósmico');
        this.triggerCameraShake(0.55);
        this.spawnElementalAuraBurst(this.hero.position, 'xango');
        break;

      case 'iansa':
        // Hurricane Vortex
        soundManager.playIansaWind();
        this.dealAreaDamage(this.hero.position, 9.0, 50, 'Tufão de Oyá');
        // Pull enemies closer to whirlwind
        this.enemies.forEach((e) => {
          if (e.mesh.position.distanceTo(this.hero.position) < 10) {
            e.mesh.position.lerp(this.hero.position, 0.45);
          }
        });
        this.triggerCameraShake(0.25);
        this.spawnElementalAuraBurst(this.hero.position, 'iansa');
        break;

      case 'oxossi':
        // Spirit Bow Piercing Volley
        soundManager.playOxossiArrow();
        this.shootSpiritArrow();
        break;

      case 'oxum':
        // Golden Waters Healing
        soundManager.playOxumHeal();
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 45);
        this.stats.axe = Math.min(this.stats.maxAxe, this.stats.axe + 30);
        this.addDamagePopup('CURA +45 HP', this.hero.position, '#fef08a', false);
        this.spawnElementalAuraBurst(this.hero.position, 'oxum');
        break;
    }

    this.callbacks.onStatsUpdate({ ...this.stats });
  }

  // 5. Ultimate: Fúria Suprema dos Orixás
  public triggerUltimate() {
    if (this.stats.axe < 75) return;
    this.stats.axe -= 75;

    soundManager.playUltimateBurst();
    this.triggerCameraShake(0.85);

    // Devastating full arena shockwave
    this.dealAreaDamage(this.hero.position, 22.0, 220, 'AXÉ SUPREMO!');
    this.spawnElementalAuraBurst(this.hero.position, 'xango');
    this.spawnElementalAuraBurst(this.hero.position, 'ogum');

    this.addDamagePopup('AXÉ SUPREMO DOS ORIXÁS!', this.hero.position, '#facc15', true);
    this.callbacks.onStatsUpdate({ ...this.stats });
  }

  // 6. Brutal God of War Finisher / Execution
  public triggerExecution() {
    if (!this.executionTarget || this.isExecuting) return;

    this.isExecuting = true;
    this.executionTimer = 0;
    const target = this.executionTarget;

    soundManager.playFinisher();
    this.triggerCameraShake(0.6);

    // Instant kill
    target.stats.hp = 0;
    target.stats.state = 'dying';

    this.addDamagePopup('EXECUÇÃO ANCESTRAL!', target.mesh.position, '#ef4444', true);
    this.stats.axe = Math.min(this.stats.maxAxe, this.stats.axe + 40);
    this.stats.axePoints += target.stats.isBoss ? 150 : 45;
    this.increaseCombo(80);

    this.executionTarget = null;
    this.callbacks.onExecutionPrompt(false);
  }

  private performAttackHit(isHeavy: boolean) {
    const range = isHeavy ? 3.8 : 2.8;
    const forward = _tempVec.set(0, 0, 1).applyQuaternion(this.hero.quaternion);
    let hitCount = 0;

    this.enemies.forEach((entity) => {
      if (entity.stats.hp <= 0) return;

      const toEnemy = _camOffset.subVectors(entity.mesh.position, this.hero.position);
      const dist = toEnemy.length();

      if (dist < range) {
        toEnemy.normalize();
        const dot = forward.dot(toEnemy);

        // Within 120-degree cone in front
        if (dot > 0.25 || dist < 1.4) {
          hitCount++;
          const baseDamage = isHeavy ? this.stats.attackPower * 2.2 : this.stats.attackPower;
          const isCrit = Math.random() < 0.25;
          const finalDamage = Math.round(baseDamage * (isCrit ? 1.8 : 1.0));

          entity.stats.hp -= finalDamage;
          entity.stats.state = 'hit';
          entity.hitTimer = 0.25;

          // Push back
          entity.mesh.position.addScaledVector(toEnemy, isHeavy ? 1.5 : 0.6);

          // Hitstop simulation (visceral freeze-frame)
          this.hitstopTimer = isHeavy ? 0.06 : 0.03;

          // Sound & sparks
          soundManager.playClash();
          this.spawnHitSparks(entity.mesh.position);

          // Check if can be executed (HP < 25%)
          if (entity.stats.hp > 0 && entity.stats.hp <= entity.stats.maxHp * 0.28) {
            entity.stats.canBeExecuted = true;
            this.executionTarget = entity;
            this.callbacks.onExecutionPrompt(true, entity.stats.name);
          }

          // Damage popup
          this.addDamagePopup(
            `${finalDamage}`,
            entity.mesh.position,
            isCrit ? '#ef4444' : isHeavy ? '#f97316' : '#38bdf8',
            isCrit
          );

          if (entity.stats.hp <= 0) {
            this.onEnemyKilled(entity);
          }
        }
      }
    });

    if (hitCount > 0) {
      this.increaseCombo(hitCount * 15);
      this.stats.axe = Math.min(this.stats.maxAxe, this.stats.axe + hitCount * 6);
      this.callbacks.onStatsUpdate({ ...this.stats });
    }
  }

  private dealAreaDamage(origin: THREE.Vector3, radius: number, damage: number, spellName: string) {
    this.enemies.forEach((entity) => {
      if (entity.stats.hp <= 0) return;
      const dist = entity.mesh.position.distanceTo(origin);
      if (dist <= radius) {
        entity.stats.hp -= damage;
        entity.stats.state = 'hit';
        entity.hitTimer = 0.35;
        this.addDamagePopup(`${damage}`, entity.mesh.position, '#facc15', true);
        if (entity.stats.hp <= 0) {
          this.onEnemyKilled(entity);
        }
      }
    });
    this.increaseCombo(40);
  }

  private shootSpiritArrow() {
    const forward = _tempVec.set(0, 0, 1).applyQuaternion(this.hero.quaternion);
    const arrowPos = this.hero.position.clone().add(new THREE.Vector3(0, 1.2, 0));

    // Pierce through all in line
    this.enemies.forEach((entity) => {
      if (entity.stats.hp <= 0) return;
      const toEnemy = _camOffset.subVectors(entity.mesh.position, arrowPos);
      const dist = toEnemy.length();
      toEnemy.normalize();
      if (dist < 20 && forward.dot(toEnemy) > 0.8) {
        const dmg = Math.round(this.stats.attackPower * 2.8);
        entity.stats.hp -= dmg;
        entity.stats.state = 'hit';
        this.spawnHitSparks(entity.mesh.position);
        this.addDamagePopup(`${dmg} CRÍTICO!`, entity.mesh.position, '#4ade80', true);
        if (entity.stats.hp <= 0) {
          this.onEnemyKilled(entity);
        }
      }
    });
  }

  private onEnemyKilled(entity: EnemyEntity) {
    entity.stats.state = 'dying';
    entity.deathTimer = 1.0;
    this.stats.axePoints += entity.stats.isBoss ? 200 : 35;
    this.spawnElementalAuraBurst(entity.mesh.position, this.stats.activeOrixa);

    // If boss died, clear boss HUD
    if (entity.stats.isBoss) {
      this.callbacks.onBossUpdate(null);
    }

    // Check if wave cleared
    const remaining = this.enemies.filter((e) => e.stats.hp > 0).length;
    if (remaining <= 0) {
      this.onWaveCompleted();
    }
  }

  private onWaveCompleted() {
    if (this.currentWave < this.maxWaves) {
      this.currentWave++;
      this.callbacks.onWaveNotification(
        `FASE ${this.currentWave} DESPERTADA`,
        this.getWaveTitle(this.currentWave)
      );
      if (this.waveSpawnTimer !== null) {
        window.clearTimeout(this.waveSpawnTimer);
      }
      this.waveSpawnTimer = window.setTimeout(() => {
        this.waveSpawnTimer = null;
        if (this.gameState === 'playing' && !this.isDisposed) {
          this.spawnWave(this.currentWave);
        }
      }, 2500);
    } else {
      // Victory!
      this.gameState = 'victory';
      this.callbacks.onGameStateChange('victory');
    }
  }

  private getWaveTitle(wave: number): string {
    switch (wave) {
      case 1:
        return 'Invasão dos Corpos-Secos';
      case 2:
        return 'O Torvelinho dos Sacis & Almas';
      case 3:
        return 'A Serpente de Fogo Boitatá & Curupira';
      case 4:
        return 'Duelo Titânico: Mapinguari Ancestral';
      default:
        return '';
    }
  }

  private spawnWave(wave: number) {
    if (wave === 1) {
      // 4 Corpos-Secos
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        this.spawnEnemy('corpo_seco', Math.cos(angle) * 14, Math.sin(angle) * 14);
      }
      this.callbacks.onWaveNotification('FASE 1: O DESPERTAR DAS SOMBRAS', 'Derrote as criaturas amaldiçoadas!');
    } else if (wave === 2) {
      // 2 Sacis + 3 Corpos-Secos
      this.spawnEnemy('saci', 10, 8);
      this.spawnEnemy('saci', -10, -8);
      for (let i = 0; i < 3; i++) {
        this.spawnEnemy('corpo_seco', (i - 1) * 8, 15);
      }
      this.callbacks.onWaveNotification('FASE 2: REDEMOINHOS DA MATA', 'Cuidado com os golpes rápidos do Saci!');
    } else if (wave === 3) {
      // Curupira + Boitatá
      this.spawnEnemy('curupira', 12, 10);
      this.spawnEnemy('boitata', -12, 10);
      this.callbacks.onWaveNotification('FASE 3: OS GUARDIÕES DA SELVA', 'Curupira e a Serpente Boitatá atacam!');
    } else if (wave === 4) {
      // Mapinguari Colossal Boss + 2 Corpos-Secos
      const boss = this.spawnEnemy('mapinguari', 0, 18);
      this.callbacks.onBossUpdate(boss.stats);
      soundManager.playMonsterRoar();
      this.callbacks.onWaveNotification('FASE FINAL: MAPINGUARI ANCESTRAL', 'O titã da floresta ergueu-se!');
    }
  }

  private spawnEnemy(type: EnemyType, x: number, z: number): EnemyEntity {
    let mesh: THREE.Group;
    let hp = 80;
    let atk = 12;
    let speed = 4.2;
    let name = 'Corpo-Seco';
    let title = 'Assombração da Mata';
    let isBoss = false;

    switch (type) {
      case 'corpo_seco':
        mesh = createCorpoSecoModel();
        hp = 110;
        atk = 14;
        speed = 3.8;
        name = 'Corpo-Seco';
        title = 'Alma Petrificada';
        break;
      case 'saci':
        mesh = createSaciModel();
        hp = 160;
        atk = 18;
        speed = 6.2;
        name = 'Saci-Pererê';
        title = 'Senhor dos Redemoinhos';
        break;
      case 'curupira':
        mesh = createCurupiraModel();
        hp = 260;
        atk = 26;
        speed = 5.5;
        name = 'Curupira';
        title = 'Guardião Feroz da Selva';
        break;
      case 'boitata':
        mesh = createBoitataModel();
        hp = 340;
        atk = 32;
        speed = 4.8;
        name = 'Boitatá da Mata Escura';
        title = 'Serpente Flamejante';
        break;
      case 'mapinguari':
        mesh = createMapinguariModel();
        hp = 850;
        atk = 45;
        speed = 3.2;
        name = 'Mapinguari Ancestral';
        title = 'Titã Devorador da Amazônia';
        isBoss = true;
        break;
    }

    mesh.position.set(x, 0, z);
    this.scene.add(mesh);

    const enemy: EnemyEntity = {
      id: `enemy_${Math.random().toString(36).substring(2, 7)}`,
      type,
      mesh,
      stats: {
        id: `enemy_${Math.random().toString(36).substring(2, 7)}`,
        type,
        name,
        title,
        hp,
        maxHp: hp,
        attackPower: atk,
        speed,
        isBoss,
        canBeExecuted: false,
        state: 'chase',
      },
      targetPos: this.hero.position.clone(),
      velocity: new THREE.Vector3(),
      attackTimer: Math.random() * 2,
      hitTimer: 0,
      stunTimer: 0,
      deathTimer: 0,
    };

    this.enemies.push(enemy);
    return enemy;
  }

  private clearAllEnemies() {
    this.enemies.forEach((e) => {
      this.scene.remove(e.mesh);
    });
    this.enemies = [];
    this.callbacks.onBossUpdate(null);
  }

  // ==================== COMBO & PROGRESSION ====================
  private increaseCombo(scoreGain: number) {
    this.stats.comboCount++;
    this.stats.comboScore += scoreGain;

    // Rank evaluation
    if (this.stats.comboCount >= 25) this.stats.comboRank = 'SSS';
    else if (this.stats.comboCount >= 18) this.stats.comboRank = 'S';
    else if (this.stats.comboCount >= 12) this.stats.comboRank = 'A';
    else if (this.stats.comboCount >= 7) this.stats.comboRank = 'B';
    else if (this.stats.comboCount >= 3) this.stats.comboRank = 'C';
    else this.stats.comboRank = 'D';

    // Increase procedural drum track intensity
    soundManager.setIntensity(this.stats.comboCount / 25);
    this.callbacks.onStatsUpdate({ ...this.stats });
  }

  public unlockSkill(skillId: string): boolean {
    const node = this.skills.find((s) => s.id === skillId);
    if (!node || node.unlocked) return false;
    if (this.stats.axePoints < node.cost) return false;

    this.stats.axePoints -= node.cost;
    node.unlocked = true;

    // Apply passives
    if (node.effectType === 'passive_atk') this.stats.attackPower += 8;
    if (node.effectType === 'passive_hp') {
      this.stats.maxHp += 40;
      this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 40);
    }

    soundManager.playSkillUnlock();
    this.callbacks.onStatsUpdate({ ...this.stats });
    return true;
  }

  // ==================== VISUAL FX & DAMAGE POPUPS ====================
  private triggerCameraShake(intensity: number) {
    this.cameraShakeIntensity = Math.min(this.cameraShakeIntensity + intensity, 1.2);
  }

  private addDamagePopup(text: string, worldPos: THREE.Vector3, color: string, isCrit: boolean) {
    if (this.isDisposed) return;
    // Project 3D pos to 2D screen coords
    _tempVec.copy(worldPos);
    _tempVec.y += 1.6;
    _tempVec.project(this.camera);

    // If behind or outside view frustum, discard
    if (_tempVec.z > 1.0 || _tempVec.z < -1.0) return;

    const widthHalf = this.container.clientWidth / 2;
    const heightHalf = this.container.clientHeight / 2;
    const screenX = _tempVec.x * widthHalf + widthHalf;
    const screenY = -(_tempVec.y * heightHalf) + heightHalf;

    const popup: DamageNumber = {
      id: this.nextPopupId++,
      text,
      x: screenX,
      y: screenY,
      color,
      isCrit,
      opacity: 1,
    };

    this.damagePopups.push(popup);
    this.callbacks.onDamagePopups([...this.damagePopups]);
  }

  // Pooled Particle Spark System
  private spawnHitSparks(pos: THREE.Vector3) {
    if (this.isDisposed) return;
    const count = 6;
    for (let i = 0; i < count; i++) {
      let sparkMesh = this.sparkPool.pop();
      if (!sparkMesh) {
        sparkMesh = new THREE.Mesh(this.sparkGeo, this.sparkMat);
        this.particleGroup.add(sparkMesh);
      }
      sparkMesh.position.copy(pos);
      sparkMesh.visible = true;

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 7,
        Math.random() * 4 + 2,
        (Math.random() - 0.5) * 7
      );

      this.activeSparks.push({
        mesh: sparkMesh,
        vel,
        life: 0.28,
        maxLife: 0.28,
      });
    }
  }

  // Pooled Elemental Aura Ring System
  private spawnElementalAuraBurst(pos: THREE.Vector3, orixa: OrixaType) {
    if (this.isDisposed) return;
    const colorHex = ORIXAS_CONFIG[orixa]?.accentColor || '#ffffff';

    let item = this.auraRingPool.pop();
    if (!item) {
      const mat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(this.ringGeo, mat);
      mesh.rotation.x = -Math.PI / 2;
      this.scene.add(mesh);
      item = { mesh, mat };
    } else {
      item.mat.color.set(colorHex);
      item.mat.opacity = 0.8;
      item.mesh.visible = true;
    }

    item.mesh.position.copy(pos);
    item.mesh.position.y = 0.08;
    item.mesh.scale.set(1, 1, 1);

    this.activeAuras.push({
      mesh: item.mesh,
      mat: item.mat,
      life: 0.35,
      maxLife: 0.35,
      scale: 1.0,
    });
  }

  private updateParticles(dt: number) {
    // Update sparks
    for (let i = this.activeSparks.length - 1; i >= 0; i--) {
      const s = this.activeSparks[i];
      s.mesh.position.addScaledVector(s.vel, dt);
      s.life -= dt;
      if (s.life <= 0) {
        s.mesh.visible = false;
        this.sparkPool.push(s.mesh);
        this.activeSparks.splice(i, 1);
      }
    }

    // Update elemental auras
    for (let i = this.activeAuras.length - 1; i >= 0; i--) {
      const a = this.activeAuras[i];
      a.scale += 4.5 * dt;
      a.mesh.scale.set(a.scale, 1, a.scale);
      a.life -= dt;
      a.mat.opacity = Math.max(0, (a.life / a.maxLife) * 0.8);
      if (a.life <= 0) {
        a.mesh.visible = false;
        this.auraRingPool.push({ mesh: a.mesh, mat: a.mat });
        this.activeAuras.splice(i, 1);
      }
    }
  }

  // Software WebGL pacing helper
  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.softwareTimeoutId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.isDisposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.softwareTimeoutId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.softwareTimeoutId = window.setTimeout(cb, 80);
      }
    };
    this.softwareTimeoutId = window.setTimeout(poll, 5);
  }

  // ==================== MAIN 60FPS SIMULATION LOOP ====================
  private loop() {
    if (this.isDisposed) return;

    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05); // Clamp frame delta

    // Hitstop logic
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      if (this.isSoftwareGl) {
        this.afterDraw(this.loop);
      } else {
        this.animFrameId = requestAnimationFrame(this.loop);
      }
      return;
    }

    const time = this.clock.getElapsedTime();

    // 1. Update Game Simulation
    if (this.gameState === 'playing') {
      this.updatePlayer(dt, time);
      this.updateEnemies(dt, time);
      this.updateCooldowns(dt);
      this.updateParticles(dt);
    } else if (this.gameState === 'title') {
      // Cinematic rotating camera around meditating hero on Title Screen
      this.cameraYaw += 0.004;
      this.hero.animateMovement(0, time);
      this.updateParticles(dt);
    }

    // 2. Update Camera & Shake
    this.updateCamera(dt);

    // 3. Update Popups
    this.updateDamagePopups(dt);

    // 4. Render
    this.renderer.render(this.scene, this.camera);

    // Schedule next frame with software-GL guard
    if (this.isSoftwareGl) {
      this.afterDraw(this.loop);
    } else {
      this.animFrameId = requestAnimationFrame(this.loop);
    }
  }

  private updatePlayer(dt: number, time: number) {
    let moveSpeed = 0;

    // Movement if not attacking/locked
    if (!this.isDodging && !this.isExecuting) {
      const forward = _tempVec.set(0, 0, -1).applyAxisAngle(THREE.Object3D.DEFAULT_UP, this.cameraYaw);
      const right = _camOffset.set(1, 0, 0).applyAxisAngle(THREE.Object3D.DEFAULT_UP, this.cameraYaw);
      const dir = new THREE.Vector3();

      if (this.keys['KeyW'] || this.keys['ArrowUp']) dir.add(forward);
      if (this.keys['KeyS'] || this.keys['ArrowDown']) dir.sub(forward);
      if (this.keys['KeyD'] || this.keys['ArrowRight']) dir.add(right);
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) dir.sub(right);

      if (dir.lengthSq() > 0.01) {
        dir.normalize();
        moveSpeed = this.stats.speed;
        this.hero.position.addScaledVector(dir, moveSpeed * dt);

        // Smooth turn towards movement direction
        const targetRot = Math.atan2(dir.x, dir.z);
        this.hero.rotation.y = THREE.MathUtils.damp(this.hero.rotation.y, targetRot, 14, dt);
      }

      // Bound player within arena radius
      const distFromCenter = this.hero.position.length();
      if (distFromCenter > 34) {
        this.hero.position.setLength(34);
      }
    }

    // Handle Attack Animation
    if (this.isAttacking) {
      this.attackTimer += dt;
      const progress = this.attackTimer / this.attackDuration;
      if (this.isHeavyAttacking) {
        this.hero.playHeavyPose(progress);
      } else {
        this.hero.playAttackPose(this.attackPhase, progress);
      }

      if (this.attackTimer >= this.attackDuration) {
        this.isAttacking = false;
      }
    } else if (this.isDodging) {
      this.dodgeTimer += dt;
      const progress = this.dodgeTimer / this.dodgeDuration;
      this.hero.playDodgePose(progress);
      this.hero.position.addScaledVector(this.dodgeDir, 16 * dt);

      if (this.dodgeTimer >= this.dodgeDuration) {
        this.isDodging = false;
        this.hero.rotation.x = 0;
        this.hero.position.y = 0;
      }
    } else {
      this.hero.animateMovement(moveSpeed, time);
    }

    // Passive Axé recharge & Combo decay
    if (this.stats.axe < this.stats.maxAxe) {
      this.stats.axe = Math.min(this.stats.maxAxe, this.stats.axe + 1.5 * dt);
    }
  }

  private updateEnemies(dt: number, time: number) {
    this.enemies.forEach((entity) => {
      if (entity.stats.hp <= 0) {
        // Death animation
        entity.deathTimer -= dt;
        entity.mesh.position.y = -0.5 * (1 - entity.deathTimer);
        entity.mesh.scale.multiplyScalar(0.97);
        if (entity.deathTimer <= 0) {
          this.scene.remove(entity.mesh);
        }
        return;
      }

      // Hit reaction
      if (entity.hitTimer > 0) {
        entity.hitTimer -= dt;
        return;
      }

      // AI: Chase hero
      const toHero = _tempVec.subVectors(this.hero.position, entity.mesh.position);
      const dist = toHero.length();

      // Look at hero
      entity.mesh.rotation.y = Math.atan2(toHero.x, toHero.z);

      const attackRange = entity.stats.isBoss ? 4.2 : 2.0;

      if (dist > attackRange) {
        // Move towards hero
        toHero.normalize();
        entity.mesh.position.addScaledVector(toHero, entity.stats.speed * dt);
      } else {
        // Attack hero
        entity.attackTimer += dt;
        if (entity.attackTimer >= 1.6) {
          entity.attackTimer = 0;

          // Damage player if not dodging
          if (!this.isDodging) {
            const rawDmg = entity.stats.attackPower - this.stats.defense * 0.4;
            const finalDmg = Math.max(5, Math.round(rawDmg));
            this.stats.hp -= finalDmg;

            soundManager.playClash();
            this.triggerCameraShake(0.35);
            this.addDamagePopup(`-${finalDmg}`, this.hero.position, '#ef4444', false);

            if (this.stats.hp <= 0) {
              this.stats.hp = 0;
              this.gameState = 'gameover';
              this.callbacks.onGameStateChange('gameover');
            }

            this.callbacks.onStatsUpdate({ ...this.stats });
          }
        }
      }

      // Specific boss/serpent animations
      if (entity.type === 'boitata') {
        (entity.mesh as BoitataModelGroup).animateSerpent?.(time);
      } else if (entity.type === 'mapinguari') {
        (entity.mesh as MapinguariModelGroup).animateBoss?.(time, entity.attackTimer > 1.2);
      }
    });

    // Remove dead enemies from array
    this.enemies = this.enemies.filter((e) => e.stats.hp > 0 || e.deathTimer > 0);
  }

  private updateCamera(dt: number) {
    // God of War style dynamic shoulder camera follow
    const heroPos = this.hero.position;

    // Boss fight expands camera distance
    const isBossActive = this.enemies.some((e) => e.stats.isBoss && e.stats.hp > 0);
    const targetDist = isBossActive ? 9.5 : 6.2;
    this.cameraDist = THREE.MathUtils.damp(this.cameraDist, targetDist, 4, dt);

    const cx = heroPos.x + Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDist;
    // Clamp height to at least 1.0 so camera never clips beneath the terrain ground
    const cy = Math.max(1.0, heroPos.y + Math.sin(this.cameraPitch) * this.cameraDist + 1.8);
    const cz = heroPos.z + Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDist;

    // Apply Camera Shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.cameraShakeIntensity > 0) {
      shakeX = (Math.random() - 0.5) * this.cameraShakeIntensity * 0.4;
      shakeY = (Math.random() - 0.5) * this.cameraShakeIntensity * 0.4;
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - dt * 2.2);
    }

    this.camera.position.set(cx + shakeX, cy + shakeY, cz);
    _camLook.set(heroPos.x, heroPos.y + 1.4, heroPos.z);
    this.camera.lookAt(_camLook);
  }

  private updateCooldowns(dt: number) {
    let changed = false;
    (Object.keys(this.skillCooldowns) as OrixaType[]).forEach((key) => {
      if (this.skillCooldowns[key] > 0) {
        this.skillCooldowns[key] = Math.max(0, this.skillCooldowns[key] - dt);
        changed = true;
      }
    });
    if (changed) {
      this.callbacks.onSkillCooldowns({ ...this.skillCooldowns });
    }
  }

  private updateDamagePopups(dt: number) {
    if (this.damagePopups.length === 0) return;

    this.damagePopups.forEach((p) => {
      p.y -= 35 * dt; // Float up
      p.opacity -= 1.2 * dt; // Fade out
    });

    const prevLen = this.damagePopups.length;
    this.damagePopups = this.damagePopups.filter((p) => p.opacity > 0);

    // Throttle React state update to avoid 60 dispatches per second
    this.popupUpdateTimer += dt;
    if (this.popupUpdateTimer >= 0.04 || this.damagePopups.length === 0 || this.damagePopups.length !== prevLen) {
      this.popupUpdateTimer = 0;
      this.callbacks.onDamagePopups([...this.damagePopups]);
    }
  }

  private disposeMaterial(mat: THREE.Material) {
    const record = mat as unknown as Record<string, unknown>;
    const textureKeys = [
      'map',
      'lightMap',
      'bumpMap',
      'normalMap',
      'specularMap',
      'envMap',
      'alphaMap',
      'roughnessMap',
      'metalnessMap',
      'emissiveMap',
    ];
    textureKeys.forEach((key) => {
      const tex = record[key] as THREE.Texture | undefined;
      if (tex && typeof tex.dispose === 'function') {
        tex.dispose();
      }
    });
    mat.dispose();
  }

  public dispose() {
    this.isDisposed = true;

    // 1. Cancel render loops and timers
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
    if (this.softwareTimeoutId !== null) {
      window.clearTimeout(this.softwareTimeoutId);
      this.softwareTimeoutId = null;
    }
    if (this.waveSpawnTimer !== null) {
      window.clearTimeout(this.waveSpawnTimer);
      this.waveSpawnTimer = null;
    }

    // 2. Abort all event listeners
    this.abortController.abort();

    // 3. Clear enemies
    this.clearAllEnemies();

    // 4. Dispose particle pools
    this.sparkGeo.dispose();
    this.sparkMat.dispose();
    this.ringGeo.dispose();
    this.sparkPool = [];
    this.activeSparks = [];
    this.auraRingPool.forEach((item) => {
      item.mat.dispose();
    });
    this.auraRingPool = [];
    this.activeAuras = [];

    // 5. Traverse and dispose scene objects
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh || (obj as THREE.Points).isPoints) {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => this.disposeMaterial(mat));
          } else {
            this.disposeMaterial(mesh.material);
          }
        }
      }
    });

    if (this.scene.environment) {
      this.scene.environment.dispose();
    }

    // 6. Remove canvas from DOM and dispose renderer
    if (this.renderer) {
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer.dispose();
    }

    // 7. Dispose Audio
    soundManager.dispose();
  }
}
