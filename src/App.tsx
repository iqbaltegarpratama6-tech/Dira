import React, { useEffect, useRef, useState } from 'react';
import {
  CameraAngleId,
  DEFAULT_INTERNET_SETTINGS,
  DEFAULT_TECHNICIAN_APPEARANCE,
  NearbyDoorInfo,
  NearbyNpcInfo,
  NearbySeatInfo,
  OfficeNpcId,
  RoomDoorId,
  RoomId,
  TechnicianAppearance,
  WorkstationStats,
  WorkstationTargetId,
  WorkstationTargetInfo,
  withTechnicianGender,
} from './types/game';
import { sfx } from './audio/sfx';
import { chillMusic, ChillMusicState, ChillVibeId } from './audio/chillMusic';
import {
  ITOfficeSimulationCanvas,
  WorkstationControllerBridge,
} from './components/ITOfficeSimulationCanvas';
import { GameHUD } from './components/GameHUD';
import { GameTitleScreen } from './components/GameTitleScreen';
import { CrimpingModal } from './components/CrimpingModal';
import { NetworkCLIModal, NetworkModalTab } from './components/NetworkCLIModal';
import { GDDStudioView } from './components/GDDStudioView';
import { TechnicianStyleDrawer } from './components/TechnicianStyleDrawer';
import { CaseStudyModal } from './components/CaseStudyModal';
import { NpcQuestionModal } from './components/NpcQuestionModal';
import { BossReportModal } from './components/BossReportModal';
import { PeopleNotepadDrawer } from './components/PeopleNotepadDrawer';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#090d14] p-6 text-slate-100">
          <div className="max-w-lg rounded-lg border border-rose-500/40 bg-[#0b1017] p-6">
            <h1 className="text-lg font-semibold text-white">Terjadi Gangguan Render</h1>
            <p className="mt-2 font-mono-tabular text-xs text-rose-300">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950"
            >
              Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const DEFAULT_STATS: WorkstationStats = {
  phase: 'playing',
  currentRoom: 'corridor',
  timeRemaining: 300,
  totalTime: 300,
  hasCableInHand: false,
  port1Connected: false,
  port2Connected: false,
  cablesTidied: false,
  apConfigured: false,
  rackChecked: false,
  dhcpActive: false,
  vlan10Active: false,
  vlan20Active: false,
  crimpingVerified: false,
  receptionPcFixed: false,
  osReinstalled: false,
  meetingLaptopFixed: false,
  bossReported: false,
  learningCorrectCount: 0,
  learningAttemptsCount: 0,
  consultedNpcs: [],
  internetSettings: { ...DEFAULT_INTERNET_SETTINGS },
  victory: false,
};

