import * as THREE from 'three';
import { WorkstationTargetId } from '../types/game';
import {
  createAcousticWallTexture,
  createDeskMatTexture,
  createDeskWoodTexture,
  createServerBladeTexture,
  drawLiveMonitorScreen,
  MonitorScreenState,
} from './proceduralTextures';

function tagInteractable(obj: THREE.Object3D, interactId: WorkstationTargetId) {
  obj.traverse((child) => {
    child.userData.interactId = interactId;
  });
}

function createRoomPlaqueTexture(code: string, title: string, maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 112;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0b1017';
  ctx.fillRect(0, 0, 512, 112);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 504, 104);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.fillText(code, 24, 42);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '600 30px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(title, 24, 84);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export interface ModernTechnicianRig {
  group: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  headGroup: THREE.Group;
  heldCableGroup: THREE.Group;
}

export function buildModernTechnician(): ModernTechnicianRig {
  const group = new THREE.Group();

  // Contact shadow disc
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.36, 20),
    new THREE.MeshBasicMaterial({ color: 0x030712, transparent: true, opacity: 0.45, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  group.add(shadow);

  const trouserMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.04 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x090d14, roughness: 0.65, metalness: 0.15 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.72, metalness: 0.05 });
  const jacketMat = new THREE.MeshStandardMaterial({ color: 0x263244, roughness: 0.62, metalness: 0.08 });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.45,
    roughness: 0.3,
  });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9a883, roughness: 0.65, metalness: 0.02 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.78 });

  // Articulated Legs (Realistic human proportions ~1.72m total height)
  const makeLeg = (x: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.78, 0);

    const legMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.078, 0.52, 6, 12), trouserMat);
    legMesh.position.y = -0.34;
    legMesh.castShadow = true;
    pivot.add(legMesh);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.24), bootMat);
    boot.position.set(0, -0.72, 0.04);
    boot.castShadow = true;
    pivot.add(boot);

    return pivot;
  };

  const leftLeg = makeLeg(-0.12);
  const rightLeg = makeLeg(0.12);
  group.add(leftLeg, rightLeg);

  // Torso + Tailored Tech Jacket + ID Lanyard
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.24), shirtMat);
  torso.position.y = 1.08;
  torso.castShadow = true;
  group.add(torso);

  const jacket = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.52, 0.26), jacketMat);
  jacket.position.set(0, 1.09, -0.005);
  jacket.castShadow = true;
  group.add(jacket);

  // Subtle ID lanyard & badge on chest
  const lanyard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.02), accentMat);
  lanyard.position.set(0.09, 1.12, 0.135);
  group.add(lanyard);

  // Articulated Arms
  const makeArm = (x: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 1.31, 0);

    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.056, 0.4, 6, 10), jacketMat);
    sleeve.position.y = -0.24;
    sleeve.castShadow = true;
    pivot.add(sleeve);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 10), skinMat);
    hand.position.y = -0.5;
    hand.castShadow = true;
    pivot.add(hand);

    return pivot;
  };

  const leftArm = makeArm(-0.29);
  const rightArm = makeArm(0.29);
  group.add(leftArm, rightArm);

  // Carried Cat6 Patch Cable on Right Hand
  const heldCableGroup = new THREE.Group();
  heldCableGroup.position.set(0, -0.5, 0.07);
  heldCableGroup.visible = false;

  const coil = new THREE.Mesh(
    new THREE.TorusGeometry(0.095, 0.016, 8, 20),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.42 })
  );
  coil.rotation.y = Math.PI / 2;
  heldCableGroup.add(coil);

  const plug = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.024, 0.042),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25 })
  );
  plug.position.set(0, 0.02, 0.09);
  heldCableGroup.add(plug);
  rightArm.add(heldCableGroup);

  // Realistic Head + Hair + Comms Headset
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.52, 0);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.1, 10), skinMat);
  neck.position.y = -0.11;
  headGroup.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 16), skinMat);
  head.scale.set(0.92, 1.06, 0.98);
  head.castShadow = true;
  headGroup.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.136, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
    hairMat
  );
  hair.position.set(0, 0.015, -0.01);
  hair.rotation.x = -0.22;
  hair.scale.set(0.95, 1.02, 1.02);
  headGroup.add(hair);

  // Slim technician earpiece
  const earpiece = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.025, 12), bootMat);
  earpiece.rotation.z = Math.PI / 2;
  earpiece.position.set(-0.128, -0.01, 0);
  headGroup.add(earpiece);

  const micBoom = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.09), accentMat);
  micBoom.position.set(-0.115, -0.035, 0.05);
  micBoom.rotation.y = 0.35;
  headGroup.add(micBoom);

  group.add(headGroup);

  return { group, leftLeg, rightLeg, leftArm, rightArm, headGroup, heldCableGroup };
}

