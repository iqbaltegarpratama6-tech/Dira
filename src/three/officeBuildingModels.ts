import * as THREE from 'three';
import { OFFICE_ROOMS, OfficeNpcId, RoomDoorId, WorkstationTargetId } from '../types/game';
import { buildHumanCharacter } from './humanCharacterBuilder';
import {
  createDeskMatTexture,
  createDeskWoodTexture,
  createServerBladeTexture,
  drawEmployeeScreen,
  drawLiveMonitorScreen,
  EmployeeScreenTheme,
  MonitorScreenState,
} from './proceduralTextures';

function tagInteractable(obj: THREE.Object3D, interactId: WorkstationTargetId) {
  obj.traverse((child) => {
    child.userData.interactId = interactId;
  });
}

function tagSeat(obj: THREE.Object3D, seatId: string) {
  obj.traverse((child) => {
    child.userData.seatId = seatId;
  });
}

function createHelpPopupTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 384, 160);

  // Soft outer amber glow
  const glow = ctx.createRadialGradient(192, 68, 24, 192, 68, 150);
  glow.addColorStop(0, 'rgba(251, 191, 36, 0.34)');
  glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 384, 160);

  // Unified rounded speech bubble with bottom tail
  const x = 32;
  const y = 18;
  const w = 320;
  const h = 88;
  const r = 24;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(208, y + h);
  ctx.lineTo(192, y + h + 26);
  ctx.lineTo(176, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  const fillGrad = ctx.createLinearGradient(0, y, 0, y + h);
  fillGrad.addColorStop(0, '#fffbeb');
  fillGrad.addColorStop(1, '#fef3c7');
  ctx.fillStyle = fillGrad;
  ctx.fill();

  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#f59e0b';
  ctx.stroke();

  // Warm amber exclamation circle on left
  ctx.beginPath();
  ctx.arc(72, y + h / 2, 19, 0, Math.PI * 2);
  ctx.fillStyle = '#d97706';
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 26px "Chakra Petch", "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', 72, y + h / 2 + 1);

  // Crisp readable Indonesian callout text
  ctx.fillStyle = '#78350f';
  ctx.font = '700 30px "Plus Jakarta Sans", "Chakra Petch", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Butuh Bantuan', 104, y + h / 2 + 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createLightPlasterTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  // Crisp clean gallery white wall
  ctx.fillStyle = '#f8f9fb';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle soft cool-mist wainscoting on lower third
  ctx.fillStyle = 'rgba(226, 232, 240, 0.34)';
  ctx.fillRect(0, 336, 512, 176);
  ctx.fillStyle = 'rgba(148, 163, 184, 0.26)';
  ctx.fillRect(0, 334, 512, 4);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
  ctx.lineWidth = 2;
  for (let x = 64; x < 512; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(100, 116, 139, 0.025)';
  for (let i = 0; i < 450; i++) {
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 1);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createPastelTileFloorTexture(
  baseHex: string,
  altHex: string,
  groutHex: string,
  repeatX: number,
  repeatY: number,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = altHex;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillRect(128, 128, 128, 128);

  ctx.strokeStyle = groutHex;
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, 125, 125);
  ctx.strokeRect(129.5, 1.5, 125, 125);
  ctx.strokeRect(1.5, 129.5, 125, 125);
  ctx.strokeRect(129.5, 129.5, 125, 125);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createPastelWoodFloorTexture(
  baseHex: string,
  plankHex: string,
  grainHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 4; i++) {
    const y = i * 64;
    if (i % 2 === 1) {
      ctx.fillStyle = plankHex;
      ctx.fillRect(0, y, 256, 64);
    }
    ctx.strokeStyle = grainHex;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();

    // Subtle vertical plank joints
    const jointX = i % 2 === 0 ? 128 : 64;
    ctx.beginPath();
    ctx.moveTo(jointX, y);
    ctx.lineTo(jointX, y + 64);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createWindowCityscapeTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#7dd3fc');
  grad.addColorStop(0.55, '#bae6fd');
  grad.addColorStop(1, '#e0f2fe');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Soft sunlit clouds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  for (const [cx, cy, rx] of [
    [95, 52, 48],
    [130, 58, 36],
    [350, 44, 56],
    [390, 50, 40],
  ]) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant modern glass office skyline
  const towers = [
    { x: 24, w: 54, h: 120, col: '#94a3b8' },
    { x: 88, w: 68, h: 155, col: '#64748b' },
    { x: 168, w: 46, h: 105, col: '#94a3b8' },
    { x: 230, w: 72, h: 170, col: '#475569' },
    { x: 314, w: 58, h: 130, col: '#64748b' },
    { x: 386, w: 64, h: 145, col: '#94a3b8' },
    { x: 460, w: 42, h: 112, col: '#64748b' },
  ];
  towers.forEach((t) => {
    const y = 256 - t.h;
    ctx.fillStyle = t.col;
    ctx.fillRect(t.x, y, t.w, t.h);
    ctx.fillStyle = 'rgba(224, 242, 254, 0.42)';
    for (let wy = y + 10; wy < 246; wy += 16) {
      for (let wx = t.x + 6; wx < t.x + t.w - 8; wx += 12) {
        ctx.fillRect(wx, wy, 7, 9);
      }
    }
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createCompanySignTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 500, 116);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 38px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NETOPS CORP HQ', 256, 62);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 18px "JetBrains Mono", monospace';
  ctx.fillText('ENTERPRISE IT & INFRASTRUCTURE', 256, 98);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createRoomPlaqueTexture(code: string, title: string, maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 112;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 112);
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, 0, 108, 112);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 508, 108);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 42px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(code, 54, 70);

  ctx.fillStyle = '#f1f5f9';
  ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(title.toUpperCase(), 128, 67);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createDisplayPanelTexture(
  header: string,
  lines: Array<{ text: string; color: string }>,
  bg = '#0b1320',
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 288;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 288);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 500, 276);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.fillText(header, 24, 44);

  ctx.font = '500 18px "JetBrains Mono", monospace';
  lines.forEach((l, i) => {
    ctx.fillStyle = l.color;
    ctx.fillText(l.text, 24, 88 + i * 38);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

type ArtFramePattern =
  | 'topology'
  | 'botanical'
  | 'server'
  | 'abstract_arch'
  | 'landscape'
  | 'monstera'
  | 'quotes';

function createArtFrameTexture(
  title: string,
  accentHex: string,
  pattern: ArtFramePattern,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 192);

  const isLightCanvas =
    pattern === 'botanical' ||
    pattern === 'abstract_arch' ||
    pattern === 'landscape' ||
    pattern === 'monstera' ||
    pattern === 'quotes';

  ctx.fillStyle = isLightCanvas ? '#f8fafc' : '#0f172a';
  ctx.fillRect(14, 14, 228, 164);

  if (pattern === 'topology') {
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(64, 58);
    ctx.lineTo(128, 118);
    ctx.lineTo(192, 58);
    ctx.moveTo(128, 118);
    ctx.lineTo(128, 145);
    ctx.stroke();
    for (const [cx, cy] of [
      [64, 58],
      [192, 58],
      [128, 118],
      [128, 145],
    ]) {
      ctx.fillStyle = accentHex;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (pattern === 'botanical') {
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(128, 146);
    ctx.quadraticCurveTo(124, 96, 128, 42);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const y = 60 + i * 20;
      const dir = i % 2 === 0 ? 1 : -1;
      ctx.fillStyle = i % 2 === 0 ? '#10b981' : '#34d399';
      ctx.beginPath();
      ctx.ellipse(128 + dir * 20, y, 18, 8, dir * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (pattern === 'abstract_arch') {
    // Modern minimalist Bauhaus arch & circle print
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(92, 108, 42, Math.PI, 0, false);
    ctx.lineTo(134, 148);
    ctx.lineTo(50, 148);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = accentHex;
    ctx.beginPath();
    ctx.arc(164, 82, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(128, 102, 46, -0.35, Math.PI * 0.85);
    ctx.stroke();
  } else if (pattern === 'landscape') {
    // Serene minimalist horizon & mountain peaks
    const sky = ctx.createLinearGradient(0, 14, 0, 140);
    sky.addColorStop(0, '#e0f2fe');
    sky.addColorStop(1, '#f8fafc');
    ctx.fillStyle = sky;
    ctx.fillRect(14, 14, 228, 128);

    ctx.fillStyle = accentHex;
    ctx.beginPath();
    ctx.arc(178, 56, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(14, 142);
    ctx.lineTo(86, 68);
    ctx.lineTo(148, 142);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(96, 142);
    ctx.lineTo(164, 80);
    ctx.lineTo(242, 142);
    ctx.closePath();
    ctx.fill();
  } else if (pattern === 'monstera') {
    ctx.fillStyle = '#ecfdf5';
    ctx.fillRect(24, 24, 208, 124);
    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.ellipse(128, 86, 34, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ecfdf5';
    ctx.lineWidth = 5;
    for (const [lx, ly] of [
      [104, 70],
      [152, 70],
      [102, 98],
      [154, 98],
    ]) {
      ctx.beginPath();
      ctx.moveTo(128, ly + 4);
      ctx.lineTo(lx, ly - 4);
      ctx.stroke();
    }
  } else if (pattern === 'quotes') {
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 3;
    ctx.strokeRect(26, 26, 204, 120);
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 18px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THINK · BUILD', 128, 78);
    ctx.fillStyle = accentHex;
    ctx.font = '700 16px "Chakra Petch", sans-serif';
    ctx.fillText('CONNECT · GROW', 128, 108);
  } else {
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 === 0 ? accentHex : '#38bdf8';
      ctx.fillRect(42, 44 + i * 21, 172, 12);
    }
  }

  ctx.fillStyle = isLightCanvas ? '#1e293b' : '#cbd5e1';
  ctx.font = '600 12px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, 128, 166);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function buildWallFrame(
  title: string,
  accentHex: string,
  pattern: ArtFramePattern,
  maxAnisotropy: number,
  width = 0.96,
  height = 0.72,
  frameHex = 0x334155
): THREE.Group {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.045),
    new THREE.MeshStandardMaterial({ color: frameHex, roughness: 0.42, metalness: 0.35 })
  );
  outer.castShadow = true;

  // Crisp gallery white passe-partout mat border
  const matBoard = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.07, height - 0.07, 0.012),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 })
  );
  matBoard.position.z = 0.022;

  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.14, height - 0.14),
    new THREE.MeshBasicMaterial({
      map: createArtFrameTexture(title, accentHex, pattern, maxAnisotropy),
    })
  );
  art.position.z = 0.03;
  g.add(outer, matBoard, art);
  return g;
}

function createLibrarySignTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 72;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 384, 72);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 376, 64);
  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 26px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PERPUSTAKAAN MINI', 192, 37);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function buildMiniLibrary(
  variant: 'compact' | 'full',
  maxAnisotropy: number
): THREE.Group {
  const g = new THREE.Group();
  const whiteShellMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.52, metalness: 0.04 });
  const oakShelfMat = new THREE.MeshStandardMaterial({ color: 0xc8a47e, roughness: 0.58, metalness: 0.04 });
  const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.38, metalness: 0.65 });

  const width = variant === 'full' ? 1.82 : 1.16;
  const height = variant === 'full' ? 1.76 : 1.32;
  const depth = 0.38;
  const halfW = width / 2;

  // Base plinth
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, depth), darkMetalMat);
  plinth.position.y = 0.04;
  plinth.castShadow = true;
  g.add(plinth);

  // White outer side panels + top crown
  for (const sx of [-halfW + 0.025, halfW - 0.025]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.05, height - 0.08, depth), whiteShellMat);
    side.position.set(sx, 0.08 + (height - 0.08) / 2, 0);
    side.castShadow = true;
    side.receiveShadow = true;
    g.add(side);
  }
  const topCap = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, depth + 0.02), whiteShellMat);
  topCap.position.set(0, height - 0.025, 0);
  topCap.castShadow = true;
  g.add(topCap);

  // Clean off-white back panel
  const backPanel = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.06, height - 0.1, 0.025),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.72 })
  );
  backPanel.position.set(0, 0.08 + (height - 0.1) / 2, -depth / 2 + 0.015);
  g.add(backPanel);

  // Center vertical divider for full double-bay library
  if (variant === 'full') {
    const midDiv = new THREE.Mesh(new THREE.BoxGeometry(0.04, height - 0.12, depth - 0.03), whiteShellMat);
    midDiv.position.set(0, 0.08 + (height - 0.12) / 2, 0);
    midDiv.castShadow = true;
    g.add(midDiv);
  }

  const shelfHeights = variant === 'full' ? [0.12, 0.54, 0.96, 1.38] : [0.12, 0.5, 0.88];
  const bookPalette = [
    0x0284c7, 0x0f766e, 0xd97706, 0xbe123c, 0x334155,
    0x2563eb, 0x059669, 0x7c3aed, 0x475569, 0xea580c,
  ];
  const pageMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.82 });

  const addBookRow = (startX: number, endX: number, shelfTopY: number, seedOffset: number) => {
    let cursorX = startX;
    let idx = 0;
    while (cursorX < endX - 0.05) {
      const bThick = 0.032 + ((idx + seedOffset) % 3) * 0.01;
      const bHeight = 0.22 + ((idx * 3 + seedOffset) % 5) * 0.024;
      const bDepth = 0.19 + ((idx + seedOffset) % 2) * 0.025;
      const color = bookPalette[(idx + seedOffset) % bookPalette.length];

      // Occasional horizontal stacked books at the end of a shelf
      if (cursorX > endX - 0.24 && (seedOffset + idx) % 2 === 0) {
        const stack1 = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.038, 0.22),
          new THREE.MeshStandardMaterial({ color, roughness: 0.52 })
        );
        stack1.position.set(cursorX + 0.09, shelfTopY + 0.019, 0.02);
        stack1.castShadow = true;
        const stack2 = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.034, 0.2),
          new THREE.MeshStandardMaterial({
            color: bookPalette[(idx + seedOffset + 3) % bookPalette.length],
            roughness: 0.52,
          })
        );
        stack2.position.set(cursorX + 0.09, shelfTopY + 0.055, 0.02);
        stack2.rotation.y = 0.1;
        g.add(stack1, stack2);
        break;
      }

      const bookGroup = new THREE.Group();
      const cover = new THREE.Mesh(
        new THREE.BoxGeometry(bThick, bHeight, bDepth),
        new THREE.MeshStandardMaterial({ color, roughness: 0.55 })
      );
      cover.castShadow = true;
      const pages = new THREE.Mesh(new THREE.BoxGeometry(bThick * 0.72, bHeight - 0.016, bDepth - 0.014), pageMat);
      pages.position.z = -0.008;
      const spineBand = new THREE.Mesh(
        new THREE.BoxGeometry(bThick + 0.002, 0.016, 0.008),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.35, metalness: 0.4 })
      );
      spineBand.position.set(0, bHeight * 0.24, bDepth / 2 + 0.001);
      bookGroup.add(cover, pages, spineBand);

      const tilt = idx === 4 ? -0.14 : 0;
      bookGroup.position.set(cursorX + bThick / 2 + (tilt ? 0.02 : 0), shelfTopY + bHeight / 2, 0.02);
      bookGroup.rotation.z = tilt;
      g.add(bookGroup);

      cursorX += bThick + (tilt ? 0.035 : 0.006);
      idx++;
      if (idx === 6 && cursorX < endX - 0.3) {
        cursorX += 0.14; // breathing room / decorative gap on shelf
      }
    }
  };

  shelfHeights.forEach((sy, tierIdx) => {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(width - 0.1, 0.035, depth - 0.03), oakShelfMat);
    plank.position.set(0, sy, 0.005);
    plank.castShadow = true;
    plank.receiveShadow = true;
    g.add(plank);

    const shelfTopY = sy + 0.018;
    if (variant === 'full') {
      addBookRow(-halfW + 0.09, -0.06, shelfTopY, tierIdx * 3 + 1);
      addBookRow(0.06, halfW - 0.09, shelfTopY, tierIdx * 5 + 2);
    } else {
      addBookRow(-halfW + 0.09, halfW - 0.09, shelfTopY, tierIdx * 4 + 1);
    }
  });

  // Top decorative planter + miniature lamp/globe + "PERPUSTAKAAN MINI" header plaque
  const topY = height;
  const topPlant = buildPlantPot(0.45);
  topPlant.position.set(-halfW + 0.24, topY, 0.02);
  g.add(topPlant);

  const globeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.03, 12), darkMetalMat);
  globeBase.position.set(halfW - 0.24, topY + 0.015, 0.02);
  const globeStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 8), darkMetalMat);
  globeStem.position.set(halfW - 0.24, topY + 0.06, 0.02);
  const globeBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.085, 14, 12),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.15 })
  );
  globeBall.position.set(halfW - 0.24, topY + 0.16, 0.02);
  g.add(globeBase, globeStem, globeBall);

  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(variant === 'full' ? 0.72 : 0.58, 0.14, 0.025),
    darkMetalMat
  );
  signBoard.position.set(0, topY + 0.07, 0.06);
  const signFace = new THREE.Mesh(
    new THREE.PlaneGeometry(variant === 'full' ? 0.68 : 0.54, 0.12),
    new THREE.MeshBasicMaterial({ map: createLibrarySignTexture(maxAnisotropy) })
  );
  signFace.position.set(0, topY + 0.07, 0.074);
  g.add(signBoard, signFace);

  return g;
}

function buildFlowerVase(flowerHex = 0xf472b6): THREE.Group {
  const g = new THREE.Group();
  const vaseMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.05 });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.65 });
  const petalMat = new THREE.MeshStandardMaterial({ color: flowerHex, roughness: 0.48 });
  const centerMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.085, 0.19, 14), vaseMat);
  body.position.y = 0.095;
  body.castShadow = true;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 0.05, 14), vaseMat);
  neck.position.y = 0.21;
  g.add(body, neck);

  [0, 2.1, 4.2].forEach((ang, idx) => {
    const tilt = 0.2 + idx * 0.04;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 6), stemMat);
    stem.position.set(Math.cos(ang) * 0.03, 0.29, Math.sin(ang) * 0.03);
    stem.rotation.z = -Math.cos(ang) * tilt;
    stem.rotation.x = Math.sin(ang) * tilt;
    g.add(stem);

    const bloom = new THREE.Mesh(new THREE.DodecahedronGeometry(0.04, 0), petalMat);
    bloom.position.set(Math.cos(ang) * 0.062, 0.38 + (idx % 2) * 0.03, Math.sin(ang) * 0.062);
    g.add(bloom);

    const center = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), centerMat);
    center.position.copy(bloom.position).add(new THREE.Vector3(0, 0.022, 0));
    g.add(center);
  });

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.11, 5), stemMat);
    leaf.position.set(Math.cos(a) * 0.05, 0.25, Math.sin(a) * 0.05);
    leaf.rotation.z = -Math.cos(a) * 0.7;
    leaf.rotation.x = Math.sin(a) * 0.7;
    g.add(leaf);
  }
  return g;
}

function buildPlantPot(scale = 1): THREE.Group {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22 * scale, 0.16 * scale, 0.36 * scale, 14),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 })
  );
  pot.position.y = 0.18 * scale;
  pot.castShadow = true;
  g.add(pot);

  const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.68 });
  const leafMatLight = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.65 });
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry(0.14 * scale, 0.44 * scale, 7),
      i % 2 === 0 ? leafMat : leafMatLight
    );
    leaf.position.set(
      Math.cos(angle) * 0.12 * scale,
      0.48 * scale + (i % 2) * 0.08 * scale,
      Math.sin(angle) * 0.12 * scale
    );
    leaf.rotation.z = -Math.cos(angle) * 0.48;
    leaf.rotation.x = Math.sin(angle) * 0.48;
    leaf.castShadow = true;
    g.add(leaf);
  }
  return g;
}

function buildOfficeChair(seatColor = 0x334155): THREE.Group {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.35, metalness: 0.75 });
  const fabric = new THREE.MeshStandardMaterial({ color: seatColor, roughness: 0.75 });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.04, 12), metal);
  base.position.y = 0.03;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.38, 10), metal);
  stem.position.y = 0.23;
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.44), fabric);
  seat.position.y = 0.45;
  seat.castShadow = true;
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.05), fabric);
  back.position.set(0, 0.72, -0.2);
  back.castShadow = true;

  // Ergonomic armrests
  for (const ax of [-0.23, 0.23]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.04, 0.28), metal);
    arm.position.set(ax, 0.58, -0.02);
    g.add(arm);
  }
  g.add(base, stem, seat, back);
  return g;
}

