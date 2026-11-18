import React, { useEffect, useRef, useState } from 'react';
import { Check, Download, FileText, MapPin, RotateCcw, Upload, X } from 'lucide-react';
import {
  clearSavedPeoplePositionsTxt,
  getDefaultPeoplePositionsTxt,
  loadSavedPeoplePositionsTxt,
  parsePeoplePositionsTxt,
  savePeoplePositionsTxt,
  updatePersonLineInTxt,
} from '../data/peoplePositions';

interface PeopleNotepadDrawerProps {
  open: boolean;
  onClose: () => void;
  onApplyPositions: (
    rawTxt: string,
    options?: { movePlayer?: boolean }
  ) => { appliedCount: number; errors: string[] } | undefined;
  onGetPlayerPosition: () => { x: number; y: number; z: number; rot: number } | undefined;
}

export const PeopleNotepadDrawer: React.FC<PeopleNotepadDrawerProps> = ({
  open,
  onClose,
  onApplyPositions,
  onGetPlayerPosition,
}) => {
  const [text, setText] = useState<string>(() => loadSavedPeoplePositionsTxt());
  const [errors, setErrors] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setText(loadSavedPeoplePositionsTxt());
      setErrors([]);
      setFeedback(null);
    }
  }, [open]);

  if (!open) return null;

  const handleApply = (sourceText = text, movePlayer = true) => {
    const parsed = parsePeoplePositionsTxt(sourceText);
    if (parsed.errors.length > 0) {
      setErrors(parsed.errors);
      setFeedback(null);
      return;
    }
    const res = onApplyPositions(sourceText, { movePlayer });
    savePeoplePositionsTxt(sourceText);
    setErrors([]);
    const count = res?.appliedCount ?? Object.keys(parsed.entries).length;
    setFeedback(`Tersimpan & diterapkan ke ${count} karakter di scene 3D.`);
  };

  const handleCapturePlayerPos = () => {
    const pos = onGetPlayerPosition();
    if (!pos) return;
    const nextTxt = updatePersonLineInTxt(text, 'teknisi', pos);
    setText(nextTxt);
    setErrors([]);
    setFeedback(
      `Koordinat Teknisi saat ini (${pos.x}, ${pos.y}, ${pos.z}, ${Math.round(pos.rot)}°) disalin ke baris teknisi.`
    );
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'posisi-orang.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFeedback('File posisi-orang.txt berhasil diunduh untuk diedit lewat Notepad.');
  };

  const handleUploadTxt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      if (!content.trim()) return;
      setText(content);
      handleApply(content, true);
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleResetDefault = () => {
    clearSavedPeoplePositionsTxt();
    const defTxt = getDefaultPeoplePositionsTxt();
    setText(defTxt);
    setErrors([]);
    const res = onApplyPositions(defTxt, { movePlayer: true });
    setFeedback(`Posisi ${res?.appliedCount ?? 21} orang dikembalikan ke posisi awal.`);
  };

  return (
    <aside className="pointer-events-auto fixed bottom-3 right-3 top-14 z-30 flex w-[440px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-xl border border-slate-700/90 bg-[#0b1017] shadow-2xl md:right-4 md:top-16 md:bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <FileText className="h-4 w-4 text-sky-400" />
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Notepad Posisi Orang
            </h2>
            <p className="text-xs text-slate-400">
              posisi-orang.txt · format id = x, y, z, rot
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
          aria-label="Tutup Notepad Posisi"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-[#0d131d] px-4 py-2.5">
        <button
          type="button"
          onClick={() => handleApply(text, true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-sky-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400"
        >
          <Check className="h-3.5 w-3.5" />
          Terapkan ke 3D
        </button>

        <button
          type="button"
          onClick={handleCapturePlayerPos}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 hover:text-white"
          title="Salin posisi Teknisi saat ini ke baris teknisi"
        >
          <MapPin className="h-3.5 w-3.5 text-sky-400" />
          Posisi Saya
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 hover:text-white"
          title="Muat file .txt dari Windows Notepad"
        >
          <Upload className="h-3.5 w-3.5 text-slate-300" />
          Buka .txt
        </button>

        <button
          type="button"
          onClick={handleDownloadTxt}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 hover:text-white"
          title="Simpan sebagai file posisi-orang.txt untuk diedit di Notepad"
        >
          <Download className="h-3.5 w-3.5 text-slate-300" />
          Unduh .txt
        </button>

        <button
          type="button"
          onClick={handleResetDefault}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-200"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
          onChange={handleUploadTxt}
          className="hidden"
        />
      </div>

      {/* Feedback / Validation Messages */}
      {errors.length > 0 && (
        <div className="border-b border-rose-500/30 bg-rose-950/40 px-4 py-2 text-xs text-rose-200">
          {errors.slice(0, 3).map((err, idx) => (
            <div key={idx}>{err}</div>
          ))}
        </div>
      )}
      {errors.length === 0 && feedback && (
        <div className="border-b border-emerald-500/30 bg-emerald-950/30 px-4 py-2 text-xs text-emerald-300">
          {feedback}
        </div>
      )}

      {/* Plain-Text Notepad Editor */}
      <div className="flex-1 p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          wrap="off"
          aria-label="Editor Notepad Posisi Orang"
          className="h-full w-full resize-none overflow-auto rounded-lg border border-slate-800 bg-[#070b11] p-3 font-mono-tabular text-xs leading-relaxed text-slate-100 focus:border-sky-500 focus:outline-none"
        />
      </div>

      {/* Footer Hint */}
      <div className="border-t border-slate-800 px-4 py-2.5 text-[11px] leading-relaxed text-slate-400">
        Anda juga bisa langsung mengedit file <span className="font-mono-tabular text-slate-200">src/data/posisi-orang.txt</span> lewat Notepad atau mengunduh &amp; membuka file <span className="font-mono-tabular text-slate-200">.txt</span> di sini.
      </div>
    </aside>
  );
};
