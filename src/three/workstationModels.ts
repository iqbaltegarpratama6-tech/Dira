import * as THREE from 'three';
import { WorkstationTargetId } from '../types/game';
import { drawLiveMonitorScreen, MonitorScreenState } from './proceduralTextures';

function tagInteractable(obj: THREE.Object3D, interactId: WorkstationTargetId) {
  obj.traverse((child) => {
    child.userData.interactId = interactId;
  });
}

export interface FirstPersonArmRig {
  root: THREE.Group;
  handPivot: THREE.Group;
  fingers: THREE.Mesh[];
  heldCableGroup: THREE.Group;
  updateAppearance: (sleeveHex: number, cuffHex: number, skinHex: number) => void;
}

export function buildFirstPersonArmRig(): FirstPersonArmRig {
  const root = new THREE.Group();
  const handPivot = new THREE.Group();
  root.add(handPivot);

  const sleeveMat = new THREE.MeshStandardMaterial({
    color: 0x0f3b66,
    roughness: 0.68,
    metalness: 0.06,
  });
  const cuffMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.45,
    metalness: 0.15,
  });
  const watchSteelMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.25,
    metalness: 0.88,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf5c8a0,
    roughness: 0.65,
    metalness: 0.02,
  });

  // Forearm angled naturally from bottom-right toward center desk
  const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.28, 8, 16), sleeveMat);
  forearm.position.set(0.06, -0.09, 0.16);
  forearm.rotation.set(Math.PI / 2 - 0.32, 0.18, 0);
  handPivot.add(forearm);

  // Soft tailored sleeve hem + subtle cuff edge
  const cuffHem = new THREE.Mesh(new THREE.TorusGeometry(0.043, 0.007, 8, 18), sleeveMat);
  cuffHem.position.set(0.032, -0.042, 0.065);
  cuffHem.rotation.set(-0.32, 0.18, 0);
  handPivot.add(cuffHem);

  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.039, 0.041, 0.018, 16), cuffMat);
  cuff.position.set(0.027, -0.036, 0.055);
  cuff.rotation.set(Math.PI / 2 - 0.32, 0.18, 0);
  handPivot.add(cuff);

  // Minimalist wristwatch
  const watchBand = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.0048, 8, 18), watchSteelMat);
  watchBand.position.set(0.018, -0.022, 0.032);
  watchBand.rotation.set(-0.32, 0.18, 0);
  handPivot.add(watchBand);

  const watchDial = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.006, 16), watchSteelMat);
  watchDial.position.set(0.008, 0.015, 0.028);
  watchDial.rotation.set(0.1, 0, 0.35);
  handPivot.add(watchDial);

  // Smooth wrist & anatomical palm
  const wrist = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.032, 8, 14), skinMat);
  wrist.scale.set(0.95, 0.72, 1.0);
  wrist.position.set(0.012, -0.015, 0.01);
  wrist.rotation.set(Math.PI / 2 - 0.25, 0.15, 0);
  handPivot.add(wrist);

  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.036, 16, 14), skinMat);
  palm.scale.set(0.96, 0.36, 1.24);
  palm.position.set(0, 0, -0.044);
  palm.rotation.set(-0.08, 0.12, 0.1);
  handPivot.add(palm);

  const thenarPad = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), skinMat);
  thenarPad.scale.set(0.85, 0.55, 1.2);
  thenarPad.position.set(-0.024, -0.004, -0.036);
  handPivot.add(thenarPad);

  // Articulated 2-segment opposable thumb + 4 naturally curled fingers with knuckle pads
  const fingers: THREE.Mesh[] = [];
  const thumbRoot = new THREE.Group();
  thumbRoot.position.set(-0.032, 0.002, -0.036);
  thumbRoot.rotation.set(Math.PI / 2 - 0.26, -0.48, 0.25);

  const thumbSeg1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.0098, 0.022, 6, 10), skinMat);
  thumbSeg1.position.y = -0.014;
  thumbRoot.add(thumbSeg1);
  fingers.push(thumbSeg1);

  const thumbTip = new THREE.Mesh(new THREE.CapsuleGeometry(0.0082, 0.017, 6, 10), skinMat);
  thumbTip.position.set(0.004, -0.034, -0.003);
  thumbTip.rotation.z = 0.28;
  thumbRoot.add(thumbTip);
  handPivot.add(thumbRoot);

  const fpFingerConfigs = [
    { x: -0.023, z: -0.078, r: 0.0076, l1: 0.028, l2: 0.022, curl1: 0.16, curl2: 0.28 },
    { x: -0.0075, z: -0.082, r: 0.008, l1: 0.032, l2: 0.024, curl1: 0.2, curl2: 0.34 },
    { x: 0.0085, z: -0.079, r: 0.0075, l1: 0.029, l2: 0.022, curl1: 0.26, curl2: 0.42 },
    { x: 0.0235, z: -0.072, r: 0.0066, l1: 0.022, l2: 0.017, curl1: 0.34, curl2: 0.5 },
  ];

  fpFingerConfigs.forEach((cfg) => {
    const knucklePivot = new THREE.Group();
    knucklePivot.position.set(cfg.x, 0.004, cfg.z);
    knucklePivot.rotation.set(Math.PI / 2 + cfg.curl1, 0.08, 0);

    const knucklePad = new THREE.Mesh(new THREE.SphereGeometry(cfg.r * 1.05, 8, 8), skinMat);
    knucklePivot.add(knucklePad);

    const seg1 = new THREE.Mesh(new THREE.CapsuleGeometry(cfg.r, cfg.l1, 6, 10), skinMat);
    seg1.position.y = -(cfg.l1 * 0.55);
    knucklePivot.add(seg1);
    fingers.push(seg1);

    const midJoint = new THREE.Group();
    midJoint.position.set(0, -(cfg.l1 + cfg.r * 0.45), 0);
    midJoint.rotation.x = cfg.curl2;

    const seg2 = new THREE.Mesh(new THREE.CapsuleGeometry(cfg.r * 0.86, cfg.l2, 6, 10), skinMat);
    seg2.position.y = -(cfg.l2 * 0.55);
    midJoint.add(seg2);

    knucklePivot.add(midJoint);
    handPivot.add(knucklePivot);
  });

  // Held Cat6 RJ45 patch plug + short trailing cable
  const heldCableGroup = new THREE.Group();
  heldCableGroup.position.set(-0.024, 0.004, -0.125);
  heldCableGroup.visible = false;

  const rj45Mat = new THREE.MeshPhysicalMaterial({
    color: 0xe2e8f0,
    roughness: 0.18,
    metalness: 0.05,
    transmission: 0.45,
    transparent: true,
    opacity: 0.9,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.45,
    metalness: 0.08,
  });
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.25,
    metalness: 0.9,
  });

  const plugHead = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.016, 0.028), rj45Mat);
  plugHead.position.set(0, 0, -0.012);
  heldCableGroup.add(plugHead);

  const pins = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.004, 0.01), copperMat);
  pins.position.set(0, 0.006, -0.02);
  heldCableGroup.add(pins);

  const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.007, 0.022, 10), bootMat);
  boot.rotation.x = Math.PI / 2;
  boot.position.set(0, 0, 0.012);
  heldCableGroup.add(boot);

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0.022),
    new THREE.Vector3(-0.01, -0.02, 0.065),
    new THREE.Vector3(-0.025, -0.06, 0.11),
    new THREE.Vector3(-0.01, -0.13, 0.14),
  ]);
  const cableTube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 14, 0.0048, 8, false),
    bootMat
  );
  heldCableGroup.add(cableTube);

  handPivot.add(heldCableGroup);

  return {
    root,
    handPivot,
    fingers,
    heldCableGroup,
    updateAppearance: (sleeveHex: number, cuffHex: number, skinHex: number) => {
      sleeveMat.color.setHex(sleeveHex);
      cuffMat.color.setHex(cuffHex);
      skinMat.color.setHex(skinHex);
    },
  };
}

