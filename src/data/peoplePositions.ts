import defaultPositionsTxt from './posisi-orang.txt?raw';
import { OfficeNpcId } from '../types/game';

export type PersonPositionId = 'teknisi' | 'boss_direktur' | OfficeNpcId;

export interface PersonPositionEntry {
  id: PersonPositionId;
  x: number;
  y: number;
  z: number;
  rot: number;
}

export interface ParsedPeoplePositions {
  entries: Partial<Record<PersonPositionId, PersonPositionEntry>>;
  errors: string[];
}

const VALID_PERSON_IDS = new Set<PersonPositionId>([
  'teknisi',
  'boss_direktur',
  'npc_r01_arif',
  'npc_r02_raka',
  'npc_r03_maya',
  'npc_r04_nadia',
  'npc_r05_budi',
  'npc_r05_citra',
  'npc_r05_farhan',
  'npc_corr_hendra',
  'npc_r06_sari',
  'npc_r07_laras',
  'npc_r07_fajar',
  'npc_r08_dimas',
  'npc_r08_putri',
  'npc_r09_bagus',
  'npc_r10_reza',
  'npc_r11_tina',
  'npc_r12_andi',
  'npc_r13_hilman',
  'npc_r16_rina',
]);

export const STORAGE_KEY_PEOPLE_NOTEPAD = 'netops_people_positions_notepad_v1';

export function getDefaultPeoplePositionsTxt(): string {
  return defaultPositionsTxt;
}

export function loadSavedPeoplePositionsTxt(): string {
  if (typeof window === 'undefined') return defaultPositionsTxt;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY_PEOPLE_NOTEPAD);
    return saved && saved.trim().length > 0 ? saved : defaultPositionsTxt;
  } catch {
    return defaultPositionsTxt;
  }
}

export function savePeoplePositionsTxt(rawTxt: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY_PEOPLE_NOTEPAD, rawTxt);
  } catch {
    // Ignore storage quota errors
  }
}

export function clearSavedPeoplePositionsTxt(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY_PEOPLE_NOTEPAD);
  } catch {
    // Ignore storage errors
  }
}

export function parsePeoplePositionsTxt(rawTxt: string): ParsedPeoplePositions {
  const entries: Partial<Record<PersonPositionId, PersonPositionEntry>> = {};
  const errors: string[] = [];

  const lines = rawTxt.split(/\r?\n/);
  lines.forEach((rawLine, idx) => {
    const lineNum = idx + 1;
    // Strip inline # or // comments
    const clean = rawLine.replace(/(#|\/\/).*$/, '').trim();
    if (!clean) return;

    let idPart = '';
    let coordPart = '';

    const eqIdx = clean.indexOf('=');
    const pipeIdx = clean.indexOf('|');
    if (eqIdx !== -1) {
      idPart = clean.slice(0, eqIdx).trim();
      coordPart = clean.slice(eqIdx + 1).trim();
    } else if (pipeIdx !== -1) {
      idPart = clean.slice(0, pipeIdx).trim();
      coordPart = clean.slice(pipeIdx + 1).trim();
    } else {
      errors.push(`Baris ${lineNum}: format harus "id = x, y, z, rot"`);
      return;
    }

    if (!VALID_PERSON_IDS.has(idPart as PersonPositionId)) {
      errors.push(`Baris ${lineNum}: ID orang "${idPart}" tidak dikenal`);
      return;
    }

    const tokens = coordPart
      .split(/[,|\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (tokens.length < 3 || tokens.length > 4) {
      errors.push(`Baris ${lineNum} (${idPart}): butuh 3 atau 4 angka (x, y, z, rot)`);
      return;
    }

    const x = Number(tokens[0]);
    const y = Number(tokens[1]);
    const z = Number(tokens[2]);
    const rot = tokens.length >= 4 ? Number(tokens[3]) : 0;

    if (![x, y, z, rot].every((n) => Number.isFinite(n))) {
      errors.push(`Baris ${lineNum} (${idPart}): koordinat harus berupa angka valid`);
      return;
    }

    const clampedX = Math.max(-14.6, Math.min(32.6, x));
    const clampedY = Math.max(-1.5, Math.min(3.0, y));
    const clampedZ = Math.max(-7.1, Math.min(7.1, z));

    entries[idPart as PersonPositionId] = {
      id: idPart as PersonPositionId,
      x: Number(clampedX.toFixed(2)),
      y: Number(clampedY.toFixed(2)),
      z: Number(clampedZ.toFixed(2)),
      rot: Number(rot.toFixed(1)),
    };
  });

  return { entries, errors };
}

export function updatePersonLineInTxt(
  rawTxt: string,
  id: PersonPositionId,
  pos: { x: number; y: number; z: number; rot: number }
): string {
  const lines = rawTxt.split(/\r?\n/);
  const coordText = `${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}, ${Math.round(pos.rot)}`;
  let replaced = false;

  const updated = lines.map((line) => {
    const commentMatch = line.match(/(\s*(?:#|\/\/).*)$/);
    const comment = commentMatch ? commentMatch[1] : '';
    const body = commentMatch ? line.slice(0, line.length - comment.length) : line;
    const match = body.match(/^\s*([a-zA-Z0-9_]+)\s*(=|\|)/);
    if (match && match[1] === id) {
      replaced = true;
      const base = `${id} = ${coordText}`;
      const padded = comment ? base.padEnd(44, ' ') + comment.trimStart() : base;
      return padded;
    }
    return line;
  });

  if (!replaced) {
    updated.push(`${id} = ${coordText}`);
  }
  return updated.join('\n');
}
