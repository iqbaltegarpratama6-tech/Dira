import React from 'react';
import { Award, CheckCircle2, ClipboardCheck, Clock, ShieldCheck, User, X } from 'lucide-react';
import { OFFICE_NPC_LIST } from '../data/officeNpcs';
import { WorkstationStats } from '../types/game';

interface BossReportModalProps {
  open: boolean;
  stats: WorkstationStats;
  onClose: () => void;
  onSubmitReport: () => void;
}

export const BossReportModal: React.FC<BossReportModalProps> = ({
  open,
  stats,
  onClose,
  onSubmitReport,
}) => {
  if (!open) return null;

  const techChecklist = [
    { id: 'rack', label: 'Inspeksi Rak Server 42U & UPS (R.01)', done: stats.rackChecked },
    { id: 'dhcp', label: 'Aktifkan Layanan DHCP CLI (R.02)', done: stats.dhcpActive },
    { id: 'p1', label: 'Sambungkan Kabel Cat6 PC-01 (R.07)', done: stats.port1Connected },
    { id: 'p2', label: 'Sambungkan Kabel Cat6 PC-02 (R.08)', done: stats.port2Connected },
    { id: 'tidy', label: 'Rapikan Kabel Koridor ke Cable Tray', done: stats.cablesTidied },
    { id: 'ap', label: 'Konfigurasi Access Point Wi-Fi (R.09)', done: stats.apConfigured },
    { id: 'rec', label: 'Perbaiki Internet PC Resepsionis (R.06)', done: stats.receptionPcFixed },
    { id: 'os', label: 'Install Ulang Windows & Driver PC Staf (R.07)', done: stats.osReinstalled },
    { id: 'meet', label: 'Perbaiki Wi-Fi Laptop Rapat (R.05)', done: stats.meetingLaptopFixed },
  ];

  const completedTechCount = techChecklist.filter((item) => item.done).length;
  const allTechDone = completedTechCount === techChecklist.length;
  const accuracyPct =
    stats.learningAttemptsCount > 0
      ? Math.round((stats.learningCorrectCount / stats.learningAttemptsCount) * 100)
      : 100;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-3 md:p-4">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl border border-amber-500/40 bg-[#0b1017] p-4 shadow-2xl md:p-6">
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/15 text-amber-300">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="font-mono-tabular text-[11px] uppercase tracking-wider text-amber-400">
                R.15 · Ruang Direktur Utama
              </div>
              <h2 className="mt-0.5 text-base font-semibold text-slate-100 md:text-lg">
                Laporan Penyelesaian Tugas Teknisi IT
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-800 bg-slate-900 p-1.5 text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
            aria-label="Tutup Laporan Bos"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Percakapan 2 Arah: Teknisi IT & Direktur Utama */}
        <div className="mt-3 space-y-2">
          <div className="flex items-start gap-2 rounded-lg border border-sky-500/30 bg-sky-950/20 p-3 text-xs leading-relaxed text-sky-100">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
            <p>
              <span className="font-semibold text-sky-300">Kamu (Teknisi IT):</span>{' '}
              {allTechDone
                ? '“Selamat siang Pak Direktur. Saya melapor bahwa seluruh jaringan gedung — mulai dari Rak Server R.01, layanan DHCP di NOC, kabel LAN, Access Point Wi-Fi, hingga seluruh PC & laptop karyawan — semuanya sudah siap dan beres 100%.”'
                : `“Permisi Pak Direktur, saya melaporkan progres pengecekan saat ini: baru ${completedTechCount} dari ${techChecklist.length} tugas teknis yang sudah beres.”`}
            </p>
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-xs leading-relaxed text-slate-200">
            {allTechDone ? (
              <p>
                <span className="font-semibold text-amber-300">Direktur Utama:</span>{' '}
                “Kerja luar biasa! Syukurlah semuanya sudah siap dan beres sehingga operasional seluruh divisi kembali normal. Silakan serahkan berita acara penyelesaian tugas Anda sekarang.”
              </p>
            ) : (
              <p>
                <span className="font-semibold text-amber-300">Direktur Utama:</span>{' '}
                “Terima kasih laporannya. Karena masih ada kendala jaringan dan PC karyawan yang belum tuntas ({completedTechCount}/9 selesai), mohon selesaikan seluruh daftar tugas terlebih dahulu sebelum saya menandatangani laporan akhir.”
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border border-slate-800 bg-[#070b11] p-2.5 text-xs">
          <div>
            <div className="text-slate-500">Tugas Teknis</div>
            <div
              className={`mt-0.5 font-mono-tabular font-semibold ${
                allTechDone ? 'text-emerald-400' : 'text-amber-300'
              }`}
            >
              {completedTechCount}/{techChecklist.length} Selesai
            </div>
          </div>
          <div>
            <div className="text-slate-500">Akurasi Diagnosa</div>
            <div className="mt-0.5 font-mono-tabular font-semibold text-sky-300">
              {accuracyPct}%
            </div>
          </div>
          <div>
            <div className="text-slate-500">Komunikasi Staf</div>
            <div className="mt-0.5 font-mono-tabular font-semibold text-slate-200">
              {stats.consultedNpcs.length}/{OFFICE_NPC_LIST.length} Staf
            </div>
          </div>
        </div>

        <div className="mt-3 max-h-52 space-y-1.5 overflow-y-auto rounded-lg border border-slate-800/80 bg-[#070b11] p-2.5 text-xs">
          {techChecklist.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2 text-slate-300">
                {item.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                ) : (
                  <Clock className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                )}
                <span className="truncate">{item.label}</span>
              </span>
              <span
                className={`shrink-0 font-mono-tabular text-[10px] font-semibold ${
                  item.done ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {item.done ? 'SELESAI' : 'BELUM'}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:text-white"
          >
            {allTechDone ? 'Kembali' : 'Lanjutkan Tugas'}
          </button>

          {allTechDone && !stats.bossReported && (
            <button
              type="button"
              onClick={onSubmitReport}
              className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg transition-colors hover:bg-amber-300"
            >
              <ClipboardCheck className="h-4 w-4" />
              Serahkan Laporan &amp; Selesaikan Tugas
            </button>
          )}

          {stats.bossReported && (
            <div className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Laporan Sudah Diterima Direktur
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
