import React, { useState } from 'react';
import { ArrowLeft, Check, Code2, Copy, Cpu, Layers, Map, ShieldAlert, Star, Terminal } from 'lucide-react';
import { T568B_STANDARD } from '../types/game';

interface GDDStudioViewProps {
  onBackToGame: () => void;
}

type CodeTab = 'unity' | 'threejs';

const UNITY_CODE = `// ============================================================================
// SERVER PANIC! (Co-op Chaos) — Core Unity C# Architecture
// Target: Unity 2022.3 LTS / Unity 6 (URP 3D Isometric + New Input System)
// ============================================================================

using System;
using System.Collections.Generic;
using UnityEngine;

namespace ServerPanic.Core
{
    public enum HeldItem { None, UtpSpool, CrimpedCable, FoldingLadder, AccessPointPoE }

    [Serializable]
    public struct LaptopNode
    {
        public string id;
        public int vlanId;          // 10 = Panitia (Wired), 20 = Tamu (Wi-Fi)
        public bool hasPhysicalLink;
        public bool ipConflict;
        public bool isOnline;
    }

    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("Level 1: Seminar Nasional")]
        public float levelDuration = 165f; // 02:45
        public float timeRemaining { get; private set; }
        public float connectionStability = 100f;
        public bool vlan10Active;
        public bool vlan20Active;
        public bool dhcpActive;
        public bool apPoEInstalled;
        public int wiredTrunksReady;

        public List<LaptopNode> laptops = new List<LaptopNode>(10);

        private void Awake()
        {
            Instance = this;
            timeRemaining = levelDuration;
        }

        private void Update()
        {
            timeRemaining = Mathf.Max(0f, timeRemaining - Time.deltaTime);
            if (timeRemaining <= 0f) EvaluateShift(false);
        }

        public void EvaluateNetworkLinks(bool isBlackout)
        {
            int connectedCount = 0;
            for (int i = 0; i < laptops.Count; i++)
            {
                var node = laptops[i];
                bool layer1 = node.vlanId == 10 ? wiredTrunksReady >= 2 : apPoEInstalled;
                bool layer2 = node.vlanId == 10 ? vlan10Active : vlan20Active;
                node.ipConflict = !dhcpActive;
                node.isOnline = !isBlackout && layer1 && layer2 && dhcpActive;
                laptops[i] = node;
                if (node.isOnline) connectedCount++;
            }
            if (connectedCount == laptops.Count && vlan10Active && vlan20Active)
                EvaluateShift(true);
        }

        public int CalculateStarRating(int messyCablesCount)
        {
            if (laptops.FindAll(l => l.isOnline).Count < 10) return 0;
            int stars = 1;
            if (timeRemaining >= 40f && connectionStability >= 65f) stars = 2;
            if (timeRemaining >= 65f && connectionStability >= 80f && messyCablesCount == 0) stars = 3;
            return stars;
        }

        private void EvaluateShift(bool victory) => Debug.Log($"Shift Ended. Victory: {victory}");
    }

    public class CablePhysicsSystem : MonoBehaviour
    {
        [Header("T568B Validation & Stumble Hazard")]
        private static readonly string[] T568BOrder = {
            "WO", "O", "WG", "B", "WB", "G", "WBR", "BR"
        };

        public bool ValidateT568B(string[] playerSequence)
        {
            if (playerSequence.Length != 8) return false;
            for (int i = 0; i < 8; i++)
                if (playerSequence[i] != T568BOrder[i]) return false;
            return true;
        }

        private void OnTriggerEnter(Collider other)
        {
            if (other.CompareTag("Player"))
            {
                // Kabel tergeletak di jalur utama memicu stun 1.2 detik
                other.SendMessage("ApplyStumbleStun", 1.2f, SendMessageOptions.DontRequireReceiver);
            }
        }
    }

    public class ChaosDirector : MonoBehaviour
    {
        public Light mainStudioLight;
        public ParticleSystem serverOverheatSparks;
        public bool isBlackout { get; private set; }
        public bool isOverheating { get; private set; }

        public void TriggerBlackout()
        {
            isBlackout = true;
            mainStudioLight.intensity = 0.15f;
            GameManager.Instance.EvaluateNetworkLinks(true);
        }

        public void RestoreMCB()
        {
            isBlackout = false;
            mainStudioLight.intensity = 1.5f;
            GameManager.Instance.EvaluateNetworkLinks(false);
        }
    }
}`;