export function buildMultiRoomOffice(maxAnisotropy: number): THREE.Group {
  const group = new THREE.Group();

  // Floor zones (Total: 14.4m wide x 7.6m deep)
  const floorBase = new THREE.Mesh(
    new THREE.PlaneGeometry(14.4, 7.6),
    new THREE.MeshStandardMaterial({ color: 0x0f141c, roughness: 0.88, metalness: 0.06 })
  );
  floorBase.rotation.x = -Math.PI / 2;
  floorBase.receiveShadow = true;
  group.add(floorBase);

  // Subtle floor zone markings per room
  const nocFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 7.2),
    new THREE.MeshStandardMaterial({ color: 0x111924, roughness: 0.8, metalness: 0.12 })
  );
  nocFloor.rotation.x = -Math.PI / 2;
  nocFloor.position.set(-4.7, 0.004, 0);
  nocFloor.receiveShadow = true;
  group.add(nocFloor);

  const clientFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 7.2),
    new THREE.MeshStandardMaterial({ color: 0x151c26, roughness: 0.82, metalness: 0.06 })
  );
  clientFloor.rotation.x = -Math.PI / 2;
  clientFloor.position.set(4.7, 0.004, 0);
  clientFloor.receiveShadow = true;
  group.add(clientFloor);

  // Outer perimeter walls (Back, Left, Right, low front architectural curb)
  const acousticMat = new THREE.MeshStandardMaterial({
    map: createAcousticWallTexture(maxAnisotropy),
    roughness: 0.88,
    metalness: 0.04,
  });
  const slateWallMat = new THREE.MeshStandardMaterial({
    color: 0x161e29,
    roughness: 0.85,
    metalness: 0.06,
  });

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(14.6, 3.0, 0.18), acousticMat);
  backWall.position.set(0, 1.5, -3.8);
  backWall.receiveShadow = true;
  group.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.0, 7.6), slateWallMat);
  leftWall.position.set(-7.2, 1.5, 0);
  leftWall.receiveShadow = true;
  group.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.0, 7.6), slateWallMat);
  rightWall.position.set(7.2, 1.5, 0);
  rightWall.receiveShadow = true;
  group.add(rightWall);

  // Low glass/aluminum front balustrade so 3rd-person camera never gets occluded
  const frontCurb = new THREE.Mesh(
    new THREE.BoxGeometry(14.4, 0.28, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.4 })
  );
  frontCurb.position.set(0, 0.14, 3.75);
  group.add(frontCurb);

  // Partition Walls with Glass Upper Section & 2.0m Open Doorway (z: 0.2 to 2.2)
  const partitionFrameMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.45,
    metalness: 0.65,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x94a3b8,
    roughness: 0.12,
    metalness: 0.05,
    transparent: true,
    opacity: 0.22,
  });

  const buildPartition = (xPos: number, code: string, title: string) => {
    const pGroup = new THREE.Group();
    pGroup.position.set(xPos, 0, 0);

    // Back segment (z: -3.7 to +0.1)
    const backSolid = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 3.8), slateWallMat);
    backSolid.position.set(0, 0.525, -1.8);
    backSolid.castShadow = true;
    backSolid.receiveShadow = true;
    pGroup.add(backSolid);

    const backGlass = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.65, 3.7), glassMat);
    backGlass.position.set(0, 1.88, -1.8);
    pGroup.add(backGlass);

    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 7.4), partitionFrameMat);
    topBeam.position.set(0, 2.82, 0);
    pGroup.add(topBeam);

    // Front segment (z: +2.3 to +3.7) leaving open doorway z = 0.1..2.3
    const frontSolid = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 1.4), slateWallMat);
    frontSolid.position.set(0, 0.525, 3.0);
    frontSolid.castShadow = true;
    pGroup.add(frontSolid);

    const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.65, 1.32), glassMat);
    frontGlass.position.set(0, 1.88, 3.0);
    pGroup.add(frontGlass);

    // Doorway vertical posts
    for (const pz of [0.1, 2.3]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.75, 0.08), partitionFrameMat);
      post.position.set(0, 1.375, pz);
      pGroup.add(post);
    }

    // Minimalist Room Plaque above doorway
    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(1.45, 0.32),
      new THREE.MeshBasicMaterial({
        map: createRoomPlaqueTexture(code, title, maxAnisotropy),
        side: THREE.DoubleSide,
      })
    );
    plaque.position.set(0, 2.52, 1.2);
    plaque.rotation.y = Math.PI / 2;
    pGroup.add(plaque);

    group.add(pGroup);
  };

  buildPartition(-2.2, 'ROOM 01', 'SERVER & NOC');
  buildPartition(2.2, 'ROOM 03', 'RUANG KLIEN');

  // Center room back wall plaque ("ROOM 02 · GUDANG KABEL")
  const centerPlaque = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 0.42),
    new THREE.MeshBasicMaterial({
      map: createRoomPlaqueTexture('ROOM 02', 'GUDANG KABEL & LAB', maxAnisotropy),
    })
  );
  centerPlaque.position.set(0, 2.35, -3.69);
  group.add(centerPlaque);

  // Subtle recessed architectural cove lighting along back wall
  for (const cx of [-4.6, 0, 4.6]) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.02, 0.02),
      new THREE.MeshStandardMaterial({
        color: 0xbae6fd,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.42,
      })
    );
    strip.position.set(cx, 2.7, -3.68);
    group.add(strip);
  }

  return group;
}