export interface WorkstationMonitorRig {
  group: THREE.Group;
  screenCanvas: HTMLCanvasElement;
  screenTexture: THREE.CanvasTexture;
  screenMesh: THREE.Mesh;
  updateScreen: (state: MonitorScreenState) => void;
  lightBarMat: THREE.MeshStandardMaterial;
}

export function buildWorkstationMonitor(maxAnisotropy: number): WorkstationMonitorRig {
  const group = new THREE.Group();

  const aluminumMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.34,
    metalness: 0.82,
  });
  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.42,
    metalness: 0.25,
  });

  // Base plate + vertical column + bracket
  const basePlate = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.012, 0.2), aluminumMat);
  basePlate.position.set(0, 0.006, 0);
  basePlate.castShadow = true;
  basePlate.receiveShadow = true;
  group.add(basePlate);

  const column = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.32, 0.032), aluminumMat);
  column.position.set(0, 0.16, -0.055);
  column.rotation.x = 0.05;
  column.castShadow = true;
  group.add(column);

  // 27" Panel housing
  const panelFrame = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.43, 0.022), bezelMat);
  panelFrame.position.set(0, 0.35, -0.01);
  panelFrame.castShadow = true;
  group.add(panelFrame);

  // Dynamic CLI CanvasTexture
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 1024;
  screenCanvas.height = 576;

  const initialState: MonitorScreenState = {
    port1Connected: false,
    port2Connected: false,
    cablesTidied: false,
    dhcpActive: false,
    vlan10Active: false,
    hasCableInHand: false,
    phase: 'ready',
    victory: false,
  };
  drawLiveMonitorScreen(screenCanvas, initialState);

  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.anisotropy = maxAnisotropy;

  const screenMat = new THREE.MeshStandardMaterial({
    map: screenTexture,
    emissiveMap: screenTexture,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.65,
    roughness: 0.18,
    metalness: 0.05,
  });

  const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.735, 0.405), screenMat);
  screenMesh.position.set(0, 0.35, 0.002);
  group.add(screenMesh);

  // Subtle Monitor Light Bar on top bezel
  const barHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.48, 12), aluminumMat);
  barHousing.rotation.z = Math.PI / 2;
  barHousing.position.set(0, 0.578, 0.015);
  group.add(barHousing);

  const lightBarMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xfde68a,
    emissiveIntensity: 0.9,
    roughness: 0.3,
  });
  const diffuser = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.014), lightBarMat);
  diffuser.position.set(0, 0.566, 0.02);
  diffuser.rotation.x = Math.PI / 2 + 0.35;
  group.add(diffuser);

  tagInteractable(panelFrame, 'cli_monitor');
  tagInteractable(screenMesh, 'cli_monitor');

  return {
    group,
    screenCanvas,
    screenTexture,
    screenMesh,
    lightBarMat,
    updateScreen: (state: MonitorScreenState) => {
      drawLiveMonitorScreen(screenCanvas, state);
      screenTexture.needsUpdate = true;
    },
  };
}