const THREEJS_CODE = `// ============================================================================
// SERVER PANIC! (Co-op Chaos) — Three.js + TypeScript Engine Architecture
// Struktur Modular yang aktif berjalan di Prototype 3D Isometrik aplikasi ini
// ============================================================================

// src/
// ├── types/game.ts                  -> State Pemain (P1-P4), Laptop, VLAN, T568B
// ├── audio/sfx.ts                   -> Procedural Web Audio API SFX (Zero 404)
// ├── three/
// │   ├── proceduralTextures.ts      -> CanvasTexture Studio Floor, Hologram, Status
// │   └── models.ts                  -> Composite 3-12 Part Three.Group Models
// └── components/
//     ├── IsometricGameCanvas.tsx    -> Orthographic Camera, RoomEnvironment, Loop
//     ├── CrimpingModal.tsx          -> Mini-Game Susun Kabel T568B + LAN Tester
//     ├── NetworkCLIModal.tsx        -> Terminal CLI VLAN 10/20 & DHCP Pool
//     ├── CharacterSelectOverlay.tsx -> Kustomisasi Teknisi Pria/Wanita P1-P4
//     └── GameHUD.tsx                -> Countdown 02:45, Mission Bars, Skor Bintang

import * as THREE from 'three';

export function createIsometricCamera(aspect: number, frustumSize = 15.5) {
  const camera = new THREE.OrthographicCamera(
    (-frustumSize * aspect) / 2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    -frustumSize / 2,
    0.1,
    100
  );
  camera.position.set(14, 15.5, 16);
  camera.lookAt(0, 0.5, 0);
  return camera;
}

export function routeFloorCable(points: THREE.Vector3[], isNeat: boolean): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, 20, 0.05, 8, false);
  const material = new THREE.MeshStandardMaterial({
    color: isNeat ? 0x10b981 : 0xf59e0b,
    emissive: isNeat ? 0x059669 : 0xd97706,
    emissiveIntensity: isNeat ? 0.75 : 0.95,
  });
  return new THREE.Mesh(geometry, material);
}`;