export function buildNocServerRackStation(maxAnisotropy: number): {
  group: THREE.Group;
  statusMat: THREE.MeshStandardMaterial;
  screenLight: THREE.PointLight;
} {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0b111b, roughness: 0.42, metalness: 0.72 });
  const bladeTex = createServerBladeTexture(maxAnisotropy);
  const bladeMat = new THREE.MeshStandardMaterial({
    map: bladeTex,
    roughness: 0.45,
    emissive: 0x0c4a6e,
    emissiveIntensity: 0.28,
  });

  for (const rx of [-0.46, 0.46]) {
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.82, 2.2, 0.8), bodyMat);
    chassis.position.set(rx, 1.1, 0);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    group.add(chassis);

    const blades = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.96), bladeMat);
    blades.position.set(rx, 1.1, 0.405);
    group.add(blades);
  }

  // Uplink Status Indicator Bar on Rack Header
  const statusMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.9,
  });
  const statusBar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.06), statusMat);
  statusBar.position.set(0, 2.15, 0.42);
  group.add(statusBar);

  const screenLight = new THREE.PointLight(0x38bdf8, 0.45, 3.5);
  screenLight.position.set(0, 1.6, 0.75);
  group.add(screenLight);

  tagInteractable(group, 'server_rack');
  return { group, statusMat, screenLight };
}

export function buildNocCliDeskStation(maxAnisotropy: number): {
  group: THREE.Group;
  updateScreen: (state: MonitorScreenState) => void;
} {
  const group = new THREE.Group();

  const deskTopMat = new THREE.MeshStandardMaterial({
    map: createDeskWoodTexture(maxAnisotropy),
    roughness: 0.62,
    metalness: 0.08,
  });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.78 });

  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.86), deskTopMat);
  deskTop.position.set(0, 0.75, 0);
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  group.add(deskTop);

  for (const lx of [-0.74, 0.74]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.73, 0.65), frameMat);
    leg.position.set(lx, 0.365, 0);
    leg.castShadow = true;
    group.add(leg);
  }

  const esdMat = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, 0.008, 0.46),
    new THREE.MeshStandardMaterial({ map: createDeskMatTexture(maxAnisotropy), roughness: 0.9 })
  );
  esdMat.position.set(0, 0.779, 0.08);
  group.add(esdMat);

  // Monitor + Live CLI Texture
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.32, 0.05), frameMat);
  stand.position.set(0, 0.92, -0.25);
  group.add(stand);

  const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.52, 0.03), frameMat);
  bezel.position.set(0, 1.15, -0.21);
  bezel.castShadow = true;
  group.add(bezel);

  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 1024;
  screenCanvas.height = 576;
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.anisotropy = maxAnisotropy;

  const screenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.88, 0.48),
    new THREE.MeshStandardMaterial({
      map: screenTexture,
      emissiveMap: screenTexture,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.65,
      roughness: 0.2,
    })
  );
  screenMesh.position.set(0, 1.15, -0.193);
  group.add(screenMesh);

  // Mechanical Keyboard
  const kb = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.025, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.5 })
  );
  kb.position.set(0, 0.79, 0.14);
  group.add(kb);

  // Ergonomic Chair tucked in front of desk
  const chairSeat = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.07, 0.46),
    new THREE.MeshStandardMaterial({ color: 0x161d29, roughness: 0.75 })
  );
  chairSeat.position.set(0, 0.46, 0.62);
  group.add(chairSeat);

  const chairBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.54, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x161d29, roughness: 0.75 })
  );
  chairBack.position.set(0, 0.78, 0.84);
  group.add(chairBack);

  const chairStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.22, 0.42, 12), frameMat);
  chairStem.position.set(0, 0.22, 0.62);
  group.add(chairStem);

  tagInteractable(group, 'cli_monitor');

  return {
    group,
    updateScreen: (state: MonitorScreenState) => {
      drawLiveMonitorScreen(screenCanvas, state);
      screenTexture.needsUpdate = true;
    },
  };
}

