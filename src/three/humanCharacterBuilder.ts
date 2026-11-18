import * as THREE from 'three';

export type MaleHairStyle =
  | 'quiff'
  | 'comma'
  | 'slick'
  | 'crop'
  | 'two_block'
  | 'curtain_middle'
  | 'pompadour'
  | 'side_part'
  | 'textured_fringe'
  | 'wavy_curl';
export type FemaleHairStyle =
  | 'long_wave'
  | 'side_sweep_long'
  | 'hime_bangs'
  | 'low_twintail'
  | 'side_braid'
  | 'ponytail'
  | 'sleek_bob'
  | 'chignon'
  | 'wolf_layer'
  | 'half_up'
  | 'high_bun';
export type HairStyleId = MaleHairStyle | FemaleHairStyle;

export type OfficeOutfitStyle =
  | 'tech_jacket'
  | 'street_hoodie'
  | 'smart_vest'
  | 'suit_tie'
  | 'shirt_tie'
  | 'blazer_blouse'
  | 'cardigan_polo'
  | 'smart_blouse';

export type BrowStyle = 'arched' | 'straight' | 'bold';
export type FaceExpression = 'warm_smile' | 'gentle_smile' | 'confident';

export interface HumanBodyStyle {
  skinHex?: number;
  hairHex: number;
  shirtHex: number;
  pantsHex?: number;
  shoeHex?: number;
  overshirtHex?: number;
  lapelHex?: number;
  tieHex?: number;
  accentHex?: number;
  idBadgeHex?: string;
  idRoleLabel?: string;
  female?: boolean;
  skirt?: boolean;
  hairStyle?: HairStyleId;
  outfitStyle?: OfficeOutfitStyle;
  glasses?: boolean;
  headset?: boolean;
  earrings?: boolean;
  watch?: boolean;
  lanyard?: boolean;
  irisHex?: string;
  lipHex?: string;
  browStyle?: BrowStyle;
  expression?: FaceExpression;
  stubble?: boolean;
  beautyMark?: boolean;
  jawScale?: number;
}

export interface BuiltHumanRig {
  group: THREE.Group;
  hips: THREE.Group;
  pelvis: THREE.Mesh;
  hasSkirt: boolean;
  torso: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Group;
  leftForearm: THREE.Group;
  rightArm: THREE.Group;
  rightForearm: THREE.Group;
  leftLeg?: THREE.Group;
  leftShin?: THREE.Group;
  rightLeg?: THREE.Group;
  rightShin?: THREE.Group;
  heldAnchor: THREE.Group;
}

type FabricPattern = 'twill' | 'pinstripe' | 'knit' | 'techweave' | 'oxford';

const fabricTextureCache = new Map<string, THREE.CanvasTexture>();

function getFabricTexture(
  baseHex: number,
  pattern: FabricPattern,
  accentHex?: number
): THREE.CanvasTexture {
  const key = `${baseHex.toString(16)}_${pattern}_${accentHex?.toString(16) ?? 'none'}`;
  const cached = fabricTextureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const baseCol = new THREE.Color(baseHex);
  const lighter = baseCol.clone().lerp(new THREE.Color(0xffffff), 0.12);
  const darker = baseCol.clone().multiplyScalar(0.84);

  ctx.fillStyle = `#${baseCol.getHexString()}`;
  ctx.fillRect(0, 0, 128, 128);

  if (pattern === 'techweave') {
    ctx.strokeStyle = `rgba(${Math.round(lighter.r * 255)}, ${Math.round(lighter.g * 255)}, ${Math.round(lighter.b * 255)}, 0.25)`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 128; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 128);
      ctx.moveTo(0, i);
      ctx.lineTo(128, i);
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(0, 0, 0, 0.08)`;
    for (let y = 0; y < 128; y += 8) {
      for (let x = (y % 16 === 0 ? 0 : 4); x < 128; x += 8) {
        ctx.fillRect(x, y, 3, 3);
      }
    }
  } else if (pattern === 'pinstripe') {
    const stripeCol = accentHex
      ? new THREE.Color(accentHex).lerp(baseCol, 0.55)
      : lighter;
    ctx.fillStyle = `rgba(${Math.round(stripeCol.r * 255)}, ${Math.round(stripeCol.g * 255)}, ${Math.round(stripeCol.b * 255)}, 0.35)`;
    for (let x = 6; x < 128; x += 16) {
      ctx.fillRect(x, 0, 2, 128);
    }
    ctx.fillStyle = `rgba(0, 0, 0, 0.06)`;
    for (let y = 0; y < 128; y += 4) {
      ctx.fillRect(0, y, 128, 1);
    }
  } else if (pattern === 'knit') {
    ctx.fillStyle = `rgba(255, 255, 255, 0.07)`;
    for (let x = 0; x < 128; x += 6) {
      ctx.fillRect(x, 0, 2, 128);
    }
    ctx.fillStyle = `rgba(${Math.round(darker.r * 255)}, ${Math.round(darker.g * 255)}, ${Math.round(darker.b * 255)}, 0.22)`;
    for (let y = 0; y < 128; y += 8) {
      for (let x = 0; x < 128; x += 12) {
        ctx.fillRect(x + (y % 16 === 0 ? 0 : 6), y, 4, 3);
      }
    }
  } else if (pattern === 'oxford') {
    ctx.fillStyle = `rgba(255, 255, 255, 0.14)`;
    for (let y = 0; y < 128; y += 4) {
      for (let x = (y % 8 === 0 ? 0 : 2); x < 128; x += 4) {
        ctx.fillRect(x, y, 2, 2);
      }
    }
  } else {
    // Twill diagonal subtle weave
    ctx.strokeStyle = `rgba(255, 255, 255, 0.06)`;
    ctx.lineWidth = 1.5;
    for (let i = -128; i < 256; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 128, 128);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = 4;
  tex.userData.sharedFabric = true;
  fabricTextureCache.set(key, tex);
  return tex;
}

function getHairTexture(hairHex: number): THREE.CanvasTexture {
  const key = `hair_smooth_${hairHex.toString(16)}`;
  const cached = fabricTextureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const baseCol = new THREE.Color(hairHex);
  const rootCol = baseCol.clone().multiplyScalar(0.84);
  const midCol = baseCol.clone();
  const softLight = baseCol.clone().lerp(new THREE.Color(0xffffff), 0.14);

  // Smooth velvety vertical tonal gradient (no harsh busy stripes)
  const baseGrad = ctx.createLinearGradient(0, 0, 0, 128);
  baseGrad.addColorStop(0, `#${rootCol.getHexString()}`);
  baseGrad.addColorStop(0.32, `#${midCol.getHexString()}`);
  baseGrad.addColorStop(0.62, `#${softLight.getHexString()}`);
  baseGrad.addColorStop(1, `#${midCol.getHexString()}`);
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 128, 128);

  // Very subtle soft painterly sheen streaks
  for (let x = 4; x < 128; x += 14) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.045)';
    ctx.fillRect(x, 12, 4, 104);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(1, 1);
  tex.anisotropy = 4;
  tex.userData.sharedFabric = true;
  fabricTextureCache.set(key, tex);
  return tex;
}

