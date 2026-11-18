import * as THREE from 'three';
import { GenderOption, PLAYER_THEMES, PlayerSlot } from '../types/game';
import {
  createContactShadowTexture,
  createHoloScreenTexture,
  createServerBladeTexture,
  createStatusSpriteTexture,
} from './proceduralTextures';

const sharedShadowGeo = new THREE.PlaneGeometry(1.1, 1.1);
let sharedShadowMat: THREE.MeshBasicMaterial | null = null;

function getContactShadow(): THREE.Mesh {
  if (!sharedShadowMat) {
    sharedShadowMat = new THREE.MeshBasicMaterial({
      map: createContactShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.7,
    });
  }
  const mesh = new THREE.Mesh(sharedShadowGeo, sharedShadowMat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.025;
  return mesh;
}

export interface TechnicianRig {
  group: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  headGroup: THREE.Group;
  heldSlot: THREE.Group;
  stunStars: THREE.Group;
}

export function buildTechnicianCharacter(
  gender: GenderOption,
  slot: PlayerSlot
): TechnicianRig {
  const theme = PLAYER_THEMES[slot];
  const group = new THREE.Group();
  group.add(getContactShadow());

  const matBoot = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.78, metalness: 0.12 });
  const matPants = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.05 });
  const matShirt = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65, metalness: 0.05 });
  const matVest = new THREE.MeshStandardMaterial({
    color: theme.threeHex,
    roughness: 0.42,
    metalness: 0.18,
  });
  const matNeonTrim = new THREE.MeshStandardMaterial({
    color: theme.accentHex,
    emissive: theme.threeHex,
    emissiveIntensity: 0.85,
    roughness: 0.25,
    metalness: 0.3,
  });
  const matSkin = new THREE.MeshStandardMaterial({
    color: gender === 'female' ? 0xf1c29b : 0xe5b186,
    roughness: 0.68,
    metalness: 0.02,
  });
  const matHair = new THREE.MeshStandardMaterial({
    color: gender === 'female' ? 0x1e1b2e : 0x18181b,
    roughness: 0.75,
    metalness: 0.05,
  });
  const matGoggles = new THREE.MeshPhysicalMaterial({
    color: theme.accentHex,
    emissive: theme.threeHex,
    emissiveIntensity: 0.7,
    roughness: 0.12,
    metalness: 0.6,
    clearcoat: 1.0,
  });

  // Legs (articulated bottom-up)
  const makeLeg = (xOffset: number) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(xOffset, 0.56, 0);

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.24, 6, 12), matPants);
    thigh.position.y = -0.22;
    thigh.castShadow = true;
    legPivot.add(thigh);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.16, 0.3), matBoot);
    boot.position.set(0, -0.48, 0.04);
    boot.castShadow = true;
    legPivot.add(boot);

    return legPivot;
  };

  const leftLeg = makeLeg(-0.15);
  const rightLeg = makeLeg(0.15);
  group.add(leftLeg, rightLeg);

  // Torso (silhouette varies subtly for Male vs Female techwear vest)
  const torsoWidth = gender === 'female' ? 0.5 : 0.58;
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(torsoWidth, 0.62, 0.34),
    matShirt
  );
  torso.position.y = 0.9;
  torso.castShadow = true;
  group.add(torso);

  // Techwear Vest
  const vest = new THREE.Mesh(
    new THREE.BoxGeometry(torsoWidth + 0.05, 0.48, 0.38),
    matVest
  );
  vest.position.y = 0.92;
  vest.castShadow = true;
  group.add(vest);

  // Reflective Neon Chest & Back Stripe + Utility Belt
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(torsoWidth + 0.07, 0.07, 0.4),
    matNeonTrim
  );
  stripe.position.y = 0.84;
  group.add(stripe);

  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(torsoWidth + 0.07, 0.09, 0.39),
    matBoot
  );
  belt.position.y = 0.64;
  group.add(belt);

  // Arms
  const makeArm = (xOffset: number) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(xOffset, 1.12, 0);

    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.28, 6, 10), matShirt);
    sleeve.position.y = -0.18;
    sleeve.castShadow = true;
    armPivot.add(sleeve);

    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 10), matBoot);
    glove.position.y = -0.38;
    glove.castShadow = true;
    armPivot.add(glove);

    return armPivot;
  };

  const leftArm = makeArm(-(torsoWidth / 2 + 0.11));
  const rightArm = makeArm(torsoWidth / 2 + 0.11);
  group.add(leftArm, rightArm);

  // Head + AR Safety Goggles + Hair + Tech Headset
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.44, 0);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 16), matSkin);
  head.castShadow = true;
  headGroup.add(head);

  // AR Safety Goggles Visor
  const visorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.18), matBoot);
  visorFrame.position.set(0, 0.03, 0.18);
  headGroup.add(visorFrame);

  const visorLens = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.085, 0.05), matGoggles);
  visorLens.position.set(0, 0.03, 0.255);
  headGroup.add(visorLens);

  // Hair styles (Female bob + ponytail vs Male undercut cap)
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.252, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
    matHair
  );
  hairCap.position.set(0, 0.03, -0.02);
  hairCap.rotation.x = -0.22;
  hairCap.castShadow = true;
  headGroup.add(hairCap);

  if (gender === 'female') {
    const ponytail = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.22, 6, 10), matHair);
    ponytail.position.set(0, -0.02, -0.27);
    ponytail.rotation.x = 0.45;
    ponytail.castShadow = true;
    headGroup.add(ponytail);
  } else {
    const tuft = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.18), matHair);
    tuft.position.set(0, 0.22, 0.09);
    tuft.rotation.x = -0.18;
    headGroup.add(tuft);
  }

  // Headset comms
  const earCup = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.05, 12), matNeonTrim);
  earCup.rotation.z = Math.PI / 2;
  earCup.position.set(-0.25, 0.01, 0);
  headGroup.add(earCup);

  group.add(headGroup);

  // Held item anchor in front of technician
  const heldSlot = new THREE.Group();
  heldSlot.position.set(0, 0.92, 0.44);
  group.add(heldSlot);

  // Stun stars indicator (shown when stumbling over messy cables)
  const stunStars = new THREE.Group();
  stunStars.position.set(0, 1.85, 0);
  stunStars.visible = false;
  const starMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.9,
  });
  for (let i = 0; i < 3; i++) {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), starMat);
    const angle = (i / 3) * Math.PI * 2;
    star.position.set(Math.cos(angle) * 0.28, 0, Math.sin(angle) * 0.28);
    stunStars.add(star);
  }
  group.add(stunStars);

  return { group, leftArm, rightArm, leftLeg, rightLeg, headGroup, heldSlot, stunStars };
}