export function buildStorageUtpRackStation(): THREE.Group {
  const group = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.78 });
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0x263244, roughness: 0.6, metalness: 0.25 });
  const spoolMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.42, metalness: 0.1 });
  const flangeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.55 });

  // 4 corner uprights + 3 shelves
  for (const sx of [-0.65, 0.65]) {
    for (const sz of [-0.32, 0.32]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.85, 0.05), steelMat);
      post.position.set(sx, 0.925, sz);
      post.castShadow = true;
      group.add(post);
    }
  }

  for (const sy of [0.35, 0.95, 1.55]) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.04, 0.7), shelfMat);
    shelf.position.set(0, sy, 0);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    group.add(shelf);
  }

  // Cat6 UTP Spools on middle & bottom shelves
  for (const sx of [-0.34, 0.04, 0.38]) {
    const bot = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 20), flangeMat);
    bot.position.set(sx, 0.98, 0);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 20), flangeMat);
    top.position.set(sx, 1.18, 0);
    const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.18, 20), spoolMat);
    coil.position.set(sx, 1.08, 0);
    coil.castShadow = true;
    group.add(bot, top, coil);
  }

  tagInteractable(group, 'utp_spool');
  return group;
}

export function buildStorageCrimpingBench(maxAnisotropy: number): THREE.Group {
  const group = new THREE.Group();
  const topMat = new THREE.MeshStandardMaterial({
    map: createDeskWoodTexture(maxAnisotropy),
    roughness: 0.6,
    metalness: 0.08,
  });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45, metalness: 0.75 });

  const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.78), topMat);
  top.position.y = 0.76;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  for (const lx of [-0.66, 0.66]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.74, 0.62), legMat);
    leg.position.set(lx, 0.37, 0);
    group.add(leg);
  }

  // Crimping pliers & LAN tester
  const pliers = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.025, 0.09),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.45 })
  );
  pliers.position.set(-0.22, 0.8, 0.12);
  pliers.rotation.y = 0.35;
  group.add(pliers);

  const tester = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.035, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x334155, emissive: 0x10b981, emissiveIntensity: 0.35 })
  );
  tester.position.set(0.18, 0.8, 0.08);
  group.add(tester);

  tagInteractable(group, 'crimper_tool');
  return group;
}

export interface ClientWorkstationRig {
  group: THREE.Group;
  pc1ScreenMat: THREE.MeshStandardMaterial;
  pc2ScreenMat: THREE.MeshStandardMaterial;
  pc1LedMat: THREE.MeshStandardMaterial;
  pc2LedMat: THREE.MeshStandardMaterial;
  pc1Cable: THREE.Mesh;
  pc2Cable: THREE.Mesh;
}