function createVectorFaceTexture(opts: {
  skinHex: number;
  hairHex: number;
  female: boolean;
  irisHex?: string;
  lipHex?: string;
  browStyle?: BrowStyle;
  expression?: FaceExpression;
  stubble?: boolean;
  beautyMark?: boolean;
}): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const baseCol = new THREE.Color(opts.skinHex);
  const baseHex = `#${baseCol.getHexString()}`;
  const hairCol = `#${new THREE.Color(opts.hairHex).getHexString()}`;

  // 1. Soft creamy peach skin base + subtle soft face glow
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  const glow = ctx.createRadialGradient(256, 255, 30, 256, 260, 220);
  glow.addColorStop(0, 'rgba(255, 250, 245, 0.12)');
  glow.addColorStop(0.75, 'rgba(255, 250, 245, 0)');
  glow.addColorStop(1, 'rgba(165, 105, 82, 0.08)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 512, 512);

  // Cute coral-peach oval cheek blushes (soft & prominent on female, subtle on male)
  for (const side of [-1, 1]) {
    const cx = 256 + side * 102;
    const cy = 294;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1.45, 0.85);
    const blush = ctx.createRadialGradient(0, 0, 4, 0, 0, 28);
    blush.addColorStop(
      0,
      opts.female ? 'rgba(244, 126, 90, 0.68)' : 'rgba(224, 132, 106, 0.28)'
    );
    blush.addColorStop(0.65, opts.female ? 'rgba(244, 126, 90, 0.36)' : 'rgba(224, 132, 106, 0.1)');
    blush.addColorStop(1, 'rgba(244, 126, 90, 0)');
    ctx.fillStyle = blush;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Optional neat light designer stubble on select male staff
  if (opts.stubble && !opts.female) {
    const stubble = ctx.createRadialGradient(256, 386, 18, 256, 380, 82);
    stubble.addColorStop(0, 'rgba(40, 32, 28, 0.14)');
    stubble.addColorStop(1, 'rgba(40, 32, 28, 0)');
    ctx.fillStyle = stubble;
    ctx.beginPath();
    ctx.ellipse(256, 380, 80, 54, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Big Expressive Cute Stylized Eyes (x = 256 ± 78, y = 248)
  const irisColor = opts.irisHex ?? '#2b1712';
  const browStyle: BrowStyle = opts.browStyle ?? (opts.female ? 'arched' : 'straight');

  for (const side of [-1, 1]) {
    const ex = 256 + side * 78;
    const ey = 248;

    // Clean rounded almond-oval white sclera
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(ex, ey, 38, opts.female ? 28 : 24, side * -0.05, 0, Math.PI * 2);
    ctx.fill();

    // Clip iris inside eye opening
    ctx.save();
    ctx.clip();

    // Large warm dark round iris
    const irisR = opts.female ? 25.5 : 22.5;
    const irisGrad = ctx.createRadialGradient(ex, ey + 5, 5, ex, ey, irisR);
    irisGrad.addColorStop(0, '#4f2a20');
    irisGrad.addColorStop(0.55, irisColor);
    irisGrad.addColorStop(1, '#1d0f0c');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(ex, ey + 1, irisR, 0, Math.PI * 2);
    ctx.fill();

    // Deep dark pupil
    ctx.fillStyle = '#140a08';
    ctx.beginPath();
    ctx.arc(ex, ey, 11.5, 0, Math.PI * 2);
    ctx.fill();

    // Crisp bright white highlight catchlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex - 8, ey - 8, 7.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(ex + 9, ey + 8, 3.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Clean soft rounded upper lid outline (no heavy spiky wings)
    ctx.strokeStyle = '#241410';
    ctx.lineWidth = opts.female ? 5.2 : 4.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(ex, ey, 38, opts.female ? 28 : 24, side * -0.05, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();

    // Clean thin gentle eyebrows
    ctx.strokeStyle = hairCol;
    ctx.lineWidth = opts.female ? 6.4 : browStyle === 'bold' ? 9.5 : 7.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (browStyle === 'arched' || opts.female) {
      ctx.moveTo(ex - side * 28, ey - 42);
      ctx.quadraticCurveTo(ex + side * 2, ey - 55, ex + side * 30, ey - 40);
    } else {
      ctx.moveTo(ex - side * 30, ey - 40);
      ctx.quadraticCurveTo(ex, ey - 48, ex + side * 32, ey - 40);
    }
    ctx.stroke();
  }

  // 3. Minimalist Soft Nose Hint (clean, delicate, no harsh black hook)
  ctx.fillStyle = 'rgba(205, 132, 102, 0.36)';
  ctx.beginPath();
  ctx.ellipse(256, 304, 4.5, 3.0, 0, 0, Math.PI * 2);
  ctx.fill();

  // Optional tiny beauty mark
  if (opts.beautyMark) {
    ctx.fillStyle = '#4a2b20';
    ctx.beginPath();
    ctx.arc(324, 326, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Cute Friendly Clean Smile (y = 342)
  const expr: FaceExpression = opts.expression ?? (opts.female ? 'warm_smile' : 'gentle_smile');
  if (opts.female) {
    ctx.strokeStyle = opts.lipHex ?? '#e6584f';
    ctx.lineWidth = 7.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(239, 340);
    ctx.quadraticCurveTo(256, expr === 'warm_smile' ? 360 : 354, 273, 340);
    ctx.stroke();
  } else {
    ctx.strokeStyle = '#a45b48';
    ctx.lineWidth = 6.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(234, 344);
    ctx.quadraticCurveTo(
      expr === 'confident' ? 260 : 256,
      expr === 'warm_smile' ? 358 : 353,
      278,
      expr === 'confident' ? 341 : 344
    );
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function createSculptedHeadGeometry(female: boolean, jawScale?: number): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.104, 48, 36);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;

  const widthMul = female ? (jawScale ?? 0.96) : (jawScale ?? 0.94);
  const heightMul = female ? 1.04 : 1.07;
  const depthMul = 0.92;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i) * widthMul;
    const y = pos.getY(i) * heightMul;
    let z = pos.getZ(i) * depthMul;

    if (y < 0) {
      const t = Math.min(1, -y / (0.104 * heightMul));
      // Soft rounded cute cheeks & gentle chin taper
      const taper = female ? 1 - t * 0.28 : 1 - t * 0.27;
      x *= taper;

      if (z > 0.015 && t > 0.6) {
        const ct = (t - 0.6) / 0.4;
        z += Math.sin(ct * Math.PI) * 0.0035;
      }
    }

    pos.setXYZ(i, x, y, z);

    if (z > 0.004) {
      const u = THREE.MathUtils.clamp(0.5 + x / 0.188, 0.04, 0.96);
      const v = THREE.MathUtils.clamp(0.5 + y / 0.195, 0.04, 0.96);
      uv.setXY(i, u, v);
    } else {
      uv.setXY(i, 0.02, 0.02);
    }
  }

  pos.needsUpdate = true;
  uv.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function createConformingHairCapGeometry(
  female: boolean,
  jawScale?: number
): THREE.BufferGeometry {
  const widthMul = female ? (jawScale ?? 0.96) : (jawScale ?? 0.94);
  const heightMul = female ? 1.04 : 1.07;
  const depthMul = 0.92;
  const baseRadius = 0.104;

  const phiSegs = 48;
  const uSegs = 18;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Generous pillowy hair dome volume
  const crownOffset = female ? 0.0175 : 0.013;
  positions.push(0, 0.02 + baseRadius * heightMul + crownOffset, 0);
  uvs.push(0.5, 1);

  for (let i = 1; i <= uSegs + 1; i++) {
    const isBevelRing = i === uSegs + 1;
    const u = isBevelRing ? 1.0 : i / uSegs;

    for (let j = 0; j <= phiSegs; j++) {
      const phi = (j / phiSegs) * Math.PI * 2 - Math.PI; // -PI..PI, 0 = front (+Z)
      const absPhi = Math.abs(phi);

      const frontFactor = Math.exp(-Math.pow(absPhi / 0.85, 2));
      const earNotch = Math.exp(-Math.pow((absPhi - Math.PI * 0.52) / 0.26, 2));
      const backFactor = Math.pow(Math.sin(absPhi * 0.5), 2.0);

      const thetaMax =
        1.1 + backFactor * 1.15 + (1 - frontFactor) * 0.16 - earNotch * 0.36;
      const theta = u * thetaMax;

      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      const x0 = baseRadius * sinT * Math.sin(phi) * widthMul;
      const y0 = baseRadius * cosT * heightMul;
      const z0 = baseRadius * sinT * Math.cos(phi) * depthMul;

      const len = Math.hypot(x0, y0, z0) || 1;
      const nx = x0 / len;
      const ny = y0 / len;
      const nz = z0 / len;

      // Soft side-halo volume on female/male hair
      const sideFullness = (1 - frontFactor * 0.45) * (female ? 0.0045 : 0.002);
      const baseVol = crownOffset + sideFullness;

      let offset: number;
      if (isBevelRing) {
        offset = -0.005;
      } else if (u > 0.78) {
        const edgeT = (u - 0.78) / 0.22;
        offset = THREE.MathUtils.lerp(baseVol, 0.0025, edgeT * edgeT);
      } else {
        offset = baseVol;
      }

      positions.push(x0 + nx * offset, 0.02 + y0 + ny * offset, z0 + nz * offset);
      uvs.push(j / phiSegs, 1 - u);
    }
  }

  for (let j = 0; j < phiSegs; j++) {
    indices.push(0, 1 + j, 1 + j + 1);
  }

  const stride = phiSegs + 1;
  const ringCount = uSegs + 1;
  for (let r = 0; r < ringCount - 1; r++) {
    const row0 = 1 + r * stride;
    const row1 = 1 + (r + 1) * stride;
    for (let j = 0; j < phiSegs; j++) {
      const a = row0 + j;
      const b = row1 + j;
      const c = row1 + j + 1;
      const d = row0 + j + 1;
      indices.push(a, b, d, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createFlatHairRibbonGeometry(
  points: THREE.Vector3[],
  halfWidth: number,
  halfThick: number,
  tubularSegments = 18,
  radialSegments = 10,
  rootScale = 0.72,
  tipScale = 0.12
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const tangents: THREE.Vector3[] = [];
  for (let i = 0; i <= tubularSegments; i++) {
    tangents.push(curve.getTangentAt(i / tubularSegments).normalize());
  }

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    const center = curve.getPointAt(t);
    const T = tangents[i];

    // Radial outward direction from head center axis (0, 0.02, 0) keeps ribbon flat against skull/face
    const outward = new THREE.Vector3(center.x, (center.y - 0.04) * 0.45, center.z);
    if (outward.lengthSq() < 1e-5) outward.set(0, 0, 1);
    outward.normalize();

    const side = new THREE.Vector3().crossVectors(T, outward);
    if (side.lengthSq() < 1e-5) side.set(1, 0, 0);
    side.normalize();
    const normal = new THREE.Vector3().crossVectors(side, T).normalize();

    let profile: number;
    if (t < 0.2) {
      profile = THREE.MathUtils.lerp(rootScale, 1.0, Math.sin((t / 0.2) * Math.PI * 0.5));
    } else if (t < 0.52) {
      profile = 1.0;
    } else {
      const k = (t - 0.52) / 0.48;
      profile = THREE.MathUtils.lerp(1.0, tipScale, Math.pow(k, 1.2));
    }

    const rW = halfWidth * profile;
    const rT = halfThick * profile;

    for (let j = 0; j <= radialSegments; j++) {
      const angle = (j / radialSegments) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      positions.push(
        center.x + side.x * cosA * rW + normal.x * sinA * rT,
        center.y + side.y * cosA * rW + normal.y * sinA * rT,
        center.z + side.z * cosA * rW + normal.z * sinA * rT
      );
      uvs.push(j / radialSegments, 1 - t);
    }
  }

  const stride = radialSegments + 1;
  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + j + 1;
      const d = i * stride + j + 1;
      indices.push(a, b, d, b, c, d);
    }
  }

  // Cap root & pointed tip cleanly
  const rootCenter = curve.getPointAt(0);
  const rootT = tangents[0];
  const rootTipIdx = positions.length / 3;
  positions.push(
    rootCenter.x - rootT.x * halfThick * 0.4,
    rootCenter.y - rootT.y * halfThick * 0.4,
    rootCenter.z - rootT.z * halfThick * 0.4
  );
  uvs.push(0.5, 1);
  for (let j = 0; j < radialSegments; j++) {
    indices.push(rootTipIdx, j, j + 1);
  }

  const endCenter = curve.getPointAt(1);
  const endT = tangents[tubularSegments];
  const endTipIdx = positions.length / 3;
  positions.push(
    endCenter.x + endT.x * halfWidth * 0.48,
    endCenter.y + endT.y * halfWidth * 0.48,
    endCenter.z + endT.z * halfWidth * 0.48
  );
  uvs.push(0.5, 0);
  const lastRingOffset = tubularSegments * stride;
  for (let j = 0; j < radialSegments; j++) {
    indices.push(lastRingOffset + j, endTipIdx, lastRingOffset + j + 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createLoftedHairCurtainGeometry(
  columnControlPts: Array<Array<[number, number, number]>>,
  halfThick: number,
  vSegs = 22,
  ringSegs = 28,
  tipTaper = 0.14
): THREE.BufferGeometry {
  const curves = columnControlPts.map(
    (pts) =>
      new THREE.CatmullRomCurve3(
        pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
        false,
        'catmullrom',
        0.5
      )
  );

  // Build horizontal spline per vertical step so the sheet is smooth across both axes
  const rowSlices: Array<{
    horiz: THREE.CatmullRomCurve3;
    nextHoriz: THREE.CatmullRomCurve3;
    t: number;
  }> = [];
  const dt = 0.02;
  for (let i = 0; i <= vSegs; i++) {
    const t = i / vSegs;
    const tNext = Math.min(1, t + dt);
    const pts = curves.map((c) => c.getPointAt(t));
    const nextPts = curves.map((c) => c.getPointAt(tNext));
    rowSlices.push({
      horiz: new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5),
      nextHoriz: new THREE.CatmullRomCurve3(nextPts, false, 'catmullrom', 0.5),
      t,
    });
  }

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= vSegs; i++) {
    const { horiz, nextHoriz, t } = rowSlices[i];

    let thickScale: number;
    if (t < 0.12) {
      thickScale = THREE.MathUtils.lerp(0.38, 1.0, t / 0.12);
    } else if (t < 0.72) {
      thickScale = 1.0;
    } else {
      const k = (t - 0.72) / 0.28;
      thickScale = THREE.MathUtils.lerp(1.0, tipTaper, Math.pow(k, 1.25));
    }

    for (let j = 0; j <= ringSegs; j++) {
      const phi = (j / ringSegs) * Math.PI * 2;
      // Map phi in [0..2PI] smoothly across width u in [0..1] (0 = left edge, 1 = right edge)
      const u = 0.5 - 0.5 * Math.cos(phi);
      const s = Math.sin(phi);

      const p = horiz.getPointAt(u);
      const pNext = nextHoriz.getPointAt(u);
      const T_v = pNext.clone().sub(p);
      if (T_v.lengthSq() < 1e-8) {
        T_v.set(0, -1, 0);
      } else {
        T_v.normalize();
      }

      const T_h = horiz.getTangentAt(u).normalize();
      const N = new THREE.Vector3().crossVectors(T_h, T_v);
      if (N.lengthSq() < 1e-6) {
        N.set(0, 0, -1);
      } else {
        N.normalize();
      }

      // Soft pillowy undulating ridge thickness across width
      const edgeFade = Math.sin(u * Math.PI);
      const waveRidge = 0.85 + 0.15 * Math.cos(u * Math.PI * 6);
      const localThick = halfThick * thickScale * waveRidge * (0.25 + 0.75 * edgeFade);

      positions.push(
        p.x + N.x * s * localThick,
        p.y + N.y * s * localThick,
        p.z + N.z * s * localThick
      );
      uvs.push(u, 1 - t);
    }
  }

  const stride = ringSegs + 1;
  for (let i = 0; i < vSegs; i++) {
    for (let j = 0; j < ringSegs; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + j + 1;
      const d = i * stride + j + 1;
      indices.push(a, b, d, b, c, d);
    }
  }

  // Cap bottom scalloped edge cleanly
  const lastRowOffset = vSegs * stride;
  const lastHoriz = rowSlices[vSegs].horiz;
  const centerTipIdx = positions.length / 3;
  const centerTip = lastHoriz.getPointAt(0.5);
  positions.push(centerTip.x, centerTip.y - 0.004, centerTip.z);
  uvs.push(0.5, 0);
  for (let j = 0; j < ringSegs; j++) {
    indices.push(lastRowOffset + j, centerTipIdx, lastRowOffset + j + 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createIdCardTexture(accentColor: string, roleLabel: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 128, 192);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 124, 188);

  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 0, 128, 42);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(48, 8, 32, 8);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(roleLabel, 64, 33);

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(32, 52, 64, 68);
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(64, 77, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(64, 118, 24, Math.PI, 0);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(24, 132, 80, 9);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(34, 148, 60, 6);

  ctx.fillStyle = '#0f172a';
  for (let x = 22; x < 106; x += 6) {
    ctx.fillRect(x, 164, x % 12 === 0 ? 4 : 2, 16);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function getOrganicHumanGeometries() {
  const pelvis = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.01, -0.09),
      new THREE.Vector2(0.145, -0.065),
      new THREE.Vector2(0.168, -0.01),
      new THREE.Vector2(0.162, 0.05),
      new THREE.Vector2(0.148, 0.1),
      new THREE.Vector2(0.01, 0.1),
    ],
    20
  );

  const skirt = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.01, -0.34),
      new THREE.Vector2(0.18, -0.34),
      new THREE.Vector2(0.174, -0.18),
      new THREE.Vector2(0.172, -0.03),
      new THREE.Vector2(0.15, 0.09),
      new THREE.Vector2(0.01, 0.09),
    ],
    22
  );

  const torsoMale = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.01, -0.03),
      new THREE.Vector2(0.15, 0.0),
      new THREE.Vector2(0.156, 0.11),
      new THREE.Vector2(0.18, 0.25),
      new THREE.Vector2(0.196, 0.37),
      new THREE.Vector2(0.172, 0.44),
      new THREE.Vector2(0.072, 0.485),
      new THREE.Vector2(0.01, 0.49),
    ],
    22
  );

  const torsoFemale = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.01, -0.03),
      new THREE.Vector2(0.142, 0.0),
      new THREE.Vector2(0.128, 0.11),
      new THREE.Vector2(0.158, 0.24),
      new THREE.Vector2(0.166, 0.36),
      new THREE.Vector2(0.146, 0.43),
      new THREE.Vector2(0.064, 0.475),
      new THREE.Vector2(0.01, 0.48),
    ],
    22
  );

  const thigh = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.01, -0.4),
      new THREE.Vector2(0.05, -0.385),
      new THREE.Vector2(0.058, -0.26),
      new THREE.Vector2(0.07, -0.11),
      new THREE.Vector2(0.073, -0.02),
      new THREE.Vector2(0.045, 0.02),
      new THREE.Vector2(0.01, 0.025),
    ],
    16
  );

  const calf = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.01, -0.395),
      new THREE.Vector2(0.035, -0.38),
      new THREE.Vector2(0.04, -0.28),
      new THREE.Vector2(0.055, -0.15),
      new THREE.Vector2(0.054, -0.06),
      new THREE.Vector2(0.049, 0.0),
      new THREE.Vector2(0.01, 0.015),
    ],
    16
  );

  const upperArm = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.01, -0.255),
      new THREE.Vector2(0.036, -0.24),
      new THREE.Vector2(0.043, -0.14),
      new THREE.Vector2(0.049, -0.04),
      new THREE.Vector2(0.041, 0.01),
      new THREE.Vector2(0.01, 0.015),
    ],
    14
  );

  const forearm = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.01, -0.235),
      new THREE.Vector2(0.026, -0.225),
      new THREE.Vector2(0.032, -0.14),
      new THREE.Vector2(0.039, -0.05),
      new THREE.Vector2(0.036, 0.0),
      new THREE.Vector2(0.01, 0.01),
    ],
    14
  );

  return {
    pelvis,
    skirt,
    torsoMale,
    torsoFemale,
    thigh,
    calf,
    upperArm,
    forearm,
  };
}