export interface BossNpcRig {
  group: THREE.Group;
  alertSprite: THREE.Sprite;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
}

export function buildBossNPC(): BossNpcRig {
  const group = new THREE.Group();
  group.add(getContactShadow());

  const matSuit = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.15 });
  const matTie = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.45 });
  const matSkin = new THREE.MeshStandardMaterial({ color: 0xe6b48a, roughness: 0.7 });
  const matHair = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.75 });
  const matClipboard = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });

  const makeLeg = (x: number) => {
    const p = new THREE.Group();
    p.position.set(x, 0.55, 0);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.28, 6, 10), matSuit);
    leg.position.y = -0.24;
    leg.castShadow = true;
    p.add(leg);
    return p;
  };
  const leftLeg = makeLeg(-0.14);
  const rightLeg = makeLeg(0.14);
  group.add(leftLeg, rightLeg);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.64, 0.34), matSuit);
  torso.position.y = 0.9;
  torso.castShadow = true;
  group.add(torso);

  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.34, 0.04), matTie);
  tie.position.set(0, 0.94, 0.18);
  group.add(tie);

  const clipboard = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, 0.04), matClipboard);
  clipboard.position.set(0.3, 0.95, 0.28);
  clipboard.rotation.x = -0.5;
  group.add(clipboard);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 14), matSkin);
  head.position.y = 1.44;
  head.castShadow = true;
  group.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
    matHair
  );
  hair.position.set(0, 1.47, -0.02);
  hair.rotation.x = -0.15;
  group.add(hair);

  // Floating "HURRY!" speech bubble sprite
  const spriteMat = new THREE.SpriteMaterial({
    map: createStatusSpriteTexture('!', 'HURRY!', '#dc2626', '#fca5a5'),
    transparent: true,
    depthTest: false,
  });
  const alertSprite = new THREE.Sprite(spriteMat);
  alertSprite.position.set(0, 2.25, 0);
  alertSprite.scale.set(1.65, 0.65, 1);
  alertSprite.visible = false;
  group.add(alertSprite);

  return { group, alertSprite, leftLeg, rightLeg };
}

