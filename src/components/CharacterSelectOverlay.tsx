import React from 'react';
import { BookOpen, Play, User, Users } from 'lucide-react';
import { GenderOption, PLAYER_THEMES, PlayerConfig, PlayerSlot } from '../types/game';

interface CharacterSelectOverlayProps {
  coopMode: boolean;
  onToggleCoop: (coop: boolean) => void;
  p1Config: PlayerConfig;
  p2Config: PlayerConfig;
  onChangeP1: (cfg: PlayerConfig) => void;
  onChangeP2: (cfg: PlayerConfig) => void;
  onStartGame: () => void;
  onOpenGdd: () => void;
}

export const CharacterSelectOverlay: React.FC<CharacterSelectOverlayProps> = ({
  coopMode,
  onToggleCoop,
  p1Config,
  p2Config,
  onChangeP1,
  onChangeP2,
  onStartGame,
  onOpenGdd,
}) => {
  const renderPlayerCard = (
    title: string,
    controlsLabel: string,
    config: PlayerConfig,
    onChange: (cfg: PlayerConfig) => void
  ) => {
    const activeTheme = PLAYER_THEMES[config.slot];
    return (
      <div className="rounded-xl border border-slate-700/80 bg-slate-900/95 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: activeTheme.hex }}
            />
            <span className="font-display text-base font-bold text-white">{title}</span>
          </div>
          <span className="font-mono-tabular text-xs text-slate-400">{controlsLabel}</span>
        </div>

        {/* Gender Selection */}
        <div className="mt-3">
          <div className="mb-1.5 text-xs font-medium text-slate-400">Karakter Teknisi</div>
          <div className="grid grid-cols-2 gap-2">
            {(['male', 'female'] as GenderOption[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onChange({ ...config, gender: g })}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                  config.gender === g
                    ? 'border-cyan-400 bg-cyan-500/20 text-white'
                    : 'border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                }`}
              >
                {g === 'male' ? 'Teknisi Pria' : 'Teknisi Wanita'}
              </button>
            ))}
          </div>
        </div>

        {/* Uniform Accent Color (P1 - P4) */}
        <div className="mt-3">
          <div className="mb-1.5 text-xs font-medium text-slate-400">
            Warna Rompi Techwear ({activeTheme.name})
          </div>
          <div className="grid grid-cols-4 gap-2">
            {PLAYER_THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => onChange({ ...config, slot: theme.id as PlayerSlot })}
                className={`flex items-center justify-center gap-1.5 rounded-lg border py-1.5 text-xs font-bold transition-colors ${
                  config.slot === theme.id
                    ? 'border-white bg-slate-800 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-600'
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: theme.hex }}
                />
                <span>{theme.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4">
      <div className="my-auto w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900/95 p-6 shadow-2xl md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-cyan-400">
              <span>Level 1: Seminar Nasional</span>
              <span aria-hidden="true">·</span>
              <span>3D Isometric TKJ Co-op</span>
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
              SERVER PANIC! <span className="text-cyan-400">(Co-op Chaos)</span>
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-slate-300">
              Tarik kabel UTP, selesaikan crimping T568B, pasang Access Point PoE di atas tangga, dan konfigurasi VLAN 10 &amp; 20 sebelum acara seminar dimulai.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenGdd}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-100 hover:border-cyan-500/60 hover:bg-slate-700 whitespace-nowrap shrink-0"
          >
            <BookOpen className="h-4 w-4 text-cyan-400" />
            Buka GDD &amp; Arsitektur Kode
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-300">Mode Bermain</span>
          <div className="inline-flex rounded-lg border border-slate-700 bg-slate-950 p-1">
            <button
              type="button"
              onClick={() => onToggleCoop(false)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                !coopMode ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              Solo Teknisi
            </button>
            <button
              type="button"
              onClick={() => onToggleCoop(true)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                coopMode ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              2P Local Co-op
            </button>
          </div>
        </div>

        {/* Character Select Grid */}
        <div className={`mt-4 grid gap-4 ${coopMode ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
          {renderPlayerCard('Player 1', 'WASD + E / Spasi', p1Config, onChangeP1)}
          {coopMode &&
            renderPlayerCard('Player 2', 'Panah + Enter / Shift', p2Config, onChangeP2)}
        </div>

        {/* Start Action */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-5">
          <div className="text-xs text-slate-400">
            Tip: Hindari menginjak kabel berantakan di lantai atau karakter akan tersandung (stun).
          </div>
          <button
            type="button"
            onClick={onStartGame}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-display text-sm font-bold text-slate-950 shadow-lg hover:bg-cyan-400 whitespace-nowrap shrink-0"
          >
            <Play className="h-4 w-4 fill-current" />
            Mulai Shift: Seminar Nasional
          </button>
        </div>
      </div>
    </div>
  );
};