function buildOrganicShoe(
  shoeUpperMat: THREE.Material,
  soleMat: THREE.Material,
  accentMat: THREE.Material,
  formalDressShoe: boolean
): THREE.Group {
  const shoe = new THREE.Group();

  const effectiveSoleMat = formalDressShoe ? shoeUpperMat : soleMat;
  const soleRear = new THREE.Mesh(
    new THREE.CylinderGeometry(0.046, 0.048, 0.022, 12),
    effectiveSoleMat
  );
  soleRear.position.set(0, 0.011, -0.015);
  const soleMid = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.02, 0.092),
    effectiveSoleMat
  );
  soleMid.position.set(0, 0.01, 0.028);
  const soleToe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.043, 0.046, 0.02, 12),
    effectiveSoleMat
  );
  soleToe.position.set(0, 0.01, 0.072);
  shoe.add(soleRear, soleMid, soleToe);

  const heel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.046, 0.056, 12),
    shoeUpperMat
  );
  heel.position.set(0, 0.046, -0.012);
  heel.castShadow = true;

  const vamp = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.041, 0.074, 6, 12),
    shoeUpperMat
  );
  vamp.rotation.x = Math.PI / 2;
  vamp.scale.set(1.02, 1.0, 0.64);
  vamp.position.set(0, 0.04, 0.042);
  vamp.castShadow = true;

  const toeCap = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 10), shoeUpperMat);
  toeCap.scale.set(0.95, 0.52, 1.28);
  toeCap.position.set(0, 0.032, 0.082);
  shoe.add(heel, vamp, toeCap);

  if (formalDressShoe) {
    // Sleek metallic loafer bit / welt accent across instep
    const loaferBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, 0.008, 0.012),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.22, metalness: 0.85 })
    );
    loaferBar.position.set(0, 0.068, 0.046);
    shoe.add(loaferBar);
  } else {
    // Modern sneaker laces + contrast tongue & heel tab
    const laceMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    for (let i = 0; i < 3; i++) {
      const lace = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.006, 0.008), laceMat);
      lace.position.set(0, 0.066 - i * 0.004, 0.03 + i * 0.018);
      lace.rotation.x = 0.25;
      shoe.add(lace);
    }
    const heelTab = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.024, 0.012), accentMat);
    heelTab.position.set(0, 0.072, -0.052);
    shoe.add(heelTab);
  }

  return shoe;
}

function buildHumanHand(
  skinMat: THREE.Material,
  side: -1 | 1 = 1,
  female = false
): THREE.Group {
  const hand = new THREE.Group();
  const s = female ? 0.88 : 0.98;

  // Smooth wrist transition from forearm
  const wrist = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.02 * s, 0.012 * s, 6, 12),
    skinMat
  );
  wrist.scale.set(0.84, 1.0, 1.04);
  wrist.position.set(0, -0.006, 0.001);
  hand.add(wrist);

  // Contoured anatomical palm (wider across knuckles, slim thickness)
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.0275 * s, 14, 12), skinMat);
  palm.scale.set(0.56, 1.16, 0.98);
  palm.position.set(0, -0.028 * s, 0.002);
  palm.castShadow = true;
  hand.add(palm);

  // Soft thenar pad (thumb muscle base on inner-front palm)
  const thenar = new THREE.Mesh(new THREE.SphereGeometry(0.014 * s, 10, 10), skinMat);
  thenar.scale.set(0.75, 1.25, 0.95);
  thenar.position.set(-side * 0.006 * s, -0.026 * s, 0.015 * s);
  hand.add(thenar);

  // 4 distinct articulated fingers (index -> pinky) with natural length graduation & gentle inward curl
  const fingerSpecs = [
    { z: 0.0185, r: 0.0056, len1: 0.019, len2: 0.015, curl1: 0.14, curl2: 0.22, splayX: -0.05 },
    { z: 0.0065, r: 0.0058, len1: 0.0215, len2: 0.017, curl1: 0.18, curl2: 0.28, splayX: -0.01 },
    { z: -0.0058, r: 0.0055, len1: 0.0195, len2: 0.0155, curl1: 0.24, curl2: 0.34, splayX: 0.03 },
    { z: -0.0172, r: 0.0048, len1: 0.0155, len2: 0.0125, curl1: 0.3, curl2: 0.42, splayX: 0.08 },
  ];

  fingerSpecs.forEach((spec) => {
    const knuckle = new THREE.Group();
    knuckle.position.set(0, -0.052 * s, spec.z * s);
    // Curl inward toward palm (-side * angle around Z) + subtle natural finger splay
    knuckle.rotation.z = -side * spec.curl1;
    knuckle.rotation.x = spec.splayX;

    const knucklePad = new THREE.Mesh(
      new THREE.SphereGeometry(spec.r * 1.04 * s, 8, 8),
      skinMat
    );
    knuckle.add(knucklePad);

    const seg1 = new THREE.Mesh(
      new THREE.CapsuleGeometry(spec.r * s, spec.len1 * s, 5, 10),
      skinMat
    );
    seg1.position.y = -(spec.len1 * 0.52) * s;
    seg1.castShadow = true;
    knuckle.add(seg1);

    const midJoint = new THREE.Group();
    midJoint.position.set(0, -(spec.len1 + spec.r * 0.45) * s, 0);
    midJoint.rotation.z = -side * spec.curl2;

    const seg2 = new THREE.Mesh(
      new THREE.CapsuleGeometry(spec.r * 0.86 * s, spec.len2 * s, 5, 10),
      skinMat
    );
    seg2.position.y = -(spec.len2 * 0.5) * s;
    seg2.castShadow = true;
    midJoint.add(seg2);

    knuckle.add(midJoint);
    hand.add(knuckle);
  });

  // Opposable thumb on front-inner edge with 2 natural phalanges
  const thumbRoot = new THREE.Group();
  thumbRoot.position.set(-side * 0.009 * s, -0.024 * s, 0.022 * s);
  thumbRoot.rotation.x = -0.44;
  thumbRoot.rotation.z = -side * 0.24;

  const thumbBase = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.0064 * s, 0.016 * s, 5, 10),
    skinMat
  );
  thumbBase.position.y = -0.009 * s;
  thumbRoot.add(thumbBase);

  const thumbTipJoint = new THREE.Group();
  thumbTipJoint.position.set(0, -0.02 * s, 0);
  thumbTipJoint.rotation.z = -side * 0.28;

  const thumbTip = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.0056 * s, 0.013 * s, 5, 10),
    skinMat
  );
  thumbTip.position.y = -0.007 * s;
  thumbTipJoint.add(thumbTip);
  thumbRoot.add(thumbTipJoint);

  hand.add(thumbRoot);

  return hand;
}