interface LiveScreenHandle {
  texture: THREE.CanvasTexture;
  update: (theme: EmployeeScreenTheme, title: string, subtitle: string, detail: string) => void;
}

function createLiveScreenHandle(maxAnisotropy: number): LiveScreenHandle {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 288;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return {
    texture,
    update: (theme, title, subtitle, detail) => {
      drawEmployeeScreen(canvas, { theme, title, subtitle, detail });
      texture.needsUpdate = true;
    },
  };
}

function buildDesktopMonitor(
  accentEmissive = 0x38bdf8,
  screenTexture?: THREE.CanvasTexture
): THREE.Group {
  const g = new THREE.Group();
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.38, metalness: 0.65 });
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.05), darkMat);
  stand.position.y = 0.08;
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.16), darkMat);
  base.position.y = 0.01;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.36, 0.035), darkMat);
  frame.position.y = 0.29;
  frame.castShadow = true;
  const screenMat = screenTexture
    ? new THREE.MeshBasicMaterial({ map: screenTexture })
    : new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: accentEmissive,
        emissiveIntensity: 0.48,
        roughness: 0.2,
      });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.53, 0.31), screenMat);
  screen.position.set(0, 0.29, 0.019);
  const kb = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.018, 0.13), darkMat);
  kb.position.set(0, 0.01, 0.22);
  g.add(stand, base, frame, screen, kb);
  return g;
}

function buildDeskLaptop(
  accentEmissive = 0x38bdf8,
  screenTexture?: THREE.CanvasTexture
): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.35, metalness: 0.7 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.016, 0.24), bodyMat);
  base.position.y = 0.008;
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.014), bodyMat);
  lid.position.set(0, 0.11, -0.115);
  lid.rotation.x = -0.22;
  const screenMat = screenTexture
    ? new THREE.MeshBasicMaterial({ map: screenTexture })
    : new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: accentEmissive,
        emissiveIntensity: 0.55,
      });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.19), screenMat);
  screen.position.set(0, 0.11, -0.106);
  screen.rotation.x = -0.22;
  g.add(base, lid, screen);
  return g;
}

function buildCoffeeMug(colorHex = 0xf8fafc): THREE.Group {
  const g = new THREE.Group();
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.032, 0.085, 12),
    new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3 })
  );
  cup.position.y = 0.0425;
  const coffee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.005, 12),
    new THREE.MeshStandardMaterial({ color: 0x3f2305, roughness: 0.2 })
  );
  coffee.position.y = 0.082;
  g.add(cup, coffee);
  return g;
}

function createIslamicMihrabTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, 384);
  bgGrad.addColorStop(0, '#022c22');
  bgGrad.addColorStop(0.5, '#064e3b');
  bgGrad.addColorStop(1, '#047857');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 256, 384);

  // Ornamental gold arch frame
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(26, 358);
  ctx.lineTo(26, 150);
  ctx.arc(128, 150, 102, Math.PI, 0, false);
  ctx.lineTo(230, 358);
  ctx.closePath();
  ctx.stroke();

  // Inner geometric 8-point star emblem
  ctx.save();
  ctx.translate(128, 140);
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.72)';
  ctx.lineWidth = 2.5;
  for (let r = 0; r < 2; r++) {
    ctx.save();
    ctx.rotate((r * Math.PI) / 4);
    ctx.strokeRect(-38, -38, 76, 76);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(251, 191, 36, 0.28)';
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Subtle geometric lattice
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.22)';
  ctx.lineWidth = 1.5;
  for (let y = 230; y <= 330; y += 32) {
    ctx.beginPath();
    ctx.moveTo(52, y);
    ctx.lineTo(204, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createBossArtTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, 384, 256);
  bg.addColorStop(0, '#1c1917');
  bg.addColorStop(1, '#292524');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 384, 256);

  // Gold geometric horizon & brushed circles
  ctx.fillStyle = 'rgba(217, 119, 6, 0.25)';
  ctx.beginPath();
  ctx.arc(135, 118, 66, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(245, 118, 52, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(42, 188);
  ctx.lineTo(342, 188);
  ctx.stroke();

  ctx.fillStyle = '#fde68a';
  ctx.font = '700 16px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VISION · LEADERSHIP', 192, 222);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createBossNameplateTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.strokeRect(3, 3, 250, 58);
  ctx.fillStyle = '#fde68a';
  ctx.font = '700 22px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DIREKTUR UTAMA', 128, 33);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBossReportPopupTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 384, 160);

  const glow = ctx.createRadialGradient(192, 68, 24, 192, 68, 150);
  glow.addColorStop(0, 'rgba(212, 175, 55, 0.36)');
  glow.addColorStop(1, 'rgba(212, 175, 55, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 384, 160);

  const x = 32;
  const y = 18;
  const w = 320;
  const h = 88;
  const r = 24;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(208, y + h);
  ctx.lineTo(192, y + h + 26);
  ctx.lineTo(176, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  const fillGrad = ctx.createLinearGradient(0, y, 0, y + h);
  fillGrad.addColorStop(0, '#1e293b');
  fillGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = fillGrad;
  ctx.fill();

  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#fbbf24';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(72, y + h / 2, 19, 0, Math.PI * 2);
  ctx.fillStyle = '#fbbf24';
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = '800 24px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✓', 72, y + h / 2 + 1);

  ctx.fillStyle = '#fef3c7';
  ctx.font = '700 29px "Plus Jakarta Sans", "Chakra Petch", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Lapor Selesai!', 104, y + h / 2 + 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createCalligraphyPlaqueTexture(
  variant: 'tauhid' | 'doa' | 'geom',
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 320);
  if (variant === 'geom') {
    grad.addColorStop(0, '#fefce8');
    grad.addColorStop(1, '#ecfdf5');
  } else {
    grad.addColorStop(0, '#022c22');
    grad.addColorStop(1, '#064e3b');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 320);

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, 232, 296);
  ctx.lineWidth = 2;
  ctx.strokeRect(22, 22, 212, 276);

  // Ornamental Islamic octagon star medallion
  ctx.save();
  ctx.translate(128, 138);
  ctx.strokeStyle = variant === 'geom' ? '#047857' : '#fde68a';
  ctx.lineWidth = 3;
  for (let i = 0; i < 2; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 4);
    ctx.strokeRect(-48, -48, 96, 96);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 32, 0, Math.PI * 2);
  ctx.fillStyle = variant === 'geom' ? 'rgba(16, 185, 129, 0.16)' : 'rgba(251, 191, 36, 0.2)';
  ctx.fill();
  ctx.stroke();

  // Decorative stylized calligraphy glyph strokes
  ctx.fillStyle = variant === 'geom' ? '#064e3b' : '#fef08a';
  ctx.font = '700 32px "Chakra Petch", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(variant === 'tauhid' ? 'الله' : variant === 'doa' ? 'محمد' : '۞', 0, 2);
  ctx.restore();

  ctx.fillStyle = variant === 'geom' ? '#065f46' : '#fde68a';
  ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    variant === 'tauhid' ? 'DZIKIR & KETENANGAN' : variant === 'doa' ? 'SHOLAWAT & DOA' : 'GEOMETRI ISLAMI',
    128,
    264
  );

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createExecutiveFiguraTexture(
  variant: 'iso' | 'award' | 'vision',
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d')!;

  if (variant === 'iso') {
    ctx.fillStyle = '#faf8f2';
    ctx.fillRect(0, 0, 320, 240);
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 4;
    ctx.strokeRect(14, 14, 292, 212);
    ctx.fillStyle = '#1c1917';
    ctx.font = '700 16px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ISO 27001 CERTIFIED', 160, 62);
    ctx.fillStyle = '#57534e';
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('INFORMATION SECURITY EXCELLENCE', 160, 88);
    for (let y = 116; y <= 148; y += 16) {
      ctx.fillStyle = '#d6d3d1';
      ctx.fillRect(62, y, 196, 5);
    }
    ctx.beginPath();
    ctx.arc(160, 184, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#d4af37';
    ctx.fill();
  } else if (variant === 'award') {
    const bg = ctx.createLinearGradient(0, 0, 320, 240);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#1e293b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 320, 240);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.strokeRect(14, 14, 292, 212);
    ctx.beginPath();
    ctx.arc(160, 102, 42, 0, Math.PI * 2);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#fde68a';
    ctx.font = '700 15px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ENTERPRISE INFRASTRUCTURE', 160, 178);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText('ANNUAL EXCELLENCE AWARD', 160, 200);
  } else {
    const bg = ctx.createLinearGradient(0, 0, 320, 240);
    bg.addColorStop(0, '#292524');
    bg.addColorStop(1, '#44403c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 320, 240);
    ctx.fillStyle = 'rgba(212, 175, 55, 0.25)';
    ctx.fillRect(36, 48, 92, 130);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.fillRect(146, 72, 138, 106);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(22, 22, 276, 196);
    ctx.fillStyle = '#fef3c7';
    ctx.font = '700 14px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STRATEGIC ARCHITECTURE', 160, 204);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function buildOrnateFigura(
  tex: THREE.CanvasTexture,
  width: number,
  height: number,
  frameHex = 0xd4af37,
  matHex = 0xfefce8
): THREE.Group {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.045),
    new THREE.MeshStandardMaterial({ color: frameHex, roughness: 0.34, metalness: 0.58 })
  );
  outer.castShadow = true;
  const matBoard = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.09, height - 0.09, 0.012),
    new THREE.MeshStandardMaterial({ color: matHex, roughness: 0.72 })
  );
  matBoard.position.z = 0.022;
  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.16, height - 0.16),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  art.position.z = 0.03;
  g.add(outer, matBoard, art);
  return g;
}

function buildOpenRouterBox(): THREE.Group {
  const g = new THREE.Group();
  const cardMat = new THREE.MeshStandardMaterial({ color: 0xc2986b, roughness: 0.86 });
  const cardInnerMat = new THREE.MeshStandardMaterial({ color: 0xa67c52, roughness: 0.88 });
  const routerBodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.55 });
  const routerBodySilverMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.38, metalness: 0.62 });
  const cyanLedMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const greenLedMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });

  // Open cardboard box walls (bottom + 4 walls)
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.025, 0.46), cardInnerMat);
  bottom.position.y = 0.0125;
  bottom.castShadow = true;
  g.add(bottom);

  const wallF = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.28, 0.02), cardMat);
  wallF.position.set(0, 0.15, 0.22);
  wallF.castShadow = true;
  const wallB = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.28, 0.02), cardMat);
  wallB.position.set(0, 0.15, -0.22);
  wallB.castShadow = true;
  const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.44), cardMat);
  wallL.position.set(-0.3, 0.15, 0);
  wallL.castShadow = true;
  const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.44), cardMat);
  wallR.position.set(0.3, 0.15, 0);
  wallR.castShadow = true;
  g.add(wallF, wallB, wallL, wallR);

  // Angled open cardboard flaps
  const flapF = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.016, 0.16), cardMat);
  flapF.position.set(0, 0.32, 0.28);
  flapF.rotation.x = 0.65;
  const flapB = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.016, 0.16), cardMat);
  flapB.position.set(0, 0.32, -0.28);
  flapB.rotation.x = -0.65;
  const flapL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.016, 0.42), cardMat);
  flapL.position.set(-0.35, 0.31, 0);
  flapL.rotation.z = 0.58;
  const flapR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.016, 0.42), cardMat);
  flapR.position.set(0.35, 0.31, 0);
  flapR.rotation.z = -0.58;
  g.add(flapF, flapB, flapL, flapR);

  // Three dual-antenna enterprise routers packed upright & angled inside the open box
  [-0.17, 0.01, 0.18].forEach((rx, idx) => {
    const router = new THREE.Group();
    router.position.set(rx, 0.19 + (idx === 1 ? 0.02 : 0), idx === 1 ? 0.02 : -0.02);
    router.rotation.z = (idx - 1) * 0.09;
    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.24, 0.32),
      idx === 1 ? routerBodySilverMat : routerBodyMat
    );
    chassis.castShadow = true;
    router.add(chassis);

    // Upright Wi-Fi antennas sticking cleanly out of the open box
    for (const az of [-0.1, 0.1]) {
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.012, 0.2, 8), routerBodyMat);
      ant.position.set(0, 0.19, az);
      router.add(ant);
    }
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.02, 0.14),
      idx % 2 === 0 ? cyanLedMat : greenLedMat
    );
    led.position.set(0, 0.125, 0);
    router.add(led);
    g.add(router);
  });

  return g;
}

function buildNetworkEquipUnit(
  kind: 'switch' | 'opm' | 'rj45_jar' | 'cable_coil' | 'splicer_case' | 'patch_panel',
  colorHex = 0x0284c7
): THREE.Group {
  const g = new THREE.Group();
  const chassisMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.38, metalness: 0.65 });
  const silverMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.32, metalness: 0.7 });

  if (kind === 'switch' || kind === 'patch_panel') {
    const w = 0.56;
    const h = kind === 'switch' ? 0.08 : 0.06;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.28), chassisMat);
    body.position.y = h / 2;
    body.castShadow = true;
    const face = new THREE.Mesh(
      new THREE.BoxGeometry(w - 0.04, h * 0.45, 0.012),
      new THREE.MeshBasicMaterial({ color: kind === 'switch' ? 0x38bdf8 : 0xfbbf24 })
    );
    face.position.set(0, h / 2, 0.142);
    g.add(body, face);
  } else if (kind === 'opm') {
    // Handheld Optical Power Meter / Fiber Tester
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.04, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45 })
    );
    body.position.y = 0.02;
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.075, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    screen.rotation.x = -Math.PI / 2;
    screen.position.set(0, 0.042, -0.03);
    g.add(body, screen);
  } else if (kind === 'rj45_jar') {
    const jar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.16, 14),
      new THREE.MeshPhysicalMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.52, roughness: 0.12 })
    );
    jar.position.y = 0.08;
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 14), silverMat);
    lid.position.y = 0.17;
    const plugs = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.068, 0.09, 12),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.35 })
    );
    plugs.position.y = 0.055;
    g.add(jar, lid, plugs);
  } else if (kind === 'cable_coil') {
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(0.13, 0.026, 8, 22),
      new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.45 })
    );
    torus.rotation.x = Math.PI / 2;
    torus.position.y = 0.026;
    const torus2 = torus.clone();
    torus2.position.y = 0.068;
    g.add(torus, torus2);
  } else {
    // Rugged Fusion Splicer / OTDR Hard Case
    const hardCase = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.2, 0.34),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.55 })
    );
    hardCase.position.y = 0.1;
    hardCase.castShadow = true;
    const latch1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.02), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    latch1.position.set(-0.12, 0.13, 0.172);
    const latch2 = latch1.clone();
    latch2.position.x = 0.12;
    g.add(hardCase, latch1, latch2);
  }
  return g;
}

function buildQuranBook(coverHex = 0x065f46, open = false): THREE.Group {
  const g = new THREE.Group();
  const coverMat = new THREE.MeshStandardMaterial({ color: coverHex, roughness: 0.45 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3, metalness: 0.5 });
  const pageMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.78 });

  if (open) {
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.015, 0.22), coverMat);
    g.add(spine);
    for (const side of [-1, 1]) {
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.22), coverMat);
      board.position.set(side * 0.085, 0.02, 0);
      board.rotation.z = side * 0.22;
      const pages = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.018, 0.2), pageMat);
      pages.position.set(side * 0.08, 0.032, 0);
      pages.rotation.z = side * 0.22;
      g.add(board, pages);
    }
    return g;
  }

  const cover = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.036, 0.22), coverMat);
  cover.castShadow = true;
  const pages = new THREE.Mesh(new THREE.BoxGeometry(0.148, 0.028, 0.206), pageMat);
  pages.position.x = 0.006;
  const ornament = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.004, 0.11), goldMat);
  ornament.position.y = 0.019;
  const spineTrim = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.038, 0.222), goldMat);
  spineTrim.position.x = -0.072;
  g.add(cover, pages, ornament, spineTrim);
  return g;
}

function buildSandalJepit(soleHex: number, strapHex: number): THREE.Group {
  const pair = new THREE.Group();
  const soleMat = new THREE.MeshStandardMaterial({ color: soleHex, roughness: 0.7 });
  const strapMat = new THREE.MeshStandardMaterial({ color: strapHex, roughness: 0.45 });

  for (const side of [-1, 1]) {
    const sandal = new THREE.Group();
    sandal.position.x = side * 0.068;

    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.018, 0.245), soleMat);
    sole.position.y = 0.009;
    sole.castShadow = true;
    sandal.add(sole);

    // Classic Y-shaped rubber flip-flop strap
    const toePost = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.028, 6), strapMat);
    toePost.position.set(0, 0.022, -0.068);
    sandal.add(toePost);

    for (const s of [-1, 1]) {
      const strapArm = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.095, 6), strapMat);
      strapArm.position.set(s * 0.022, 0.032, -0.032);
      strapArm.rotation.x = Math.PI / 2.25;
      strapArm.rotation.z = s * 0.48;
      sandal.add(strapArm);
    }

    pair.add(sandal);
  }
  return pair;
}

export type WorkerActivity =
  | 'default'
  | 'organize_boxes'
  | 'pantry_coffee'
  | 'wash_hands'
  | 'pray';

export interface OfficeWorkerNPC {
  group: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Group;
  leftForearm: THREE.Group;
  rightArm: THREE.Group;
  rightForearm: THREE.Group;
  leftLeg?: THREE.Group;
  rightLeg?: THREE.Group;
  leftShin?: THREE.Group;
  rightShin?: THREE.Group;
  phaseOffset: number;
  seated: boolean;
  holdingTablet: boolean;
  activity: WorkerActivity;
  baseRotationY: number;
  npcId?: OfficeNpcId;
  helpBadge?: THREE.Sprite;
}

interface StaffAppearancePreset {
  skinHex: number;
  hairHex: number;
  shirtHex: number;
  overshirtHex?: number;
  tieHex?: number;
  accentHex?: number;
  pantsHex: number;
  hairStyle: 'quiff' | 'comma' | 'slick' | 'crop' | 'long_wave' | 'ponytail' | 'sleek_bob' | 'chignon';
  outfitStyle:
    | 'tech_jacket'
    | 'street_hoodie'
    | 'smart_vest'
    | 'suit_tie'
    | 'shirt_tie'
    | 'blazer_blouse'
    | 'cardigan_polo'
    | 'smart_blouse';
  glasses: boolean;
  headset?: boolean;
  earrings?: boolean;
  skirt?: boolean;
  idBadgeHex: string;
  idRoleLabel: string;
  irisHex: string;
  lipHex: string;
  browStyle: 'arched' | 'straight' | 'bold';
  expression: 'warm_smile' | 'gentle_smile' | 'confident';
  stubble?: boolean;
  beautyMark?: boolean;
  jawScale?: number;
}

