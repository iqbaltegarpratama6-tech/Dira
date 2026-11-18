import React from 'react';
import {
  BookOpen,
  Monitor,
  Music,
  Pause,
  Play,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CHILL_VIBES, ChillMusicState, ChillVibeId } from '../audio/chillMusic';
import {
  GenderOption,
  TECHNICIAN_COLORWAYS,
  TechnicianAppearance,
  TechnicianColorwayId,
} from '../types/game';

interface GameTitleScreenProps {
  appearance: TechnicianAppearance;
  muted: boolean;
  musicState: ChillMusicState;
  onChangeGender: (gender: GenderOption) => void;
  onChangeColorway: (colorway: TechnicianColorwayId) => void;
  onToggleMute: () => void;
  onToggleMusicPlay: () => void;
  onSelectMusicVibe: (vibe: ChillVibeId) => void;
  onChangeMusicVolume: (volume: number) => void;
  onPlayGame: () => void;
  onOpenGdd: () => void;
}

export const GameTitleScreen: React.FC<GameTitleScreenProps> = ({
  appearance,
  muted,
  musicState,
  onChangeGender,
  onChangeColorway,
  onToggleMute,
  onToggleMusicPlay,
  onSelectMusicVibe,
  onChangeMusicVolume,
  onPlayGame,
  onOpenGdd,
}) => {
  const activeVibe = CHILL_VIBES.find((v) => v.id === musicState.vibe) ?? CHILL_VIBES[0];
  const musicActivelyAudible = musicState.isPlaying && musicState.unlocked && !muted;
  const activeColorway =
    TECHNICIAN_COLORWAYS.find((c) => c.id === appearance.colorway) ?? TECHNICIAN_COLORWAYS[0];

  return (
    <div
      className="relative flex min-h-dvh w-full flex-col justify-between overflow-x-hidden bg-[#080c14] text-slate-100"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 65% 50% at 50% 42%, rgba(56, 189, 248, 0.12), transparent 72%), radial-gradient(ellipse 45% 35% at 50% 78%, rgba(245, 158, 11, 0.07), transparent 70%), linear-gradient(to right, rgba(148,163,184,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.035) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 100% 100%, 44px 44px, 44px 44px',
      }}
    >
      {/* Top Bar: 3-Zone Compact Header */}
      <header className="border-b border-slate-800/80 bg-[#080c14]/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-2 sm:px-8 sm:py-3">
          <div className="flex items-center gap-2 font-display text-sm font-bold tracking-tight text-white sm:text-base whitespace-nowrap shrink-0">
            <Monitor className="h-4 w-4 text-sky-400" />
            <span>NetOps 10R</span>
          </div>

          <div className="hidden items-center gap-4 text-xs text-slate-400 md:flex">
            <span className="whitespace-nowrap shrink-0">16 Ruangan Kantor</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span className="whitespace-nowrap shrink-0">9 Studi Kasus</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span className="whitespace-nowrap shrink-0">11 Staf NPC</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span className="whitespace-nowrap shrink-0">4 Sudut Kamera</span>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={onOpenGdd}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0d1420] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-700 hover:text-white whitespace-nowrap shrink-0"
            >
              <BookOpen className="h-3.5 w-3.5 text-sky-400" />
              <span>Dokumentasi GDD</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Centered Single-Viewport Content */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-2 sm:px-6 sm:py-5">
        <div className="flex w-full flex-col items-center text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium tracking-wide text-sky-400 sm:text-xs">
            <span>Simulasi Teknisi IT 3D</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Jaringan &amp; Perbaikan PC</span>
          </div>

          <h1 className="mt-1.5 text-balance font-display text-3xl font-bold tracking-tight text-white sm:mt-2 sm:text-5xl">
            SERVER PANIC!
          </h1>

          <p className="mt-1 font-display text-xs font-semibold text-amber-300/95 sm:mt-2 sm:text-lg">
            Pulihkan Jaringan &amp; PC Kantor
          </p>

          {/* Centered Primary CTA */}
          <div className="mt-3 flex justify-center sm:mt-5">
            <button
              type="button"
              onClick={onPlayGame}
              className="inline-flex cursor-pointer items-center gap-2.5 rounded-xl bg-sky-500 px-8 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02] hover:bg-sky-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 sm:px-10 sm:py-3.5 sm:text-base whitespace-nowrap shrink-0"
            >
              <Play className="h-4 w-4 fill-current sm:h-5 sm:w-5" />
              <span>Mainkan Game</span>
            </button>
          </div>

          {/* Centered Character & Uniform Selector */}
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2.5 sm:mt-4 sm:gap-3">
            <div
              role="group"
              aria-label="Pilih Karakter Teknisi"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-[#0d1420] p-0.5 sm:p-1"
            >
              {(['female', 'male'] as GenderOption[]).map((g) => {
                const active = appearance.gender === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => onChangeGender(g)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors sm:px-3 sm:py-1.5 sm:text-xs whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-slate-800 text-sky-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span>{g === 'female' ? 'Teknisi Wanita' : 'Teknisi Pria'}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0d1420] px-2 py-1 sm:px-2.5 sm:py-1.5">
              {TECHNICIAN_COLORWAYS.map((pal) => {
                const active = appearance.colorway === pal.id;
                return (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => onChangeColorway(pal.id)}
                    title={`Seragam ${pal.label}`}
                    aria-label={`Pilih warna seragam ${pal.label}`}
                    className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded border transition-transform hover:scale-105 sm:h-6 sm:w-6 ${
                      active
                        ? 'border-sky-400 ring-1 ring-sky-400/70'
                        : 'border-slate-700/80'
                    }`}
                  >
                    <span
                      className="h-3 w-3 rounded-[2px] sm:h-3.5 sm:w-3.5"
                      style={{ backgroundColor: pal.swatchHex }}
                    />
                  </button>
                );
              })}
              <span className="hidden pl-1 text-[11px] text-slate-300 sm:inline whitespace-nowrap">
                {activeColorway.label}
              </span>
            </div>
          </div>

          {/* Compact Centered Chill Music Player Bar */}
          <div className="mt-2.5 w-full max-w-2xl rounded-xl border border-slate-800/90 bg-[#0d1420]/95 p-2 sm:mt-5 sm:p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              <div className="flex min-w-0 items-center gap-2.5 text-left">
                <button
                  type="button"
                  onClick={onToggleMusicPlay}
                  className={`inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors sm:h-9 sm:w-9 ${
                    musicActivelyAudible
                      ? 'border-amber-400/60 bg-amber-400/15 text-amber-300 hover:bg-amber-400/25'
                      : 'border-sky-500/50 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25'
                  }`}
                  aria-label={musicActivelyAudible ? 'Jeda Musik Santai' : 'Putar Musik Santai'}
                >
                  {musicActivelyAudible ? (
                    <Pause className="h-3.5 w-3.5 fill-current" />
                  ) : (
                    <Play className="h-3.5 w-3.5 fill-current" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[11px] font-semibold text-slate-100 sm:text-xs">
                      {activeVibe.label}
                    </span>
                    <span className="inline-flex h-3 items-end gap-0.5" aria-hidden="true">
                      <span
                        className={`h-full w-0.5 origin-bottom rounded-full bg-amber-300 ${
                          musicActivelyAudible ? 'animate-eq-1' : 'scale-y-30 opacity-40'
                        }`}
                      />
                      <span
                        className={`h-full w-0.5 origin-bottom rounded-full bg-amber-300 ${
                          musicActivelyAudible ? 'animate-eq-2' : 'scale-y-50 opacity-40'
                        }`}
                      />
                      <span
                        className={`h-full w-0.5 origin-bottom rounded-full bg-amber-300 ${
                          musicActivelyAudible ? 'animate-eq-3' : 'scale-y-25 opacity-40'
                        }`}
                      />
                      <span
                        className={`h-full w-0.5 origin-bottom rounded-full bg-amber-300 ${
                          musicActivelyAudible ? 'animate-eq-4' : 'scale-y-40 opacity-40'
                        }`}
                      />
                    </span>
                  </div>
                  <p className="truncate text-[10px] text-slate-400 sm:text-[11px]">
                    {muted
                      ? 'Audio dibisukan'
                      : musicActivelyAudible
                        ? `Musik santai aktif · ${activeVibe.bpm} BPM`
                        : 'Ketuk layar untuk memutar musik santai'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 rounded-lg bg-[#080c14] p-0.5 sm:p-1">
                {CHILL_VIBES.map((vibe) => {
                  const selected = musicState.vibe === vibe.id;
                  return (
                    <button
                      key={vibe.id}
                      type="button"
                      onClick={() => onSelectMusicVibe(vibe.id)}
                      className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors sm:px-2.5 sm:text-[11px] whitespace-nowrap shrink-0 ${
                        selected
                          ? 'bg-slate-800 text-amber-200'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Music className="hidden h-3 w-3 sm:inline" />
                      <span>{vibe.shortLabel}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={muted ? 0 : Math.round(musicState.volume * 100)}
                  onChange={(e) => onChangeMusicVolume(Number(e.target.value) / 100)}
                  aria-label="Volume Musik Santai"
                  className="h-1.5 w-14 cursor-pointer accent-amber-400 sm:w-20"
                />
                <button
                  type="button"
                  onClick={onToggleMute}
                  className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-800 bg-[#080c14] text-slate-300 transition-colors hover:border-slate-700 hover:text-white"
                  aria-label={muted ? 'Nyalakan Audio' : 'Bisukan Audio'}
                >
                  {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Compact Control Guide Footer */}
      <footer className="border-t border-slate-800/80 bg-[#080c14]/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2 text-[10px] text-slate-400 sm:px-8 sm:py-2.5 sm:text-xs">
          <span>
            Gerak: <strong className="font-mono-tabular text-slate-200">WASD / Klik Lantai</strong>
          </span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>
            Diagnosa: <strong className="font-mono-tabular text-slate-200">Klik Objek / [E]</strong>
          </span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>
            Kamera: <strong className="font-mono-tabular text-slate-200">Klik Kanan + Geser</strong>
          </span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>
            Sudut Pandang: <strong className="font-mono-tabular text-slate-200">Tombol 1–4</strong>
          </span>
        </div>
      </footer>
    </div>
  );
};