export function buildServerRack(maxAnisotropy: number): {
  group: THREE.Group;
  overheatGlow: THREE.PointLight;
  sparkGroup: THREE.Group;
} {
  const group = new THREE.Group();
  const matCabinet = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.38, metalness: 0.72 });
  const matRail = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.85,
    roughness: 0.25,
  });
  const matBlades = new THREE.MeshStandardMaterial({
    map: createServerBladeTexture(maxAnisotropy),
    roughness: 0.45,
    metalness: 0.5,
    emissive: 0x0c4a6e,
    emissiveIntensity: 0.35,
  });

  // Main rack chassis
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.6, 1.2), matCabinet);
  body.position.y = 1.3;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Front Blade Panel
  const blades = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 2.24), matBlades);
  blades.position.set(0, 1.3, 0.605);
  group.add(blades);

  // Neon Vertical Pillars
  for (const x of [-0.71, 0.71]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.52, 0.08), matRail);
    rail.position.set(x, 1.3, 0.59);
    group.add(rail);
  }

  // Top exhaust cooling unit
  const fanUnit = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.42, 0.16, 16),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.8 })
  );
  fanUnit.position.set(0, 2.68, 0);
  group.add(fanUnit);

  const overheatGlow = new THREE.PointLight(0xff4500, 0, 5.5);
  overheatGlow.position.set(0, 2.0, 0.8);
  group.add(overheatGlow);

  // Overheat spark particles
  const sparkGroup = new THREE.Group();
  sparkGroup.position.set(0, 2.3, 0.5);
  sparkGroup.visible = false;
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
  for (let i = 0; i < 8; i++) {
    const sp = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), sparkMat);
    sp.position.set((Math.random() - 0.5) * 1.1, Math.random() * 0.9, (Math.random() - 0.5) * 0.6);
    sparkGroup.add(sp);
  }
  group.add(sparkGroup);

  return { group, overheatGlow, sparkGroup };
}

export function buildCLITerminal(maxAnisotropy: number): THREE.Group {
  const group = new THREE.Group();
  const matDesk = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.55 });
  const matLeg = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.8 });
  const matHolo = new THREE.MeshBasicMaterial({
    map: createHoloScreenTexture(maxAnisotropy),
    transparent: true,
    opacity: 0.94,
    side: THREE.DoubleSide,
  });

  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.95), matDesk);
  deskTop.position.y = 0.82;
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  group.add(deskTop);

  for (const x of [-0.78, 0.78]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.8), matLeg);
    leg.position.set(x, 0.4, 0);
    leg.castShadow = true;
    group.add(leg);
  }

  // Keyboard console
  const kb = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.05, 0.32), matLeg);
  kb.position.set(0, 0.9, 0.18);
  group.add(kb);

  // Holographic Display Screen
  const holo = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.78), matHolo);
  holo.position.set(0, 1.48, -0.18);
  holo.rotation.x = -0.12;
  group.add(holo);

  // Monitor arm
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.55, 10), matLeg);
  arm.position.set(0, 1.08, -0.25);
  group.add(arm);

  return group;
}

export function buildMCBPanel(): {
  group: THREE.Group;
  lever: THREE.Mesh;
  statusMat: THREE.MeshStandardMaterial;
} {
  const group = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 1.0, 0.25),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.6 })
  );
  box.position.y = 1.45;
  box.castShadow = true;
  group.add(box);

  const hazardTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.12, 0.27),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 })
  );
  hazardTrim.position.y = 1.98;
  group.add(hazardTrim);

  const lever = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.1, 0.22),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 })
  );
  lever.position.set(0, 1.42, 0.18);
  group.add(lever);

  const statusMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x22c55e,
    emissiveIntensity: 1.0,
  });
  const indicator = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), statusMat);
  indicator.position.set(0.2, 1.75, 0.14);
  group.add(indicator);

  return { group, lever, statusMat };
}

