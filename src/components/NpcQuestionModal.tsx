import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CornerDownRight,
  MessageCircle,
  Sparkles,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { sfx } from '../audio/sfx';
import {
  isNpcTargetSolved,
  NpcQuestionOption,
  OFFICE_NPCS,
} from '../data/officeNpcs';
import {
  OfficeNpcId,
  WorkstationStats,
  WorkstationTargetId,
} from '../types/game';

function shuffleNpcOptions(options: NpcQuestionOption[]): NpcQuestionOption[] {
  const arr = [...options];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface NpcQuestionModalProps {
  npcId: OfficeNpcId | null;
  stats: WorkstationStats;
  onClose: () => void;
  onAnswerRecorded: (
    npcId: OfficeNpcId,
    firstTryCorrect: number,
    totalAttempts: number
  ) => void;
  onInspectStation: (targetId: WorkstationTargetId) => void;
}

export const NpcQuestionModal: React.FC<NpcQuestionModalProps> = ({
  npcId,
  stats,
  onClose,
  onAnswerRecorded,
  onInspectStation,
}) => {
  const [shuffledOptions, setShuffledOptions] = useState<NpcQuestionOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [justAnswered, setJustAnswered] = useState(false);
  const [autoReply, setAutoReply] = useState(true);
  const [autoTyping, setAutoTyping] = useState(false);
  const autoRecordedForNpcRef = useRef<OfficeNpcId | null>(null);
  const onAnswerRecordedRef = useRef(onAnswerRecorded);
  onAnswerRecordedRef.current = onAnswerRecorded;

  useEffect(() => {
    setSelectedOptionId(null);
    setWrongAttempts(0);
    setTotalAttempts(0);
    setJustAnswered(false);
    setAutoTyping(false);
    autoRecordedForNpcRef.current = null;
    if (!npcId) {
      setShuffledOptions([]);
      return;
    }
    const npc = OFFICE_NPCS[npcId];
    setShuffledOptions(npc ? shuffleNpcOptions(npc.options) : []);
  }, [npcId]);

  useEffect(() => {
    if (!npcId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [npcId, onClose]);

  const npc = npcId ? OFFICE_NPCS[npcId] : undefined;
  const taskDone = npc ? isNpcTargetSolved(npc.targetId, stats) : false;
  const previouslyAnswered = npc ? stats.consultedNpcs.includes(npc.id) : false;

  useEffect(() => {
    if (!npc || !autoReply || previouslyAnswered || justAnswered || taskDone) {
      setAutoTyping(false);
      return;
    }
    const correctOpt = npc.options.find((o) => o.isCorrect);
    if (!correctOpt) return;

    setAutoTyping(true);
    const timer = window.setTimeout(() => {
      setAutoTyping(false);
      setSelectedOptionId(correctOpt.id);
      setJustAnswered(true);
      if (autoRecordedForNpcRef.current !== npc.id) {
        autoRecordedForNpcRef.current = npc.id;
        sfx.playLaptopConnected();
        onAnswerRecordedRef.current(npc.id, 1, 1);
      }
    }, 550);

    return () => window.clearTimeout(timer);
  }, [npc, autoReply, previouslyAnswered, justAnswered, taskDone]);

  if (!npcId || !npc) return null;

  const displayOptions =
    shuffledOptions.length > 0 ? shuffledOptions : npc.options;
  const selectedOption =
    displayOptions.find((o) => o.id === selectedOptionId) ?? null;
  const solvedNow = Boolean(selectedOption?.isCorrect) || justAnswered;
  const correctOption = npc.options.find((o) => o.isCorrect);
  const firstName = npc.name.split(' ')[0];
  const playerAsk =
    npc.playerAskLine ??
    `Halo ${firstName}, ada kendala perangkat atau hal teknis yang bisa saya bantu?`;

  const handleChooseOption = (optId: string) => {
    if (solvedNow || previouslyAnswered) return;
    const opt = displayOptions.find((o) => o.id === optId);
    if (!opt) return;

    setSelectedOptionId(optId);
    const nextAttempts = totalAttempts + 1;
    setTotalAttempts(nextAttempts);

    if (opt.isCorrect) {
      sfx.playLaptopConnected();
      setJustAnswered(true);
      const firstTry = wrongAttempts === 0 ? 1 : 0;
      onAnswerRecorded(npc.id, firstTry, nextAttempts);
    } else {
      sfx.playDrop();
      setWrongAttempts((w) => w + 1);
    }
  };

  const inspectTargetId = npc.targetId;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 md:p-5">
      <motion.div
        key={npc.id}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="pointer-events-auto relative w-full max-w-2xl"
      >
        {/* Floating Speaker Nameplate & Controls */}
        <div className="mb-1.5 flex items-end justify-between gap-2 px-1">
          <div className="inline-flex flex-wrap items-center gap-2 rounded-t-lg rounded-br-lg border border-slate-700/90 bg-[#0d1522] px-3 py-1.5 shadow-lg">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: npc.accentColor }}
            />
            <span className="font-display text-sm font-bold tracking-wide text-white">
              {npc.name}
            </span>
            <span className="text-[11px] text-slate-400">· {npc.role}</span>
            <span className="hidden text-[11px] text-slate-500 sm:inline">
              · {npc.roomLabel}
            </span>
            {(taskDone || (inspectTargetId === null && (previouslyAnswered || solvedNow))) && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                {taskDone ? 'Selesai' : 'Terjawab'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAutoReply((v) => !v)}
              className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium shadow transition-colors ${
                autoReply
                  ? 'border-sky-500/50 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25'
                  : 'border-slate-700/80 bg-[#0b111c] text-slate-300 hover:border-slate-500 hover:text-white'
              }`}
              title="Ubah mode jawaban otomatis atau pilih manual"
            >
              <Bot className="h-3.5 w-3.5" />
              <span>{autoReply ? 'Jawab Otomatis: ON' : 'Mode Manual'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-md border border-slate-700/80 bg-[#0b111c] px-2.5 py-1 text-[11px] font-medium text-slate-300 shadow transition-colors hover:border-slate-500 hover:text-white"
              aria-label="Tutup Percakapan"
            >
              <span>Esc</span>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Main Sleek Conversation Card */}
        <div
          className="overflow-hidden rounded-xl border border-slate-700/90 bg-[#0a101a]/96 shadow-2xl"
          style={{ borderTopColor: `${npc.accentColor}88` }}
        >
          <div className="max-h-[58vh] space-y-2.5 overflow-y-auto px-4 py-3.5 md:px-5 md:py-4">
            {/* Kamu (Teknisi IT) Opening Line */}
            <div className="flex items-start gap-2 rounded-lg border border-sky-500/25 bg-sky-950/20 px-3 py-2 text-xs leading-relaxed text-sky-100">
              <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" />
              <div>
                <span className="font-semibold text-sky-300">Kamu (Teknisi IT): </span>
                “{playerAsk}”
              </div>
            </div>

            {/* Employee Spoken Line */}
            {taskDone ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/25 bg-emerald-950/20 px-3 py-2.5">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <p className="text-sm leading-relaxed text-emerald-100">
                  <span className="font-semibold text-emerald-300">{firstName}: </span>“
                  {npc.resolvedDialogue}”
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 rounded-lg border border-slate-800 bg-[#0d1421] px-3 py-2.5">
                <p className="text-xs leading-relaxed text-slate-300 md:text-[13px]">
                  <span className="font-semibold text-white">{firstName}: </span>“
                  {npc.greeting}”
                </p>
                <p className="flex items-start gap-2 pt-0.5 text-sm font-medium leading-snug text-white">
                  <MessageCircle
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: npc.accentColor }}
                  />
                  <span>“{npc.question}”</span>
                </p>
              </div>
            )}

            {/* Answered State / Auto-Reply Typing / Manual Options */}
            {previouslyAnswered || solvedNow ? (
              <div className="space-y-2 border-t border-slate-800/90 pt-2.5">
                {correctOption && (
                  <div className="rounded-lg border border-sky-500/35 bg-sky-950/25 px-3 py-2 text-xs leading-relaxed text-sky-100">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-sky-300">
                      <span>Jawaban Kamu (Teknisi IT):</span>
                      <span className="font-mono-tabular text-[10px] text-emerald-300">
                        ✓ Tepat
                      </span>
                    </div>
                    <p className="mt-1">“{correctOption.label}”</p>
                  </div>
                )}

                {correctOption && (
                  <div className="rounded-lg border-l-2 border-emerald-400 bg-emerald-950/25 px-3 py-2 text-xs leading-relaxed text-emerald-100">
                    <div className="font-medium">
                      {firstName}: “{correctOption.npcReaction}”
                    </div>
                    <div className="mt-1 text-[11px] text-slate-300">
                      <span className="font-semibold text-emerald-300">Ringkasan Teknis: </span>
                      {correctOption.explanation}
                    </div>
                  </div>
                )}
              </div>
            ) : autoTyping ? (
              <div className="flex items-center gap-2 border-t border-slate-800/80 pt-2.5 text-xs text-sky-300">
                <Bot className="h-4 w-4 animate-pulse text-sky-400" />
                <span>Teknisi IT sedang memberikan jawaban otomatis...</span>
              </div>
            ) : (
              <div className="space-y-1.5 border-t border-slate-800/80 pt-2.5">
                <div className="text-[11px] font-medium text-slate-400">
                  Balas ke {firstName}:
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {displayOptions.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;
                    const showRight = isSelected && opt.isCorrect;
                    const showWrong = isSelected && !opt.isCorrect;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleChooseOption(opt.id)}
                        disabled={solvedNow && !isSelected}
                        className={`group flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-all ${
                          showRight
                            ? 'border-emerald-500/60 bg-emerald-950/35 text-emerald-100'
                            : showWrong
                              ? 'border-rose-500/50 bg-rose-950/25 text-rose-200'
                              : 'border-slate-800/90 bg-[#0f1724] text-slate-200 hover:border-sky-500/60 hover:bg-[#131e30] disabled:opacity-40'
                        }`}
                      >
                        <CornerDownRight
                          className={`mt-0.5 h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                            showRight
                              ? 'text-emerald-400'
                              : showWrong
                                ? 'text-rose-400'
                                : 'text-sky-400/80'
                          }`}
                        />
                        <span className="leading-relaxed">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {selectedOption && !selectedOption.isCorrect && (
                  <div className="mt-2 rounded-lg border-l-2 border-amber-400 bg-amber-950/20 px-3 py-2 text-xs leading-relaxed text-amber-100">
                    <div className="font-medium">
                      {firstName}: “{selectedOption.npcReaction}”
                    </div>
                    <div className="mt-1 text-[11px] text-slate-300">
                      {selectedOption.explanation}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Slim Action Strip */}
          <div className="flex items-center justify-between gap-3 border-t border-slate-800/90 bg-[#0e1522] px-4 py-2.5 md:px-5">
            <span className="hidden text-[11px] text-slate-400 sm:inline">
              {inspectTargetId === null
                ? previouslyAnswered || solvedNow
                  ? 'Percakapan selesai — silakan lanjutkan keliling ruangan.'
                  : 'Diskusi ringan seputar jaringan & IT kantor.'
                : taskDone
                  ? 'Perangkat di ruangan ini sudah pulih.'
                  : 'Setelah dijawab, periksa perangkat untuk memperbaiki masalahnya.'}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  inspectTargetId === null
                    ? 'bg-sky-500 font-semibold text-slate-950 hover:bg-sky-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {inspectTargetId === null || taskDone ? 'Selesai' : 'Nanti Saja'}
              </button>
              {!taskDone && inspectTargetId !== null && (
                <button
                  type="button"
                  onClick={() => onInspectStation(inspectTargetId)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-sky-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  {npc.actionButtonLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