export interface ManagedSwitchRig {
  group: THREE.Group;
  port1LedMat: THREE.MeshStandardMaterial;
  port2LedMat: THREE.MeshStandardMaterial;
  port1Cable: THREE.Mesh;
  port2Cable: THREE.Mesh;
  port1HighlightMat: THREE.MeshStandardMaterial;
  port2HighlightMat: THREE.MeshStandardMaterial;
}

export function buildManagedDeskSwitch(): ManagedSwitchRig {
  const group = new THREE.Group();

  const riserMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.45,
    metalness: 0.72,
  });
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.36,
    metalness: 0.78,
  });
  const faceMat = new THREE.MeshStandardMaterial({
    color: 0x182232,
    roughness: 0.42,
    metalness: 0.65,
  });

  // Angled riser shelf
  const riser = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.045, 0.24), riserMat);
  riser.position.set(0, 0.0225, 0);
  riser.castShadow = true;
  riser.receiveShadow = true;
  group.add(riser);

  // Switch body (1U compact managed switch)
  const switchBody = new THREE.Group();
  switchBody.position.set(0, 0.072, 0);
  switchBody.rotation.x = 0.14; // Tilted slightly upward toward seated technician
  group.add(switchBody);

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.056, 0.19), chassisMat);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  switchBody.add(chassis);

  const faceplate = new THREE.Mesh(new THREE.BoxGeometry(0.378, 0.048, 0.008), faceMat);
  faceplate.position.set(0, 0, 0.095);
  switchBody.add(faceplate);

  // Status power LED on left
  const pwrLed = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.006, 0.004),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.1,
    })
  );
  pwrLed.position.set(-0.16, 0.01, 0.099);
  switchBody.add(pwrLed);

  const port1LedMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.9,
  });
  const port2LedMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.9,
  });

  const port1HighlightMat = new THREE.MeshStandardMaterial({
    color: 0x05080f,
    emissive: 0x0284c7,
    emissiveIntensity: 0.22,
    roughness: 0.5,
  });
  const port2HighlightMat = new THREE.MeshStandardMaterial({
    color: 0x05080f,
    emissive: 0x0284c7,
    emissiveIntensity: 0.22,
    roughness: 0.5,
  });

  const socketVoidMat = new THREE.MeshStandardMaterial({ color: 0x030712, roughness: 0.8 });
  const inactiveLedMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });

  // 8 RJ45 Ports across front face; Port 1 & Port 2 are primary interactive targets
  for (let i = 0; i < 8; i++) {
    const px = -0.105 + i * 0.036;
    const isTarget1 = i === 0;
    const isTarget2 = i === 1;

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 0.024, 0.01),
      isTarget1 ? port1HighlightMat : isTarget2 ? port2HighlightMat : socketVoidMat
    );
    frame.position.set(px, -0.004, 0.098);
    switchBody.add(frame);

    const cavity = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.016, 0.008), socketVoidMat);
    cavity.position.set(px, -0.004, 0.101);
    switchBody.add(cavity);

    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.005, 0.004),
      isTarget1 ? port1LedMat : isTarget2 ? port2LedMat : inactiveLedMat
    );
    led.position.set(px, 0.014, 0.1);
    switchBody.add(led);

    if (isTarget1 || isTarget2) {
      // Generous invisible raycast hitbox for effortless clicking
      const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.036, 0.05, 0.045),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitbox.position.set(px, 0, 0.108);
      hitbox.userData.interactId = isTarget1 ? 'lan_port_1' : 'lan_port_2';
      switchBody.add(hitbox);
      frame.userData.interactId = isTarget1 ? 'lan_port_1' : 'lan_port_2';
      cavity.userData.interactId = isTarget1 ? 'lan_port_1' : 'lan_port_2';
    }
  }

  // Physical Cat6 patch cords that appear when Port 1 / Port 2 are connected
  const makePatchCord = (portX: number, archX: number, colorHex: number) => {
    const cordGroup = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(portX, -0.004, 0.105),
      new THREE.Vector3(portX, -0.006, 0.155),
      new THREE.Vector3(archX, -0.048, 0.185),
      new THREE.Vector3(archX + 0.04, -0.068, 0.04),
      new THREE.Vector3(archX + 0.06, -0.068, -0.14),
    ]);
    const cordMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.48,
      metalness: 0.08,
    });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.0048, 8, false), cordMat);
    tube.castShadow = true;
    tube.visible = false;
    switchBody.add(tube);

    // Plug connector attached near port
    const plug = new THREE.Mesh(
      new THREE.BoxGeometry(0.017, 0.014, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25 })
    );
    plug.position.set(portX, -0.004, 0.108);
    tube.add(plug);

    void cordGroup;
    return tube;
  };

  const port1Cable = makePatchCord(-0.105, -0.13, 0x0284c7);
  const port2Cable = makePatchCord(-0.069, -0.08, 0x0d9488);

  return {
    group,
    port1LedMat,
    port2LedMat,
    port1Cable,
    port2Cable,
    port1HighlightMat,
    port2HighlightMat,
  };
}