export function buildLaptopUnit(): {
  group: THREE.Group;
  screenMat: THREE.MeshStandardMaterial;
  statusSprite: THREE.Sprite;
  offlineTex: THREE.CanvasTexture;
  onlineTex: THREE.CanvasTexture;
  conflictTex: THREE.CanvasTexture;
} {
  const group = new THREE.Group();

  const matChassis = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.65 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.04, 0.42), matChassis);
  base.position.y = 0.02;
  base.castShadow = true;
  group.add(base);

  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.36, 0.03), matChassis);
  lid.position.set(0, 0.2, -0.19);
  lid.rotation.x = -0.22;
  lid.castShadow = true;
  group.add(lid);

  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    emissive: 0xef4444,
    emissiveIntensity: 0.45,
    roughness: 0.2,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.3), screenMat);
  screen.position.set(0, 0.2, -0.172);
  screen.rotation.x = -0.22;
  group.add(screen);

  const offlineTex = createStatusSpriteTexture('✕', 'OFFLINE', '#991b1b', '#f87171');
  const onlineTex = createStatusSpriteTexture('✓', 'ONLINE', '#065f46', '#34d399');
  const conflictTex = createStatusSpriteTexture('!', 'IP ERR', '#92400e', '#fbbf24');

  const spriteMat = new THREE.SpriteMaterial({ map: offlineTex, transparent: true });
  const statusSprite = new THREE.Sprite(spriteMat);
  statusSprite.position.set(0, 0.78, 0);
  statusSprite.scale.set(1.05, 0.4, 1);
  group.add(statusSprite);

  return { group, screenMat, statusSprite, offlineTex, onlineTex, conflictTex };
}

export function buildAccessPointUnit(installed = false): THREE.Group {
  const group = new THREE.Group();
  const dish = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.36, 0.1, 20),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.15 })
  );
  dish.castShadow = true;
  group.add(dish);

  const ledRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.025, 8, 24),
    new THREE.MeshStandardMaterial({
      color: installed ? 0x06b6d4 : 0x64748b,
      emissive: installed ? 0x06b6d4 : 0x000000,
      emissiveIntensity: installed ? 1.1 : 0,
    })
  );
  ledRing.rotation.x = Math.PI / 2;
  ledRing.position.y = 0.055;
  group.add(ledRing);

  return group;
}

export function buildFoldingLadder(): THREE.Group {
  const group = new THREE.Group();
  const matAlum = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.32, metalness: 0.82 });
  const matStep = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5, metalness: 0.2 });

  // A-frame rails
  for (const x of [-0.26, 0.26]) {
    const frontRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.7, 0.08), matAlum);
    frontRail.position.set(x, 0.82, 0.22);
    frontRail.rotation.x = -0.22;
    frontRail.castShadow = true;
    group.add(frontRail);

    const backRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.7, 0.08), matAlum);
    backRail.position.set(x, 0.82, -0.22);
    backRail.rotation.x = 0.22;
    backRail.castShadow = true;
    group.add(backRail);
  }

  for (let i = 0; i < 4; i++) {
    const y = 0.35 + i * 0.34;
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.05, 0.16), matStep);
    step.position.set(0, y, 0.32 - i * 0.07);
    step.castShadow = true;
    group.add(step);
  }

  return group;
}

export function buildCarriedItemMesh(itemType: string): THREE.Group {
  const g = new THREE.Group();
  if (itemType === 'utp_spool') {
    const flangeMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.4 });
    const coilMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.55,
      roughness: 0.4,
    });
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.04, 16), flangeMat);
    top.position.y = 0.16;
    const bot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.04, 16), flangeMat);
    bot.position.y = -0.16;
    const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.28, 16), coilMat);
    g.add(top, bot, coil);
  } else if (itemType === 'crimped_cable') {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.045, 10, 24),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 0.7 })
    );
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
  } else if (itemType === 'ladder') {
    const miniLadder = buildFoldingLadder();
    miniLadder.scale.setScalar(0.55);
    miniLadder.rotation.x = Math.PI / 2;
    miniLadder.position.y = 0.1;
    g.add(miniLadder);
  } else if (itemType === 'access_point') {
    const ap = buildAccessPointUnit(false);
    ap.scale.setScalar(0.85);
    g.add(ap);
  }
  return g;
}