const MALE_PRESETS: StaffAppearancePreset[] = [
  {
    skinHex: 0xf7cfa9,
    hairHex: 0x241914,
    shirtHex: 0xf8fafc,
    overshirtHex: 0x0f3b66,
    tieHex: 0x38bdf8,
    accentHex: 0x38bdf8,
    pantsHex: 0x1e293b,
    hairStyle: 'quiff',
    outfitStyle: 'tech_jacket',
    glasses: false,
    headset: true,
    idBadgeHex: '#0284c7',
    idRoleLabel: 'SYSADMIN',
    irisHex: '#2f1e14',
    lipHex: '#d58c73',
    browStyle: 'straight',
    expression: 'warm_smile',
    jawScale: 0.9,
  },
  {
    skinHex: 0xf1c298,
    hairHex: 0x2c1d14,
    shirtHex: 0xe0f2fe,
    overshirtHex: 0x0f766e,
    tieHex: 0x1e293b,
    accentHex: 0x2dd4bf,
    pantsHex: 0x1e293b,
    hairStyle: 'comma',
    outfitStyle: 'smart_vest',
    glasses: true,
    idBadgeHex: '#0d9488',
    idRoleLabel: 'NOC OPS',
    irisHex: '#4f351e',
    lipHex: '#cc836c',
    browStyle: 'bold',
    expression: 'confident',
    jawScale: 0.92,
  },
  {
    skinHex: 0xe7b48a,
    hairHex: 0x181412,
    shirtHex: 0xf1f5f9,
    overshirtHex: 0x1e3a5f,
    tieHex: 0x7c3aed,
    accentHex: 0xa78bfa,
    pantsHex: 0x1f2937,
    hairStyle: 'slick',
    outfitStyle: 'suit_tie',
    glasses: false,
    idBadgeHex: '#2563eb',
    idRoleLabel: 'INFRA',
    irisHex: '#261810',
    lipHex: '#c27963',
    browStyle: 'bold',
    expression: 'confident',
    stubble: true,
    jawScale: 0.93,
  },
  {
    skinHex: 0xf4caa2,
    hairHex: 0x3b2618,
    shirtHex: 0xe2e8f0,
    overshirtHex: 0x0f4c3a,
    tieHex: 0x34d399,
    accentHex: 0x34d399,
    pantsHex: 0x27272a,
    hairStyle: 'crop',
    outfitStyle: 'street_hoodie',
    glasses: false,
    headset: true,
    idBadgeHex: '#059669',
    idRoleLabel: 'NET ENG',
    irisHex: '#1f425c',
    lipHex: '#d08972',
    browStyle: 'straight',
    expression: 'gentle_smile',
    stubble: true,
    jawScale: 0.91,
  },
  {
    skinHex: 0xedb890,
    hairHex: 0x1c1917,
    shirtHex: 0xede9fe,
    overshirtHex: 0x312e81,
    tieHex: 0x38bdf8,
    accentHex: 0x818cf8,
    pantsHex: 0x1e293b,
    hairStyle: 'quiff',
    outfitStyle: 'tech_jacket',
    glasses: true,
    idBadgeHex: '#4f46e5',
    idRoleLabel: 'DEVOPS',
    irisHex: '#3c2618',
    lipHex: '#c88069',
    browStyle: 'bold',
    expression: 'warm_smile',
    jawScale: 0.91,
  },
  {
    skinHex: 0xf8d2ae,
    hairHex: 0x452b1b,
    shirtHex: 0xf0fdf4,
    overshirtHex: 0x78350f,
    tieHex: 0xf59e0b,
    accentHex: 0xfbbf24,
    pantsHex: 0x1c1917,
    hairStyle: 'comma',
    outfitStyle: 'cardigan_polo',
    glasses: false,
    idBadgeHex: '#0284c7',
    idRoleLabel: 'SUPPORT',
    irisHex: '#4a351c',
    lipHex: '#d48d75',
    browStyle: 'arched',
    expression: 'warm_smile',
    jawScale: 0.89,
  },
  {
    skinHex: 0xe6b187,
    hairHex: 0x18181b,
    shirtHex: 0xf8fafc,
    overshirtHex: 0x7f1d32,
    tieHex: 0xfb7185,
    accentHex: 0xfb7185,
    pantsHex: 0x1e293b,
    hairStyle: 'slick',
    outfitStyle: 'suit_tie',
    glasses: false,
    idBadgeHex: '#be123c',
    idRoleLabel: 'WIFI ENG',
    irisHex: '#2a1c14',
    lipHex: '#c07862',
    browStyle: 'bold',
    expression: 'confident',
    stubble: true,
    jawScale: 0.93,
  },
  {
    skinHex: 0xf3c69f,
    hairHex: 0x271c16,
    shirtHex: 0xdbeafe,
    overshirtHex: 0x1e3a5f,
    tieHex: 0x38bdf8,
    accentHex: 0x38bdf8,
    pantsHex: 0x1e293b,
    hairStyle: 'crop',
    outfitStyle: 'smart_vest',
    glasses: true,
    idBadgeHex: '#0284c7',
    idRoleLabel: 'STAFF',
    irisHex: '#355020',
    lipHex: '#cc856e',
    browStyle: 'straight',
    expression: 'gentle_smile',
    jawScale: 0.91,
  },
  {
    skinHex: 0xf0be95,
    hairHex: 0x1c1917,
    shirtHex: 0xf8fafc,
    overshirtHex: 0x0f172a,
    tieHex: 0x0369a1,
    accentHex: 0x38bdf8,
    pantsHex: 0x0f172a,
    hairStyle: 'comma',
    outfitStyle: 'suit_tie',
    glasses: false,
    idBadgeHex: '#0284c7',
    idRoleLabel: 'LEAD',
    irisHex: '#2f1e14',
    lipHex: '#cb836c',
    browStyle: 'bold',
    expression: 'warm_smile',
    jawScale: 0.92,
  },
];

const FEMALE_PRESETS: StaffAppearancePreset[] = [
  {
    skinHex: 0xf9d3b0,
    hairHex: 0x241812,
    shirtHex: 0xf8fafc,
    overshirtHex: 0x0891b2,
    accentHex: 0x38bdf8,
    pantsHex: 0x1e293b,
    hairStyle: 'long_wave',
    outfitStyle: 'blazer_blouse',
    glasses: false,
    earrings: true,
    skirt: true,
    idBadgeHex: '#0891b2',
    idRoleLabel: 'FIBER LAB',
    irisHex: '#3b2316',
    lipHex: '#e11d48',
    browStyle: 'arched',
    expression: 'warm_smile',
    beautyMark: true,
    jawScale: 0.86,
  },
  {
    skinHex: 0xf4c7a0,
    hairHex: 0x1b1512,
    shirtHex: 0xf8fafc,
    overshirtHex: 0x4c1d95,
    accentHex: 0xa78bfa,
    pantsHex: 0x1e293b,
    hairStyle: 'ponytail',
    outfitStyle: 'tech_jacket',
    glasses: true,
    headset: true,
    earrings: true,
    idBadgeHex: '#7c3aed',
    idRoleLabel: 'ANALYST',
    irisHex: '#2b1b12',
    lipHex: '#db2777',
    browStyle: 'straight',
    expression: 'confident',
    jawScale: 0.86,
  },
  {
    skinHex: 0xf7cfa9,
    hairHex: 0x3a2419,
    shirtHex: 0xe0f2fe,
    overshirtHex: 0x1e3a5f,
    accentHex: 0x38bdf8,
    pantsHex: 0x0f172a,
    hairStyle: 'sleek_bob',
    outfitStyle: 'blazer_blouse',
    glasses: false,
    earrings: true,
    skirt: true,
    idBadgeHex: '#0284c7',
    idRoleLabel: 'FRONT DESK',
    irisHex: '#4f351e',
    lipHex: '#e11d48',
    browStyle: 'arched',
    expression: 'warm_smile',
    jawScale: 0.86,
  },
  {
    skinHex: 0xebb991,
    hairHex: 0x1c1715,
    shirtHex: 0xf0f9ff,
    overshirtHex: 0x0f766e,
    accentHex: 0x34d399,
    pantsHex: 0x1e293b,
    hairStyle: 'chignon',
    outfitStyle: 'smart_vest',
    glasses: false,
    earrings: true,
    idBadgeHex: '#0d9488',
    idRoleLabel: 'CLIENT OPS',
    irisHex: '#281a12',
    lipHex: '#be123c',
    browStyle: 'arched',
    expression: 'gentle_smile',
    beautyMark: true,
    jawScale: 0.87,
  },
  {
    skinHex: 0xf8d2ae,
    hairHex: 0x2e1f16,
    shirtHex: 0xfef2f2,
    overshirtHex: 0x881337,
    accentHex: 0xfb7185,
    pantsHex: 0x1e293b,
    hairStyle: 'long_wave',
    outfitStyle: 'street_hoodie',
    glasses: false,
    earrings: true,
    idBadgeHex: '#be123c',
    idRoleLabel: 'PRODUCT',
    irisHex: '#1f425c',
    lipHex: '#f43f5e',
    browStyle: 'straight',
    expression: 'warm_smile',
    jawScale: 0.85,
  },
  {
    skinHex: 0xf1c299,
    hairHex: 0x181412,
    shirtHex: 0xf5f3ff,
    overshirtHex: 0x334155,
    accentHex: 0xa78bfa,
    pantsHex: 0x0f172a,
    hairStyle: 'ponytail',
    outfitStyle: 'blazer_blouse',
    glasses: true,
    earrings: true,
    skirt: true,
    idBadgeHex: '#6d28d9',
    idRoleLabel: 'HR / OPS',
    irisHex: '#3b2416',
    lipHex: '#e11d48',
    browStyle: 'arched',
    expression: 'gentle_smile',
    jawScale: 0.86,
  },
];

let malePresetCursor = 0;
let femalePresetCursor = 0;

function buildOfficeWorkerNPC(opts: {
  shirtHex: number;
  hairHex: number;
  female?: boolean;
  seated?: boolean;
  holdingTablet?: boolean;
  activity?: WorkerActivity;
  phaseOffset?: number;
  presetIndex?: number;
}): OfficeWorkerNPC {
  const isFemale = Boolean(opts.female);
  const preset = isFemale
    ? FEMALE_PRESETS[(opts.presetIndex ?? femalePresetCursor++) % FEMALE_PRESETS.length]
    : MALE_PRESETS[(opts.presetIndex ?? malePresetCursor++) % MALE_PRESETS.length];
  const seated = Boolean(opts.seated);
  const holdingTablet = Boolean(opts.holdingTablet);
  const activity: WorkerActivity = opts.activity ?? 'default';

  const human = buildHumanCharacter({
    skinHex: preset.skinHex,
    hairHex: preset.hairHex,
    shirtHex: preset.shirtHex,
    overshirtHex: preset.overshirtHex,
    tieHex: preset.tieHex,
    accentHex: preset.accentHex,
    pantsHex: preset.pantsHex,
    hairStyle: preset.hairStyle,
    outfitStyle: preset.outfitStyle,
    glasses: preset.glasses,
    headset: preset.headset,
    earrings: preset.earrings,
    skirt: preset.skirt,
    idBadgeHex: preset.idBadgeHex,
    idRoleLabel: preset.idRoleLabel,
    irisHex: preset.irisHex,
    lipHex: preset.lipHex,
    browStyle: preset.browStyle,
    expression: preset.expression,
    stubble: preset.stubble,
    beautyMark: preset.beautyMark,
    jawScale: preset.jawScale,
    female: isFemale,
    watch: true,
    lanyard: true,
    seated,
  });

  if (activity === 'organize_boxes') {
    human.torso.rotation.x = 0.22;
    human.leftArm.rotation.x = -0.72;
    human.rightArm.rotation.x = -0.72;
    human.leftArm.rotation.z = -0.14;
    human.rightArm.rotation.z = 0.14;
    human.leftForearm.rotation.x = -0.74;
    human.rightForearm.rotation.x = -0.74;

    // Held cardboard box neatly carried in both hands
    const heldBox = new THREE.Group();
    heldBox.position.set(0, 0.04, 0.34);
    heldBox.rotation.x = 0.14;
    const boxMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.22, 0.26),
      new THREE.MeshStandardMaterial({ color: 0xc49a6c, roughness: 0.85 })
    );
    boxMesh.castShadow = true;
    const tapeStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.33, 0.02, 0.055),
      new THREE.MeshStandardMaterial({ color: 0xe7e5e4, roughness: 0.5 })
    );
    tapeStrip.position.y = 0.105;
    heldBox.add(boxMesh, tapeStrip);
    human.torso.add(heldBox);
  } else if (seated || holdingTablet) {
    human.leftArm.rotation.x = -0.45;
    human.rightArm.rotation.x = -0.45;
    human.leftForearm.rotation.x = -0.95;
    human.rightForearm.rotation.x = -0.95;
  } else {
    human.leftForearm.rotation.x = -0.25;
    human.rightForearm.rotation.x = -0.25;
  }

  if (holdingTablet && activity === 'default') {
    const tablet = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.016, 0.17),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.42,
      })
    );
    tablet.position.set(0, 0.24, 0.34);
    tablet.rotation.x = 0.35;
    human.torso.add(tablet);
  }

  return {
    group: human.group,
    hips: human.hips,
    torso: human.torso,
    headGroup: human.headGroup,
    leftArm: human.leftArm,
    leftForearm: human.leftForearm,
    rightArm: human.rightArm,
    rightForearm: human.rightForearm,
    leftLeg: human.leftLeg,
    rightLeg: human.rightLeg,
    leftShin: human.leftShin,
    rightShin: human.rightShin,
    phaseOffset: opts.phaseOffset ?? Math.random() * 6,
    seated,
    holdingTablet,
    activity,
    baseRotationY: 0,
  };
}

function buildObjectiveBeacon(colorHex = 0xf59e0b): THREE.Group {
  // Grounded architectural floor target ring (zero floating markers above heads)
  const g = new THREE.Group();
  const outerRing = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.5, 32),
    new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.72,
    })
  );
  outerRing.rotation.x = -Math.PI / 2;

  const innerRing = new THREE.Mesh(
    new THREE.RingGeometry(0.24, 0.28, 24),
    new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.42,
    })
  );
  innerRing.rotation.x = -Math.PI / 2;

  g.add(outerRing, innerRing);
  return g;
}

function buildWallACUnit(accentHex = 0x38bdf8): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.34,
    metalness: 0.08,
  });
  const intakeMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.45,
  });
  const ventMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.65,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.27, 0.19), bodyMat);
  body.castShadow = true;
  g.add(body);

  const topTrim = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.03, 0.16), intakeMat);
  topTrim.position.set(0, 0.125, -0.01);
  g.add(topTrim);

  const outlet = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.045, 0.03), ventMat);
  outlet.position.set(0, -0.095, 0.09);
  g.add(outlet);

  const louver = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.015, 0.06), bodyMat);
  louver.position.set(0, -0.105, 0.115);
  louver.rotation.x = 0.45;
  g.add(louver);

  const led = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.018, 0.015),
    new THREE.MeshBasicMaterial({ color: accentHex })
  );
  led.position.set(0.36, -0.02, 0.098);
  g.add(led);

  return g;
}

export interface DataPacketVisual {
  mesh: THREE.Mesh;
  curve: THREE.CatmullRomCurve3;
  offset: number;
  speed: number;
  channel: 'wired1' | 'wired2' | 'wifi' | 'core';
}

export interface OfficeBuildingSceneRefs {
  group: THREE.Group;
  serverStatusMat: THREE.MeshStandardMaterial;
  apRingMat: THREE.MeshStandardMaterial;
  pc1ScreenMat: THREE.MeshStandardMaterial;
  pc2ScreenMat: THREE.MeshStandardMaterial;
  pc1LedMat: THREE.MeshStandardMaterial;
  pc2LedMat: THREE.MeshStandardMaterial;
  pc1Cable: THREE.Mesh;
  pc2Cable: THREE.Mesh;
  messyCablesGroup: THREE.Group;
  tidiedCablesGroup: THREE.Group;
  workers: OfficeWorkerNPC[];
  npcWorkers: Record<OfficeNpcId, OfficeWorkerNPC>;
  bossWorker: OfficeWorkerNPC;
  npcInteractables: THREE.Object3D[];
  beacons: Record<WorkstationTargetId, THREE.Group>;
  bossReportBadge: THREE.Sprite;
  wifiWaveRings: THREE.Mesh[];
  dataPackets: DataPacketVisual[];
  updateNocMonitor: (state: MonitorScreenState) => void;
  updateStationScreen: (
    id:
      | 'client_pc_1'
      | 'client_pc_2'
      | 'employee_pc_reception'
      | 'employee_pc_os'
      | 'employee_pc_meeting',
    theme: EmployeeScreenTheme,
    title: string,
    subtitle: string,
    detail: string
  ) => void;
  interactables: THREE.Object3D[];
  seatInteractables: THREE.Object3D[];
  doorInteractables: THREE.Object3D[];
  roomDoors: Record<RoomDoorId, { leftPivot: THREE.Group; rightPivot: THREE.Group }>;
}

