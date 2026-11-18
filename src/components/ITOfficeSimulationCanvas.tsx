import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { sfx } from '../audio/sfx';
import {
  CameraAngleId,
  DEFAULT_INTERNET_SETTINGS,
  InternetSettings,
  NearbyDoorInfo,
  NearbyNpcInfo,
  NearbySeatInfo,
  OFFICE_ROOMS,
  OfficeNpcId,
  RoomDoorId,
  RoomId,
  TECHNICIAN_COLORWAYS,
  TechnicianAppearance,
  WorkstationStats,
  WorkstationTargetId,
  WorkstationTargetInfo,
} from '../types/game';
import { isNpcTargetSolved, OFFICE_NPC_LIST, OFFICE_NPCS } from '../data/officeNpcs';
import {
  loadSavedPeoplePositionsTxt,
  parsePeoplePositionsTxt,
} from '../data/peoplePositions';
import { buildDetailedTechnician } from '../three/technicianModel';
import { buildOfficeBuilding } from '../three/officeBuildingModels';
import { buildFirstPersonArmRig } from '../three/workstationModels';

interface RoomDoorDef {
  id: RoomDoorId;
  x: number;
  z: number;
  label: string;
}

const ROOM_DOORS: RoomDoorDef[] = [
  { id: 'r01_server', x: -12, z: -1.3, label: 'Pintu Server Room (R.01)' },
  { id: 'r02_noc', x: -6, z: -1.3, label: 'Pintu Ruang NOC (R.02)' },
  { id: 'r03_storage', x: 0, z: -1.3, label: 'Pintu Gudang Kabel (R.03)' },
  { id: 'r05_meeting', x: 12, z: -1.3, label: 'Pintu Ruang Rapat (R.05)' },
  { id: 'r15_boss', x: 30, z: -1.3, label: 'Pintu Ruang Bos (R.15)' },
];

const ROOM_DOOR_BY_ID: Record<RoomDoorId, RoomDoorDef> = Object.fromEntries(
  ROOM_DOORS.map((d) => [d.id, d])
) as Record<RoomDoorId, RoomDoorDef>;

const ROOM_DOOR_BY_X: Record<number, RoomDoorId> = {
  [-12]: 'r01_server',
  [-6]: 'r02_noc',
  [0]: 'r03_storage',
  [12]: 'r05_meeting',
  [30]: 'r15_boss',
};

interface OfficeSeatDef {
  id: string;
  label: string;
  room: RoomId;
  x: number;
  z: number;
  seatY: number;
  facing: number;
  approachX: number;
  approachZ: number;
  standX: number;
  standZ: number;
  isBeanbag?: boolean;
}

const OFFICE_SEATS: OfficeSeatDef[] = [
  {
    id: 'seat_noc',
    label: 'Kursi Operator NOC',
    room: 'r02_noc',
    x: -6.35,
    z: -4.22,
    seatY: 0.58,
    facing: Math.PI,
    approachX: -6.35,
    approachZ: -3.55,
    standX: -6.35,
    standZ: -3.65,
  },
  {
    id: 'seat_meet_ne',
    label: 'Kursi Rapat Utara',
    room: 'r05_meeting',
    x: 12.9,
    z: -5.55,
    seatY: 0.58,
    facing: 0,
    approachX: 12.9,
    approachZ: -6.08,
    standX: 12.9,
    standZ: -6.08,
  },
  {
    id: 'seat_meet_sw',
    label: 'Kursi Rapat Selatan',
    room: 'r05_meeting',
    x: 11.1,
    z: -3.65,
    seatY: 0.58,
    facing: Math.PI,
    approachX: 11.1,
    approachZ: -3.2,
    standX: 11.1,
    standZ: -3.2,
  },
  {
    id: 'seat_meet_sm',
    label: 'Kursi Rapat Tengah',
    room: 'r05_meeting',
    x: 12.0,
    z: -3.65,
    seatY: 0.58,
    facing: Math.PI,
    approachX: 12.0,
    approachZ: -3.2,
    standX: 12.0,
    standZ: -3.2,
  },
  {
    id: 'seat_rec_sofa',
    label: 'Sofa Tamu Resepsionis',
    room: 'r06_reception',
    x: -10.5,
    z: 5.82,
    seatY: 0.56,
    facing: Math.PI,
    approachX: -11.55,
    approachZ: 5.55,
    standX: -11.55,
    standZ: 5.55,
  },
  {
    id: 'seat_client_a',
    label: 'Kursi Kerja PC-01',
    room: 'r07_client_a',
    x: -6.75,
    z: 3.62,
    seatY: 0.58,
    facing: 0,
    approachX: -6.75,
    approachZ: 3.12,
    standX: -6.75,
    standZ: 3.12,
  },
  {
    id: 'seat_client_b',
    label: 'Kursi Kerja PC-02',
    room: 'r08_client_b',
    x: 0.65,
    z: 3.62,
    seatY: 0.58,
    facing: 0,
    approachX: 0.65,
    approachZ: 3.12,
    standX: 0.65,
    standZ: 3.12,
  },
  {
    id: 'seat_kitchen_1',
    label: 'Kursi Meja Dapur',
    room: 'r11_kitchen',
    x: 17.45,
    z: -3.35,
    seatY: 0.58,
    facing: Math.PI,
    approachX: 17.45,
    approachZ: -2.75,
    standX: 17.45,
    standZ: -2.75,
  },
  {
    id: 'seat_kitchen_2',
    label: 'Kursi Meja Dapur',
    room: 'r11_kitchen',
    x: 18.25,
    z: -3.35,
    seatY: 0.58,
    facing: Math.PI,
    approachX: 18.25,
    approachZ: -2.75,
    standX: 18.25,
    standZ: -2.75,
  },
  {
    id: 'seat_boss_guest1',
    label: 'Kursi Tamu Direktur',
    room: 'r15_boss',
    x: 29.8,
    z: -4.55,
    seatY: 0.58,
    facing: Math.PI,
    approachX: 29.8,
    approachZ: -3.95,
    standX: 29.8,
    standZ: -3.95,
  },
  {
    id: 'seat_boss_guest2',
    label: 'Kursi Tamu Direktur',
    room: 'r15_boss',
    x: 30.85,
    z: -4.55,
    seatY: 0.58,
    facing: Math.PI,
    approachX: 30.85,
    approachZ: -3.95,
    standX: 30.85,
    standZ: -3.95,
  },
  {
    id: 'seat_boss_vip',
    label: 'Sofa VIP Ruang Bos',
    room: 'r15_boss',
    x: 28.45,
    z: -2.48,
    seatY: 0.56,
    facing: Math.PI,
    approachX: 29.68,
    approachZ: -2.45,
    standX: 29.68,
    standZ: -2.45,
  },
  {
    id: 'seat_lounge_sofa_l',
    label: 'Sofa Ruang Santai',
    room: 'r16_lounge',
    x: 30.08,
    z: 6.2,
    seatY: 0.54,
    facing: Math.PI,
    approachX: 30.08,
    approachZ: 5.52,
    standX: 30.08,
    standZ: 5.52,
  },
  {
    id: 'seat_lounge_sofa_r',
    label: 'Sofa Ruang Santai',
    room: 'r16_lounge',
    x: 31.62,
    z: 6.2,
    seatY: 0.54,
    facing: Math.PI,
    approachX: 31.62,
    approachZ: 5.52,
    standX: 31.62,
    standZ: 5.52,
  },
  {
    id: 'seat_beanbag_1',
    label: 'Beanbag Biru',
    room: 'r16_lounge',
    x: 28.65,
    z: 4.75,
    seatY: 0.52,
    facing: 0.65,
    approachX: 29.55,
    approachZ: 4.75,
    standX: 29.55,
    standZ: 4.75,
    isBeanbag: true,
  },
  {
    id: 'seat_beanbag_2',
    label: 'Beanbag Oranye',
    room: 'r16_lounge',
    x: 28.45,
    z: 6.05,
    seatY: 0.52,
    facing: 0.85,
    approachX: 29.55,
    approachZ: 6.05,
    standX: 29.55,
    standZ: 6.05,
    isBeanbag: true,
  },
];

const SEAT_MAP: Record<string, OfficeSeatDef> = Object.fromEntries(
  OFFICE_SEATS.map((s) => [s.id, s])
);

export interface CliAndInternetUpdate {
  vlan10?: boolean;
  vlan20?: boolean;
  dhcp?: boolean;
  apConfigured?: boolean;
  internetSettings?: InternetSettings;
}

export interface WorkstationControllerBridge {
  startSession: () => void;
  restartSession: () => void;
  applyCliConfig: (updates: CliAndInternetUpdate) => void;
  completeCrimping: () => void;
  resolveCaseStudy: (targetId: WorkstationTargetId, firstTryCorrect: number, totalAttempts: number) => void;
  recordNpcConsultation: (npcId: OfficeNpcId, firstTryCorrect: number, totalAttempts: number) => void;
  previewCaseStudyStage: (targetId: WorkstationTargetId, stage: 'installing' | 'enabling') => void;
  setCameraAngle: (angle: CameraAngleId) => void;
  setTechnicianAppearance: (appearance: TechnicianAppearance) => void;
  walkToRoom: (roomId: RoomId) => void;
  walkToTarget: (targetId: WorkstationTargetId) => void;
  walkToNpc: (npcId: OfficeNpcId) => void;
  submitBossReport: () => void;
  toggleSit: () => void;
  toggleDoor: (doorId?: RoomDoorId) => void;
  applyPeoplePositions: (
    rawTxt: string,
    options?: { movePlayer?: boolean }
  ) => { appliedCount: number; errors: string[] };
  getPlayerPosition: () => { x: number; y: number; z: number; rot: number };
}

interface ITOfficeSimulationCanvasProps {
  phase: 'ready' | 'playing' | 'ended';
  cameraAngle: CameraAngleId;
  appearance: TechnicianAppearance;
  customizerOpen: boolean;
  modalPaused: boolean;
  zoomTarget: WorkstationTargetId | null;
  activeNpcId: OfficeNpcId | null;
  onStatsChange: (stats: WorkstationStats) => void;
  onCameraAngleChange: (angle: CameraAngleId) => void;
  onHoverChange: (target: WorkstationTargetInfo | null) => void;
  onHoverNpcChange: (npc: NearbyNpcInfo | null) => void;
  onNearbyNpcChange: (npc: NearbyNpcInfo | null) => void;
  onNearbySeatChange: (seat: NearbySeatInfo | null) => void;
  onSeatedChange: (seated: boolean) => void;
  onNearbyDoorChange: (door: NearbyDoorInfo | null) => void;
  onNoticeChange: (notice: string | null) => void;
  onOpenCli: () => void;
  onOpenCrimping: () => void;
  onOpenCaseStudy: (targetId: WorkstationTargetId) => void;
  onOpenNpcQuestion: (npcId: OfficeNpcId) => void;
  onOpenBossReport: () => void;
  controllerRef: React.MutableRefObject<WorkstationControllerBridge | null>;
}

const SESSION_DURATION_SEC = 300;

function getRoomAtPos(x: number, z: number): RoomId {
  if (Math.abs(z) < 1.3) return 'corridor';
  const isNorth = z < 0;
  if (x < -9) return isNorth ? 'r01_server' : 'r06_reception';
  if (x < -3) return isNorth ? 'r02_noc' : 'r07_client_a';
  if (x < 3) return isNorth ? 'r03_storage' : 'r08_client_b';
  if (x < 9) return isNorth ? 'r04_lab' : 'r09_wifi';
  if (x < 15) return isNorth ? 'r05_meeting' : 'r10_pantry';
  if (x < 21) return isNorth ? 'r11_kitchen' : 'r12_toilet';
  if (x < 27) return isNorth ? 'r13_mushola' : 'r14_wudhu';
  return isNorth ? 'r15_boss' : 'r16_lounge';
}

function getBayCenterX(x: number): number {
  if (x < -9) return -12;
  if (x < -3) return -6;
  if (x < 3) return 0;
  if (x < 9) return 6;
  if (x < 15) return 12;
  if (x < 21) return 18;
  if (x < 27) return 24;
  return 30;
}

