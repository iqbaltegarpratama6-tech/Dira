export type GenderOption = 'male' | 'female';

export type PlayerSlot = 0 | 1 | 2 | 3;

export interface PlayerColorTheme {
  id: PlayerSlot;
  label: string;
  name: string;
  hex: string;
  threeHex: number;
  accentHex: number;
}

export const PLAYER_THEMES: PlayerColorTheme[] = [
  { id: 0, label: 'P1', name: 'Cyber Cyan', hex: '#06B6D4', threeHex: 0x06b6d4, accentHex: 0x22d3ee },
  { id: 1, label: 'P2', name: 'Voltage Amber', hex: '#F59E0B', threeHex: 0xf59e0b, accentHex: 0xfbbf24 },
  { id: 2, label: 'P3', name: 'Fiber Emerald', hex: '#10B981', threeHex: 0x10b981, accentHex: 0x34d399 },
  { id: 3, label: 'P4', name: 'Packet Coral', hex: '#F43F5E', threeHex: 0xf43f5e, accentHex: 0xfb7185 },
];

export type HeldItemType =
  | 'none'
  | 'utp_spool'
  | 'crimped_cable'
  | 'ladder'
  | 'access_point';

export interface PlayerConfig {
  slot: PlayerSlot;
  gender: GenderOption;
}

export interface PlayerRuntimeState {
  id: number;
  name: string;
  config: PlayerConfig;
  x: number;
  z: number;
  vx: number;
  vz: number;
  facing: number;
  heldItem: HeldItemType;
  stunTimer: number;
  onLadder: boolean;
  pullingCableFrom: { x: number; z: number } | null;
}

export interface LaptopNode {
  id: number;
  label: string;
  vlanGroup: 10 | 20;
  connectionType: 'wired' | 'wifi';
  connected: boolean;
  cabled: boolean;
  ipConflict: boolean;
  x: number;
  z: number;
}

export interface FloorCable {
  id: string;
  points: Array<{ x: number; z: number }>;
  neat: boolean;
  connectedToLaptopId?: number;
  color: number;
}

export interface ChaosIncident {
  blackout: boolean;
  overheat: boolean;
  overheatProgress: number; // 0 to 100
  bossAlertText: string | null;
}

export interface GameStats {
  timeRemaining: number; // seconds, starts at 165 (02:45)
  totalTime: number;
  stability: number; // 0-100
  laptopsConnected: number;
  totalLaptops: number;
  vlan10Active: boolean;
  vlan20Active: boolean;
  dhcpActive: boolean;
  apInstalled: boolean;
  ladderPlaced: boolean;
  wiredCablesCrimped: number;
  wiredCablesTarget: number;
  messyCablesCount: number;
  neatCablesCount: number;
  stumbleCount: number;
  incidentsResolved: number;
  phase: 'lobby' | 'playing' | 'ended';
  victory: boolean;
}

export interface T568BWire {
  pin: number;
  id: string;
  label: string;
  primaryColor: string;
  stripeColor?: string;
}

export const T568B_STANDARD: T568BWire[] = [
  { pin: 1, id: 'wo', label: 'Putih-Oranye', primaryColor: '#F97316', stripeColor: '#F8FAFC' },
  { pin: 2, id: 'o', label: 'Oranye', primaryColor: '#F97316' },
  { pin: 3, id: 'wg', label: 'Putih-Hijau', primaryColor: '#22C55E', stripeColor: '#F8FAFC' },
  { pin: 4, id: 'b', label: 'Biru', primaryColor: '#2563EB' },
  { pin: 5, id: 'wb', label: 'Putih-Biru', primaryColor: '#2563EB', stripeColor: '#F8FAFC' },
  { pin: 6, id: 'g', label: 'Hijau', primaryColor: '#22C55E' },
  { pin: 7, id: 'wbr', label: 'Putih-Cokelat', primaryColor: '#92400E', stripeColor: '#F8FAFC' },
  { pin: 8, id: 'br', label: 'Cokelat', primaryColor: '#92400E' },
];

