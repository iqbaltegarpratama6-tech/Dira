import React, { useEffect, useState } from 'react';
import {
  Armchair,
  BookOpen,
  Cable,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  DoorClosed,
  DoorOpen,
  FileText,
  Globe,
  Home,
  MapPin,
  Maximize2,
  MessageCircle,
  Monitor,
  RotateCcw,
  RotateCw,
  Shirt,
  Terminal,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { OFFICE_NPC_LIST } from '../data/officeNpcs';
import {
  CAMERA_ANGLES,
  CameraAngleId,
  NearbyDoorInfo,
  NearbyNpcInfo,
  NearbySeatInfo,
  OFFICE_ROOMS,
  OfficeNpcId,
  ROOM_LABELS,
  RoomDoorId,
  RoomId,
  WorkstationStats,
  WorkstationTargetId,
  WorkstationTargetInfo,
} from '../types/game';

interface GameHUDProps {
  stats: WorkstationStats;
  cameraAngle: CameraAngleId;
  hoveredTarget: WorkstationTargetInfo | null;
  hoveredNpc: NearbyNpcInfo | null;
  nearbyNpc: NearbyNpcInfo | null;
  nearbySeat: NearbySeatInfo | null;
  isSeated: boolean;
  nearbyDoor: NearbyDoorInfo | null;
  notice: string | null;
  muted: boolean;
  customizerOpen: boolean;
  notepadOpen: boolean;
  zoomActive?: boolean;
  onRestart: () => void;
  onBackToTitle: () => void;
  onSelectAngle: (angle: CameraAngleId) => void;
  onWalkToRoom: (roomId: RoomId) => void;
  onWalkToTarget: (targetId: WorkstationTargetId) => void;
  onTalkToNpc: (npcId: OfficeNpcId) => void;
  onToggleSit: () => void;
  onToggleDoor: (doorId?: RoomDoorId) => void;
  onToggleMute: () => void;
  onToggleCustomizer: () => void;
  onToggleNotepad: () => void;
  onOpenCli: () => void;
  onOpenInternetSettings: () => void;
  onOpenGdd: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  cameraAngle,
  hoveredTarget,
  hoveredNpc,
  nearbyNpc,
  nearbySeat,
  isSeated,
  nearbyDoor,
  notice,
  muted,
  customizerOpen,
  notepadOpen,
  zoomActive = false,
  onRestart,
  onBackToTitle,
  onSelectAngle,
  onWalkToRoom,
  onWalkToTarget,
  onTalkToNpc,
  onToggleSit,
  onToggleDoor,
  onToggleMute,
  onToggleCustomizer,
  onToggleNotepad,
  onOpenCli,
  onOpenInternetSettings,
  onOpenGdd,
}) => {
  const [isCompactViewport, setIsCompactViewport] = useState(() =>
    typeof window !== 'undefined'
      ? window.innerWidth < 1024 || window.innerHeight < 560
      : false
  );
  const [isMobilePortrait, setIsMobilePortrait] = useState(() =>
    typeof window !== 'undefined'
      ? window.innerWidth < 768 && window.innerHeight > window.innerWidth
      : false
  );

  // Auto-collapse side drawers on mobile/compact landscape so text never crowds the 3D scene
  const [checklistCollapsed, setChecklistCollapsed] = useState(() =>
    typeof window !== 'undefined'
      ? window.innerWidth < 1024 || window.innerHeight < 560
      : false
  );
  const [roomsCollapsed, setRoomsCollapsed] = useState(() =>
    typeof window !== 'undefined'
      ? window.innerWidth < 1024 || window.innerHeight < 560
      : false
  );

  useEffect(() => {
    const syncViewport = () => {
      const compact = window.innerWidth < 1024 || window.innerHeight < 560;
      const portraitMobile = window.innerWidth < 768 && window.innerHeight > window.innerWidth;
      setIsCompactViewport(compact);
      setIsMobilePortrait(portraitMobile);
      if (compact) {
        setChecklistCollapsed(true);
        setRoomsCollapsed(true);
      }
    };
    window.addEventListener('resize', syncViewport);
    window.addEventListener('orientationchange', syncViewport);
    return () => {
      window.removeEventListener('resize', syncViewport);
      window.removeEventListener('orientationchange', syncViewport);
    };
  }, []);

  const requestLandscapeMode = async () => {
    try {
      const rootEl = document.documentElement;
      if (!document.fullscreenElement && rootEl.requestFullscreen) {
        await rootEl.requestFullscreen();
      }
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (type: string) => Promise<void>;
      };
      if (orientation && typeof orientation.lock === 'function') {
        await orientation.lock('landscape');
      }
    } catch {
      // Browser/iframe may restrict orientation lock; user rotates device physically
    }
  };

  const tasks: Array<{
    id: string;
    category: 'infra' | 'pc' | 'report';
    targetId: WorkstationTargetId;
    room: string;
    label: string;
    done: boolean;
  }> = [
    {
      id: 'p1',
      category: 'infra',
      targetId: stats.hasCableInHand ? 'client_pc_1' : 'utp_spool',
      room: 'R.03 → R.07 Klien A',
      label: 'Sambungkan Kabel LAN PC-01',
      done: stats.port1Connected,
    },
    {
      id: 'p2',
      category: 'infra',
      targetId: stats.hasCableInHand ? 'client_pc_2' : 'utp_spool',
      room: 'R.03 → R.08 Klien B',
      label: 'Sambungkan Kabel LAN PC-02',
      done: stats.port2Connected,
    },
    {
      id: 'tidy',
      category: 'infra',
      targetId: 'messy_cables',
      room: 'Koridor Utama',
      label: 'Rapikan Kabel Lantai Acak',
      done: stats.cablesTidied,
    },
    {
      id: 'ap',
      category: 'infra',
      targetId: 'ap_mount',
      room: 'R.09 Wi-Fi & AP',
      label: 'Aktifkan Access Point Wi-Fi',
      done: stats.apConfigured,
    },
    {
      id: 'rack',
      category: 'infra',
      targetId: 'server_rack',
      room: 'R.01 Server Room',
      label: 'Inspeksi Rak Server & UPS',
      done: stats.rackChecked,
    },
    {
      id: 'dhcp',
      category: 'infra',
      targetId: 'cli_monitor',
      room: 'R.02 Ruang NOC',
      label: 'Ketik "dhcp" di Terminal CLI',
      done: stats.dhcpActive,
    },
    {
      id: 'pc_rec',
      category: 'pc',
      targetId: 'employee_pc_reception',
      room: 'R.06 Resepsionis',
      label: 'Perbaiki Internet PC Resepsionis',
      done: stats.receptionPcFixed,
    },
    {
      id: 'pc_os',
      category: 'pc',
      targetId: 'employee_pc_os',
      room: 'R.07 Klien A',
      label: 'Install Windows & Driver PC Staf',
      done: stats.osReinstalled,
    },
    {
      id: 'pc_meet',
      category: 'pc',
      targetId: 'employee_pc_meeting',
      room: 'R.05 Ruang Rapat',
      label: 'Perbaiki Wi-Fi Laptop Rapat',
      done: stats.meetingLaptopFixed,
    },
    {
      id: 'boss',
      category: 'report',
      targetId: 'boss_report',
      room: 'R.15 Ruang Bos',
      label: 'Laporkan Selesai ke Bos',
      done: stats.bossReported,
    },
  ];

  const infraTasks = tasks.filter((t) => t.category === 'infra');
  const pcTasks = tasks.filter((t) => t.category === 'pc');
  const reportTasks = tasks.filter((t) => t.category === 'report');
  const allTechDone = infraTasks.every((t) => t.done) && pcTasks.every((t) => t.done);
  const completedCount = tasks.filter((t) => t.done).length;
  const progressPct = Math.round((completedCount / tasks.length) * 100);
  const learningAccuracyPct =
    stats.learningAttemptsCount > 0
      ? Math.round((stats.learningCorrectCount / stats.learningAttemptsCount) * 100)
      : 100;

  const getRoomTaskBadge = (roomId: RoomId): 'done' | 'pending' | null => {
    switch (roomId) {
      case 'r01_server':
        return stats.rackChecked ? 'done' : 'pending';
      case 'r02_noc':
        return stats.dhcpActive ? 'done' : 'pending';
      case 'r03_storage':
        return stats.port1Connected && stats.port2Connected ? 'done' : 'pending';
      case 'r05_meeting':
        return stats.meetingLaptopFixed ? 'done' : 'pending';
      case 'r06_reception':
        return stats.receptionPcFixed ? 'done' : 'pending';
      case 'r07_client_a':
        return stats.port1Connected && stats.osReinstalled ? 'done' : 'pending';
      case 'r08_client_b':
        return stats.port2Connected ? 'done' : 'pending';
      case 'r09_wifi':
        return stats.apConfigured ? 'done' : 'pending';
      case 'r15_boss':
        return stats.bossReported ? 'done' : allTechDone ? 'pending' : null;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile Portrait Blocker -> Force/Guide to Landscape Mode */}
      {isMobilePortrait && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#090d14] px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-500/40 bg-sky-500/10 text-sky-400">
            <RotateCw className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-100">
            Gunakan Mode Landscape
          </h2>
          <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-slate-400">
            Putar HP Anda ke posisi mendatar (landscape) agar area kantor 3D luas dan teks HUD tidak memenuhi layar.
          </p>
          <button
            type="button"
            onClick={requestLandscapeMode}
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Putar ke Landscape
          </button>
        </div>
      )}

      {/* Top Bar (Single Compact Row on Mobile Landscape) */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-2 border-b border-slate-800/90 bg-[#090d14]/92 px-3 py-1.5 md:px-5 md:py-2">
        <div className="pointer-events-auto flex min-w-0 items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold tracking-tight text-slate-100">
            <Monitor className="h-4 w-4 shrink-0 text-sky-400" />
            <span className="truncate">NetOps 10R</span>
          </div>
          <span className="hidden text-slate-700 lg:inline" aria-hidden="true">·</span>
          <div className="hidden items-center gap-1.5 text-slate-300 lg:flex">
            <MapPin className="h-3.5 w-3.5 text-sky-400" />
            <span>{ROOM_LABELS[stats.currentRoom]}</span>
          </div>
        </div>

        {/* Multi-Side & 3rd/1st Person POV Switcher */}
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-md border border-slate-800 bg-[#0e141f] p-0.5">
          <span className="hidden items-center gap-1 px-2 text-[11px] text-slate-500 xl:inline-flex">
            <Camera className="h-3.5 w-3.5" />
            POV:
          </span>
          {CAMERA_ANGLES.map((angle) => {
            const active = cameraAngle === angle.id;
            return (
              <button
                key={angle.id}
                type="button"
                onClick={() => onSelectAngle(angle.id)}
                className={`whitespace-nowrap rounded px-2 py-1 text-[10px] font-medium transition-colors md:px-2.5 md:text-[11px] ${
                  active
                    ? 'border border-sky-500/40 bg-sky-500/20 text-sky-300'
                    : 'border border-transparent text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <span className="mr-1 hidden font-mono-tabular text-[10px] opacity-70 sm:inline">
                  [{angle.shortcut}]
                </span>
                <span className="lg:hidden">{angle.shortLabel}</span>
                <span className="hidden lg:inline">{angle.label}</span>
              </button>
            );
          })}
        </div>

        <div className="pointer-events-auto flex shrink-0 items-center gap-1.5 md:gap-2">
          <div className="hidden items-center gap-1.5 rounded-md border border-slate-800 bg-[#0e141f] px-2.5 py-1 text-[11px] text-slate-300 sm:flex">
            <span className="hidden text-slate-400 md:inline">Tugas</span>
            <span className="font-mono-tabular font-semibold text-sky-300">
              {completedCount}/{tasks.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleMute}
            className="rounded-md border border-slate-800 bg-[#0e141f] p-1 text-slate-300 transition-colors hover:border-slate-700 hover:text-white md:p-1.5"
            aria-label={muted ? 'Nyalakan Audio' : 'Bisukan Audio'}
          >
            {muted ? <VolumeX className="h-3.5 w-3.5 md:h-4 md:w-4" /> : <Volume2 className="h-3.5 w-3.5 md:h-4 md:w-4" />}
          </button>

          {stats.phase === 'playing' && (
            <button
              type="button"
              onClick={onRestart}
              className="rounded-md border border-slate-800 bg-[#0e141f] p-1 text-slate-300 transition-colors hover:border-slate-700 hover:text-white md:p-1.5"
              aria-label="Reset Sesi"
            >
              <RotateCcw className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </button>
          )}

          {isCompactViewport && (
            <button
              type="button"
              onClick={requestLandscapeMode}
              className="rounded-md border border-slate-800 bg-[#0e141f] p-1 text-slate-300 transition-colors hover:border-slate-700 hover:text-white md:p-1.5"
              aria-label="Layar Penuh Landscape"
              title="Layar Penuh"
            >
              <Maximize2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onOpenInternetSettings}
            className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-[#0e141f] px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:border-sky-500/60 hover:text-sky-300 whitespace-nowrap shrink-0 md:px-2.5 md:py-1.5 md:text-xs"
            aria-label="Setting Internet & Wi-Fi"
          >
            <Globe className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden sm:inline">Setting Internet</span>
          </button>

          {(stats.phase !== 'ready' || customizerOpen) && (
            <button
              type="button"
              onClick={onToggleCustomizer}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 md:px-2.5 md:py-1.5 md:text-xs ${
                customizerOpen
                  ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                  : 'border-slate-800 bg-[#0e141f] text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
              aria-label="Ubah Kostum dan Karakter Teknisi"
            >
              <Shirt className="h-3.5 w-3.5 text-sky-400" />
              <span className="hidden sm:inline">Ubah Kostum</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleNotepad}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 md:px-2.5 md:py-1.5 md:text-xs ${
              notepadOpen
                ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                : 'border-slate-800 bg-[#0e141f] text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
            aria-label="Atur Posisi Orang via Notepad"
          >
            <FileText className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden sm:inline">Notepad</span>
          </button>

          <button
            type="button"
            onClick={onOpenGdd}
            className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-[#0e141f] px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-white whitespace-nowrap shrink-0 md:px-2.5 md:py-1.5 md:text-xs"
          >
            <BookOpen className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden sm:inline">GDD</span>
          </button>

          <button
            type="button"
            onClick={onBackToTitle}
            className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-[#0e141f] px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-white whitespace-nowrap shrink-0 md:px-2.5 md:py-1.5 md:text-xs"
            aria-label="Kembali ke Judul Game"
            title="Kembali ke Layar Judul"
          >
            <Home className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden md:inline">Judul</span>
          </button>
        </div>
      </header>

      {/* First-Person Center Reticle */}
      {stats.phase === 'playing' && cameraAngle === 'first_person' && !zoomActive && (
        <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center">
          <div
            className={`h-1.5 w-1.5 rounded-sm transition-transform duration-150 ${
              hoveredTarget ? 'scale-150 bg-sky-400' : 'bg-slate-400/50'
            }`}
          />
        </div>
      )}

      {/* Left-Side Case Study Checklist (Hidden while zoomed in on hardware) */}
      {stats.phase === 'playing' && !zoomActive && (
        <aside className="pointer-events-none fixed left-2.5 top-12 z-20 flex items-start gap-1.5 md:left-4 md:top-14">
          {!checklistCollapsed && (
            <div className="pointer-events-auto max-h-[calc(100vh-5rem)] w-64 overflow-y-auto rounded-lg border border-slate-800 bg-[#0b1017]/95 p-2.5 shadow-xl md:w-72 md:p-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 md:text-[11px]">
                  Studi Kasus · 16 Ruangan
                </span>
                <span className="font-mono-tabular text-[11px] text-sky-400">
                  {completedCount}/{tasks.length}
                </span>
              </div>

              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded bg-slate-800">
                <div
                  className="h-full bg-sky-400 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="mt-2 font-mono-tabular text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Infrastruktur Jaringan
              </div>
              <div className="mt-0.5 divide-y divide-slate-800/60">
                {infraTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => {
                      onWalkToTarget(task.targetId);
                      if (isCompactViewport) setChecklistCollapsed(true);
                    }}
                    className="group flex w-full items-start gap-2 py-1 text-left text-[11px] transition-colors hover:bg-slate-800/40 md:gap-2.5 md:py-1.5 md:text-xs"
                  >
                    <div
                      className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border md:h-4 md:w-4 ${
                        task.done
                          ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-400'
                          : 'border-slate-700 bg-slate-900 text-transparent group-hover:border-sky-500/60'
                      }`}
                    >
                      <Check className="h-2.5 w-2.5 md:h-3 md:w-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={
                          task.done
                            ? 'text-slate-500 line-through'
                            : 'text-slate-200 group-hover:text-sky-300'
                        }
                      >
                        {task.label}
                      </div>
                      <div className="flex items-center justify-between font-mono-tabular text-[10px] text-slate-500">
                        <span>{task.room}</span>
                        {!task.done && (
                          <span className="text-sky-400 opacity-0 transition-opacity group-hover:opacity-100">
                            Pergi →
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-2 border-t border-slate-800/80 pt-2 font-mono-tabular text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                Benerin PC Karyawan
              </div>
              <div className="mt-0.5 divide-y divide-slate-800/60">
                {pcTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => {
                      onWalkToTarget(task.targetId);
                      if (isCompactViewport) setChecklistCollapsed(true);
                    }}
                    className="group flex w-full items-start gap-2 py-1 text-left text-[11px] transition-colors hover:bg-slate-800/40 md:gap-2.5 md:py-1.5 md:text-xs"
                  >
                    <div
                      className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border md:h-4 md:w-4 ${
                        task.done
                          ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-400'
                          : 'border-slate-700 bg-slate-900 text-transparent group-hover:border-sky-500/60'
                      }`}
                    >
                      <Check className="h-2.5 w-2.5 md:h-3 md:w-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={
                          task.done
                            ? 'text-slate-500 line-through'
                            : 'text-slate-200 group-hover:text-sky-300'
                        }
                      >
                        {task.label}
                      </div>
                      <div className="flex items-center justify-between font-mono-tabular text-[10px] text-slate-500">
                        <span>{task.room}</span>
                        {!task.done && (
                          <span className="text-sky-400 opacity-0 transition-opacity group-hover:opacity-100">
                            Pergi →
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-2 border-t border-slate-800/80 pt-2 font-mono-tabular text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                Laporan Akhir Direksi
              </div>
              <div className="mt-0.5 divide-y divide-slate-800/60">
                {reportTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => {
                      onWalkToTarget(task.targetId);
                      if (isCompactViewport) setChecklistCollapsed(true);
                    }}
                    className={`group flex w-full items-start gap-2 rounded py-1 text-left text-[11px] transition-colors hover:bg-slate-800/40 md:gap-2.5 md:py-1.5 md:text-xs ${
                      allTechDone && !task.done ? 'bg-amber-500/10 px-1.5 ring-1 ring-amber-400/40' : ''
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border md:h-4 md:w-4 ${
                        task.done
                          ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-400'
                          : allTechDone
                            ? 'border-amber-400 bg-amber-500/20 text-transparent'
                            : 'border-slate-700 bg-slate-900 text-transparent group-hover:border-sky-500/60'
                      }`}
                    >
                      <Check className="h-2.5 w-2.5 md:h-3 md:w-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={
                          task.done
                            ? 'text-slate-500 line-through'
                            : allTechDone
                              ? 'font-semibold text-amber-200'
                              : 'text-slate-200 group-hover:text-sky-300'
                        }
                      >
                        {task.label}
                      </div>
                      <div className="flex items-center justify-between font-mono-tabular text-[10px] text-slate-500">
                        <span>{task.room}</span>
                        {!task.done && (
                          <span className="text-amber-300 opacity-90">
                            {allTechDone ? 'Lapor →' : 'Tunggu 9/9'}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-slate-800/80 pt-2">
                <button
                  type="button"
                  onClick={onOpenInternetSettings}
                  className="flex items-center justify-center gap-1 rounded-md border border-sky-500/40 bg-sky-500/10 px-2 py-1.5 text-[11px] font-medium text-sky-300 transition-colors hover:bg-sky-500/20 whitespace-nowrap shrink-0"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Setting Internet
                </button>
                <button
                  type="button"
                  onClick={onOpenCli}
                  className="flex items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-[11px] font-medium text-slate-200 transition-colors hover:border-sky-500/50 hover:text-sky-300 whitespace-nowrap shrink-0"
                >
                  <Terminal className="h-3.5 w-3.5 text-sky-400" />
                  Terminal CLI
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setChecklistCollapsed((c) => !c)}
            className="pointer-events-auto inline-flex items-center gap-1 rounded-md border border-slate-800 bg-[#0b1017]/95 px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:text-slate-100 md:p-1.5"
            aria-label={checklistCollapsed ? 'Tampilkan Daftar Tugas' : 'Sembunyikan Daftar Tugas'}
          >
            {checklistCollapsed ? (
              <>
                <span className="font-mono-tabular text-sky-400 lg:hidden">
                  Tugas {completedCount}/{tasks.length}
                </span>
                <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </>
            ) : (
              <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
            )}
          </button>
        </aside>
      )}

      {/* Right-Side 10-Room Navigator (Hidden while zoomed in or while style drawer open) */}
      {stats.phase === 'playing' && !customizerOpen && !zoomActive && (
        <aside className="pointer-events-none fixed right-2.5 top-12 z-20 flex items-start gap-1.5 md:right-4 md:top-14">
          <button
            type="button"
            onClick={() => setRoomsCollapsed((c) => !c)}
            className="pointer-events-auto inline-flex items-center gap-1 rounded-md border border-slate-800 bg-[#0b1017]/95 px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:text-slate-100 md:p-1.5"
            aria-label={roomsCollapsed ? 'Tampilkan Peta 16 Ruangan' : 'Sembunyikan Peta 16 Ruangan'}
          >
            {roomsCollapsed ? (
              <>
                <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <Compass className="h-3.5 w-3.5 text-sky-400 lg:hidden" />
                <span className="lg:hidden">16 Ruang</span>
              </>
            ) : (
              <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
            )}
          </button>

          {!roomsCollapsed && (
            <div className="pointer-events-auto max-h-[calc(100vh-5rem)] w-52 overflow-y-auto rounded-lg border border-slate-800 bg-[#0b1017]/95 p-2 shadow-xl md:w-56 md:p-2.5">
              <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 md:text-[11px]">
                <Compass className="h-3.5 w-3.5 text-sky-400" />
                <span>Kunjungi 16 Ruangan</span>
              </div>
              <div className="mt-1 grid grid-cols-1 gap-0.5 md:gap-1">
                {OFFICE_ROOMS.map((rm) => {
                  const isCurrent = stats.currentRoom === rm.id;
                  const badge = getRoomTaskBadge(rm.id);
                  return (
                    <button
                      key={rm.id}
                      type="button"
                      onClick={() => {
                        onWalkToRoom(rm.id);
                        if (isCompactViewport) setRoomsCollapsed(true);
                      }}
                      className={`flex items-center justify-between gap-2 rounded px-2 py-1 text-left text-[11px] transition-colors ${
                        isCurrent
                          ? 'border border-sky-500/40 bg-sky-500/15 font-semibold text-sky-300'
                          : 'border border-transparent text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="font-mono-tabular text-[10px] text-sky-400">
                          {rm.code}
                        </span>
                        <span className="truncate">{rm.label}</span>
                      </span>
                      {badge === 'done' && (
                        <Check className="h-3 w-3 shrink-0 text-emerald-400" />
                      )}
                      {badge === 'pending' && (
                        <span className="font-mono-tabular text-[9px] text-amber-400">
                          TASK
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      )}

      {/* Bottom Interactive Hover Tooltip, Action Notice, and Technician Hand State */}
      {stats.phase === 'playing' && !zoomActive && (
        <div className="pointer-events-none fixed inset-x-0 bottom-2.5 z-20 flex items-end justify-between px-3 md:bottom-4 md:px-6">
          <div className="hidden w-40 lg:block" />

          <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
            {notice && (
              <div className="max-w-md rounded-md border border-sky-500/40 bg-[#0b1017]/95 px-3 py-1 text-[11px] font-medium text-sky-200 shadow-lg md:px-3.5 md:py-1.5 md:text-xs">
                {notice}
              </div>
            )}

            {isSeated && !hoveredNpc && !hoveredTarget && (
              <div className="pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl border border-emerald-400/45 bg-[#0b111c]/95 px-3 py-1.5 text-left shadow-xl">
                <Armchair className="h-4 w-4 shrink-0 text-emerald-400" />
                <div className="min-w-0 flex-1 text-[11px] text-slate-200">
                  <span className="font-semibold text-emerald-300">Sedang Duduk</span>
                  <span className="text-slate-400"> · </span>
                  <span className="text-slate-300">Tekan WASD untuk jalan</span>
                </div>
                <button
                  type="button"
                  onClick={onToggleSit}
                  className="shrink-0 whitespace-nowrap rounded-md bg-emerald-400 px-2.5 py-1 text-[11px] font-semibold text-slate-950 transition-colors hover:bg-emerald-300"
                >
                  Berdiri [F]
                </button>
              </div>
            )}

            {nearbyDoor && !hoveredNpc && !hoveredTarget && (
              <div className="pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl border border-amber-400/50 bg-[#0b111c]/95 px-3 py-1.5 text-left shadow-xl">
                {nearbyDoor.open ? (
                  <DoorOpen className="h-4 w-4 shrink-0 text-amber-400" />
                ) : (
                  <DoorClosed className="h-4 w-4 shrink-0 text-amber-400" />
                )}
                <div className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-100">
                  <span className="font-semibold text-amber-300">{nearbyDoor.label}</span>
                  <span className="text-slate-400"> · </span>
                  <span className="text-slate-200">{nearbyDoor.open ? 'Terbuka' : 'Tertutup'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleDoor(nearbyDoor.id)}
                  className="shrink-0 whitespace-nowrap rounded-md bg-amber-400 px-2.5 py-1 text-[11px] font-semibold text-slate-950 transition-colors hover:bg-amber-300"
                >
                  {nearbyDoor.open ? 'Tutup Pintu [G]' : 'Buka Pintu [G]'}
                </button>
              </div>
            )}

            {!isSeated && nearbySeat && !nearbyNpc && !hoveredNpc && !hoveredTarget && (
              <div className="pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl border border-sky-400/45 bg-[#0b111c]/95 px-3 py-1.5 text-left shadow-xl">
                <Armchair className="h-4 w-4 shrink-0 text-sky-400" />
                <div className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-100">
                  <span className="text-slate-400">Dekat </span>
                  <span className="font-semibold text-sky-300">{nearbySeat.label}</span>
                </div>
                <button
                  type="button"
                  onClick={onToggleSit}
                  className="shrink-0 whitespace-nowrap rounded-md bg-sky-400 px-2.5 py-1 text-[11px] font-semibold text-slate-950 transition-colors hover:bg-sky-300"
                >
                  Duduk [F]
                </button>
              </div>
            )}

            {nearbyNpc && !hoveredNpc && !hoveredTarget && (
              <div className="pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl border border-amber-400/45 bg-[#0b111c]/95 px-3 py-2 text-left shadow-xl">
                <MessageCircle className="h-4 w-4 shrink-0 text-amber-400" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] font-medium text-slate-100">
                    <span className="font-semibold text-amber-300">{nearbyNpc.name.split(' ')[0]}</span>
                    <span className="text-slate-400"> · </span>
                    <span className="text-slate-200">{nearbyNpc.teaser}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onTalkToNpc(nearbyNpc.npcId)}
                  className="shrink-0 whitespace-nowrap rounded-md bg-amber-400 px-2.5 py-1 text-[11px] font-semibold text-slate-950 transition-colors hover:bg-amber-300"
                >
                  Bicara [T]
                </button>
              </div>
            )}

            {hoveredNpc && (
              <div className="rounded-lg border border-amber-400/40 bg-[#0b111c]/95 px-3.5 py-1.5 shadow-xl">
                <div className="text-xs font-semibold text-amber-200">
                  {hoveredNpc.name} · <span className="font-normal text-slate-400">{hoveredNpc.role}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-200">
                  {hoveredNpc.answered || hoveredNpc.taskDone
                    ? 'Klik untuk mengobrol'
                    : `“${hoveredNpc.teaser}”`}
                </div>
              </div>
            )}

            {!hoveredNpc && hoveredTarget && (
              <div className="rounded-md border border-slate-700 bg-[#0b1017]/95 px-3 py-1.5 shadow-xl md:px-4 md:py-2">
                <div className="text-[11px] font-semibold text-slate-100 md:text-xs">
                  {hoveredTarget.title}
                </div>
                <div
                  className={`mt-0.5 text-[10px] md:text-[11px] ${
                    hoveredTarget.ready ? 'text-sky-300' : 'text-amber-300'
                  }`}
                >
                  {hoveredTarget.actionHint}
                </div>
              </div>
            )}
          </div>

          <div className="pointer-events-auto flex shrink-0 items-center gap-1.5 rounded-md border border-slate-800 bg-[#0b1017]/95 px-2.5 py-1.5 text-[11px] shadow-lg md:gap-2 md:px-3 md:py-2 md:text-xs">
            <Cable
              className={`h-3.5 w-3.5 md:h-4 md:w-4 ${
                stats.hasCableInHand ? 'text-sky-400' : 'text-slate-500'
              }`}
            />
            <div className="text-left">
              <div className="hidden text-[10px] uppercase tracking-wider text-slate-500 md:block">
                Dibawa Teknisi
              </div>
              <div
                className={`font-medium ${
                  stats.hasCableInHand ? 'text-sky-300' : 'text-slate-300'
                }`}
              >
                {stats.hasCableInHand ? 'Kabel Cat6' : 'Tangan Kosong'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Report Modal */}
      {stats.phase === 'ended' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-3 md:p-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-700 bg-[#0b1017] p-4 shadow-2xl md:p-6">
            <div className="font-mono-tabular text-[11px] uppercase tracking-wider text-sky-400">
              Laporan Penyelesaian Studi Kasus
            </div>
            <h2 className="mt-1 text-lg font-semibold text-slate-100 md:text-xl">
              Seluruh Infrastruktur &amp; PC Karyawan Pulih
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Seluruh jaringan kabel, Wi-Fi Access Point, Rak Server, layanan DHCP, PC karyawan telah pulih, dan laporan akhir sudah diserahkan ke Direktur Utama di R.15 Ruang Bos.
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2.5 rounded-md border border-slate-800 bg-[#070a0f] p-2.5 text-xs md:mt-4 md:p-3">
              <div>
                <div className="text-slate-500">Tugas Selesai</div>
                <div className="mt-0.5 font-mono-tabular text-sm font-semibold text-emerald-400">
                  {completedCount}/{tasks.length} Langkah
                </div>
              </div>
              <div>
                <div className="text-slate-500">Akurasi Diagnosa</div>
                <div className="mt-0.5 font-mono-tabular text-sm font-semibold text-sky-300">
                  {learningAccuracyPct}% ({stats.learningCorrectCount}/{Math.max(1, stats.learningAttemptsCount)})
                </div>
              </div>
              <div>
                <div className="text-slate-500">Komunikasi Staf</div>
                <div className="mt-0.5 font-mono-tabular text-sm font-semibold text-amber-300">
                  {stats.consultedNpcs.length}/{OFFICE_NPC_LIST.length} Staf
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-1 border-t border-slate-800 pt-2.5 text-xs md:mt-4 md:space-y-1.5 md:pt-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-slate-300">{task.label}</span>
                  <span
                    className={`shrink-0 font-mono-tabular ${
                      task.done ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {task.done ? 'OK' : 'PENDING'}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-2 md:mt-5">
              <button
                type="button"
                onClick={onBackToTitle}
                className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:text-white"
              >
                <Home className="h-3.5 w-3.5" />
                Kembali ke Judul
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="inline-flex items-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Ulangi Simulasi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
