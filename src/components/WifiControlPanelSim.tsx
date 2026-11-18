import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Globe,
  HardDrive,
  Laptop,
  Lock,
  RefreshCw,
  Shield,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { sfx } from '../audio/sfx';

interface WifiControlPanelSimProps {
  wifiSsid: string;
  wifiPassword: string;
  onPreviewStage?: (stage: 'enabling') => void;
  onComplete: (firstTryCorrect: number, totalAttempts: number) => void;
  onCancel: () => void;
}

type CpView = 'home' | 'network_internet' | 'sharing_center' | 'adapters';
type AdapterId = 'ethernet' | 'wifi' | 'bluetooth';

export const WifiControlPanelSim: React.FC<WifiControlPanelSimProps> = ({
  wifiSsid,
  wifiPassword,
  onPreviewStage,
  onComplete,
  onCancel,
}) => {
  const [view, setView] = useState<CpView>('home');
  const [selectedAdapter, setSelectedAdapter] = useState<AdapterId>('wifi');
  const [wifiEnabled, setWifiEnabled] = useState(false);
  const [driverUpdated, setDriverUpdated] = useState(false);
  const [wifiPanelOpen, setWifiPanelOpen] = useState(false);
  const [selectedSsid, setSelectedSsid] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [connectedSsid, setConnectedSsid] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const handleWrongCategory = (name: string) => {
    sfx.playDrop();
    setAttempts((a) => a + 1);
    setMistakes((m) => m + 1);
    setFeedback({
      ok: false,
      text: `Menu "${name}" bukan untuk pengaturan kartu Wi-Fi. Buka kategori "Network and Internet" untuk mengakses Network Connections.`,
    });
  };

  const handleEnableAdapter = () => {
    setAttempts((a) => a + 1);
    if (selectedAdapter !== 'wifi') {
      sfx.playDrop();
      setMistakes((m) => m + 1);
      setFeedback({
        ok: false,
        text: `Adapter ${selectedAdapter === 'ethernet' ? 'Ethernet' : 'Bluetooth'} tidak memperbaiki Wi-Fi laptop. Pilih adapter "Wi-Fi (Intel Wi-Fi 6 AX201)".`,
      });
      return;
    }
    if (wifiEnabled) return;
    sfx.playLaptopConnected();
    setWifiEnabled(true);
    onPreviewStage?.('enabling');
    setFeedback({
      ok: true,
      text: 'Adapter Wi-Fi diaktifkan! Langkah berikutnya: perbarui driver agar sinyal stabil, lalu sambungkan ke Wi-Fi kantor.',
    });
  };

  const handleUpdateDriver = () => {
    setAttempts((a) => a + 1);
    if (selectedAdapter !== 'wifi') {
      sfx.playDrop();
      setMistakes((m) => m + 1);
      setFeedback({
        ok: false,
        text: 'Pilih adapter Wi-Fi terlebih dahulu sebelum memperbarui driver nirkabel.',
      });
      return;
    }
    if (!wifiEnabled) {
      sfx.playDrop();
      setMistakes((m) => m + 1);
      setFeedback({
        ok: false,
        text: 'Aktifkan (Enable) adapter Wi-Fi terlebih dahulu sebelum memperbarui drivernya.',
      });
      return;
    }
    sfx.playCliCommand();
    setDriverUpdated(true);
    setFeedback({
      ok: true,
      text: 'Driver Intel(R) Wi-Fi 6 AX201 v23.40 berhasil diperbarui! Sekarang buka daftar jaringan Wi-Fi dan sambungkan ke SSID kantor.',
    });
  };

  const handleConnectWifi = () => {
    setAttempts((a) => a + 1);
    if (!selectedSsid) return;

    if (selectedSsid === 'Guest-Open-Free') {
      sfx.playDrop();
      setMistakes((m) => m + 1);
      setFeedback({
        ok: false,
        text: 'Tidak aman! Wi-Fi "Guest-Open-Free" tidak terenkripsi dan terisolasi dari server presentasi kantor. Pilih SSID kantor yang aman (WPA3).',
      });
      return;
    }

    if (selectedSsid === 'Warehouse-2.4G-Weak') {
      sfx.playDrop();
      setMistakes((m) => m + 1);
      setFeedback({
        ok: false,
        text: 'Sinyal lemah (1 bar, 2.4 GHz penuh interferensi). Gunakan SSID utama 5 GHz kantor yang kuat dan aman.',
      });
      return;
    }

    if (passwordInput.trim() !== wifiPassword) {
      sfx.playDrop();
      setMistakes((m) => m + 1);
      setFeedback({
        ok: false,
        text: `Kata sandi Wi-Fi belum cocok. Gunakan sandi kantor: ${wifiPassword}`,
      });
      return;
    }

    sfx.playLaptopConnected();
    setConnectedSsid(selectedSsid);
    setFeedback({
      ok: true,
      text: `Terhubung ke ${selectedSsid} (WPA3-Personal · 866 Mbps)! Laptop rapat siap digunakan.`,
    });
  };

  const finishCase = () => {
    const total = Math.max(3, attempts);
    const correct = Math.max(1, total - mistakes);
    onComplete(correct, total);
  };

  return (
    <div className="space-y-3">
      {/* Control Panel Simulated Window */}
      <div className="overflow-hidden rounded-lg border border-slate-700 bg-[#0d1420] shadow-inner">
        {/* Window Title Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#152033] px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
            <Laptop className="h-3.5 w-3.5 text-sky-400" />
            <span>Control Panel</span>
          </div>
          <span className="font-mono-tabular text-[10px] text-slate-400">
            {connectedSsid ? 'Wi-Fi: Connected' : wifiEnabled ? 'Wi-Fi: Enabled' : 'Wi-Fi: Disabled'}
          </span>
        </div>

        {/* Address Breadcrumb Bar */}
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-800 bg-[#0a1019] px-3 py-1.5 font-mono-tabular text-[10px] text-slate-400">
          <button
            type="button"
            onClick={() => setView('home')}
            className="hover:text-sky-300"
          >
            Control Panel
          </button>
          {view !== 'home' && (
            <>
              <ChevronRight className="h-3 w-3 text-slate-600" />
              <button
                type="button"
                onClick={() => setView('network_internet')}
                className="hover:text-sky-300"
              >
                Network and Internet
              </button>
            </>
          )}
          {(view === 'sharing_center' || view === 'adapters') && (
            <>
              <ChevronRight className="h-3 w-3 text-slate-600" />
              <button
                type="button"
                onClick={() => setView('sharing_center')}
                className="hover:text-sky-300"
              >
                Network and Sharing Center
              </button>
            </>
          )}
          {view === 'adapters' && (
            <>
              <ChevronRight className="h-3 w-3 text-slate-600" />
              <span className="text-sky-300">Network Connections</span>
            </>
          )}
        </div>

        {/* View Content */}
        <div className="p-3">
          {view === 'home' && (
            <div className="space-y-2.5">
              <div className="text-[11px] font-medium text-slate-300">
                Adjust your computer&apos;s settings
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleWrongCategory('System and Security')}
                  className="flex items-start gap-2 rounded border border-slate-800 bg-[#111a29] p-2 text-left transition-colors hover:border-slate-700"
                >
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <div>
                    <div className="text-[11px] font-semibold text-slate-200">System and Security</div>
                    <div className="text-[10px] text-slate-500">Firewall, Windows Update</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sfx.playCliCommand();
                    setFeedback(null);
                    setView('network_internet');
                  }}
                  className="flex items-start gap-2 rounded border border-slate-700 bg-[#111a29] p-2 text-left transition-colors hover:border-sky-500/70 hover:bg-sky-950/20"
                >
                  <Globe className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
                  <div>
                    <div className="text-[11px] font-semibold text-sky-200">Network and Internet</div>
                    <div className="text-[10px] text-slate-400">View network status &amp; adapters</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleWrongCategory('Hardware and Sound')}
                  className="flex items-start gap-2 rounded border border-slate-800 bg-[#111a29] p-2 text-left transition-colors hover:border-slate-700"
                >
                  <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <div>
                    <div className="text-[11px] font-semibold text-slate-200">Hardware and Sound</div>
                    <div className="text-[10px] text-slate-500">Printers, mouse, audio</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleWrongCategory('User Accounts')}
                  className="flex items-start gap-2 rounded border border-slate-800 bg-[#111a29] p-2 text-left transition-colors hover:border-slate-700"
                >
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                  <div>
                    <div className="text-[11px] font-semibold text-slate-200">User Accounts</div>
                    <div className="text-[10px] text-slate-500">Change account type</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {view === 'network_internet' && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  sfx.playCliCommand();
                  setView('sharing_center');
                }}
                className="flex w-full items-center justify-between rounded border border-slate-700 bg-[#111a29] px-3 py-2.5 text-left transition-colors hover:border-sky-500/70"
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="h-4 w-4 text-sky-400" />
                  <div>
                    <div className="text-xs font-semibold text-sky-200">
                      Network and Sharing Center
                    </div>
                    <div className="text-[10px] text-slate-400">
                      View network status, connect to a network, change adapter settings
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          )}

          {view === 'sharing_center' && (
            <div className="space-y-2.5">
              <div className="rounded border border-slate-800 bg-[#0a1019] p-2.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-300">
                  <span>LAPTOP-RAPAT</span>
                  <span className="text-rose-400">
                    {connectedSsid ? 'Internet access' : 'Not connected'}
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-slate-500">
                  Status: Tidak ada koneksi Wi-Fi aktif ditemukan pada jaringan.
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Control Panel Tasks
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sfx.playCliCommand();
                    setView('adapters');
                  }}
                  className="flex w-full items-center justify-between rounded border border-sky-500/50 bg-sky-950/25 px-3 py-2 text-left text-xs font-medium text-sky-200 transition-colors hover:bg-sky-950/45"
                >
                  <span>Change adapter settings (Network Connections)</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {view === 'adapters' && (
            <div className="space-y-2.5">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-1.5 rounded border border-slate-800 bg-[#0a1019] p-1.5">
                <button
                  type="button"
                  onClick={handleEnableAdapter}
                  disabled={selectedAdapter === 'wifi' && wifiEnabled}
                  className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-semibold text-slate-200 transition-colors hover:border-sky-500 hover:text-sky-300 disabled:opacity-40"
                >
                  Enable this network device
                </button>
                <button
                  type="button"
                  onClick={handleUpdateDriver}
                  disabled={selectedAdapter === 'wifi' && driverUpdated}
                  className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-semibold text-slate-200 transition-colors hover:border-sky-500 hover:text-sky-300 disabled:opacity-40"
                >
                  <RefreshCw className="h-3 w-3" />
                  Update Driver
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!wifiEnabled) {
                      setFeedback({
                        ok: false,
                        text: 'Aktifkan dulu adapter Wi-Fi sebelum membuka daftar jaringan nirkabel.',
                      });
                      return;
                    }
                    setWifiPanelOpen((o) => !o);
                  }}
                  className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-semibold transition-colors ${
                    wifiEnabled
                      ? 'border-sky-500/60 bg-sky-500/15 text-sky-200 hover:bg-sky-500/25'
                      : 'border-slate-800 bg-slate-900 text-slate-500'
                  }`}
                >
                  <Wifi className="h-3 w-3" />
                  Connect / Pilih Wi-Fi
                </button>
              </div>

              {/* Adapters List */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedAdapter('ethernet')}
                  className={`flex w-full items-center justify-between rounded border px-2.5 py-2 text-left text-[11px] ${
                    selectedAdapter === 'ethernet'
                      ? 'border-sky-500 bg-sky-950/30'
                      : 'border-slate-800 bg-[#111a29]'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-200">Ethernet</div>
                    <div className="text-[10px] text-slate-400">
                      Realtek PCIe GbE · Network cable unplugged
                    </div>
                  </div>
                  <span className="font-mono-tabular text-[10px] text-rose-400">Unplugged</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAdapter('wifi')}
                  className={`flex w-full items-center justify-between rounded border px-2.5 py-2 text-left text-[11px] ${
                    selectedAdapter === 'wifi'
                      ? 'border-sky-500 bg-sky-950/30'
                      : 'border-slate-800 bg-[#111a29]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {wifiEnabled ? (
                      <Wifi className="h-4 w-4 text-sky-400" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-slate-500" />
                    )}
                    <div>
                      <div className="font-semibold text-slate-100">Wi-Fi</div>
                      <div className="text-[10px] text-slate-400">
                        Intel(R) Wi-Fi 6 AX201 ·{' '}
                        {driverUpdated ? 'Driver v23.40 (OK)' : 'Driver v18.1 (Perlu Update)'}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`font-mono-tabular text-[10px] font-semibold ${
                      connectedSsid
                        ? 'text-emerald-400'
                        : wifiEnabled
                          ? 'text-sky-300'
                          : 'text-amber-400'
                    }`}
                  >
                    {connectedSsid ? connectedSsid : wifiEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAdapter('bluetooth')}
                  className={`flex w-full items-center justify-between rounded border px-2.5 py-2 text-left text-[11px] ${
                    selectedAdapter === 'bluetooth'
                      ? 'border-sky-500 bg-sky-950/30'
                      : 'border-slate-800 bg-[#111a29]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-slate-500" />
                    <div>
                      <div className="font-semibold text-slate-300">Bluetooth Network Connection</div>
                      <div className="text-[10px] text-slate-500">Bluetooth Device (PAN)</div>
                    </div>
                  </div>
                  <span className="font-mono-tabular text-[10px] text-slate-500">Not connected</span>
                </button>
              </div>

              {/* Windows Wi-Fi Quick Connect Drawer */}
              {wifiPanelOpen && wifiEnabled && !connectedSsid && (
                <div className="space-y-2 rounded-lg border border-sky-500/40 bg-[#0a111c] p-2.5">
                  <div className="text-[11px] font-semibold text-sky-300">
                    Available Wi-Fi Networks
                  </div>
                  {[
                    {
                      ssid: wifiSsid,
                      sec: 'WPA3-Personal · 5 GHz',
                      signal: 'Full (5/5)',
                    },
                    {
                      ssid: 'Warehouse-2.4G-Weak',
                      sec: 'WPA2 · 2.4 GHz',
                      signal: 'Lemah (1/5)',
                    },
                    {
                      ssid: 'Guest-Open-Free',
                      sec: 'Open (Tanpa Password)',
                      signal: '4/5',
                    },
                  ].map((net) => (
                    <div
                      key={net.ssid}
                      className={`rounded border p-2 text-[11px] ${
                        selectedSsid === net.ssid
                          ? 'border-sky-500 bg-sky-950/30'
                          : 'border-slate-800 bg-[#111927]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSsid(net.ssid);
                          setFeedback(null);
                        }}
                        className="flex w-full items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Wifi className="h-3.5 w-3.5 text-sky-400" />
                          <div>
                            <div className="font-semibold text-slate-100">{net.ssid}</div>
                            <div className="text-[10px] text-slate-400">{net.sec}</div>
                          </div>
                        </div>
                        <span className="font-mono-tabular text-[10px] text-slate-400">
                          {net.signal}
                        </span>
                      </button>

                      {selectedSsid === net.ssid && net.ssid === wifiSsid && (
                        <div className="mt-2 space-y-1.5 border-t border-slate-800 pt-2">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <Lock className="h-3 w-3" /> Security key:
                            </span>
                            <button
                              type="button"
                              onClick={() => setPasswordInput(wifiPassword)}
                              className="text-sky-400 hover:underline"
                            >
                              Isi sandi kantor ({wifiPassword})
                            </button>
                          </div>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={passwordInput}
                              onChange={(e) => setPasswordInput(e.target.value)}
                              placeholder="Masukkan password Wi-Fi..."
                              className="flex-1 rounded border border-slate-700 bg-[#070b12] px-2 py-1 font-mono-tabular text-[11px] text-slate-100 outline-none focus:border-sky-500"
                            />
                            <button
                              type="button"
                              onClick={handleConnectWifi}
                              className="rounded bg-sky-500 px-3 py-1 text-[11px] font-semibold text-slate-950 hover:bg-sky-400"
                            >
                              Connect
                            </button>
                          </div>
                        </div>
                      )}

                      {selectedSsid === net.ssid && net.ssid !== wifiSsid && (
                        <div className="mt-2 flex justify-end border-t border-slate-800 pt-2">
                          <button
                            type="button"
                            onClick={handleConnectWifi}
                            className="rounded bg-slate-700 px-3 py-1 text-[11px] font-semibold text-slate-100 hover:bg-slate-600"
                          >
                            Connect
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Live Feedback */}
      {feedback && (
        <div
          className={`flex items-start gap-2 rounded-lg border p-2.5 text-[11px] leading-relaxed ${
            feedback.ok
              ? 'border-emerald-500/40 bg-emerald-950/25 text-emerald-200'
              : 'border-amber-500/40 bg-amber-950/25 text-amber-200'
          }`}
        >
          {feedback.ok ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Checklist Progress Strip */}
      <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-slate-800 bg-[#070a0f] p-2 text-[10px]">
        <div className={wifiEnabled ? 'text-emerald-400' : 'text-slate-400'}>
          {wifiEnabled ? '✓' : '○'} Enable Wi-Fi
        </div>
        <div className={driverUpdated ? 'text-emerald-400' : 'text-slate-400'}>
          {driverUpdated ? '✓' : '○'} Update Driver
        </div>
        <div className={connectedSsid ? 'text-emerald-400' : 'text-slate-400'}>
          {connectedSsid ? '✓' : '○'} Connect WPA3
        </div>
      </div>

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
          onClick={finishCase}
          disabled={!connectedSsid || !driverUpdated}
          className="inline-flex items-center gap-1.5 rounded-md bg-sky-500 px-4 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Selesaikan Perbaikan Wi-Fi
        </button>
      </div>
    </div>
  );
};
