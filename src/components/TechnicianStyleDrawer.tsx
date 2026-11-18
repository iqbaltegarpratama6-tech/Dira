import React from 'react';
import { Check, Glasses, Headphones, Shuffle, Sparkles, User, X } from 'lucide-react';
import {
  GenderOption,
  TECHNICIAN_COLORWAYS,
  TECHNICIAN_HAIR_COLORS,
  TECHNICIAN_OUTFITS,
  TechnicianAppearance,
  TechnicianHairStyleId,
  withTechnicianGender,
} from '../types/game';

interface TechnicianStyleDrawerProps {
  open: boolean;
  appearance: TechnicianAppearance;
  onChange: (next: TechnicianAppearance) => void;
  onClose: () => void;
}

const MALE_HAIRSTYLES: Array<{ id: TechnicianHairStyleId; label: string }> = [
  { id: 'quiff', label: 'Quiff Rapi' },
  { id: 'side_part', label: 'Belah Samping' },
  { id: 'textured_fringe', label: 'Poni Bertekstur' },
  { id: 'wavy_curl', label: 'Ikal Bervolume' },
  { id: 'two_block', label: 'Two-Block K-Style' },
  { id: 'comma', label: 'Comma Hair' },
  { id: 'curtain_middle', label: 'Belah Tengah' },
  { id: 'pompadour', label: 'Pompadour' },
  { id: 'slick', label: 'Slick Back' },
  { id: 'crop', label: 'Crop Modern' },
];

const FEMALE_HAIRSTYLES: Array<{ id: TechnicianHairStyleId; label: string }> = [
  { id: 'long_wave', label: 'Panjang Alami' },
  { id: 'side_sweep_long', label: 'Lurus Samping' },
  { id: 'hime_bangs', label: 'Poni Rata Panjang' },
  { id: 'low_twintail', label: 'Kuncir Dua' },
  { id: 'side_braid', label: 'Kepang Samping' },
  { id: 'wolf_layer', label: 'Layer Wolf' },
  { id: 'half_up', label: 'Half-Up Pita' },
  { id: 'high_bun', label: 'Cepol Tinggi' },
  { id: 'ponytail', label: 'Ponytail' },
  { id: 'sleek_bob', label: 'Bob Rapi' },
  { id: 'chignon', label: 'Sanggul Rapi' },
];