function buildSculptedHumanHead(
  opts: HumanBodyStyle,
  skinMat: THREE.Material,
  hairMat: THREE.Material,
  accentMat: THREE.Material
): THREE.Group {
  const headGroup = new THREE.Group();
  const female = Boolean(opts.female);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(female ? 0.038 : 0.044, female ? 0.046 : 0.054, 0.13, 14),
    skinMat
  );
  neck.position.y = -0.065;
  neck.castShadow = true;
  headGroup.add(neck);

  const faceTex = createVectorFaceTexture({
    skinHex: opts.skinHex ?? 0xedb990,
    hairHex: opts.hairHex,
    female,
    irisHex: opts.irisHex,
    lipHex: opts.lipHex,
    browStyle: opts.browStyle,
    expression: opts.expression,
    stubble: opts.stubble,
    beautyMark: opts.beautyMark,
  });
  const faceSkinMat = new THREE.MeshStandardMaterial({
    map: faceTex,
    roughness: 0.7,
    metalness: 0.0,
  });

  const sculptedHeadGeo = createSculptedHeadGeometry(female, opts.jawScale);
  const headMesh = new THREE.Mesh(sculptedHeadGeo, faceSkinMat);
  headMesh.position.set(0, 0.02, 0);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  const studMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    roughness: 0.2,
    metalness: 0.72,
  });
  for (const ex of [female ? -0.097 : -0.096, female ? 0.097 : 0.096]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.0185, 12, 10), skinMat);
    ear.scale.set(0.38, 0.9, 0.62);
    ear.position.set(ex, 0.014, -0.002);
    headGroup.add(ear);

    if (opts.earrings) {
      const stud = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8), studMat);
      stud.position.set(ex * 1.02, -0.001, 0.002);
      headGroup.add(stud);
    }
  }

  // Soft pillowy cranium hair base
  const hairCap = new THREE.Mesh(
    createConformingHairCapGeometry(female, opts.jawScale),
    hairMat
  );
  hairCap.castShadow = true;
  headGroup.add(hairCap);

  // Delicate flat temple wisps right in front of ears
  const templeX = female ? 0.091 : 0.09;
  for (const side of [-1, 1]) {
    const sideburn = new THREE.Mesh(
      createFlatHairRibbonGeometry(
        [
          new THREE.Vector3(side * (templeX - 0.006), 0.056, 0.042),
          new THREE.Vector3(side * templeX, 0.036, 0.03),
          new THREE.Vector3(side * (templeX - 0.004), 0.012, 0.018),
        ],
        0.01,
        0.0042,
        10,
        8,
        0.75,
        0.15
      ),
      hairMat
    );
    headGroup.add(sideburn);
  }

  const addRibbon = (
    pts: Array<[number, number, number]>,
    halfWidth: number,
    halfThick: number,
    tubularSegs = 18,
    rootScale = 0.76,
    tipScale = 0.14
  ) => {
    const lock = new THREE.Mesh(
      createFlatHairRibbonGeometry(
        pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
        halfWidth,
        halfThick,
        tubularSegs,
        10,
        rootScale,
        tipScale
      ),
      hairMat
    );
    lock.castShadow = true;
    headGroup.add(lock);
    return lock;
  };

  const addCurtain = (
    cols: Array<Array<[number, number, number]>>,
    halfThick: number,
    vSegs = 22,
    tipTaper = 0.16
  ) => {
    const sheet = new THREE.Mesh(
      createLoftedHairCurtainGeometry(cols, halfThick, vSegs, 28, tipTaper),
      hairMat
    );
    sheet.castShadow = true;
    headGroup.add(sheet);
    return sheet;
  };

  const style: HairStyleId = opts.hairStyle ?? (female ? 'long_wave' : 'quiff');

  switch (style) {
    case 'long_wave': {
      // Soft pillowy parted crown dome (matches the rounded silhouette in reference)
      for (const side of [-1, 1]) {
        const crownLobe = new THREE.Mesh(new THREE.SphereGeometry(0.082, 22, 16), hairMat);
        crownLobe.scale.set(0.86, 0.68, 1.06);
        crownLobe.position.set(side * 0.036, 0.092, -0.006);
        crownLobe.castShadow = true;
        headGroup.add(crownLobe);
      }

      // Airy wispy Korean bangs across upper forehead (clean gaps showing brows & forehead)
      const bangs: Array<{ pts: Array<[number, number, number]>; w: number }> = [
        {
          pts: [
            [-0.012, 0.118, 0.068],
            [-0.022, 0.095, 0.096],
            [-0.026, 0.072, 0.104],
            [-0.02, 0.056, 0.1],
          ],
          w: 0.013,
        },
        {
          pts: [
            [0.01, 0.118, 0.068],
            [0.016, 0.095, 0.096],
            [0.02, 0.072, 0.104],
            [0.014, 0.056, 0.1],
          ],
          w: 0.013,
        },
        {
          pts: [
            [-0.03, 0.114, 0.062],
            [-0.052, 0.09, 0.088],
            [-0.064, 0.066, 0.09],
            [-0.06, 0.048, 0.084],
          ],
          w: 0.014,
        },
        {
          pts: [
            [0.028, 0.114, 0.062],
            [0.052, 0.09, 0.088],
            [0.064, 0.066, 0.09],
            [0.062, 0.048, 0.084],
          ],
          w: 0.014,
        },
      ];
      bangs.forEach((b) => addRibbon(b.pts, b.w, 0.0046, 16, 0.72, 0.12));

      // Continuous wavy back hair curtain (zero gaps, soft scalloped curled hem)
      addCurtain(
        [
          [
            [-0.098, 0.065, 0.015],
            [-0.112, -0.005, -0.02],
            [-0.108, -0.085, -0.05],
            [-0.092, -0.15, -0.04],
          ],
          [
            [-0.076, 0.086, -0.042],
            [-0.088, 0.008, -0.088],
            [-0.092, -0.082, -0.1],
            [-0.078, -0.168, -0.084],
          ],
          [
            [-0.038, 0.096, -0.082],
            [-0.044, 0.015, -0.112],
            [-0.046, -0.085, -0.122],
            [-0.038, -0.178, -0.104],
          ],
          [
            [0.0, 0.098, -0.092],
            [0.0, 0.018, -0.118],
            [0.0, -0.086, -0.128],
            [0.0, -0.184, -0.112],
          ],
          [
            [0.038, 0.096, -0.082],
            [0.044, 0.015, -0.112],
            [0.046, -0.085, -0.122],
            [0.038, -0.178, -0.104],
          ],
          [
            [0.076, 0.086, -0.042],
            [0.088, 0.008, -0.088],
            [0.092, -0.082, -0.1],
            [0.078, -0.168, -0.084],
          ],
          [
            [0.098, 0.065, 0.015],
            [0.112, -0.005, -0.02],
            [0.108, -0.085, -0.05],
            [0.092, -0.15, -0.04],
          ],
        ],
        0.019,
        24,
        0.16
      );

      // Smooth S-wavy front shoulder drapes curling forward over chest/collarbone
      // Left front drape
      addCurtain(
        [
          [
            [-0.106, 0.056, 0.012],
            [-0.118, -0.015, 0.042],
            [-0.108, -0.095, 0.088],
            [-0.082, -0.165, 0.112],
          ],
          [
            [-0.096, 0.064, 0.028],
            [-0.108, -0.012, 0.06],
            [-0.094, -0.098, 0.106],
            [-0.066, -0.182, 0.126],
          ],
          [
            [-0.084, 0.062, 0.036],
            [-0.096, -0.018, 0.068],
            [-0.078, -0.102, 0.114],
            [-0.054, -0.168, 0.128],
          ],
        ],
        0.015,
        22,
        0.14
      );
      // Right front drape (flowing over right shoulder onto chest)
      addCurtain(
        [
          [
            [0.084, 0.062, 0.036],
            [0.096, -0.018, 0.068],
            [0.078, -0.102, 0.114],
            [0.052, -0.166, 0.128],
          ],
          [
            [0.096, 0.064, 0.028],
            [0.108, -0.012, 0.06],
            [0.094, -0.098, 0.106],
            [0.064, -0.18, 0.126],
          ],
          [
            [0.106, 0.056, 0.012],
            [0.118, -0.015, 0.042],
            [0.108, -0.095, 0.088],
            [0.082, -0.16, 0.11],
          ],
        ],
        0.015,
        22,
        0.14
      );
      break;
    }
    case 'sleek_bob': {
      for (const side of [-1, 1]) {
        const crownLobe = new THREE.Mesh(new THREE.SphereGeometry(0.08, 20, 14), hairMat);
        crownLobe.scale.set(0.86, 0.66, 1.04);
        crownLobe.position.set(side * 0.032, 0.092, -0.004);
        headGroup.add(crownLobe);
      }
      // Soft wispy bangs
      addRibbon(
        [
          [-0.018, 0.118, 0.066],
          [0.01, 0.092, 0.098],
          [0.046, 0.068, 0.094],
          [0.076, 0.042, 0.07],
        ],
        0.018,
        0.0055,
        18,
        0.74,
        0.14
      );
      addRibbon(
        [
          [-0.026, 0.114, 0.062],
          [-0.048, 0.088, 0.09],
          [-0.06, 0.062, 0.09],
        ],
        0.014,
        0.005,
        14,
        0.7,
        0.14
      );
      // Continuous inward-curled chin-length bob curtain
      addCurtain(
        [
          [
            [-0.094, 0.064, 0.034],
            [-0.108, 0.012, 0.032],
            [-0.094, -0.052, 0.024],
          ],
          [
            [-0.086, 0.078, -0.024],
            [-0.102, 0.016, -0.032],
            [-0.084, -0.058, -0.024],
          ],
          [
            [-0.045, 0.092, -0.078],
            [-0.052, 0.022, -0.102],
            [-0.044, -0.06, -0.084],
          ],
          [
            [0.0, 0.094, -0.092],
            [0.0, 0.024, -0.112],
            [0.0, -0.062, -0.092],
          ],
          [
            [0.045, 0.092, -0.078],
            [0.052, 0.022, -0.102],
            [0.044, -0.06, -0.084],
          ],
          [
            [0.086, 0.078, -0.024],
            [0.102, 0.016, -0.032],
            [0.084, -0.058, -0.024],
          ],
          [
            [0.094, 0.064, 0.034],
            [0.108, 0.012, 0.032],
            [0.094, -0.052, 0.024],
          ],
        ],
        0.017,
        18,
        0.16
      );
      break;
    }
    case 'ponytail': {
      const sleekTop = new THREE.Mesh(new THREE.SphereGeometry(0.084, 20, 14), hairMat);
      sleekTop.scale.set(0.95, 0.48, 1.02);
      sleekTop.position.set(0, 0.11, -0.004);
      headGroup.add(sleekTop);

      // Cute wispy bangs + delicate cheek curls
      for (const side of [-1, 1]) {
        addRibbon(
          [
            [side * 0.012, 0.116, 0.066],
            [side * 0.024, 0.09, 0.096],
            [side * 0.026, 0.062, 0.098],
          ],
          0.012,
          0.0045,
          14,
          0.7,
          0.12
        );
        addRibbon(
          [
            [side * 0.068, 0.068, 0.056],
            [side * 0.088, 0.036, 0.052],
            [side * 0.08, 0.002, 0.046],
          ],
          0.008,
          0.004,
          12,
          0.65,
          0.12
        );
      }

      const scrunchie = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.009, 10, 18), accentMat);
      scrunchie.position.set(0, 0.062, -0.098);
      scrunchie.rotation.x = 0.48;
      headGroup.add(scrunchie);

      // Wide sculpted flowing ponytail curtain sheet (no separate worm sticks)
      addCurtain(
        [
          [
            [-0.014, 0.062, -0.098],
            [-0.042, 0.044, -0.145],
            [-0.046, -0.03, -0.16],
            [-0.024, -0.132, -0.13],
          ],
          [
            [0.0, 0.066, -0.1],
            [0.0, 0.048, -0.152],
            [0.0, -0.032, -0.168],
            [0.0, -0.148, -0.135],
          ],
          [
            [0.014, 0.062, -0.098],
            [0.042, 0.044, -0.145],
            [0.046, -0.03, -0.16],
            [0.024, -0.132, -0.13],
          ],
        ],
        0.017,
        20,
        0.14
      );
      break;
    }
    case 'chignon': {
      const chignonCrown = new THREE.Mesh(new THREE.SphereGeometry(0.084, 20, 14), hairMat);
      chignonCrown.scale.set(0.95, 0.48, 1.02);
      chignonCrown.position.set(0, 0.11, -0.004);
      headGroup.add(chignonCrown);

      for (const side of [-1, 1]) {
        addRibbon(
          [
            [side * 0.014, 0.116, 0.066],
            [side * 0.036, 0.09, 0.092],
            [side * 0.056, 0.066, 0.086],
          ],
          0.013,
          0.0045,
          14,
          0.7,
          0.12
        );
        addRibbon(
          [
            [side * 0.068, 0.068, 0.056],
            [side * 0.086, 0.038, 0.05],
            [side * 0.078, 0.008, 0.042],
          ],
          0.008,
          0.004,
          12,
          0.6,
          0.12
        );
      }

      const bunGroup = new THREE.Group();
      bunGroup.position.set(0, 0.02, -0.106);

      const bunCore = new THREE.Mesh(new THREE.SphereGeometry(0.042, 18, 14), hairMat);
      bunCore.scale.set(1.12, 0.94, 0.84);
      bunCore.castShadow = true;
      bunGroup.add(bunCore);

      const bunCoil = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.014, 10, 22), hairMat);
      bunCoil.scale.set(1.08, 0.95, 0.85);
      bunCoil.position.z = -0.008;
      bunCoil.castShadow = true;
      bunGroup.add(bunCoil);

      const pinStick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0024, 0.0018, 0.115, 8),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.22, metalness: 0.88 })
      );
      pinStick.rotation.z = 0.62;
      pinStick.position.set(0, 0.006, -0.012);
      bunGroup.add(pinStick);

      const pinGem = new THREE.Mesh(new THREE.SphereGeometry(0.0065, 10, 10), accentMat);
      pinGem.position.set(-0.033, 0.052, -0.012);
      bunGroup.add(pinGem);

      headGroup.add(bunGroup);
      break;
    }
    case 'quiff': {
      const crownPad = new THREE.Mesh(new THREE.SphereGeometry(0.084, 20, 14), hairMat);
      crownPad.scale.set(0.95, 0.52, 1.03);
      crownPad.position.set(0.004, 0.112, 0.006);
      crownPad.castShadow = true;
      headGroup.add(crownPad);

      // Overlapping flat sculpted quiff sweep ribbons
      addCurtain(
        [
          [
            [-0.054, 0.092, 0.06],
            [-0.052, 0.122, 0.072],
            [-0.04, 0.132, 0.032],
            [-0.025, 0.118, -0.028],
          ],
          [
            [-0.018, 0.088, 0.078],
            [-0.012, 0.128, 0.092],
            [0.0, 0.144, 0.052],
            [0.012, 0.126, -0.022],
          ],
          [
            [0.022, 0.088, 0.076],
            [0.03, 0.126, 0.086],
            [0.038, 0.138, 0.045],
            [0.042, 0.118, -0.025],
          ],
          [
            [0.056, 0.088, 0.056],
            [0.064, 0.114, 0.058],
            [0.064, 0.12, 0.018],
            [0.056, 0.102, -0.04],
          ],
        ],
        0.014,
        16,
        0.24
      );
      break;
    }
    case 'comma': {
      for (const side of [-1, 1]) {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.078, 20, 14), hairMat);
        dome.scale.set(0.86, 0.62, 1.02);
        dome.position.set(side * 0.03, 0.096, 0.0);
        headGroup.add(dome);
      }
      // Signature flat sculpted comma C-bang + opposite sweep
      addRibbon(
        [
          [-0.012, 0.122, 0.052],
          [-0.046, 0.104, 0.084],
          [-0.058, 0.076, 0.092],
          [-0.04, 0.058, 0.094],
          [-0.018, 0.055, 0.092],
        ],
        0.022,
        0.0065,
        20,
        0.78,
        0.16
      );
      addRibbon(
        [
          [0.004, 0.122, 0.054],
          [0.038, 0.102, 0.084],
          [0.064, 0.074, 0.078],
          [0.078, 0.048, 0.05],
        ],
        0.022,
        0.0065,
        18,
        0.76,
        0.16
      );
      break;
    }
    case 'slick': {
      const sleekCrown = new THREE.Mesh(new THREE.SphereGeometry(0.086, 20, 14), hairMat);
      sleekCrown.scale.set(0.95, 0.48, 1.05);
      sleekCrown.position.set(0, 0.108, -0.002);
      headGroup.add(sleekCrown);

      addCurtain(
        [
          [
            [-0.054, 0.08, 0.064],
            [-0.064, 0.114, 0.042],
            [-0.064, 0.116, -0.015],
            [-0.052, 0.062, -0.086],
          ],
          [
            [-0.02, 0.088, 0.078],
            [-0.022, 0.128, 0.056],
            [-0.02, 0.128, -0.01],
            [-0.018, 0.058, -0.096],
          ],
          [
            [0.02, 0.088, 0.078],
            [0.022, 0.128, 0.056],
            [0.02, 0.128, -0.01],
            [0.018, 0.058, -0.096],
          ],
          [
            [0.054, 0.08, 0.064],
            [0.064, 0.114, 0.042],
            [0.064, 0.116, -0.015],
            [0.052, 0.062, -0.086],
          ],
        ],
        0.014,
        18,
        0.22
      );
      break;
    }
    case 'crop': {
      const cropCrown = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 14), hairMat);
      cropCrown.scale.set(0.95, 0.44, 1.02);
      cropCrown.position.set(0, 0.106, 0.004);
      headGroup.add(cropCrown);

      for (const bx of [-0.046, -0.018, 0.012, 0.042]) {
        addRibbon(
          [
            [bx, 0.112, 0.058],
            [bx * 1.04, 0.086, 0.09],
            [bx * 1.02, 0.06, 0.094],
          ],
          0.017,
          0.0055,
          12,
          0.74,
          0.18
        );
      }
      break;
    }
    case 'wolf_layer': {
      // Voluminous soft crown lobes
      for (const side of [-1, 1]) {
        const crownLobe = new THREE.Mesh(new THREE.SphereGeometry(0.083, 20, 14), hairMat);
        crownLobe.scale.set(0.88, 0.68, 1.06);
        crownLobe.position.set(side * 0.032, 0.096, -0.004);
        crownLobe.castShadow = true;
        headGroup.add(crownLobe);
      }
      // Face-framing curtain bangs curving gently around cheekbones
      for (const side of [-1, 1]) {
        addRibbon(
          [
            [side * 0.008, 0.12, 0.064],
            [side * 0.04, 0.096, 0.092],
            [side * 0.068, 0.064, 0.086],
            [side * 0.088, 0.024, 0.064],
            [side * 0.096, -0.025, 0.044],
          ],
          0.018,
          0.0058,
          18,
          0.74,
          0.14
        );
        // Lighter inner fringe wisp
        addRibbon(
          [
            [side * 0.012, 0.118, 0.068],
            [side * 0.022, 0.09, 0.098],
            [side * 0.026, 0.064, 0.1],
          ],
          0.011,
          0.0042,
          12,
          0.7,
          0.12
        );
      }
      // Layered wolf-cut back curtain with feathered outward flare at shoulder tips
      addCurtain(
        [
          [
            [-0.096, 0.064, 0.016],
            [-0.114, -0.004, -0.018],
            [-0.112, -0.072, -0.044],
            [-0.122, -0.124, -0.02],
          ],
          [
            [-0.074, 0.086, -0.044],
            [-0.092, 0.012, -0.09],
            [-0.094, -0.068, -0.104],
            [-0.098, -0.136, -0.086],
          ],
          [
            [-0.036, 0.098, -0.082],
            [-0.046, 0.018, -0.114],
            [-0.048, -0.072, -0.124],
            [-0.046, -0.148, -0.106],
          ],
          [
            [0.0, 0.1, -0.092],
            [0.0, 0.02, -0.12],
            [0.0, -0.076, -0.13],
            [0.0, -0.154, -0.114],
          ],
          [
            [0.036, 0.098, -0.082],
            [0.046, 0.018, -0.114],
            [0.048, -0.072, -0.124],
            [0.046, -0.148, -0.106],
          ],
          [
            [0.074, 0.086, -0.044],
            [0.092, 0.012, -0.09],
            [0.094, -0.068, -0.104],
            [0.098, -0.136, -0.086],
          ],
          [
            [0.096, 0.064, 0.016],
            [0.114, -0.004, -0.018],
            [0.112, -0.072, -0.044],
            [0.122, -0.124, -0.02],
          ],
        ],
        0.018,
        22,
        0.16
      );
      break;
    }
    case 'half_up': {
      // Smooth crown + half-up top gather with accent clip & lower flowing hair
      for (const side of [-1, 1]) {
        const crownLobe = new THREE.Mesh(new THREE.SphereGeometry(0.08, 20, 14), hairMat);
        crownLobe.scale.set(0.86, 0.62, 1.04);
        crownLobe.position.set(side * 0.03, 0.094, -0.004);
        headGroup.add(crownLobe);

        // Soft cheek tendrils + wispy bangs
        addRibbon(
          [
            [side * 0.014, 0.116, 0.066],
            [side * 0.028, 0.09, 0.096],
            [side * 0.032, 0.062, 0.096],
          ],
          0.011,
          0.0044,
          12,
          0.7,
          0.12
        );
        addRibbon(
          [
            [side * 0.066, 0.068, 0.056],
            [side * 0.088, 0.034, 0.054],
            [side * 0.082, -0.012, 0.05],
          ],
          0.009,
          0.0042,
          14,
          0.68,
          0.12
        );
      }

      // Accent ribbon clip on upper back crown
      const halfTie = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0085, 8, 18), accentMat);
      halfTie.position.set(0, 0.082, -0.094);
      halfTie.rotation.x = 0.58;
      headGroup.add(halfTie);

      // Upper half-ponytail drape overlapping the smooth lower hair curtain
      addCurtain(
        [
          [
            [-0.014, 0.08, -0.094],
            [-0.038, 0.058, -0.14],
            [-0.04, -0.015, -0.152],
            [-0.024, -0.102, -0.132],
          ],
          [
            [0.0, 0.084, -0.096],
            [0.0, 0.062, -0.148],
            [0.0, -0.018, -0.16],
            [0.0, -0.114, -0.138],
          ],
          [
            [0.014, 0.08, -0.094],
            [0.038, 0.058, -0.14],
            [0.04, -0.015, -0.152],
            [0.024, -0.102, -0.132],
          ],
        ],
        0.015,
        18,
        0.15
      );

      // Lower smooth back curtain
      addCurtain(
        [
          [
            [-0.092, 0.046, 0.014],
            [-0.104, -0.02, -0.024],
            [-0.096, -0.1, -0.05],
            [-0.084, -0.164, -0.042],
          ],
          [
            [-0.048, 0.056, -0.072],
            [-0.054, -0.015, -0.104],
            [-0.05, -0.1, -0.114],
            [-0.042, -0.172, -0.102],
          ],
          [
            [0.0, 0.058, -0.088],
            [0.0, -0.015, -0.112],
            [0.0, -0.1, -0.122],
            [0.0, -0.176, -0.108],
          ],
          [
            [0.048, 0.056, -0.072],
            [0.054, -0.015, -0.104],
            [0.05, -0.1, -0.114],
            [0.042, -0.172, -0.102],
          ],
          [
            [0.092, 0.046, 0.014],
            [0.104, -0.02, -0.024],
            [0.096, -0.1, -0.05],
            [0.084, -0.164, -0.042],
          ],
        ],
        0.017,
        20,
        0.16
      );
      break;
    }
    case 'high_bun': {
      const topCap = new THREE.Mesh(new THREE.SphereGeometry(0.084, 20, 14), hairMat);
      topCap.scale.set(0.95, 0.48, 1.02);
      topCap.position.set(0, 0.11, -0.004);
      headGroup.add(topCap);

      // Cute wispy side bangs & temple curls
      for (const side of [-1, 1]) {
        addRibbon(
          [
            [side * 0.012, 0.116, 0.066],
            [side * 0.03, 0.088, 0.096],
            [side * 0.042, 0.062, 0.094],
          ],
          0.012,
          0.0045,
          14,
          0.7,
          0.12
        );
        addRibbon(
          [
            [side * 0.068, 0.068, 0.056],
            [side * 0.086, 0.036, 0.052],
            [side * 0.078, 0.004, 0.046],
          ],
          0.0085,
          0.004,
          12,
          0.65,
          0.12
        );
      }

      // Elevated modern top-back bun + accent scrunchie
      const highBunGroup = new THREE.Group();
      highBunGroup.position.set(0, 0.132, -0.055);
      highBunGroup.rotation.x = -0.38;

      const bunRing = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 10, 20), accentMat);
      bunRing.rotation.x = Math.PI / 2;
      bunRing.position.y = -0.016;
      highBunGroup.add(bunRing);

      const bunSphere = new THREE.Mesh(new THREE.SphereGeometry(0.044, 18, 14), hairMat);
      bunSphere.scale.set(1.08, 0.86, 1.05);
      bunSphere.position.y = 0.008;
      bunSphere.castShadow = true;
      highBunGroup.add(bunSphere);

      const bunWrap = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.013, 10, 22), hairMat);
      bunWrap.rotation.x = Math.PI / 2 + 0.18;
      bunWrap.position.y = 0.002;
      bunWrap.castShadow = true;
      highBunGroup.add(bunWrap);

      headGroup.add(highBunGroup);
      break;
    }
    case 'two_block': {
      // Voluminous modern K-style two-block parted top with soft textured bangs
      for (const side of [-1, 1]) {
        const topVol = new THREE.Mesh(new THREE.SphereGeometry(0.082, 20, 14), hairMat);
        topVol.scale.set(0.88, 0.62, 1.06);
        topVol.position.set(side * 0.028, 0.098, 0.004);
        topVol.castShadow = true;
        headGroup.add(topVol);
      }
      // 60/40 natural parted front layers
      const tbStrands: Array<{ pts: Array<[number, number, number]>; w: number }> = [
        {
          pts: [
            [-0.018, 0.122, 0.052],
            [-0.04, 0.098, 0.088],
            [-0.046, 0.068, 0.096],
          ],
          w: 0.017,
        },
        {
          pts: [
            [-0.034, 0.116, 0.048],
            [-0.062, 0.088, 0.08],
            [-0.072, 0.058, 0.074],
          ],
          w: 0.015,
        },
        {
          pts: [
            [-0.004, 0.122, 0.056],
            [0.018, 0.096, 0.092],
            [0.022, 0.064, 0.098],
          ],
          w: 0.018,
        },
        {
          pts: [
            [0.016, 0.12, 0.054],
            [0.046, 0.094, 0.086],
            [0.056, 0.064, 0.088],
          ],
          w: 0.017,
        },
        {
          pts: [
            [0.036, 0.112, 0.046],
            [0.066, 0.086, 0.076],
            [0.076, 0.056, 0.068],
          ],
          w: 0.014,
        },
      ];
      tbStrands.forEach((s) => addRibbon(s.pts, s.w, 0.0058, 16, 0.76, 0.16));
      break;
    }
    case 'curtain_middle': {
      // Classic 50/50 parted flowing curtain waves
      for (const side of [-1, 1]) {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.08, 20, 14), hairMat);
        dome.scale.set(0.86, 0.62, 1.04);
        dome.position.set(side * 0.032, 0.096, -0.002);
        dome.castShadow = true;
        headGroup.add(dome);

        addRibbon(
          [
            [side * 0.004, 0.124, 0.05],
            [side * 0.038, 0.102, 0.086],
            [side * 0.064, 0.072, 0.088],
            [side * 0.076, 0.044, 0.066],
          ],
          0.022,
          0.0064,
          18,
          0.78,
          0.16
        );
        addRibbon(
          [
            [side * 0.022, 0.116, 0.044],
            [side * 0.058, 0.09, 0.074],
            [side * 0.082, 0.056, 0.062],
          ],
          0.016,
          0.0052,
          14,
          0.74,
          0.16
        );
      }
      break;
    }
    case 'pompadour': {
      // Bold sculpted upward-swept classic pompadour crest
      const pompBase = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 14), hairMat);
      pompBase.scale.set(0.92, 0.54, 1.04);
      pompBase.position.set(0, 0.114, 0.006);
      pompBase.castShadow = true;
      headGroup.add(pompBase);

      addCurtain(
        [
          [
            [-0.048, 0.09, 0.062],
            [-0.052, 0.132, 0.084],
            [-0.042, 0.146, 0.042],
            [-0.03, 0.122, -0.036],
          ],
          [
            [-0.016, 0.092, 0.078],
            [-0.016, 0.144, 0.102],
            [-0.006, 0.16, 0.058],
            [0.0, 0.13, -0.032],
          ],
          [
            [0.018, 0.092, 0.078],
            [0.02, 0.144, 0.102],
            [0.014, 0.16, 0.056],
            [0.014, 0.128, -0.032],
          ],
          [
            [0.05, 0.088, 0.06],
            [0.056, 0.128, 0.08],
            [0.048, 0.14, 0.038],
            [0.038, 0.118, -0.04],
          ],
        ],
        0.017,
        18,
        0.22
      );
      break;
    }
    case 'side_sweep_long': {
      // Sleek asymmetric side-part crown (inspired by neat corporate side-swept long straight hair)
      const leftCrown = new THREE.Mesh(new THREE.SphereGeometry(0.084, 22, 16), hairMat);
      leftCrown.scale.set(0.92, 0.66, 1.05);
      leftCrown.position.set(-0.028, 0.094, -0.004);
      leftCrown.castShadow = true;
      headGroup.add(leftCrown);

      const rightCrown = new THREE.Mesh(new THREE.SphereGeometry(0.076, 20, 14), hairMat);
      rightCrown.scale.set(0.84, 0.6, 1.02);
      rightCrown.position.set(0.036, 0.092, -0.004);
      rightCrown.castShadow = true;
      headGroup.add(rightCrown);

      // Sweeping diagonal side-part bang curving cleanly across upper forehead
      addRibbon(
        [
          [0.034, 0.118, 0.064],
          [-0.006, 0.098, 0.096],
          [-0.048, 0.074, 0.096],
          [-0.084, 0.042, 0.07],
          [-0.094, 0.004, 0.042],
        ],
        0.022,
        0.0062,
        20,
        0.78,
        0.16
      );
      addRibbon(
        [
          [0.03, 0.114, 0.068],
          [0.002, 0.09, 0.098],
          [-0.028, 0.068, 0.101],
        ],
        0.014,
        0.0048,
        14,
        0.72,
        0.14
      );
      // Neat opposite side-part strand tucked cleanly behind right ear
      addRibbon(
        [
          [0.038, 0.114, 0.062],
          [0.072, 0.086, 0.08],
          [0.092, 0.046, 0.048],
          [0.095, 0.008, 0.014],
        ],
        0.016,
        0.0052,
        16,
        0.74,
        0.16
      );

      // Sleek straight long back curtain falling cleanly past shoulders
      addCurtain(
        [
          [
            [-0.098, 0.062, 0.018],
            [-0.106, -0.015, -0.014],
            [-0.102, -0.095, -0.038],
            [-0.092, -0.175, -0.034],
          ],
          [
            [-0.072, 0.086, -0.042],
            [-0.082, 0.004, -0.084],
            [-0.084, -0.088, -0.094],
            [-0.076, -0.18, -0.082],
          ],
          [
            [-0.036, 0.096, -0.082],
            [-0.042, 0.012, -0.108],
            [-0.044, -0.09, -0.116],
            [-0.038, -0.184, -0.104],
          ],
          [
            [0.0, 0.098, -0.092],
            [0.0, 0.014, -0.114],
            [0.0, -0.092, -0.122],
            [0.0, -0.186, -0.11],
          ],
          [
            [0.036, 0.096, -0.082],
            [0.042, 0.012, -0.108],
            [0.044, -0.09, -0.116],
            [0.038, -0.184, -0.104],
          ],
          [
            [0.072, 0.086, -0.042],
            [0.082, 0.004, -0.084],
            [0.084, -0.088, -0.094],
            [0.076, -0.18, -0.082],
          ],
          [
            [0.098, 0.062, 0.018],
            [0.106, -0.015, -0.014],
            [0.102, -0.095, -0.038],
            [0.092, -0.175, -0.034],
          ],
        ],
        0.017,
        24,
        0.14
      );

      // Sleek straight front shoulder strands
      for (const side of [-1, 1]) {
        addCurtain(
          [
            [
              [side * 0.098, 0.054, 0.016],
              [side * 0.11, -0.02, 0.044],
              [side * 0.096, -0.098, 0.084],
              [side * 0.074, -0.168, 0.104],
            ],
            [
              [side * 0.086, 0.058, 0.032],
              [side * 0.098, -0.02, 0.06],
              [side * 0.08, -0.1, 0.098],
              [side * 0.058, -0.172, 0.114],
            ],
          ],
          0.013,
          20,
          0.14
        );
      }
      break;
    }
    case 'hime_bangs': {
      // Soft rounded crown lobes + cute full see-through bangs + hime cheek locks
      for (const side of [-1, 1]) {
        const crownLobe = new THREE.Mesh(new THREE.SphereGeometry(0.082, 22, 16), hairMat);
        crownLobe.scale.set(0.88, 0.66, 1.05);
        crownLobe.position.set(side * 0.03, 0.094, -0.004);
        crownLobe.castShadow = true;
        headGroup.add(crownLobe);
      }

      // Airy full straight-across bangs right above eyebrows
      const fullBangs: Array<{ pts: Array<[number, number, number]>; w: number }> = [
        {
          pts: [
            [-0.046, 0.112, 0.058],
            [-0.054, 0.086, 0.09],
            [-0.056, 0.06, 0.092],
          ],
          w: 0.014,
        },
        {
          pts: [
            [-0.022, 0.118, 0.066],
            [-0.026, 0.092, 0.098],
            [-0.026, 0.062, 0.103],
          ],
          w: 0.015,
        },
        {
          pts: [
            [0.0, 0.12, 0.068],
            [0.0, 0.092, 0.101],
            [0.0, 0.061, 0.105],
          ],
          w: 0.015,
        },
        {
          pts: [
            [0.022, 0.118, 0.066],
            [0.026, 0.092, 0.098],
            [0.026, 0.062, 0.103],
          ],
          w: 0.015,
        },
        {
          pts: [
            [0.046, 0.112, 0.058],
            [0.054, 0.086, 0.09],
            [0.056, 0.06, 0.092],
          ],
          w: 0.014,
        },
      ];
      fullBangs.forEach((b) => addRibbon(b.pts, b.w, 0.005, 14, 0.74, 0.16));

      // Signature straight hime-cut cheek locks framing jawline
      for (const side of [-1, 1]) {
        addRibbon(
          [
            [side * 0.072, 0.084, 0.044],
            [side * 0.092, 0.036, 0.062],
            [side * 0.094, -0.016, 0.064],
            [side * 0.084, -0.062, 0.058],
          ],
          0.019,
          0.0064,
          18,
          0.78,
          0.22
        );
      }

      // Smooth long back hair curtain with gentle curled hem
      addCurtain(
        [
          [
            [-0.098, 0.064, 0.016],
            [-0.108, -0.008, -0.018],
            [-0.104, -0.088, -0.042],
            [-0.09, -0.162, -0.032],
          ],
          [
            [-0.068, 0.088, -0.048],
            [-0.08, 0.01, -0.088],
            [-0.082, -0.084, -0.098],
            [-0.07, -0.172, -0.082],
          ],
          [
            [-0.032, 0.098, -0.084],
            [-0.038, 0.016, -0.11],
            [-0.04, -0.086, -0.118],
            [-0.034, -0.178, -0.098],
          ],
          [
            [0.0, 0.1, -0.092],
            [0.0, 0.018, -0.116],
            [0.0, -0.088, -0.124],
            [0.0, -0.18, -0.104],
          ],
          [
            [0.032, 0.098, -0.084],
            [0.038, 0.016, -0.11],
            [0.04, -0.086, -0.118],
            [0.034, -0.178, -0.098],
          ],
          [
            [0.068, 0.088, -0.048],
            [0.08, 0.01, -0.088],
            [0.082, -0.084, -0.098],
            [0.07, -0.172, -0.082],
          ],
          [
            [0.098, 0.064, 0.016],
            [0.108, -0.008, -0.018],
            [0.104, -0.088, -0.042],
            [0.09, -0.162, -0.032],
          ],
        ],
        0.018,
        24,
        0.16
      );
      break;
    }
    case 'low_twintail': {
      // Cute parted crown + airy wispy bangs + bouncy wavy low twin-tails over shoulders
      for (const side of [-1, 1]) {
        const crownLobe = new THREE.Mesh(new THREE.SphereGeometry(0.081, 20, 14), hairMat);
        crownLobe.scale.set(0.86, 0.65, 1.04);
        crownLobe.position.set(side * 0.034, 0.093, -0.004);
        crownLobe.castShadow = true;
        headGroup.add(crownLobe);

        // Airy wispy bangs
        addRibbon(
          [
            [side * 0.012, 0.118, 0.068],
            [side * 0.02, 0.094, 0.097],
            [side * 0.022, 0.066, 0.102],
          ],
          0.012,
          0.0045,
          14,
          0.7,
          0.12
        );
        addRibbon(
          [
            [side * 0.03, 0.114, 0.062],
            [side * 0.056, 0.088, 0.088],
            [side * 0.064, 0.058, 0.086],
          ],
          0.013,
          0.0046,
          14,
          0.7,
          0.12
        );

        // Cute accent scrunchie behind/below each ear
        const tie = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.0075, 8, 16), accentMat);
        tie.position.set(side * 0.086, -0.014, -0.038);
        tie.rotation.y = side * 0.72;
        tie.rotation.x = 0.35;
        headGroup.add(tie);

        // Bouncy wavy low twin-tail cascading forward over shoulder
        addCurtain(
          [
            [
              [side * 0.078, -0.012, -0.044],
              [side * 0.104, -0.062, 0.008],
              [side * 0.092, -0.132, 0.072],
              [side * 0.066, -0.184, 0.104],
            ],
            [
              [side * 0.088, -0.014, -0.036],
              [side * 0.12, -0.068, 0.022],
              [side * 0.11, -0.138, 0.088],
              [side * 0.082, -0.194, 0.118],
            ],
            [
              [side * 0.096, -0.018, -0.026],
              [side * 0.116, -0.074, 0.034],
              [side * 0.1, -0.142, 0.096],
              [side * 0.076, -0.186, 0.122],
            ],
          ],
          0.015,
          20,
          0.14
        );
      }
      break;
    }
    case 'side_braid': {
      // Soft crown + wispy side bangs + woven braid draped forward over right shoulder
      for (const side of [-1, 1]) {
        const crownLobe = new THREE.Mesh(new THREE.SphereGeometry(0.081, 20, 14), hairMat);
        crownLobe.scale.set(0.86, 0.64, 1.04);
        crownLobe.position.set(side * 0.032, 0.093, -0.004);
        crownLobe.castShadow = true;
        headGroup.add(crownLobe);
      }

      // Soft parted front bangs + gentle left cheek tendril
      addRibbon(
        [
          [-0.014, 0.118, 0.066],
          [0.012, 0.092, 0.098],
          [0.046, 0.068, 0.092],
        ],
        0.015,
        0.005,
        14,
        0.72,
        0.14
      );
      addRibbon(
        [
          [-0.02, 0.116, 0.064],
          [-0.046, 0.088, 0.09],
          [-0.064, 0.056, 0.086],
        ],
        0.014,
        0.0048,
        14,
        0.72,
        0.14
      );
      addRibbon(
        [
          [-0.068, 0.066, 0.056],
          [-0.088, 0.03, 0.054],
          [-0.08, -0.012, 0.048],
        ],
        0.0085,
        0.004,
        12,
        0.65,
        0.12
      );

      // Smooth back wrap sweeping gently toward right nape
      addCurtain(
        [
          [
            [-0.082, 0.068, -0.018],
            [-0.068, 0.005, -0.072],
            [-0.008, -0.036, -0.096],
          ],
          [
            [-0.024, 0.092, -0.076],
            [0.008, 0.022, -0.106],
            [0.05, -0.028, -0.082],
          ],
          [
            [0.052, 0.086, -0.056],
            [0.084, 0.018, -0.068],
            [0.088, -0.024, -0.044],
          ],
        ],
        0.015,
        16,
        0.24
      );

      // Sculpted multi-link woven braid cascading over right shoulder
      const braidCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.062, -0.028, -0.064),
        new THREE.Vector3(0.102, -0.065, -0.005),
        new THREE.Vector3(0.098, -0.112, 0.058),
        new THREE.Vector3(0.078, -0.162, 0.096),
      ]);
      const linkCount = 8;
      for (let k = 0; k < linkCount; k++) {
        const t = k / (linkCount - 1);
        const pt = braidCurve.getPointAt(t);
        const sideShift = (k % 2 === 0 ? -1 : 1) * 0.007 * (1 - t * 0.45);
        const r = THREE.MathUtils.lerp(0.021, 0.013, t);
        const link = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), hairMat);
        link.scale.set(1.06, 1.24, 0.88);
        link.position.set(pt.x + sideShift, pt.y, pt.z);
        link.rotation.z = k % 2 === 0 ? 0.36 : -0.36;
        link.castShadow = true;
        headGroup.add(link);
      }

      // Accent hair tie + tapered braid tip
      const braidTie = new THREE.Mesh(new THREE.TorusGeometry(0.013, 0.0045, 8, 16), accentMat);
      braidTie.position.set(0.076, -0.166, 0.098);
      braidTie.rotation.x = Math.PI / 2 - 0.3;
      headGroup.add(braidTie);

      addRibbon(
        [
          [0.078, -0.162, 0.096],
          [0.072, -0.184, 0.108],
          [0.066, -0.204, 0.114],
        ],
        0.013,
        0.006,
        10,
        0.85,
        0.12
      );
      break;
    }
    case 'side_part': {
      // Neat corporate male side-parted swept hair (matches office male reference)
      const leftCrown = new THREE.Mesh(new THREE.SphereGeometry(0.083, 20, 14), hairMat);
      leftCrown.scale.set(0.92, 0.56, 1.04);
      leftCrown.position.set(-0.022, 0.104, 0.004);
      leftCrown.castShadow = true;
      headGroup.add(leftCrown);

      const rightCrown = new THREE.Mesh(new THREE.SphereGeometry(0.076, 20, 14), hairMat);
      rightCrown.scale.set(0.84, 0.5, 1.01);
      rightCrown.position.set(0.032, 0.1, 0.002);
      rightCrown.castShadow = true;
      headGroup.add(rightCrown);

      // Clean swept layered side-part bang across upper forehead
      addCurtain(
        [
          [
            [-0.036, 0.118, 0.056],
            [0.004, 0.1, 0.09],
            [0.044, 0.078, 0.09],
            [0.074, 0.054, 0.062],
          ],
          [
            [-0.022, 0.124, 0.052],
            [0.016, 0.112, 0.084],
            [0.054, 0.092, 0.08],
            [0.078, 0.064, 0.05],
          ],
        ],
        0.012,
        16,
        0.2
      );
      addRibbon(
        [
          [-0.038, 0.114, 0.052],
          [-0.064, 0.088, 0.074],
          [-0.078, 0.056, 0.056],
        ],
        0.015,
        0.0052,
        14,
        0.74,
        0.16
      );
      break;
    }
    case 'textured_fringe': {
      // Soft Korean/anime textured male fringe with fluffy rounded crown
      const fringeCrown = new THREE.Mesh(new THREE.SphereGeometry(0.086, 20, 14), hairMat);
      fringeCrown.scale.set(0.96, 0.52, 1.04);
      fringeCrown.position.set(0, 0.106, 0.004);
      fringeCrown.castShadow = true;
      headGroup.add(fringeCrown);

      const fringeLocks: Array<{ pts: Array<[number, number, number]>; w: number }> = [
        {
          pts: [
            [-0.048, 0.114, 0.052],
            [-0.064, 0.084, 0.08],
            [-0.068, 0.056, 0.078],
          ],
          w: 0.015,
        },
        {
          pts: [
            [-0.024, 0.118, 0.058],
            [-0.032, 0.088, 0.09],
            [-0.028, 0.06, 0.095],
          ],
          w: 0.016,
        },
        {
          pts: [
            [-0.002, 0.12, 0.062],
            [0.002, 0.09, 0.095],
            [-0.004, 0.06, 0.098],
          ],
          w: 0.015,
        },
        {
          pts: [
            [0.022, 0.118, 0.058],
            [0.032, 0.088, 0.09],
            [0.03, 0.062, 0.094],
          ],
          w: 0.016,
        },
        {
          pts: [
            [0.046, 0.114, 0.052],
            [0.064, 0.084, 0.08],
            [0.068, 0.056, 0.076],
          ],
          w: 0.015,
        },
      ];
      fringeLocks.forEach((f) => addRibbon(f.pts, f.w, 0.0054, 14, 0.74, 0.16));
      break;
    }
    case 'wavy_curl': {
      // Soft voluminous wavy curls across crown & playful parted front waves
      for (const [cx, cy, cz, rx, ry, rz] of [
        [-0.032, 0.108, 0.016, 0.054, 0.044, 0.058],
        [0.03, 0.11, 0.012, 0.054, 0.046, 0.058],
        [0.0, 0.118, -0.022, 0.062, 0.044, 0.06],
        [-0.048, 0.092, -0.018, 0.046, 0.042, 0.052],
        [0.048, 0.092, -0.018, 0.046, 0.042, 0.052],
      ]) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), hairMat);
        puff.scale.set(rx, ry, rz);
        puff.position.set(cx, cy, cz);
        puff.castShadow = true;
        headGroup.add(puff);
      }

      for (const side of [-1, 1]) {
        addRibbon(
          [
            [side * 0.008, 0.122, 0.052],
            [side * 0.034, 0.096, 0.09],
            [side * 0.028, 0.072, 0.096],
            [side * 0.048, 0.056, 0.086],
          ],
          0.017,
          0.006,
          16,
          0.76,
          0.16
        );
        addRibbon(
          [
            [side * 0.034, 0.114, 0.042],
            [side * 0.066, 0.088, 0.074],
            [side * 0.078, 0.058, 0.062],
          ],
          0.015,
          0.0052,
          14,
          0.74,
          0.16
        );
      }
      break;
    }
  }

  // Stylish slim office eyeglasses
  if (opts.glasses) {
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.25,
      metalness: 0.8,
    });
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.18,
      roughness: 0.08,
      metalness: 0.1,
    });
    const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.018, 8), frameMat);
    bridge.rotation.z = Math.PI / 2;
    bridge.position.set(0, 0.025, 0.103);
    headGroup.add(bridge);

    for (const gx of [-0.03, 0.03]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.0175, 0.0024, 6, 18), frameMat);
      rim.scale.set(1.16, 0.84, 1);
      rim.position.set(gx, 0.024, 0.101);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.0165, 16), lensMat);
      lens.scale.set(1.12, 0.82, 1);
      lens.position.set(gx, 0.024, 0.101);
      const sideArm = new THREE.Mesh(new THREE.BoxGeometry(0.0025, 0.003, 0.075), frameMat);
      sideArm.position.set(gx + (gx < 0 ? -0.021 : 0.021), 0.026, 0.064);
      headGroup.add(rim, lens, sideArm);
    }
  }

  // Sleek IT Comms Headset (clears hair crown cleanly)
  if (opts.headset) {
    const hsBandMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.65,
    });
    const headband = new THREE.Mesh(
      new THREE.TorusGeometry(0.114, 0.006, 8, 28, Math.PI),
      hsBandMat
    );
    headband.position.set(0, 0.04, -0.004);
    headband.rotation.y = Math.PI / 2;
    headband.rotation.z = 0.05;
    headGroup.add(headband);

    const earPad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.016, 16),
      hsBandMat
    );
    earPad.rotation.z = Math.PI / 2;
    earPad.position.set(female ? -0.097 : -0.104, 0.016, -0.004);
    headGroup.add(earPad);

    const earGlowRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.017, 0.003, 6, 16),
      accentMat
    );
    earGlowRing.rotation.y = Math.PI / 2;
    earGlowRing.position.set(female ? -0.105 : -0.112, 0.016, -0.004);
    headGroup.add(earGlowRing);

    const micArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0022, 0.0022, 0.08, 6),
      hsBandMat
    );
    micArm.rotation.x = Math.PI / 2 - 0.32;
    micArm.rotation.z = -0.22;
    micArm.position.set(female ? -0.088 : -0.094, -0.005, 0.036);
    headGroup.add(micArm);

    const micTip = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 8), accentMat);
    micTip.position.set(female ? -0.072 : -0.078, -0.02, 0.072);
    headGroup.add(micTip);
  }

  return headGroup;
}

