import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Check,
  Eye,
  EyeOff,
  Globe,
  RotateCcw,
  Shield,
  Terminal,
  Wifi,
  X,
} from 'lucide-react';
import { sfx } from '../audio/sfx';
import { DEFAULT_INTERNET_SETTINGS, InternetSettings } from '../types/game';
import { CliAndInternetUpdate } from './ITOfficeSimulationCanvas';

export type NetworkModalTab = 'internet' | 'cli';

interface NetworkCLIModalProps {
  open: boolean;
  initialTab?: NetworkModalTab;
  vlan10Active: boolean;
  vlan20Active: boolean;
  dhcpActive: boolean;
  apConfigured: boolean;
  rackChecked: boolean;
  port1Connected: boolean;
  port2Connected: boolean;
  internetSettings: InternetSettings;
  onClose: () => void;
  onApplyConfig: (updates: CliAndInternetUpdate) => void;
}

interface SpeedTestResult {
  ok: boolean;
  summary: string;
  pingMs: number | null;
  jitterMs: number | null;
  downloadMbps: number | null;
  uploadMbps: number | null;
  dnsResolved: string;
}

const DNS_PRESETS = [
  { label: 'Cloudflare', primary: '1.1.1.1', secondary: '1.0.0.1' },
  { label: 'Google DNS', primary: '8.8.8.8', secondary: '8.8.4.4' },
  { label: 'Quad9', primary: '9.9.9.9', secondary: '149.112.112.112' },
];

const BANDWIDTH_OPTIONS = [
  { value: 0, label: '1 Gbps (Penuh)' },
  { value: 100, label: '100 Mbps' },
  { value: 50, label: '50 Mbps' },
  { value: 25, label: '25 Mbps' },
];