export type RoomId =
  | 'r01_server'
  | 'r02_noc'
  | 'r03_storage'
  | 'r04_lab'
  | 'r05_meeting'
  | 'r06_reception'
  | 'r07_client_a'
  | 'r08_client_b'
  | 'r09_wifi'
  | 'r10_pantry'
  | 'r11_kitchen'
  | 'r12_toilet'
  | 'r13_mushola'
  | 'r14_wudhu'
  | 'r15_boss'
  | 'r16_lounge'
  | 'corridor';

export interface RoomMeta {
  id: RoomId;
  code: string;
  label: string;
  x: number;
  z: number;
}

export const OFFICE_ROOMS: RoomMeta[] = [
  { id: 'r01_server', code: '01', label: 'Server Room', x: -12, z: -3.2 },
  { id: 'r02_noc', code: '02', label: 'Ruang NOC', x: -6, z: -3.2 },
  { id: 'r03_storage', code: '03', label: 'Gudang Kabel', x: 0, z: -3.2 },
  { id: 'r04_lab', code: '04', label: 'Lab Fiber & Crimping', x: 6, z: -3.2 },
  { id: 'r05_meeting', code: '05', label: 'Ruang Rapat', x: 12, z: -3.2 },
  { id: 'r06_reception', code: '06', label: 'Resepsionis', x: -12, z: 3.2 },
  { id: 'r07_client_a', code: '07', label: 'Kerja Klien A', x: -6, z: 3.2 },
  { id: 'r08_client_b', code: '08', label: 'Kerja Klien B', x: 0, z: 3.2 },
  { id: 'r09_wifi', code: '09', label: 'Ruang Wi-Fi & AP', x: 6, z: 3.2 },
  { id: 'r10_pantry', code: '10', label: 'Pantry & Lounge', x: 12, z: 3.2 },
  { id: 'r11_kitchen', code: '11', label: 'Dapur Karyawan', x: 18, z: -3.2 },
  { id: 'r12_toilet', code: '12', label: 'Toilet', x: 18, z: 3.2 },
  { id: 'r13_mushola', code: '13', label: 'Mushola', x: 24, z: -3.2 },
  { id: 'r14_wudhu', code: '14', label: 'Tempat Wudhu', x: 24, z: 3.2 },
  { id: 'r15_boss', code: '15', label: 'Ruang Bos', x: 30, z: -3.2 },
  { id: 'r16_lounge', code: '16', label: 'Ruang Santai', x: 30, z: 3.2 },
];

export const ROOM_LABELS: Record<RoomId, string> = {
  r01_server: '01 · Server Room',
  r02_noc: '02 · Ruang NOC',
  r03_storage: '03 · Gudang Kabel',
  r04_lab: '04 · Lab Fiber & Crimping',
  r05_meeting: '05 · Ruang Rapat',
  r06_reception: '06 · Resepsionis',
  r07_client_a: '07 · Kerja Klien A',
  r08_client_b: '08 · Kerja Klien B',
  r09_wifi: '09 · Ruang Wi-Fi & AP',
  r10_pantry: '10 · Pantry & Lounge',
  r11_kitchen: '11 · Dapur Karyawan',
  r12_toilet: '12 · Toilet',
  r13_mushola: '13 · Mushola',
  r14_wudhu: '14 · Tempat Wudhu',
  r15_boss: '15 · Ruang Bos',
  r16_lounge: '16 · Ruang Santai',
  corridor: 'Koridor Utama',
};

export type WorkstationTargetId =
  | 'utp_spool'
  | 'client_pc_1'
  | 'client_pc_2'
  | 'messy_cables'
  | 'ap_mount'
  | 'server_rack'
  | 'cli_monitor'
  | 'crimper_tool'
  | 'employee_pc_reception'
  | 'employee_pc_os'
  | 'employee_pc_meeting'
  | 'boss_report';

export type RoomDoorId = 'r01_server' | 'r02_noc' | 'r03_storage' | 'r05_meeting' | 'r15_boss';

