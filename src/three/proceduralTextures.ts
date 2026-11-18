import * as THREE from 'three';

export function createOfficeFloorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm bright cream/sand studio tile base (matches isometric reference)
  ctx.fillStyle = '#e7dfd3';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle alternating warm tile checker
  ctx.fillStyle = '#dfd5c6';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillRect(256, 256, 256, 256);

  // Clean tile grout lines
  ctx.strokeStyle = '#c8bca9';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 252, 252);
  ctx.strokeRect(258, 2, 252, 252);
  ctx.strokeRect(2, 258, 252, 252);
  ctx.strokeRect(258, 258, 252, 252);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createServerFloorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#8494a8';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillRect(128, 128, 128, 128);

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, 125, 125);
  ctx.strokeRect(129.5, 1.5, 125, 125);
  ctx.strokeRect(1.5, 129.5, 125, 125);
  ctx.strokeRect(129.5, 129.5, 125, 125);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createStorageFloorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d4b48c';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#c8a57b';
  for (let y = 0; y < 256; y += 64) {
    ctx.fillRect(0, y, 256, 30);
  }
  ctx.strokeStyle = '#ad8b62';
  ctx.lineWidth = 2;
  for (let y = 0; y <= 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createWallSignTexture(
  title: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 128);
  ctx.fillStyle = '#f8fafc';
  drawRoundedRect(ctx, 10, 10, 492, 108, 16);
  ctx.fill();

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 8;
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = '700 44px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 256, 65);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function createZoneLabelTexture(
  title: string,
  subtitle: string,
  accentColor: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 160);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  drawRoundedRect(ctx, 8, 8, 496, 144, 18);
  ctx.fill();

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = accentColor;
  ctx.font = '700 42px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 256, 74);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(subtitle, 256, 118);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createServerBladeTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 256, 512);

  for (let row = 0; row < 10; row++) {
    const y = 16 + row * 48;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(14, y, 228, 38);

    // Ventilation slots
    ctx.fillStyle = '#020617';
    for (let v = 0; v < 8; v++) {
      ctx.fillRect(24 + v * 14, y + 10, 8, 18);
    }

    // Glowing LEDs
    ctx.fillStyle = row % 3 === 0 ? '#06b6d4' : '#10b981';
    ctx.fillRect(162, y + 14, 10, 10);
    ctx.fillStyle = row % 2 === 0 ? '#22d3ee' : '#f59e0b';
    ctx.fillRect(182, y + 14, 10, 10);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(202, y + 14, 24, 10);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createHoloScreenTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#041421';
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, 496, 240);

  ctx.fillStyle = '#22d3ee';
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.fillText('SW-CORE-01# show vlan brief', 24, 48);

  ctx.fillStyle = '#34d399';
  ctx.font = '500 18px "JetBrains Mono", monospace';
  ctx.fillText('VLAN 10  PANITIA   active', 24, 92);
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('VLAN 20  TAMU      active', 24, 126);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('DHCP POOL: 192.168.10.0/24', 24, 166);
  ctx.fillText('PRESS [E] TO OPEN CLI', 24, 212);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.42)');
  grad.addColorStop(0.6, 'rgba(15, 23, 42, 0.16)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createStatusSpriteTexture(
  symbol: string,
  label: string,
  bgHex: string,
  borderHex: string,
  textHex = '#ffffff'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 96);
  ctx.fillStyle = bgHex;
  drawRoundedRect(ctx, 12, 10, 232, 72, 16);
  ctx.fill();

  ctx.strokeStyle = borderHex;
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = textHex;
  ctx.font = '700 28px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${symbol} ${label}`, 128, 47);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createDeskWoodTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Matte dark smoked slate-walnut finish
  ctx.fillStyle = '#1e242d';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 140; i++) {
    const y = (i / 140) * 512;
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(15, 19, 25, 0.36)' : 'rgba(51, 65, 85, 0.16)';
    ctx.lineWidth = 1.5 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(170, y + ((i % 5) - 2) * 3, 340, y - ((i % 4) - 1.5) * 3, 512, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createDeskMatTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Charcoal technical felt surface
  ctx.fillStyle = '#11161f';
  ctx.fillRect(0, 0, 512, 256);

  // Subtle weave pattern
  ctx.fillStyle = 'rgba(148, 163, 184, 0.03)';
  for (let y = 0; y < 256; y += 4) {
    ctx.fillRect(0, y, 512, 1);
  }
  for (let x = 0; x < 512; x += 4) {
    ctx.fillRect(x, 0, 1, 256);
  }

  // Minimalist perimeter stitch line
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 492, 236);

  // Subtle corner technical spec label
  ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.font = '500 11px "JetBrains Mono", monospace';
  ctx.fillText('NETOPS WORKSTATION // ESD MAT', 22, 234);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createAcousticWallTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep slate felt backing
  ctx.fillStyle = '#0f141c';
  ctx.fillRect(0, 0, 512, 512);

  // Clean vertical architectural slats
  const slatWidth = 24;
  const gap = 8;
  for (let x = 0; x < 512; x += slatWidth + gap) {
    ctx.fillStyle = '#1a212c';
    ctx.fillRect(x, 0, slatWidth, 512);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fillRect(x, 0, 2, 512);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(x + slatWidth - 2, 0, 2, 512);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export interface MonitorScreenState {
  port1Connected: boolean;
  port2Connected: boolean;
  cablesTidied: boolean;
  rackChecked?: boolean;
  dhcpActive: boolean;
  vlan10Active: boolean;
  hasCableInHand: boolean;
  phase: 'ready' | 'playing' | 'ended';
  victory: boolean;
  dnsPrimary?: string;
  wifiSsid?: string;
  apConfigured?: boolean;
}

export function drawLiveMonitorScreen(
  canvas: HTMLCanvasElement,
  state: MonitorScreenState
): void {
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#0b1017';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#111824';
  ctx.fillRect(0, 0, w, 46);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 46, w, 1);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 18px "JetBrains Mono", monospace';
  ctx.fillText('ssh admin@sw-core-01  —  NetOps Multi-Room Console', 24, 30);

  const statusText = state.victory
    ? 'ALL ROOMS ONLINE'
    : state.phase === 'ended'
      ? 'SESSION TIMEOUT'
      : 'DIAGNOSTIC MODE';
  ctx.fillStyle = state.victory ? '#34d399' : state.dhcpActive ? '#38bdf8' : '#fbbf24';
  ctx.textAlign = 'right';
  ctx.fillText(statusText, w - 24, 30);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#0f1621';
  ctx.fillRect(24, 68, 590, 480);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 68, 590, 480);

  const dnsLabel = state.dnsPrimary || '1.1.1.1';
  const ssidLabel = state.wifiSsid || 'NetOps-Office-5G';

  const lines: Array<{ text: string; color: string }> = [
    { text: 'SW-CORE-01# show client-room interfaces', color: '#38bdf8' },
    {
      text: `  PC-01 (R.07 Klien) ${state.port1Connected ? 'link-up       Cat6 OK' : 'no-cable      offline'}`,
      color: state.port1Connected ? '#34d399' : '#94a3b8',
    },
    {
      text: `  PC-02 (R.08 Klien) ${state.port2Connected ? 'link-up       Cat6 OK' : 'no-cable      offline'}`,
      color: state.port2Connected ? '#34d399' : '#94a3b8',
    },
    { text: '', color: '#94a3b8' },
    { text: 'SW-CORE-01# show internet & wlan', color: '#38bdf8' },
    {
      text: `  DNS: ${dnsLabel.padEnd(15, ' ')}  Wi-Fi: ${state.apConfigured ? ssidLabel : 'AP Offline'}`,
      color: state.apConfigured ? '#34d399' : '#fbbf24',
    },
    {
      text: state.rackChecked
        ? '  [OK] Core Rack uplink verified (R.01)'
        : '  [WARN] Cek Rak Server di R.01',
      color: state.rackChecked ? '#34d399' : '#fbbf24',
    },
    {
      text: state.cablesTidied
        ? '  [OK] Floor cable tray secured (Koridor)'
        : '  [WARN] Kabel lantai berantakan di koridor',
      color: state.cablesTidied ? '#34d399' : '#fbbf24',
    },
    { text: '', color: '#94a3b8' },
    { text: 'SW-CORE-01# show ip dhcp pool', color: '#38bdf8' },
    {
      text: state.dhcpActive
        ? '  [OK] Pool KLIEN 192.168.10.0/24 ACTIVE'
        : '  [ERR] DHCP Pool offline — Setting Internet / CLI',
      color: state.dhcpActive ? '#34d399' : '#f87171',
    },
    { text: '', color: '#94a3b8' },
    {
      text: state.victory
        ? 'SW-CORE-01# Seluruh 10 ruangan terselesaikan.'
        : 'SW-CORE-01(config)# _  [Klik meja / Setting Internet]',
      color: state.victory ? '#34d399' : '#e2e8f0',
    },
  ];

  ctx.font = '500 16px "JetBrains Mono", monospace';
  lines.forEach((line, idx) => {
    ctx.fillStyle = line.color;
    ctx.fillText(line.text, 44, 108 + idx * 35);
  });

  ctx.fillStyle = '#0f1621';
  ctx.fillRect(636, 68, 364, 480);
  ctx.strokeStyle = '#1e293b';
  ctx.strokeRect(636, 68, 364, 480);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('STUDI KASUS 10 RUANGAN', 660, 108);

  const items = [
    {
      label: 'PC-01 & PC-02 (R.07/08)',
      done: state.port1Connected && state.port2Connected,
      detail: `${(state.port1Connected ? 1 : 0) + (state.port2Connected ? 1 : 0)}/2 terpasang`,
    },
    {
      label: 'Kabel Koridor (Koridor)',
      done: state.cablesTidied,
      detail: state.cablesTidied ? 'Rapi di tray' : 'Belum dirapikan',
    },
    {
      label: 'Cek Rak Server (R.01)',
      done: Boolean(state.rackChecked),
      detail: state.rackChecked ? 'Uplink OK' : 'Klik Rak Server',
    },
    {
      label: 'DHCP Server (R.02)',
      done: state.dhcpActive,
      detail: state.dhcpActive ? '192.168.10.0/24' : 'Ketik "dhcp"',
    },
  ];

  items.forEach((item, idx) => {
    const y = 145 + idx * 92;
    ctx.fillStyle = item.done ? 'rgba(16, 185, 129, 0.12)' : 'rgba(30, 41, 59, 0.45)';
    ctx.fillRect(660, y, 316, 74);
    ctx.strokeStyle = item.done ? '#10b981' : '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(660, y, 316, 74);

    ctx.fillStyle = item.done ? '#34d399' : '#e2e8f0';
    ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${item.done ? '✓' : '○'}  ${item.label}`, 678, y + 30);

    ctx.fillStyle = item.done ? '#6ee7b7' : '#94a3b8';
    ctx.font = '500 14px "JetBrains Mono", monospace';
    ctx.fillText(item.detail, 678, y + 55);
  });
}

export type EmployeeScreenTheme =
  | 'no_internet'
  | 'bsod'
  | 'installing_os'
  | 'wifi_disabled'
  | 'no_cable'
  | 'online';

export function drawEmployeeScreen(
  canvas: HTMLCanvasElement,
  opts: {
    theme: EmployeeScreenTheme;
    title: string;
    subtitle: string;
    detail: string;
  }
): void {
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  const palettes: Record<
    EmployeeScreenTheme,
    { bg: string; header: string; accent: string; badge: string; text: string }
  > = {
    no_internet: {
      bg: '#1c1215',
      header: '#3b151c',
      accent: '#fb7185',
      badge: 'NO INTERNET',
      text: '#fecdd3',
    },
    bsod: {
      bg: '#0c3b82',
      header: '#124ca3',
      accent: '#93c5fd',
      badge: 'WINDOWS RECOVERY',
      text: '#eff6ff',
    },
    installing_os: {
      bg: '#0d223d',
      header: '#123159',
      accent: '#38bdf8',
      badge: 'WINDOWS SETUP',
      text: '#e0f2fe',
    },
    wifi_disabled: {
      bg: '#231a0d',
      header: '#3d2c12',
      accent: '#fbbf24',
      badge: 'ADAPTER OFF',
      text: '#fef3c7',
    },
    no_cable: {
      bg: '#1e1318',
      header: '#381822',
      accent: '#f87171',
      badge: 'CABLE UNPLUGGED',
      text: '#fee2e2',
    },
    online: {
      bg: '#08261e',
      header: '#0d3b2e',
      accent: '#34d399',
      badge: 'ONLINE · OK',
      text: '#d1fae5',
    },
  };

  const p = palettes[opts.theme];

  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = p.header;
  ctx.fillRect(0, 0, w, 58);

  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, w - 12, h - 12);

  ctx.fillStyle = p.accent;
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(p.badge, 24, 38);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(opts.title, 24, 115);

  ctx.fillStyle = p.text;
  ctx.font = '600 20px "JetBrains Mono", monospace';
  ctx.fillText(opts.subtitle, 24, 162);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(opts.detail, 24, 212);

  // Subtle status progress/signal bar at bottom
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(24, h - 42, w - 48, 12);
  ctx.fillStyle = p.accent;
  ctx.fillRect(
    24,
    h - 42,
    opts.theme === 'online' ? w - 48 : opts.theme === 'installing_os' ? (w - 48) * 0.68 : 96,
    12
  );
}



