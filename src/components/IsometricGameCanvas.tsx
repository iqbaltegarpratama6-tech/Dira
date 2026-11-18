import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ChaosIncident,
  FloorCable,
  GameStats,
  HeldItemType,
  LaptopNode,
  PlayerConfig,
} from '../types/game';
import {
  BossNpcRig,
  TechnicianRig,
  buildAccessPointUnit,
  buildBossNPC,
  buildCLITerminal,
  buildCarriedItemMesh,
  buildCrimpingWorkbench,
  buildFoldingLadder,
  buildLaptopUnit,
  buildMCBPanel,
  buildOfficeChair,
  buildServerRack,
  buildSupplyBox,
  buildTechnicianCharacter,
  buildToolbox,
} from '../three/models';
import {
  createOfficeFloorTexture,
  createServerFloorTexture,
  createStorageFloorTexture,
  createWallSignTexture,
} from '../three/proceduralTextures';
import { sfx } from '../audio/sfx';

export interface GameControllerBridge {
  triggerAction: () => void;
  tidyMessyCables: () => void;
  completeCrimping: () => void;
  applyCliConfig: (updates: { vlan10?: boolean; vlan20?: boolean; dhcp?: boolean }) => void;
  restartGame: () => void;
}

interface IsometricGameCanvasProps {
  phase: 'lobby' | 'playing' | 'ended';
  coopMode: boolean;
  p1Config: PlayerConfig;
  p2Config: PlayerConfig;
  modalPaused: boolean;
  onStatsChange: (stats: GameStats) => void;
  onIncidentChange: (incident: ChaosIncident) => void;
  onHeldItemsChange: (p1: HeldItemType, p2: HeldItemType) => void;
  onPromptChange: (prompt: string | null) => void;
  onOpenCrimping: () => void;
  onOpenCli: () => void;
  controllerRef: React.MutableRefObject<GameControllerBridge | null>;
}

interface StationPoint {
  id: string;
  label: string;
  x: number;
  z: number;
  radius: number;
}

const STATIONS: StationPoint[] = [
  { id: 'mcb', label: 'Nyalakan Saklar MCB', x: -7.7, z: -2.5, radius: 1.75 },
  { id: 'server_rack', label: 'Dinginkan Rak Server', x: -7.0, z: -3.8, radius: 1.9 },
  { id: 'cli_terminal', label: 'Buka Terminal CLI & VLAN', x: -4.5, z: -3.5, radius: 1.9 },
  { id: 'crimp_bench', label: 'Meja Crimping RJ45 (T568B)', x: -1.1, z: -3.2, radius: 1.9 },
  { id: 'ap_pillar', label: 'Pasang Tangga / Access Point PoE', x: 0.6, z: -4.4, radius: 2.0 },
  { id: 'utp_shelf', label: 'Ambil Gulungan Kabel UTP', x: 5.5, z: -3.8, radius: 2.1 },
  { id: 'ap_crate', label: 'Ambil Unit Access Point PoE', x: 4.1, z: -2.0, radius: 1.75 },
  { id: 'ladder_rack', label: 'Ambil Tangga Lipat', x: 6.3, z: -2.1, radius: 1.8 },
  { id: 'table_top', label: 'Colok Kabel Patch (Meja A)', x: -0.6, z: 0.8, radius: 2.6 },
  { id: 'table_bottom', label: 'Colok Kabel Patch (Meja B)', x: -0.6, z: 3.6, radius: 2.6 },
];

const INITIAL_LAPTOPS: LaptopNode[] = [
  // Table A (Wired, VLAN 10 Panitia)
  ...[-0.8, 0.4, 1.6, 2.8, 4.0].map((lx, idx) => ({
    id: idx + 1,
    label: `Panitia-0${idx + 1}`,
    vlanGroup: 10 as const,
    connectionType: 'wired' as const,
    connected: false,
    cabled: false,
    ipConflict: true,
    x: lx,
    z: 0.8,
  })),
  // Table B (Wi-Fi via PoE AP, VLAN 20 Tamu)
  ...[-0.8, 0.4, 1.6, 2.8, 4.0].map((lx, idx) => ({
    id: idx + 6,
    label: `Tamu-0${idx + 1}`,
    vlanGroup: 20 as const,
    connectionType: 'wifi' as const,
    connected: false,
    cabled: false,
    ipConflict: true,
    x: lx,
    z: 3.6,
  })),
];