export interface NearbyDoorInfo {
  id: RoomDoorId;
  label: string;
  open: boolean;
}

export type OfficeNpcId =
  | 'npc_r01_arif'
  | 'npc_r02_raka'
  | 'npc_r03_maya'
  | 'npc_r04_nadia'
  | 'npc_r05_budi'
  | 'npc_r05_citra'
  | 'npc_r05_farhan'
  | 'npc_corr_hendra'
  | 'npc_r06_sari'
  | 'npc_r07_laras'
  | 'npc_r07_fajar'
  | 'npc_r08_dimas'
  | 'npc_r08_putri'
  | 'npc_r09_bagus'
  | 'npc_r10_reza'
  | 'npc_r11_tina'
  | 'npc_r12_andi'
  | 'npc_r13_hilman'
  | 'npc_r16_rina';

export interface WorkstationTargetInfo {
  id: WorkstationTargetId;
  room: RoomId;
  title: string;
  actionHint: string;
  ready: boolean;
}

export interface NearbyNpcInfo {
  npcId: OfficeNpcId;
  name: string;
  role: string;
  room: RoomId;
  teaser: string;
  answered: boolean;
  taskDone: boolean;
  targetId: WorkstationTargetId | null;
}

export interface NearbySeatInfo {
  id: string;
  label: string;
  room: RoomId;
}

export interface InternetSettings {
  wanConnected: boolean;
  gatewayIp: string;
  subnetMask: string;
  dhcpEnabled: boolean;
  dhcpPoolRange: string;
  dnsPrimary: string;
  dnsSecondary: string;
  vlan10Enabled: boolean;
  vlan20Enabled: boolean;
  firewallEnabled: boolean;
  wifiEnabled: boolean;
  wifiSsid: string;
  wifiPassword: string;
  wifiSecurity: 'WPA3-Personal' | 'WPA2-AES' | 'Open';
  wifiBand: 'Dual-Band Auto' | '5 GHz (Ch.36)' | '2.4 GHz (Ch.6)';
  bandwidthLimitMbps: number;
}

export const DEFAULT_INTERNET_SETTINGS: InternetSettings = {
  wanConnected: true,
  gatewayIp: '192.168.10.1',
  subnetMask: '255.255.255.0',
  dhcpEnabled: false,
  dhcpPoolRange: '192.168.10.100 - 192.168.10.200',
  dnsPrimary: '1.1.1.1',
  dnsSecondary: '8.8.8.8',
  vlan10Enabled: false,
  vlan20Enabled: false,
  firewallEnabled: true,
  wifiEnabled: false,
  wifiSsid: 'NetOps-Office-5G',
  wifiPassword: 'NocOffice2026!',
  wifiSecurity: 'WPA3-Personal',
  wifiBand: 'Dual-Band Auto',
  bandwidthLimitMbps: 0,
};

export interface WorkstationStats {
  phase: 'ready' | 'playing' | 'ended';
  currentRoom: RoomId;
  timeRemaining: number;
  totalTime: number;
  hasCableInHand: boolean;
  port1Connected: boolean;
  port2Connected: boolean;
  cablesTidied: boolean;
  apConfigured: boolean;
  rackChecked: boolean;
  dhcpActive: boolean;
  vlan10Active: boolean;
  vlan20Active: boolean;
  crimpingVerified: boolean;
  receptionPcFixed: boolean;
  osReinstalled: boolean;
  meetingLaptopFixed: boolean;
  bossReported: boolean;
  learningCorrectCount: number;
  learningAttemptsCount: number;
  consultedNpcs: OfficeNpcId[];
  internetSettings: InternetSettings;
  victory: boolean;
}

export type CameraAngleId = 'follow_back' | 'follow_side' | 'overview' | 'first_person';