export const NetworkCLIModal: React.FC<NetworkCLIModalProps> = ({
  open,
  initialTab = 'internet',
  vlan10Active,
  vlan20Active,
  dhcpActive,
  apConfigured,
  rackChecked,
  port1Connected,
  port2Connected,
  internetSettings,
  onClose,
  onApplyConfig,
}) => {
  const [activeTab, setActiveTab] = useState<NetworkModalTab>(initialTab);
  const [draft, setDraft] = useState<InternetSettings>(internetSettings);
  const [showWifiPass, setShowWifiPass] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [testingSpeed, setTestingSpeed] = useState(false);
  const [testResult, setTestResult] = useState<SpeedTestResult | null>(null);

  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<string[]>([
    'Connected to SW-CORE-01 (10.0.0.1) via SSHv2',
    'SW-CORE-01(config)#',
    'Ketik "dhcp", "wifi on", "dns 1.1.1.1", "ping 8.8.8.8", atau "help".',
  ]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      setDraft({
        ...internetSettings,
        dhcpEnabled: dhcpActive,
        vlan10Enabled: vlan10Active,
        vlan20Enabled: vlan20Active,
        wifiEnabled: apConfigured,
      });
      setSavedFeedback(false);
      setTestResult(null);
    }
  }, [open, initialTab, internetSettings, dhcpActive, vlan10Active, vlan20Active, apConfigured]);

  useEffect(() => {
    if (open && activeTab === 'cli') {
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open, activeTab]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  if (!open) return null;

  const appendLog = (line: string) => {
    setLogs((prev) => [...prev.slice(-28), line]);
  };

  const applyDraftNow = (next: InternetSettings, keepOpen = true) => {
    setDraft(next);
    onApplyConfig({ internetSettings: next });
    sfx.playLaptopConnected();
    setSavedFeedback(true);
    window.setTimeout(() => setSavedFeedback(false), 1800);
    if (!keepOpen) {
      onClose();
    }
  };

  const runConnectionDiagnostics = () => {
    sfx.playCliCommand();
    setTestingSpeed(true);
    setTestResult(null);

    window.setTimeout(() => {
      setTestingSpeed(false);
      if (!draft.wanConnected) {
        setTestResult({
          ok: false,
          summary: 'Internet WAN dalam kondisi nonaktif. Aktifkan Internet Gateway (WAN / NAT) terlebih dahulu.',
          pingMs: null,
          jitterMs: null,
          downloadMbps: null,
          uploadMbps: null,
          dnsResolved: 'Gagal (WAN Offline)',
        });
        sfx.playDrop();
        return;
      }

      if (!draft.dhcpEnabled) {
        setTestResult({
          ok: false,
          summary: 'DHCP Server masih nonaktif. Klien kantor belum mendapatkan IP otomatis.',
          pingMs: null,
          jitterMs: null,
          downloadMbps: null,
          uploadMbps: null,
          dnsResolved: `Menunggu DHCP (${draft.dnsPrimary})`,
        });
        sfx.playDrop();
        return;
      }

      const basePing =
        draft.dnsPrimary === '1.1.1.1'
          ? 9
          : draft.dnsPrimary === '8.8.8.8'
            ? 14
            : draft.dnsPrimary === '9.9.9.9'
              ? 18
              : 22;
      const pingMs = rackChecked ? basePing : basePing + 14;
      const jitterMs = rackChecked ? 2 : 6;
      const rawDown = draft.bandwidthLimitMbps > 0 ? draft.bandwidthLimitMbps * 0.94 : 486.4;
      const rawUp = draft.bandwidthLimitMbps > 0 ? draft.bandwidthLimitMbps * 0.78 : 314.2;

      setTestResult({
        ok: true,
        summary: rackChecked
          ? `Koneksi internet aktif via Gateway ${draft.gatewayIp} · Uplink Server R.01 Terverifikasi`
          : `Gateway ${draft.gatewayIp} aktif (Tip: Inspeksi Rak Server di R.01 untuk latensi optimal)`,
        pingMs,
        jitterMs,
        downloadMbps: Number(rawDown.toFixed(1)),
        uploadMbps: Number(rawUp.toFixed(1)),
        dnsResolved: `OK (${draft.dnsPrimary})`,
      });
      sfx.playLaptopConnected();
    }, 550);
  };

  const executeCommand = (raw: string) => {
    const trimmed = raw.trim();
    const cmd = trimmed.toLowerCase();
    if (!cmd) return;

    sfx.playCliCommand();
    appendLog(`SW-CORE-01(config)# ${trimmed}`);

    if (cmd === 'dhcp') {
      const next = { ...draft, dhcpEnabled: true };
      setDraft(next);
      onApplyConfig({ internetSettings: next });
      appendLog(`[OK] DHCP service enabled — Pool (${next.dhcpPoolRange}) active.`);
      sfx.playLaptopConnected();
    } else if (cmd === 'vlan 10' || cmd === 'vlan10') {
      const next = { ...draft, vlan10Enabled: true };
      setDraft(next);
      onApplyConfig({ internetSettings: next });
      appendLog('[OK] VLAN 10 (WORKSTATION) active on Gi0/1-Gi0/2.');
      sfx.playLaptopConnected();
    } else if (cmd === 'vlan 20' || cmd === 'vlan20') {
      const next = { ...draft, vlan20Enabled: true };
      setDraft(next);
      onApplyConfig({ internetSettings: next });
      appendLog('[OK] VLAN 20 (GUEST) isolated.');
      sfx.playLaptopConnected();
    } else if (cmd === 'wifi on' || cmd === 'ap on') {
      const next = { ...draft, wifiEnabled: true };
      setDraft(next);
      onApplyConfig({ internetSettings: next });
      appendLog(`[OK] Wi-Fi AP Broadcast enabled — SSID "${next.wifiSsid}" (${next.wifiBand}).`);
      sfx.playLaptopConnected();
    } else if (cmd === 'wifi off' || cmd === 'ap off') {
      const next = { ...draft, wifiEnabled: false };
      setDraft(next);
      onApplyConfig({ internetSettings: next });
      appendLog('[OK] Wi-Fi AP Broadcast disabled.');
    } else if (cmd.startsWith('dns ')) {
      const nextDns = trimmed.slice(4).trim();
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(nextDns)) {
        const next = { ...draft, dnsPrimary: nextDns };
        setDraft(next);
        onApplyConfig({ internetSettings: next });
        appendLog(`[OK] Primary DNS server updated -> ${nextDns}`);
        sfx.playLaptopConnected();
      } else {
        appendLog('% Format IP DNS tidak valid. Contoh: dns 1.1.1.1');
      }
    } else if (cmd.startsWith('ssid ')) {
      const nextSsid = trimmed.slice(5).trim();
      if (nextSsid.length >= 2) {
        const next = { ...draft, wifiSsid: nextSsid, wifiEnabled: true };
        setDraft(next);
        onApplyConfig({ internetSettings: next });
        appendLog(`[OK] Wi-Fi SSID updated -> "${nextSsid}" (Broadcast ON)`);
        sfx.playLaptopConnected();
      } else {
        appendLog('% Nama SSID minimal 2 karakter.');
      }
    } else if (cmd.startsWith('ping')) {
      const host = trimmed.split(/\s+/)[1] || draft.dnsPrimary;
      if (!draft.wanConnected || !draft.dhcpEnabled) {
        appendLog(`Pinging ${host}... Request timed out (Pastikan WAN & DHCP aktif).`);
      } else {
        const ms = rackChecked ? 9 : 23;
        appendLog(`Reply from ${host}: bytes=32 time=${ms}ms TTL=57`);
        appendLog(`Ping statistics: Sent = 1, Received = 1 (0% loss)`);
      }
    } else if (cmd === 'ipconfig' || cmd === 'show status' || cmd === 'status') {
      appendLog(
        `Gateway: ${draft.gatewayIp} | Mask: ${draft.subnetMask} | DNS: ${draft.dnsPrimary}`
      );
      appendLog(
        `WAN: ${draft.wanConnected ? 'UP' : 'DOWN'} | DHCP: ${draft.dhcpEnabled ? 'ACTIVE' : 'OFFLINE'} | Wi-Fi: ${draft.wifiEnabled ? draft.wifiSsid : 'OFF'} | VLAN10: ${draft.vlan10Enabled ? 'UP' : 'DOWN'} | VLAN20: ${draft.vlan20Enabled ? 'UP' : 'DOWN'}`
      );
    } else if (cmd === 'clear') {
      setLogs(['SW-CORE-01(config)#']);
    } else if (cmd === 'exit' || cmd === 'quit') {
      onClose();
    } else if (cmd === 'help') {
      appendLog(
        'Perintah: dhcp | vlan 10 | vlan 20 | wifi on/off | dns <ip> | ssid <nama> | ping <ip> | ipconfig | clear | exit'
      );
    } else {
      appendLog(`% Unknown command "${trimmed}". Ketik "help" untuk daftar perintah.`);
    }
    setInput('');
  };

  const ToggleRow: React.FC<{
    label: string;
    detail: string;
    checked: boolean;
    onChange: (val: boolean) => void;
  }> = ({ label, detail, checked, onChange }) => (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <div className="text-xs font-medium text-slate-100">{label}</div>
        <div className="text-[11px] text-slate-400">{detail}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${
          checked
            ? 'border-sky-400 bg-sky-500'
            : 'border-slate-700 bg-slate-800'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 md:p-4">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-slate-700 bg-[#0b1017] shadow-2xl">
        {/* Header Bar with Segmented Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-[#111824] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
              <Globe className="h-4 w-4 text-sky-400" />
              <span>Setting Internet &amp; Jaringan Kantor</span>
            </div>

            <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-[#090d14] p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('internet')}
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'internet'
                    ? 'bg-sky-500/20 text-sky-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wifi className="h-3.5 w-3.5" />
                Setting Internet
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cli')}
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'cli'
                    ? 'bg-sky-500/20 text-sky-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="h-3.5 w-3.5" />
                Terminal CLI
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
            aria-label="Tutup Setting Internet"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Unboxed Status Metadata Strip */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-800/80 bg-[#0d131d] px-4 py-2 font-mono-tabular text-[11px] text-slate-400">
          <span className={draft.wanConnected ? 'text-emerald-400' : 'text-rose-400'}>
            WAN {draft.wanConnected ? 'Aktif' : 'Mati'}
          </span>
          <span aria-hidden="true">·</span>
          <span className={draft.dhcpEnabled ? 'text-emerald-400' : 'text-amber-300'}>
            DHCP {draft.dhcpEnabled ? 'Aktif' : 'Offline'}
          </span>
          <span aria-hidden="true">·</span>
          <span className={draft.wifiEnabled ? 'text-emerald-400' : 'text-amber-300'}>
            Wi-Fi {draft.wifiEnabled ? draft.wifiSsid : 'Offline'}
          </span>
          <span aria-hidden="true">·</span>
          <span className={rackChecked ? 'text-emerald-400' : 'text-slate-400'}>
            Rak R.01 {rackChecked ? 'OK' : 'Belum Dicek'}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Kabel PC {(port1Connected ? 1 : 0) + (port2Connected ? 1 : 0)}/2
          </span>
        </div>

        {activeTab === 'internet' ? (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Column 1: Gateway, DHCP & DNS */}
              <section className="rounded-lg border border-slate-800 bg-[#0d131d] p-3.5">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 text-xs font-semibold text-slate-200">
                  <Globe className="h-3.5 w-3.5 text-sky-400" />
                  <span>Gateway WAN, DHCP &amp; DNS</span>
                </div>

                <div className="mt-1 divide-y divide-slate-800/70">
                  <ToggleRow
                    label="Internet Gateway (WAN / NAT)"
                    detail="Hubungkan router kantor ke uplink internet"
                    checked={draft.wanConnected}
                    onChange={(val) => setDraft((prev) => ({ ...prev, wanConnected: val }))}
                  />
                  <ToggleRow
                    label="Server DHCP Otomatis"
                    detail="Bagikan IP otomatis ke PC-01, PC-02 & Wi-Fi"
                    checked={draft.dhcpEnabled}
                    onChange={(val) => setDraft((prev) => ({ ...prev, dhcpEnabled: val }))}
                  />
                  <ToggleRow
                    label="Firewall & Proteksi NAT"
                    detail="Filter akses port eksternal tidak dikenal"
                    checked={draft.firewallEnabled}
                    onChange={(val) => setDraft((prev) => ({ ...prev, firewallEnabled: val }))}
                  />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-slate-800/80 pt-3">
                  <label className="block">
                    <span className="text-[11px] text-slate-400">IP Gateway</span>
                    <input
                      type="text"
                      value={draft.gatewayIp}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, gatewayIp: e.target.value }))
                      }
                      className="mt-1 w-full rounded border border-slate-700 bg-[#070a0f] px-2.5 py-1.5 font-mono-tabular text-xs text-slate-100 outline-none focus:border-sky-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] text-slate-400">Subnet Mask</span>
                    <select
                      value={draft.subnetMask}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, subnetMask: e.target.value }))
                      }
                      className="mt-1 w-full rounded border border-slate-700 bg-[#070a0f] px-2 py-1.5 font-mono-tabular text-xs text-slate-100 outline-none focus:border-sky-500"
                    >
                      <option value="255.255.255.0">255.255.255.0 (/24)</option>
                      <option value="255.255.0.0">255.255.0.0 (/16)</option>
                      <option value="255.255.255.128">255.255.255.128 (/25)</option>
                    </select>
                  </label>
                </div>

                {/* DNS Server Presets & Inputs */}
                <div className="mt-3 border-t border-slate-800/80 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-300">Server DNS</span>
                    <div className="flex items-center gap-1">
                      {DNS_PRESETS.map((preset) => {
                        const active = draft.dnsPrimary === preset.primary;
                        return (
                          <button
                            key={preset.primary}
                            type="button"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                dnsPrimary: preset.primary,
                                dnsSecondary: preset.secondary,
                              }))
                            }
                            className={`rounded border px-2 py-0.5 text-[10px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                              active
                                ? 'border-sky-500/60 bg-sky-500/20 text-sky-300'
                                : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2.5">
                    <label className="block">
                      <span className="text-[11px] text-slate-400">DNS Utama</span>
                      <input
                        type="text"
                        value={draft.dnsPrimary}
                        onChange={(e) =>
                          setDraft((prev) => ({ ...prev, dnsPrimary: e.target.value }))
                        }
                        className="mt-1 w-full rounded border border-slate-700 bg-[#070a0f] px-2.5 py-1.5 font-mono-tabular text-xs text-slate-100 outline-none focus:border-sky-500"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[11px] text-slate-400">DNS Cadangan</span>
                      <input
                        type="text"
                        value={draft.dnsSecondary}
                        onChange={(e) =>
                          setDraft((prev) => ({ ...prev, dnsSecondary: e.target.value }))
                        }
                        className="mt-1 w-full rounded border border-slate-700 bg-[#070a0f] px-2.5 py-1.5 font-mono-tabular text-xs text-slate-100 outline-none focus:border-sky-500"
                      />
                    </label>
                  </div>
                </div>
              </section>

              {/* Column 2: Wi-Fi AP, VLAN & Bandwidth QoS */}
              <section className="rounded-lg border border-slate-800 bg-[#0d131d] p-3.5">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 text-xs font-semibold text-slate-200">
                  <Wifi className="h-3.5 w-3.5 text-sky-400" />
                  <span>Wi-Fi Access Point (R.09) &amp; Bandwidth</span>
                </div>

                <div className="mt-1 divide-y divide-slate-800/70">
                  <ToggleRow
                    label="Aktifkan Sinyal Wi-Fi (AP PoE)"
                    detail="Pancarkan Wi-Fi ke seluruh lantai kantor"
                    checked={draft.wifiEnabled}
                    onChange={(val) => setDraft((prev) => ({ ...prev, wifiEnabled: val }))}
                  />
                  <ToggleRow
                    label="VLAN 10 · Workstation Staf"
                    detail="Prioritas rute untuk PC-01 & PC-02"
                    checked={draft.vlan10Enabled}
                    onChange={(val) => setDraft((prev) => ({ ...prev, vlan10Enabled: val }))}
                  />
                  <ToggleRow
                    label="VLAN 20 · Jaringan Tamu"
                    detail="Isolasi trafik tamu dari server inti"
                    checked={draft.vlan20Enabled}
                    onChange={(val) => setDraft((prev) => ({ ...prev, vlan20Enabled: val }))}
                  />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-slate-800/80 pt-3">
                  <label className="block">
                    <span className="text-[11px] text-slate-400">Nama Wi-Fi (SSID)</span>
                    <input
                      type="text"
                      value={draft.wifiSsid}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, wifiSsid: e.target.value }))
                      }
                      className="mt-1 w-full rounded border border-slate-700 bg-[#070a0f] px-2.5 py-1.5 font-mono-tabular text-xs text-slate-100 outline-none focus:border-sky-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] text-slate-400">Kata Sandi Wi-Fi</span>
                    <div className="relative mt-1">
                      <input
                        type={showWifiPass ? 'text' : 'password'}
                        value={draft.wifiPassword}
                        onChange={(e) =>
                          setDraft((prev) => ({ ...prev, wifiPassword: e.target.value }))
                        }
                        className="w-full rounded border border-slate-700 bg-[#070a0f] py-1.5 pl-2.5 pr-8 font-mono-tabular text-xs text-slate-100 outline-none focus:border-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowWifiPass((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        aria-label={showWifiPass ? 'Sembunyikan sandi' : 'Lihat sandi'}
                      >
                        {showWifiPass ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </label>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                  <label className="block">
                    <span className="text-[11px] text-slate-400">Keamanan Enkripsi</span>
                    <select
                      value={draft.wifiSecurity}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          wifiSecurity: e.target.value as InternetSettings['wifiSecurity'],
                        }))
                      }
                      className="mt-1 w-full rounded border border-slate-700 bg-[#070a0f] px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500"
                    >
                      <option value="WPA3-Personal">WPA3-Personal (Aman)</option>
                      <option value="WPA2-AES">WPA2-AES</option>
                      <option value="Open">Open (Tanpa Sandi)</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[11px] text-slate-400">Band &amp; Channel</span>
                    <select
                      value={draft.wifiBand}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          wifiBand: e.target.value as InternetSettings['wifiBand'],
                        }))
                      }
                      className="mt-1 w-full rounded border border-slate-700 bg-[#070a0f] px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500"
                    >
                      <option value="Dual-Band Auto">Dual-Band Auto</option>
                      <option value="5 GHz (Ch.36)">5 GHz (Ch.36)</option>
                      <option value="2.4 GHz (Ch.6)">2.4 GHz (Ch.6)</option>
                    </select>
                  </label>
                </div>

                {/* Bandwidth QoS Limiter */}
                <div className="mt-3 border-t border-slate-800/80 pt-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-300">Batas Kecepatan (QoS)</span>
                    <span className="font-mono-tabular text-sky-300">
                      {draft.bandwidthLimitMbps === 0
                        ? 'Tanpa Batas'
                        : `${draft.bandwidthLimitMbps} Mbps`}
                    </span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                    {BANDWIDTH_OPTIONS.map((opt) => {
                      const active = draft.bandwidthLimitMbps === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            setDraft((prev) => ({ ...prev, bandwidthLimitMbps: opt.value }))
                          }
                          className={`rounded border px-2 py-1 font-mono-tabular text-[10px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                            active
                              ? 'border-sky-500/60 bg-sky-500/20 text-sky-300'
                              : 'border-slate-700 bg-[#070a0f] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>

            {/* Live Connection Diagnostics & Speedtest */}
            <section className="mt-4 rounded-lg border border-slate-800 bg-[#0d131d] p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Activity className="h-3.5 w-3.5 text-sky-400" />
                  <span>Uji Koneksi Internet &amp; Speedtest</span>
                </div>
                <button
                  type="button"
                  onClick={runConnectionDiagnostics}
                  disabled={testingSpeed}
                  className="inline-flex items-center gap-1.5 rounded border border-sky-500/50 bg-sky-500/15 px-3 py-1 text-xs font-medium text-sky-300 transition-colors hover:bg-sky-500/25 disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Shield className="h-3.5 w-3.5" />
                  {testingSpeed ? 'Menguji Koneksi...' : 'Jalankan Uji Internet'}
                </button>
              </div>

              {testResult ? (
                <div className="mt-3 border-t border-slate-800/80 pt-3">
                  <div
                    className={`text-xs font-medium ${
                      testResult.ok ? 'text-emerald-400' : 'text-amber-300'
                    }`}
                  >
                    {testResult.summary}
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <div className="rounded border border-slate-800 bg-[#070a0f] px-3 py-2">
                      <div className="text-[10px] text-slate-400">Ping / Latensi</div>
                      <div className="mt-0.5 font-mono-tabular text-sm font-semibold text-slate-100">
                        {testResult.pingMs !== null ? `${testResult.pingMs} ms` : 'Timeout'}
                      </div>
                    </div>
                    <div className="rounded border border-slate-800 bg-[#070a0f] px-3 py-2">
                      <div className="text-[10px] text-slate-400">Unduh (Download)</div>
                      <div className="mt-0.5 font-mono-tabular text-sm font-semibold text-sky-300">
                        {testResult.downloadMbps !== null
                          ? `${testResult.downloadMbps} Mbps`
                          : '—'}
                      </div>
                    </div>
                    <div className="rounded border border-slate-800 bg-[#070a0f] px-3 py-2">
                      <div className="text-[10px] text-slate-400">Unggah (Upload)</div>
                      <div className="mt-0.5 font-mono-tabular text-sm font-semibold text-emerald-300">
                        {testResult.uploadMbps !== null ? `${testResult.uploadMbps} Mbps` : '—'}
                      </div>
                    </div>
                    <div className="rounded border border-slate-800 bg-[#070a0f] px-3 py-2">
                      <div className="text-[10px] text-slate-400">DNS Lookup</div>
                      <div className="mt-0.5 truncate font-mono-tabular text-xs font-semibold text-slate-200">
                        {testResult.dnsResolved}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-slate-400">
                  Klik &ldquo;Jalankan Uji Internet&rdquo; untuk memeriksa ping ke DNS{' '}
                  <span className="font-mono-tabular text-slate-300">{draft.dnsPrimary}</span>,
                  status DHCP, dan kecepatan unduh/unggah kantor.
                </p>
              )}
            </section>

            {/* Footer Save / Reset Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => {
                  const resetDraft = {
                    ...DEFAULT_INTERNET_SETTINGS,
                    dhcpEnabled: dhcpActive,
                    wifiEnabled: apConfigured,
                  };
                  setDraft(resetDraft);
                  setTestResult(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Standar
              </button>

              <div className="flex items-center gap-2">
                {savedFeedback && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    Tersimpan
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => applyDraftNow(draft, true)}
                  className="rounded-md border border-sky-500/50 bg-sky-500/15 px-3.5 py-1.5 text-xs font-semibold text-sky-300 transition-colors hover:bg-sky-500/25 whitespace-nowrap shrink-0"
                >
                  Terapkan Setting
                </button>
                <button
                  type="button"
                  onClick={() => applyDraftNow(draft, false)}
                  className="rounded-md bg-sky-500 px-4 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400 whitespace-nowrap shrink-0"
                >
                  Simpan &amp; Tutup
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            {/* Compact Service Status Bar */}
            <div className="grid grid-cols-2 gap-2.5 text-xs sm:grid-cols-4">
              <div
                className={`rounded-md border px-3 py-2 ${
                  draft.dhcpEnabled
                    ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                    : 'border-amber-500/35 bg-amber-950/20 text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between font-medium">
                  <span>DHCP Server</span>
                  {draft.dhcpEnabled && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                </div>
                <div className="mt-0.5 font-mono-tabular text-[11px] opacity-80">
                  {draft.dhcpEnabled ? '192.168.10.0/24 · UP' : 'Offline · Wajib'}
                </div>
              </div>

              <div
                className={`rounded-md border px-3 py-2 ${
                  draft.wifiEnabled
                    ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-medium">
                  <span>Wi-Fi AP</span>
                  {draft.wifiEnabled && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                </div>
                <div className="mt-0.5 truncate font-mono-tabular text-[11px] text-slate-400">
                  {draft.wifiEnabled ? draft.wifiSsid : 'Offline'}
                </div>
              </div>

              <div
                className={`rounded-md border px-3 py-2 ${
                  draft.vlan10Enabled
                    ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-medium">
                  <span>VLAN 10</span>
                  {draft.vlan10Enabled && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                </div>
                <div className="mt-0.5 font-mono-tabular text-[11px] text-slate-400">
                  {draft.vlan10Enabled ? 'WORKSTATION · UP' : 'Opsional'}
                </div>
              </div>

              <div
                className={`rounded-md border px-3 py-2 ${
                  draft.vlan20Enabled
                    ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-medium">
                  <span>VLAN 20</span>
                  {draft.vlan20Enabled && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                </div>
                <div className="mt-0.5 font-mono-tabular text-[11px] text-slate-400">
                  {draft.vlan20Enabled ? 'GUEST · UP' : 'Opsional'}
                </div>
              </div>
            </div>

            {/* Terminal Output & Prompt */}
            <div className="mt-3 rounded-md border border-slate-800 bg-[#070a0f] p-3.5 font-mono-tabular text-xs">
              <div
                ref={logContainerRef}
                className="h-48 space-y-1 overflow-y-auto pr-1 text-slate-300"
              >
                {logs.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.startsWith('[OK]')
                        ? 'text-emerald-400'
                        : line.startsWith('%')
                          ? 'text-rose-400'
                          : line.startsWith('SW-CORE-01')
                            ? 'text-sky-300'
                            : 'text-slate-400'
                    }
                  >
                    {line}
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  executeCommand(input);
                }}
                className="mt-3 flex items-center gap-2 border-t border-slate-800/90 pt-3"
              >
                <span className="shrink-0 text-sky-400">SW-CORE-01(config)#</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder='ketik "dhcp", "wifi on", "dns 1.1.1.1"...'
                  className="w-full bg-transparent text-slate-100 outline-none placeholder:text-slate-600"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded border border-sky-500/40 bg-sky-500/15 px-3 py-1 text-xs font-medium text-sky-300 transition-colors hover:bg-sky-500/25"
                >
                  Jalankan
                </button>
              </form>
            </div>

            {/* Quick CLI Actions */}
            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => executeCommand('dhcp')}
                  disabled={draft.dhcpEnabled}
                  className="rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono-tabular text-xs text-slate-200 transition-colors hover:border-sky-500/50 hover:text-sky-300 disabled:opacity-40"
                >
                  dhcp
                </button>
                <button
                  type="button"
                  onClick={() => executeCommand('wifi on')}
                  disabled={draft.wifiEnabled}
                  className="rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono-tabular text-xs text-slate-200 transition-colors hover:border-sky-500/50 hover:text-sky-300 disabled:opacity-40"
                >
                  wifi on
                </button>
                <button
                  type="button"
                  onClick={() => executeCommand('vlan 10')}
                  disabled={draft.vlan10Enabled}
                  className="rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono-tabular text-xs text-slate-300 transition-colors hover:border-slate-500 disabled:opacity-40"
                >
                  vlan 10
                </button>
                <button
                  type="button"
                  onClick={() => executeCommand('ping 1.1.1.1')}
                  className="rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono-tabular text-xs text-slate-300 transition-colors hover:border-slate-500"
                >
                  ping 1.1.1.1
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
                  draft.dhcpEnabled
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    : 'border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {draft.dhcpEnabled ? 'Selesai & Kembali ke Meja' : 'Tutup Terminal'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