export function buildOfficeBuilding(maxAnisotropy: number): OfficeBuildingSceneRefs {
  malePresetCursor = 0;
  femalePresetCursor = 0;
  const group = new THREE.Group();
  const interactables: THREE.Object3D[] = [];
  const seatInteractables: THREE.Object3D[] = [];
  const doorInteractables: THREE.Object3D[] = [];
  const roomDoors = {} as Record<RoomDoorId, { leftPivot: THREE.Group; rightPivot: THREE.Group }>;
  const npcInteractables: THREE.Object3D[] = [];
  const workers: OfficeWorkerNPC[] = [];
  const npcWorkers = {} as Record<OfficeNpcId, OfficeWorkerNPC>;
  const helpBadgeTex = createHelpPopupTexture();

  const registerAskingNpc = (worker: OfficeWorkerNPC, npcId: OfficeNpcId) => {
    worker.npcId = npcId;
    worker.baseRotationY = worker.group.rotation.y;

    const hitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, worker.seated ? 1.3 : 1.72, 0.62),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitMesh.position.y = worker.seated ? 0.84 : 0.92;
    worker.group.add(hitMesh);

    const badge = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: helpBadgeTex,
        transparent: true,
        depthWrite: false,
      })
    );
    badge.position.set(0, worker.seated ? 1.66 : 2.02, 0);
    badge.scale.set(0.82, 0.34, 1);
    worker.helpBadge = badge;
    worker.group.add(badge);

    worker.group.traverse((child) => {
      child.userData.npcId = npcId;
    });
    npcInteractables.push(worker.group);
    npcWorkers[npcId] = worker;
  };

  const registerChatNpc = (worker: OfficeWorkerNPC, npcId: OfficeNpcId) => {
    worker.npcId = npcId;
    worker.baseRotationY = worker.group.rotation.y;

    const hitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, worker.seated ? 1.3 : 1.72, 0.62),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitMesh.position.y = worker.seated ? 0.84 : 0.92;
    worker.group.add(hitMesh);

    worker.group.traverse((child) => {
      child.userData.npcId = npcId;
    });
    npcInteractables.push(worker.group);
    npcWorkers[npcId] = worker;
  };

  const lightPlasterMat = new THREE.MeshStandardMaterial({
    map: createLightPlasterTexture(maxAnisotropy),
    roughness: 0.82,
    metalness: 0.02,
  });
  const warmWallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85, metalness: 0.02 });
  // Distinct calm pastel floor palettes (never white, clearly separated from white walls & aqua glass)
  const corridorTileMat = new THREE.MeshStandardMaterial({
    map: createPastelTileFloorTexture('#b9cfc3', '#aec6b9', '#97b2a3', 16, 2, maxAnisotropy),
    roughness: 0.68,
    metalness: 0.03,
  });
  const techFloorMat = new THREE.MeshStandardMaterial({
    map: createPastelTileFloorTexture('#7d8b99', '#738190', '#5f6d7c', 4, 4, maxAnisotropy),
    roughness: 0.62,
    metalness: 0.08,
  });
  const labStoneFloorMat = new THREE.MeshStandardMaterial({
    map: createPastelTileFloorTexture('#bcc3d4', '#b1b9cb', '#9ba4b8', 4, 4, maxAnisotropy),
    roughness: 0.66,
    metalness: 0.04,
  });
  const pantryPeachFloorMat = new THREE.MeshStandardMaterial({
    map: createPastelTileFloorTexture('#d6bfb2', '#ccb3a5', '#b59b8d', 4, 4, maxAnisotropy),
    roughness: 0.65,
    metalness: 0.04,
  });
  const toiletPastelFloorMat = new THREE.MeshStandardMaterial({
    map: createPastelTileFloorTexture('#b5cfe0', '#aac6d9', '#93b2c7', 4, 4, maxAnisotropy),
    roughness: 0.56,
    metalness: 0.05,
  });
  const oakFloorMat = new THREE.MeshStandardMaterial({
    map: createPastelWoodFloorTexture('#c4a688', '#ba9b7c', '#a68667', maxAnisotropy),
    roughness: 0.66,
    metalness: 0.03,
  });

  const woodDeskMat = new THREE.MeshStandardMaterial({
    map: createDeskWoodTexture(maxAnisotropy),
    color: 0xd6b895,
    roughness: 0.52,
  });
  const lightDeskMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.48, metalness: 0.08 });
  const slateFrameMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.42, metalness: 0.55 });
  const darkHardwareMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.38, metalness: 0.72 });
  // Distinct crisp architectural aqua-tinted transparent glass
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x7dd3fc,
    roughness: 0.08,
    metalness: 0.1,
    reflectivity: 0.9,
    clearcoat: 0.85,
    clearcoatRoughness: 0.06,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });

  // 1. Floor Slabs + Sleek Corridor Center Guide Strip (Calm Pastel Sage vs White Walls & Aqua Glass)
  const corridorSlab = new THREE.Mesh(new THREE.PlaneGeometry(48, 2.6), corridorTileMat);
  corridorSlab.rotation.x = -Math.PI / 2;
  corridorSlab.position.set(9, 0, 0);
  corridorSlab.receiveShadow = true;
  group.add(corridorSlab);

  const corridorGuide = new THREE.Mesh(
    new THREE.PlaneGeometry(45.5, 0.36),
    new THREE.MeshStandardMaterial({ color: 0x8ea89b, roughness: 0.72 })
  );
  corridorGuide.rotation.x = -Math.PI / 2;
  corridorGuide.position.set(9, 0.003, 0);
  corridorGuide.receiveShadow = true;
  group.add(corridorGuide);

  const musholaMarbleMat = new THREE.MeshStandardMaterial({
    map: createPastelTileFloorTexture('#bdd6ca', '#b2cdc0', '#9ab8aa', 3, 3, maxAnisotropy),
    roughness: 0.42,
  });
  const wudhuTileFloorMat = new THREE.MeshStandardMaterial({
    map: createPastelTileFloorTexture('#add0de', '#a2c7d6', '#8bb3c4', 4, 4, maxAnisotropy),
    roughness: 0.36,
  });
  const bossWalnutFloorMat = new THREE.MeshStandardMaterial({ color: 0x634026, roughness: 0.44, metalness: 0.08 });

  OFFICE_ROOMS.forEach((rm, idx) => {
    const fMat =
      rm.id === 'r13_mushola'
        ? musholaMarbleMat
        : rm.id === 'r14_wudhu'
          ? wudhuTileFloorMat
          : rm.id === 'r15_boss'
            ? bossWalnutFloorMat
            : rm.id === 'r16_lounge'
              ? oakFloorMat
              : rm.id === 'r10_pantry' || rm.id === 'r11_kitchen'
                ? pantryPeachFloorMat
                : rm.id === 'r12_toilet'
                  ? toiletPastelFloorMat
                  : idx < 2
                    ? techFloorMat
                    : idx < 4
                      ? labStoneFloorMat
                      : oakFloorMat;
    const fMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 6.2), fMat);
    fMesh.rotation.x = -Math.PI / 2;
    fMesh.position.set(rm.x, 0.004, rm.z < 0 ? -4.4 : 4.4);
    fMesh.receiveShadow = true;
    group.add(fMesh);
  });

  // 2. Perimeter Walls + Skyline Daylight Windows
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(48.2, 2.95, 0.2), lightPlasterMat);
  backWall.position.set(9, 1.475, -7.5);
  backWall.receiveShadow = true;
  group.add(backWall);

  const cityscapeTex = createWindowCityscapeTexture(maxAnisotropy);
  for (const wx of [0, 6, 12, 18, 24, 30]) {
    const winFrame = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.8, 0.24), slateFrameMat);
    winFrame.position.set(wx, 1.65, -7.5);
    const winGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 1.6),
      new THREE.MeshBasicMaterial({ map: cityscapeTex })
    );
    winGlass.position.set(wx, 1.65, -7.37);
    const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.6, 0.05), slateFrameMat);
    mullionV.position.set(wx, 1.65, -7.35);
    group.add(winFrame, winGlass, mullionV);
  }

  // Back wall crisp baseboard so wall & pastel floor stay clearly separated
  const backBaseboard = new THREE.Mesh(new THREE.BoxGeometry(48.2, 0.1, 0.24), slateFrameMat);
  backBaseboard.position.set(9, 0.05, -7.49);
  group.add(backBaseboard);

  for (const sx of [-15, 33]) {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.95, 15.2), warmWallMat);
    sideWall.position.set(sx, 1.475, 0);
    sideWall.receiveShadow = true;
    const sideBaseboard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 15.2), slateFrameMat);
    sideBaseboard.position.set(sx, 0.05, 0);
    group.add(sideWall, sideBaseboard);
  }

  const southCurb = new THREE.Mesh(new THREE.BoxGeometry(48.2, 0.28, 0.16), slateFrameMat);
  southCurb.position.set(9, 0.14, 7.5);
  group.add(southCurb);

  const solidOpaqueWallPanelMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.84,
    metalness: 0.02,
  });
  const musholaTrimMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.52 });
  const bossWallTrimMat = new THREE.MeshStandardMaterial({ color: 0x452714, roughness: 0.55 });
  const bossBrassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.28, metalness: 0.72 });

  // 3. Inter-Room Framed Glass & Solid Partitions + Corridor Entrance Headers
  for (const px of [-9, -3, 3, 9, 15, 21, 27]) {
    // Solid opaque partitions for Server (R.01), NOC (R.02), Meeting (R.05), & Mushola West (R.13)
    const isSolidNorthWall = px === -9 || px === -3 || px === 9 || px === 15 || px === 21;
    const isBossWestDivider = px === 27;
    if (isSolidNorthWall) {
      const solidDiv = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.55, 6.2), warmWallMat);
      solidDiv.position.set(px, 1.275, -4.4);
      solidDiv.castShadow = true;
      solidDiv.receiveShadow = true;
      const divPlinth = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.09, 6.2), slateFrameMat);
      divPlinth.position.set(px, 0.045, -4.4);
      group.add(solidDiv, divPlinth);
    } else {
      const pN = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, isBossWestDivider ? 1.55 : 0.88, 6.2),
        isBossWestDivider ? bossWallTrimMat : warmWallMat
      );
      pN.position.set(px, isBossWestDivider ? 0.775 : 0.44, -4.4);
      pN.castShadow = true;
      pN.receiveShadow = true;
      const gN = new THREE.Mesh(
        new THREE.BoxGeometry(isBossWestDivider ? 0.12 : 0.05, isBossWestDivider ? 1.08 : 1.65, 6.1),
        // Bagian atas dinding pemisah Mushola (R.13) & Ruang Bos (R.15) tetap solid tidak transparan
        isBossWestDivider ? solidOpaqueWallPanelMat : glassMat
      );
      gN.position.set(px, isBossWestDivider ? 2.08 : 1.7, -4.4);
      gN.castShadow = isBossWestDivider;
      gN.receiveShadow = isBossWestDivider;
      group.add(pN, gN);

      if (!isBossWestDivider) {
        const plinthN = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 6.2), slateFrameMat);
        plinthN.position.set(px, 0.04, -4.4);
        group.add(plinthN);
      }

      if (isBossWestDivider) {
        for (let z = -7.0; z <= -1.8; z += 0.34) {
          const louver = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.04, 0.045), bossWallTrimMat);
          louver.position.set(px, 2.08, z);
          group.add(louver);
        }
      }
    }

    const isSolidSouthWall = px === 15 || px === 21 || px === 27;
    if (isSolidSouthWall) {
      const solidDivS = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.48, 6.2), warmWallMat);
      solidDivS.position.set(px, 1.24, 4.4);
      solidDivS.castShadow = true;
      solidDivS.receiveShadow = true;
      const divPlinthS = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.09, 6.2), slateFrameMat);
      divPlinthS.position.set(px, 0.045, 4.4);
      group.add(solidDivS, divPlinthS);
    } else {
      const pS = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.85, 6.2), warmWallMat);
      pS.position.set(px, 0.425, 4.4);
      pS.castShadow = true;
      pS.receiveShadow = true;
      const plinthS = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 6.2), slateFrameMat);
      plinthS.position.set(px, 0.04, 4.4);
      const gS = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.35, 6.1), glassMat);
      gS.position.set(px, 1.52, 4.4);
      group.add(pS, plinthS, gS);
    }
  }

  OFFICE_ROOMS.forEach((rm) => {
    const wallZ = rm.z < 0 ? -1.3 : 1.3;
    const isNorth = rm.z < 0;
    const isBoss = rm.id === 'r15_boss';
    const isMushola = rm.id === 'r13_mushola';
    const isPrivateSolidRoom = rm.id === 'r12_toilet' || rm.id === 'r14_wudhu';
    const isClosedTechRoom =
      rm.id === 'r01_server' ||
      rm.id === 'r02_noc' ||
      rm.id === 'r03_storage' ||
      rm.id === 'r05_meeting';

    for (const side of [-1, 1]) {
      if (isMushola || isClosedTechRoom || isPrivateSolidRoom) {
        // Dinding depan solid tertutup penuh (Mushola, Toilet R.12, Tempat Wudhu R.14, Server R.01, NOC R.02, Gudang Kabel R.03, Ruang Rapat R.05)
        const solidSeg = new THREE.Mesh(new THREE.BoxGeometry(1.85, 2.48, 0.14), warmWallMat);
        solidSeg.position.set(rm.x + side * 2.08, 1.24, wallZ);
        solidSeg.castShadow = true;
        solidSeg.receiveShadow = true;
        const segPlinth = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.09, 0.17), slateFrameMat);
        segPlinth.position.set(rm.x + side * 2.08, 0.045, wallZ);
        const doorJamb = new THREE.Mesh(
          new THREE.BoxGeometry(0.09, 2.38, 0.18),
          isMushola ? musholaTrimMat : slateFrameMat
        );
        doorJamb.position.set(rm.x + side * 1.13, 1.19, wallZ);
        doorJamb.castShadow = true;
        group.add(solidSeg, segPlinth, doorJamb);
      } else {
        const seg = new THREE.Mesh(
          new THREE.BoxGeometry(1.85, isBoss ? 0.78 : 0.88, 0.14),
          isBoss ? bossWallTrimMat : warmWallMat
        );
        seg.position.set(rm.x + side * 2.08, isBoss ? 0.39 : 0.44, wallZ);
        seg.castShadow = true;
        seg.receiveShadow = true;
        const segPlinth = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.08, 0.17), slateFrameMat);
        segPlinth.position.set(rm.x + side * 2.08, 0.04, wallZ);
        group.add(seg, segPlinth);

        // Ruang Bos & koridor memakai panel kaca transparan polos seperti model awal
        const glass = new THREE.Mesh(
          new THREE.BoxGeometry(1.85, isBoss ? 1.6 : 1.52, 0.05),
          glassMat
        );
        glass.position.set(rm.x + side * 2.08, isBoss ? 1.58 : 1.64, wallZ);
        group.add(glass);
      }
    }

    if (isBoss || isClosedTechRoom) {
      const frameMat = isBoss ? bossWallTrimMat : slateFrameMat;
      const leafMat = isBoss ? bossWallTrimMat : slateFrameMat;
      const handleMat = isBoss ? bossBrassMat : lightDeskMat;
      const paneMat = glassMat;

      for (const side of [-1, 1]) {
        const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.11, 2.38, 0.18), frameMat);
        jamb.position.set(rm.x + side * 1.12, 1.19, wallZ);
        group.add(jamb);
      }
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.14, 0.18), frameMat);
      lintel.position.set(rm.x, 2.32, wallZ);
      group.add(lintel);

      const tagRoomDoor = (obj: THREE.Object3D) => {
        obj.userData.roomDoorId = rm.id;
        doorInteractables.push(obj);
      };

      const leftPivot = new THREE.Group();
      leftPivot.position.set(rm.x - 1.065, 0, wallZ);
      const leftLeaf = new THREE.Mesh(new THREE.BoxGeometry(1.06, 2.24, 0.06), leafMat);
      leftLeaf.position.set(0.53, 1.12, 0);
      leftLeaf.castShadow = true;
      tagRoomDoor(leftLeaf);
      const leftGlass = new THREE.Mesh(
        new THREE.BoxGeometry(isBoss ? 0.46 : 0.24, isBoss ? 1.56 : 1.16, 0.07),
        paneMat
      );
      leftGlass.position.set(0.56, 1.24, 0);
      tagRoomDoor(leftGlass);
      const leftHandle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.15), handleMat);
      leftHandle.position.set(0.92, 1.04, 0);
      tagRoomDoor(leftHandle);
      leftPivot.add(leftLeaf, leftGlass, leftHandle);
      group.add(leftPivot);

      const rightPivot = new THREE.Group();
      rightPivot.position.set(rm.x + 1.065, 0, wallZ);
      const rightLeaf = new THREE.Mesh(new THREE.BoxGeometry(1.06, 2.24, 0.06), leafMat);
      rightLeaf.position.set(-0.53, 1.12, 0);
      rightLeaf.castShadow = true;
      tagRoomDoor(rightLeaf);
      const rightGlass = new THREE.Mesh(
        new THREE.BoxGeometry(isBoss ? 0.46 : 0.24, isBoss ? 1.56 : 1.16, 0.07),
        paneMat
      );
      rightGlass.position.set(-0.56, 1.24, 0);
      tagRoomDoor(rightGlass);
      const rightHandle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.15), handleMat);
      rightHandle.position.set(-0.92, 1.04, 0);
      tagRoomDoor(rightHandle);
      rightPivot.add(rightLeaf, rightGlass, rightHandle);
      group.add(rightPivot);

      roomDoors[rm.id as RoomDoorId] = { leftPivot, rightPivot };
    }

    const header = new THREE.Mesh(
      new THREE.BoxGeometry(6.0, 0.34, 0.14),
      isBoss ? bossWallTrimMat : slateFrameMat
    );
    header.position.set(rm.x, 2.55, wallZ);
    group.add(header);

    const ledLine = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 0.025, 0.16),
      isBoss
        ? bossBrassMat
        : new THREE.MeshBasicMaterial({ color: isMushola ? 0x10b981 : 0x38bdf8 })
    );
    ledLine.position.set(rm.x, 2.38, wallZ);
    group.add(ledLine);

    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(1.85, 0.4),
      new THREE.MeshBasicMaterial({
        map: createRoomPlaqueTexture(rm.code, rm.label, maxAnisotropy),
        side: THREE.DoubleSide,
      })
    );
    plaque.position.set(rm.x, 2.55, wallZ + (isNorth ? 0.08 : -0.08));
    if (!isNorth) plaque.rotation.y = Math.PI;
    group.add(plaque);

    // Pasang Split AC Dinding di SETIAP ruangan (16 ruangan) pada posisi bebas halangan
    const acAccent = isBoss ? 0xfbbf24 : isMushola ? 0x10b981 : 0x38bdf8;
    const splitAc = buildWallACUnit(acAccent);
    if (!isNorth) {
      // Semua 8 ruang selatan: terpasang rapi di sisi dalam balok atas koridor menghadap selatan
      splitAc.position.set(rm.x + 1.85, 2.52, 1.44);
      splitAc.rotation.y = 0;
    } else if (rm.id === 'r01_server') {
      splitAc.position.set(-9.15, 2.34, -5.2);
      splitAc.rotation.y = -Math.PI / 2;
    } else if (rm.id === 'r02_noc') {
      splitAc.position.set(-8.84, 2.36, -4.1);
      splitAc.rotation.y = Math.PI / 2;
    } else if (rm.id === 'r03_storage') {
      splitAc.position.set(2.84, 2.36, -3.2);
      splitAc.rotation.y = -Math.PI / 2;
    } else if (rm.id === 'r04_lab') {
      splitAc.position.set(8.84, 2.36, -3.6);
      splitAc.rotation.y = -Math.PI / 2;
    } else if (rm.id === 'r05_meeting') {
      splitAc.position.set(14.84, 2.4, -6.0);
      splitAc.rotation.y = -Math.PI / 2;
    } else if (rm.id === 'r11_kitchen') {
      splitAc.position.set(20.84, 2.36, -4.0);
      splitAc.rotation.y = -Math.PI / 2;
    } else if (rm.id === 'r13_mushola') {
      splitAc.position.set(21.16, 2.42, -3.6);
      splitAc.rotation.y = Math.PI / 2;
    } else if (rm.id === 'r15_boss') {
      splitAc.position.set(32.28, 2.48, -7.32);
      splitAc.rotation.y = 0;
    }
    group.add(splitAc);
  });

  // Overhead Corridor Network Cable Tray + Live Glowing Backbone
  const overheadTray = new THREE.Mesh(
    new THREE.BoxGeometry(25.2, 0.04, 0.34),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.35 })
  );
  overheadTray.position.set(-1.5, 2.68, 0);
  group.add(overheadTray);

  const overheadBackbone = new THREE.Mesh(
    new THREE.BoxGeometry(24.6, 0.022, 0.06),
    new THREE.MeshBasicMaterial({ color: 0x0ea5e9 })
  );
  overheadBackbone.position.set(-1.5, 2.71, 0);
  group.add(overheadBackbone);

  for (const px of [-9, -3, 3, 9, 15, 21, 27]) {
    const plant = buildPlantPot(0.95);
    plant.position.set(px, 0, -1.0);
    group.add(plant);
  }

  // ==================== ROOM 01: SERVER ROOM (x=-12, z=-4.4) ====================
  const r01 = new THREE.Group();
  r01.position.set(-12, 0, -4.4);
  const bladeTex = createServerBladeTexture(maxAnisotropy);
  const bladeMat = new THREE.MeshStandardMaterial({
    map: bladeTex,
    roughness: 0.4,
    emissive: 0x0c4a6e,
    emissiveIntensity: 0.5,
  });

  const serverGroup = new THREE.Group();
  for (const rx of [-1.4, 0, 1.4]) {
    const rack = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.25, 0.9), darkHardwareMat);
    rack.position.set(rx, 1.125, -1.8);
    rack.castShadow = true;
    serverGroup.add(rack);

    const front = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 2.0), bladeMat);
    front.position.set(rx, 1.125, -1.34);
    serverGroup.add(front);

    const rackGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 2.06), glassMat);
    rackGlass.position.set(rx, 1.125, -1.32);
    serverGroup.add(rackGlass);
  }
  const serverStatusMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.9,
  });
  const serverHeaderBar = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.08, 0.08), serverStatusMat);
  serverHeaderBar.position.set(0, 2.32, -1.36);
  serverGroup.add(serverHeaderBar);
  tagInteractable(serverGroup, 'server_rack');
  interactables.push(serverGroup);
  r01.add(serverGroup);

  const acUnit = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.1, 0.7), lightDeskMat);
  acUnit.position.set(-2.35, 1.05, 0.2);
  acUnit.castShadow = true;
  const acVent = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.55, 0.52), darkHardwareMat);
  acVent.position.set(-1.91, 1.55, 0.2);
  const upsTower = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.35, 0.75), darkHardwareMat);
  upsTower.position.set(2.35, 0.675, -0.3);
  upsTower.castShadow = true;
  const upsDisplay = new THREE.Mesh(
    new THREE.PlaneGeometry(0.24, 0.14),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  upsDisplay.position.set(2.35, 1.05, 0.08);
  const mcbPanel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.6), slateFrameMat);
  mcbPanel.position.set(2.85, 1.45, 0.9);

  const wR01 = buildOfficeWorkerNPC({
    shirtHex: 0x0f766e,
    hairHex: 0x1c1917,
    seated: false,
    holdingTablet: true,
  });
  wR01.group.position.set(-1.6, 0, 1.4);
  wR01.group.rotation.y = 0.45;
  registerAskingNpc(wR01, 'npc_r01_arif');
  workers.push(wR01);

  const frameR01 = buildWallFrame('CORE INFRASTRUCTURE', '#38bdf8', 'server', maxAnisotropy, 0.9, 0.68);
  frameR01.position.set(2.88, 1.72, -1.65);
  frameR01.rotation.y = -Math.PI / 2;

  r01.add(acUnit, acVent, upsTower, upsDisplay, mcbPanel, frameR01, wR01.group);
  group.add(r01);

  // ==================== ROOM 02: RUANG NOC (x=-6, z=-4.4) ====================
  const r02 = new THREE.Group();
  r02.position.set(-6, 0, -4.4);

  const vwFrame = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.35, 0.08), darkHardwareMat);
  vwFrame.position.set(0, 1.75, -2.85);
  r02.add(vwFrame);
  for (let i = -1; i <= 1; i++) {
    const scr = new THREE.Mesh(
      new THREE.PlaneGeometry(1.32, 1.15),
      new THREE.MeshBasicMaterial({
        map: createDisplayPanelTexture(
          i === 0 ? 'NOC TOPOLOGY' : i === -1 ? 'TRAFFIC MONITOR' : 'ALERT LOGS',
          [
            { text: 'CORE-SW-01 : UP', color: '#34d399' },
            { text: 'LATENCY    : 1.1ms', color: '#38bdf8' },
            { text: '16 RUANG   : AKTIF', color: '#fbbf24' },
          ],
          '#09101c',
          maxAnisotropy
        ),
      })
    );
    scr.position.set(i * 1.42, 1.75, -2.8);
    r02.add(scr);
  }

  const nocDesk = new THREE.Group();
  nocDesk.position.set(-0.35, 0, -0.5);
  const nocTop = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.06, 0.95), woodDeskMat);
  nocTop.position.y = 0.76;
  nocTop.castShadow = true;
  nocDesk.add(nocTop);
  for (const lx of [-0.9, 0.9]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.74, 0.75), slateFrameMat);
    leg.position.set(lx, 0.37, 0);
    nocDesk.add(leg);
  }
  const nocMonitorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.62, 0.04), darkHardwareMat);
  nocMonitorFrame.position.set(0, 1.22, -0.2);
  nocDesk.add(nocMonitorFrame);

  const nocCanvas = document.createElement('canvas');
  nocCanvas.width = 1024;
  nocCanvas.height = 576;
  const nocTex = new THREE.CanvasTexture(nocCanvas);
  nocTex.colorSpace = THREE.SRGBColorSpace;
  nocTex.anisotropy = maxAnisotropy;
  const nocScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.04, 0.56),
    new THREE.MeshBasicMaterial({ map: nocTex })
  );
  nocScreen.position.set(0, 1.22, -0.175);
  nocDesk.add(nocScreen);

  const nocKb = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.025, 0.16), darkHardwareMat);
  nocKb.position.set(0, 0.8, 0.14);
  const nocMug = buildCoffeeMug(0x38bdf8);
  nocMug.position.set(-0.72, 0.79, 0.12);
  const nocVase = buildFlowerVase(0x38bdf8);
  nocVase.position.set(0.8, 0.79, -0.22);
  const nocChair = buildOfficeChair(0x334155);
  nocChair.position.set(-0.35, 0, 0.18);
  nocChair.rotation.y = Math.PI;
  tagSeat(nocChair, 'seat_noc');
  seatInteractables.push(nocChair);
  nocDesk.add(nocKb, nocMug, nocVase);
  tagInteractable(nocDesk, 'cli_monitor');
  interactables.push(nocDesk);
  r02.add(nocDesk, nocChair);

  const nocSideDesk = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.74, 1.3), lightDeskMat);
  nocSideDesk.position.set(2.15, 0.37, -1.2);
  const nocSideMon = buildDesktopMonitor(0x38bdf8);
  nocSideMon.position.set(2.1, 0.75, -1.2);
  nocSideMon.rotation.y = -Math.PI / 2;
  const nocWorkerChair = buildOfficeChair(0x334155);
  nocWorkerChair.position.set(1.5, 0, -1.2);
  nocWorkerChair.rotation.y = -Math.PI / 2;
  const w02 = buildOfficeWorkerNPC({ shirtHex: 0x0f766e, hairHex: 0x1c1917, seated: true });
  w02.group.position.set(1.55, 0, -1.2);
  w02.group.rotation.y = Math.PI / 2;
  registerAskingNpc(w02, 'npc_r02_raka');
  workers.push(w02);
  const frameR02 = buildWallFrame('NOC SLA · 99.9%', '#38bdf8', 'quotes', maxAnisotropy, 0.9, 0.68);
  frameR02.position.set(-2.88, 1.65, -1.05);
  frameR02.rotation.y = Math.PI / 2;
  r02.add(nocSideDesk, nocSideMon, nocWorkerChair, frameR02, w02.group);
  group.add(r02);

  // ==================== ROOM 03: GUDANG KABEL (x=0, z=-4.4) ====================
  const r03 = new THREE.Group();
  r03.position.set(0, 0, -4.4);

  const spoolRack = new THREE.Group();
  spoolRack.position.set(-0.9, 0, -1.6);
  for (const rx of [-1.0, 1.0]) {
    for (const rz of [-0.35, 0.35]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.0, 0.07), darkHardwareMat);
      post.position.set(rx, 1.0, rz);
      post.castShadow = true;
      spoolRack.add(post);
    }
  }
  for (const sy of [0.35, 1.0, 1.65]) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.05, 0.78), slateFrameMat);
    shelf.position.y = sy;
    shelf.castShadow = true;
    spoolRack.add(shelf);
  }
  [0x0284c7, 0xf59e0b, 0x10b981, 0x0284c7].forEach((col, i) => {
    const spool = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.24, 18),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.45 })
    );
    spool.position.set(-0.68 + i * 0.45, 1.15, 0);
    spool.castShadow = true;
    spoolRack.add(spool);
  });
  // Extra networking gear on R.03 storage rack: 24-port switches, RJ45 plug jar, & patch cord coils
  const rackSwitch1 = buildNetworkEquipUnit('switch');
  rackSwitch1.position.set(-0.55, 1.675, 0);
  const rackPatchPanel = buildNetworkEquipUnit('patch_panel');
  rackPatchPanel.position.set(0.12, 1.675, 0);
  const rackRj45Jar = buildNetworkEquipUnit('rj45_jar');
  rackRj45Jar.position.set(0.68, 1.675, 0.05);
  const rackCoil1 = buildNetworkEquipUnit('cable_coil', 0x0ea5e9);
  rackCoil1.position.set(-0.55, 0.375, 0);
  const rackCoil2 = buildNetworkEquipUnit('cable_coil', 0xfbbf24);
  rackCoil2.position.set(-0.18, 0.375, 0);
  const rackSplicerCase = buildNetworkEquipUnit('splicer_case');
  rackSplicerCase.position.set(0.42, 0.375, 0);
  spoolRack.add(rackSwitch1, rackPatchPanel, rackRj45Jar, rackCoil1, rackCoil2, rackSplicerCase);

  tagInteractable(spoolRack, 'utp_spool');
  interactables.push(spoolRack);
  r03.add(spoolRack);

  const toolbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.45, 0.48),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 })
  );
  toolbox.position.set(1.45, 0.225, -1.65);
  toolbox.castShadow = true;
  const supplyBox1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.55, 0.65),
    new THREE.MeshStandardMaterial({ color: 0xb9936c, roughness: 0.82 })
  );
  supplyBox1.position.set(1.55, 0.275, -0.82);
  supplyBox1.castShadow = true;

  const supplyBox2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.36, 0.44),
    new THREE.MeshStandardMaterial({ color: 0xcba175, roughness: 0.84 })
  );
  supplyBox2.position.set(1.52, 0.73, -0.85);
  supplyBox2.rotation.y = 0.16;
  supplyBox2.castShadow = true;

  const supplyBox3 = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.34, 0.46),
    new THREE.MeshStandardMaterial({ color: 0xb0895e, roughness: 0.84 })
  );
  supplyBox3.position.set(0.85, 0.17, -0.78);
  supplyBox3.castShadow = true;

  // Kardus terbuka berisi router-router jaringan baru di Gudang R.03
  const r03RouterBox1 = buildOpenRouterBox();
  r03RouterBox1.position.set(0.85, 0.34, -0.78);
  r03RouterBox1.rotation.y = -0.18;

  const r03RouterBox2 = buildOpenRouterBox();
  r03RouterBox2.position.set(2.18, 0.3, -1.45);
  r03RouterBox2.rotation.y = -0.35;
  const r03Pallet = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.3, 0.62),
    new THREE.MeshStandardMaterial({ color: 0xb9936c, roughness: 0.84 })
  );
  r03Pallet.position.set(2.18, 0.15, -1.45);
  r03Pallet.castShadow = true;
  const r03ExtraSwitch = buildNetworkEquipUnit('switch');
  r03ExtraSwitch.position.set(1.45, 0.45, -1.65);

  const ladderRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 1.65, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 })
  );
  ladderRail.position.set(-2.2, 0.82, -0.5);
  ladderRail.rotation.z = -0.18;
  ladderRail.castShadow = true;
  const frameR03 = buildWallFrame('PATCH SPEC T568B', '#38bdf8', 'server', maxAnisotropy);
  frameR03.position.set(2.42, 1.68, -2.95);

  const wR03 = buildOfficeWorkerNPC({
    shirtHex: 0x0284c7,
    hairHex: 0x241812,
    female: true,
    seated: false,
    holdingTablet: false,
    activity: 'organize_boxes',
  });
  wR03.group.position.set(1.45, 0, 0.05);
  wR03.group.rotation.y = Math.PI;
  registerAskingNpc(wR03, 'npc_r03_maya');
  workers.push(wR03);

  const frameR03W = buildWallFrame('CLEAN CABLING', '#0ea5e9', 'abstract_arch', maxAnisotropy, 0.86, 0.64);
  frameR03W.position.set(-2.88, 1.68, 0.85);
  frameR03W.rotation.y = Math.PI / 2;

  r03.add(
    toolbox,
    supplyBox1,
    supplyBox2,
    supplyBox3,
    r03RouterBox1,
    r03Pallet,
    r03RouterBox2,
    r03ExtraSwitch,
    ladderRail,
    frameR03,
    frameR03W,
    wR03.group
  );
  group.add(r03);

  // ==================== ROOM 04: LAB FIBER & CRIMPING (x=+6, z=-4.4) ====================
  const r04 = new THREE.Group();
  r04.position.set(6, 0, -4.4);

  const labBench = new THREE.Group();
  labBench.position.set(-0.2, 0, -1.2);
  const benchTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 0.95), lightDeskMat);
  benchTop.position.y = 0.78;
  benchTop.castShadow = true;
  labBench.add(benchTop);
  for (const lx of [-1.15, 1.15]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 0.8), slateFrameMat);
    leg.position.set(lx, 0.375, 0);
    labBench.add(leg);
  }
  const esdPad = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.012, 0.65),
    new THREE.MeshStandardMaterial({ map: createDeskMatTexture(maxAnisotropy), roughness: 0.9 })
  );
  esdPad.position.set(0, 0.815, 0.05);
  labBench.add(esdPad);

  const splicer = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.22, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
  );
  splicer.position.set(-0.65, 0.92, -0.1);
  const pliers = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.03, 0.11),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 })
  );
  pliers.position.set(0.15, 0.84, 0.15);
  const tester = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.05, 0.25),
    new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.35 })
  );
  tester.position.set(0.55, 0.84, 0.08);
  const benchOpm = buildNetworkEquipUnit('opm');
  benchOpm.position.set(-0.18, 0.81, 0.16);
  const benchRj45 = buildNetworkEquipUnit('rj45_jar');
  benchRj45.position.set(0.95, 0.81, -0.2);
  const benchFiberCoil = buildNetworkEquipUnit('cable_coil', 0xfacc15);
  benchFiberCoil.position.set(0.95, 0.81, 0.18);
  const benchPatchPanel = buildNetworkEquipUnit('patch_panel');
  benchPatchPanel.position.set(0.18, 0.81, -0.26);

  const labChair = buildOfficeChair(0x0284c7);
  labChair.position.set(-0.65, 0, 0.72);
  labChair.rotation.y = Math.PI;
  labBench.add(
    splicer,
    pliers,
    tester,
    benchOpm,
    benchRj45,
    benchFiberCoil,
    benchPatchPanel,
    labChair
  );
  tagInteractable(labBench, 'crimper_tool');
  interactables.push(labBench);

  // Side Equipment Rack & Kardus Isi Router in R.04 Fiber Lab
  const labEquipCart = new THREE.Group();
  labEquipCart.position.set(1.98, 0, -1.25);
  const cartTop = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.05, 0.95), lightDeskMat);
  cartTop.position.y = 0.74;
  cartTop.castShadow = true;
  const cartMid = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.04, 0.92), slateFrameMat);
  cartMid.position.y = 0.34;
  for (const [cx, cz] of [
    [-0.46, -0.4],
    [0.46, -0.4],
    [-0.46, 0.4],
    [0.46, 0.4],
  ]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.72, 0.05), slateFrameMat);
    leg.position.set(cx, 0.36, cz);
    labEquipCart.add(leg);
  }
  const r04RouterBox = buildOpenRouterBox();
  r04RouterBox.position.set(0, 0.765, -0.14);
  const r04Switch = buildNetworkEquipUnit('switch');
  r04Switch.position.set(0, 0.36, -0.18);
  const r04SplicerCase = buildNetworkEquipUnit('splicer_case');
  r04SplicerCase.position.set(0, 0.36, 0.22);
  const r04Coil = buildNetworkEquipUnit('cable_coil', 0x22d3ee);
  r04Coil.position.set(-0.22, 0.765, 0.24);
  const r04Rj45 = buildNetworkEquipUnit('rj45_jar');
  r04Rj45.position.set(0.24, 0.765, 0.24);
  labEquipCart.add(cartTop, cartMid, r04RouterBox, r04Switch, r04SplicerCase, r04Coil, r04Rj45);

  const w04 = buildOfficeWorkerNPC({
    shirtHex: 0x334155,
    hairHex: 0x292524,
    female: true,
    seated: true,
  });
  w04.group.position.set(-0.85, 0, -0.48);
  w04.group.rotation.y = Math.PI;
  registerAskingNpc(w04, 'npc_r04_nadia');
  workers.push(w04);

  const frameR04 = buildWallFrame('FIBER OPTIC CORE', '#34d399', 'topology', maxAnisotropy);
  frameR04.position.set(2.88, 1.72, -1.25);
  frameR04.rotation.y = -Math.PI / 2;
  const frameR04N = buildWallFrame('BOTANICAL STUDIO', '#10b981', 'monstera', maxAnisotropy, 0.78, 0.62);
  frameR04N.position.set(2.42, 1.68, -2.95);
  const plantR04 = buildPlantPot(0.9);
  plantR04.position.set(2.2, 0, -2.2);
  r04.add(labBench, labEquipCart, w04.group, frameR04, frameR04N, plantR04);
  group.add(r04);

  // ==================== ROOM 05: RUANG RAPAT (x=+12, z=-4.4) ====================
  const r05 = new THREE.Group();
  r05.position.set(12, 0, -4.4);

  const meetRug = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.92 })
  );
  meetRug.rotation.x = -Math.PI / 2;
  meetRug.position.set(0, 0.008, -0.2);
  meetRug.receiveShadow = true;
  r05.add(meetRug);

  const meetTable = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.07, 1.35), woodDeskMat);
  meetTable.position.set(0, 0.76, -0.2);
  meetTable.castShadow = true;
  r05.add(meetTable);
  const meetBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.72, 0.45), slateFrameMat);
  meetBase.position.set(0, 0.36, -0.2);
  r05.add(meetBase);

  const meetVase = buildFlowerVase(0xf59e0b);
  meetVase.position.set(0, 0.795, -0.2);
  const meetLapScreen = createLiveScreenHandle(maxAnisotropy);
  meetLapScreen.update(
    'wifi_disabled',
    'Laptop Presentasi',
    'Wi-Fi Adapter Disabled',
    'Cek Device Manager -> Enable'
  );
  const meetLap1 = buildDeskLaptop(0xf59e0b, meetLapScreen.texture);
  meetLap1.position.set(-0.9, 0.795, -0.45);
  const meetLap1Hit = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.55, 0.65),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  meetLap1Hit.position.y = 0.2;
  meetLap1.add(meetLap1Hit);
  tagInteractable(meetLap1, 'employee_pc_meeting');
  interactables.push(meetLap1);

  const meetLap2 = buildDeskLaptop(0x10b981);
  meetLap2.position.set(0.9, 0.795, 0.05);
  meetLap2.rotation.y = Math.PI;
  const meetMug = buildCoffeeMug(0xf8fafc);
  meetMug.position.set(0.45, 0.795, 0.12);
  r05.add(meetVase, meetLap1, meetLap2, meetMug);

  for (const cx of [-0.9, 0, 0.9]) {
    const c1 = buildOfficeChair(0x334155);
    c1.position.set(cx, 0, -1.15);
    if (cx === 0.9) {
      tagSeat(c1, 'seat_meet_ne');
      seatInteractables.push(c1);
    }
    const c2 = buildOfficeChair(0x334155);
    c2.position.set(cx, 0, 0.75);
    c2.rotation.y = Math.PI;
    if (cx === -0.9) {
      tagSeat(c2, 'seat_meet_sw');
      seatInteractables.push(c2);
    } else if (cx === 0) {
      tagSeat(c2, 'seat_meet_sm');
      seatInteractables.push(c2);
    }
    r05.add(c1, c2);
  }

  const w05 = buildOfficeWorkerNPC({ shirtHex: 0x1d4ed8, hairHex: 0x171717, seated: true });
  w05.group.position.set(-0.9, 0, -1.15);
  registerAskingNpc(w05, 'npc_r05_budi');
  const w06 = buildOfficeWorkerNPC({ shirtHex: 0x7c3aed, hairHex: 0x292524, female: true, seated: true });
  w06.group.position.set(0.9, 0, 0.75);
  w06.group.rotation.y = Math.PI;
  registerChatNpc(w06, 'npc_r05_citra');
  workers.push(w05, w06);

  const tvBoard = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 0.06), darkHardwareMat);
  tvBoard.position.set(2.75, 1.65, -0.2);
  tvBoard.rotation.y = -Math.PI / 2;
  const tvScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.05, 1.06),
    new THREE.MeshBasicMaterial({
      map: createDisplayPanelTexture(
        'ARSITEKTUR JARINGAN GEDUNG',
        [
          { text: '10 RUANGAN TERKONEKSI', color: '#38bdf8' },
          { text: 'SUBNET : 192.168.10.0/24', color: '#34d399' },
          { text: 'WIFI   : CORPORATE-5G', color: '#e2e8f0' },
        ],
        '#0f172a',
        maxAnisotropy
      ),
    })
  );
  tvScreen.position.set(2.7, 1.65, -0.2);
  tvScreen.rotation.y = -Math.PI / 2;

  const frameR05 = buildWallFrame('NETWORK TOPOLOGY', '#38bdf8', 'topology', maxAnisotropy);
  frameR05.position.set(-2.88, 1.65, -0.5);
  frameR05.rotation.y = Math.PI / 2;
  const frameR05W2 = buildWallFrame('COLLABORATION', '#0284c7', 'quotes', maxAnisotropy, 0.86, 0.64);
  frameR05W2.position.set(-2.88, 1.65, 0.68);
  frameR05W2.rotation.y = Math.PI / 2;
  const frameR05NL = buildWallFrame('HORIZON ARCH', '#38bdf8', 'landscape', maxAnisotropy, 0.82, 0.62);
  frameR05NL.position.set(-2.42, 1.68, -2.95);
  const frameR05NR = buildWallFrame('MODERN FORM', '#0d9488', 'abstract_arch', maxAnisotropy, 0.82, 0.62);
  frameR05NR.position.set(2.42, 1.68, -2.95);
  const plantR05 = buildPlantPot(1.1);
  plantR05.position.set(-2.2, 0, -2.2);
  r05.add(w05.group, w06.group, tvBoard, tvScreen, frameR05, frameR05W2, frameR05NL, frameR05NR, plantR05);
  group.add(r05);

  // ==================== ROOM 06: RESEPSIONIS (x=-12, z=+4.4) ====================
  const r06 = new THREE.Group();
  r06.position.set(-12, 0, 4.4);

  const recRug = new THREE.Mesh(
    new THREE.PlaneGeometry(3.1, 2.3),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 })
  );
  recRug.rotation.x = -Math.PI / 2;
  recRug.position.set(1.2, 0.008, 1.2);
  recRug.receiveShadow = true;
  r06.add(recRug);

  const recCounter = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.05, 0.78), lightDeskMat);
  recCounter.position.set(-0.5, 0.525, -0.4);
  recCounter.castShadow = true;
  const recAccentPanel = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 0.65, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 })
  );
  recAccentPanel.position.set(-0.5, 0.52, -0.8);
  const recTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 0.85), woodDeskMat);
  recTop.position.set(-0.5, 1.08, -0.4);
  const recPcScreen = createLiveScreenHandle(maxAnisotropy);
  recPcScreen.update(
    'no_internet',
    'PC Resepsionis',
    'ERR_NAME_NOT_RESOLVED',
    'IP 169.254.12.4 · Cek DNS/DHCP'
  );
  const recPc = buildDesktopMonitor(0xf43f5e, recPcScreen.texture);
  recPc.position.set(-0.85, 1.11, -0.45);
  const recPcHit = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.75, 0.75),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  recPcHit.position.y = 0.25;
  recPc.add(recPcHit);
  tagInteractable(recPc, 'employee_pc_reception');
  interactables.push(recPc);

  const recVase = buildFlowerVase(0xfb7185);
  recVase.position.set(0.35, 1.11, -0.4);

  // Corporate Sign on West Wall
  const corpSign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.3, 0.58),
    new THREE.MeshBasicMaterial({ map: createCompanySignTexture(maxAnisotropy) })
  );
  corpSign.position.set(-2.82, 1.75, -0.8);
  corpSign.rotation.y = Math.PI / 2;

  const recChair = buildOfficeChair(0x334155);
  recChair.position.set(-0.85, 0, 0.35);
  recChair.rotation.y = Math.PI;
  const w07 = buildOfficeWorkerNPC({
    shirtHex: 0x0369a1,
    hairHex: 0x1c1917,
    female: true,
    seated: true,
  });
  w07.group.position.set(-0.85, 0, 0.35);
  w07.group.rotation.y = Math.PI;
  registerAskingNpc(w07, 'npc_r06_sari');
  workers.push(w07);

  const sofa = new THREE.Mesh(
    new THREE.BoxGeometry(1.75, 0.45, 0.82),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.82 })
  );
  sofa.position.set(1.5, 0.225, 1.4);
  sofa.castShadow = true;
  tagSeat(sofa, 'seat_rec_sofa');
  seatInteractables.push(sofa);
  const sofaBack = new THREE.Mesh(
    new THREE.BoxGeometry(1.75, 0.45, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.82 })
  );
  sofaBack.position.set(1.5, 0.58, 1.72);
  tagSeat(sofaBack, 'seat_rec_sofa');
  const coffeeTable = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.04, 0.58), woodDeskMat);
  coffeeTable.position.set(1.5, 0.38, 0.45);
  coffeeTable.castShadow = true;
  const coffeeTableBase = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.36, 0.32), slateFrameMat);
  coffeeTableBase.position.set(1.5, 0.18, 0.45);
  const coffeeTableVase = buildFlowerVase(0xf59e0b);
  coffeeTableVase.position.set(1.25, 0.4, 0.45);

  const frameR06 = buildWallFrame('OFFICE BOTANICAL', '#10b981', 'botanical', maxAnisotropy);
  frameR06.position.set(-2.85, 2.05, 1.25);
  frameR06.rotation.y = Math.PI / 2;
  const frameR06B = buildWallFrame('SERENE HORIZON', '#0284c7', 'landscape', maxAnisotropy, 0.82, 0.62);
  frameR06B.position.set(-2.85, 1.72, 2.42);
  frameR06B.rotation.y = Math.PI / 2;
  const recMiniLib = buildMiniLibrary('compact', maxAnisotropy);
  recMiniLib.position.set(-2.62, 0, 1.25);
  recMiniLib.rotation.y = Math.PI / 2;
  const plantR06 = buildPlantPot(1.1);
  plantR06.position.set(-2.3, 0, 2.42);
  r06.add(
    recCounter,
    recAccentPanel,
    recTop,
    recPc,
    recVase,
    corpSign,
    recChair,
    w07.group,
    sofa,
    sofaBack,
    coffeeTable,
    coffeeTableBase,
    coffeeTableVase,
    frameR06,
    frameR06B,
    recMiniLib,
    plantR06
  );
  group.add(r06);

  // ==================== ROOM 07: KERJA KLIEN A (x=-6, z=+4.4) ====================
  const r07 = new THREE.Group();
  r07.position.set(-6, 0, 4.4);

  const deskA = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.06, 1.3), woodDeskMat);
  deskA.position.set(0, 0.75, 0.2);
  deskA.castShadow = true;
  r07.add(deskA);
  for (const lx of [-1.25, 1.25]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.73, 1.1), slateFrameMat);
    leg.position.set(lx, 0.365, 0.2);
    r07.add(leg);
  }

  const vaseA = buildFlowerVase(0x38bdf8);
  vaseA.position.set(0.05, 0.78, 0.55);
  r07.add(vaseA);

  const pc1ScreenHandle = createLiveScreenHandle(maxAnisotropy);
  pc1ScreenHandle.update(
    'no_cable',
    'Workstation PC-01',
    'Network Cable Unplugged',
    'Ambil Cat6 di R.03 & colok RJ45'
  );
  const pc1Group = new THREE.Group();
  pc1Group.position.set(-0.75, 0.78, -0.05);
  const pc1Frame = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.4, 0.04), darkHardwareMat);
  pc1Frame.position.set(0, 0.28, 0);
  const pc1Stand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.06), darkHardwareMat);
  pc1Stand.position.set(0, 0.08, 0.01);
  const pc1PortBox = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.14), darkHardwareMat);
  pc1PortBox.position.set(0.42, 0.04, 0);
  const pc1ScreenMat = new THREE.MeshStandardMaterial({
    map: pc1ScreenHandle.texture,
    emissiveMap: pc1ScreenHandle.texture,
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.65,
  });
  const pc1Screen = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.34), pc1ScreenMat);
  pc1Screen.position.set(0, 0.28, -0.025);
  pc1Screen.rotation.y = Math.PI;
  const pc1Hit = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 1.0), new THREE.MeshBasicMaterial({ visible: false }));
  pc1Hit.position.y = 0.35;
  pc1Group.add(pc1Frame, pc1Stand, pc1PortBox, pc1Screen, pc1Hit);
  tagInteractable(pc1Group, 'client_pc_1');
  interactables.push(pc1Group);

  const pc1LedMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.9 });
  const switchA = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.25), darkHardwareMat);
  switchA.position.set(0.65, 0.82, -0.05);
  const ledA = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.04), pc1LedMat);
  ledA.position.set(0.65, 0.83, -0.18);

  const pc1Curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.65, 0.8, -0.05),
    new THREE.Vector3(0, 0.8, 0.22),
    new THREE.Vector3(-0.33, 0.82, -0.05),
  ]);
  const pc1Cable = new THREE.Mesh(
    new THREE.TubeGeometry(pc1Curve, 16, 0.015, 8, false),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
  );
  pc1Cable.visible = false;

  const chairA = buildOfficeChair(0x334155);
  chairA.position.set(-0.75, 0, -0.78);
  tagSeat(chairA, 'seat_client_a');
  seatInteractables.push(chairA);

  const osPcScreen = createLiveScreenHandle(maxAnisotropy);
  osPcScreen.update(
    'bsod',
    'PC Karyawan Divisi A',
    'BSOD: INACCESSIBLE_BOOT',
    'Install Ulang Windows & Driver'
  );
  const staffMonA1 = buildDesktopMonitor(0x2563eb, osPcScreen.texture);
  staffMonA1.position.set(0.75, 0.78, 0.48);
  const osPcHit = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.7, 0.75),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  osPcHit.position.y = 0.25;
  staffMonA1.add(osPcHit);
  tagInteractable(staffMonA1, 'employee_pc_os');
  interactables.push(staffMonA1);

  const chairStaffA1 = buildOfficeChair(0x334155);
  chairStaffA1.position.set(0.75, 0, 1.15);
  chairStaffA1.rotation.y = Math.PI;
  const w08 = buildOfficeWorkerNPC({ shirtHex: 0x475569, hairHex: 0x18181b, seated: true });
  w08.group.position.set(0.75, 0, 1.15);
  w08.group.rotation.y = Math.PI;
  registerAskingNpc(w08, 'npc_r07_fajar');

  const staffMonA2 = buildDesktopMonitor(0x10b981);
  staffMonA2.position.set(-0.75, 0.78, 0.48);
  const chairStaffA2 = buildOfficeChair(0x334155);
  chairStaffA2.position.set(-0.75, 0, 1.15);
  chairStaffA2.rotation.y = Math.PI;
  const w09 = buildOfficeWorkerNPC({ shirtHex: 0x0284c7, hairHex: 0x292524, female: true, seated: true });
  w09.group.position.set(-0.75, 0, 1.15);
  w09.group.rotation.y = Math.PI;
  registerAskingNpc(w09, 'npc_r07_laras');
  workers.push(w08, w09);

  const lockerA = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.5, 0.5), slateFrameMat);
  lockerA.position.set(2.3, 0.75, 1.9);
  lockerA.castShadow = true;
  r07.add(
    pc1Group,
    switchA,
    ledA,
    pc1Cable,
    chairA,
    staffMonA1,
    chairStaffA1,
    w08.group,
    staffMonA2,
    chairStaffA2,
    w09.group,
    lockerA
  );
  group.add(r07);

  // ==================== ROOM 08: KERJA KLIEN B (x=0, z=+4.4) ====================
  const r08 = new THREE.Group();
  r08.position.set(0, 0, 4.4);

  const deskB = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.06, 1.3), woodDeskMat);
  deskB.position.set(0, 0.75, 0.2);
  deskB.castShadow = true;
  r08.add(deskB);
  for (const lx of [-1.25, 1.25]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.73, 1.1), slateFrameMat);
    leg.position.set(lx, 0.365, 0.2);
    r08.add(leg);
  }

  const vaseB = buildFlowerVase(0xa78bfa);
  vaseB.position.set(0.0, 0.78, 0.52);
  r08.add(vaseB);

  const pc2ScreenHandle = createLiveScreenHandle(maxAnisotropy);
  pc2ScreenHandle.update(
    'no_cable',
    'Workstation PC-02',
    'Network Cable Unplugged',
    'Ambil Cat6 di R.03 & colok RJ45'
  );
  const pc2Group = new THREE.Group();
  pc2Group.position.set(0.65, 0.78, -0.05);
  const pc2Frame = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.4, 0.04), darkHardwareMat);
  pc2Frame.position.set(0, 0.28, 0);
  const pc2Stand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.06), darkHardwareMat);
  pc2Stand.position.set(0, 0.08, 0.01);
  const pc2PortBox = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.14), darkHardwareMat);
  pc2PortBox.position.set(-0.42, 0.04, 0);
  const pc2ScreenMat = new THREE.MeshStandardMaterial({
    map: pc2ScreenHandle.texture,
    emissiveMap: pc2ScreenHandle.texture,
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.65,
  });
  const pc2Screen = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.34), pc2ScreenMat);
  pc2Screen.position.set(0, 0.28, -0.025);
  pc2Screen.rotation.y = Math.PI;
  const pc2Hit = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 1.0), new THREE.MeshBasicMaterial({ visible: false }));
  pc2Hit.position.y = 0.35;
  pc2Group.add(pc2Frame, pc2Stand, pc2PortBox, pc2Screen, pc2Hit);
  tagInteractable(pc2Group, 'client_pc_2');
  interactables.push(pc2Group);

  const pc2LedMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.9 });
  const switchB = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.25), darkHardwareMat);
  switchB.position.set(-0.65, 0.82, -0.05);
  const ledB = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.04), pc2LedMat);
  ledB.position.set(-0.65, 0.83, -0.18);

  const pc2Curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.65, 0.8, -0.05),
    new THREE.Vector3(0, 0.8, 0.22),
    new THREE.Vector3(0.23, 0.82, -0.05),
  ]);
  const pc2Cable = new THREE.Mesh(
    new THREE.TubeGeometry(pc2Curve, 16, 0.015, 8, false),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
  );
  pc2Cable.visible = false;

  const chairB = buildOfficeChair(0x334155);
  chairB.position.set(0.65, 0, -0.78);
  tagSeat(chairB, 'seat_client_b');
  seatInteractables.push(chairB);

  const staffMonB1 = buildDesktopMonitor(0x10b981);
  staffMonB1.position.set(-0.75, 0.78, 0.48);
  const chairStaffB1 = buildOfficeChair(0x334155);
  chairStaffB1.position.set(-0.75, 0, 1.15);
  chairStaffB1.rotation.y = Math.PI;
  const w10 = buildOfficeWorkerNPC({ shirtHex: 0x0f766e, hairHex: 0x292524, female: true, seated: true });
  w10.group.position.set(-0.75, 0, 1.15);
  w10.group.rotation.y = Math.PI;
  registerChatNpc(w10, 'npc_r08_putri');

  const staffMonB2 = buildDesktopMonitor(0x38bdf8);
  staffMonB2.position.set(0.75, 0.78, 0.48);
  const chairStaffB2 = buildOfficeChair(0x334155);
  chairStaffB2.position.set(0.75, 0, 1.15);
  chairStaffB2.rotation.y = Math.PI;
  const w11 = buildOfficeWorkerNPC({ shirtHex: 0x1d4ed8, hairHex: 0x171717, seated: true });
  w11.group.position.set(0.75, 0, 1.15);
  w11.group.rotation.y = Math.PI;
  registerAskingNpc(w11, 'npc_r08_dimas');
  workers.push(w10, w11);

  const printer = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.55), lightDeskMat);
  printer.position.set(-2.2, 0.275, 1.9);
  printer.castShadow = true;
  const paperTray = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.04, 0.3),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 })
  );
  paperTray.position.set(-2.2, 0.57, 1.85);
  r08.add(
    pc2Group,
    switchB,
    ledB,
    pc2Cable,
    chairB,
    staffMonB1,
    chairStaffB1,
    w10.group,
    staffMonB2,
    chairStaffB2,
    w11.group,
    printer,
    paperTray
  );
  group.add(r08);

  // ==================== ROOM 09: RUANG WI-FI & ACCESS POINT (x=+6, z=+4.4) ====================
  const r09 = new THREE.Group();
  r09.position.set(6, 0, 4.4);

  const apStandGroup = new THREE.Group();
  apStandGroup.position.set(0, 0, 0.6);
  const apPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 2.0, 12), darkHardwareMat);
  apPole.position.y = 1.0;
  apPole.castShadow = true;
  const apDish = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.1, 20), lightDeskMat);
  apDish.position.y = 2.02;
  apDish.castShadow = true;
  const apRingMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.9,
  });
  const apRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 8, 24), apRingMat);
  apRing.rotation.x = Math.PI / 2;
  apRing.position.y = 2.08;
  const apHit = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 1.1), new THREE.MeshBasicMaterial({ visible: false }));
  apHit.position.y = 1.1;
  apStandGroup.add(apPole, apDish, apRing, apHit);
  tagInteractable(apStandGroup, 'ap_mount');
  interactables.push(apStandGroup);

  // Expanding Wi-Fi Signal Wave Rings (animated when AP is active)
  const wifiWaveRings: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const wave = new THREE.Mesh(
      new THREE.TorusGeometry(0.32 + i * 0.14, 0.014, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.55 })
    );
    wave.rotation.x = Math.PI / 2;
    wave.position.set(0, 2.15 + i * 0.12, 0.6);
    wave.visible = false;
    wifiWaveRings.push(wave);
    r09.add(wave);
  }

  const poeBench = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.75, 0.72), lightDeskMat);
  poeBench.position.set(-1.6, 0.375, 0.8);
  poeBench.castShadow = true;
  const poeMon = buildDesktopMonitor(0x38bdf8);
  poeMon.position.set(-1.6, 0.75, 0.82);
  poeMon.rotation.y = Math.PI;

  const poeChair = buildOfficeChair(0x334155);
  poeChair.position.set(-1.6, 0, 0.15);
  const w12 = buildOfficeWorkerNPC({ shirtHex: 0x2563eb, hairHex: 0x1c1917, seated: true });
  w12.group.position.set(-1.6, 0, 0.15);
  registerAskingNpc(w12, 'npc_r09_bagus');
  workers.push(w12);

  const plantR09 = buildPlantPot(0.95);
  plantR09.position.set(2.1, 0, 1.8);
  r09.add(apStandGroup, poeBench, poeMon, poeChair, w12.group, plantR09);
  group.add(r09);

  // ==================== ROOM 10: PANTRY & LOUNGE (x=+12, z=+4.4) ====================
  const r10 = new THREE.Group();
  r10.position.set(12, 0, 4.4);

  const loungeRug = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 2.3),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 })
  );
  loungeRug.rotation.x = -Math.PI / 2;
  loungeRug.position.set(0, 0.008, -0.2);
  loungeRug.receiveShadow = true;
  r10.add(loungeRug);

  const kitchenBar = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.9, 0.75), lightDeskMat);
  kitchenBar.position.set(0.8, 0.45, 2.1);
  kitchenBar.castShadow = true;
  const barTop = new THREE.Mesh(new THREE.BoxGeometry(2.86, 0.05, 0.8), woodDeskMat);
  barTop.position.set(0.8, 0.925, 2.1);
  const espresso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.42, 0.35), darkHardwareMat);
  espresso.position.set(0.3, 1.15, 2.1);
  const espressoLed = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.04, 0.02),
    new THREE.MeshBasicMaterial({ color: 0x10b981 })
  );
  espressoLed.position.set(0.3, 1.24, 1.92);
  const barMug1 = buildCoffeeMug(0xf8fafc);
  barMug1.position.set(1.1, 0.95, 2.05);
  const barMug2 = buildCoffeeMug(0xf59e0b);
  barMug2.position.set(1.26, 0.95, 2.12);

  // Water Dispenser with Blue 19L Bottle
  const dispenser = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.98, 0.36), lightDeskMat);
  dispenser.position.set(-1.1, 0.49, 2.1);
  dispenser.castShadow = true;
  const gallon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.42, 16),
    new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55, roughness: 0.1 })
  );
  gallon.position.set(-1.1, 1.19, 2.1);

  const fridge = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.85, 0.75), slateFrameMat);
  fridge.position.set(-1.9, 0.925, 2.1);
  fridge.castShadow = true;
  const cafeTable = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.05, 20), woodDeskMat);
  cafeTable.position.set(0, 0.74, -0.2);
  const cafeStem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.25, 0.72, 12), darkHardwareMat);
  cafeStem.position.set(0, 0.36, -0.2);

  const cafeVase = buildFlowerVase(0xfbbf24);
  cafeVase.position.set(0, 0.765, -0.2);
  const cafeMug = buildCoffeeMug(0x38bdf8);
  cafeMug.position.set(0.28, 0.765, -0.1);

  const cafeChair = buildOfficeChair(0x475569);
  cafeChair.position.set(0.78, 0, -0.2);
  cafeChair.rotation.y = -Math.PI / 2;
  const w13 = buildOfficeWorkerNPC({ shirtHex: 0x3b82f6, hairHex: 0x171717, seated: true });
  w13.group.position.set(0.78, 0, -0.2);
  w13.group.rotation.y = -Math.PI / 2;
  registerChatNpc(w13, 'npc_r10_reza');
  workers.push(w13);

  const frameR10 = buildWallFrame('BREAK & RECHARGE', '#10b981', 'botanical', maxAnisotropy);
  frameR10.position.set(2.85, 1.68, -1.0);
  frameR10.rotation.y = -Math.PI / 2;
  const plantR10 = buildPlantPot(1.1);
  plantR10.position.set(2.3, 0, -0.5);
  r10.add(
    kitchenBar,
    barTop,
    espresso,
    espressoLed,
    barMug1,
    barMug2,
    dispenser,
    gallon,
    fridge,
    cafeTable,
    cafeStem,
    cafeVase,
    cafeMug,
    cafeChair,
    w13.group,
    frameR10,
    plantR10
  );
  group.add(r10);

  // ==================== ROOM 11: DAPUR KARYAWAN (x=+18, z=-4.4) ====================
  const r11 = new THREE.Group();
  r11.position.set(18, 0, -4.4);

  const kitCounter = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.88, 0.78), lightDeskMat);
  kitCounter.position.set(-0.2, 0.44, -2.45);
  kitCounter.castShadow = true;
  const kitTop = new THREE.Mesh(new THREE.BoxGeometry(3.56, 0.06, 0.84), woodDeskMat);
  kitTop.position.set(-0.2, 0.91, -2.45);
  const sinkBasin = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.05, 0.48), slateFrameMat);
  sinkBasin.position.set(-1.0, 0.93, -2.42);
  const faucet = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.24, 10), slateFrameMat);
  faucet.position.set(-1.0, 1.05, -2.62);
  const microwave = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.34, 0.38), darkHardwareMat);
  microwave.position.set(0.15, 1.11, -2.48);
  const mwGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.22),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  mwGlass.position.set(0.08, 1.11, -2.285);
  const kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.24, 14), slateFrameMat);
  kettle.position.set(0.95, 1.06, -2.42);
  const kitMug = buildCoffeeMug(0xf59e0b);
  kitMug.position.set(0.68, 0.94, -2.35);

  const kitFridge = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.92, 0.78), slateFrameMat);
  kitFridge.position.set(2.25, 0.96, -2.42);
  kitFridge.castShadow = true;
  const fridgeDoorLine = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.02, 0.02), lightDeskMat);
  fridgeDoorLine.position.set(2.25, 1.28, -2.02);

  const islandTable = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.76, 0.88), woodDeskMat);
  islandTable.position.set(-0.2, 0.38, 0.25);
  islandTable.castShadow = true;
  const snackJar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.22, 14),
    new THREE.MeshPhysicalMaterial({ color: 0xfde68a, transparent: true, opacity: 0.75, roughness: 0.2 })
  );
  snackJar.position.set(0.22, 0.87, 0.25);
  const islandMug = buildCoffeeMug(0x38bdf8);
  islandMug.position.set(-0.42, 0.76, 0.22);

  const stool1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.48, 14), darkHardwareMat);
  stool1.position.set(-0.55, 0.24, 1.05);
  tagSeat(stool1, 'seat_kitchen_1');
  seatInteractables.push(stool1);
  const stool2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.48, 14), darkHardwareMat);
  stool2.position.set(0.25, 0.24, 1.05);
  tagSeat(stool2, 'seat_kitchen_2');
  seatInteractables.push(stool2);

  const frameR11 = buildWallFrame('DAPUR KARYAWAN', '#f59e0b', 'botanical', maxAnisotropy);
  frameR11.position.set(-2.88, 1.65, -0.8);
  frameR11.rotation.y = Math.PI / 2;
  const frameR11E1 = buildWallFrame('MONSTERA LEAF', '#059669', 'monstera', maxAnisotropy, 0.84, 0.64);
  frameR11E1.position.set(2.88, 1.65, -0.2);
  frameR11E1.rotation.y = -Math.PI / 2;
  const frameR11E2 = buildWallFrame('WARM MINIMAL', '#d97706', 'abstract_arch', maxAnisotropy, 0.84, 0.64);
  frameR11E2.position.set(2.88, 1.65, 0.88);
  frameR11E2.rotation.y = -Math.PI / 2;
  const frameR11N = buildWallFrame('MORNING VIEW', '#0284c7', 'landscape', maxAnisotropy, 0.8, 0.62);
  frameR11N.position.set(-2.42, 1.68, -2.95);

  // Employee activity: making coffee / drink at the kitchen counter
  const wKitchen = buildOfficeWorkerNPC({
    shirtHex: 0xd97706,
    hairHex: 0x1c1917,
    female: true,
    seated: false,
    activity: 'pantry_coffee',
  });
  wKitchen.group.position.set(0.65, 0, -1.62);
  wKitchen.group.rotation.y = Math.PI;
  registerChatNpc(wKitchen, 'npc_r11_tina');
  workers.push(wKitchen);

  r11.add(
    kitCounter,
    kitTop,
    sinkBasin,
    faucet,
    microwave,
    mwGlass,
    kettle,
    kitMug,
    kitFridge,
    fridgeDoorLine,
    islandTable,
    snackJar,
    islandMug,
    stool1,
    stool2,
    frameR11,
    frameR11E1,
    frameR11E2,
    frameR11N,
    wKitchen.group
  );
  group.add(r11);

  // ==================== ROOM 12: TOILET (x=+18, z=+4.4) ====================
  const r12 = new THREE.Group();
  r12.position.set(18, 0, 4.4);

  const toiletMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
  const stallWallMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.5 });

  // Two clean restroom cubicles along the south wall
  for (const [idx, sx] of [-1.75, 0.05].entries()) {
    const divL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.0, 1.75), stallWallMat);
    divL.position.set(sx - 0.85, 1.0, 1.95);
    const divR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.0, 1.75), stallWallMat);
    divR.position.set(sx + 0.85, 1.0, 1.95);
    const stallDoor = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.88, 0.06), slateFrameMat);
    stallDoor.position.set(sx, 0.96, 1.1);
    const doorSign = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.14),
      new THREE.MeshBasicMaterial({ color: idx === 0 ? 0x38bdf8 : 0xf472b6 })
    );
    doorSign.position.set(sx, 1.48, 1.06);
    doorSign.rotation.y = Math.PI;
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.42, 14), toiletMat);
    bowl.position.set(sx, 0.21, 2.2);
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.45, 0.2), toiletMat);
    tank.position.set(sx, 0.62, 2.55);
    r12.add(divL, divR, stallDoor, doorSign, bowl, tank);
  }

  // Double sink vanity + wall mirror along east partition
  const vanity = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.82, 2.2), lightDeskMat);
  vanity.position.set(2.45, 0.41, 0.1);
  vanity.castShadow = true;
  const mirror = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.9, 1.95),
    new THREE.MeshStandardMaterial({ color: 0xe0f2fe, metalness: 0.78, roughness: 0.12 })
  );
  mirror.position.set(2.85, 1.42, 0.1);
  for (const sz of [-0.45, 0.65]) {
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.12, 16), toiletMat);
    basin.position.set(2.42, 0.86, sz);
    const tap = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.04), slateFrameMat);
    tap.position.set(2.68, 0.95, sz);
    r12.add(basin, tap);
  }
  const plantR12 = buildPlantPot(0.95);
  plantR12.position.set(-2.2, 0, -0.8);

  // Employee activity: washing hands calmly at sink
  const wToilet = buildOfficeWorkerNPC({
    shirtHex: 0x0f766e,
    hairHex: 0x18181b,
    female: false,
    seated: false,
    activity: 'wash_hands',
  });
  wToilet.group.position.set(1.72, 0, -0.45);
  wToilet.group.rotation.y = Math.PI / 2;
  registerChatNpc(wToilet, 'npc_r12_andi');
  workers.push(wToilet);

  r12.add(vanity, mirror, plantR12, wToilet.group);
  group.add(r12);

  // ==================== ROOM 13: MUSHOLA ESTETIK (x=+24, z=-4.4) ====================
  const r13 = new THREE.Group();
  r13.position.set(24, 0, -4.4);

  const mihrabWoodMat = new THREE.MeshStandardMaterial({ color: 0x5c2e14, roughness: 0.58 });
  const goldAccentMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3, metalness: 0.52 });
  const musholaRugMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.92 });

  // Plush centered emerald mosque carpet with gold trim border
  const musholaCarpet = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.014, 5.15), musholaRugMat);
  musholaCarpet.position.set(0, 0.009, -0.2);
  musholaCarpet.receiveShadow = true;
  const carpetGoldOuter = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.016, 4.95), goldAccentMat);
  carpetGoldOuter.position.set(0, 0.009, -0.2);
  const carpetInner = new THREE.Mesh(
    new THREE.BoxGeometry(4.74, 0.018, 4.79),
    new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.92 })
  );
  carpetInner.position.set(0, 0.01, -0.2);
  carpetInner.receiveShadow = true;
  r13.add(musholaCarpet, carpetGoldOuter, carpetInner);

  // Aesthetic Mihrab with golden arch & illuminated lanterns
  const mihrabBack = new THREE.Mesh(new THREE.BoxGeometry(2.45, 2.45, 0.14), mihrabWoodMat);
  mihrabBack.position.set(0, 1.22, -2.86);
  const mihrabPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(1.75, 2.18),
    new THREE.MeshBasicMaterial({ map: createIslamicMihrabTexture(maxAnisotropy) })
  );
  mihrabPanel.position.set(0, 1.2, -2.78);
  const mihrabArchRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.86, 0.042, 8, 24, Math.PI),
    goldAccentMat
  );
  mihrabArchRing.position.set(0, 1.48, -2.75);
  for (const lx of [-1.05, 1.05]) {
    const sconceMount = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.08), mihrabWoodMat);
    sconceMount.position.set(lx, 1.65, -2.76);
    const lanternGlow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.045, 0.18, 12),
      new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.95,
      })
    );
    lanternGlow.position.set(lx, 1.65, -2.68);
    r13.add(sconceMount, lanternGlow);
  }
  r13.add(mihrabBack, mihrabPanel, mihrabArchRing);

  // Aesthetic ornate prayer mats (Sajadah)
  for (const mx of [-0.95, 0.95]) {
    const sajadah = new THREE.Mesh(
      new THREE.BoxGeometry(0.86, 0.016, 1.48),
      new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.9 })
    );
    sajadah.position.set(mx, 0.022, -1.25);
    const sajadahBorder = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.018, 1.36), goldAccentMat);
    sajadahBorder.position.set(mx, 0.023, -1.25);
    const sajadahInner = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.02, 1.26),
      new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.9 })
    );
    sajadahInner.position.set(mx, 0.024, -1.25);
    r13.add(sajadah, sajadahBorder, sajadahInner);
  }

  // Aesthetic Wooden Rak Buku Al-Qur'an filled with Mushaf books
  const quranCabinet = new THREE.Group();
  quranCabinet.position.set(2.58, 0, -1.5);
  for (const sz of [-0.58, 0.58]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.48, 0.05), mihrabWoodMat);
    side.position.set(0, 0.74, sz);
    side.castShadow = true;
    quranCabinet.add(side);
  }
  const cabinetBack = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.48, 1.2), mihrabWoodMat);
  cabinetBack.position.set(0.18, 0.74, 0);
  quranCabinet.add(cabinetBack);

  const quranColors = [0x065f46, 0x7f1d1d, 0x1e3a5f, 0x047857, 0x92400e, 0x064e3b];
  for (const [tierIdx, sy] of [0.16, 0.56, 0.96, 1.42].entries()) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 1.18), mihrabWoodMat);
    plank.position.set(0, sy, 0);
    quranCabinet.add(plank);
    if (tierIdx < 3) {
      // Neatly lined & stacked Al-Qur'an books on every shelf tier
      for (let b = 0; b < 5; b++) {
        const qBook = buildQuranBook(quranColors[(tierIdx * 2 + b) % quranColors.length], false);
        qBook.rotation.z = Math.PI / 2;
        qBook.rotation.y = Math.PI / 2;
        qBook.position.set(-0.02, sy + 0.13, -0.38 + b * 0.07);
        quranCabinet.add(qBook);
      }
      const flatQ1 = buildQuranBook(quranColors[(tierIdx + 1) % quranColors.length], false);
      flatQ1.position.set(-0.02, sy + 0.04, 0.28);
      const flatQ2 = buildQuranBook(quranColors[(tierIdx + 3) % quranColors.length], false);
      flatQ2.position.set(-0.02, sy + 0.078, 0.28);
      flatQ2.rotation.y = 0.08;
      quranCabinet.add(flatQ1, flatQ2);
    }
  }
  r13.add(quranCabinet);

  // Wooden Rehal (Al-Qur'an stand) with an open Mushaf + stacked Qur'ans on left side
  const rehalTable = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.24, 0.42), mihrabWoodMat);
  rehalTable.position.set(-1.95, 0.13, -1.55);
  rehalTable.castShadow = true;
  const openQuran = buildQuranBook(0x065f46, true);
  openQuran.position.set(-1.95, 0.26, -1.55);
  const stackQ1 = buildQuranBook(0x1e3a5f, false);
  stackQ1.position.set(-1.95, 0.036, -0.98);
  const stackQ2 = buildQuranBook(0x7f1d1d, false);
  stackQ2.position.set(-1.95, 0.074, -0.98);
  stackQ2.rotation.y = 0.14;
  r13.add(rehalTable, openQuran, stackQ1, stackQ2);

  // Aesthetic Figura Kaligrafi & Geometri Islami di Mushola (North, West, & East Walls)
  const figMusholaL = buildOrnateFigura(
    createCalligraphyPlaqueTexture('tauhid', maxAnisotropy),
    0.72,
    0.92,
    0xd4af37,
    0xfefce8
  );
  figMusholaL.position.set(-1.82, 1.68, -2.86);
  const figMusholaR = buildOrnateFigura(
    createCalligraphyPlaqueTexture('doa', maxAnisotropy),
    0.72,
    0.92,
    0xd4af37,
    0xfefce8
  );
  figMusholaR.position.set(1.82, 1.68, -2.86);

  const figMusholaWest = buildOrnateFigura(
    createCalligraphyPlaqueTexture('geom', maxAnisotropy),
    0.82,
    1.0,
    0xd4af37,
    0x064e3b
  );
  figMusholaWest.position.set(-2.86, 1.65, -1.15);
  figMusholaWest.rotation.y = Math.PI / 2;

  const figMusholaEast1 = buildOrnateFigura(
    createCalligraphyPlaqueTexture('tauhid', maxAnisotropy),
    0.66,
    0.82,
    0xd4af37,
    0xfefce8
  );
  figMusholaEast1.position.set(2.85, 1.96, -1.5);
  figMusholaEast1.rotation.y = -Math.PI / 2;

  const figMusholaEast2 = buildOrnateFigura(
    createCalligraphyPlaqueTexture('geom', maxAnisotropy),
    0.66,
    0.82,
    0xd4af37,
    0xfefce8
  );
  figMusholaEast2.position.set(2.85, 1.72, 0.25);
  figMusholaEast2.rotation.y = -Math.PI / 2;

  const plantR13 = buildPlantPot(0.9);
  plantR13.position.set(-2.4, 0, -2.45);
  r13.add(figMusholaL, figMusholaR, figMusholaWest, figMusholaEast1, figMusholaEast2, plantR13);

  // Rak Sandal & Sandal Jepit tepat di depan Mushola (koridor depan pintu masuk)
  const sandalRack = new THREE.Group();
  sandalRack.position.set(-1.55, 0, 3.28);
  for (const rx of [-0.52, 0.52]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.52, 0.34), woodDeskMat);
    leg.position.set(rx, 0.26, 0);
    leg.castShadow = true;
    sandalRack.add(leg);
  }
  for (const ry of [0.12, 0.34, 0.52]) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.035, 0.34), woodDeskMat);
    shelf.position.y = ry;
    shelf.castShadow = true;
    sandalRack.add(shelf);
  }
  // Flip-flops arranged neatly on the rack tiers
  const rSandal1 = buildSandalJepit(0x0284c7, 0xf8fafc);
  rSandal1.position.set(-0.26, 0.36, 0);
  const rSandal2 = buildSandalJepit(0x10b981, 0xfef3c7);
  rSandal2.position.set(0.24, 0.36, 0);
  const rSandal3 = buildSandalJepit(0xf59e0b, 0x1e293b);
  rSandal3.position.set(-0.24, 0.14, 0);
  const rSandal4 = buildSandalJepit(0x64748b, 0x38bdf8);
  rSandal4.position.set(0.26, 0.14, 0);
  sandalRack.add(rSandal1, rSandal2, rSandal3, rSandal4);
  r13.add(sandalRack);

  // Welcome Mat + Pairs of Sandal Jepit right in front of the Mushola doorway
  const musholaMat = new THREE.Mesh(
    new THREE.BoxGeometry(1.55, 0.015, 0.62),
    new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.92 })
  );
  musholaMat.position.set(0, 0.008, 3.28);
  const doorSandal1 = buildSandalJepit(0x0ea5e9, 0xffffff);
  doorSandal1.position.set(-0.42, 0.016, 3.34);
  doorSandal1.rotation.y = Math.PI + 0.08;
  const doorSandal2 = buildSandalJepit(0xd97706, 0xfef3c7);
  doorSandal2.position.set(0.45, 0.016, 3.32);
  doorSandal2.rotation.y = Math.PI - 0.12;
  r13.add(musholaMat, doorSandal1, doorSandal2);

  // Employee activity: praying / reading calmly on the sajadah
  const wMushola = buildOfficeWorkerNPC({
    shirtHex: 0xf8fafc,
    hairHex: 0x171717,
    female: false,
    seated: true,
    activity: 'pray',
  });
  wMushola.group.position.set(0.95, -0.34, -0.95);
  wMushola.group.rotation.y = Math.PI;
  registerChatNpc(wMushola, 'npc_r13_hilman');
  workers.push(wMushola);
  r13.add(wMushola.group);
  group.add(r13);

  // ==================== ROOM 14: TEMPAT WUDHU KHUSUS (x=+24, z=+4.4) ====================
  const r14 = new THREE.Group();
  r14.position.set(24, 0, 4.4);

  const wudhuTileMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.25 });
  const wudhuWetZone = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 4.4),
    new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.22 })
  );
  wudhuWetZone.rotation.x = -Math.PI / 2;
  wudhuWetZone.position.set(1.7, 0.008, 0.5);
  r14.add(wudhuWetZone);

  const wudhuWall = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.72, 4.1), wudhuTileMat);
  wudhuWall.position.set(2.6, 0.36, 0.45);
  const wudhuTrough = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 4.1), slateFrameMat);
  wudhuTrough.position.set(2.12, 0.07, 0.45);
  for (const wz of [-0.9, 0.0, 0.9, 1.8]) {
    const tapPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.2, 10), slateFrameMat);
    tapPipe.rotation.z = Math.PI / 2;
    tapPipe.position.set(2.28, 0.58, wz);
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8), slateFrameMat);
    nozzle.position.set(2.18, 0.54, wz);
    const stool = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.38), woodDeskMat);
    stool.position.set(1.56, 0.14, wz);
    stool.castShadow = true;
    r14.add(tapPipe, nozzle, stool);
  }
  const towelStand = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.95, 1.1), lightDeskMat);
  towelStand.position.set(-2.5, 0.475, 0.6);
  const wudhuMirror = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.85, 1.35),
    new THREE.MeshStandardMaterial({ color: 0xe0f2fe, metalness: 0.75, roughness: 0.12 })
  );
  wudhuMirror.position.set(-2.85, 1.48, 0.6);
  const frameR14 = buildWallFrame('TEMPAT WUDHU', '#0ea5e9', 'botanical', maxAnisotropy);
  frameR14.position.set(-2.88, 1.65, -1.2);
  frameR14.rotation.y = Math.PI / 2;
  const plantR14 = buildPlantPot(0.9);
  plantR14.position.set(-2.2, 0, 2.25);

  r14.add(wudhuWall, wudhuTrough, towelStand, wudhuMirror, frameR14, plantR14);
  group.add(r14);

  // ==================== ROOM 15: RUANG BOS ESTETIK (x=+30, z=-4.4) ====================
  const r15 = new THREE.Group();
  r15.position.set(30, 0, -4.4);

  const mahoganyMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.38, metalness: 0.08 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.28, metalness: 0.72 });
  const leatherDarkMat = new THREE.MeshStandardMaterial({ color: 0x3b2314, roughness: 0.48 });
  const creamLeatherMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f4, roughness: 0.55 });

  // Plush Ivory & Gold Bordered Executive Area Rug
  const bossRugBorder = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.01, 3.6), brassMat);
  bossRugBorder.position.set(0.1, 0.008, -0.35);
  const bossRug = new THREE.Mesh(
    new THREE.BoxGeometry(3.64, 0.013, 3.44),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 })
  );
  bossRug.position.set(0.1, 0.01, -0.35);
  bossRug.receiveShadow = true;
  r15.add(bossRugBorder, bossRug);

  // Architectural Walnut Vertical Wood Slats Feature Wall (East Wall)
  const slatPanelBack = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.55, 4.8), leatherDarkMat);
  slatPanelBack.position.set(2.88, 1.28, -0.4);
  r15.add(slatPanelBack);
  for (let i = 0; i < 14; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.45, 0.12), mahoganyMat);
    slat.position.set(2.82, 1.26, -2.5 + i * 0.32);
    r15.add(slat);
  }
  const bossArt = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.96, 1.45),
    brassMat
  );
  bossArt.position.set(2.77, 1.65, -0.5);
  const bossArtCanvas = new THREE.Mesh(
    new THREE.PlaneGeometry(1.34, 0.86),
    new THREE.MeshBasicMaterial({ map: createBossArtTexture(maxAnisotropy) })
  );
  bossArtCanvas.position.set(2.74, 1.65, -0.5);
  bossArtCanvas.rotation.y = -Math.PI / 2;
  r15.add(bossArt, bossArtCanvas);

  // Executive Figura Collection inside Ruang Bos (North, East, & West Walls) + Side Privacy Blinds
  const figBossNLeft = buildOrnateFigura(
    createExecutiveFiguraTexture('iso', maxAnisotropy),
    0.78,
    0.62,
    0xd4af37,
    0x1c1917
  );
  figBossNLeft.position.set(-2.28, 1.68, -2.86);
  const figBossNRight = buildOrnateFigura(
    createExecutiveFiguraTexture('award', maxAnisotropy),
    0.78,
    0.62,
    0xd4af37,
    0x1c1917
  );
  figBossNRight.position.set(2.28, 1.68, -2.86);

  const figBossEastTop = buildOrnateFigura(
    createExecutiveFiguraTexture('vision', maxAnisotropy),
    0.72,
    0.58,
    0xd4af37,
    0x292524
  );
  figBossEastTop.position.set(2.76, 1.65, -1.92);
  figBossEastTop.rotation.y = -Math.PI / 2;
  const figBossEastBot = buildOrnateFigura(
    createExecutiveFiguraTexture('award', maxAnisotropy),
    0.72,
    0.58,
    0xd4af37,
    0x292524
  );
  figBossEastBot.position.set(2.76, 1.65, 0.92);
  figBossEastBot.rotation.y = -Math.PI / 2;

  const figBossWest1 = buildOrnateFigura(
    createExecutiveFiguraTexture('iso', maxAnisotropy),
    0.78,
    0.62,
    0xd4af37,
    0xfaf8f2
  );
  figBossWest1.position.set(-2.86, 2.38, -1.05);
  figBossWest1.rotation.y = Math.PI / 2;
  const figBossWest2 = buildOrnateFigura(
    createExecutiveFiguraTexture('vision', maxAnisotropy),
    0.92,
    0.7,
    0xd4af37,
    0x1c1917
  );
  figBossWest2.position.set(-2.86, 1.72, 1.48);
  figBossWest2.rotation.y = Math.PI / 2;

  // Sleek side privacy blinds framing the north window of Ruang Bos
  for (const bx of [-1.52, 1.52]) {
    const blindPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 1.62, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x452714, roughness: 0.62 })
    );
    blindPanel.position.set(bx, 1.65, -2.9);
    r15.add(blindPanel);
  }
  r15.add(figBossNLeft, figBossNRight, figBossEastTop, figBossEastBot, figBossWest1, figBossWest2);

  // Grand Mahogany & Brass Executive Desk
  const execDesk = new THREE.Group();
  execDesk.position.set(0.35, 0, -1.15);
  const execTop = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.07, 1.05), mahoganyMat);
  execTop.position.y = 0.78;
  execTop.castShadow = true;
  const execBrassTrim = new THREE.Mesh(new THREE.BoxGeometry(2.37, 0.025, 1.07), brassMat);
  execBrassTrim.position.y = 0.75;
  const execModesty = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.72, 0.12), leatherDarkMat);
  execModesty.position.set(0, 0.37, 0.42);
  execModesty.castShadow = true;
  for (const lx of [-1.02, 1.02]) {
    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.74, 0.88), mahoganyMat);
    pedestal.position.set(lx, 0.37, 0);
    pedestal.castShadow = true;
    execDesk.add(pedestal);
  }
  const deskBlotter = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.01, 0.52), leatherDarkMat);
  deskBlotter.position.set(0, 0.82, 0.08);
  const bossLaptop = buildDeskLaptop(0xfbbf24);
  bossLaptop.position.set(-0.08, 0.825, 0.02);
  const bossMon = buildDesktopMonitor(0xfbbf24);
  bossMon.position.set(0.55, 0.815, -0.22);
  bossMon.rotation.y = -0.35;
  const nameplate = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.08), brassMat);
  nameplate.position.set(-0.52, 0.86, 0.38);
  const nameplateFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.35, 0.08),
    new THREE.MeshBasicMaterial({ map: createBossNameplateTexture() })
  );
  nameplateFace.position.set(-0.52, 0.86, 0.422);
  // Warm brass banker lamp
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.04, 14), brassMat);
  lampBase.position.set(-0.85, 0.83, -0.25);
  const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.32, 10), brassMat);
  lampStem.position.set(-0.85, 0.99, -0.25);
  const lampShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.14, 0.12, 14),
    new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.7,
    })
  );
  lampShade.position.set(-0.85, 1.15, -0.25);
  const bossVase = buildFlowerVase(0xfbbf24);
  bossVase.position.set(0.92, 0.815, 0.25);
  const execDeskHit = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 1.3, 1.25),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  execDeskHit.position.set(0, 0.65, 0);
  execDesk.add(
    execTop,
    execBrassTrim,
    execModesty,
    deskBlotter,
    bossLaptop,
    bossMon,
    nameplate,
    nameplateFace,
    lampBase,
    lampStem,
    lampShade,
    bossVase,
    execDeskHit
  );
  tagInteractable(execDesk, 'boss_report');
  interactables.push(execDesk);
  r15.add(execDesk);

  // Executive High-Back Leather Chair & Visitor Chairs
  const bossChair = buildOfficeChair(0x3b2314);
  bossChair.position.set(0.35, 0, -1.92);
  bossChair.scale.set(1.12, 1.15, 1.12);
  const guestChair1 = buildOfficeChair(0x475569);
  guestChair1.position.set(-0.2, 0, -0.15);
  guestChair1.rotation.y = Math.PI;
  tagSeat(guestChair1, 'seat_boss_guest1');
  seatInteractables.push(guestChair1);
  const guestChair2 = buildOfficeChair(0x475569);
  guestChair2.position.set(0.85, 0, -0.15);
  guestChair2.rotation.y = Math.PI;
  tagSeat(guestChair2, 'seat_boss_guest2');
  seatInteractables.push(guestChair2);
  r15.add(bossChair, guestChair1, guestChair2);

  // Executive Open Bookcase / Trophy Library along West Wall
  const bossBookcase = new THREE.Group();
  bossBookcase.position.set(-2.58, 0, -1.05);
  const bcBack = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.02, 1.88), mahoganyMat);
  bcBack.position.set(-0.2, 1.01, 0);
  bossBookcase.add(bcBack);
  for (const sz of [-0.92, 0.92]) {
    const bcSide = new THREE.Mesh(new THREE.BoxGeometry(0.44, 2.02, 0.06), mahoganyMat);
    bcSide.position.set(0, 1.01, sz);
    bcSide.castShadow = true;
    bossBookcase.add(bcSide);
  }
  const bossBookCols = [0x1e3a5f, 0x065f46, 0x7f1d1d, 0x334155, 0x78350f];
  for (const [tierIdx, sy] of [0.12, 0.62, 1.14, 1.66, 2.0].entries()) {
    const shelfPlank = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.045, 1.84), mahoganyMat);
    shelfPlank.position.y = sy;
    shelfPlank.castShadow = true;
    const brassEdge = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 1.82), brassMat);
    brassEdge.position.set(0.22, sy, 0);
    bossBookcase.add(shelfPlank, brassEdge);

    if (tierIdx < 3) {
      for (let b = 0; b < 9; b++) {
        const bh = 0.26 + (b % 3) * 0.03;
        const bk = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, bh, 0.045),
          new THREE.MeshStandardMaterial({
            color: bossBookCols[(tierIdx + b) % bossBookCols.length],
            roughness: 0.48,
          })
        );
        bk.position.set(0.02, sy + 0.023 + bh / 2, -0.7 + b * 0.065);
        bk.castShadow = true;
        bossBookcase.add(bk);
      }
    }
  }
  // Golden Trophy on display shelf
  const trophyCup = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.05, 0.26, 12), brassMat);
  trophyCup.position.set(0.02, 1.82, -0.35);
  const trophyCup2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.04, 0.2, 12), brassMat);
  trophyCup2.position.set(0.02, 1.79, 0.45);
  bossBookcase.add(trophyCup, trophyCup2);
  r15.add(bossBookcase);

  // VIP Corner Leather Sofa + Glass Coffee Table
  const vipSofa = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.45, 0.72), creamLeatherMat);
  vipSofa.position.set(-1.55, 0.225, 1.95);
  vipSofa.castShadow = true;
  tagSeat(vipSofa, 'seat_boss_vip');
  seatInteractables.push(vipSofa);
  const vipSofaBack = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.45, 0.14), creamLeatherMat);
  vipSofaBack.position.set(-1.55, 0.58, 2.24);
  tagSeat(vipSofaBack, 'seat_boss_vip');
  const vipTable = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.03, 18), brassMat);
  vipTable.position.set(-1.55, 0.42, 1.15);
  const vipTableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.18, 0.4, 12), mahoganyMat);
  vipTableLeg.position.set(-1.55, 0.2, 1.15);
  const plantR15 = buildPlantPot(1.3);
  plantR15.position.set(2.25, 0, 1.9);
  r15.add(vipSofa, vipSofaBack, vipTable, vipTableLeg, plantR15);

  // Boss NPC seated calmly behind the executive desk + Boss Report Badge (shown when all 9 tech tasks done)
  const wBoss = buildOfficeWorkerNPC({
    shirtHex: 0xf8fafc,
    hairHex: 0x18181b,
    seated: true,
    presetIndex: 8,
  });
  wBoss.group.position.set(0.35, 0, -1.92);
  const bossHit = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 1.5, 0.75),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  bossHit.position.y = 0.9;
  wBoss.group.add(bossHit);
  tagInteractable(wBoss.group, 'boss_report');
  interactables.push(wBoss.group);

  const bossReportBadge = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createBossReportPopupTexture(),
      transparent: true,
      depthWrite: false,
    })
  );
  bossReportBadge.position.set(0, 1.72, 0);
  bossReportBadge.scale.set(0.92, 0.38, 1);
  bossReportBadge.visible = false;
  wBoss.group.add(bossReportBadge);

  workers.push(wBoss);
  r15.add(wBoss.group);
  group.add(r15);

  // ==================== ROOM 16: RUANG SANTAI KARYAWAN (x=+30, z=+4.4) ====================
  const r16 = new THREE.Group();
  r16.position.set(30, 0, 4.4);

  const loungeRugR16 = new THREE.Mesh(
    new THREE.PlaneGeometry(3.3, 2.8),
    new THREE.MeshStandardMaterial({ color: 0x99f6e4, roughness: 0.92 })
  );
  loungeRugR16.rotation.x = -Math.PI / 2;
  loungeRugR16.position.set(0.15, 0.008, 0.35);
  loungeRugR16.receiveShadow = true;
  r16.add(loungeRugR16);

  // Plush 3-Seater Lounge Sofa + Cushions
  const loungeSofaMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
  const cushionSkyMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.78 });
  const cushionAmberMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.78 });
  const loungeSofaSeat = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.4, 0.85), loungeSofaMat);
  loungeSofaSeat.position.set(0.85, 0.2, 1.95);
  loungeSofaSeat.castShadow = true;
  tagSeat(loungeSofaSeat, 'seat_lounge_sofa_l');
  seatInteractables.push(loungeSofaSeat);
  const loungeSofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.52, 0.18), loungeSofaMat);
  loungeSofaBack.position.set(0.85, 0.52, 2.28);
  tagSeat(loungeSofaBack, 'seat_lounge_sofa_r');
  seatInteractables.push(loungeSofaBack);
  const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.32, 0.14), cushionSkyMat);
  pillow1.position.set(-0.14, 0.54, 2.08);
  pillow1.rotation.z = 0.18;
  const pillow2 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.32, 0.14), cushionAmberMat);
  pillow2.position.set(1.84, 0.54, 2.08);
  pillow2.rotation.z = -0.18;
  r16.add(loungeSofaSeat, loungeSofaBack, pillow1, pillow2);

  // Low Wooden Coffee Table with Mugs (shifted slightly north so corridor in front of sofa is roomy)
  const loungeCoffeeTable = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.06, 0.72), woodDeskMat);
  loungeCoffeeTable.position.set(0.85, 0.4, 0.25);
  loungeCoffeeTable.castShadow = true;
  for (const [lx, lz] of [
    [-0.55, -0.26],
    [0.55, -0.26],
    [-0.55, 0.26],
    [0.55, 0.26],
  ]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.38, 8), darkHardwareMat);
    leg.position.set(0.85 + lx, 0.19, 0.25 + lz);
    r16.add(leg);
  }
  const loungeMug1 = buildCoffeeMug(0xf59e0b);
  loungeMug1.position.set(0.55, 0.43, 0.2);
  const loungeMug2 = buildCoffeeMug(0x38bdf8);
  loungeMug2.position.set(1.05, 0.43, 0.32);
  const loungeVase = buildFlowerVase(0x10b981);
  loungeVase.position.set(0.82, 0.43, 0.22);
  r16.add(loungeCoffeeTable, loungeMug1, loungeMug2, loungeVase);

  // Two Cozy Beanbag Chairs (low floor cushion profile so seated character sits clearly on top)
  const beanbag1 = new THREE.Mesh(
    new THREE.SphereGeometry(0.46, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.88 })
  );
  beanbag1.scale.set(1.15, 0.48, 1.15);
  beanbag1.position.set(-1.35, 0.18, 0.35);
  beanbag1.castShadow = true;
  tagSeat(beanbag1, 'seat_beanbag_1');
  seatInteractables.push(beanbag1);
  const beanbag2 = new THREE.Mesh(
    new THREE.SphereGeometry(0.46, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.88 })
  );
  beanbag2.scale.set(1.15, 0.48, 1.15);
  beanbag2.position.set(-1.55, 0.18, 1.65);
  beanbag2.castShadow = true;
  tagSeat(beanbag2, 'seat_beanbag_2');
  seatInteractables.push(beanbag2);
  r16.add(beanbag1, beanbag2);

  // Cozy Lounge Perpustakaan Mini (West & East Bookcases) + Gallery Figura Hiasan + Plant
  const loungeShelf = buildMiniLibrary('compact', maxAnisotropy);
  loungeShelf.position.set(-2.58, 0, -0.65);
  loungeShelf.rotation.y = Math.PI / 2;

  const eastMiniLibrary = buildMiniLibrary('full', maxAnisotropy);
  eastMiniLibrary.position.set(2.64, 0, 0.65);
  eastMiniLibrary.rotation.y = -Math.PI / 2;

  const plantR16 = buildPlantPot(1.1);
  plantR16.position.set(2.35, 0, -1.55);

  const frameR16 = buildWallFrame('RUANG SANTAI', '#10b981', 'botanical', maxAnisotropy);
  frameR16.position.set(-2.88, 1.65, 0.9);
  frameR16.rotation.y = Math.PI / 2;

  const frameR16E1 = buildWallFrame('GALERI BACA', '#0284c7', 'landscape', maxAnisotropy, 0.84, 0.64);
  frameR16E1.position.set(2.88, 1.68, -0.82);
  frameR16E1.rotation.y = -Math.PI / 2;

  const frameR16E2 = buildWallFrame('IDE & INSPIRASI', '#d97706', 'abstract_arch', maxAnisotropy, 0.84, 0.64);
  frameR16E2.position.set(2.88, 1.68, 2.12);
  frameR16E2.rotation.y = -Math.PI / 2;

  const frameR16E3 = buildWallFrame('READ · LEARN · RELAX', '#10b981', 'quotes', maxAnisotropy, 0.88, 0.6);
  frameR16E3.position.set(2.88, 2.28, 0.65);
  frameR16E3.rotation.y = -Math.PI / 2;

  r16.add(loungeShelf, eastMiniLibrary, plantR16, frameR16, frameR16E1, frameR16E2, frameR16E3);

  // 1 Employee relaxing calmly on the lounge sofa
  const wLounge = buildOfficeWorkerNPC({
    shirtHex: 0x10b981,
    hairHex: 0x292524,
    female: true,
    seated: true,
  });
  wLounge.group.position.set(0.85, 0, 1.72);
  wLounge.group.rotation.y = Math.PI;
  registerChatNpc(wLounge, 'npc_r16_rina');
  workers.push(wLounge);
  r16.add(wLounge.group);
  group.add(r16);

  // ==================== ADDITIONAL SEATED COLLEAGUE (Meeting Room R.05) ====================
  const w14 = buildOfficeWorkerNPC({
    shirtHex: 0x0284c7,
    hairHex: 0x1c1917,
    seated: true,
  });
  w14.group.position.set(12.0, 0, -5.55); // Seated in Meeting Room (R.05) middle north chair
  registerChatNpc(w14, 'npc_r05_farhan');
  workers.push(w14);
  group.add(w14.group);

  // ==================== CORRIDOR MESSY CABLES (x=-2.6, z=0) ====================
  const messyCablesGroup = new THREE.Group();
  messyCablesGroup.position.set(-2.6, 0.01, 0);
  const tidiedCablesGroup = new THREE.Group();
  tidiedCablesGroup.position.set(-2.6, 0.01, 0);
  tidiedCablesGroup.visible = false;

  const cableColors = [0xf59e0b, 0x0284c7, 0x64748b];
  const cablePaths = [
    [
      new THREE.Vector3(-0.9, 0.02, -0.5),
      new THREE.Vector3(-0.2, 0.05, 0.25),
      new THREE.Vector3(0.6, 0.02, -0.35),
      new THREE.Vector3(1.0, 0.02, 0.3),
    ],
    [
      new THREE.Vector3(-0.8, 0.02, 0.45),
      new THREE.Vector3(0, 0.05, -0.25),
      new THREE.Vector3(0.7, 0.02, 0.4),
    ],
  ];
  cablePaths.forEach((pts, idx) => {
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 22, 0.022, 8, false),
      new THREE.MeshStandardMaterial({ color: cableColors[idx], roughness: 0.48 })
    );
    tube.castShadow = true;
    messyCablesGroup.add(tube);
  });
  const cableHit = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.3, 1.3),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  cableHit.position.y = 0.12;
  messyCablesGroup.add(cableHit);
  tagInteractable(messyCablesGroup, 'messy_cables');
  interactables.push(messyCablesGroup);

  const tray = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.035, 0.2), darkHardwareMat);
  tray.position.set(0, 0.02, 0.85);
  tidiedCablesGroup.add(tray);

  const wCorr = buildOfficeWorkerNPC({
    shirtHex: 0x475569,
    hairHex: 0x18181b,
    seated: false,
    holdingTablet: false,
  });
  wCorr.group.position.set(-1.35, 0, 0.78);
  wCorr.group.rotation.y = -2.13;
  registerAskingNpc(wCorr, 'npc_corr_hendra');
  workers.push(wCorr);

  group.add(messyCablesGroup, tidiedCablesGroup, wCorr.group);

  // ==================== GROUNDED FLOOR TARGET RINGS (Clean, Zero Above-Head Clutter) ====================
  const beaconCoords: Record<WorkstationTargetId, [number, number, number, number]> = {
    server_rack: [-11.4, 0.022, -4.4, 0xf59e0b],
    cli_monitor: [-6.35, 0.022, -3.55, 0x38bdf8],
    utp_spool: [-0.9, 0.022, -4.75, 0x38bdf8],
    crimper_tool: [5.8, 0.022, -4.1, 0x10b981],
    client_pc_1: [-6.75, 0.022, 3.1, 0xf59e0b],
    client_pc_2: [0.65, 0.022, 3.1, 0xf59e0b],
    ap_mount: [6.0, 0.022, 4.0, 0xf59e0b],
    messy_cables: [-2.6, 0.022, 0.0, 0xf59e0b],
    employee_pc_reception: [-12.0, 0.022, 2.8, 0xf43f5e],
    employee_pc_os: [-4.9, 0.022, 6.2, 0x3b82f6],
    employee_pc_meeting: [11.1, 0.022, -3.2, 0xf59e0b],
    boss_report: [30.35, 0.022, -3.55, 0xd4af37],
  };
  const beacons = {} as Record<WorkstationTargetId, THREE.Group>;
  (Object.keys(beaconCoords) as WorkstationTargetId[]).forEach((key) => {
    const [bx, by, bz, col] = beaconCoords[key];
    const b = buildObjectiveBeacon(col);
    b.position.set(bx, by, bz);
    if (key === 'crimper_tool' || key === 'boss_report') b.visible = false;
    beacons[key] = b;
    group.add(b);
  });

  // ==================== OVERHEAD CABLE TRAY DATA PULSES (Strictly along physical tray) ====================
  const packetChannels: Array<{
    channel: DataPacketVisual['channel'];
    pts: THREE.Vector3[];
    color: number;
  }> = [
    {
      channel: 'core',
      pts: [
        new THREE.Vector3(-12, 2.72, 0),
        new THREE.Vector3(-6, 2.72, 0),
      ],
      color: 0x38bdf8,
    },
    {
      channel: 'wired1',
      pts: [
        new THREE.Vector3(-6, 2.72, 0),
        new THREE.Vector3(-2, 2.72, 0),
      ],
      color: 0x10b981,
    },
    {
      channel: 'wired2',
      pts: [
        new THREE.Vector3(-6, 2.72, 0),
        new THREE.Vector3(0, 2.72, 0),
      ],
      color: 0x10b981,
    },
    {
      channel: 'wifi',
      pts: [
        new THREE.Vector3(0, 2.72, 0),
        new THREE.Vector3(6, 2.72, 0),
      ],
      color: 0x34d399,
    },
  ];
  const dataPackets: DataPacketVisual[] = [];
  packetChannels.forEach((ch) => {
    const curve = new THREE.CatmullRomCurve3(ch.pts);
    for (let i = 0; i < 2; i++) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.036, 8, 8),
        new THREE.MeshBasicMaterial({ color: ch.color })
      );
      mesh.visible = false;
      group.add(mesh);
      dataPackets.push({
        mesh,
        curve,
        offset: i / 2,
        speed: 0.36,
        channel: ch.channel,
      });
    }
  });

  const stationScreenHandles = {
    client_pc_1: pc1ScreenHandle,
    client_pc_2: pc2ScreenHandle,
    employee_pc_reception: recPcScreen,
    employee_pc_os: osPcScreen,
    employee_pc_meeting: meetLapScreen,
  };

  return {
    group,
    serverStatusMat,
    apRingMat,
    pc1ScreenMat,
    pc2ScreenMat,
    pc1LedMat,
    pc2LedMat,
    pc1Cable,
    pc2Cable,
    messyCablesGroup,
    tidiedCablesGroup,
    workers,
    npcWorkers,
    bossWorker: wBoss,
    npcInteractables,
    beacons,
    bossReportBadge,
    wifiWaveRings,
    dataPackets,
    updateNocMonitor: (state: MonitorScreenState) => {
      drawLiveMonitorScreen(nocCanvas, state);
      nocTex.needsUpdate = true;
    },
    updateStationScreen: (id, theme, title, subtitle, detail) => {
      stationScreenHandles[id].update(theme, title, subtitle, detail);
    },
    interactables,
    seatInteractables,
    doorInteractables,
    roomDoors,
  };
}