export function buildClientWorkstationTable(maxAnisotropy: number): ClientWorkstationRig {
  const group = new THREE.Group();

  const deskMat = new THREE.MeshStandardMaterial({
    map: createDeskWoodTexture(maxAnisotropy),
    roughness: 0.62,
    metalness: 0.08,
  });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45, metalness: 0.75 });
  const chassisMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.38, metalness: 0.68 });

  // Conference / Client Workstation Desk (2.6m long)
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.05, 3.0), deskMat);
  top.position.set(0, 0.75, 0);
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  for (const lz of [-1.3, 1.3]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.73, 0.06), legMat);
    leg.position.set(0, 0.365, lz);
    leg.castShadow = true;
    group.add(leg);
  }

  // Distribution Switch Hub in center of table
  const hub = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.42), legMat);
  hub.position.set(0.22, 0.8, 0);
  hub.castShadow = true;
  group.add(hub);

  const pc1LedMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.9,
  });
  const pc2LedMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.9,
  });

  const led1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.015, 0.04), pc1LedMat);
  led1.position.set(0.11, 0.81, -0.1);
  const led2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.015, 0.04), pc2LedMat);
  led2.position.set(0.11, 0.81, 0.1);
  group.add(led1, led2);

  // Two Client Workstations (PC-01 at z = -0.92, PC-02 at z = +0.92)
  const makeClientPC = (zPos: number, id: WorkstationTargetId) => {
    const pcGroup = new THREE.Group();
    pcGroup.position.set(-0.08, 0.775, zPos);

    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.05), legMat);
    stand.position.set(0.12, 0.12, 0);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.38, 0.62), chassisMat);
    frame.position.set(0.1, 0.3, 0);
    frame.castShadow = true;

    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0xef4444,
      emissiveIntensity: 0.45,
      roughness: 0.2,
    });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.34), screenMat);
    screen.rotation.y = -Math.PI / 2;
    screen.position.set(0.082, 0.3, 0);

    const kb = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.36), legMat);
    kb.position.set(-0.14, 0.01, 0);

    // Generous hitbox for easy clicking
    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.75, 0.85),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.set(0, 0.3, 0);

    pcGroup.add(stand, frame, screen, kb, hitbox);
    tagInteractable(pcGroup, id);
    group.add(pcGroup);

    // Ergonomic chair next to workstation
    const chair = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.42), chassisMat);
    chair.position.set(-0.76, 0.46, zPos);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.2, 0.42, 10), legMat);
    stem.position.set(-0.76, 0.22, zPos);
    group.add(chair, stem);

    return screenMat;
  };

  const pc1ScreenMat = makeClientPC(-0.92, 'client_pc_1');
  const pc2ScreenMat = makeClientPC(0.92, 'client_pc_2');

  // Physical Cat6 patch cords between hub and PC-01 / PC-02
  const makeCable = (zEnd: number) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.22, 0.79, zEnd > 0 ? 0.12 : -0.12),
      new THREE.Vector3(0.32, 0.79, zEnd * 0.45),
      new THREE.Vector3(0.16, 0.79, zEnd * 0.85),
      new THREE.Vector3(0.02, 0.8, zEnd),
    ]);
    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 18, 0.012, 8, false),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.42 })
    );
    mesh.visible = false;
    group.add(mesh);
    return mesh;
  };

  const pc1Cable = makeCable(-0.92);
  const pc2Cable = makeCable(0.92);

  return {
    group,
    pc1ScreenMat,
    pc2ScreenMat,
    pc1LedMat,
    pc2LedMat,
    pc1Cable,
    pc2Cable,
  };
}

export function buildFloorMessyAndTidiedCables(): {
  messyGroup: THREE.Group;
  tidiedGroup: THREE.Group;
} {
  const messyGroup = new THREE.Group();
  const tidiedGroup = new THREE.Group();
  tidiedGroup.visible = false;

  const colors = [0xf59e0b, 0x0284c7, 0x64748b];
  const paths = [
    [
      new THREE.Vector3(-0.7, 0.02, -0.45),
      new THREE.Vector3(-0.2, 0.04, 0.18),
      new THREE.Vector3(0.35, 0.02, -0.25),
      new THREE.Vector3(0.75, 0.02, 0.35),
    ],
    [
      new THREE.Vector3(-0.65, 0.02, 0.4),
      new THREE.Vector3(-0.1, 0.045, -0.22),
      new THREE.Vector3(0.45, 0.02, 0.28),
      new THREE.Vector3(0.8, 0.02, -0.15),
    ],
    [
      new THREE.Vector3(-0.4, 0.02, -0.1),
      new THREE.Vector3(0.15, 0.035, 0.42),
      new THREE.Vector3(0.55, 0.02, -0.38),
    ],
  ];

  paths.forEach((pts, idx) => {
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 24, 0.018, 8, false),
      new THREE.MeshStandardMaterial({ color: colors[idx], roughness: 0.5 })
    );
    tube.castShadow = true;
    messyGroup.add(tube);
  });

  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.25, 1.2),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitbox.position.y = 0.1;
  messyGroup.add(hitbox);
  tagInteractable(messyGroup, 'messy_cables');

  // Neatly enclosed aluminum floor cable bridge tray
  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.035, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.7 })
  );
  tray.position.set(0, 0.018, 0.38);
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(1.48, 0.038, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
  );
  stripe.position.set(0, 0.019, 0.38);
  tidiedGroup.add(tray, stripe);

  return { messyGroup, tidiedGroup };
}