export const TechnicianStyleDrawer: React.FC<TechnicianStyleDrawerProps> = ({
  open,
  appearance,
  onChange,
  onClose,
}) => {
  if (!open) return null;

  const hairstyles = appearance.gender === 'female' ? FEMALE_HAIRSTYLES : MALE_HAIRSTYLES;
  const activeColorway =
    TECHNICIAN_COLORWAYS.find((c) => c.id === appearance.colorway) ?? TECHNICIAN_COLORWAYS[0];

  const handleGenderChange = (gender: GenderOption) => {
    if (gender === appearance.gender) return;
    onChange(withTechnicianGender(appearance, gender));
  };

  const handleRandomize = () => {
    const genders: GenderOption[] = ['male', 'female'];
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const outfit =
      TECHNICIAN_OUTFITS[Math.floor(Math.random() * TECHNICIAN_OUTFITS.length)].id;
    const colorway =
      TECHNICIAN_COLORWAYS[Math.floor(Math.random() * TECHNICIAN_COLORWAYS.length)].id;
    const hairList = gender === 'female' ? FEMALE_HAIRSTYLES : MALE_HAIRSTYLES;
    const hairStyle = hairList[Math.floor(Math.random() * hairList.length)].id;
    const hairColor =
      TECHNICIAN_HAIR_COLORS[Math.floor(Math.random() * TECHNICIAN_HAIR_COLORS.length)].id;
    onChange({
      gender,
      outfit,
      colorway,
      hairStyle,
      hairColor,
      glasses: Math.random() > 0.55,
      headset: Math.random() > 0.4,
      skirt: gender === 'female' && Math.random() > 0.5,
    });
  };

  return (
    <aside className="pointer-events-auto fixed bottom-3 right-3 top-14 z-30 flex w-80 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-xl border border-slate-700/90 bg-[#0b1017]/96 shadow-2xl md:right-4 md:top-16 md:bottom-4 md:w-[340px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <h2 className="font-display text-sm font-bold tracking-wide text-slate-100">
            Studio Kostum &amp; Gaya
          </h2>
          <p className="text-[11px] text-slate-400">
            Pratinjau langsung pada karakter 3D
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRandomize}
            className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 transition-colors hover:border-sky-500/60 hover:text-sky-300 whitespace-nowrap shrink-0"
            title="Acak kombinasi baju dan gaya"
          >
            <Shuffle className="h-3.5 w-3.5 text-sky-400" />
            Acak
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-800 bg-slate-900 p-1.5 text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
            aria-label="Tutup Studio Gaya"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3.5">
        {/* Gender Toggle */}
        <div>
          <div className="mb-1.5 text-xs font-semibold text-slate-300">Karakter</div>
          <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-slate-800 bg-[#070a0f] p-1">
            {(['female', 'male'] as GenderOption[]).map((g) => {
              const active = appearance.gender === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleGenderChange(g)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  {g === 'female' ? 'Perempuan' : 'Laki-laki'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Outfit Style */}
        <div>
          <div className="mb-1.5 text-xs font-semibold text-slate-300">Model Kostum</div>
          <div className="grid grid-cols-1 gap-1.5">
            {TECHNICIAN_OUTFITS.map((item) => {
              const active = appearance.outfit === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChange({ ...appearance, outfit: item.id })}
                  className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
                    active
                      ? 'border-sky-500/70 bg-sky-500/15 text-slate-100'
                      : 'border-slate-800 bg-[#0f1622] text-slate-300 hover:border-slate-700 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold">{item.label}</div>
                    <div className="truncate text-[11px] text-slate-400">{item.subtitle}</div>
                  </div>
                  {active && <Check className="h-4 w-4 shrink-0 text-sky-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Colorway */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Tema Warna</span>
            <span className="text-[11px] font-medium text-sky-400">{activeColorway.label}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {TECHNICIAN_COLORWAYS.map((pal) => {
              const active = appearance.colorway === pal.id;
              return (
                <button
                  key={pal.id}
                  type="button"
                  onClick={() => onChange({ ...appearance, colorway: pal.id })}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'border-sky-400 bg-slate-800 text-white'
                      : 'border-slate-800 bg-[#0f1622] text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="flex h-4 w-4 shrink-0 overflow-hidden rounded border border-white/20">
                    <span className="w-1/2 h-full" style={{ backgroundColor: pal.swatchHex }} />
                    <span className="w-1/2 h-full" style={{ backgroundColor: pal.accentHex }} />
                  </span>
                  <span className="truncate">{pal.label.split(' ')[1] ?? pal.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hair Style */}
        <div>
          <div className="mb-1.5 text-xs font-semibold text-slate-300">Gaya Rambut</div>
          <div className="grid grid-cols-2 gap-1.5">
            {hairstyles.map((h) => {
              const active = appearance.hairStyle === h.id;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => onChange({ ...appearance, hairStyle: h.id })}
                  className={`truncate rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'border-sky-500/70 bg-sky-500/15 text-sky-200'
                      : 'border-slate-800 bg-[#0f1622] text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {h.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hair Color */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Warna Rambut</span>
            <span className="text-[11px] font-medium text-sky-400">
              {TECHNICIAN_HAIR_COLORS.find((h) => h.id === appearance.hairColor)?.label ??
                'Espresso'}
            </span>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {TECHNICIAN_HAIR_COLORS.map((hc) => {
              const active = appearance.hairColor === hc.id;
              return (
                <button
                  key={hc.id}
                  type="button"
                  onClick={() => onChange({ ...appearance, hairColor: hc.id })}
                  title={hc.label}
                  aria-label={hc.label}
                  className={`flex h-8 items-center justify-center rounded-lg border transition-colors ${
                    active
                      ? 'border-sky-400 bg-slate-800 ring-1 ring-sky-400/70'
                      : 'border-slate-800 bg-[#0f1622] hover:border-slate-700'
                  }`}
                >
                  <span
                    className="h-4.5 w-4.5 rounded-full border border-white/25"
                    style={{ backgroundColor: hc.swatchHex }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Accessories */}
        <div>
          <div className="mb-1.5 text-xs font-semibold text-slate-300">Aksesori</div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onChange({ ...appearance, glasses: !appearance.glasses })}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                appearance.glasses
                  ? 'border-sky-500/70 bg-sky-500/15 text-sky-200'
                  : 'border-slate-800 bg-[#0f1622] text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <Glasses className="h-3.5 w-3.5" />
              Kacamata
            </button>

            <button
              type="button"
              onClick={() => onChange({ ...appearance, headset: !appearance.headset })}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                appearance.headset
                  ? 'border-sky-500/70 bg-sky-500/15 text-sky-200'
                  : 'border-slate-800 bg-[#0f1622] text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <Headphones className="h-3.5 w-3.5" />
              Headset
            </button>

            {appearance.gender === 'female' && (
              <button
                type="button"
                onClick={() => onChange({ ...appearance, skirt: !appearance.skirt })}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  appearance.skirt
                    ? 'border-sky-500/70 bg-sky-500/15 text-sky-200'
                    : 'border-slate-800 bg-[#0f1622] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Rok Pensil
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400"
        >
          <Check className="h-4 w-4" />
          Terapkan Tampilan
        </button>
      </div>
    </aside>
  );
};