export function buildUtpCableSpool(): THREE.Group {
  const group = new THREE.Group();

  const flangeMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.55,
    metalness: 0.28,
  });
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.45,
    metalness: 0.08,
  });

  const bottomFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.012, 24), flangeMat);
  bottomFlange.position.y = 0.006;
  bottomFlange.castShadow = true;
  bottomFlange.receiveShadow = true;
  group.add(bottomFlange);

  const topFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.012, 24), flangeMat);
  topFlange.position.y = 0.125;
  topFlange.castShadow = true;
  group.add(topFlange);

  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.084, 0.084, 0.108, 22), cableMat);
  core.position.y = 0.066;
  core.castShadow = true;
  group.add(core);

  // Stacked coiled torus rings for tactile UTP look
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.086, 0.01, 8, 24), cableMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.025 + i * 0.02;
    group.add(ring);
  }

  // Loose tail with RJ45 head resting next to spool
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.08, 0.02, 0.03),
    new THREE.Vector3(0.125, 0.008, 0.08),
    new THREE.Vector3(0.15, 0.006, 0.13),
  ]);
  const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 12, 0.0046, 8, false), cableMat);
  tail.castShadow = true;
  group.add(tail);

  const rjHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.012, 0.024),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25 })
  );
  rjHead.position.set(0.155, 0.008, 0.14);
  rjHead.rotation.y = 0.35;
  group.add(rjHead);

  tagInteractable(group, 'utp_spool');
  return group;
}