export default function App() {
  const [viewMode, setViewMode] = useState<'title' | 'play' | 'gdd'>('title');
  const [gddReturnView, setGddReturnView] = useState<'title' | 'play'>('title');
  const [phase, setPhase] = useState<'ready' | 'playing' | 'ended'>('playing');
  const [cameraAngle, setCameraAngle] = useState<CameraAngleId>('follow_back');
  const [stats, setStats] = useState<WorkstationStats>(DEFAULT_STATS);
  const [hoveredTarget, setHoveredTarget] = useState<WorkstationTargetInfo | null>(null);
  const [hoveredNpc, setHoveredNpc] = useState<NearbyNpcInfo | null>(null);
  const [nearbyNpc, setNearbyNpc] = useState<NearbyNpcInfo | null>(null);
  const [nearbySeat, setNearbySeat] = useState<NearbySeatInfo | null>(null);
  const [isSeated, setIsSeated] = useState(false);
  const [nearbyDoor, setNearbyDoor] = useState<NearbyDoorInfo | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cliOpen, setCliOpen] = useState(false);
  const [cliInitialTab, setCliInitialTab] = useState<NetworkModalTab>('internet');
  const [crimpingOpen, setCrimpingOpen] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [notepadOpen, setNotepadOpen] = useState(false);
  const [caseStudyTarget, setCaseStudyTarget] = useState<WorkstationTargetId | null>(null);
  const [activeNpcId, setActiveNpcId] = useState<OfficeNpcId | null>(null);
  const [bossReportOpen, setBossReportOpen] = useState(false);
  const [appearance, setAppearance] = useState<TechnicianAppearance>(
    DEFAULT_TECHNICIAN_APPEARANCE
  );
  const [muted, setMuted] = useState(false);
  const [musicState, setMusicState] = useState<ChillMusicState>(() => chillMusic.getState());

  const controllerRef = useRef<WorkstationControllerBridge | null>(null);

  useEffect(() => {
    const unsubscribe = chillMusic.subscribe(setMusicState);
    chillMusic.armAutoStartOnGesture();
    return unsubscribe;
  }, []);

  const handlePlayGame = () => {
    setCliOpen(false);
    setCrimpingOpen(false);
    setCustomizerOpen(false);
    setNotepadOpen(false);
    setCaseStudyTarget(null);
    setActiveNpcId(null);
    setBossReportOpen(false);
    setHoveredTarget(null);
    setHoveredNpc(null);
    setNearbyNpc(null);
    setNearbySeat(null);
    setIsSeated(false);
    setNearbyDoor(null);
    setNotice(null);
    setStats({ ...DEFAULT_STATS, phase: 'playing' });
    setPhase('playing');
    setViewMode('play');
  };

  const handleBackToTitle = () => {
    setCliOpen(false);
    setCrimpingOpen(false);
    setCustomizerOpen(false);
    setNotepadOpen(false);
    setCaseStudyTarget(null);
    setActiveNpcId(null);
    setBossReportOpen(false);
    setHoveredTarget(null);
    setHoveredNpc(null);
    setNearbyNpc(null);
    setNearbySeat(null);
    setIsSeated(false);
    setNearbyDoor(null);
    setNotice(null);
    setViewMode('title');
  };

  const handleRestart = () => {
    setCliOpen(false);
    setCrimpingOpen(false);
    setCustomizerOpen(false);
    setNotepadOpen(false);
    setCaseStudyTarget(null);
    setActiveNpcId(null);
    setBossReportOpen(false);
    setHoveredNpc(null);
    setNearbyNpc(null);
    setNearbySeat(null);
    setIsSeated(false);
    setNearbyDoor(null);
    setPhase('playing');
    controllerRef.current?.restartSession();
  };

  const handleSelectAngle = (angle: CameraAngleId) => {
    setCameraAngle(angle);
    controllerRef.current?.setCameraAngle(angle);
  };

  const handleWalkToRoom = (roomId: RoomId) => {
    controllerRef.current?.walkToRoom(roomId);
  };

  const handleWalkToTarget = (targetId: WorkstationTargetId) => {
    controllerRef.current?.walkToTarget(targetId);
  };

  const handleToggleMute = () => {
    const next = !muted;
    sfx.muted = next;
    chillMusic.setMuted(next);
    setMuted(next);
  };

  const handleToggleMusicPlay = () => {
    if (muted) {
      sfx.muted = false;
      chillMusic.setMuted(false);
      setMuted(false);
    }
    chillMusic.toggle();
  };

  const handleSelectMusicVibe = (vibe: ChillVibeId) => {
    if (muted) {
      sfx.muted = false;
      chillMusic.setMuted(false);
      setMuted(false);
    }
    chillMusic.setVibe(vibe);
    if (!chillMusic.getState().isPlaying || !chillMusic.getState().unlocked) {
      chillMusic.play();
    }
  };

  const handleChangeMusicVolume = (volume: number) => {
    if (muted && volume > 0) {
      sfx.muted = false;
      chillMusic.setMuted(false);
      setMuted(false);
    }
    chillMusic.setVolume(volume);
  };

  const handleAppearanceChange = (next: TechnicianAppearance) => {
    setAppearance(next);
    controllerRef.current?.setTechnicianAppearance(next);
  };

  const handleStatsChange = (nextStats: WorkstationStats) => {
    setStats(nextStats);
    if (nextStats.phase !== phase && nextStats.phase === 'ended') {
      setCliOpen(false);
      setCrimpingOpen(false);
      setCustomizerOpen(false);
      setNotepadOpen(false);
      setCaseStudyTarget(null);
      setActiveNpcId(null);
      setBossReportOpen(false);
      setPhase('ended');
    }
  };

  if (viewMode === 'gdd') {
    return (
      <AppErrorBoundary>
        <GDDStudioView onBackToGame={() => setViewMode(gddReturnView)} />
      </AppErrorBoundary>
    );
  }

  if (viewMode === 'title') {
    return (
      <AppErrorBoundary>
        <GameTitleScreen
          appearance={appearance}
          muted={muted}
          musicState={musicState}
          onChangeGender={(gender) => handleAppearanceChange(withTechnicianGender(appearance, gender))}
          onChangeColorway={(colorway) => handleAppearanceChange({ ...appearance, colorway })}
          onToggleMute={handleToggleMute}
          onToggleMusicPlay={handleToggleMusicPlay}
          onSelectMusicVibe={handleSelectMusicVibe}
          onChangeMusicVolume={handleChangeMusicVolume}
          onPlayGame={handlePlayGame}
          onOpenGdd={() => {
            setGddReturnView('title');
            setViewMode('gdd');
          }}
        />
      </AppErrorBoundary>
    );
  }

  const zoomTarget: WorkstationTargetId | null =
    caseStudyTarget ??
    (bossReportOpen
      ? 'boss_report'
      : cliOpen
        ? 'cli_monitor'
        : crimpingOpen
          ? 'crimper_tool'
          : null);

  return (
    <AppErrorBoundary>
      <div className="relative h-screen w-screen overflow-hidden bg-[#9fb3c8]">
        <ITOfficeSimulationCanvas
          phase={phase}
          cameraAngle={cameraAngle}
          modalPaused={
            cliOpen ||
            crimpingOpen ||
            customizerOpen ||
            caseStudyTarget !== null ||
            activeNpcId !== null ||
            bossReportOpen
          }
          zoomTarget={zoomTarget}
          activeNpcId={activeNpcId}
          appearance={appearance}
          customizerOpen={customizerOpen}
          onStatsChange={handleStatsChange}
          onCameraAngleChange={setCameraAngle}
          onHoverChange={setHoveredTarget}
          onHoverNpcChange={setHoveredNpc}
          onNearbyNpcChange={setNearbyNpc}
          onNearbySeatChange={setNearbySeat}
          onSeatedChange={setIsSeated}
          onNearbyDoorChange={setNearbyDoor}
          onNoticeChange={setNotice}
          onOpenCli={() => {
            setCustomizerOpen(false);
            setCaseStudyTarget(null);
            setActiveNpcId(null);
            setBossReportOpen(false);
            setCliInitialTab('cli');
            setCliOpen(true);
          }}
          onOpenCrimping={() => {
            setCustomizerOpen(false);
            setCaseStudyTarget(null);
            setActiveNpcId(null);
            setBossReportOpen(false);
            setCrimpingOpen(true);
          }}
          onOpenCaseStudy={(targetId) => {
            setCustomizerOpen(false);
            setCliOpen(false);
            setCrimpingOpen(false);
            setActiveNpcId(null);
            setBossReportOpen(false);
            setCaseStudyTarget(targetId);
          }}
          onOpenNpcQuestion={(npcId) => {
            setCustomizerOpen(false);
            setCliOpen(false);
            setCrimpingOpen(false);
            setCaseStudyTarget(null);
            setBossReportOpen(false);
            setActiveNpcId(npcId);
          }}
          onOpenBossReport={() => {
            setCustomizerOpen(false);
            setCliOpen(false);
            setCrimpingOpen(false);
            setCaseStudyTarget(null);
            setActiveNpcId(null);
            setBossReportOpen(true);
          }}
          controllerRef={controllerRef}
        />

        <GameHUD
          stats={stats}
          cameraAngle={cameraAngle}
          hoveredTarget={hoveredTarget}
          hoveredNpc={hoveredNpc}
          nearbyNpc={nearbyNpc}
          nearbySeat={nearbySeat}
          isSeated={isSeated}
          nearbyDoor={nearbyDoor}
          notice={notice}
          muted={muted}
          customizerOpen={customizerOpen}
          notepadOpen={notepadOpen}
          zoomActive={zoomTarget !== null || activeNpcId !== null}
          onRestart={handleRestart}
          onBackToTitle={handleBackToTitle}
          onSelectAngle={handleSelectAngle}
          onWalkToRoom={handleWalkToRoom}
          onWalkToTarget={handleWalkToTarget}
          onTalkToNpc={(npcId) => controllerRef.current?.walkToNpc(npcId)}
          onToggleSit={() => controllerRef.current?.toggleSit()}
          onToggleDoor={(doorId?: RoomDoorId) => controllerRef.current?.toggleDoor(doorId)}
          onToggleMute={handleToggleMute}
          onToggleCustomizer={() => {
            setActiveNpcId(null);
            setNotepadOpen(false);
            setCustomizerOpen((open) => !open);
          }}
          onToggleNotepad={() => {
            setActiveNpcId(null);
            setCustomizerOpen(false);
            setNotepadOpen((open) => !open);
          }}
          onOpenCli={() => {
            setCustomizerOpen(false);
            setNotepadOpen(false);
            setCaseStudyTarget(null);
            setActiveNpcId(null);
            setCliInitialTab('cli');
            setCliOpen(true);
          }}
          onOpenInternetSettings={() => {
            setCustomizerOpen(false);
            setNotepadOpen(false);
            setCaseStudyTarget(null);
            setActiveNpcId(null);
            setCliInitialTab('internet');
            setCliOpen(true);
          }}
          onOpenGdd={() => {
            setGddReturnView('play');
            setViewMode('gdd');
          }}
        />

        <NpcQuestionModal
          npcId={activeNpcId}
          stats={stats}
          onClose={() => setActiveNpcId(null)}
          onAnswerRecorded={(npcId, firstTryCorrect, totalAttempts) => {
            controllerRef.current?.recordNpcConsultation(
              npcId,
              firstTryCorrect,
              totalAttempts
            );
          }}
          onInspectStation={(targetId) => {
            setActiveNpcId(null);
            controllerRef.current?.walkToTarget(targetId);
          }}
        />

        <CaseStudyModal
          targetId={caseStudyTarget}
          stats={stats}
          onClose={() => setCaseStudyTarget(null)}
          onGoToCableStorage={() => {
            setCaseStudyTarget(null);
            controllerRef.current?.walkToTarget('utp_spool');
          }}
          onPreviewStage={(id, stage) => {
            controllerRef.current?.previewCaseStudyStage(id, stage);
          }}
          onResolve={(id, firstTryCorrect, totalAttempts) => {
            controllerRef.current?.resolveCaseStudy(id, firstTryCorrect, totalAttempts);
          }}
        />

        <TechnicianStyleDrawer
          open={customizerOpen}
          appearance={appearance}
          onChange={handleAppearanceChange}
          onClose={() => setCustomizerOpen(false)}
        />

        <PeopleNotepadDrawer
          open={notepadOpen}
          onClose={() => setNotepadOpen(false)}
          onApplyPositions={(rawTxt, options) =>
            controllerRef.current?.applyPeoplePositions(rawTxt, options)
          }
          onGetPlayerPosition={() => controllerRef.current?.getPlayerPosition()}
        />

        <CrimpingModal
          open={crimpingOpen}
          onClose={() => setCrimpingOpen(false)}
          onSuccess={() => {
            setCrimpingOpen(false);
            controllerRef.current?.completeCrimping();
          }}
        />

        <NetworkCLIModal
          open={cliOpen}
          initialTab={cliInitialTab}
          vlan10Active={stats.vlan10Active}
          vlan20Active={stats.vlan20Active}
          dhcpActive={stats.dhcpActive}
          apConfigured={stats.apConfigured}
          rackChecked={stats.rackChecked}
          port1Connected={stats.port1Connected}
          port2Connected={stats.port2Connected}
          internetSettings={stats.internetSettings}
          onClose={() => setCliOpen(false)}
          onApplyConfig={(updates) => controllerRef.current?.applyCliConfig(updates)}
        />

        <BossReportModal
          open={bossReportOpen}
          stats={stats}
          onClose={() => setBossReportOpen(false)}
          onSubmitReport={() => {
            setBossReportOpen(false);
            controllerRef.current?.submitBossReport();
          }}
        />
      </div>
    </AppErrorBoundary>
  );
}
