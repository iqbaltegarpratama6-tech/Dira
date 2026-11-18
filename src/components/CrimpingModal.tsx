import React, { useEffect, useState } from 'react';
import { CheckCircle2, Cable, Shuffle, Wrench, X } from 'lucide-react';
import { T568B_STANDARD, T568BWire } from '../types/game';
import { sfx } from '../audio/sfx';

interface CrimpingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function shuffleWires(): T568BWire[] {
  const arr = [...T568B_STANDARD];
  // Guarantee at least 2 swaps so it's never already solved
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  if (arr.every((w, idx) => w.id === T568B_STANDARD[idx].id)) {
    [arr[0], arr[1]] = [arr[1], arr[0]];
  }
  return arr;
}

export const CrimpingModal: React.FC<CrimpingModalProps> = ({ open, onClose, onSuccess }) => {
  const [wires, setWires] = useState<T568BWire[]>(() => shuffleWires());
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [testingPin, setTestingPin] = useState<number>(0);
  const [testing, setTesting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setWires(shuffleWires());
      setSelectedIdx(null);
      setTestingPin(0);
      setTesting(false);
      setErrorMsg(null);
    }
  }, [open]);

  if (!open) return null;

  const isMatched = wires.every((w, idx) => w.id === T568B_STANDARD[idx].id);

  const handleSelectPin = (idx: number) => {
    if (testing) return;
    setErrorMsg(null);
    if (selectedIdx === null) {
      setSelectedIdx(idx);
      sfx.playCrimpClick();
    } else {
      if (selectedIdx !== idx) {
        const next = [...wires];
        [next[selectedIdx], next[idx]] = [next[idx], next[selectedIdx]];
        setWires(next);
        sfx.playCrimpClick();
      }
      setSelectedIdx(null);
    }
  };

  const handleAutoAlignNext = () => {
    if (testing) return;
    setErrorMsg(null);
    const mismatchIdx = wires.findIndex((w, i) => w.id !== T568B_STANDARD[i].id);
    if (mismatchIdx === -1) return;
    const correctIdx = wires.findIndex((w) => w.id === T568B_STANDARD[mismatchIdx].id);
    const next = [...wires];
    [next[mismatchIdx], next[correctIdx]] = [next[correctIdx], next[mismatchIdx]];
    setWires(next);
    setSelectedIdx(null);
    sfx.playCrimpClick();
  };

  const handleCrimpAndTest = () => {
    if (!isMatched) {
      setErrorMsg('Urutan warna belum sesuai standar T568B! Klik dua kabel untuk menukar posisi.');
      sfx.playStumble();
      return;
    }
    setTesting(true);
    setErrorMsg(null);
    sfx.playCrimpClick();

    let pin = 1;
    const interval = window.setInterval(() => {
      setTestingPin(pin);
      sfx.playLanPin(pin);
      pin++;
      if (pin > 8) {
        window.clearInterval(interval);
        window.setTimeout(() => {
          sfx.playLaptopConnected();
          onSuccess();
        }, 280);
      }
    }, 110);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-cyan-500/40 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-cyan-400">
              <Cable className="h-4 w-4" />
              <span>RJ45 Crimping Station</span>
              <span aria-hidden="true">·</span>
              <span>TIA/EIA-568B</span>
            </div>
            <h2 className="mt-1 font-display text-xl font-bold text-white">
              Susun Urutan Kabel UTP (Pin 1–8)
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Klik dua slot kabel untuk menukar posisi hingga sesuai urutan standar T568B, lalu tekan Crimp &amp; Test.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={testing}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-40"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* T568B Reference Guide */}
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>Referensi Standar T568B</span>
            <button
              onClick={handleAutoAlignNext}
              disabled={testing || isMatched}
              className="inline-flex items-center gap-1.5 rounded bg-slate-800 px-2.5 py-1 text-xs font-medium text-cyan-300 hover:bg-slate-700 disabled:opacity-40"
            >
              <Shuffle className="h-3.5 w-3.5" />
              Bantu Rapikan 1 Pin
            </button>
          </div>
          <div className="grid grid-cols-8 gap-1.5">
            {T568B_STANDARD.map((refWire, i) => (
              <div key={refWire.id} className="flex flex-col items-center gap-1 text-center">
                <div
                  className="h-3 w-full rounded-sm border border-white/15"
                  style={{
                    background: refWire.stripeColor
                      ? `repeating-linear-gradient(45deg, ${refWire.primaryColor}, ${refWire.primaryColor} 4px, ${refWire.stripeColor} 4px, ${refWire.stripeColor} 8px)`
                      : refWire.primaryColor,
                  }}
                />
                <span className="font-mono-tabular text-[10px] text-slate-400">
                  {i + 1}. {refWire.label.split('-').map((s) => s[0]).join('/')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive RJ45 Plug Slots */}
        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-4">
          <div className="grid grid-cols-8 gap-2">
            {wires.map((wire, idx) => {
              const correct = wire.id === T568B_STANDARD[idx].id;
              const isSelected = selectedIdx === idx;
              const lit = testingPin >= idx + 1;
              return (
                <button
                  key={`${wire.id}-${idx}`}
                  type="button"
                  onClick={() => handleSelectPin(idx)}
                  disabled={testing}
                  className={`group flex flex-col items-center rounded-lg border p-2 transition-transform ${
                    isSelected
                      ? 'scale-105 border-cyan-400 bg-cyan-500/15'
                      : correct
                        ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-400'
                        : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                  }`}
                >
                  <span className="font-mono-tabular text-xs font-bold text-slate-300">
                    P{idx + 1}
                  </span>
                  <div
                    className="my-2 h-20 w-4 rounded-full border border-white/20 shadow-inner"
                    style={{
                      background: wire.stripeColor
                        ? `repeating-linear-gradient(135deg, ${wire.primaryColor}, ${wire.primaryColor} 5px, ${wire.stripeColor} 5px, ${wire.stripeColor} 10px)`
                        : wire.primaryColor,
                    }}
                  />
                  <span className="line-clamp-2 min-h-[28px] text-center text-[10px] leading-tight text-slate-300">
                    {wire.label}
                  </span>
                  <div
                    className={`mt-1.5 h-2 w-2 rounded-full ${
                      lit ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : correct ? 'bg-emerald-500/50' : 'bg-slate-700'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            {isMatched ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300 font-medium">Urutan T568B valid — siap di-crimp</span>
              </>
            ) : (
              <span>
                Benar: {wires.filter((w, i) => w.id === T568B_STANDARD[i].id).length} / 8 Pin
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={testing}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleCrimpAndTest}
              disabled={testing}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
            >
              <Wrench className="h-4 w-4" />
              {testing ? `LAN Testing Pin ${testingPin}/8...` : 'Crimp & LAN Test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