export const ITOfficeSimulationCanvas: React.FC<ITOfficeSimulationCanvasProps> = ({
  phase,
  cameraAngle,
  appearance,
  customizerOpen,
  modalPaused,
  zoomTarget,
  activeNpcId,
  onStatsChange,
  onCameraAngleChange,
  onHoverChange,
  onHoverNpcChange,
  onNearbyNpcChange,
  onNearbySeatChange,
  onSeatedChange,
  onNearbyDoorChange,
  onNoticeChange,
  onOpenCli,
  onOpenCrimping,
  onOpenCaseStudy,
  onOpenNpcQuestion,
  onOpenBossReport,
  controllerRef,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);

  const phaseRef = useRef(phase);
  const angleRef = useRef(cameraAngle);
  const appearanceRef = useRef(appearance);
  const customizerOpenRef = useRef(customizerOpen);
  const modalPausedRef = useRef(modalPaused);
  const zoomTargetRef = useRef(zoomTarget);
  const activeNpcIdRef = useRef(activeNpcId);
  const onStatsRef = useRef(onStatsChange);
  const onAngleRef = useRef(onCameraAngleChange);
  const onHoverRef = useRef(onHoverChange);
  const onHoverNpcRef = useRef(onHoverNpcChange);
  const onNearbyNpcRef = useRef(onNearbyNpcChange);
  const onNearbySeatRef = useRef(onNearbySeatChange);
  const onSeatedRef = useRef(onSeatedChange);
  const onNearbyDoorRef = useRef(onNearbyDoorChange);
  const onNoticeRef = useRef(onNoticeChange);
  const onOpenCliRef = useRef(onOpenCli);
  const onOpenCrimpingRef = useRef(onOpenCrimping);
  const onOpenCaseStudyRef = useRef(onOpenCaseStudy);
  const onOpenNpcRef = useRef(onOpenNpcQuestion);
  const onOpenBossReportRef = useRef(onOpenBossReport);

  phaseRef.current = phase;
  angleRef.current = cameraAngle;
  appearanceRef.current = appearance;
  customizerOpenRef.current = customizerOpen;
  modalPausedRef.current = modalPaused;
  zoomTargetRef.current = zoomTarget;
  activeNpcIdRef.current = activeNpcId;
  onStatsRef.current = onStatsChange;
  onAngleRef.current = onCameraAngleChange;
  onHoverRef.current = onHoverChange;
  onHoverNpcRef.current = onHoverNpcChange;
  onNearbyNpcRef.current = onNearbyNpcChange;
  onNearbySeatRef.current = onNearbySeatChange;
  onSeatedRef.current = onSeatedChange;
  onNearbyDoorRef.current = onNearbyDoorChange;
  onNoticeRef.current = onNoticeChange;
  onOpenCliRef.current = onOpenCli;
  onOpenCrimpingRef.current = onOpenCrimping;
  onOpenCaseStudyRef.current = onOpenCaseStudy;
  onOpenNpcRef.current = onOpenNpcQuestion;
  onOpenBossReportRef.current = onOpenBossReport;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const dbg = probe.getExtension('WEBGL_debug_renderer_info');
        const param = dbg ? dbg.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param) || '');
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 1. Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch (err) {
      setWebglError(err instanceof Error ? err.message : 'WebGL tidak tersedia pada peramban ini.');
      return;
    }

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError('Konteks WebGL terputus. Muat ulang halaman untuk memulihkan tampilan 3D.');
    };
    const handleContextRestored = () => {
      setWebglError(null);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.97;
    container.appendChild(renderer.domElement);

    const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    // 2. Crisp Daylight White & Natural Oak Corporate IT Office Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xb8c5d6);
    scene.fog = new THREE.Fog(0xb8c5d6, 38, 82);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.6;

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x94a3b8, 0.96);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffaf2, 1.38);
    sunLight.position.set(14, 21, 15);
    sunLight.target.position.set(9, 0, 0);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.left = -27;
    sunLight.shadow.camera.right = 27;
    sunLight.shadow.camera.top = 12;
    sunLight.shadow.camera.bottom = -12;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);
    scene.add(sunLight.target);

    const skyFill = new THREE.DirectionalLight(0xe2e8f0, 0.62);
    skyFill.position.set(-12, 10, -8);
    scene.add(skyFill);

    const rimLight = new THREE.DirectionalLight(0xf8fafc, 0.35);
    rimLight.position.set(-8, 6, 14);
    scene.add(rimLight);

    // 3. Camera
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.05, 95);
    scene.add(camera);

    // 4. Build 16-Room Aesthetic Office & Detailed Technician
    const officeRefs = buildOfficeBuilding(maxAnisotropy);
    scene.add(officeRefs.group);

    const walkFloorPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(47.4, 14.4),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    walkFloorPlane.rotation.x = -Math.PI / 2;
    walkFloorPlane.position.set(9, 0.01, 0);
    scene.add(walkFloorPlane);

    const destRing = new THREE.Mesh(
      new THREE.RingGeometry(0.22, 0.3, 24),
      new THREE.MeshBasicMaterial({ color: 0x0284c7, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    destRing.rotation.x = -Math.PI / 2;
    destRing.position.y = 0.025;
    destRing.visible = false;
    scene.add(destRing);

    const hoverRing = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.56, 32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.78 })
    );
    hoverRing.rotation.x = -Math.PI / 2;
    hoverRing.position.y = 0.028;
    hoverRing.visible = false;
    scene.add(hoverRing);

    const burstRingMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const burstRing = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.52, 32), burstRingMat);
    burstRing.rotation.x = -Math.PI / 2;
    burstRing.position.y = 0.035;
    burstRing.visible = false;
    scene.add(burstRing);

    let techRig = buildDetailedTechnician(appearanceRef.current);
    techRig.group.position.set(0, 0, 0);
    scene.add(techRig.group);

    const fpArmRig = buildFirstPersonArmRig();
    fpArmRig.root.position.set(0.24, -0.24, -0.42);
    fpArmRig.root.rotation.set(0.06, -0.16, 0.04);
    fpArmRig.root.visible = false;
    camera.add(fpArmRig.root);

    const syncFpArmColors = (cfg: TechnicianAppearance) => {
      const pal = TECHNICIAN_COLORWAYS.find((c) => c.id === cfg.colorway) ?? TECHNICIAN_COLORWAYS[0];
      const sleeve = cfg.outfit === 'smart_vest' ? pal.shirtHex : pal.outerHex;
      const skin = cfg.gender === 'female' ? 0xf7cfa9 : 0xf5c8a0;
      fpArmRig.updateAppearance(sleeve, pal.tieOrAccentHex, skin);
    };
    syncFpArmColors(appearanceRef.current);

    const STATION_STAND_POS: Record<WorkstationTargetId, { x: number; z: number; room: RoomId }> = {
      server_rack: { x: -11.4, z: -4.2, room: 'r01_server' },
      cli_monitor: { x: -6.35, z: -3.55, room: 'r02_noc' },
      utp_spool: { x: -0.9, z: -4.6, room: 'r03_storage' },
      crimper_tool: { x: 5.8, z: -4.1, room: 'r04_lab' },
      client_pc_1: { x: -6.75, z: 3.1, room: 'r07_client_a' },
      client_pc_2: { x: 0.65, z: 3.1, room: 'r08_client_b' },
      ap_mount: { x: 6.0, z: 3.8, room: 'r09_wifi' },
      messy_cables: { x: -2.6, z: 0, room: 'corridor' },
      employee_pc_reception: { x: -11.4, z: 2.85, room: 'r06_reception' },
      employee_pc_os: { x: -4.1, z: 5.1, room: 'r07_client_a' },
      employee_pc_meeting: { x: 11.1, z: -3.25, room: 'r05_meeting' },
      boss_report: { x: 30.35, z: -3.05, room: 'r15_boss' },
    };

    const STATION_RING_POS: Record<WorkstationTargetId, { x: number; z: number }> = {
      server_rack: { x: -12.0, z: -5.8 },
      cli_monitor: { x: -6.35, z: -4.9 },
      utp_spool: { x: -0.9, z: -6.0 },
      crimper_tool: { x: 5.8, z: -5.6 },
      client_pc_1: { x: -6.75, z: 4.6 },
      client_pc_2: { x: 0.65, z: 4.6 },
      ap_mount: { x: 6.0, z: 5.0 },
      messy_cables: { x: -2.6, z: 0.0 },
      employee_pc_reception: { x: -12.85, z: 3.95 },
      employee_pc_os: { x: -5.25, z: 4.88 },
      employee_pc_meeting: { x: 11.1, z: -4.85 },
      boss_report: { x: 30.35, z: -3.55 },
    };

    const STATION_ZOOM_POSE: Record<
      WorkstationTargetId,
      { camPos: [number, number, number]; lookAt: [number, number, number] }
    > = {
      server_rack: { camPos: [-11.3, 1.5, -3.9], lookAt: [-11.8, 1.2, -6.1] },
      cli_monitor: { camPos: [-6.15, 1.38, -4.15], lookAt: [-6.35, 1.2, -5.1] },
      utp_spool: { camPos: [-0.6, 1.4, -4.45], lookAt: [-0.9, 1.12, -6.0] },
      crimper_tool: { camPos: [5.95, 1.55, -4.45], lookAt: [5.8, 0.84, -5.6] },
      client_pc_1: { camPos: [-5.75, 1.42, 3.15], lookAt: [-6.25, 0.96, 4.35] },
      client_pc_2: { camPos: [0.35, 1.42, 3.15], lookAt: [0.15, 0.96, 4.35] },
      ap_mount: { camPos: [6.4, 2.28, 3.65], lookAt: [6.0, 1.98, 5.0] },
      messy_cables: { camPos: [-2.15, 1.18, 1.5], lookAt: [-2.6, 0.08, 0.0] },
      employee_pc_reception: { camPos: [-12.15, 1.62, 4.72], lookAt: [-12.85, 1.36, 3.95] },
      employee_pc_os: { camPos: [-4.55, 1.56, 5.75], lookAt: [-5.25, 1.04, 4.88] },
      employee_pc_meeting: { camPos: [11.42, 1.38, -3.86], lookAt: [11.1, 0.92, -4.85] },
      boss_report: { camPos: [30.15, 1.54, -3.5], lookAt: [30.35, 1.15, -6.2] },
    };

    const OBSTACLES = [
      { minX: -14.1, maxX: -9.9, minZ: -6.7, maxZ: -5.5 },
      { minX: -7.4, maxX: -5.2, minZ: -5.4, maxZ: -4.3 },
      { minX: -2.0, maxX: 0.2, minZ: -6.4, maxZ: -5.5 },
      { minX: 0.55, maxX: 2.55, minZ: -6.3, maxZ: -4.85 }, // R.03 stacked cardboard & router boxes
      { minX: 4.5, maxX: 7.1, minZ: -6.1, maxZ: -5.0 },
      { minX: 7.4, maxX: 8.55, minZ: -6.2, maxZ: -5.1 }, // R.04 lab utility cart & router box
      { minX: 10.4, maxX: 13.6, minZ: -5.4, maxZ: -3.8 },
      { minX: -13.9, maxX: -11.1, minZ: 3.5, maxZ: 4.5 },
      { minX: -7.5, maxX: -4.5, minZ: 3.9, maxZ: 5.3 },
      { minX: -1.5, maxX: 1.5, minZ: 3.9, maxZ: 5.3 },
      { minX: 16.0, maxX: 20.68, minZ: -7.3, maxZ: -6.4 }, // R.11 kitchen counter & fridge
      { minX: 16.92, maxX: 18.68, minZ: -4.6, maxZ: -3.7 }, // R.11 dining island
      { minX: 15.4, maxX: 18.9, minZ: 5.45, maxZ: 7.3 }, // R.12 toilet stalls
      { minX: 20.1, maxX: 20.8, minZ: 3.4, maxZ: 5.6 }, // R.12 sink vanity
      { minX: 26.35, maxX: 26.82, minZ: -6.52, maxZ: -5.28 }, // R.13 quran cabinet
      { minX: 21.75, maxX: 22.35, minZ: -6.2, maxZ: -5.2 }, // R.13 rehal stand & stacked qurans
      { minX: 21.88, maxX: 23.02, minZ: -1.32, maxZ: -0.92 }, // R.13 sandal rack outside entrance
      { minX: 25.86, maxX: 26.86, minZ: 2.8, maxZ: 6.9 }, // R.14 wudhu wall & trough
      { minX: 21.25, maxX: 21.75, minZ: 4.45, maxZ: 5.55 }, // R.14 towel stand
      { minX: 29.15, maxX: 31.55, minZ: -6.1, maxZ: -5.0 }, // R.15 boss executive desk
      { minX: 27.18, maxX: 27.66, minZ: -6.4, maxZ: -4.5 }, // R.15 boss bookcase
      { minX: 27.62, maxX: 29.28, minZ: -3.65, maxZ: -2.05 }, // R.15 VIP corner sofa & table
      { minX: 29.7, maxX: 32.0, minZ: 5.9, maxZ: 6.8 }, // R.16 lounge sofa
      { minX: 30.15, maxX: 31.55, minZ: 4.28, maxZ: 5.02 }, // R.16 lounge coffee table
      { minX: 28.15, maxX: 29.15, minZ: 4.25, maxZ: 5.25 }, // R.16 beanbag 1
      { minX: 27.95, maxX: 28.95, minZ: 5.55, maxZ: 6.55 }, // R.16 beanbag 2
      { minX: 27.18, maxX: 27.66, minZ: 3.15, maxZ: 4.35 }, // R.16 lounge west mini library
      { minX: 32.38, maxX: 32.92, minZ: 4.08, maxZ: 6.02 }, // R.16 lounge east perpustakaan mini
      { minX: -14.88, maxX: -14.36, minZ: 5.02, maxZ: 6.28 }, // R.06 reception compact mini library
    ];

    // 5. Simulation State
    const simState = {
      timeRemaining: SESSION_DURATION_SEC,
      hasCableInHand: false,
      port1Connected: false,
      port2Connected: false,
      cablesTidied: false,
      apConfigured: false,
      rackChecked: false,
      dhcpActive: false,
      vlan10Active: false,
      vlan20Active: false,
      crimpingVerified: false,
      receptionPcFixed: false,
      osReinstalled: false,
      meetingLaptopFixed: false,
      bossReported: false,
      doorOpen: {
        r01_server: false,
        r02_noc: false,
        r03_storage: false,
        r05_meeting: false,
        r15_boss: false,
      } as Record<RoomDoorId, boolean>,
      bossReadyNotified: false,
      learningCorrectCount: 0,
      learningAttemptsCount: 0,
      consultedNpcs: [] as OfficeNpcId[],
      internetSettings: { ...DEFAULT_INTERNET_SETTINGS },
      victory: false,
    };

    const playerState = {
      x: 0,
      y: 0,
      z: 0,
      facing: 0,
      speed: 4.7,
      walkCycle: 0,
      moving: false,
      waypoints: [] as Array<{ x: number; z: number }>,
      pendingInteract: null as WorkstationTargetId | null,
      pendingNpcInteract: null as OfficeNpcId | null,
      pendingSeatId: null as string | null,
      pendingDoorToggle: null as RoomDoorId | null,
      seatedSeat: null as OfficeSeatDef | null,
      interactAnimTimer: 0,
    };

    type DynamicNpcPose = {
      room: RoomId;
      worldPos: { x: number; z: number };
      standPos: { x: number; z: number };
      viaPos?: { x: number; z: number };
      zoomPose: { camPos: [number, number, number]; lookAt: [number, number, number] };
    };
    const npcDynamicPose = Object.fromEntries(
      OFFICE_NPC_LIST.map((npc) => [
        npc.id,
        {
          room: npc.room,
          worldPos: { ...npc.worldPos },
          standPos: { ...npc.standPos },
          viaPos: npc.viaPos ? { ...npc.viaPos } : undefined,
          zoomPose: {
            camPos: [...npc.zoomPose.camPos] as [number, number, number],
            lookAt: [...npc.zoomPose.lookAt] as [number, number, number],
          },
        },
      ])
    ) as Record<OfficeNpcId, DynamicNpcPose>;

    const applyPositionsToScene = (
      rawTxt: string,
      movePlayer = true
    ): { appliedCount: number; errors: string[] } => {
      const parsed = parsePeoplePositionsTxt(rawTxt);
      let appliedCount = 0;

      const setWorkerWorldPose = (
        workerGroup: THREE.Group,
        x: number,
        y: number,
        z: number,
        rotDeg: number
      ) => {
        const parent = workerGroup.parent;
        const offsetX = parent && parent !== officeRefs.group ? parent.position.x : 0;
        const offsetY = parent && parent !== officeRefs.group ? parent.position.y : 0;
        const offsetZ = parent && parent !== officeRefs.group ? parent.position.z : 0;
        workerGroup.position.set(x - offsetX, y - offsetY, z - offsetZ);
        const rad = THREE.MathUtils.degToRad(rotDeg);
        workerGroup.rotation.y = rad;
        return rad;
      };

      const techEntry = parsed.entries.teknisi;
      if (techEntry && movePlayer) {
        if (playerState.seatedSeat) {
          playerState.seatedSeat = null;
          onSeatedRef.current(false);
        }
        playerState.x = techEntry.x;
        playerState.y = techEntry.y;
        playerState.z = techEntry.z;
        playerState.facing = THREE.MathUtils.degToRad(techEntry.rot);
        playerState.waypoints = [];
        playerState.pendingInteract = null;
        playerState.pendingNpcInteract = null;
        playerState.pendingSeatId = null;
        playerState.pendingDoorToggle = null;
        destRing.visible = false;
        appliedCount += 1;
      }

      const bossEntry = parsed.entries.boss_direktur;
      if (bossEntry) {
        const rad = setWorkerWorldPose(
          officeRefs.bossWorker.group,
          bossEntry.x,
          bossEntry.y,
          bossEntry.z,
          bossEntry.rot
        );
        officeRefs.bossWorker.baseRotationY = rad;
        const fwdX = Math.sin(rad);
        const fwdZ = Math.cos(rad);
        const standX = THREE.MathUtils.clamp(bossEntry.x + fwdX * 1.65, -14.4, 32.4);
        const standZ = THREE.MathUtils.clamp(bossEntry.z + fwdZ * 1.65, -6.8, 6.8);
        STATION_STAND_POS.boss_report = {
          x: standX,
          z: standZ,
          room: getRoomAtPos(bossEntry.x, bossEntry.z),
        };
        STATION_RING_POS.boss_report = { x: bossEntry.x, z: bossEntry.z };
        STATION_ZOOM_POSE.boss_report = {
          camPos: [
            bossEntry.x + fwdX * 1.9,
            bossEntry.y + 1.54,
            bossEntry.z + fwdZ * 1.9,
          ],
          lookAt: [bossEntry.x, bossEntry.y + 1.15, bossEntry.z],
        };
        officeRefs.beacons.boss_report.position.set(bossEntry.x, bossEntry.y + 1.92, bossEntry.z);
        appliedCount += 1;
      }

      OFFICE_NPC_LIST.forEach((npc) => {
        const entry = parsed.entries[npc.id];
        const worker = officeRefs.npcWorkers[npc.id];
        if (!entry || !worker) return;
        const rad = setWorkerWorldPose(worker.group, entry.x, entry.y, entry.z, entry.rot);
        worker.baseRotationY = rad;

        const movedFromDefault =
          Math.hypot(entry.x - npc.worldPos.x, entry.z - npc.worldPos.z) > 0.08;
        if (movedFromDefault) {
          const fwdX = Math.sin(rad);
          const fwdZ = Math.cos(rad);
          const standX = THREE.MathUtils.clamp(entry.x + fwdX * 1.15, -14.4, 32.4);
          const standZ = THREE.MathUtils.clamp(entry.z + fwdZ * 1.15, -6.8, 6.8);
          npcDynamicPose[npc.id] = {
            room: getRoomAtPos(entry.x, entry.z),
            worldPos: { x: entry.x, z: entry.z },
            standPos: { x: standX, z: standZ },
            viaPos: undefined,
            zoomPose: {
              camPos: [
                entry.x + fwdX * 1.45,
                entry.y + 1.48,
                entry.z + fwdZ * 1.45,
              ],
              lookAt: [entry.x, entry.y + 1.15, entry.z],
            },
          };
        } else {
          npcDynamicPose[npc.id] = {
            room: npc.room,
            worldPos: { ...npc.worldPos },
            standPos: { ...npc.standPos },
            viaPos: npc.viaPos ? { ...npc.viaPos } : undefined,
            zoomPose: {
              camPos: [...npc.zoomPose.camPos] as [number, number, number],
              lookAt: [...npc.zoomPose.lookAt] as [number, number, number],
            },
          };
        }
        appliedCount += 1;
      });

      return { appliedCount, errors: parsed.errors };
    };

    const cameraOrbit = {
      yaw: 0.22,
      pitch: 0.14,
      zoom: 0.72,
      dragging: false,
      lastX: 0,
      lastY: 0,
    };

    const fpReach = { active: false, timer: 0, duration: 0.36 };
    const burstAnim = { active: false, timer: 0 };
    let hoveredId: WorkstationTargetId | null = null;
    let hoveredNpcId: OfficeNpcId | null = null;
    let lastNearbyNpcId: OfficeNpcId | null = null;
    let lastNearbySeatId: string | null = null;
    let lastNearbyDoorKey = '';
    const doorAngles: Record<RoomDoorId, number> = {
      r01_server: 0,
      r02_noc: 0,
      r03_storage: 0,
      r05_meeting: 0,
      r15_boss: 0,
    };
    let noticeTimer = 0;

    const triggerBurstAt = (x: number, z: number) => {
      burstRing.position.set(x, 0.035, z);
      burstRing.scale.setScalar(1);
      burstRingMat.opacity = 0.92;
      burstRing.visible = true;
      burstAnim.active = true;
      burstAnim.timer = 0;
    };

    const buildStatsSnapshot = (currentPhase: 'ready' | 'playing' | 'ended'): WorkstationStats => ({
      phase: currentPhase,
      currentRoom: getRoomAtPos(playerState.x, playerState.z),
      timeRemaining: simState.timeRemaining,
      totalTime: SESSION_DURATION_SEC,
      hasCableInHand: simState.hasCableInHand,
      port1Connected: simState.port1Connected,
      port2Connected: simState.port2Connected,
      cablesTidied: simState.cablesTidied,
      apConfigured: simState.apConfigured,
      rackChecked: simState.rackChecked,
      dhcpActive: simState.dhcpActive,
      vlan10Active: simState.vlan10Active,
      vlan20Active: simState.vlan20Active,
      crimpingVerified: simState.crimpingVerified,
      receptionPcFixed: simState.receptionPcFixed,
      osReinstalled: simState.osReinstalled,
      meetingLaptopFixed: simState.meetingLaptopFixed,
      bossReported: simState.bossReported,
      learningCorrectCount: simState.learningCorrectCount,
      learningAttemptsCount: simState.learningAttemptsCount,
      consultedNpcs: [...simState.consultedNpcs],
      internetSettings: { ...simState.internetSettings },
      victory: simState.victory,
    });

    const areAllTechTasksDone = () =>
      simState.port1Connected &&
      simState.port2Connected &&
      simState.cablesTidied &&
      simState.apConfigured &&
      simState.rackChecked &&
      simState.dhcpActive &&
      simState.receptionPcFixed &&
      simState.osReinstalled &&
      simState.meetingLaptopFixed;

    const getNpcInfo = (npcId: OfficeNpcId): NearbyNpcInfo => {
      const npc = OFFICE_NPCS[npcId];
      const pose = npcDynamicPose[npcId];
      const snapshot = buildStatsSnapshot(phaseRef.current);
      return {
        npcId,
        name: npc.name,
        role: npc.role,
        room: pose ? pose.room : npc.room,
        teaser: npc.shortTeaser,
        answered: simState.consultedNpcs.includes(npcId),
        taskDone: isNpcTargetSolved(npc.targetId, snapshot),
        targetId: npc.targetId,
      };
    };

    const pushStats = (overridePhase?: 'ready' | 'playing' | 'ended') => {
      const currentPhase = overridePhase ?? phaseRef.current;
      onStatsRef.current(buildStatsSnapshot(currentPhase));

      officeRefs.updateNocMonitor({
        port1Connected: simState.port1Connected,
        port2Connected: simState.port2Connected,
        cablesTidied: simState.cablesTidied,
        rackChecked: simState.rackChecked,
        dhcpActive: simState.dhcpActive,
        vlan10Active: simState.vlan10Active,
        hasCableInHand: simState.hasCableInHand,
        phase: currentPhase,
        victory: simState.victory,
        dnsPrimary: simState.internetSettings.dnsPrimary,
        wifiSsid: simState.internetSettings.wifiSsid,
        apConfigured: simState.apConfigured,
      });
    };

    const syncVisuals = () => {
      techRig.heldCableGroup.visible = simState.hasCableInHand;
      fpArmRig.heldCableGroup.visible = simState.hasCableInHand;

      officeRefs.pc1Cable.visible = simState.port1Connected;
      officeRefs.pc2Cable.visible = simState.port2Connected;

      officeRefs.pc1LedMat.color.setHex(simState.port1Connected ? 0x10b981 : 0xf59e0b);
      officeRefs.pc1LedMat.emissive.setHex(simState.port1Connected ? 0x10b981 : 0xf59e0b);
      officeRefs.pc2LedMat.color.setHex(simState.port2Connected ? 0x10b981 : 0xf59e0b);
      officeRefs.pc2LedMat.emissive.setHex(simState.port2Connected ? 0x10b981 : 0xf59e0b);

      officeRefs.updateStationScreen(
        'client_pc_1',
        simState.port1Connected ? 'online' : 'no_cable',
        'Workstation PC-01',
        simState.port1Connected ? 'CAT6 LINK UP · 1000 Mbps' : 'Network Cable Unplugged',
        simState.port1Connected
          ? simState.dhcpActive
            ? 'IP 192.168.10.101 · Internet OK'
            : 'Kabel OK · Aktifkan DHCP di R.02'
          : 'Ambil Cat6 di R.03 & colok RJ45'
      );

      officeRefs.updateStationScreen(
        'client_pc_2',
        simState.port2Connected ? 'online' : 'no_cable',
        'Workstation PC-02',
        simState.port2Connected ? 'CAT6 LINK UP · 1000 Mbps' : 'Network Cable Unplugged',
        simState.port2Connected
          ? simState.dhcpActive
            ? 'IP 192.168.10.102 · Internet OK'
            : 'Kabel OK · Aktifkan DHCP di R.02'
          : 'Ambil Cat6 di R.03 & colok RJ45'
      );

      officeRefs.updateStationScreen(
        'employee_pc_reception',
        simState.receptionPcFixed ? 'online' : 'no_internet',
        'PC Resepsionis',
        simState.receptionPcFixed ? 'CONNECTED · DNS 1.1.1.1' : 'ERR_NAME_NOT_RESOLVED',
        simState.receptionPcFixed
          ? 'DHCP Renew & Flush DNS Berhasil'
          : 'IP 169.254.12.4 · Cek DNS/DHCP'
      );

      officeRefs.updateStationScreen(
        'employee_pc_os',
        simState.osReinstalled ? 'online' : 'bsod',
        'PC Karyawan Divisi A',
        simState.osReinstalled ? 'WINDOWS 11 PRO · READY' : 'BSOD: INACCESSIBLE_BOOT',
        simState.osReinstalled
          ? 'OS C: Baru + Driver LAN/VGA OK'
          : 'Install Ulang Windows & Driver'
      );

      officeRefs.updateStationScreen(
        'employee_pc_meeting',
        simState.meetingLaptopFixed ? 'online' : 'wifi_disabled',
        'Laptop Presentasi',
        simState.meetingLaptopFixed ? `Wi-Fi: ${simState.internetSettings.wifiSsid}` : 'Wi-Fi Adapter Disabled',
        simState.meetingLaptopFixed
          ? 'Driver Adapter OK · WPA3 Terhubung'
          : 'Cek Device Manager -> Enable'
      );

      officeRefs.serverStatusMat.color.setHex(simState.rackChecked ? 0x10b981 : 0xf59e0b);
      officeRefs.serverStatusMat.emissive.setHex(simState.rackChecked ? 0x10b981 : 0xf59e0b);

      officeRefs.apRingMat.color.setHex(simState.apConfigured ? 0x10b981 : 0xf59e0b);
      officeRefs.apRingMat.emissive.setHex(simState.apConfigured ? 0x10b981 : 0xf59e0b);

      officeRefs.messyCablesGroup.visible = !simState.cablesTidied;
      officeRefs.tidiedCablesGroup.visible = simState.cablesTidied;

      // Objective Floating Beacons visibility
      const needCable = !simState.port1Connected || !simState.port2Connected;
      officeRefs.beacons.utp_spool.visible = needCable && !simState.hasCableInHand;
      officeRefs.beacons.client_pc_1.visible = !simState.port1Connected;
      officeRefs.beacons.client_pc_2.visible = !simState.port2Connected;
      officeRefs.beacons.messy_cables.visible = !simState.cablesTidied;
      officeRefs.beacons.ap_mount.visible = !simState.apConfigured;
      officeRefs.beacons.server_rack.visible = !simState.rackChecked;
      officeRefs.beacons.cli_monitor.visible = !simState.dhcpActive;
      officeRefs.beacons.employee_pc_reception.visible = !simState.receptionPcFixed;
      officeRefs.beacons.employee_pc_os.visible = !simState.osReinstalled;
      officeRefs.beacons.employee_pc_meeting.visible = !simState.meetingLaptopFixed;
      const allTechDone = areAllTechTasksDone();
      officeRefs.beacons.boss_report.visible = allTechDone && !simState.bossReported;
      officeRefs.bossReportBadge.visible = allTechDone && !simState.bossReported;

      // Wi-Fi Signal Rings
      officeRefs.wifiWaveRings.forEach((ring) => {
        ring.visible = simState.apConfigured;
      });

      // Employee Help Pop-up Badges (visible for employees who still need help)
      const snapshot = buildStatsSnapshot(phaseRef.current);
      OFFICE_NPC_LIST.forEach((npc) => {
        const w = officeRefs.npcWorkers[npc.id];
        if (w?.helpBadge) {
          const taskDone = isNpcTargetSolved(npc.targetId, snapshot);
          w.helpBadge.visible = !taskDone;
        }
      });
    };

    const showNotice = (msg: string, durationSec = 2.8) => {
      onNoticeRef.current(msg);
      noticeTimer = durationSec;
    };

    const checkVictory = () => {
      if (simState.victory) return;
      const allTechDone = areAllTechTasksDone();
      if (allTechDone && !simState.bossReported) {
        if (!simState.bossReadyNotified) {
          simState.bossReadyNotified = true;
          sfx.playPowerRestore();
          showNotice(
            'Semua 9 tugas selesai! Silakan menuju R.15 Ruang Bos untuk melapor ke Direktur.',
            5.0
          );
        }
        return;
      }
      if (allTechDone && simState.bossReported) {
        simState.victory = true;
        sfx.playVictory();
        pushStats('ended');
      }
    };

    const isClosedDoorRoom = (roomId: RoomId): roomId is RoomDoorId =>
      roomId === 'r01_server' ||
      roomId === 'r02_noc' ||
      roomId === 'r03_storage' ||
      roomId === 'r05_meeting' ||
      roomId === 'r15_boss';

    const isRoomClosed = (roomId: RoomId): roomId is RoomDoorId =>
      isClosedDoorRoom(roomId) && !simState.doorOpen[roomId];

    const isBoundaryClosed = (fromRoom: RoomId, toRoom: RoomId): boolean =>
      fromRoom !== toRoom && (isRoomClosed(fromRoom) || isRoomClosed(toRoom));

    const buildCorridorPathTo = (
      targetX: number,
      targetZ: number,
      targetId?: WorkstationTargetId,
      viaPos?: { x: number; z: number }
    ): { blockedDoor?: RoomDoorId; stopPos?: { x: number; z: number } } => {
      const points: Array<{ x: number; z: number }> = [];
      const startRoom = getRoomAtPos(playerState.x, playerState.z);
      const endRoom = getRoomAtPos(targetX, targetZ);

      if (startRoom !== endRoom) {
        if (isRoomClosed(startRoom)) {
          const def = ROOM_DOOR_BY_ID[startRoom];
          const stopPos = { x: def.x, z: def.z - 0.56 };
          playerState.waypoints = [stopPos];
          showNotice(`${def.label} tertutup · Buka pintu [G] untuk keluar.`, 2.6);
          return { blockedDoor: startRoom, stopPos };
        }
        if (startRoom !== 'corridor') {
          const exitX = getBayCenterX(playerState.x);
          points.push({ x: exitX, z: playerState.z < 0 ? -1.45 : 1.45 });
          points.push({ x: exitX, z: 0 });
        }
        if (isRoomClosed(endRoom)) {
          const def = ROOM_DOOR_BY_ID[endRoom];
          const stopPos = { x: def.x, z: def.z + 0.56 };
          points.push({ x: def.x, z: 0 });
          points.push(stopPos);
          playerState.waypoints = points;
          showNotice(`${def.label} tertutup · Klik pintu atau tekan [G] untuk masuk.`, 2.6);
          return { blockedDoor: endRoom, stopPos };
        }
        if (endRoom !== 'corridor') {
          const enterX = getBayCenterX(targetX);
          points.push({ x: enterX, z: 0 });
          points.push({ x: enterX, z: targetZ < 0 ? -1.55 : 1.55 });
        }
      }
      if (viaPos) {
        points.push(viaPos);
      } else if (targetId === 'employee_pc_os') {
        points.push({ x: -4.1, z: 3.1 });
      }
      points.push({ x: targetX, z: targetZ });
      playerState.waypoints = points;
      return {};
    };

    const getNearestDoor = (maxDist = 2.35): RoomDoorDef | null => {
      let best: RoomDoorDef | null = null;
      let bestDist = maxDist;
      for (const d of ROOM_DOORS) {
        const dist = Math.hypot(playerState.x - d.x, playerState.z - d.z);
        if (dist < bestDist) {
          bestDist = dist;
          best = d;
        }
      }
      return best;
    };

    const setRoomDoorOpen = (doorId: RoomDoorId, nextOpen: boolean, announce = true) => {
      if (simState.doorOpen[doorId] === nextOpen) return;
      const def = ROOM_DOOR_BY_ID[doorId];
      simState.doorOpen[doorId] = nextOpen;
      if (
        !nextOpen &&
        def &&
        Math.abs(playerState.x - def.x) < 1.15 &&
        Math.abs(playerState.z - def.z) < 0.52
      ) {
        // Step player just clear of the closing door threshold so leaves never clip the body.
        // If standing on the inner side or directly on the threshold, keep them strictly inside.
        playerState.z = playerState.z <= def.z ? def.z - 0.56 : def.z + 0.56;
      }
      if (!nextOpen) {
        const currentRoomNow = getRoomAtPos(playerState.x, playerState.z);
        const lastWp = playerState.waypoints[playerState.waypoints.length - 1];
        if (lastWp && getRoomAtPos(lastWp.x, lastWp.z) !== currentRoomNow) {
          playerState.waypoints = [];
          playerState.pendingInteract = null;
          playerState.pendingNpcInteract = null;
          playerState.pendingSeatId = null;
          destRing.visible = false;
        }
      }
      playerState.interactAnimTimer = 0.28;
      fpReach.active = true;
      fpReach.timer = 0;
      sfx.playPickup();

      const near = getNearestDoor(2.35);
      if (near && near.id === doorId) {
        lastNearbyDoorKey = `${doorId}:${nextOpen ? 1 : 0}`;
        onNearbyDoorRef.current({ id: doorId, label: near.label, open: nextOpen });
      }
      if (announce && def) {
        showNotice(
          nextOpen ? `${def.label} dibuka.` : `${def.label} ditutup rapat.`,
          2.0
        );
      }
    };

    const sitOnSeat = (seat: OfficeSeatDef) => {
      playerState.waypoints = [];
      playerState.pendingInteract = null;
      playerState.pendingNpcInteract = null;
      playerState.pendingSeatId = null;
      playerState.pendingDoorToggle = null;
      playerState.moving = false;
      destRing.visible = false;
      playerState.seatedSeat = seat;
      playerState.x = seat.x;
      playerState.z = seat.z;
      playerState.facing = seat.facing;
      lastNearbySeatId = null;
      onNearbySeatRef.current(null);
      onSeatedRef.current(true);
      sfx.playPickup();
      showNotice(`Duduk di ${seat.label} · Tekan [F] atau WASD untuk berdiri`, 2.6);
    };

    const standUpFromSeat = () => {
      const seat = playerState.seatedSeat;
      if (!seat) return;
      playerState.seatedSeat = null;
      playerState.x = seat.standX;
      playerState.z = seat.standZ;
      onSeatedRef.current(false);
    };

    const resetSimulation = (nextPhase: 'ready' | 'playing') => {
      simState.timeRemaining = SESSION_DURATION_SEC;
      simState.hasCableInHand = false;
      simState.port1Connected = false;
      simState.port2Connected = false;
      simState.cablesTidied = false;
      simState.apConfigured = false;
      simState.rackChecked = false;
      simState.dhcpActive = false;
      simState.vlan10Active = false;
      simState.vlan20Active = false;
      simState.crimpingVerified = false;
      simState.receptionPcFixed = false;
      simState.osReinstalled = false;
      simState.meetingLaptopFixed = false;
      simState.bossReported = false;
      simState.doorOpen = {
        r01_server: false,
        r02_noc: false,
        r03_storage: false,
        r05_meeting: false,
        r15_boss: false,
      };
      simState.bossReadyNotified = false;
      simState.learningCorrectCount = 0;
      simState.learningAttemptsCount = 0;
      simState.consultedNpcs = [];
      simState.internetSettings = { ...DEFAULT_INTERNET_SETTINGS };
      simState.victory = false;

      const savedTech = parsePeoplePositionsTxt(loadSavedPeoplePositionsTxt()).entries.teknisi;
      playerState.x = savedTech ? savedTech.x : 0;
      playerState.y = savedTech ? savedTech.y : 0;
      playerState.z = savedTech ? savedTech.z : 0;
      playerState.facing = savedTech ? THREE.MathUtils.degToRad(savedTech.rot) : 0;
      playerState.waypoints = [];
      playerState.pendingInteract = null;
      playerState.pendingNpcInteract = null;
      playerState.pendingSeatId = null;
      playerState.pendingDoorToggle = null;
      playerState.seatedSeat = null;
      lastNearbyNpcId = null;
      lastNearbySeatId = null;
      lastNearbyDoorKey = '';
      (Object.keys(doorAngles) as RoomDoorId[]).forEach((id) => {
        doorAngles[id] = 0;
        const pivots = officeRefs.roomDoors[id];
        if (pivots) {
          pivots.leftPivot.rotation.y = 0;
          pivots.rightPivot.rotation.y = 0;
        }
      });
      onNearbyNpcRef.current(null);
      onNearbySeatRef.current(null);
      onSeatedRef.current(false);
      onNearbyDoorRef.current(null);
      onHoverNpcRef.current(null);
      destRing.visible = false;

      noticeTimer = 0;
      onNoticeRef.current(null);
      syncVisuals();
      pushStats(nextPhase);
    };

    const resolveCollision = (nx: number, nz: number, oldX: number, oldZ: number) => {
      const r = 0.34;
      const wallMargin = r + 0.08;
      let rx = THREE.MathUtils.clamp(nx, -14.5, 32.5);
      let rz = THREE.MathUtils.clamp(nz, -7.0, 7.0);

      if (Math.abs(rz) > 1.25 || Math.abs(oldZ) > 1.25) {
        for (const wx of [-9, -3, 3, 9, 15, 21, 27]) {
          const crossed =
            (oldX <= wx && rx > wx - wallMargin) ||
            (oldX >= wx && rx < wx + wallMargin);
          if (Math.abs(rx - wx) < wallMargin || crossed) {
            rx = oldX <= wx ? wx - wallMargin : wx + wallMargin;
          }
        }
      }

      const checkCenterX = Math.abs(oldZ) > 1.3 ? oldX : rx;
      const doorCenter = getBayCenterX(checkCenterX);
      const inDoorway = Math.abs(rx - doorCenter) < 1.02 && Math.abs(oldX - doorCenter) < 1.02;
      const doorIdAtCenter = ROOM_DOOR_BY_X[doorCenter];
      const doorBlocked = Boolean(doorIdAtCenter && !simState.doorOpen[doorIdAtCenter]);
      if (!inDoorway || doorBlocked) {
        const crossedNorth =
          (oldZ <= -1.3 && rz > -1.3 - wallMargin) ||
          (oldZ >= -1.3 && rz < -1.3 + wallMargin);
        if (Math.abs(rz - -1.3) < wallMargin || crossedNorth) {
          rz = oldZ <= -1.3 ? -1.3 - wallMargin : -1.3 + wallMargin;
        }
      }
      if (!inDoorway) {
        const crossedSouth =
          (oldZ <= 1.3 && rz > 1.3 - wallMargin) ||
          (oldZ >= 1.3 && rz < 1.3 + wallMargin);
        if (Math.abs(rz - 1.3) < wallMargin || crossedSouth) {
          rz = oldZ <= 1.3 ? 1.3 - wallMargin : 1.3 + wallMargin;
        }
      }

      if (Math.abs(rz) > 1.25) {
        for (const wx of [-9, -3, 3, 9, 15, 21, 27]) {
          if (Math.abs(rx - wx) < wallMargin) {
            rx = oldX <= wx ? wx - wallMargin : wx + wallMargin;
          }
        }
      }

      for (const box of OBSTACLES) {
        if (rx > box.minX - r && rx < box.maxX + r && rz > box.minZ - r && rz < box.maxZ + r) {
          const dxL = Math.abs(rx - (box.minX - r));
          const dxR = Math.abs(box.maxX + r - rx);
          const dzT = Math.abs(rz - (box.minZ - r));
          const dzB = Math.abs(box.maxZ + r - rz);
          const m = Math.min(dxL, dxR, dzT, dzB);
          if (m === dxL) rx = box.minX - r;
          else if (m === dxR) rx = box.maxX + r;
          else if (m === dzT) rz = box.minZ - r;
          else rz = box.maxZ + r;
        }
      }

      // Hard containment invariant for closed-door rooms:
      // Anyone inside stays strictly inside; anyone outside stays strictly outside.
      const startRoom = getRoomAtPos(oldX, oldZ);
      if (isRoomClosed(startRoom)) {
        const def = ROOM_DOOR_BY_ID[startRoom];
        rz = Math.min(rz, def.z - wallMargin);
        if (def.x > -12) rx = Math.max(def.x - 3 + wallMargin, rx);
        if (def.x < 30) rx = Math.min(def.x + 3 - wallMargin, rx);
      } else {
        const destRoom = getRoomAtPos(rx, rz);
        if (destRoom !== startRoom && isRoomClosed(destRoom)) {
          const def = ROOM_DOOR_BY_ID[destRoom];
          rz = Math.max(rz, def.z + wallMargin);
        }
      }

      return { x: rx, z: rz };
    };

    const executeInteraction = (id: WorkstationTargetId) => {
      playerState.interactAnimTimer = 0.42;
      fpReach.active = true;
      fpReach.timer = 0;

      if (id === 'cli_monitor') {
        sfx.playCliCommand();
        onOpenCliRef.current();
        return;
      }

      if (id === 'crimper_tool') {
        sfx.playCrimpClick();
        onOpenCrimpingRef.current();
        return;
      }

      if (id === 'boss_report') {
        sfx.playCliCommand();
        onOpenBossReportRef.current();
        return;
      }

      sfx.playCliCommand();
      onOpenCaseStudyRef.current(id);
    };

    const executeNpcInteraction = (npcId: OfficeNpcId) => {
      const npc = OFFICE_NPCS[npcId];
      const pose = npcDynamicPose[npcId];
      if (!npc || !pose) return;
      playerState.facing = Math.atan2(
        pose.worldPos.x - playerState.x,
        pose.worldPos.z - playerState.z
      );
      sfx.playCliCommand();
      onOpenNpcRef.current(npcId);
    };

    const applyCaseStudyResolution = (
      id: WorkstationTargetId,
      firstTryCorrect: number,
      totalAttempts: number
    ) => {
      simState.learningCorrectCount += firstTryCorrect;
      simState.learningAttemptsCount += totalAttempts;

      const ringPos = STATION_RING_POS[id];
      playerState.interactAnimTimer = 0.45;
      fpReach.active = true;
      fpReach.timer = 0;

      switch (id) {
        case 'utp_spool': {
          simState.hasCableInHand = true;
          sfx.playPickup();
          triggerBurstAt(ringPos.x, ringPos.z);
          showNotice('Kabel Cat6 Straight-Through diambil dari Gudang (R.03).');
          break;
        }
        case 'client_pc_1': {
          simState.port1Connected = true;
          simState.hasCableInHand = false;
          sfx.playLaptopConnected();
          triggerBurstAt(ringPos.x, ringPos.z);
          showNotice('Kabel Cat6 tercolok ke port RJ45 PC-01 & Switch Hub (LED Hijau).');
          break;
        }
        case 'client_pc_2': {
          simState.port2Connected = true;
          simState.hasCableInHand = false;
          sfx.playLaptopConnected();
          triggerBurstAt(ringPos.x, ringPos.z);
          showNotice('Kabel Cat6 tercolok ke port RJ45 PC-02 & Switch Hub (LED Hijau).');
          break;
        }
        case 'messy_cables': {
          simState.cablesTidied = true;
          sfx.playPickup();
          triggerBurstAt(ringPos.x, ringPos.z);
          showNotice('Kabel koridor dirapikan ke dalam floor cable tray sesuai standar K3.');
          break;
        }
        case 'ap_mount': {
          simState.apConfigured = true;
          simState.internetSettings = {
            ...simState.internetSettings,
            wifiEnabled: true,
          };
          sfx.playLaptopConnected();
          triggerBurstAt(ringPos.x, ringPos.z);
          showNotice(`Access Point PoE aktif · SSID "${simState.internetSettings.wifiSsid}" (WPA3).`);
          break;
        }
        case 'server_rack': {
          simState.rackChecked = true;
          sfx.playPowerRestore();
          triggerBurstAt(ringPos.x, ringPos.z);
          showNotice('Rak Server 42U, suhu AC & baterai UPS terverifikasi normal.');
          break;
        }
        case 'employee_pc_reception': {
          simState.receptionPcFixed = true;
          sfx.playLaptopConnected();
          triggerBurstAt(ringPos.x, ringPos.z);
          showNotice('PC Resepsionis (R.06) pulih — IP DHCP & DNS 1.1.1.1 aktif kembali.');
          break;
        }
        case 'employee_pc_os': {
          simState.osReinstalled = true;
          sfx.playLaptopConnected();
          triggerBurstAt(ringPos.x, ringPos.z);
          showNotice('Windows 11 Pro & Driver PC Karyawan (R.07) selesai diinstal tanpa hapus Data D:.');
          break;
        }
        case 'employee_pc_meeting': {
          simState.meetingLaptopFixed = true;
          sfx.playLaptopConnected();
          triggerBurstAt(ringPos.x, ringPos.z);
          showNotice('Driver Wi-Fi Laptop Rapat (R.05) aktif & terhubung ke jaringan kantor.');
          break;
        }
      }

      syncVisuals();
      pushStats();
      checkVictory();
    };

    controllerRef.current = {
      startSession: () => resetSimulation('playing'),
      restartSession: () => resetSimulation('playing'),
      resolveCaseStudy: (targetId, firstTryCorrect, totalAttempts) => {
        applyCaseStudyResolution(targetId, firstTryCorrect, totalAttempts);
      },
      recordNpcConsultation: (npcId, firstTryCorrect, totalAttempts) => {
        simState.learningCorrectCount += firstTryCorrect;
        simState.learningAttemptsCount += totalAttempts;
        if (!simState.consultedNpcs.includes(npcId)) {
          simState.consultedNpcs.push(npcId);
        }
        const npc = OFFICE_NPCS[npcId];
        const pose = npcDynamicPose[npcId];
        if (npc && pose) {
          triggerBurstAt(pose.worldPos.x, pose.worldPos.z);
          showNotice(`Pertanyaan ${npc.name} terjawab!`);
        }
        syncVisuals();
        pushStats();
      },
      previewCaseStudyStage: (targetId, stage) => {
        if (targetId === 'employee_pc_os' && stage === 'installing') {
          officeRefs.updateStationScreen(
            'employee_pc_os',
            'installing_os',
            'Windows Setup (UEFI)',
            'Installing Windows 11...',
            'Menyalin file ke Partisi C: (Data D: Aman)'
          );
        } else if (targetId === 'employee_pc_meeting' && stage === 'enabling') {
          officeRefs.updateStationScreen(
            'employee_pc_meeting',
            'installing_os',
            'Control Panel · Network',
            'Wi-Fi Adapter Enabled',
            'Update driver & pilih SSID kantor...'
          );
        }
      },
      setCameraAngle: (angle: CameraAngleId) => {
        angleRef.current = angle;
        if (angle === 'follow_back') {
          cameraOrbit.yaw = 0.22;
          cameraOrbit.pitch = 0.14;
          cameraOrbit.zoom = 0.72;
        } else if (angle === 'follow_side') {
          cameraOrbit.yaw = 1.42;
          cameraOrbit.pitch = 0.22;
          cameraOrbit.zoom = 0.92;
        } else if (angle === 'overview') {
          cameraOrbit.yaw = 0;
          cameraOrbit.pitch = 0.58;
          cameraOrbit.zoom = 1.0;
        } else if (angle === 'first_person') {
          cameraOrbit.yaw = 0;
          cameraOrbit.pitch = 0.16;
        }
      },
      setTechnicianAppearance: (nextAppearance: TechnicianAppearance) => {
        appearanceRef.current = nextAppearance;
        const oldGroup = techRig.group;
        const nextRig = buildDetailedTechnician(nextAppearance);
        nextRig.group.position.copy(oldGroup.position);
        nextRig.group.rotation.copy(oldGroup.rotation);
        nextRig.group.visible = oldGroup.visible;
        nextRig.heldCableGroup.visible = simState.hasCableInHand;
        scene.remove(oldGroup);
        oldGroup.traverse((obj) => {
          if ((obj as THREE.Sprite).isSprite) {
            const spr = obj as THREE.Sprite;
            spr.material.map?.dispose();
            spr.material.dispose();
          } else if ((obj as THREE.Mesh).isMesh) {
            const m = obj as THREE.Mesh;
            m.geometry?.dispose();
            const mats = Array.isArray(m.material) ? m.material : [m.material];
            mats.forEach((mat) => mat?.dispose());
          }
        });
        techRig = nextRig;
        scene.add(techRig.group);
        syncFpArmColors(nextAppearance);
      },
      walkToRoom: (roomId: RoomId) => {
        const meta = OFFICE_ROOMS.find((r) => r.id === roomId);
        if (!meta) return;
        standUpFromSeat();
        const route = buildCorridorPathTo(meta.x, meta.z);
        playerState.pendingInteract = null;
        playerState.pendingNpcInteract = null;
        playerState.pendingSeatId = null;
        playerState.pendingDoorToggle = null;
        if (route.stopPos) {
          destRing.position.set(route.stopPos.x, 0.025, route.stopPos.z);
          destRing.visible = true;
          return;
        }
        destRing.position.set(meta.x, 0.025, meta.z);
        destRing.visible = true;
        showNotice(`Menuju ${meta.code} · ${meta.label}`);
      },
      walkToTarget: (targetId: WorkstationTargetId) => {
        const anchor = STATION_STAND_POS[targetId];
        standUpFromSeat();
        const startRoom = getRoomAtPos(playerState.x, playerState.z);
        const targetRoom = getRoomAtPos(anchor.x, anchor.z);
        const dist = Math.hypot(playerState.x - anchor.x, playerState.z - anchor.z);
        playerState.pendingNpcInteract = null;
        playerState.pendingSeatId = null;
        playerState.pendingDoorToggle = null;
        if (dist < 1.85 && !isBoundaryClosed(startRoom, targetRoom)) {
          playerState.waypoints = [];
          playerState.pendingInteract = null;
          executeInteraction(targetId);
        } else {
          const route = buildCorridorPathTo(anchor.x, anchor.z, targetId);
          if (route.stopPos) {
            playerState.pendingInteract = null;
            destRing.position.set(route.stopPos.x, 0.025, route.stopPos.z);
            destRing.visible = true;
            return;
          }
          playerState.pendingInteract = targetId;
          destRing.position.set(anchor.x, 0.025, anchor.z);
          destRing.visible = true;
        }
      },
      walkToNpc: (npcId: OfficeNpcId) => {
        const npc = OFFICE_NPCS[npcId];
        const pose = npcDynamicPose[npcId];
        if (!npc || !pose) return;
        standUpFromSeat();
        const startRoom = getRoomAtPos(playerState.x, playerState.z);
        const dist = Math.hypot(playerState.x - pose.standPos.x, playerState.z - pose.standPos.z);
        playerState.pendingInteract = null;
        playerState.pendingSeatId = null;
        playerState.pendingDoorToggle = null;
        if (dist < 1.7 && !isBoundaryClosed(startRoom, pose.room)) {
          playerState.waypoints = [];
          playerState.pendingNpcInteract = null;
          executeNpcInteraction(npcId);
        } else {
          const route = buildCorridorPathTo(pose.standPos.x, pose.standPos.z, undefined, pose.viaPos);
          if (route.stopPos) {
            playerState.pendingNpcInteract = null;
            destRing.position.set(route.stopPos.x, 0.025, route.stopPos.z);
            destRing.visible = true;
            return;
          }
          playerState.pendingNpcInteract = npcId;
          destRing.position.set(pose.standPos.x, 0.025, pose.standPos.z);
          destRing.visible = true;
          showNotice(`Menghampiri ${npc.name} (${npc.role})`);
        }
      },
      applyCliConfig: (updates) => {
        if (updates.internetSettings) {
          simState.internetSettings = { ...updates.internetSettings };
          simState.dhcpActive = updates.internetSettings.dhcpEnabled;
          simState.vlan10Active = updates.internetSettings.vlan10Enabled;
          simState.vlan20Active = updates.internetSettings.vlan20Enabled;
          simState.apConfigured = updates.internetSettings.wifiEnabled;
          if (updates.internetSettings.dhcpEnabled) {
            triggerBurstAt(STATION_RING_POS.cli_monitor.x, STATION_RING_POS.cli_monitor.z);
          }
          if (updates.internetSettings.wifiEnabled) {
            triggerBurstAt(STATION_RING_POS.ap_mount.x, STATION_RING_POS.ap_mount.z);
          }
          showNotice(
            `Setting Internet diperbarui · DNS ${updates.internetSettings.dnsPrimary} · Wi-Fi ${
              updates.internetSettings.wifiEnabled ? updates.internetSettings.wifiSsid : 'Off'
            }`
          );
        } else {
          if (typeof updates.vlan10 === 'boolean') {
            simState.vlan10Active = updates.vlan10;
            simState.internetSettings.vlan10Enabled = updates.vlan10;
          }
          if (typeof updates.vlan20 === 'boolean') {
            simState.vlan20Active = updates.vlan20;
            simState.internetSettings.vlan20Enabled = updates.vlan20;
          }
          if (typeof updates.dhcp === 'boolean') {
            simState.dhcpActive = updates.dhcp;
            simState.internetSettings.dhcpEnabled = updates.dhcp;
            if (updates.dhcp) {
              triggerBurstAt(STATION_RING_POS.cli_monitor.x, STATION_RING_POS.cli_monitor.z);
            }
          }
          if (typeof updates.apConfigured === 'boolean') {
            simState.apConfigured = updates.apConfigured;
            simState.internetSettings.wifiEnabled = updates.apConfigured;
            if (updates.apConfigured) {
              triggerBurstAt(STATION_RING_POS.ap_mount.x, STATION_RING_POS.ap_mount.z);
            }
          }
        }
        syncVisuals();
        pushStats();
        checkVictory();
      },
      completeCrimping: () => {
        simState.crimpingVerified = true;
        simState.hasCableInHand = true;
        triggerBurstAt(STATION_RING_POS.crimper_tool.x, STATION_RING_POS.crimper_tool.z);
        syncVisuals();
        showNotice('Kabel Cat6 teruji di Lab (T568B OK) & siap dipasang ke PC Klien.');
        pushStats();
      },
      submitBossReport: () => {
        if (!areAllTechTasksDone()) return;
        simState.bossReported = true;
        triggerBurstAt(STATION_RING_POS.boss_report.x, STATION_RING_POS.boss_report.z);
        syncVisuals();
        pushStats();
        checkVictory();
      },
      toggleSit: () => {
        if (playerState.seatedSeat) {
          standUpFromSeat();
          showNotice('Berdiri dari kursi', 1.4);
          return;
        }
        if (lastNearbySeatId && SEAT_MAP[lastNearbySeatId]) {
          sitOnSeat(SEAT_MAP[lastNearbySeatId]);
        }
      },
      toggleDoor: (doorId?: RoomDoorId) => {
        const targetId = doorId ?? getNearestDoor(2.35)?.id ?? 'r15_boss';
        const def = ROOM_DOOR_BY_ID[targetId];
        if (!def) return;
        const dist = Math.hypot(playerState.x - def.x, playerState.z - def.z);
        if (dist < 2.35) {
          setRoomDoorOpen(def.id, !simState.doorOpen[def.id]);
          return;
        }
        standUpFromSeat();
        const currentRoom = getRoomAtPos(playerState.x, playerState.z);
        const doorSideZ = currentRoom === def.id ? def.z - 0.72 : def.z + 0.72;
        const route = buildCorridorPathTo(def.x, doorSideZ);
        playerState.pendingInteract = null;
        playerState.pendingNpcInteract = null;
        playerState.pendingSeatId = null;
        if (route.stopPos) {
          playerState.pendingDoorToggle = null;
          destRing.position.set(route.stopPos.x, 0.025, route.stopPos.z);
          destRing.visible = true;
          return;
        }
        playerState.pendingDoorToggle = def.id;
        destRing.position.set(def.x, 0.025, doorSideZ);
        destRing.visible = true;
        showNotice(`Menuju ${def.label}`, 1.8);
      },
      applyPeoplePositions: (rawTxt: string, options?: { movePlayer?: boolean }) => {
        const res = applyPositionsToScene(rawTxt, options?.movePlayer ?? true);
        if (res.appliedCount > 0) {
          showNotice(`Posisi ${res.appliedCount} orang diperbarui dari Notepad.`);
        }
        return res;
      },
      getPlayerPosition: () => ({
        x: Number(playerState.x.toFixed(2)),
        y: Number(playerState.y.toFixed(2)),
        z: Number(playerState.z.toFixed(2)),
        rot: Number(THREE.MathUtils.radToDeg(playerState.facing).toFixed(1)),
      }),
    };

    applyPositionsToScene(loadSavedPeoplePositionsTxt(), true);
    syncVisuals();
    pushStats(phaseRef.current);

    const getTargetInfo = (id: WorkstationTargetId): WorkstationTargetInfo => {
      switch (id) {
        case 'utp_spool':
          return {
            id,
            room: 'r03_storage',
            title: 'Rak Gulungan Kabel (Ruang 03)',
            actionHint: simState.hasCableInHand
              ? 'Kabel sudah dibawa · Pasang ke PC-01 / PC-02'
              : 'Klik untuk zoom & pilih kabel jaringan yang tepat',
            ready: !simState.hasCableInHand,
          };
        case 'client_pc_1':
          return {
            id,
            room: 'r07_client_a',
            title: 'Workstation PC-01 (Ruang 07)',
            actionHint: simState.port1Connected
              ? 'PC-01 sudah terpasang kabel'
              : simState.hasCableInHand
                ? 'Klik untuk zoom & hubungkan kabel ke PC-01'
                : 'Ambil gulungan kabel dari Gudang (Ruang 03)',
            ready: !simState.port1Connected && simState.hasCableInHand,
          };
        case 'client_pc_2':
          return {
            id,
            room: 'r08_client_b',
            title: 'Workstation PC-02 (Ruang 08)',
            actionHint: simState.port2Connected
              ? 'PC-02 sudah terpasang kabel'
              : simState.hasCableInHand
                ? 'Klik untuk zoom & hubungkan kabel ke PC-02'
                : 'Ambil gulungan kabel dari Gudang (Ruang 03)',
            ready: !simState.port2Connected && simState.hasCableInHand,
          };
        case 'messy_cables':
          return {
            id,
            room: 'corridor',
            title: 'Kabel Lantai Acak (Koridor Utama)',
            actionHint: simState.cablesTidied
              ? 'Kabel koridor sudah tertata aman'
              : 'Klik untuk zoom & tangani kabel berantakan',
            ready: !simState.cablesTidied,
          };
        case 'ap_mount':
          return {
            id,
            room: 'r09_wifi',
            title: 'Access Point Wi-Fi (Ruang 09)',
            actionHint: simState.apConfigured
              ? 'Access Point Wi-Fi aktif'
              : 'Klik untuk zoom & konfigurasi Access Point',
            ready: !simState.apConfigured,
          };
        case 'server_rack':
          return {
            id,
            room: 'r01_server',
            title: 'Rak Server Utama 42U (Ruang 01)',
            actionHint: simState.rackChecked
              ? 'Rak Server & UPS sudah OK'
              : 'Klik untuk zoom & inspeksi Rak Server',
            ready: !simState.rackChecked,
          };
        case 'cli_monitor':
          return {
            id,
            room: 'r02_noc',
            title: 'Meja Operator CLI NOC (Ruang 02)',
            actionHint: simState.dhcpActive
              ? 'DHCP aktif · Klik untuk buka terminal SSH'
              : 'Klik untuk zoom & aktifkan DHCP di terminal',
            ready: true,
          };
        case 'crimper_tool':
          return {
            id,
            room: 'r04_lab',
            title: 'Lab Crimping & Fiber (Ruang 04)',
            actionHint: 'Klik untuk zoom & uji urutan pinout kabel (opsional)',
            ready: true,
          };
        case 'employee_pc_reception':
          return {
            id,
            room: 'r06_reception',
            title: 'PC Resepsionis — Keluhan Internet (Ruang 06)',
            actionHint: simState.receptionPcFixed
              ? 'Internet PC Resepsionis sudah normal'
              : 'Klik untuk zoom & diagnosa keluhan tidak bisa internet',
            ready: !simState.receptionPcFixed,
          };
        case 'employee_pc_os':
          return {
            id,
            room: 'r07_client_a',
            title: 'PC Karyawan Divisi A — Blue Screen (Ruang 07)',
            actionHint: simState.osReinstalled
              ? 'Sistem & Driver sudah pulih'
              : 'Klik untuk zoom & diagnosa PC Blue Screen',
            ready: !simState.osReinstalled,
          };
        case 'employee_pc_meeting':
          return {
            id,
            room: 'r05_meeting',
            title: 'Laptop Ruang Rapat — Wi-Fi Hilang (Ruang 05)',
            actionHint: simState.meetingLaptopFixed
              ? 'Wi-Fi Laptop Rapat sudah tersambung'
              : 'Klik untuk zoom & diagnosa keluhan koneksi nirkabel',
            ready: !simState.meetingLaptopFixed,
          };
        case 'boss_report': {
          const allTechDone = areAllTechTasksDone();
          return {
            id,
            room: 'r15_boss',
            title: 'Meja Direktur Utama (R.15 Ruang Bos)',
            actionHint: simState.bossReported
              ? 'Laporan akhir sudah diserahkan ke Direktur'
              : allTechDone
                ? 'Klik untuk menyerahkan laporan selesai ke Bos!'
                : 'Selesaikan semua 9 tugas teknisi lalu lapor ke Bos',
            ready: allTechDone && !simState.bossReported,
          };
        }
      }
    };

    // Input Listeners
    const keysDown = new Set<string>();
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();

    const handlePointerMove = (e: PointerEvent) => {
      if (cameraOrbit.dragging) {
        const dx = e.clientX - cameraOrbit.lastX;
        const dy = e.clientY - cameraOrbit.lastY;
        cameraOrbit.lastX = e.clientX;
        cameraOrbit.lastY = e.clientY;
        cameraOrbit.yaw -= dx * 0.0065;
        cameraOrbit.pitch = THREE.MathUtils.clamp(cameraOrbit.pitch + dy * 0.0045, 0.08, 1.0);
        renderer.domElement.style.cursor = 'grabbing';
        return;
      }

      if (modalPausedRef.current) {
        if (hoveredId !== null) {
          hoveredId = null;
          onHoverRef.current(null);
        }
        if (hoveredNpcId !== null) {
          hoveredNpcId = null;
          onHoverNpcRef.current(null);
        }
        hoverRing.visible = false;
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);

      const hits = raycaster.intersectObjects(
        [
          ...officeRefs.npcInteractables,
          ...officeRefs.interactables,
          ...officeRefs.doorInteractables,
          ...officeRefs.seatInteractables,
        ],
        true
      );
      let nextId: WorkstationTargetId | null = null;
      let nextNpcId: OfficeNpcId | null = null;
      let nextSeatId: string | null = null;
      let nextDoorHoverId: RoomDoorId | null = null;
      for (const hit of hits) {
        const npcIdHit = hit.object.userData.npcId as OfficeNpcId | undefined;
        if (npcIdHit) {
          nextNpcId = npcIdHit;
          break;
        }
        const id = hit.object.userData.interactId as WorkstationTargetId | undefined;
        if (id) {
          nextId = id;
          break;
        }
        const doorIdHit = hit.object.userData.roomDoorId as RoomDoorId | undefined;
        if (doorIdHit && ROOM_DOOR_BY_ID[doorIdHit]) {
          nextDoorHoverId = doorIdHit;
          break;
        }
        const seatIdHit = hit.object.userData.seatId as string | undefined;
        if (seatIdHit && SEAT_MAP[seatIdHit]) {
          nextSeatId = seatIdHit;
          break;
        }
      }

      renderer.domElement.style.cursor =
        nextNpcId || nextId || nextDoorHoverId || nextSeatId ? 'pointer' : 'default';
      if (nextNpcId) {
        const wp = OFFICE_NPCS[nextNpcId].worldPos;
        hoverRing.position.set(wp.x, 0.028, wp.z);
        hoverRing.visible = true;
      } else if (nextId) {
        const rp = STATION_RING_POS[nextId];
        hoverRing.position.set(rp.x, 0.028, rp.z);
        hoverRing.visible = true;
      } else if (nextDoorHoverId) {
        const dp = ROOM_DOOR_BY_ID[nextDoorHoverId];
        hoverRing.position.set(dp.x, 0.028, dp.z);
        hoverRing.visible = true;
      } else if (nextSeatId) {
        const sp = SEAT_MAP[nextSeatId];
        hoverRing.position.set(sp.x, 0.028, sp.z);
        hoverRing.visible = true;
      } else {
        hoverRing.visible = false;
      }

      if (nextNpcId !== hoveredNpcId) {
        hoveredNpcId = nextNpcId;
        onHoverNpcRef.current(nextNpcId ? getNpcInfo(nextNpcId) : null);
      } else if (nextNpcId) {
        onHoverNpcRef.current(getNpcInfo(nextNpcId));
      }

      if (nextId !== hoveredId) {
        hoveredId = nextId;
        onHoverRef.current(nextId ? getTargetInfo(nextId) : null);
      } else if (nextId) {
        onHoverRef.current(getTargetInfo(nextId));
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (modalPausedRef.current) return;

      if (e.button === 2 || (e.button === 0 && e.shiftKey)) {
        cameraOrbit.dragging = true;
        cameraOrbit.lastX = e.clientX;
        cameraOrbit.lastY = e.clientY;
        renderer.domElement.style.cursor = 'grabbing';
        return;
      }

      if (e.button !== 0 || phaseRef.current !== 'playing') return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);

      const hits = raycaster.intersectObjects(
        [
          ...officeRefs.npcInteractables,
          ...officeRefs.interactables,
          ...officeRefs.doorInteractables,
          ...officeRefs.seatInteractables,
        ],
        true
      );
      for (const hit of hits) {
        const npcIdHit = hit.object.userData.npcId as OfficeNpcId | undefined;
        if (npcIdHit) {
          controllerRef.current?.walkToNpc(npcIdHit);
          onHoverNpcRef.current(getNpcInfo(npcIdHit));
          return;
        }
        const id = hit.object.userData.interactId as WorkstationTargetId | undefined;
        if (id) {
          controllerRef.current?.walkToTarget(id);
          onHoverRef.current(getTargetInfo(id));
          return;
        }
        const doorIdHit = hit.object.userData.roomDoorId as RoomDoorId | undefined;
        if (doorIdHit && ROOM_DOOR_BY_ID[doorIdHit]) {
          controllerRef.current?.toggleDoor(doorIdHit);
          return;
        }
        const seatIdHit = hit.object.userData.seatId as string | undefined;
        if (seatIdHit && SEAT_MAP[seatIdHit]) {
          const seat = SEAT_MAP[seatIdHit];
          if (playerState.seatedSeat?.id === seat.id) {
            standUpFromSeat();
            return;
          }
          standUpFromSeat();
          playerState.pendingDoorToggle = null;
          const startRoom = getRoomAtPos(playerState.x, playerState.z);
          const dist = Math.hypot(
            playerState.x - seat.approachX,
            playerState.z - seat.approachZ
          );
          if (dist < 1.25 && !isBoundaryClosed(startRoom, seat.room)) {
            sitOnSeat(seat);
          } else {
            const route = buildCorridorPathTo(seat.approachX, seat.approachZ);
            playerState.pendingInteract = null;
            playerState.pendingNpcInteract = null;
            if (route.stopPos) {
              playerState.pendingSeatId = null;
              destRing.position.set(route.stopPos.x, 0.025, route.stopPos.z);
              destRing.visible = true;
              return;
            }
            playerState.pendingSeatId = seat.id;
            destRing.position.set(seat.approachX, 0.025, seat.approachZ);
            destRing.visible = true;
            showNotice(`Menuju ${seat.label}`, 1.8);
          }
          return;
        }
      }

      const floorHits = raycaster.intersectObject(walkFloorPlane);
      if (floorHits.length > 0) {
        standUpFromSeat();
        const pt = floorHits[0].point;
        const cx = THREE.MathUtils.clamp(pt.x, -14.2, 32.2);
        const cz = THREE.MathUtils.clamp(pt.z, -6.8, 6.8);
        const route = buildCorridorPathTo(cx, cz);
        playerState.pendingInteract = null;
        playerState.pendingNpcInteract = null;
        playerState.pendingSeatId = null;
        playerState.pendingDoorToggle = null;
        const ringPos = route.stopPos ?? { x: cx, z: cz };
        destRing.position.set(ringPos.x, 0.025, ringPos.z);
        destRing.visible = true;
      }
    };

    const handlePointerUp = () => {
      if (cameraOrbit.dragging) {
        cameraOrbit.dragging = false;
        renderer.domElement.style.cursor = 'default';
      }
    };

    const handleWheel = (e: WheelEvent) => {
      cameraOrbit.zoom = THREE.MathUtils.clamp(cameraOrbit.zoom + e.deltaY * 0.0008, 0.42, 1.85);
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalPausedRef.current) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      keysDown.add(key);

      const angleMap: Record<string, CameraAngleId> = {
        '1': 'follow_back',
        '2': 'follow_side',
        '3': 'overview',
        '4': 'first_person',
      };
      if (angleMap[key]) {
        const nextAngle = angleMap[key];
        controllerRef.current?.setCameraAngle(nextAngle);
        onAngleRef.current(nextAngle);
      }

      if (key === 'f' && phaseRef.current === 'playing') {
        controllerRef.current?.toggleSit();
        return;
      }

      if (key === 'g' && phaseRef.current === 'playing') {
        const nearDoor = getNearestDoor(2.35);
        if (nearDoor) {
          controllerRef.current?.toggleDoor(nearDoor.id);
        }
        return;
      }

      if (key === 't' && phaseRef.current === 'playing') {
        if (lastNearbyNpcId) {
          executeNpcInteraction(lastNearbyNpcId);
          return;
        }
        if (
          getRoomAtPos(playerState.x, playerState.z) === 'r15_boss' &&
          Math.hypot(playerState.x - 30.35, playerState.z - -4.3) < 2.75
        ) {
          executeInteraction('boss_report');
          return;
        }
      }

      if ((key === 'e' || key === ' ') && phaseRef.current === 'playing') {
        const currentRoom = getRoomAtPos(playerState.x, playerState.z);
        let bestId: WorkstationTargetId | null = null;
        let bestDist = 2.25;
        (Object.keys(STATION_STAND_POS) as WorkstationTargetId[]).forEach((id) => {
          const pos = STATION_STAND_POS[id];
          const targetRoom = getRoomAtPos(pos.x, pos.z);
          if (isBoundaryClosed(currentRoom, targetRoom)) return;
          const d = Math.hypot(playerState.x - pos.x, playerState.z - pos.z);
          if (d < bestDist) {
            bestDist = d;
            bestId = id;
          }
        });
        if (bestId) {
          executeInteraction(bestId);
        } else {
          const nearDoor = getNearestDoor(2.35);
          if (nearDoor) {
            controllerRef.current?.toggleDoor(nearDoor.id);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => keysDown.delete(e.key.toLowerCase());

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: true });
    renderer.domElement.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 6. Main Loop
    let rafId = 0;
    let timerId = 0;
    let lastTime = performance.now();
    let hudSyncAccum = 0;
    let lastRoom = getRoomAtPos(playerState.x, playerState.z);
    const desiredCamPos = new THREE.Vector3();
    const desiredLook = new THREE.Vector3();
    const smoothCamPos = new THREE.Vector3(0.48, 1.5, 2.15);
    const smoothLook = new THREE.Vector3(0, 1.22, 0);
    const _pktPos = new THREE.Vector3();
    const armPose = {
      lArmX: -0.05,
      lArmY: 0.06,
      lArmZ: -0.11,
      lForeX: -0.34,
      rArmX: -0.05,
      rArmY: -0.06,
      rArmZ: 0.11,
      rForeX: -0.34,
    };

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          timerId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          timerId = window.setTimeout(cb, 80);
        }
      };
      timerId = window.setTimeout(poll, 5);
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      let moveX = 0;
      let moveZ = 0;
      if (phaseRef.current === 'playing' && !modalPausedRef.current) {
        if (keysDown.has('w') || keysDown.has('arrowup')) moveZ -= 1;
        if (keysDown.has('s') || keysDown.has('arrowdown')) moveZ += 1;
        if (keysDown.has('a') || keysDown.has('arrowleft')) moveX -= 1;
        if (keysDown.has('d') || keysDown.has('arrowright')) moveX += 1;

        if (moveX !== 0 || moveZ !== 0) {
          if (playerState.seatedSeat) {
            standUpFromSeat();
          }
          playerState.waypoints = [];
          playerState.pendingInteract = null;
          playerState.pendingNpcInteract = null;
          playerState.pendingSeatId = null;
          playerState.pendingDoorToggle = null;
          destRing.visible = false;

          const len = Math.hypot(moveX, moveZ);
          moveX /= len;
          moveZ /= len;

          if (angleRef.current !== 'overview') {
            const sinY = Math.sin(cameraOrbit.yaw);
            const cosY = Math.cos(cameraOrbit.yaw);
            const rx = moveX * cosY + moveZ * sinY;
            const rz = -moveX * sinY + moveZ * cosY;
            moveX = rx;
            moveZ = rz;
          }
        } else if (playerState.waypoints.length > 0) {
          const wp = playerState.waypoints[0];
          const dx = wp.x - playerState.x;
          const dz = wp.z - playerState.z;
          const dist = Math.hypot(dx, dz);
          if (dist < 0.16) {
            playerState.waypoints.shift();
            if (playerState.waypoints.length === 0) {
              destRing.visible = false;
              if (playerState.pendingInteract) {
                const targetId = playerState.pendingInteract;
                playerState.pendingInteract = null;
                executeInteraction(targetId);
              } else if (playerState.pendingNpcInteract) {
                const npcId = playerState.pendingNpcInteract;
                playerState.pendingNpcInteract = null;
                executeNpcInteraction(npcId);
              } else if (playerState.pendingSeatId) {
                const seat = SEAT_MAP[playerState.pendingSeatId];
                playerState.pendingSeatId = null;
                if (seat) sitOnSeat(seat);
              } else if (playerState.pendingDoorToggle) {
                const doorId = playerState.pendingDoorToggle;
                playerState.pendingDoorToggle = null;
                setRoomDoorOpen(doorId, !simState.doorOpen[doorId]);
              }
            }
          } else {
            moveX = dx / dist;
            moveZ = dz / dist;
          }
        }
      }

      playerState.moving = moveX !== 0 || moveZ !== 0;
      if (playerState.moving) {
        const nextX = playerState.x + moveX * playerState.speed * dt;
        const nextZ = playerState.z + moveZ * playerState.speed * dt;
        const resolved = resolveCollision(nextX, nextZ, playerState.x, playerState.z);
        playerState.x = resolved.x;
        playerState.z = resolved.z;

        const targetFacing = Math.atan2(moveX, moveZ);
        let diff = targetFacing - playerState.facing;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        playerState.facing += diff * Math.min(1, 12 * dt);

        playerState.walkCycle += dt * 11;
      } else {
        playerState.walkCycle *= 0.85;
      }

      // Detailed Technician Animation (Standing / Walking / Seated)
      techRig.group.position.set(playerState.x, playerState.y, playerState.z);
      techRig.group.rotation.y = playerState.facing;

      const stride = playerState.moving ? Math.sin(playerState.walkCycle) : 0;
      const breath = Math.sin(now * 0.0022);
      const sway = Math.sin(now * 0.0014);
      const activeSeat = playerState.seatedSeat;
      const bounce = playerState.moving
        ? -Math.abs(stride) * 0.024
        : breath * 0.004;

      const targetHipY = activeSeat ? activeSeat.seatY + breath * 0.003 : 0.858 + bounce;
      const targetLegX = activeSeat ? (activeSeat.isBeanbag ? -1.32 : -1.56) : stride * 0.52;
      const targetRightLegX = activeSeat ? (activeSeat.isBeanbag ? -1.32 : -1.56) : -stride * 0.52;
      const targetLeftShinX = activeSeat ? (activeSeat.isBeanbag ? 1.12 : 1.52) : Math.max(0, -stride * 0.48);
      const targetRightShinX = activeSeat ? (activeSeat.isBeanbag ? 1.12 : 1.52) : Math.max(0, stride * 0.48);

      techRig.hips.position.y = THREE.MathUtils.damp(techRig.hips.position.y, targetHipY, 14, dt);
      techRig.leftLeg.rotation.x = THREE.MathUtils.damp(techRig.leftLeg.rotation.x, targetLegX, 14, dt);
      techRig.rightLeg.rotation.x = THREE.MathUtils.damp(techRig.rightLeg.rotation.x, targetRightLegX, 14, dt);
      techRig.leftShin.rotation.x = THREE.MathUtils.damp(techRig.leftShin.rotation.x, targetLeftShinX, 14, dt);
      techRig.rightShin.rotation.x = THREE.MathUtils.damp(techRig.rightShin.rotation.x, targetRightShinX, 14, dt);

      if (techRig.hasSkirt) {
        techRig.pelvis.rotation.x = THREE.MathUtils.damp(
          techRig.pelvis.rotation.x,
          activeSeat ? -1.28 : 0,
          14,
          dt
        );
        techRig.pelvis.scale.y = THREE.MathUtils.damp(
          techRig.pelvis.scale.y,
          activeSeat ? 0.72 : 1.0,
          14,
          dt
        );
        techRig.pelvis.scale.z = THREE.MathUtils.damp(
          techRig.pelvis.scale.z,
          activeSeat ? 0.92 : 0.68,
          14,
          dt
        );
      }

      techRig.torso.rotation.y = activeSeat ? sway * 0.025 : stride * 0.07;
      techRig.torso.rotation.x = playerState.moving
        ? 0.055
        : activeSeat
          ? -0.04 + breath * 0.014
          : breath * 0.015;
      techRig.headGroup.rotation.y = playerState.moving
        ? -stride * 0.04
        : Math.sin(now * 0.0009) * 0.07;
      techRig.headGroup.rotation.x = playerState.moving ? -0.04 : breath * 0.018;

      // Natural relaxed arm & wrist targets damped smoothly (never robotic snapping)
      const isStudioPreview = customizerOpenRef.current;
      const targetLArmX = playerState.moving
        ? -stride * 0.42 - 0.04
        : activeSeat
          ? -0.34 + breath * 0.02
          : isStudioPreview
            ? -0.14 + breath * 0.025
            : -0.05 + breath * 0.024;
      const targetLArmY = playerState.moving ? 0.04 : 0.08 + sway * 0.03;
      const targetLArmZ = playerState.moving ? -0.11 : -0.12 - breath * 0.012;
      const targetLForeX = playerState.moving
        ? -0.32 - Math.max(0, -stride * 0.24)
        : activeSeat
          ? -0.68 + breath * 0.02
          : isStudioPreview
            ? -0.44 + breath * 0.03
            : -0.34 + breath * 0.025;

      let targetRArmX: number;
      let targetRArmY: number;
      let targetRArmZ: number;
      let targetRForeX: number;

      if (playerState.interactAnimTimer > 0) {
        playerState.interactAnimTimer -= dt;
        targetRArmX = -0.92;
        targetRArmY = -0.12;
        targetRArmZ = 0.1;
        targetRForeX = -0.58;
      } else if (simState.hasCableInHand) {
        targetRArmX = -0.46 + breath * 0.02;
        targetRArmY = -0.14;
        targetRArmZ = 0.09;
        targetRForeX = -0.72;
      } else if (activeSeat) {
        targetRArmX = -0.34 - breath * 0.02;
        targetRArmY = -0.08 - sway * 0.02;
        targetRArmZ = 0.12;
        targetRForeX = -0.68 - breath * 0.02;
      } else if (isStudioPreview) {
        // Warm natural relaxed posture when customizing look
        targetRArmX = -0.18 + breath * 0.025;
        targetRArmY = -0.12;
        targetRArmZ = 0.14 + sway * 0.015;
        targetRForeX = -0.48 - breath * 0.025;
      } else {
        targetRArmX = playerState.moving ? stride * 0.42 - 0.04 : -0.05 - breath * 0.022;
        targetRArmY = playerState.moving ? -0.04 : -0.08 - sway * 0.03;
        targetRArmZ = playerState.moving ? 0.11 : 0.12 + breath * 0.012;
        targetRForeX = playerState.moving
          ? -0.32 - Math.max(0, stride * 0.24)
          : -0.34 - breath * 0.025;
      }

      const armLambda = playerState.interactAnimTimer > 0 ? 15 : 10;
      armPose.lArmX = THREE.MathUtils.damp(armPose.lArmX, targetLArmX, armLambda, dt);
      armPose.lArmY = THREE.MathUtils.damp(armPose.lArmY, targetLArmY, armLambda, dt);
      armPose.lArmZ = THREE.MathUtils.damp(armPose.lArmZ, targetLArmZ, armLambda, dt);
      armPose.lForeX = THREE.MathUtils.damp(armPose.lForeX, targetLForeX, armLambda, dt);

      armPose.rArmX = THREE.MathUtils.damp(armPose.rArmX, targetRArmX, armLambda, dt);
      armPose.rArmY = THREE.MathUtils.damp(armPose.rArmY, targetRArmY, armLambda, dt);
      armPose.rArmZ = THREE.MathUtils.damp(armPose.rArmZ, targetRArmZ, armLambda, dt);
      armPose.rForeX = THREE.MathUtils.damp(armPose.rForeX, targetRForeX, armLambda, dt);

      techRig.leftArm.rotation.set(armPose.lArmX, armPose.lArmY, armPose.lArmZ);
      techRig.leftForearm.rotation.set(armPose.lForeX, 0.12, 0.04);
      techRig.rightArm.rotation.set(armPose.rArmX, armPose.rArmY, armPose.rArmZ);
      techRig.rightForearm.rotation.set(armPose.rForeX, -0.12, -0.04);

      if (fpReach.active) {
        fpReach.timer += dt;
        const t = Math.min(1, fpReach.timer / fpReach.duration);
        const w = Math.sin(t * Math.PI);
        fpArmRig.root.position.set(0.24 - w * 0.08, -0.24 + w * 0.08, -0.42 - w * 0.16);
        if (t >= 1) fpReach.active = false;
      } else {
        fpArmRig.root.position.set(
          0.24 + Math.sin(now * 0.0014) * 0.003,
          -0.24 + Math.sin(now * 0.002) * 0.004,
          -0.42
        );
      }

      // Active Staff Animations (breathing, typing, box-organizing, pantry/toilet/mushola activities, & help badge bobbing)
      const sec = now * 0.001;
      const focusedNpcId = activeNpcIdRef.current;
      for (const w of officeRefs.workers) {
        const p = sec * 3.4 + w.phaseOffset;
        const b = Math.sin(sec * 1.8 + w.phaseOffset);
        const isFocused = Boolean(w.npcId && w.npcId === focusedNpcId);

        if (w.activity === 'organize_boxes') {
          const lift = Math.sin(sec * 1.9 + w.phaseOffset);
          w.torso.rotation.x = 0.2 + lift * 0.045;
          w.leftArm.rotation.x = -0.72 + lift * 0.06;
          w.rightArm.rotation.x = -0.72 + lift * 0.06;
          w.leftForearm.rotation.x = -0.74;
          w.rightForearm.rotation.x = -0.74;
          w.headGroup.rotation.y = isFocused
            ? Math.sin(sec * 1.4) * 0.08
            : Math.sin(sec * 0.8 + w.phaseOffset) * 0.12;
          w.headGroup.rotation.x = isFocused
            ? 0.04 + Math.sin(sec * 2.6) * 0.06
            : 0.24 + Math.sin(sec * 1.1 + w.phaseOffset) * 0.04;
        } else if (w.activity === 'pantry_coffee') {
          const stir = Math.sin(sec * 3.0 + w.phaseOffset);
          w.torso.rotation.x = 0.08 + b * 0.015;
          w.leftArm.rotation.x = -0.26 + b * 0.02;
          w.rightArm.rotation.x = -0.48 + stir * 0.05;
          w.leftForearm.rotation.x = -0.45;
          w.rightForearm.rotation.x = -0.68 + Math.cos(sec * 3.0 + w.phaseOffset) * 0.12;
          w.headGroup.rotation.y = Math.sin(sec * 0.7 + w.phaseOffset) * 0.12;
          w.headGroup.rotation.x = 0.16 + b * 0.03;
        } else if (w.activity === 'wash_hands') {
          const scrub = Math.sin(sec * 4.2 + w.phaseOffset);
          w.torso.rotation.x = 0.12 + b * 0.015;
          w.leftArm.rotation.x = -0.52 + scrub * 0.04;
          w.rightArm.rotation.x = -0.52 - scrub * 0.04;
          w.leftForearm.rotation.x = -0.68 + scrub * 0.08;
          w.rightForearm.rotation.x = -0.68 - scrub * 0.08;
          w.headGroup.rotation.y = Math.sin(sec * 0.6 + w.phaseOffset) * 0.08;
          w.headGroup.rotation.x = 0.22 + b * 0.02;
        } else if (w.activity === 'pray') {
          const calm = Math.sin(sec * 0.9 + w.phaseOffset);
          w.torso.rotation.x = 0.08 + calm * 0.035;
          w.leftArm.rotation.x = -0.26;
          w.rightArm.rotation.x = -0.26;
          w.leftForearm.rotation.x = -0.76 + calm * 0.03;
          w.rightForearm.rotation.x = -0.76 + calm * 0.03;
          w.headGroup.rotation.y = 0;
          w.headGroup.rotation.x = 0.22 + calm * 0.03;
        } else {
          w.torso.rotation.x = w.seated ? 0.06 + b * 0.015 : b * 0.018;
          if (w.seated) {
            w.leftArm.rotation.x = -0.44 + Math.sin(p) * 0.06;
            w.rightArm.rotation.x = -0.44 + Math.cos(p * 1.12) * 0.06;
            w.leftForearm.rotation.x = -0.95 + Math.sin(p * 1.5) * 0.05;
            w.rightForearm.rotation.x = -0.95 + Math.cos(p * 1.5) * 0.05;
          } else {
            w.leftArm.rotation.x = -0.22 + b * 0.03;
            w.rightArm.rotation.x = isFocused ? -0.42 + Math.sin(sec * 3) * 0.08 : -0.22 - b * 0.03;
            w.leftForearm.rotation.x = w.holdingTablet ? -0.92 : -0.32;
            w.rightForearm.rotation.x = w.holdingTablet ? -0.92 : isFocused ? -0.68 : -0.32;
          }
          w.headGroup.rotation.y = isFocused
            ? Math.sin(sec * 1.4) * 0.1
            : Math.sin(sec * 0.72 + w.phaseOffset) * 0.18;
          w.headGroup.rotation.x = isFocused
            ? Math.sin(sec * 2.6) * 0.07
            : 0.05 + Math.sin(sec * 1.05 + w.phaseOffset) * 0.05;
        }

        if (w.helpBadge && w.helpBadge.visible) {
          const baseY = w.seated ? 1.66 : 2.02;
          w.helpBadge.position.y = baseY + Math.sin(sec * 2.6 + w.phaseOffset) * 0.04;
          const pulse = 1 + Math.sin(sec * 3.2 + w.phaseOffset) * 0.04;
          w.helpBadge.scale.set(0.82 * pulse, 0.34 * pulse, 1);
        }
      }

      if (officeRefs.bossReportBadge.visible) {
        officeRefs.bossReportBadge.position.y = 1.72 + Math.sin(sec * 2.8) * 0.045;
        const bossPulse = 1 + Math.sin(sec * 3.4) * 0.045;
        officeRefs.bossReportBadge.scale.set(0.92 * bossPulse, 0.38 * bossPulse, 1);
      }

      // Grounded Floor Target Rings gentle pulse
      (Object.keys(officeRefs.beacons) as WorkstationTargetId[]).forEach((key, idx) => {
        const b = officeRefs.beacons[key];
        if (!b.visible) return;
        const pulse = 1 + Math.sin(sec * 3.4 + idx) * 0.08;
        b.scale.set(pulse, 1, pulse);
      });

      // Wi-Fi Signal Rings animation compactly around AP dish when active
      if (simState.apConfigured) {
        officeRefs.wifiWaveRings.forEach((ring, idx) => {
          const t = (sec * 0.85 + idx * 0.33) % 1;
          ring.scale.setScalar(0.55 + t * 0.75);
          ring.position.y = 2.08 + t * 0.14;
          (ring.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.55;
        });
      }

      // Overhead Network Data Packets Animation
      for (const pkt of officeRefs.dataPackets) {
        const active =
          (pkt.channel === 'core' && (simState.rackChecked || simState.dhcpActive)) ||
          (pkt.channel === 'wired1' && simState.port1Connected) ||
          (pkt.channel === 'wired2' && simState.port2Connected) ||
          (pkt.channel === 'wifi' && simState.apConfigured);
        pkt.mesh.visible = active;
        if (active) {
          const t = (sec * pkt.speed + pkt.offset) % 1;
          pkt.curve.getPointAt(t, _pktPos);
          pkt.mesh.position.copy(_pktPos);
        }
      }

      // Hover & Completion Burst Rings
      if (hoverRing.visible) {
        const pulse = 1 + Math.sin(sec * 6) * 0.08;
        hoverRing.scale.setScalar(pulse);
      }
      if (burstAnim.active) {
        burstAnim.timer += dt;
        const t = Math.min(1, burstAnim.timer / 0.65);
        burstRing.scale.setScalar(1 + t * 2.2);
        burstRingMat.opacity = (1 - t) * 0.9;
        if (t >= 1) {
          burstAnim.active = false;
          burstRing.visible = false;
        }
      }

      // Multi-POV Camera Controller (with smooth close-up Zoom during Case Study or NPC inspection)
      const mode = angleRef.current;
      const activeZoomTarget = zoomTargetRef.current;
      if (focusedNpcId && npcDynamicPose[focusedNpcId]) {
        const pose = npcDynamicPose[focusedNpcId].zoomPose;
        techRig.group.visible = true;
        fpArmRig.root.visible = false;
        desiredCamPos.set(pose.camPos[0], pose.camPos[1], pose.camPos[2]);
        desiredLook.set(pose.lookAt[0], pose.lookAt[1], pose.lookAt[2]);
      } else if (activeZoomTarget) {
        const pose = STATION_ZOOM_POSE[activeZoomTarget];
        techRig.group.visible = true;
        fpArmRig.root.visible = false;
        desiredCamPos.set(pose.camPos[0], pose.camPos[1], pose.camPos[2]);
        desiredLook.set(pose.lookAt[0], pose.lookAt[1], pose.lookAt[2]);
      } else if (customizerOpenRef.current && mode !== 'overview') {
        // Showcase studio front-3/4 framing while customizing outfit & appearance
        techRig.group.visible = true;
        fpArmRig.root.visible = false;
        const previewAngle = playerState.facing + 0.34;
        const previewDist = 2.05;
        desiredCamPos.set(
          playerState.x + Math.sin(previewAngle) * previewDist,
          1.28,
          playerState.z + Math.cos(previewAngle) * previewDist
        );
        desiredLook.set(playerState.x + 0.28, 1.02, playerState.z);
      } else if (mode === 'first_person') {
        techRig.group.visible = false;
        fpArmRig.root.visible = true;
        const eyeY = activeSeat ? (activeSeat.isBeanbag ? 1.04 : 1.18) : 1.56;
        desiredCamPos.set(playerState.x, eyeY, playerState.z);
        const lookYaw = playerState.facing + cameraOrbit.yaw;
        desiredLook.set(
          playerState.x + Math.sin(lookYaw) * 2.2,
          (eyeY - 0.11) - (cameraOrbit.pitch - 0.2) * 1.4,
          playerState.z + Math.cos(lookYaw) * 2.2
        );
      } else if (mode === 'overview') {
        techRig.group.visible = true;
        fpArmRig.root.visible = false;
        const dist = 27.5 * cameraOrbit.zoom;
        desiredCamPos.set(
          9 + Math.sin(cameraOrbit.yaw) * dist * 0.65,
          14.5 * cameraOrbit.zoom,
          Math.cos(cameraOrbit.yaw) * dist * 0.85
        );
        desiredLook.set(9, 0.5, 0);
      } else {
        techRig.group.visible = true;
        fpArmRig.root.visible = false;
        const dist = (mode === 'follow_side' ? 3.4 : 3.0) * cameraOrbit.zoom;
        const baseCamH = activeSeat ? (activeSeat.isBeanbag ? 0.96 : 1.08) : (mode === 'follow_side' ? 1.16 : 1.24);
        const heightOffset = baseCamH + cameraOrbit.pitch * 1.85 * cameraOrbit.zoom;
        desiredCamPos.set(
          playerState.x + Math.sin(cameraOrbit.yaw) * dist,
          heightOffset,
          playerState.z + Math.cos(cameraOrbit.yaw) * dist
        );
        desiredLook.set(playerState.x, activeSeat ? 0.94 : 1.22, playerState.z);
      }

      const camLerp = focusedNpcId || activeZoomTarget ? Math.min(1, 6.5 * dt) : Math.min(1, 8.5 * dt);
      const lookLerp = focusedNpcId || activeZoomTarget ? Math.min(1, 7.5 * dt) : Math.min(1, 10 * dt);
      smoothCamPos.lerp(desiredCamPos, camLerp);
      smoothLook.lerp(desiredLook, lookLerp);
      camera.position.copy(smoothCamPos);
      camera.lookAt(smoothLook);

      if (noticeTimer > 0) {
        noticeTimer -= dt;
        if (noticeTimer <= 0) onNoticeRef.current(null);
      }

      const currentRoom = getRoomAtPos(playerState.x, playerState.z);
      if (currentRoom !== lastRoom) {
        lastRoom = currentRoom;
        pushStats();
      }

      // Smooth animation for all closed-room double doors (Server R.01, NOC R.02, Meeting R.05, Boss R.15)
      for (const d of ROOM_DOORS) {
        const targetAngle = simState.doorOpen[d.id] ? 1.46 : 0;
        doorAngles[d.id] = THREE.MathUtils.damp(doorAngles[d.id], targetAngle, 9, dt);
        const pivots = officeRefs.roomDoors[d.id];
        if (pivots) {
          pivots.leftPivot.rotation.y = doorAngles[d.id];
          pivots.rightPivot.rotation.y = -doorAngles[d.id];
        }
      }

      if (phaseRef.current === 'playing' && !modalPausedRef.current && !simState.victory) {
        const snapshot = buildStatsSnapshot('playing');
        let closestNpcId: OfficeNpcId | null = null;
        let closestScore = 2.65;
        for (const npc of OFFICE_NPC_LIST) {
          const pose = npcDynamicPose[npc.id];
          if (!pose || isBoundaryClosed(currentRoom, pose.room)) {
            continue;
          }
          const d = Math.hypot(
            playerState.x - pose.worldPos.x,
            playerState.z - pose.worldPos.z
          );
          if (d >= 2.5) continue;
          const answered = simState.consultedNpcs.includes(npc.id);
          const taskDone = isNpcTargetSolved(npc.targetId, snapshot);
          const score = answered || taskDone ? d + 0.65 : d;
          if (score < closestScore) {
            closestScore = score;
            closestNpcId = npc.id;
          }
        }
        if (closestNpcId !== lastNearbyNpcId) {
          lastNearbyNpcId = closestNpcId;
          onNearbyNpcRef.current(closestNpcId ? getNpcInfo(closestNpcId) : null);
        }

        // Detect nearest empty seat when standing near any chair, sofa, stool, or beanbag
        let closestSeat: OfficeSeatDef | null = null;
        if (!activeSeat) {
          let closestSeatDist = 1.45;
          for (const seat of OFFICE_SEATS) {
            if (isBoundaryClosed(currentRoom, seat.room)) continue;
            const dSeat = Math.hypot(playerState.x - seat.x, playerState.z - seat.z);
            const dApp = Math.hypot(playerState.x - seat.approachX, playerState.z - seat.approachZ);
            const d = Math.min(dSeat, dApp);
            if (d < closestSeatDist) {
              closestSeatDist = d;
              closestSeat = seat;
            }
          }
        }
        const nextNearbySeatId = closestSeat ? closestSeat.id : null;
        if (nextNearbySeatId !== lastNearbySeatId) {
          lastNearbySeatId = nextNearbySeatId;
          onNearbySeatRef.current(
            closestSeat ? { id: closestSeat.id, label: closestSeat.label, room: closestSeat.room } : null
          );
        }

        const nearDoor = getNearestDoor(2.35);
        const nextDoorKey = nearDoor
          ? `${nearDoor.id}:${simState.doorOpen[nearDoor.id] ? 1 : 0}`
          : '';
        if (nextDoorKey !== lastNearbyDoorKey) {
          lastNearbyDoorKey = nextDoorKey;
          onNearbyDoorRef.current(
            nearDoor
              ? {
                  id: nearDoor.id,
                  label: nearDoor.label,
                  open: simState.doorOpen[nearDoor.id],
                }
              : null
          );
        }

        hudSyncAccum += dt;
        if (hudSyncAccum >= 0.4) {
          hudSyncAccum = 0;
          pushStats('playing');
        }
      } else {
        if (lastNearbyNpcId !== null) {
          lastNearbyNpcId = null;
          onNearbyNpcRef.current(null);
        }
        if (lastNearbySeatId !== null) {
          lastNearbySeatId = null;
          onNearbySeatRef.current(null);
        }
        if (lastNearbyDoorKey !== '') {
          lastNearbyDoorKey = '';
          onNearbyDoorRef.current(null);
        }
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(() => {
          rafId = window.requestAnimationFrame(tick);
        });
      } else {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

      envTarget.dispose();
      pmrem.dispose();
      scene.traverse((obj) => {
        if ((obj as THREE.Sprite).isSprite) {
          const sprite = obj as THREE.Sprite;
          sprite.material.map?.dispose();
          sprite.material.dispose();
        }
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => {
            if (!m) return;
            const std = m as THREE.MeshStandardMaterial;
            if (std.map && !std.map.userData?.sharedFabric) {
              std.map.dispose();
            }
            std.emissiveMap?.dispose();
            m.dispose();
          });
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [controllerRef]);

  return (
    <div className="relative h-full w-full select-none">
      <div ref={mountRef} className="h-full w-full" />
      {webglError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#090d14] p-6 text-slate-100">
          <div className="max-w-md rounded-lg border border-slate-700 bg-[#0b1017] p-5 text-center shadow-xl">
            <h2 className="text-sm font-semibold text-white">Tampilan 3D Tidak Dapat Dimuat</h2>
            <p className="mt-1.5 text-xs text-slate-400">{webglError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