export const IsometricGameCanvas: React.FC<IsometricGameCanvasProps> = ({
  phase,
  coopMode,
  p1Config,
  p2Config,
  modalPaused,
  onStatsChange,
  onIncidentChange,
  onHeldItemsChange,
  onPromptChange,
  onOpenCrimping,
  onOpenCli,
  controllerRef,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  // Keep latest props in refs so WebGL mount never resets
  const propsRef = useRef({
    phase,
    coopMode,
    p1Config,
    p2Config,
    modalPaused,
    onStatsChange,
    onIncidentChange,
    onHeldItemsChange,
    onPromptChange,
    onOpenCrimping,
    onOpenCli,
  });
  propsRef.current = {
    phase,
    coopMode,
    p1Config,
    p2Config,
    modalPaused,
    onStatsChange,
    onIncidentChange,
    onHeldItemsChange,
    onPromptChange,
    onOpenCrimping,
    onOpenCli,
  };

  // Mutable simulation state stored in ref for zero-GC game loop
  const simRef = useRef<{
    stats: GameStats;
    incident: ChaosIncident;
    laptops: LaptopNode[];
    floorCables: FloorCable[];
    p1: {
      x: number;
      z: number;
      facing: number;
      heldItem: HeldItemType;
      stunTimer: number;
      clickTarget: { x: number; z: number } | null;
      pullOrigin: { x: number; z: number } | null;
    };
    p2: {
      x: number;
      z: number;
      facing: number;
      heldItem: HeldItemType;
      stunTimer: number;
      pullOrigin: { x: number; z: number } | null;
    };
    boss: {
      x: number;
      z: number;
      facing: number;
      waypointIdx: number;
    };
    nextIncidentAt: number;
    secondIncidentAt: number;
    blackoutTriggered: boolean;
    overheatTriggered: boolean;
    cablesDirty: boolean;
    syncVersion: number;
  }>({
    stats: {
      timeRemaining: 165,
      totalTime: 165,
      stability: 100,
      laptopsConnected: 0,
      totalLaptops: 10,
      vlan10Active: false,
      vlan20Active: false,
      dhcpActive: false,
      apInstalled: false,
      ladderPlaced: false,
      wiredCablesCrimped: 0,
      wiredCablesTarget: 2,
      messyCablesCount: 0,
      neatCablesCount: 0,
      stumbleCount: 0,
      incidentsResolved: 0,
      phase: 'lobby',
      victory: false,
    },
    incident: {
      blackout: false,
      overheat: false,
      overheatProgress: 0,
      bossAlertText: null,
    },
    laptops: INITIAL_LAPTOPS.map((l) => ({ ...l })),
    floorCables: [],
    p1: {
      x: -4.8,
      z: 1.8,
      facing: 0.4,
      heldItem: 'none',
      stunTimer: 0,
      clickTarget: null,
      pullOrigin: null,
    },
    p2: {
      x: -6.2,
      z: 0.8,
      facing: 0.3,
      heldItem: 'none',
      stunTimer: 0,
      pullOrigin: null,
    },
    boss: {
      x: 5.8,
      z: 2.2,
      facing: -1.5,
      waypointIdx: 0,
    },
    nextIncidentAt: 132,
    secondIncidentAt: 85,
    blackoutTriggered: false,
    overheatTriggered: false,
    cablesDirty: true,
    syncVersion: 0,
  });

  useEffect(() => {
    simRef.current.stats.phase = phase;
  }, [phase]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL Detection
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const aspect = width / height;

    // 2. Scene & Orthographic Isometric Camera (Classic 45-deg Cutaway Diorama)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x3b4758);
    scene.fog = new THREE.FogExp2(0x3b4758, 0.0075);

    const frustumSize = 13.8;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    );
    camera.position.set(13.0, 14.2, 13.0);
    camera.lookAt(0, 0.4, -0.2);

    // 3. Renderer (with graceful fallback if WebGL context is blocked)
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => e.preventDefault();
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    // 4. Studio PMREM Environment
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Fallback safely to scene lights if PMREM fails on constrained context
    }

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    // 5. Bright Warm/Cool Cutaway Interior Lighting
    const hemiLight = new THREE.HemisphereLight(0xfef9c3, 0x475569, 1.05);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.55);
    keyLight.position.set(11, 19, 12);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 45;
    keyLight.shadow.camera.left = -14;
    keyLight.shadow.camera.right = 14;
    keyLight.shadow.camera.top = 12;
    keyLight.shadow.camera.bottom = -12;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.45);
    rimLight.position.set(-14, 10, -12);
    scene.add(rimLight);

    // 6. Build Unified Cutaway Building Floorplan (1 Connected Layout)
    // Continuous surrounding exterior hallway floor so the building sits solidly in the world
    const outerGround = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.88, metalness: 0.06 })
    );
    outerGround.rotation.x = -Math.PI / 2;
    outerGround.position.y = -0.02;
    outerGround.receiveShadow = true;
    scene.add(outerGround);

    const gridHelper = new THREE.GridHelper(100, 50, 0x64748b, 0x526072);
    gridHelper.position.y = -0.012;
    scene.add(gridHelper);

    // Main Unified Room Floor (18m x 12m, warm cream/sand tile, top at y = 0)
    const floorMat = new THREE.MeshStandardMaterial({
      map: createOfficeFloorTexture(maxAnisotropy),
      roughness: 0.78,
      metalness: 0.04,
    });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(18, 0.08, 12), floorMat);
    floor.position.set(0, -0.04, 0);
    floor.receiveShadow = true;
    scene.add(floor);

    // Server Room Floor Patch (top-left corner x: -9..-3.2, z: -6..-0.5)
    const serverFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(5.8, 5.5),
      new THREE.MeshStandardMaterial({
        map: createServerFloorTexture(maxAnisotropy),
        roughness: 0.72,
        metalness: 0.12,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );
    serverFloor.rotation.x = -Math.PI / 2;
    serverFloor.position.set(-6.1, 0.008, -3.25);
    serverFloor.receiveShadow = true;
    scene.add(serverFloor);

    // Gudang / Storage Bay Platform (top-right bay x: 3.2..9.0, z: -6..-1.2, subtle 0.06m step)
    const storageFloor = new THREE.Mesh(
      new THREE.BoxGeometry(5.8, 0.06, 4.8),
      new THREE.MeshStandardMaterial({
        map: createStorageFloorTexture(maxAnisotropy),
        roughness: 0.75,
        metalness: 0.05,
      })
    );
    storageFloor.position.set(6.1, 0.03, -3.6);
    storageFloor.receiveShadow = true;
    scene.add(storageFloor);

    // Architectural Cutaway Walls with Warm Tan Top Caps
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.72, metalness: 0.05 });
    const wallCapMat = new THREE.MeshStandardMaterial({ color: 0xd6b48e, roughness: 0.6, metalness: 0.05 });
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.55, metalness: 0.25 });

    const addCutawayWall = (x: number, z: number, w: number, h: number, d: number) => {
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      body.position.set(x, h / 2, z);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.07, d + 0.04), wallCapMat);
      cap.position.set(x, h + 0.035, z);
      scene.add(cap);
    };

    // Full-height back & left cutaway walls
    addCutawayWall(0, -6.0, 18.32, 2.85, 0.32);
    addCutawayWall(-9.0, 0, 0.32, 2.85, 12.32);

    // Low cutaway foreground sills (right & front) so camera view is 100% open
    addCutawayWall(9.0, 0, 0.32, 0.36, 12.32);
    addCutawayWall(0, 6.0, 18.32, 0.36, 0.32);

    // Server Room Interior Partition Wall (with open doorway x: -7.2..-5.2)
    addCutawayWall(-3.2, -3.25, 0.28, 2.25, 5.5); // Right wall of Server Room
    addCutawayWall(-8.1, -0.5, 1.8, 2.25, 0.28); // Front-left segment
    addCutawayWall(-4.2, -0.5, 2.1, 2.25, 0.28); // Front-right segment

    // Doorway frame & lintel over Server Room entrance
    const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x7c5333, roughness: 0.6 });
    const doorLintel = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.38, 0.32), wallMat);
    doorLintel.position.set(-6.2, 2.06, -0.5);
    scene.add(doorLintel);
    const doorLintelCap = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.07, 0.34), wallCapMat);
    doorLintelCap.position.set(-6.2, 2.285, -0.5);
    scene.add(doorLintelCap);
    for (const dx of [-7.18, -5.22]) {
      const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.9, 0.34), doorFrameMat);
      jamb.position.set(dx, 0.95, -0.5);
      scene.add(jamb);
    }

    // Wall Baseboards & Multi-Colored Wall Cable Bundles (matches reference illustration)
    const addCableBundle = (
      points: Array<[number, number, number]>,
      hex: number,
      emissiveHex: number,
      radius = 0.032
    ) => {
      const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 18, radius, 6, false),
        new THREE.MeshStandardMaterial({
          color: hex,
          emissive: emissiveHex,
          emissiveIntensity: 0.35,
          roughness: 0.4,
        })
      );
      scene.add(tube);
    };
    // Wall-mounted cable runs from Server Room along back wall to PoE Beam & Storage
    addCableBundle([[-7.8, 1.9, -5.78], [-3.2, 1.9, -5.78], [0.6, 2.35, -5.78]], 0x06b6d4, 0x0891b2);
    addCableBundle([[-7.8, 1.78, -5.78], [-3.2, 1.78, -5.78], [0.6, 2.25, -5.78]], 0x22c55e, 0x16a34a);
    addCableBundle([[-8.78, 1.4, -2.5], [-8.78, 0.25, -2.5], [-7.6, 0.06, -0.5], [-6.2, 0.04, 0.5]], 0xf59e0b, 0xd97706);

    // Subtle neat floor conduit lines
    const addFloorStrip = (x: number, z: number, w: number, d: number, hex: number) => {
      const strip = new THREE.Mesh(
        new THREE.PlaneGeometry(w, d),
        new THREE.MeshStandardMaterial({
          color: hex,
          emissive: hex,
          emissiveIntensity: 0.6,
          roughness: 0.35,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        })
      );
      strip.rotation.x = -Math.PI / 2;
      strip.position.set(x, 0.015, z);
      scene.add(strip);
    };
    addFloorStrip(1.2, -1.5, 9.2, 0.09, 0x06b6d4); // Main rear cable conduit
    addFloorStrip(-2.3, 0.4, 0.09, 3.8, 0x06b6d4); // Link to Table A

    // Wall-Mounted Plaques ("Server Room", "Seminar Area", "Gudang / Storage")
    const addWallPlaque = (
      title: string,
      x: number,
      y: number,
      z: number,
      rotY = 0
    ) => {
      const plaque = new THREE.Mesh(
        new THREE.PlaneGeometry(2.3, 0.58),
        new THREE.MeshBasicMaterial({
          map: createWallSignTexture(title, maxAnisotropy),
          transparent: true,
        })
      );
      plaque.position.set(x, y, z);
      plaque.rotation.y = rotY;
      scene.add(plaque);
    };
    addWallPlaque('Server Room', -6.1, 2.35, -5.81, 0);
    addWallPlaque('Seminar Area', -3.03, 1.85, -2.0, Math.PI / 2);
    addWallPlaque('Gudang / Storage', 6.1, 2.35, -5.81, 0);

    // SERVER ROOM (Top-Left Nook): 2 Server Racks + CLI Terminal + Chair + MCB
    const serverRack = buildServerRack(maxAnisotropy);
    serverRack.group.position.set(-7.8, 0, -5.0);
    scene.add(serverRack.group);

    const serverRack2 = buildServerRack(maxAnisotropy);
    serverRack2.group.position.set(-6.1, 0, -5.0);
    scene.add(serverRack2.group);

    const cliTerminal = buildCLITerminal(maxAnisotropy);
    cliTerminal.position.set(-4.35, 0, -4.85);
    scene.add(cliTerminal);

    const cliChair = buildOfficeChair();
    cliChair.position.set(-4.35, 0, -3.85);
    cliChair.rotation.y = Math.PI;
    scene.add(cliChair);

    const mcbPanel = buildMCBPanel();
    mcbPanel.group.position.set(-8.78, 0, -2.5);
    mcbPanel.group.rotation.y = Math.PI / 2;
    scene.add(mcbPanel.group);

    // SEMINAR BACK-CENTER: Crimping Workbench + Wooden PoE Beam + Ladder + AP
    const crimpBench = buildCrimpingWorkbench();
    crimpBench.position.set(-2.45, 0, -3.2);
    crimpBench.rotation.y = Math.PI / 2;
    scene.add(crimpBench);

    const poeBeam = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 0.3, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 })
    );
    poeBeam.position.set(0.6, 2.55, -5.66);
    poeBeam.castShadow = true;
    scene.add(poeBeam);

    const apMountRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.04, 10, 24),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.65 })
    );
    apMountRing.position.set(0.6, 2.4, -5.44);
    scene.add(apMountRing);

    const placedLadder = buildFoldingLadder();
    placedLadder.position.set(0.6, 0, -4.75);
    placedLadder.visible = false;
    scene.add(placedLadder);

    const mountedAP = buildAccessPointUnit(true);
    mountedAP.rotation.x = Math.PI / 2;
    mountedAP.position.set(0.6, 2.4, -5.42);
    mountedAP.visible = false;
    scene.add(mountedAP);

    // SEMINAR TABLES + 10 LAPTOPS
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, metalness: 0.15 });
    const tableLegMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.6 });
    for (const tz of [0.8, 3.6]) {
      const top = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.12, 1.25), tableMat);
      top.position.set(1.6, 0.78, tz);
      top.castShadow = true;
      top.receiveShadow = true;
      scene.add(top);

      for (const lx of [-1.3, 4.5]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.76, 1.05), tableLegMat);
        leg.position.set(lx, 0.38, tz);
        leg.castShadow = true;
        scene.add(leg);
      }

      if (tz < 2) {
        const hub = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.18, 0.38),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x06b6d4, emissiveIntensity: 0.4 })
        );
        hub.position.set(-1.95, 0.88, tz);
        scene.add(hub);
      }
    }

    const laptopRigs = simRef.current.laptops.map((l) => {
      const rig = buildLaptopUnit();
      rig.group.position.set(l.x, 0.84, l.z);
      if (l.z > 2) rig.group.rotation.y = Math.PI;
      scene.add(rig.group);
      return rig;
    });

    // GUDANG / STORAGE BAY (Top-Right Open Bay, floor y = 0.06)
    const spoolColors = [0x06b6d4, 0x22c55e, 0xf59e0b];
    for (let i = 0; i < 3; i++) {
      const spool = buildCarriedItemMesh('utp_spool');
      spool.scale.setScalar(1.35);
      // Tint coil mesh
      const coil = spool.children[2] as THREE.Mesh | undefined;
      if (coil && coil.material instanceof THREE.MeshStandardMaterial) {
        const tintedMat = coil.material.clone() as THREE.MeshStandardMaterial;
        tintedMat.color.setHex(spoolColors[i]);
        tintedMat.emissive.setHex(spoolColors[i]);
        tintedMat.emissiveIntensity = 0.35;
        coil.material = tintedMat;
      }
      spool.position.set(4.5 + i * 1.1, 0.06 + 0.18 * 1.35, -5.0);
      scene.add(spool);
    }

    const toolbox = buildToolbox();
    toolbox.position.set(7.9, 0.06, -5.0);
    scene.add(toolbox);

    const supplyBox1 = buildSupplyBox();
    supplyBox1.position.set(8.05, 0.06, -3.5);
    supplyBox1.rotation.y = -0.35;
    scene.add(supplyBox1);

    const supplyBox2 = buildSupplyBox();
    supplyBox2.position.set(8.05, 0.06, -2.35);
    supplyBox2.rotation.y = 0.25;
    scene.add(supplyBox2);

    // Folding Ladder grounded in Storage Bay
    const storageLadder = buildFoldingLadder();
    storageLadder.position.set(6.3, 0.06, -3.0);
    scene.add(storageLadder);

    // Spare AP resting flush on a low wooden supply crate in Storage Bay
    const apCrate = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.45, 0.85),
      new THREE.MeshStandardMaterial({ color: 0xa37b52, roughness: 0.75 })
    );
    apCrate.position.set(4.1, 0.06 + 0.225, -2.8);
    apCrate.castShadow = true;
    apCrate.receiveShadow = true;
    scene.add(apCrate);

    const spareAP = buildAccessPointUnit(false);
    spareAP.position.set(4.1, 0.06 + 0.45 + 0.05, -2.8);
    scene.add(spareAP);

    // 7. Dynamic Actors: P1, P2, Boss NPC
    let p1Rig: TechnicianRig = buildTechnicianCharacter(
      propsRef.current.p1Config.gender,
      propsRef.current.p1Config.slot
    );
    scene.add(p1Rig.group);
    let p1LastCfg = `${propsRef.current.p1Config.gender}-${propsRef.current.p1Config.slot}`;

    let p2Rig: TechnicianRig = buildTechnicianCharacter(
      propsRef.current.p2Config.gender,
      propsRef.current.p2Config.slot
    );
    p2Rig.group.visible = propsRef.current.coopMode;
    scene.add(p2Rig.group);
    let p2LastCfg = `${propsRef.current.p2Config.gender}-${propsRef.current.p2Config.slot}`;

    const bossRig: BossNpcRig = buildBossNPC();
    scene.add(bossRig.group);

    // Dynamic Floor Cables Group & Live Trailing Cable
    const cablesGroup = new THREE.Group();
    scene.add(cablesGroup);

    const liveCableMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.9,
    });
    let liveCableMesh: THREE.Mesh | null = null;

    // 8. Input Handling (Keyboard + Mouse Click-to-Move)
    const keys: Record<string, boolean> = {};
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hitVec = new THREE.Vector3();

    const rebuildFloorCables = () => {
      while (cablesGroup.children.length > 0) {
        const child = cablesGroup.children[0] as THREE.Mesh;
        child.geometry?.dispose();
        cablesGroup.remove(child);
      }
      for (const cable of simRef.current.floorCables) {
        const pts = cable.points.map((p) => new THREE.Vector3(p.x, 0.055, p.z));
        if (pts.length < 2) continue;
        const curve = new THREE.CatmullRomCurve3(pts);
        const geo = new THREE.TubeGeometry(curve, 20, 0.05, 8, false);
        const mat = new THREE.MeshStandardMaterial({
          color: cable.neat ? 0x10b981 : 0xf59e0b,
          emissive: cable.neat ? 0x059669 : 0xd97706,
          emissiveIntensity: cable.neat ? 0.75 : 0.95,
          roughness: 0.35,
        });
        cablesGroup.add(new THREE.Mesh(geo, mat));
      }
      simRef.current.cablesDirty = false;
    };

    const syncUi = () => {
      const s = simRef.current;
      s.stats.messyCablesCount = s.floorCables.filter((c) => !c.neat).length;
      s.stats.neatCablesCount = s.floorCables.filter((c) => c.neat).length;
      s.stats.laptopsConnected = s.laptops.filter((l) => l.connected).length;
      propsRef.current.onStatsChange({ ...s.stats });
      propsRef.current.onIncidentChange({ ...s.incident });
      propsRef.current.onHeldItemsChange(s.p1.heldItem, s.p2.heldItem);
    };

    const evaluateNetworkState = () => {
      const s = simRef.current;
      const prevConnected = s.laptops.filter((l) => l.connected).length;

      s.laptops.forEach((lap, idx) => {
        if (lap.connectionType === 'wired') {
          const trunkReady =
            (idx < 3 && s.stats.wiredCablesCrimped >= 1) ||
            (idx >= 3 && s.stats.wiredCablesCrimped >= 2);
          lap.cabled = trunkReady;
          lap.ipConflict = !s.stats.dhcpActive;
          lap.connected =
            !s.incident.blackout &&
            trunkReady &&
            s.stats.vlan10Active &&
            s.stats.dhcpActive;
        } else {
          lap.cabled = s.stats.apInstalled;
          lap.ipConflict = !s.stats.dhcpActive;
          lap.connected =
            !s.incident.blackout &&
            s.stats.apInstalled &&
            s.stats.vlan20Active &&
            s.stats.dhcpActive;
        }

        const rig = laptopRigs[idx];
        if (lap.connected) {
          rig.screenMat.emissive.setHex(0x10b981);
          rig.statusSprite.material.map = rig.onlineTex;
        } else if (lap.cabled && !s.stats.dhcpActive) {
          rig.screenMat.emissive.setHex(0xf59e0b);
          rig.statusSprite.material.map = rig.conflictTex;
        } else {
          rig.screenMat.emissive.setHex(0xef4444);
          rig.statusSprite.material.map = rig.offlineTex;
        }
        rig.statusSprite.material.needsUpdate = true;
      });

      const nowConnected = s.laptops.filter((l) => l.connected).length;
      if (nowConnected > prevConnected) {
        sfx.playLaptopConnected();
      }
      if (
        s.stats.phase === 'playing' &&
        nowConnected === s.stats.totalLaptops &&
        s.stats.vlan10Active &&
        s.stats.vlan20Active
      ) {
        s.stats.phase = 'ended';
        s.stats.victory = true;
        sfx.playVictory();
      }
      syncUi();
    };

    const getNearestStation = (px: number, pz: number): StationPoint | null => {
      let best: StationPoint | null = null;
      let bestDist = Infinity;
      for (const st of STATIONS) {
        const d = Math.hypot(px - st.x, pz - st.z);
        if (d <= st.radius && d < bestDist) {
          best = st;
          bestDist = d;
        }
      }
      return best;
    };

    const interactForPlayer = (playerKey: 'p1' | 'p2') => {
      const s = simRef.current;
      if (s.stats.phase !== 'playing' || propsRef.current.modalPaused) return;
      const actor = s[playerKey];
      if (actor.stunTimer > 0) return;

      const st = getNearestStation(actor.x, actor.z);
      if (!st) return;

      if (st.id === 'mcb' && s.incident.blackout) {
        s.incident.blackout = false;
        s.stats.incidentsResolved += 1;
        sfx.playPowerRestore();
        evaluateNetworkState();
        return;
      }

      if (st.id === 'server_rack' && s.incident.overheat) {
        s.incident.overheat = false;
        s.incident.overheatProgress = 0;
        s.stats.incidentsResolved += 1;
        sfx.playPowerRestore();
        evaluateNetworkState();
        return;
      }

      if (st.id === 'cli_terminal') {
        propsRef.current.onOpenCli();
        return;
      }

      if (st.id === 'utp_shelf' && actor.heldItem === 'none') {
        actor.heldItem = 'utp_spool';
        actor.pullOrigin = { x: st.x, z: st.z };
        sfx.playPickup();
        syncUi();
        return;
      }

      if (st.id === 'crimp_bench' && actor.heldItem === 'utp_spool') {
        propsRef.current.onOpenCrimping();
        return;
      }

      if ((st.id === 'table_top' || st.id === 'table_bottom') && actor.heldItem === 'utp_spool') {
        // Convenience: prompt crimping directly if carrying spool to table
        propsRef.current.onOpenCrimping();
        return;
      }

      if ((st.id === 'table_top' || st.id === 'table_bottom') && actor.heldItem === 'crimped_cable') {
        if (s.stats.wiredCablesCrimped < s.stats.wiredCablesTarget) {
          s.stats.wiredCablesCrimped += 1;
          const startPt = actor.pullOrigin ?? { x: -1.1, z: -3.2 };
          const midX = (startPt.x + st.x) * 0.5;
          // If player walked straight down through center walkway, cable becomes messy hazard!
          const isMessy = actor.x > -1.0 && actor.z > -0.5;
          s.floorCables.push({
            id: `cable-${Date.now()}-${Math.random()}`,
            points: [startPt, { x: midX, z: isMessy ? 2.1 : -1.5 }, { x: st.x, z: st.z }],
            neat: !isMessy,
            color: isMessy ? 0xf59e0b : 0x10b981,
          });
          s.cablesDirty = true;
          actor.heldItem = 'none';
          actor.pullOrigin = null;
          sfx.playDrop();
          evaluateNetworkState();
        }
        return;
      }

      if (st.id === 'ladder_rack' && actor.heldItem === 'none' && !s.stats.ladderPlaced) {
        actor.heldItem = 'ladder';
        storageLadder.visible = false;
        sfx.playPickup();
        syncUi();
        return;
      }

      if (st.id === 'ap_crate' && actor.heldItem === 'none' && !s.stats.apInstalled) {
        actor.heldItem = 'access_point';
        spareAP.visible = false;
        sfx.playPickup();
        syncUi();
        return;
      }

      if (st.id === 'ap_pillar') {
        if (actor.heldItem === 'ladder') {
          s.stats.ladderPlaced = true;
          placedLadder.visible = true;
          actor.heldItem = 'none';
          sfx.playDrop();
          syncUi();
          return;
        }
        if (actor.heldItem === 'access_point' && s.stats.ladderPlaced) {
          s.stats.apInstalled = true;
          mountedAP.visible = true;
          actor.heldItem = 'none';
          sfx.playLaptopConnected();
          evaluateNetworkState();
          return;
        }
      }
    };

    controllerRef.current = {
      triggerAction: () => interactForPlayer('p1'),
      tidyMessyCables: () => {
        const s = simRef.current;
        s.floorCables = s.floorCables.map((c) => ({
          ...c,
          neat: true,
          points: [c.points[0], { x: -2.3, z: -1.5 }, c.points[c.points.length - 1]],
        }));
        s.cablesDirty = true;
        sfx.playCrimpClick();
        syncUi();
      },
      completeCrimping: () => {
        const s = simRef.current;
        if (s.p1.heldItem === 'utp_spool') {
          s.p1.heldItem = 'crimped_cable';
        } else if (s.p2.heldItem === 'utp_spool') {
          s.p2.heldItem = 'crimped_cable';
        }
        syncUi();
      },
      applyCliConfig: (updates) => {
        const s = simRef.current;
        if (updates.vlan10) s.stats.vlan10Active = true;
        if (updates.vlan20) s.stats.vlan20Active = true;
        if (updates.dhcp) s.stats.dhcpActive = true;
        evaluateNetworkState();
      },
      restartGame: () => {
        const s = simRef.current;
        s.stats = {
          timeRemaining: 165,
          totalTime: 165,
          stability: 100,
          laptopsConnected: 0,
          totalLaptops: 10,
          vlan10Active: false,
          vlan20Active: false,
          dhcpActive: false,
          apInstalled: false,
          ladderPlaced: false,
          wiredCablesCrimped: 0,
          wiredCablesTarget: 2,
          messyCablesCount: 0,
          neatCablesCount: 0,
          stumbleCount: 0,
          incidentsResolved: 0,
          phase: 'playing',
          victory: false,
        };
        s.incident = { blackout: false, overheat: false, overheatProgress: 0, bossAlertText: null };
        s.laptops = INITIAL_LAPTOPS.map((l) => ({ ...l }));
        s.floorCables = [];
        s.cablesDirty = true;
        s.p1 = { x: -4.8, z: 1.8, facing: 0.4, heldItem: 'none', stunTimer: 0, clickTarget: null, pullOrigin: null };
        s.p2 = { x: -6.2, z: 0.8, facing: 0.3, heldItem: 'none', stunTimer: 0, pullOrigin: null };
        s.blackoutTriggered = false;
        s.overheatTriggered = false;
        placedLadder.visible = false;
        storageLadder.visible = true;
        mountedAP.visible = false;
        spareAP.visible = true;
        evaluateNetworkState();
      },
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (propsRef.current.modalPaused) return;
      keys[e.code] = true;
      if (e.code === 'KeyE' || e.code === 'Space') {
        interactForPlayer('p1');
      }
      if ((e.code === 'Enter' || e.code === 'ShiftRight') && propsRef.current.coopMode) {
        interactForPlayer('p2');
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (propsRef.current.phase !== 'playing' || propsRef.current.modalPaused) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectPlane(groundPlane, hitVec)) {
        simRef.current.p1.clickTarget = {
          x: THREE.MathUtils.clamp(hitVec.x, -8.3, 8.3),
          z: THREE.MathUtils.clamp(hitVec.z, -5.3, 5.3),
        };
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      const asp = w / h;
      camera.left = (-frustumSize * asp) / 2;
      camera.right = (frustumSize * asp) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Helper for updating held item mesh on technician
    let p1LastItem: HeldItemType = 'none';
    let p2LastItem: HeldItemType = 'none';

    const syncHeldVisual = (rig: TechnicianRig, item: HeldItemType) => {
      while (rig.heldSlot.children.length > 0) {
        rig.heldSlot.remove(rig.heldSlot.children[0]);
      }
      if (item !== 'none') {
        rig.heldSlot.add(buildCarriedItemMesh(item));
      }
    };

    let lastTimeMs = performance.now();
    let elapsedTotal = 0;
    let frameId = 0;
    let lastUiSync = 0;
    const bossWaypoints = [
      { x: 5.8, z: 2.2 },
      { x: 5.8, z: 4.9 },
      { x: -2.6, z: 4.9 },
      { x: -2.6, z: -0.4 },
      { x: 5.8, z: -0.4 },
    ];

    function afterDraw(cb: () => void, pauseMs = 100) {
      const gl = renderer.getContext() as WebGL2RenderingContext | null;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, pauseMs);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      if (!sync) {
        frameId = window.setTimeout(cb, pauseMs);
        return;
      }
      gl.flush();
      const poll = () => {
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 20);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, pauseMs);
        }
      };
      frameId = window.setTimeout(poll, 20);
    }

    const updatePlayerPhysics = (
      actor: typeof simRef.current.p1 | typeof simRef.current.p2,
      rig: TechnicianRig,
      dxInput: number,
      dzInput: number,
      dt: number,
      elapsed: number
    ) => {
      if (actor.stunTimer > 0) {
        actor.stunTimer = Math.max(0, actor.stunTimer - dt);
        rig.stunStars.visible = true;
        rig.stunStars.rotation.y += dt * 6;
        rig.group.rotation.z = Math.sin(elapsed * 22) * 0.18;
        return;
      }
      rig.stunStars.visible = false;
      rig.group.rotation.z = THREE.MathUtils.damp(rig.group.rotation.z, 0, 12, dt);

      let mx = dxInput;
      let mz = dzInput;

      // Support Click-to-Move on P1
      if ('clickTarget' in actor && actor.clickTarget && mx === 0 && mz === 0) {
        const tx = actor.clickTarget.x - actor.x;
        const tz = actor.clickTarget.z - actor.z;
        const dist = Math.hypot(tx, tz);
        if (dist < 0.25) {
          actor.clickTarget = null;
        } else {
          mx = tx / dist;
          mz = tz / dist;
        }
      } else if ('clickTarget' in actor && (mx !== 0 || mz !== 0)) {
        actor.clickTarget = null;
      }

      const isBlocked = (tx: number, tz: number) => {
        // Server Room interior walls with open doorway at x: -7.2 .. -5.2
        const hitServerRightWall = Math.abs(tx + 3.2) < 0.48 && tz < -0.2;
        const hitServerFrontLeft = tx < -7.15 && Math.abs(tz + 0.5) < 0.45;
        const hitServerFrontRight = tx > -5.25 && tx < -2.9 && Math.abs(tz + 0.5) < 0.45;
        // Props inside Server Room & Seminar Hall
        const hitServerRacks = tx < -5.3 && tz < -4.2;
        const hitCli = Math.abs(tx + 4.35) < 1.0 && tz < -4.1;
        const hitCrimpBench = tx > -3.1 && tx < -1.65 && Math.abs(tz + 3.2) < 1.1;
        // Seminar Client Tables
        const hitTableA = tx > -2.0 && tx < 5.2 && Math.abs(tz - 0.8) < 0.9;
        const hitTableB = tx > -2.0 && tx < 5.2 && Math.abs(tz - 3.6) < 0.9;
        // Storage boxes & spools back-right
        const hitSpools = tx > 3.9 && tx < 8.4 && tz < -4.3;
        const hitBoxes = tx > 7.3 && tz > -4.3 && tz < -1.7;
        return (
          hitServerRightWall ||
          hitServerFrontLeft ||
          hitServerFrontRight ||
          hitServerRacks ||
          hitCli ||
          hitCrimpBench ||
          hitTableA ||
          hitTableB ||
          hitSpools ||
          hitBoxes
        );
      };

      const len = Math.hypot(mx, mz);
      const speed = 5.4;
      if (len > 0.01) {
        const nx = THREE.MathUtils.clamp(actor.x + (mx / len) * speed * dt, -8.3, 8.3);
        const nz = THREE.MathUtils.clamp(actor.z + (mz / len) * speed * dt, -5.3, 5.3);

        // Axis-separated sliding collision
        if (!isBlocked(nx, actor.z)) {
          actor.x = nx;
        }
        if (!isBlocked(actor.x, nz)) {
          actor.z = nz;
        }

        const targetRot = Math.atan2(mx, mz);
        const diff = Math.atan2(Math.sin(targetRot - actor.facing), Math.cos(targetRot - actor.facing));
        actor.facing += diff * Math.min(1, dt * 12);

        const swing = Math.sin(elapsed * 14) * 0.6;
        rig.leftLeg.rotation.x = swing;
        rig.rightLeg.rotation.x = -swing;
        rig.leftArm.rotation.x = -swing * 0.7;
        rig.rightArm.rotation.x = swing * 0.7;
      } else {
        rig.leftLeg.rotation.x = THREE.MathUtils.damp(rig.leftLeg.rotation.x, 0, 12, dt);
        rig.rightLeg.rotation.x = THREE.MathUtils.damp(rig.rightLeg.rotation.x, 0, 12, dt);
        rig.leftArm.rotation.x = THREE.MathUtils.damp(rig.leftArm.rotation.x, 0, 12, dt);
        rig.rightArm.rotation.x = THREE.MathUtils.damp(rig.rightArm.rotation.x, 0, 12, dt);
      }

      // Check messy floor cable stumble
      for (const cable of simRef.current.floorCables) {
        if (!cable.neat && Math.abs(actor.z - 2.1) < 0.7 && Math.abs(actor.x) < 2.2) {
          if (Math.random() < dt * 1.4) {
            actor.stunTimer = 1.2;
            simRef.current.stats.stumbleCount += 1;
            sfx.playStumble();
          }
        }
      }

      rig.group.position.set(actor.x, 0, actor.z);
      rig.group.rotation.y = actor.facing;
    };

    const tick = () => {
      const nowMs = performance.now();
      const dt = Math.min((nowMs - lastTimeMs) / 1000, 0.05);
      lastTimeMs = nowMs;
      elapsedTotal += dt;
      const elapsed = elapsedTotal;
      const s = simRef.current;
      const { phase: curPhase, coopMode: isCoop, p1Config: c1, p2Config: c2, modalPaused: paused } =
        propsRef.current;

      // Live character appearance rebuild if customized in lobby
      const sig1 = `${c1.gender}-${c1.slot}`;
      if (sig1 !== p1LastCfg) {
        scene.remove(p1Rig.group);
        p1Rig = buildTechnicianCharacter(c1.gender, c1.slot);
        scene.add(p1Rig.group);
        p1LastCfg = sig1;
        p1LastItem = 'none';
      }
      const sig2 = `${c2.gender}-${c2.slot}`;
      if (sig2 !== p2LastCfg) {
        scene.remove(p2Rig.group);
        p2Rig = buildTechnicianCharacter(c2.gender, c2.slot);
        scene.add(p2Rig.group);
        p2LastCfg = sig2;
        p2LastItem = 'none';
      }
      p2Rig.group.visible = isCoop;

      if (s.cablesDirty) {
        rebuildFloorCables();
      }

      if (curPhase === 'lobby') {
        // Gentle cutaway showcase angle (never spins into outer void)
        const sway = isSoftwareGl ? 0 : Math.sin(elapsed * 0.4) * 0.9;
        camera.position.x = 13.0 + sway;
        camera.position.z = 13.0 - sway * 0.5;
        camera.position.y = 14.2;
        camera.lookAt(0, 0.4, -0.2);
        p1Rig.group.position.set(-4.8, 0, 1.8);
        p1Rig.group.rotation.y = 0.4;
        p2Rig.group.position.set(-6.2, 0, 0.8);
        p2Rig.group.rotation.y = 0.3;
      } else {
        // Smooth camera follow / restore standard isometric cutaway angle
        camera.position.x = THREE.MathUtils.damp(camera.position.x, 13.0 + s.p1.x * 0.12, 4, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, 14.2, 4, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, 13.0 + s.p1.z * 0.12, 4, dt);
        camera.lookAt(s.p1.x * 0.12, 0.4, -0.2 + s.p1.z * 0.12);
      }

      if (curPhase === 'playing' && !paused) {
        s.stats.timeRemaining = Math.max(0, s.stats.timeRemaining - dt);

        // Trigger Dynamic Chaos Incidents
        if (!s.blackoutTriggered && s.stats.timeRemaining <= s.nextIncidentAt) {
          s.blackoutTriggered = true;
          s.incident.blackout = true;
          sfx.playBlackout();
          evaluateNetworkState();
        }
        if (!s.overheatTriggered && s.stats.timeRemaining <= s.secondIncidentAt) {
          s.overheatTriggered = true;
          s.incident.overheat = true;
          sfx.playOverheatAlarm();
        }

        if (s.incident.overheat) {
          s.stats.stability = Math.max(0, s.stats.stability - dt * 2.2);
          serverRack.overheatGlow.intensity = 2.5 + Math.sin(elapsed * 12) * 1.2;
          serverRack.sparkGroup.visible = true;
          serverRack.sparkGroup.rotation.y += dt * 4;
        } else {
          serverRack.overheatGlow.intensity = 0;
          serverRack.sparkGroup.visible = false;
        }

        // Lighting response for Blackout
        const targetKeyInt = s.incident.blackout ? 0.16 : 1.55;
        const targetHemiInt = s.incident.blackout ? 0.18 : 1.05;
        keyLight.intensity = THREE.MathUtils.damp(keyLight.intensity, targetKeyInt, 6, dt);
        hemiLight.intensity = THREE.MathUtils.damp(hemiLight.intensity, targetHemiInt, 6, dt);
        mcbPanel.lever.position.y = s.incident.blackout ? 1.28 : 1.52;
        mcbPanel.statusMat.color.setHex(s.incident.blackout ? 0xef4444 : 0x22c55e);
        mcbPanel.statusMat.emissive.setHex(s.incident.blackout ? 0xef4444 : 0x22c55e);

        // P1 movement
        const p1dx = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0);
        const p1dz = (keys['KeyS'] ? 1 : 0) - (keys['KeyW'] ? 1 : 0);
        updatePlayerPhysics(s.p1, p1Rig, p1dx, p1dz, dt, elapsed);

        // P2 movement
        if (isCoop) {
          const p2dx = (keys['ArrowRight'] ? 1 : 0) - (keys['ArrowLeft'] ? 1 : 0);
          const p2dz = (keys['ArrowDown'] ? 1 : 0) - (keys['ArrowUp'] ? 1 : 0);
          updatePlayerPhysics(s.p2, p2Rig, p2dx, p2dz, dt, elapsed);
        }

        // Live Trailing Neon Cable visual
        if (s.p1.heldItem === 'utp_spool' || s.p1.heldItem === 'crimped_cable') {
          const origin = s.p1.pullOrigin ?? { x: 5.5, z: -3.8 };
          if (liveCableMesh) {
            liveCableMesh.geometry.dispose();
            scene.remove(liveCableMesh);
          }
          const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(origin.x, 0.15, origin.z),
            new THREE.Vector3((origin.x + s.p1.x) * 0.5, 0.08, (origin.z + s.p1.z) * 0.5),
            new THREE.Vector3(s.p1.x, 0.75, s.p1.z),
          ]);
          liveCableMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.035, 6, false), liveCableMat);
          scene.add(liveCableMesh);
        } else if (liveCableMesh) {
          liveCableMesh.geometry.dispose();
          scene.remove(liveCableMesh);
          liveCableMesh = null;
        }

        // Boss NPC Patrol & "HURRY!" alert
        const wp = bossWaypoints[s.boss.waypointIdx];
        const bdx = wp.x - s.boss.x;
        const bdz = wp.z - s.boss.z;
        const bdist = Math.hypot(bdx, bdz);
        if (bdist < 0.25) {
          s.boss.waypointIdx = (s.boss.waypointIdx + 1) % bossWaypoints.length;
        } else {
          const bossSpeed = s.stats.timeRemaining < 75 ? 2.4 : 1.5;
          s.boss.x += (bdx / bdist) * bossSpeed * dt;
          s.boss.z += (bdz / bdist) * bossSpeed * dt;
          s.boss.facing = Math.atan2(bdx, bdz);
          bossRig.leftLeg.rotation.x = Math.sin(elapsed * 10) * 0.45;
          bossRig.rightLeg.rotation.x = -Math.sin(elapsed * 10) * 0.45;
        }
        bossRig.group.position.set(s.boss.x, 0, s.boss.z);
        bossRig.group.rotation.y = s.boss.facing;
        bossRig.alertSprite.visible =
          s.stats.timeRemaining < 90 || s.incident.blackout || s.incident.overheat;

        // Nudge P1 if colliding with Boss NPC
        const pDistBoss = Math.hypot(s.p1.x - s.boss.x, s.p1.z - s.boss.z);
        if (pDistBoss < 0.85 && pDistBoss > 0.01) {
          s.p1.x += ((s.p1.x - s.boss.x) / pDistBoss) * dt * 3.5;
          s.p1.z += ((s.p1.z - s.boss.z) / pDistBoss) * dt * 3.5;
        }

        // Sync held visuals
        if (s.p1.heldItem !== p1LastItem) {
          syncHeldVisual(p1Rig, s.p1.heldItem);
          p1LastItem = s.p1.heldItem;
        }
        if (s.p2.heldItem !== p2LastItem) {
          syncHeldVisual(p2Rig, s.p2.heldItem);
          p2LastItem = s.p2.heldItem;
        }

        // Time-out check
        if (s.stats.timeRemaining <= 0 && s.stats.phase === 'playing') {
          s.stats.phase = 'ended';
          s.stats.victory = false;
          sfx.playDefeat();
          syncUi();
        }

        // Throttled HUD prompt & timer sync (~10Hz)
        if (elapsed - lastUiSync > 0.1) {
          lastUiSync = elapsed;
          const st = getNearestStation(s.p1.x, s.p1.z);
          propsRef.current.onPromptChange(st ? st.label : null);
          syncUi();
        }
      }

      renderer.render(scene, camera);
      if (isSoftwareGl) {
        afterDraw(tick, curPhase === 'lobby' ? 350 : 110);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (webglUnavailable) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-950 p-6 text-center">
        <div className="max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="font-display text-lg font-bold text-white">
            Mode WebGL Tidak Tersedia
          </h2>
          <p className="mt-2 text-xs text-slate-400">
            Browser atau perangkat saat ini membatasi akselerasi WebGL 3D. Anda tetap dapat membaca seluruh Game Design Document &amp; Arsitektur Kode Unity/Three.js melalui tombol di menu utama.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className="h-full w-full select-none overflow-hidden bg-slate-950"
      aria-label="Arena 3D Isometrik SERVER PANIC"
    />
  );
};