export function buildHumanCharacter(opts: HumanBodyStyle & { seated?: boolean }): BuiltHumanRig {
  const geoms = getOrganicHumanGeometries();
  const group = new THREE.Group();
  const female = Boolean(opts.female);
  const outfit: OfficeOutfitStyle =
    opts.outfitStyle ?? (female ? 'blazer_blouse' : 'suit_tie');

  const isTechJacket = outfit === 'tech_jacket';
  const isHoodie = outfit === 'street_hoodie';
  const isSmartVest = outfit === 'smart_vest';
  const hasOuterJacket =
    outfit === 'suit_tie' ||
    outfit === 'blazer_blouse' ||
    outfit === 'cardigan_polo' ||
    isTechJacket ||
    isHoodie;
  const hasTailoredLapels =
    outfit === 'suit_tie' || outfit === 'blazer_blouse' || outfit === 'cardigan_polo';
  const hasTie = outfit === 'suit_tie' || outfit === 'shirt_tie';
  const rolledSleeves = outfit === 'shirt_tie' || isSmartVest;

  const accentColorHex = opts.accentHex ?? opts.tieHex ?? 0x38bdf8;
  const blazerColor = opts.overshirtHex ?? (female ? 0x1e293b : 0x1f3a52);
  const pantsColor = opts.pantsHex ?? 0x1e293b;

  const skinMat = new THREE.MeshStandardMaterial({
    color: opts.skinHex ?? 0xedb990,
    roughness: 0.7,
    metalness: 0.0,
  });

  const shirtPattern: FabricPattern = isHoodie ? 'knit' : 'oxford';
  const shirtMat = new THREE.MeshStandardMaterial({
    map: getFabricTexture(opts.shirtHex, shirtPattern),
    roughness: 0.78,
    metalness: 0.01,
  });

  const outerPattern: FabricPattern = isTechJacket
    ? 'techweave'
    : isSmartVest || outfit === 'cardigan_polo'
      ? 'knit'
      : outfit === 'suit_tie'
        ? 'pinstripe'
        : 'twill';
  const blazerMat = new THREE.MeshStandardMaterial({
    map: getFabricTexture(blazerColor, outerPattern, accentColorHex),
    roughness: isTechJacket ? 0.56 : 0.72,
    metalness: isTechJacket ? 0.08 : 0.02,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    map: getFabricTexture(pantsColor, isTechJacket || isHoodie ? 'twill' : 'pinstripe'),
    roughness: 0.78,
    metalness: 0.02,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColorHex,
    emissive: accentColorHex,
    emissiveIntensity: isTechJacket ? 0.28 : 0.08,
    roughness: 0.38,
    metalness: 0.25,
  });

  const hairSheenColor = new THREE.Color(opts.hairHex).lerp(new THREE.Color(0xffffff), 0.28);
  const hairMat = new THREE.MeshPhysicalMaterial({
    map: getHairTexture(opts.hairHex),
    roughness: 0.58,
    metalness: 0.02,
    sheen: 0.3,
    sheenRoughness: 0.52,
    sheenColor: hairSheenColor,
  });

  const shoeUpperMat = new THREE.MeshStandardMaterial({
    color: opts.shoeHex ?? 0x181c24,
    roughness: 0.42,
    metalness: 0.12,
  });
  const soleMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.65,
    metalness: 0.02,
  });
  const beltMat = new THREE.MeshStandardMaterial({
    color: isTechJacket ? 0x1e293b : 0x241a15,
    roughness: 0.48,
    metalness: 0.18,
  });
  const metalTrimMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.22,
    metalness: 0.88,
  });

  const seated = Boolean(opts.seated);
  const hips = new THREE.Group();
  hips.position.y = seated ? 0.56 : 0.86;
  group.add(hips);

  const useSkirt = Boolean(opts.skirt && female && !seated);
  const pelvis = new THREE.Mesh(useSkirt ? geoms.skirt : geoms.pelvis, pantsMat);
  pelvis.scale.set(female ? 0.94 : 1.0, 1.0, 0.68);
  pelvis.castShadow = true;
  hips.add(pelvis);

  // Legs
  let leftLeg: THREE.Group | undefined;
  let rightLeg: THREE.Group | undefined;
  let leftShin: THREE.Group | undefined;
  let rightShin: THREE.Group | undefined;
  const formalShoes =
    outfit === 'suit_tie' ||
    outfit === 'blazer_blouse' ||
    outfit === 'shirt_tie' ||
    outfit === 'smart_blouse';

  for (const sx of [-0.09, 0.09]) {
    const legUpperMat = useSkirt ? skinMat : pantsMat;
    const legLowerMat = useSkirt ? skinMat : pantsMat;
    const legSlenderScale = useSkirt ? 0.8 : 1.0;

    if (seated) {
      const hipCap = new THREE.Mesh(new THREE.SphereGeometry(0.066, 12, 10), pantsMat);
      hipCap.position.set(sx, -0.015, 0.01);
      hips.add(hipCap);

      const thigh = new THREE.Mesh(geoms.thigh, pantsMat);
      thigh.rotation.x = -Math.PI / 2;
      thigh.scale.set(0.95, 0.82, 0.95);
      thigh.position.set(sx, -0.015, 0.01);
      thigh.castShadow = true;
      hips.add(thigh);

      const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.051, 10, 10), pantsMat);
      kneeCap.position.set(sx, -0.02, 0.32);
      hips.add(kneeCap);

      const calf = new THREE.Mesh(geoms.calf, pantsMat);
      calf.scale.set(1.0, 1.12, 1.0);
      calf.position.set(sx, -0.02, 0.32);
      calf.castShadow = true;
      hips.add(calf);

      const shoe = buildOrganicShoe(shoeUpperMat, soleMat, accentMat, formalShoes);
      shoe.position.set(sx, -0.53, 0.325);
      hips.add(shoe);
    } else {
      const hipPivot = new THREE.Group();
      hipPivot.position.set(useSkirt ? sx * 0.78 : sx, -0.02, 0);

      const hipJoint = new THREE.Mesh(
        new THREE.SphereGeometry(0.066 * legSlenderScale, 12, 10),
        legUpperMat
      );
      hipPivot.add(hipJoint);

      const thigh = new THREE.Mesh(geoms.thigh, legUpperMat);
      thigh.scale.set(legSlenderScale, 1.0, legSlenderScale);
      thigh.castShadow = true;
      hipPivot.add(thigh);

      // Cargo side pocket flaps for tech_jacket
      if (isTechJacket && !useSkirt) {
        const cargoPocket = new THREE.Mesh(
          new THREE.BoxGeometry(0.026, 0.095, 0.075),
          pantsMat
        );
        cargoPocket.position.set(sx < 0 ? -0.058 : 0.058, -0.18, 0.01);
        const pocketTrim = new THREE.Mesh(
          new THREE.BoxGeometry(0.028, 0.012, 0.076),
          accentMat
        );
        pocketTrim.position.set(sx < 0 ? -0.058 : 0.058, -0.135, 0.01);
        hipPivot.add(cargoPocket, pocketTrim);
      }

      const kneePivot = new THREE.Group();
      kneePivot.position.set(0, -0.39, 0);
      hipPivot.add(kneePivot);

      const kneeJoint = new THREE.Mesh(
        new THREE.SphereGeometry(0.051 * legSlenderScale, 12, 10),
        legLowerMat
      );
      kneePivot.add(kneeJoint);

      const calf = new THREE.Mesh(geoms.calf, legLowerMat);
      calf.scale.set(legSlenderScale, 1.0, legSlenderScale);
      calf.castShadow = true;
      kneePivot.add(calf);

      const shoe = buildOrganicShoe(shoeUpperMat, soleMat, accentMat, formalShoes);
      if (useSkirt) shoe.scale.set(0.86, 0.88, 1.02);
      shoe.position.set(0, -0.45, 0);
      kneePivot.add(shoe);

      hips.add(hipPivot);
      if (sx < 0) {
        leftLeg = hipPivot;
        leftShin = kneePivot;
      } else {
        rightLeg = hipPivot;
        rightShin = kneePivot;
      }
    }
  }

  // Tailored Torso
  const torso = new THREE.Group();
  torso.position.set(0, 0.06, 0);
  hips.add(torso);

  const torsoMesh = new THREE.Mesh(
    female ? geoms.torsoFemale : geoms.torsoMale,
    shirtMat
  );
  torsoMesh.scale.set(1.0, 1.0, 0.62);
  torsoMesh.castShadow = true;
  torso.add(torsoMesh);

  // Sleek belt + buckle (+ tactical pouch on tech_jacket)
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.154, 0.015, 8, 22), beltMat);
  belt.rotation.x = Math.PI / 2;
  belt.scale.set(0.98, 0.66, 1.0);
  belt.position.y = 0.012;
  torso.add(belt);

  const buckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.036, 0.024, 0.014),
    new THREE.MeshStandardMaterial({
      color: female ? 0xe2e8f0 : 0xfbbf24,
      roughness: 0.22,
      metalness: 0.88,
    })
  );
  buckle.position.set(0, 0.012, 0.104);
  torso.add(buckle);

  if (isTechJacket) {
    const toolPouch = new THREE.Mesh(
      new THREE.BoxGeometry(0.068, 0.088, 0.042),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.55 })
    );
    toolPouch.position.set(-0.145, -0.01, 0.04);
    toolPouch.rotation.y = -0.35;
    const pouchStrap = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.014, 0.046), accentMat);
    pouchStrap.position.set(-0.145, 0.012, 0.04);
    pouchStrap.rotation.y = -0.35;
    torso.add(toolPouch, pouchStrap);
  }

  // -------------------- OUTFIT LAYERS --------------------

  // A. Tech Jacket (Modern Field Bomber / Zip Jacket with ribbed hem, collar, zipper, utility pocket & shoulder piping)
  if (isTechJacket) {
    const jacketBody = new THREE.Mesh(
      female ? geoms.torsoFemale : geoms.torsoMale,
      blazerMat
    );
    jacketBody.scale.set(1.06, 0.96, 0.66);
    jacketBody.position.set(0, 0.018, -0.018);
    jacketBody.castShadow = true;
    torso.add(jacketBody);

    // Ribbed stand collar + waist hem band
    const standCollar = new THREE.Mesh(
      new THREE.TorusGeometry(0.082, 0.018, 8, 20),
      blazerMat
    );
    standCollar.rotation.x = Math.PI / 2 + 0.15;
    standCollar.position.set(0, 0.46, 0.004);
    torso.add(standCollar);

    const hemBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.158, 0.016, 8, 22),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.65 })
    );
    hemBand.rotation.x = Math.PI / 2;
    hemBand.scale.set(1.02, 0.68, 1);
    hemBand.position.set(0, 0.028, -0.004);
    torso.add(hemBand);

    // Front open-zipper panels framing inner graphic tee
    for (const side of [-1, 1] as const) {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.095, 0.39, 0.148),
        blazerMat
      );
      panel.position.set(side * (female ? 0.096 : 0.112), 0.22, 0.025);
      panel.rotation.y = side * -0.18;
      panel.castShadow = true;
      torso.add(panel);

      // Metallic zip track along inner edge
      const zipEdge = new THREE.Mesh(
        new THREE.BoxGeometry(0.01, 0.37, 0.012),
        metalTrimMat
      );
      zipEdge.position.set(side * (female ? 0.048 : 0.056), 0.22, 0.104);
      torso.add(zipEdge);

      // Contrast accent stripe across upper chest / shoulder yoke
      const shoulderAccent = new THREE.Mesh(
        new THREE.BoxGeometry(0.098, 0.024, 0.156),
        accentMat
      );
      shoulderAccent.position.set(side * (female ? 0.102 : 0.118), 0.365, 0.018);
      shoulderAccent.rotation.y = side * -0.18;
      torso.add(shoulderAccent);
    }

    // Chest utility pocket + stylus pen on left chest
    const chestPocket = new THREE.Mesh(
      new THREE.BoxGeometry(0.062, 0.072, 0.016),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.55 })
    );
    chestPocket.position.set(-0.088, 0.295, 0.108);
    chestPocket.rotation.y = 0.2;
    const penClip = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.048, 8), accentMat);
    penClip.position.set(-0.074, 0.325, 0.116);
    torso.add(chestPocket, penClip);
  }

  // B. Street Hoodie + Layered Chore Jacket
  if (isHoodie) {
    // Cozy outer hoodie collar / resting hood behind neck
    const hoodRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.105, 0.028, 10, 22, Math.PI * 1.4),
      shirtMat
    );
    hoodRing.rotation.x = Math.PI / 2 - 0.35;
    hoodRing.rotation.z = -Math.PI * 0.2;
    hoodRing.position.set(0, 0.445, -0.022);
    torso.add(hoodRing);

    // Drawstrings with metallic aglets
    for (const dx of [-0.028, 0.028]) {
      const cord = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, 0.13, 6),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 })
      );
      cord.position.set(dx, 0.355, 0.104);
      cord.rotation.x = -0.08;
      const aglet = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.018, 8), accentMat);
      aglet.position.set(dx, 0.29, 0.108);
      torso.add(cord, aglet);
    }

    // Layered cropped chore jacket framing hoodie
    const choreBack = new THREE.Mesh(
      female ? geoms.torsoFemale : geoms.torsoMale,
      blazerMat
    );
    choreBack.scale.set(1.06, 0.96, 0.66);
    choreBack.position.set(0, 0.015, -0.022);
    choreBack.castShadow = true;
    torso.add(choreBack);

    for (const side of [-1, 1] as const) {
      const frontPanel = new THREE.Mesh(
        new THREE.BoxGeometry(0.088, 0.37, 0.145),
        blazerMat
      );
      frontPanel.position.set(side * (female ? 0.102 : 0.118), 0.21, 0.024);
      frontPanel.rotation.y = side * -0.18;
      frontPanel.castShadow = true;
      torso.add(frontPanel);

      const trimLine = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.36, 0.01),
        accentMat
      );
      trimLine.position.set(side * (female ? 0.058 : 0.072), 0.21, 0.102);
      torso.add(trimLine);
    }
  }

  // C. Smart Vest (Tailored Knit/Quilted Vest over Crisp Rolled-Sleeve Shirt)
  if (isSmartVest) {
    const vestMesh = new THREE.Mesh(
      female ? geoms.torsoFemale : geoms.torsoMale,
      blazerMat
    );
    vestMesh.scale.set(1.03, 0.9, 0.65);
    vestMesh.position.set(0, 0.025, 0.002);
    vestMesh.castShadow = true;
    torso.add(vestMesh);

    // Contrast V-trim piping on vest neckline
    for (const side of [-1, 1] as const) {
      const vTrim = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.18, 0.016), accentMat);
      vTrim.position.set(side * 0.036, 0.37, 0.1);
      vTrim.rotation.z = side * -0.32;
      torso.add(vTrim);
    }
  }

  // D. Tailored Blazer / Suit / Cardigan Lapels + Pocket Square
  if (hasTailoredLapels) {
    const jacketBack = new THREE.Mesh(
      female ? geoms.torsoFemale : geoms.torsoMale,
      blazerMat
    );
    jacketBack.scale.set(1.05, 0.98, 0.65);
    jacketBack.position.set(0, 0.008, -0.024);
    jacketBack.castShadow = true;
    torso.add(jacketBack);

    const lapelColor = opts.lapelHex ?? (female && blazerColor === 0x0891b2 ? 0x1e293b : blazerColor);
    const lapelMat = new THREE.MeshStandardMaterial({
      map: getFabricTexture(lapelColor, 'twill'),
      roughness: 0.65,
      metalness: 0.04,
    });

    const makeLapelGeo = (side: -1 | 1) => {
      const s = new THREE.Shape();
      if (side === 1) {
        s.moveTo(0.0, 0.0);
        s.lineTo(0.056, 0.045);
        s.lineTo(0.072, 0.295);
        s.lineTo(0.024, 0.315);
        s.lineTo(-0.008, 0.175);
      } else {
        s.moveTo(0.0, 0.0);
        s.lineTo(0.008, 0.175);
        s.lineTo(-0.024, 0.315);
        s.lineTo(-0.072, 0.295);
        s.lineTo(-0.056, 0.045);
      }
      s.closePath();
      return new THREE.ExtrudeGeometry(s, {
        depth: 0.016,
        bevelEnabled: true,
        bevelThickness: 0.004,
        bevelSize: 0.004,
        bevelSegments: 2,
      });
    };

    for (const side of [-1, 1] as const) {
      const sidePanel = new THREE.Mesh(
        new THREE.BoxGeometry(0.088, 0.35, 0.145),
        blazerMat
      );
      sidePanel.position.set(side * (female ? 0.102 : 0.118), 0.185, 0.022);
      sidePanel.rotation.y = side * -0.18;
      sidePanel.castShadow = true;
      torso.add(sidePanel);

      const lapel = new THREE.Mesh(makeLapelGeo(side), lapelMat);
      lapel.position.set(side * (female ? 0.014 : 0.016), 0.165, 0.102);
      lapel.rotation.x = -0.08;
      lapel.rotation.y = side * 0.24;
      torso.add(lapel);
    }

    if (outfit !== 'blazer_blouse') {
      // Crisp folded pocket square on left chest
      const pocketSquare = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.02, 0.01), accentMat);
      pocketSquare.position.set(-0.095, 0.31, 0.11);
      pocketSquare.rotation.z = 0.16;
      pocketSquare.rotation.y = 0.2;
      torso.add(pocketSquare);

      // Metallic blazer buttons
      for (const by of [0.14, 0.085]) {
        const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.008, 12), metalTrimMat);
        btn.rotation.x = Math.PI / 2;
        btn.position.set(0, by, 0.112);
        torso.add(btn);
      }
    }
  }

  // Crisp folded dress shirt collar (or crew neck rib for tech_jacket)
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.068, 0.013, 8, 18),
    isTechJacket ? accentMat : shirtMat
  );
  collar.rotation.x = Math.PI / 2 + 0.14;
  collar.position.set(0, 0.475, 0.006);
  torso.add(collar);

  // Delicate pendant necklace for female blazer_blouse / smart_blouse
  if (female && (outfit === 'blazer_blouse' || outfit === 'smart_blouse')) {
    const chain = new THREE.Mesh(
      new THREE.TorusGeometry(0.065, 0.0025, 6, 18, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.2, metalness: 0.9 })
    );
    chain.rotation.z = Math.PI;
    chain.rotation.x = -0.35;
    chain.position.set(0, 0.455, 0.048);
    const pendant = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.01, 0),
      accentMat
    );
    pendant.position.set(0, 0.388, 0.088);
    torso.add(chain, pendant);
  }

  // Crisp flat tailored office necktie + metallic tie bar
  if (hasTie) {
    const tieMat = new THREE.MeshStandardMaterial({
      map: getFabricTexture(opts.tieHex ?? 0x0f172a, 'pinstripe', 0xffffff),
      roughness: 0.42,
      metalness: 0.08,
    });
    const knot = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.028, 0.018), tieMat);
    knot.position.set(0, 0.446, 0.086);

    const tieShape = new THREE.Shape();
    tieShape.moveTo(-0.013, 0);
    tieShape.lineTo(0.013, 0);
    tieShape.lineTo(0.024, -0.215);
    tieShape.lineTo(0, -0.255);
    tieShape.lineTo(-0.024, -0.215);
    tieShape.closePath();
    const tieGeo = new THREE.ExtrudeGeometry(tieShape, { depth: 0.008, bevelEnabled: false });
    const blade = new THREE.Mesh(tieGeo, tieMat);
    blade.position.set(0, 0.44, 0.092);
    blade.rotation.x = -0.1;

    const tieBar = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.006, 0.012), metalTrimMat);
    tieBar.position.set(0.004, 0.315, 0.114);
    torso.add(knot, blade, tieBar);
  }

  // Corporate ID Card + Lanyard on chest
  if (opts.lanyard !== false) {
    const badgeColor = opts.idBadgeHex ?? '#0284c7';
    const roleLabel = opts.idRoleLabel ?? 'IT OPS';

    const strapMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(badgeColor).multiplyScalar(0.65),
      roughness: 0.6,
    });
    const strap = new THREE.Mesh(
      new THREE.TorusGeometry(0.115, 0.0055, 6, 18, Math.PI),
      strapMat
    );
    strap.rotation.z = Math.PI;
    strap.rotation.x = -0.36;
    strap.scale.set(0.52, 1.38, 1);
    strap.position.set(0.05, 0.415, 0.095);
    torso.add(strap);

    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.014, 0.01), metalTrimMat);
    clip.position.set(0.068, 0.282, 0.125);
    torso.add(clip);

    const cardMat = new THREE.MeshStandardMaterial({
      map: createIdCardTexture(badgeColor, roleLabel),
      roughness: 0.28,
      metalness: 0.05,
    });
    const cardBackMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
    const cardMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.088, 0.006),
      [cardBackMat, cardBackMat, cardBackMat, cardBackMat, cardMat, cardBackMat]
    );
    cardMesh.position.set(0.068, 0.232, hasOuterJacket ? 0.128 : 0.122);
    cardMesh.rotation.x = -0.09;
    cardMesh.rotation.y = 0.12;
    torso.add(cardMesh);
  }

  // Articulated Office-Attire Arms
  const sleeveMat = hasOuterJacket ? blazerMat : shirtMat;

  const makeArm = (side: -1 | 1) => {
    const shoulderX = side * (female ? 0.174 : 0.202);
    const shoulderPivot = new THREE.Group();
    shoulderPivot.position.set(shoulderX, 0.412, 0);

    const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.044, 14, 12), sleeveMat);
    shoulderCap.scale.set(0.92, 0.88, 0.94);
    shoulderPivot.add(shoulderCap);

    const upperArm = new THREE.Mesh(geoms.upperArm, sleeveMat);
    upperArm.scale.set(female ? 0.88 : 0.98, 1, female ? 0.9 : 0.98);
    upperArm.castShadow = true;
    shoulderPivot.add(upperArm);

    // Subtle fabric piping on tech_jacket rather than chunky ring
    if (isTechJacket) {
      const piping = new THREE.Mesh(
        new THREE.TorusGeometry(0.042, 0.0035, 6, 16),
        accentMat
      );
      piping.rotation.x = Math.PI / 2;
      piping.position.y = -0.085;
      shoulderPivot.add(piping);
    }

    const elbowPivot = new THREE.Group();
    elbowPivot.position.set(0, -0.246, 0);
    shoulderPivot.add(elbowPivot);

    const forearmMat = rolledSleeves ? skinMat : sleeveMat;
    const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.031, 12, 10), forearmMat);
    elbowJoint.scale.setScalar(female ? 0.9 : 0.98);
    elbowPivot.add(elbowJoint);

    if (rolledSleeves) {
      // Soft rolled-up shirt cuff fold just below elbow
      const rolledFold = new THREE.Mesh(
        new THREE.TorusGeometry(0.034, 0.009, 8, 16),
        shirtMat
      );
      rolledFold.rotation.x = Math.PI / 2;
      rolledFold.position.y = -0.018;
      elbowPivot.add(rolledFold);
    }

    const forearm = new THREE.Mesh(geoms.forearm, forearmMat);
    forearm.scale.set(female ? 0.88 : 0.97, 1, female ? 0.88 : 0.97);
    forearm.castShadow = true;
    elbowPivot.add(forearm);

    if (hasOuterJacket) {
      // Soft tailored sleeve hem + subtle crisp shirt cuff peek
      const sleeveHem = new THREE.Mesh(
        new THREE.TorusGeometry(female ? 0.0255 : 0.028, 0.0045, 8, 16),
        sleeveMat
      );
      sleeveHem.rotation.x = Math.PI / 2;
      sleeveHem.position.y = -0.214;
      elbowPivot.add(sleeveHem);

      const shirtPeek = new THREE.Mesh(
        new THREE.CylinderGeometry(
          female ? 0.022 : 0.0245,
          female ? 0.0225 : 0.025,
          0.012,
          14
        ),
        isTechJacket ? accentMat : shirtMat
      );
      shirtPeek.position.y = -0.221;
      elbowPivot.add(shirtPeek);
    }

    const hand = buildHumanHand(skinMat, side, female);
    hand.position.set(0, -0.223, 0);
    hand.rotation.y = side * 0.14;
    hand.rotation.z = -side * 0.06;
    elbowPivot.add(hand);

    return { shoulderPivot, elbowPivot };
  };

  const leftArmBuilt = makeArm(-1);
  const rightArmBuilt = makeArm(1);
  torso.add(leftArmBuilt.shoulderPivot, rightArmBuilt.shoulderPivot);

  if (opts.watch !== false) {
    const watchBand = new THREE.Mesh(
      new THREE.TorusGeometry(female ? 0.0235 : 0.0265, 0.0032, 6, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45 })
    );
    watchBand.rotation.x = Math.PI / 2;
    watchBand.position.y = -0.208;
    leftArmBuilt.elbowPivot.add(watchBand);

    const watchFace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0085, 0.0085, 0.004, 14),
      new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.25,
        metalness: 0.65,
      })
    );
    watchFace.rotation.z = Math.PI / 2;
    watchFace.position.set(-0.025, -0.208, 0.002);
    leftArmBuilt.elbowPivot.add(watchFace);
  }

  const heldAnchor = new THREE.Group();
  heldAnchor.position.set(-0.012, -0.272, 0.055);
  rightArmBuilt.elbowPivot.add(heldAnchor);

  const headGroup = buildSculptedHumanHead(opts, skinMat, hairMat, accentMat);
  headGroup.scale.setScalar(female ? 1.34 : 1.28);
  headGroup.position.set(0, 0.585, 0);
  torso.add(headGroup);

  return {
    group,
    hips,
    pelvis,
    hasSkirt: useSkirt,
    torso,
    headGroup,
    leftArm: leftArmBuilt.shoulderPivot,
    leftForearm: leftArmBuilt.elbowPivot,
    rightArm: rightArmBuilt.shoulderPivot,
    rightForearm: rightArmBuilt.elbowPivot,
    leftLeg,
    leftShin,
    rightLeg,
    rightShin,
    heldAnchor,
  };
}