export function buildToolbox(): THREE.Group {
  const g = new THREE.Group();
  const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35, metalness: 0.25 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.6 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.42, 0.52), redMat);
  base.position.y = 0.21;
  base.castShadow = true;
  g.add(base);

  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.1, 0.55), redMat);
  lid.position.y = 0.46;
  lid.castShadow = true;
  g.add(lid);

  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.08), darkMat);
  handle.position.y = 0.55;
  g.add(handle);

  const latch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.04), darkMat);
  latch.position.set(0, 0.42, 0.28);
  g.add(latch);

  return g;
}

export function buildSupplyBox(): THREE.Group {
  const g = new THREE.Group();
  const cardMat = new THREE.MeshStandardMaterial({ color: 0xc29b6b, roughness: 0.85, metalness: 0.02 });
  const insideMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, metalness: 0.4 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.4 });

  const box = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.55, 0.72), cardMat);
  box.position.y = 0.275;
  box.castShadow = true;
  box.receiveShadow = true;
  g.add(box);

  const flapL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.03, 0.7), cardMat);
  flapL.position.set(-0.46, 0.58, 0);
  flapL.rotation.z = 0.45;
  g.add(flapL);

  const flapR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.03, 0.7), cardMat);
  flapR.position.set(0.46, 0.58, 0);
  flapR.rotation.z = -0.45;
  g.add(flapR);

  const part1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.3), insideMat);
  part1.position.set(-0.12, 0.58, 0.05);
  part1.rotation.y = 0.25;
  g.add(part1);

  const part2 = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.035, 8, 16), accentMat);
  part2.position.set(0.16, 0.58, -0.05);
  part2.rotation.x = Math.PI / 2.4;
  g.add(part2);

  return g;
}

export function buildOfficeChair(): THREE.Group {
  const g = new THREE.Group();
  const matFrame = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.6 });
  const matSeat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.65, metalness: 0.05 });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.06, 12), matFrame);
  base.position.y = 0.04;
  g.add(base);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.42, 10), matFrame);
  stem.position.y = 0.25;
  g.add(stem);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.09, 0.5), matSeat);
  seat.position.y = 0.48;
  seat.castShadow = true;
  g.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.08), matSeat);
  back.position.set(0, 0.76, -0.22);
  back.rotation.x = -0.08;
  back.castShadow = true;
  g.add(back);

  return g;
}

export function buildCrimpingWorkbench(): THREE.Group {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0xb48456, roughness: 0.65, metalness: 0.05 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.6 });
  const matPad = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.4 });
  const matScreen = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0x22d3ee,
    emissiveIntensity: 0.45,
    roughness: 0.25,
  });

  const top = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 1.05), woodMat);
  top.position.y = 0.81;
  top.castShadow = true;
  top.receiveShadow = true;
  g.add(top);

  for (const lx of [-0.9, 0.9]) {
    for (const lz of [-0.4, 0.4]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.76, 0.1), legMat);
      leg.position.set(lx, 0.38, lz);
      leg.castShadow = true;
      g.add(leg);
    }
  }

  // Anti-static mat + monitor + pliers + LAN tester
  const pad = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.03, 0.72), matPad);
  pad.position.set(0, 0.875, 0.05);
  g.add(pad);

  const monStand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.26, 8), legMat);
  monStand.position.set(0.35, 0.98, -0.25);
  g.add(monStand);

  const mon = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.48, 0.06), matScreen);
  mon.position.set(0.35, 1.24, -0.25);
  g.add(mon);

  // Red crimping pliers
  const pliers = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.04, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 })
  );
  pliers.position.set(-0.45, 0.9, 0.14);
  pliers.rotation.y = 0.4;
  g.add(pliers);

  // LAN Tester unit
  const tester = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.05, 0.28),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, emissive: 0x22c55e, emissiveIntensity: 0.35 })
  );
  tester.position.set(-0.15, 0.9, 0.1);
  g.add(tester);

  return g;
}