export const CAMERA_ANGLES: Array<{
  id: CameraAngleId;
  label: string;
  shortLabel: string;
  shortcut: string;
}> = [
  { id: 'follow_back', label: '3rd Person · Belakang', shortLabel: 'Belakang', shortcut: '1' },
  { id: 'follow_side', label: '3rd Person · Samping', shortLabel: 'Samping', shortcut: '2' },
  { id: 'overview', label: 'Sudut 16 Ruangan', shortLabel: '16 Ruang', shortcut: '3' },
  { id: 'first_person', label: 'First-Person (POV)', shortLabel: 'POV', shortcut: '4' },
];

export type TechnicianOutfitId =
  | 'tech_jacket'
  | 'street_hoodie'
  | 'smart_vest'
  | 'suit_tie'
  | 'blazer_blouse';

export type TechnicianColorwayId =
  | 'sky_azure'
  | 'cobalt'
  | 'emerald'
  | 'crimson'
  | 'amber'
  | 'violet';

export type TechnicianHairStyleId =
  | 'quiff'
  | 'comma'
  | 'slick'
  | 'crop'
  | 'two_block'
  | 'curtain_middle'
  | 'pompadour'
  | 'side_part'
  | 'textured_fringe'
  | 'wavy_curl'
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

export type TechnicianHairColorId =
  | 'mahogany'
  | 'espresso'
  | 'jet_black'
  | 'copper_auburn'
  | 'ash_silver'
  | 'midnight_blue';

export interface HairColorMeta {
  id: TechnicianHairColorId;
  label: string;
  swatchHex: string;
  hex: number;
}

export const TECHNICIAN_HAIR_COLORS: HairColorMeta[] = [
  { id: 'mahogany', label: 'Cokelat Hangat', swatchHex: '#562920', hex: 0x52271e },
  { id: 'espresso', label: 'Espresso', swatchHex: '#2c1c15', hex: 0x261913 },
  { id: 'jet_black', label: 'Hitam Arang', swatchHex: '#151821', hex: 0x151821 },
  { id: 'copper_auburn', label: 'Karamel', swatchHex: '#9a4d2c', hex: 0x9a4d2c },
  { id: 'ash_silver', label: 'Ash Silver', swatchHex: '#94a3b8', hex: 0x94a3b8 },
  { id: 'midnight_blue', label: 'Navy Tint', swatchHex: '#1e3a5f', hex: 0x1e3a5f },
];

export interface TechnicianAppearance {
  gender: GenderOption;
  outfit: TechnicianOutfitId;
  colorway: TechnicianColorwayId;
  hairStyle: TechnicianHairStyleId;
  hairColor: TechnicianHairColorId;
  glasses: boolean;
  headset: boolean;
  skirt: boolean;
}

export interface OutfitOptionMeta {
  id: TechnicianOutfitId;
  label: string;
  subtitle: string;
}

export const TECHNICIAN_OUTFITS: OutfitOptionMeta[] = [
  { id: 'blazer_blouse', label: 'Blazer Modern', subtitle: 'Blazer chic + inner putih rapi' },
  { id: 'tech_jacket', label: 'Jaket Techwear', subtitle: 'Bomber lapangan + saku utilitas' },
  { id: 'street_hoodie', label: 'Hoodie Layered', subtitle: 'Hoodie kasual + jaket luar' },
  { id: 'smart_vest', label: 'Rompi Smart Vest', subtitle: 'Kemeja lengan gulung + rompi' },
  { id: 'suit_tie', label: 'Jas Eksekutif', subtitle: 'Setelan jas rapi + dasi & pin' },
];

export interface ColorwayMeta {
  id: TechnicianColorwayId;
  label: string;
  swatchHex: string;
  accentHex: string;
  outerHex: number;
  shirtHex: number;
  pantsHex: number;
  tieOrAccentHex: number;
  shoeHex: number;
  badgeHex: string;
}