export function buildMessyAndTidiedCables(): {
  messyGroup: THREE.Group;
  tidiedGroup: THREE.Group;
} {
  const messyGroup = new THREE.Group();
  const tidiedGroup = new THREE.Group();
  tidiedGroup.visible = false;

  const cableColors = [0x475569, 0x0284c7, 0x64748b];

  const messyPaths = [
    [
      new THREE.Vector3(-0.32, 0.007, 0.18),
      new THREE.Vector3(-0.22, 0.015, 0.24),
      new THREE.Vector3(-0.12, 0.009, 0.15),
      new THREE.Vector3(-0.26, 0.012, 0.08),
      new THREE.Vector3(-0.18, 0.007, 0.28),
    ],
    [
      new THREE.Vector3(-0.36, 0.007, 0.26),
      new THREE.Vector3(-0.25, 0.018, 0.19),
      new THREE.Vector3(-0.14, 0.008, 0.26),
      new THREE.Vector3(-0.08, 0.007, 0.19),
    ],
    [
      new THREE.Vector3(-0.28, 0.007, 0.11),
      new THREE.Vector3(-0.19, 0.014, 0.28),
      new THREE.Vector3(-0.29, 0.008, 0.22),
    ],
  ];

  messyPaths.forEach((pts, idx) => {
    const curve = new THREE.CatmullRomCurve3(pts);
    const mat = new THREE.MeshStandardMaterial({
      color: cableColors[idx % cableColors.length],
      roughness: 0.52,
      metalness: 0.06,
    });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.005, 8, false), mat);
    tube.castShadow = true;
    messyGroup.add(tube);
  });

  // Hitbox covering the tangled desk cables for crisp click interaction
  const hitBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.055, 0.26),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitBox.position.set(-0.22, 0.02, 0.19);
  messyGroup.add(hitBox);
  tagInteractable(messyGroup, 'messy_cables');

  // Neatly bundled parallel cables tucked along rear channel
  for (let i = 0; i < 3; i++) {
    const zOff = -0.14 - i * 0.012;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.46, 0.006, 0.04 + i * 0.015),
      new THREE.Vector3(-0.32, 0.006, zOff),
      new THREE.Vector3(0.05, 0.006, zOff),
      new THREE.Vector3(0.32, 0.006, zOff),
    ]);
    const mat = new THREE.MeshStandardMaterial({
      color: cableColors[i],
      roughness: 0.45,
      metalness: 0.1,
    });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 22, 0.0046, 8, false), mat);
    tube.castShadow = true;
    tidiedGroup.add(tube);
  }

  // Velcro cable wrap strap
  const velcro = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, 0.014, 0.045),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85 })
  );
  velcro.position.set(-0.12, 0.008, -0.152);
  tidiedGroup.add(velcro);

  return { messyGroup, tidiedGroup };
}

