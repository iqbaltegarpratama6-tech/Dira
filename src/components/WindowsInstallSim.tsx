import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Cpu,
  HardDrive,
  Monitor,
  RefreshCw,
  ShieldCheck,
  Usb,
} from 'lucide-react';
import { sfx } from '../audio/sfx';

interface WindowsInstallSimProps {
  onPreviewStage: (stage: 'installing') => void;
  onComplete: (firstTryCorrect: number, totalAttempts: number) => void;
  onCancel: () => void;
}

type SetupStage =
  | 'boot_menu'
  | 'language'
  | 'edition_license'
  | 'install_type'
  | 'partitions'
  | 'installing_progress'
  | 'oobe_drivers';

type PartitionId = 'efi' | 'c_sys' | 'd_data';

export const WindowsInstallSim: React.FC<WindowsInstallSimProps> = ({
  onPreviewStage,
  onComplete,
  onCancel,
}) => {
  const [stage, setStage] = useState<SetupStage>('boot_menu');
  const [language, setLanguage] = useState('English (United States)');
  const [timeFormat, setTimeFormat] = useState('Indonesian (Indonesia)');
  const [selectedEdition, setSelectedEdition] = useState<string>('win11_pro');
  const [acceptedLicense, setAcceptedLicense] = useState(false);

  const [selectedPart, setSelectedPart] = useState<PartitionId>('c_sys');
  const [cFormatted, setCFormatted] = useState(false);

  const [installPercent, setInstallPercent] = useState(0);
  const [driversInstalled, setDriversInstalled] = useState<{
    chipset: boolean;
    vga: boolean;
    lan: boolean;
  }>({ chipset: false, vga: false, lan: false });

  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  // Realistic multi-stage installation progress ticker
  useEffect(() => {
    if (stage !== 'installing_progress') return;
    setInstallPercent(0);
    const id = window.setInterval(() => {
      setInstallPercent((prev) => {
        if (prev >= 100) {
          window.clearInterval(id);
          return 100;
        }
        return Math.min(100, prev + 8);
      });
    }, 240);
    return () => window.clearInterval(id);
  }, [stage]);

  useEffect(() => {
    if (stage === 'installing_progress' && installPercent >= 100) {
      const t = window.setTimeout(() => {
        sfx.playLaptopConnected();
        setFeedback({
          ok: true,
          text: 'Instalasi file Windows selesai! Sekarang pasang driver perangkat keras di Device Manager sebelum diserahkan ke karyawan.',
        });
        setStage('oobe_drivers');
      }, 650);
      return () => window.clearTimeout(t);
    }
  }, [stage, installPercent]);

  const handleBootSelect = (choice: 'ssd' | 'usb' | 'pxe') => {
    setAttempts((a) => a + 1);
    if (choice === 'usb') {
      sfx.playCliCommand();
      setFeedback(null);
      setStage('language');
      return;
    }
    sfx.playDrop();
    setMistakes((m) => m + 1);
    setFeedback({
      ok: false,
      text:
        choice === 'ssd'
          ? 'Boot dari SSD internal kembali masuk ke Blue Screen (INACCESSIBLE_BOOT_DEVICE). Pilih USB Installer (UEFI).'
          : 'Tidak ada image OS pada server PXE jaringan lokal. Gunakan USB Flashdisk Installer.',
    });
  };

  const handleInstallType = (kind: 'upgrade' | 'custom') => {
    setAttempts((a) => a + 1);
    if (kind === 'custom') {
      sfx.playCliCommand();
      setFeedback({
        ok: true,
        text: 'Mode Custom dipilih. Sekarang pilih partisi yang tepat untuk instalasi tanpa menghapus data kerja karyawan!',
      });
      setStage('partitions');
      return;
    }
    sfx.playDrop();
    setMistakes((m) => m + 1);
    setFeedback({
      ok: false,
      text: 'Opsi Upgrade hanya bisa dijalankan dari dalam Windows yang menyala normal. Untuk instalasi bersih dari USB, pilih "Custom: Install Windows only (advanced)".',
    });
  };

  const handleFormatPartition = () => {
    setAttempts((a) => a + 1);
    if (selectedPart === 'd_data') {
      sfx.playDrop();
      setMistakes((m) => m + 1);
      setFeedback({
        ok: false,
        text: 'BERBAHAYA! Partisi D: (Data Karyawan) berisi dokumen kerja penting! Jangan pernah memformat partisi data — pilih Partisi System (C:).',
      });
      return;
    }
    if (selectedPart === 'efi') {
      sfx.playDrop();
      setMistakes((m) => m + 1);
      setFeedback({
        ok: false,
        text: 'Partisi EFI System (100 MB) berisi bootloader UEFI. Format hanya Partisi 2: System (C:).',
      });
      return;
    }
    sfx.playCliCommand();
    setCFormatted(true);
    setFeedback({
      ok: true,
      text: 'Partisi 2 (System C:) berhasil diformat bersih! Partisi Data (D:) tetap aman 100%. Klik Next untuk memulai instalasi.',
    });
  };

  const handleStartInstall = () => {
    setAttempts((a) => a + 1);
    if (selectedPart !== 'c_sys') {
      sfx.playDrop();
      setMistakes((m) => m + 1);
      setFeedback({
        ok: false,
        text: 'Pilih Partisi 2: System (C:) sebagai lokasi instalasi Windows!',
      });
      return;
    }
    if (!cFormatted) {
      sfx.playDrop();
      setMistakes((m) => m + 1);
      setFeedback({
        ok: false,
        text: 'Klik "Format" pada Partisi System (C:) terlebih dahulu agar sisa sistem korup bersih sebelum instalasi.',
      });
      return;
    }
    sfx.playLaptopConnected();
    setFeedback(null);
    onPreviewStage('installing');
    setStage('installing_progress');
  };

  const allDriversReady =
    driversInstalled.chipset && driversInstalled.vga && driversInstalled.lan;

  const installAllDrivers = () => {
    sfx.playLaptopConnected();
    setAttempts((a) => a + 1);
    setDriversInstalled({ chipset: true, vga: true, lan: true });
    setFeedback({
      ok: true,
      text: 'Seluruh driver (Chipset, VGA Display, Realtek LAN) terpasang! Tidak ada tanda seru di Device Manager.',
    });
  };

  const finishInstall = () => {
    const total = Math.max(5, attempts);
    const correct = Math.max(1, total - mistakes);
    onComplete(correct, total);
  };

  const stageStepNumber: Record<SetupStage, number> = {
    boot_menu: 1,
    language: 2,
    edition_license: 3,
    install_type: 4,
    partitions: 5,
    installing_progress: 6,
    oobe_drivers: 7,
  };

  return (
    <div className="space-y-3">
      {/* Step Header Strip */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-mono-tabular font-semibold text-sky-300">
          Simulasi Windows Setup (UEFI)
        </span>
        <span className="font-mono-tabular text-slate-400">
          Tahap {stageStepNumber[stage]} / 7
        </span>
      </div>

      {/* Realistic Windows Setup Window */}
      <div className="overflow-hidden rounded-lg border border-slate-700 bg-[#0b101b] shadow-inner">
        {stage === 'boot_menu' && (
          <div className="bg-[#070b14] p-3.5 font-mono-tabular">
            <div className="border-b border-sky-500/40 pb-1.5 text-xs font-semibold text-sky-300">
              UEFI Boot Option Menu (F12)
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Pilih media boot untuk memulai instalasi ulang OS tanpa masuk ke sistem yang BSOD:
            </p>
            <div className="mt-2.5 space-y-1.5">
              <button
                type="button"
                onClick={() => handleBootSelect('ssd')}
                className="flex w-full items-center justify-between rounded border border-slate-800 bg-[#0d1422] px-3 py-2 text-left text-[11px] text-slate-300 hover:border-sky-500/60"
              >
                <span className="flex items-center gap-2">
                  <HardDrive className="h-3.5 w-3.5 text-slate-400" />
                  1. SATA SSD: Windows Boot Manager (Partisi Rusak)
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleBootSelect('usb')}
                className="flex w-full items-center justify-between rounded border border-slate-800 bg-[#0d1422] px-3 py-2 text-left text-[11px] text-slate-100 hover:border-sky-500"
              >
                <span className="flex items-center gap-2">
                  <Usb className="h-3.5 w-3.5 text-sky-400" />
                  2. UEFI: USB Flashdisk Windows 11 Installer
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleBootSelect('pxe')}
                className="flex w-full items-center justify-between rounded border border-slate-800 bg-[#0d1422] px-3 py-2 text-left text-[11px] text-slate-300 hover:border-sky-500/60"
              >
                <span className="flex items-center gap-2">
                  <Monitor className="h-3.5 w-3.5 text-slate-400" />
                  3. IPv4 Network PXE Boot
                </span>
              </button>
            </div>
          </div>
        )}

        {stage === 'language' && (
          <div className="bg-gradient-to-br from-[#1b1145] to-[#12162f] p-4 text-slate-100">
            <div className="text-xs font-semibold text-sky-200">Windows Setup</div>
            <div className="mt-3 space-y-2.5 text-[11px]">
              <div>
                <label className="block text-slate-300">Language to install:</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-1 w-full rounded border border-indigo-400/40 bg-[#0f1328] px-2.5 py-1.5 text-xs text-white"
                >
                  <option>English (United States)</option>
                  <option>Bahasa Indonesia</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300">Time and currency format:</label>
                <select
                  value={timeFormat}
                  onChange={(e) => setTimeFormat(e.target.value)}
                  className="mt-1 w-full rounded border border-indigo-400/40 bg-[#0f1328] px-2.5 py-1.5 text-xs text-white"
                >
                  <option>Indonesian (Indonesia)</option>
                  <option>English (United States)</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    sfx.playCliCommand();
                    setAttempts((a) => a + 1);
                    setStage('edition_license');
                  }}
                  className="rounded bg-sky-500 px-5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-sky-400"
                >
                  Install now
                </button>
              </div>
            </div>
          </div>
        )}

        {stage === 'edition_license' && (
          <div className="bg-gradient-to-br from-[#1b1145] to-[#12162f] p-4 text-slate-100">
            <div className="text-xs font-semibold text-sky-200">
              Select the operating system you want to install
            </div>
            <div className="mt-2.5 space-y-1.5">
              {[
                { id: 'win11_home', name: 'Windows 11 Home', arch: 'x64 · Personal' },
                { id: 'win11_pro', name: 'Windows 11 Pro', arch: 'x64 · Standar Kantor & Domain' },
              ].map((ed) => (
                <button
                  key={ed.id}
                  type="button"
                  onClick={() => setSelectedEdition(ed.id)}
                  className={`flex w-full items-center justify-between rounded border px-3 py-2 text-left text-[11px] ${
                    selectedEdition === ed.id
                      ? 'border-sky-400 bg-sky-500/20 text-white'
                      : 'border-indigo-400/25 bg-[#0f1328]/70 text-slate-300'
                  }`}
                >
                  <span className="font-semibold">{ed.name}</span>
                  <span className="text-[10px] text-slate-300">{ed.arch}</span>
                </button>
              ))}
            </div>

            <label className="mt-3 flex cursor-pointer items-center gap-2 text-[11px] text-slate-200">
              <input
                type="checkbox"
                checked={acceptedLicense}
                onChange={(e) => setAcceptedLicense(e.target.checked)}
                className="h-3.5 w-3.5 accent-sky-500"
              />
              <span>I accept the Microsoft Software License Terms</span>
            </label>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                disabled={!acceptedLicense}
                onClick={() => {
                  setAttempts((a) => a + 1);
                  if (selectedEdition !== 'win11_pro') {
                    sfx.playDrop();
                    setMistakes((m) => m + 1);
                    setFeedback({
                      ok: false,
                      text: 'PC kantor membutuhkan fitur Domain Join & BitLocker. Pilih "Windows 11 Pro".',
                    });
                    return;
                  }
                  sfx.playCliCommand();
                  setFeedback(null);
                  setStage('install_type');
                }}
                className="rounded bg-sky-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {stage === 'install_type' && (
          <div className="bg-gradient-to-br from-[#1b1145] to-[#12162f] p-4 text-slate-100">
            <div className="text-xs font-semibold text-sky-200">
              Which type of installation do you want?
            </div>
            <div className="mt-2.5 space-y-2">
              <button
                type="button"
                onClick={() => handleInstallType('upgrade')}
                className="w-full rounded border border-indigo-400/25 bg-[#0f1328]/80 p-3 text-left transition-colors hover:border-sky-400/50"
              >
                <div className="text-xs font-semibold text-slate-200">
                  Upgrade: Install Windows and keep files, settings, and applications
                </div>
                <div className="mt-0.5 text-[10px] text-slate-400">
                  Only available when running an existing healthy Windows desktop.
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleInstallType('custom')}
                className="w-full rounded border border-indigo-400/40 bg-[#0f1328] p-3 text-left transition-colors hover:border-sky-400"
              >
                <div className="text-xs font-semibold text-sky-200">
                  Custom: Install Windows only (advanced)
                </div>
                <div className="mt-0.5 text-[10px] text-slate-300">
                  Memilih partisi drive secara manual untuk instalasi bersih dari USB Installer.
                </div>
              </button>
            </div>
          </div>
        )}

        {stage === 'partitions' && (
          <div className="bg-gradient-to-br from-[#1b1145] to-[#12162f] p-3.5 text-slate-100">
            <div className="text-xs font-semibold text-sky-200">
              Where do you want to install Windows?
            </div>
            <div className="mt-2 space-y-1">
              {[
                {
                  id: 'efi' as PartitionId,
                  name: 'Drive 0 Partition 1: EFI System',
                  size: '100 MB',
                  free: '68 MB',
                  type: 'System',
                },
                {
                  id: 'c_sys' as PartitionId,
                  name: 'Drive 0 Partition 2: System (C:)',
                  size: '120.0 GB',
                  free: cFormatted ? '119.8 GB (Formatted)' : '24.3 GB (OS Rusak)',
                  type: 'Primary',
                },
                {
                  id: 'd_data' as PartitionId,
                  name: 'Drive 0 Partition 3: Data Karyawan (D:)',
                  size: '380.0 GB',
                  free: '145.0 GB (File Kerja)',
                  type: 'Primary',
                },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPart(p.id);
                    setFeedback(null);
                  }}
                  className={`flex w-full items-center justify-between rounded border px-2.5 py-2 text-left text-[11px] ${
                    selectedPart === p.id
                      ? 'border-sky-400 bg-sky-500/25 text-white'
                      : 'border-indigo-400/25 bg-[#0f1328]/80 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="font-mono-tabular text-[10px] text-slate-300">
                      Total: {p.size} · Free: {p.free}
                    </div>
                  </div>
                  <span className="font-mono-tabular text-[10px] text-slate-400">{p.type}</span>
                </button>
              ))}
            </div>

            <div className="mt-2.5 flex items-center justify-between border-t border-indigo-400/25 pt-2.5">
              <button
                type="button"
                onClick={handleFormatPartition}
                className="inline-flex items-center gap-1 rounded border border-amber-400/50 bg-amber-500/15 px-3 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/25"
              >
                <AlertTriangle className="h-3 w-3" />
                Format Partisi Terpilih
              </button>

              <button
                type="button"
                onClick={handleStartInstall}
                className="rounded bg-sky-500 px-4 py-1 text-xs font-semibold text-slate-950 hover:bg-sky-400"
              >
                Next (Install)
              </button>
            </div>
          </div>
        )}

        {stage === 'installing_progress' && (
          <div className="bg-gradient-to-br from-[#1b1145] to-[#12162f] p-4 text-slate-100">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-sky-200">Installing Windows 11 Pro...</div>
              <span className="font-mono-tabular text-xs font-bold text-sky-300">
                {installPercent}%
              </span>
            </div>

            <div className="mt-2 h-2 w-full overflow-hidden rounded bg-[#0a0d1d]">
              <div
                className="h-full bg-sky-400 transition-all duration-200"
                style={{ width: `${installPercent}%` }}
              />
            </div>

            <div className="mt-3 space-y-1.5 font-mono-tabular text-[11px]">
              {[
                { label: 'Copying Windows files', threshold: 10 },
                { label: 'Getting files ready for installation', threshold: 55 },
                { label: 'Installing features', threshold: 75 },
                { label: 'Installing updates', threshold: 90 },
                { label: 'Finishing up', threshold: 100 },
              ].map((item) => {
                const done = installPercent >= item.threshold;
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 ${
                      done ? 'text-emerald-300' : 'text-slate-300'
                    }`}
                  >
                    {done ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <RefreshCw className="h-3 w-3 text-sky-400" />
                    )}
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {stage === 'oobe_drivers' && (
          <div className="bg-[#0d1420] p-3.5 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
                <Cpu className="h-4 w-4" />
                <span>Device Manager · Instalasi Driver Pasca-Setup</span>
              </div>
              <button
                type="button"
                onClick={installAllDrivers}
                disabled={allDriversReady}
                className="rounded bg-sky-500 px-2.5 py-1 text-[10px] font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-40"
              >
                Install Semua Driver
              </button>
            </div>

            <div className="mt-2.5 space-y-1.5 text-[11px]">
              {[
                {
                  key: 'chipset' as const,
                  name: 'Intel Chipset & Storage Controller',
                  ready: driversInstalled.chipset,
                },
                {
                  key: 'vga' as const,
                  name: 'Graphics Display Adapter (WDDM)',
                  ready: driversInstalled.vga,
                },
                {
                  key: 'lan' as const,
                  name: 'Realtek PCIe GbE Network Driver',
                  ready: driversInstalled.lan,
                },
              ].map((drv) => (
                <div
                  key={drv.key}
                  className="flex items-center justify-between rounded border border-slate-800 bg-[#121b2b] px-2.5 py-2"
                >
                  <div>
                    <div className="font-medium text-slate-200">{drv.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {drv.ready ? 'Driver aktif & optimal' : 'Driver belum terpasang (!)'}
                    </div>
                  </div>
                  {drv.ready ? (
                    <span className="inline-flex items-center gap-1 font-mono-tabular text-[10px] text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5" /> OK
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        sfx.playCliCommand();
                        setAttempts((a) => a + 1);
                        setDriversInstalled((d) => ({ ...d, [drv.key]: true }));
                      }}
                      className="rounded border border-sky-500/60 bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-300 hover:bg-sky-500/25"
                    >
                      Install Driver
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-start gap-2 rounded-lg border p-2.5 text-[11px] leading-relaxed ${
            feedback.ok
              ? 'border-emerald-500/40 bg-emerald-950/25 text-emerald-200'
              : 'border-amber-500/40 bg-amber-950/25 text-amber-200'
          }`}
        >
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={finishInstall}
          disabled={stage !== 'oobe_drivers' || !allDriversReady}
          className="inline-flex items-center gap-1.5 rounded-md bg-sky-500 px-4 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Selesai &amp; Boot ke Desktop
        </button>
      </div>
    </div>
  );
};