export const TECHNICIAN_COLORWAYS: ColorwayMeta[] = [
  {
    id: 'sky_azure',
    label: 'Sky Pastel',
    swatchHex: '#7ec2fa',
    accentHex: '#ffffff',
    outerHex: 0x82c3f8,
    shirtHex: 0xffffff,
    pantsHex: 0x262c36,
    tieOrAccentHex: 0x38bdf8,
    shoeHex: 0x1e293b,
    badgeHex: '#0284c7',
  },
  {
    id: 'cobalt',
    label: 'Ocean Cobalt',
    swatchHex: '#0284c7',
    accentHex: '#38bdf8',
    outerHex: 0x0f3b66,
    shirtHex: 0xf8fafc,
    pantsHex: 0x1e293b,
    tieOrAccentHex: 0x38bdf8,
    shoeHex: 0x0f172a,
    badgeHex: '#0284c7',
  },
  {
    id: 'emerald',
    label: 'Sage Emerald',
    swatchHex: '#059669',
    accentHex: '#34d399',
    outerHex: 0x0f4c3a,
    shirtHex: 0xf8fafc,
    pantsHex: 0x1e293b,
    tieOrAccentHex: 0x34d399,
    shoeHex: 0x18181b,
    badgeHex: '#059669',
  },
  {
    id: 'crimson',
    label: 'Crimson Slate',
    swatchHex: '#be123c',
    accentHex: '#fb7185',
    outerHex: 0x7f1d32,
    shirtHex: 0xfafaf9,
    pantsHex: 0x18181b,
    tieOrAccentHex: 0xfb7185,
    shoeHex: 0x090d14,
    badgeHex: '#be123c',
  },
  {
    id: 'amber',
    label: 'Warm Copper',
    swatchHex: '#d97706',
    accentHex: '#fbbf24',
    outerHex: 0x78350f,
    shirtHex: 0xfffbeb,
    pantsHex: 0x27272a,
    tieOrAccentHex: 0xf59e0b,
    shoeHex: 0x1c1917,
    badgeHex: '#d97706',
  },
  {
    id: 'violet',
    label: 'Indigo Dusk',
    swatchHex: '#4f46e5',
    accentHex: '#a78bfa',
    outerHex: 0x312e81,
    shirtHex: 0xf5f3ff,
    pantsHex: 0x1e1b4b,
    tieOrAccentHex: 0x818cf8,
    shoeHex: 0x0f172a,
    badgeHex: '#4f46e5',
  },
];

export const DEFAULT_TECHNICIAN_APPEARANCE: TechnicianAppearance = {
  gender: 'female',
  outfit: 'blazer_blouse',
  colorway: 'sky_azure',
  hairStyle: 'long_wave',
  hairColor: 'mahogany',
  glasses: false,
  headset: false,
  skirt: true,
};

const FEMALE_HAIRS: TechnicianHairStyleId[] = [
  'long_wave',
  'side_sweep_long',
  'hime_bangs',
  'low_twintail',
  'side_braid',
  'wolf_layer',
  'half_up',
  'high_bun',
  'ponytail',
  'sleek_bob',
  'chignon',
];
const MALE_HAIRS: TechnicianHairStyleId[] = [
  'quiff',
  'side_part',
  'textured_fringe',
  'wavy_curl',
  'two_block',
  'comma',
  'curtain_middle',
  'pompadour',
  'slick',
  'crop',
];

export function withTechnicianGender(
  current: TechnicianAppearance,
  gender: GenderOption
): TechnicianAppearance {
  if (gender === current.gender) return current;
  const nextHair: TechnicianHairStyleId =
    gender === 'female'
      ? FEMALE_HAIRS.includes(current.hairStyle)
        ? current.hairStyle
        : 'long_wave'
      : MALE_HAIRS.includes(current.hairStyle)
        ? current.hairStyle
        : 'quiff';
  const nextOutfit: TechnicianOutfitId =
    gender === 'female' && current.outfit === 'suit_tie'
      ? 'blazer_blouse'
      : gender === 'male' && current.outfit === 'blazer_blouse'
        ? 'suit_tie'
        : current.outfit;
  return {
    ...current,
    gender,
    hairStyle: nextHair,
    outfit: nextOutfit,
    skirt: gender === 'female',
  };
}