export function buildDeskPeripherals(): THREE.Group {
  const group = new THREE.Group();

  const kbFrameMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.35,
    metalness: 0.68,
  });
  const keycapMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.6,
    metalness: 0.05,
  });
  const accentKeyMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.5,
    metalness: 0.1,
  });

  // 75% Mechanical Keyboard centered below monitor
  const kbGroup = new THREE.Group();
  kbGroup.position.set(-0.02, 0.012, 0.16);
  kbGroup.rotation.x = 0.06;

  const kbCase = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.018, 0.135), kbFrameMat);
  kbCase.castShadow = true;
  kbCase.receiveShadow = true;
  kbGroup.add(kbCase);

  // Key rows
  for (let row = 0; row < 5; row++) {
    const rz = -0.048 + row * 0.024;
    const cols = row === 4 ? 8 : 13;
    for (let col = 0; col < cols; col++) {
      const isSpace = row === 4 && col === 3;
      const w = isSpace ? 0.11 : 0.02;
      const rx = isSpace
        ? -0.015
        : row === 4
          ? -0.145 + (col > 3 ? col * 0.028 + 0.075 : col * 0.026)
          : -0.15 + col * 0.025;
      const isEnter = row === 2 && col === 12;
      const isEsc = row === 0 && col === 0;
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.009, 0.018),
        isEnter || isEsc ? accentKeyMat : keycapMat
      );
      cap.position.set(rx, 0.013, rz);
      kbGroup.add(cap);
    }
  }
  tagInteractable(kbGroup, 'cli_monitor'); // Clicking keyboard also opens CLI
  group.add(kbGroup);

  // Wireless Mouse on right side
  const mouse = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.028, 0.046, 8, 14),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.2 })
  );
  mouse.rotation.x = Math.PI / 2;
  mouse.scale.set(1.05, 1, 0.62);
  mouse.position.set(0.24, 0.016, 0.17);
  mouse.castShadow = true;
  group.add(mouse);

  // Matte black insulated coffee tumbler on far right
  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.032, 0.105, 20),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.55, metalness: 0.35 })
  );
  mug.position.set(0.56, 0.053, 0.05);
  mug.castShadow = true;
  group.add(mug);

  const mugRim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.037, 0.037, 0.01, 20),
    kbFrameMat
  );
  mugRim.position.set(0.56, 0.106, 0.05);
  group.add(mugRim);

  return group;
}

export function buildCrimperTool(): THREE.Group {
  const group = new THREE.Group();

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.32,
    metalness: 0.85,
  });
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.72,
    metalness: 0.05,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.45,
  });

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.016, 0.055), steelMat);
  head.position.set(0, 0.008, -0.03);
  head.castShadow = true;
  group.add(head);

  const handleL = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.014, 0.1), handleMat);
  handleL.position.set(-0.016, 0.008, 0.04);
  handleL.rotation.y = -0.18;
  group.add(handleL);

  const handleR = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.014, 0.1), accentMat);
  handleR.position.set(0.016, 0.008, 0.04);
  handleR.rotation.y = 0.18;
  group.add(handleR);

  tagInteractable(group, 'crimper_tool');
  return group;
}