export const GDDStudioView: React.FC<GDDStudioViewProps> = ({ onBackToGame }) => {
  const [codeTab, setCodeTab] = useState<CodeTab>('unity');
  const [copied, setCopied] = useState(false);

  const activeCode = codeTab === 'unity' ? UNITY_CODE : THREEJS_CODE;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCode).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-slate-950 text-slate-100">
      {/* Top Sticky Studio Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8">
          <div className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            SERVER PANIC! <span className="text-cyan-400">GDD &amp; Arsitektur</span>
          </div>

          <nav className="hidden items-center gap-6 text-xs font-medium text-slate-400 md:flex">
            <a href="#gdd-concept" className="hover:text-white whitespace-nowrap">01. Estetika</a>
            <a href="#gdd-map" className="hover:text-white whitespace-nowrap">02. Level 1 Map</a>
            <a href="#gdd-gameplay" className="hover:text-white whitespace-nowrap">03. Mekanik TKJ</a>
            <a href="#gdd-chaos" className="hover:text-white whitespace-nowrap">04. Chaos AI</a>
            <a href="#gdd-code" className="hover:text-white whitespace-nowrap">05. Kode Arsitektur</a>
          </nav>

          <button
            type="button"
            onClick={onBackToGame}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Mainkan Prototype 3D
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-12 px-6 py-10">
        {/* Hero Summary */}
        <section className="border-b border-slate-800 pb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-cyan-400">
            <span>Game Design Document (GDD) v1.0</span>
            <span aria-hidden="true">·</span>
            <span>Co-op Tactical IT Simulation</span>
            <span aria-hidden="true">·</span>
            <span>1–4 Players (Local &amp; Online Co-op)</span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold text-white md:text-5xl">
            SERVER PANIC! (Co-op Chaos)
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
            Game simulasi kerja tim teknisi jaringan komputer (TKJ) bergaya kacau ala <em>Overcooked</em> yang dipadukan dengan estetika <em>Modern Cyberpunk IT Office</em>. Pemain berlomba melawan waktu untuk membangun infrastruktur jaringan fisik dan logis sebelum acara berskala besar dimulai.
          </p>
        </section>

        {/* 01. Visual & Character Customization */}
        <section id="gdd-concept" className="space-y-5">
          <div className="flex items-center gap-2.5 text-cyan-400">
            <Layers className="h-5 w-5" />
            <h2 className="font-display text-2xl font-bold text-white">
              01. Arah Visual &amp; Kustomisasi Karakter
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="text-base font-bold text-white">3D Isometric Studio Aesthetic</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li><strong className="text-slate-100">Kamera:</strong> Orthographic Isometric (sudut ~45° elevasi, nol distorsi perspektif) agar keterbacaan jalur kabel dan posisi antar pemain selalu presisi.</li>
                <li><strong className="text-slate-100">Pencahayaan:</strong> Studio 3-titik cerah (Key Light hangat + Hemisphere Fill sejuk + Rim Light biru) dengan kontras dramatis saat insiden <em>Blackout</em>.</li>
                <li><strong className="text-slate-100">Aksen Neon:</strong> Kabel UTP dan jalur <em>floor conduit</em> memancarkan cahaya emissive cyan (rapi) atau oranye (berantakan/bahaya).</li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="text-base font-bold text-white">Kustomisasi Teknisi Pria &amp; Wanita</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li><strong className="text-slate-100">Model Karakter:</strong> Opsi siluet Pria dan Wanita dengan <em>techwear utility vest</em>, <em>AR safety goggles</em> menyala, dan <em>headset comms</em>.</li>
                <li><strong className="text-slate-100">Identifikasi Slot P1–P4:</strong> P1 Cyber Cyan (<span className="text-cyan-400">#06B6D4</span>), P2 Voltage Amber (<span className="text-amber-400">#F59E0B</span>), P3 Fiber Emerald (<span className="text-emerald-400">#10B981</span>), P4 Packet Coral (<span className="text-rose-400">#F43F5E</span>).</li>
                <li><strong className="text-slate-100">Visual Held-Item:</strong> Barang yang dibawa (Gulungan UTP, Tangga Lipat, Access Point) dirender langsung di tangan karakter.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 02. Map Layout */}
        <section id="gdd-map" className="space-y-5">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <Map className="h-5 w-5" />
            <h2 className="font-display text-2xl font-bold text-white">
              02. Tata Letak Map — Cutaway Isometric (1 Denah Gedung Terpadu)
            </h2>
          </div>

          <div className="rounded-xl border border-cyan-500/30 bg-slate-900 p-5">
            <div className="text-xs font-semibold text-cyan-400">1 Denah Cutaway Gedung (18×12 m) Menapak di Lantai Dasar</div>
            <h3 className="mt-1 text-base font-bold text-white">Server Room · Seminar Area · Gudang / Storage</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              Seluruh area berada dalam satu denah bangunan cutaway isometrik yang menapak di atas lantai gedung eksterior tanpa ruang kosong mengambang:
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                <div className="text-xs font-semibold text-cyan-400">Kiri Atas (Pintu Terbuka)</div>
                <div className="mt-1 text-sm font-bold text-white">Server Room</div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  Terhubung langsung ke aula melalui pintu masuk terbuka. Berisi 2 Rak Server 42U, meja &amp; kursi Terminal CLI, serta panel MCB di dinding kiri.
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                <div className="text-xs font-semibold text-emerald-400">Tengah &amp; Depan</div>
                <div className="mt-1 text-sm font-bold text-white">Seminar Area</div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  Meja kerja crimping RJ45 di dinding pembatas, balok kayu dinding belakang untuk pemasangan Access Point PoE, 2 meja panjang (10 laptop klien), dan jalur patroli Bos NPC.
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                <div className="text-xs font-semibold text-amber-400">Kanan Atas (Bay Terbuka)</div>
                <div className="mt-1 text-sm font-bold text-white">Gudang / Storage</div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  Area terbuka di samping balok PoE dengan 3 gulungan kabel UTP warna-warni, toolbox merah, kardus suku cadang, peti Access Point PoE cadangan, dan tangga lipat.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 03. Core Gameplay & TKJ Mechanics */}
        <section id="gdd-gameplay" className="space-y-5">
          <div className="flex items-center gap-2.5 text-amber-400">
            <Cpu className="h-5 w-5" />
            <h2 className="font-display text-2xl font-bold text-white">
              03. Core Gameplay Loop &amp; Mekanik TKJ
            </h2>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white">A. Sistem Kabel Fisik, Crimping T568B &amp; Tripping Hazard</h3>
              <p className="mt-1.5 text-sm text-slate-300">
                Pemain mengambil gulungan UTP di Gudang, melakukan mini-game menyusun 8 pin warna standar <strong>TIA/EIA-568B</strong> di meja crimping, mengujinya dengan LAN Tester (pin 1–8), lalu menarik kabel secara fisik ke meja seminar. Kabel yang ditarik melintang di koridor tengah dianggap berantakan dan dapat membuat pemain tersandung (<em>stun</em> 1.2 detik) jika tidak dirapikan ke jalur <em>conduit</em>.
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
                {T568B_STANDARD.map((w) => (
                  <div key={w.id} className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-center">
                    <div
                      className="mx-auto mb-1.5 h-3 w-full rounded-sm"
                      style={{
                        background: w.stripeColor
                          ? `repeating-linear-gradient(45deg, ${w.primaryColor}, ${w.primaryColor} 4px, ${w.stripeColor} 4px, ${w.stripeColor} 8px)`
                          : w.primaryColor,
                      }}
                    />
                    <div className="font-mono-tabular text-[10px] font-bold text-slate-200">Pin {w.pin}</div>
                    <div className="text-[10px] text-slate-400">{w.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 border-t border-slate-800 pt-5 md:grid-cols-2">
              <div>
                <h3 className="text-base font-bold text-white">B. Infrastruktur Vertikal (Tangga &amp; PoE AP)</h3>
                <p className="mt-1 text-sm text-slate-300">
                  Access Point tidak bisa dipasang dari lantai. Pemain 1 membawa <strong>Tangga Lipat</strong> dan memasangnya di pilar Seminar, lalu pemain membawa <strong>Access Point PoE</strong> dan memanjat untuk mengaktifkan jangkauan Wi-Fi bagi Laptop Tamu 6–10.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">C. Konfigurasi Jaringan CLI (DHCP &amp; VLAN)</h3>
                <p className="mt-1 text-sm text-slate-300">
                  Kabel fisik saja belum cukup—laptop akan menampilkan <strong>IP ERR</strong> sebelum teknisi mengakses Terminal CLI di Server Room untuk membuat <code className="text-cyan-300">vlan 10</code> (Panitia), <code className="text-amber-300">vlan 20</code> (Tamu), serta mengaktifkan <code className="text-emerald-300">ip dhcp pool</code>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 04. Chaos Director & Scoring */}
        <section id="gdd-chaos" className="grid gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="h-5 w-5" />
              <h2 className="font-display text-xl font-bold text-white">04. Elemen Chaos &amp; Rintangan</h2>
            </div>
            <ul className="mt-3 space-y-2.5 text-sm text-slate-300">
              <li><strong className="text-white">Bos / Klien Bawel (NPC):</strong> Berpatroli di antara meja seminar, mendorong pemain yang menghalangi, dan memicu gelembung teks <span className="font-bold text-rose-400">&quot;HURRY!&quot;</span> saat waktu tersisa &lt; 90 detik.</li>
              <li><strong className="text-white">Listrik Anjlok (Blackout):</strong> Menurunkan intensitas lampu studio dan memutus seluruh koneksi laptop sampai saklar MCB di Server Room dinaikkan kembali.</li>
              <li><strong className="text-white">Server Overheat:</strong> Memicu percikan api di rak server dan menggerus persentase <em>Stability</em> per detik hingga didinginkan.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center gap-2 text-amber-400">
              <Star className="h-5 w-5" />
              <h2 className="font-display text-xl font-bold text-white">05. Sistem HUD &amp; Skor Bintang</h2>
            </div>
            <ul className="mt-3 space-y-2.5 text-sm text-slate-300">
              <li><strong className="text-white">HUD Atas:</strong> Countdown timer (<code className="font-mono-tabular text-cyan-300">02:45</code>), bar progres koneksi (<code className="font-mono-tabular">10/10 LAPTOPS</code>), dan status segmen (<code className="font-mono-tabular">VLAN SETUP: 2/2</code>).</li>
              <li><strong className="text-white">Bintang 1:</strong> Semua 10 laptop online sebelum waktu habis.</li>
              <li><strong className="text-white">Bintang 2:</strong> Sisa waktu ≥ 40 detik dan <em>Stability</em> ≥ 65%.</li>
              <li><strong className="text-white">Bintang 3:</strong> Sisa waktu ≥ 65 detik, <em>Stability</em> ≥ 80%, dan <strong>0 kabel berantakan</strong> di lantai.</li>
            </ul>
          </div>
        </section>

        {/* 06. Code Architecture */}
        <section id="gdd-code" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-cyan-400">
              <Code2 className="h-5 w-5" />
              <h2 className="font-display text-2xl font-bold text-white">
                06. Arsitektur Kode (Unity C# &amp; Three.js)
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900 p-1">
                <button
                  type="button"
                  onClick={() => setCodeTab('unity')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    codeTab === 'unity' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Unity C# Scripts
                </button>
                <button
                  type="button"
                  onClick={() => setCodeTab('threejs')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    codeTab === 'threejs' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Three.js / TypeScript
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Tersalin' : 'Salin Kode'}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-400">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <span className="font-mono-tabular">
                {codeTab === 'unity'
                  ? 'Assets/Scripts/ServerPanicCore.cs'
                  : 'src/components/IsometricGameCanvas.tsx (Blueprint)'}
              </span>
            </div>
            <pre className="max-h-[520px] overflow-auto p-5 font-mono-tabular text-xs leading-relaxed text-cyan-100">
              <code>{activeCode}</code>
            </pre>
          </div>
        </section>
      </main>
    </div>
  );
};
