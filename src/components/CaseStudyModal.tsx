import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  HelpCircle,
  Search,
  Wrench,
  X,
  ZoomIn,
} from 'lucide-react';
import { CASE_STUDIES, CaseStudyOption } from '../data/caseStudies';
import { sfx } from '../audio/sfx';
import { WorkstationStats, WorkstationTargetId } from '../types/game';
import { WifiControlPanelSim } from './WifiControlPanelSim';
import { WindowsInstallSim } from './WindowsInstallSim';

function shuffleOptions(options: CaseStudyOption[]): CaseStudyOption[] {
  const arr = [...options];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface CaseStudyModalProps {
  targetId: WorkstationTargetId | null;
  stats: WorkstationStats;
  onClose: () => void;
  onGoToCableStorage: () => void;
  onPreviewStage: (targetId: WorkstationTargetId, stage: 'installing' | 'enabling') => void;
  onResolve: (targetId: WorkstationTargetId, firstTryCorrect: number, totalAttempts: number) => void;
}

function isTargetAlreadySolved(targetId: WorkstationTargetId, stats: WorkstationStats): boolean {
  switch (targetId) {
    case 'utp_spool':
      return stats.hasCableInHand || (stats.port1Connected && stats.port2Connected);
    case 'client_pc_1':
      return stats.port1Connected;
    case 'client_pc_2':
      return stats.port2Connected;
    case 'messy_cables':
      return stats.cablesTidied;
    case 'ap_mount':
      return stats.apConfigured;
    case 'server_rack':
      return stats.rackChecked;
    case 'employee_pc_reception':
      return stats.receptionPcFixed;
    case 'employee_pc_os':
      return stats.osReinstalled;
    case 'employee_pc_meeting':
      return stats.meetingLaptopFixed;
    default:
      return false;
  }
}

export const CaseStudyModal: React.FC<CaseStudyModalProps> = ({
  targetId,
  stats,
  onClose,
  onGoToCableStorage,
  onPreviewStage,
  onResolve,
}) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [shuffledOptions, setShuffledOptions] = useState<CaseStudyOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [wrongAttemptsOnStep, setWrongAttemptsOnStep] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    setStepIdx(0);
    setSelectedOptionId(null);
    setWrongAttemptsOnStep(0);
    setFirstTryCorrect(0);
    setTotalAttempts(0);
    setJustCompleted(false);
  }, [targetId]);

  useEffect(() => {
    if (!targetId) {
      setShuffledOptions([]);
      return;
    }
    const step = CASE_STUDIES[targetId]?.steps[stepIdx];
    setShuffledOptions(step ? shuffleOptions(step.options) : []);
  }, [targetId, stepIdx]);

  useEffect(() => {
    if (!targetId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [targetId, onClose]);

  if (!targetId) return null;
  const study = CASE_STUDIES[targetId];
  if (!study) return null;

  const alreadySolved = isTargetAlreadySolved(targetId, stats);
  const isCustomSim =
    targetId === 'employee_pc_meeting' || targetId === 'employee_pc_os';
  const needsCableFirst =
    (targetId === 'client_pc_1' || targetId === 'client_pc_2') &&
    !alreadySolved &&
    !stats.hasCableInHand;

  const currentStep = study.steps[stepIdx];
  const displayOptions = shuffledOptions.length > 0 ? shuffledOptions : (currentStep?.options ?? []);
  const selectedOption = displayOptions.find((o) => o.id === selectedOptionId) ?? null;
  const stepSolved = Boolean(selectedOption?.isCorrect);
  const isLastStep = stepIdx >= study.steps.length - 1;

  const handleChooseOption = (optId: string) => {
    if (stepSolved || !currentStep) return;
    const opt = displayOptions.find((o) => o.id === optId);
    if (!opt) return;

    setSelectedOptionId(optId);
    setTotalAttempts((t) => t + 1);

    if (opt.isCorrect) {
      sfx.playLaptopConnected();
      if (wrongAttemptsOnStep === 0) {
        setFirstTryCorrect((c) => c + 1);
      }
      if (targetId === 'employee_pc_os' && stepIdx === 0) {
        onPreviewStage('employee_pc_os', 'installing');
      }
    } else {
      sfx.playDrop();
      setWrongAttemptsOnStep((w) => w + 1);
    }
  };

  const handleProceed = () => {
    if (!stepSolved) return;
    if (!isLastStep) {
      setStepIdx((i) => i + 1);
      setSelectedOptionId(null);
      setWrongAttemptsOnStep(0);
      sfx.playCliCommand();
      return;
    }
    setJustCompleted(true);
    onResolve(targetId, firstTryCorrect, Math.max(study.steps.length, totalAttempts));
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex flex-col justify-between p-3 md:p-5">
      {/* Top-left Zoom Inspection Header (keeps 3D zoomed hardware center-left unobstructed) */}
      <div className="flex items-start justify-between gap-3 pt-10 md:pt-12">
        <div className="pointer-events-auto inline-flex items-center gap-2.5 rounded-lg border border-sky-500/40 bg-[#0b1017]/95 px-3 py-2 text-xs text-slate-100 shadow-xl">
          <ZoomIn className="h-4 w-4 shrink-0 text-sky-400" />
          <div className="min-w-0">
            <div className="font-medium text-sky-300">Mode Zoom Inspeksi 3D</div>
            <div className="truncate text-[11px] text-slate-400">
              {study.roomLabel} · {study.title}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-2 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white whitespace-nowrap shrink-0"
          >
            Keluar Zoom [Esc]
          </button>
        </div>
      </div>

      {/* Right-Docked Educational Case Study Panel */}
      <div
        className={`pointer-events-auto ml-auto flex max-h-[78vh] w-full flex-col overflow-hidden rounded-xl border border-slate-700/90 bg-[#0b1017]/96 shadow-2xl md:max-h-[82vh] ${
          isCustomSim ? 'max-w-lg' : 'max-w-md'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 bg-[#101722] px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-sky-400">
              <span>{study.category}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">{study.roomLabel}</span>
            </div>
            <h2 className="mt-0.5 text-sm font-semibold text-slate-100 md:text-base">
              {study.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            aria-label="Tutup Panel Studi Kasus"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3.5 overflow-y-auto p-4">
          {/* Symptom / Field Observation */}
          <div className="rounded-lg border border-slate-800 bg-[#070a0f] p-3">
            <div className="text-[11px] font-medium text-slate-400">Kondisi di Lapangan</div>
            <p className="mt-1 text-xs leading-relaxed text-slate-200">{study.symptomSummary}</p>
          </div>

          {justCompleted ? (
            <div className="space-y-3 rounded-lg border border-emerald-500/40 bg-emerald-950/25 p-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Perbaikan Berhasil Diterapkan!</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-200">
                Perubahan fisik dan status sistem langsung terlihat pada objek 3D di sebelah kiri.
              </p>
              {study.steps[study.steps.length - 1]?.learningNote && (
                <p className="text-xs leading-relaxed text-emerald-100/90">
                  {study.steps[study.steps.length - 1].learningNote}
                </p>
              )}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
                >
                  Selesai &amp; Lanjutkan Tugas
                </button>
              </div>
            </div>
          ) : alreadySolved ? (
            <div className="space-y-3 rounded-lg border border-emerald-500/35 bg-emerald-950/20 p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Studi Kasus Sudah Terselesaikan</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                {study.steps[study.steps.length - 1]?.learningNote}
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800"
                >
                  Kembali ke POV Normal
                </button>
              </div>
            </div>
          ) : targetId === 'employee_pc_meeting' ? (
            <WifiControlPanelSim
              wifiSsid={stats.internetSettings.wifiSsid}
              wifiPassword={stats.internetSettings.wifiPassword}
              onPreviewStage={(s) => onPreviewStage('employee_pc_meeting', s)}
              onComplete={(correct, attempts) => {
                setJustCompleted(true);
                onResolve('employee_pc_meeting', correct, attempts);
              }}
              onCancel={onClose}
            />
          ) : targetId === 'employee_pc_os' ? (
            <WindowsInstallSim
              onPreviewStage={(s) => onPreviewStage('employee_pc_os', s)}
              onComplete={(correct, attempts) => {
                setJustCompleted(true);
                onResolve('employee_pc_os', correct, attempts);
              }}
              onCancel={onClose}
            />
          ) : needsCableFirst ? (
            <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-950/20 p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <HelpCircle className="h-4 w-4 shrink-0" />
                <span>Kabel Jaringan Belum Dibawa</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-200">
                Port LAN pada PC ini masih kosong. Ambil gulungan kabel jaringan yang tepat di{' '}
                <span className="font-semibold text-sky-300">R.03 · Gudang Kabel</span> terlebih dahulu, lalu kembali ke sini untuk menyambungkannya.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={onGoToCableStorage}
                  className="inline-flex items-center gap-1.5 rounded-md bg-sky-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400"
                >
                  <Compass className="h-3.5 w-3.5" />
                  Pergi ke R.03 Gudang Kabel
                </button>
              </div>
            </div>
          ) : currentStep ? (
            <>
              {/* Step Indicator & Clue */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono-tabular font-semibold text-sky-300">
                  {currentStep.clueTag}
                </span>
                <span className="font-mono-tabular text-slate-400">
                  {stepIdx + 1} / {study.steps.length}
                </span>
              </div>

              <div className="rounded-lg border border-sky-500/30 bg-sky-950/20 p-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-300">
                  <Search className="h-3.5 w-3.5 shrink-0" />
                  <span>Apa yang Perlu Dicari?</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                  {currentStep.whatToLookFor}
                </p>
              </div>

              {/* Prompt Question */}
              <div className="text-xs font-medium leading-relaxed text-slate-100">
                {currentStep.prompt}
              </div>

              {/* Interactive Multiple Choice Options */}
              <div className="space-y-2">
                {displayOptions.map((opt, idx) => {
                  const isSelected = selectedOptionId === opt.id;
                  const showWrong = isSelected && !opt.isCorrect;
                  const showRight = isSelected && opt.isCorrect;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleChooseOption(opt.id)}
                      disabled={stepSolved && !isSelected}
                      className={`flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left text-xs transition-colors ${
                        showRight
                          ? 'border-emerald-500/60 bg-emerald-950/35 text-emerald-100'
                          : showWrong
                            ? 'border-rose-500/60 bg-rose-950/30 text-rose-100'
                            : 'border-slate-800 bg-[#0d131d] text-slate-200 hover:border-sky-500/50 hover:bg-slate-800/70 disabled:opacity-45'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border font-mono-tabular text-[10px] font-bold ${
                          showRight
                            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                            : showWrong
                              ? 'border-rose-400 bg-rose-500/20 text-rose-300'
                              : 'border-slate-700 bg-slate-900 text-slate-400'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="leading-relaxed">{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Live Educational Feedback */}
              {selectedOption && (
                <div
                  className={`rounded-lg border p-3 text-xs leading-relaxed ${
                    selectedOption.isCorrect
                      ? 'border-emerald-500/40 bg-emerald-950/25 text-emerald-200'
                      : 'border-amber-500/40 bg-amber-950/25 text-amber-200'
                  }`}
                >
                  <div className="font-semibold">
                    {selectedOption.isCorrect ? 'Diagnosa Tepat' : 'Kurang Tepat — Coba Pilihan Lain'}
                  </div>
                  <p className="mt-1 opacity-95">{selectedOption.feedback}</p>
                  {selectedOption.isCorrect && (
                    <div className="mt-2 border-t border-emerald-500/25 pt-2 text-[11px] text-emerald-100/90">
                      <span className="font-semibold text-emerald-300">Catatan Belajar: </span>
                      {currentStep.learningNote}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Action */}
        {!justCompleted && !alreadySolved && !needsCableFirst && !isCustomSim && (
          <div className="flex items-center justify-between gap-2 border-t border-slate-800 bg-[#101722] px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleProceed}
              disabled={!stepSolved}
              className="inline-flex items-center gap-1.5 rounded-md bg-sky-500 px-4 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLastStep ? (
                <>
                  <Wrench className="h-3.5 w-3.5" />
                  {stepSolved ? study.successActionLabel : 'Terapkan Perbaikan'}
                </>
              ) : (
                <>
                  Lanjut Langkah {stepIdx + 2}
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
