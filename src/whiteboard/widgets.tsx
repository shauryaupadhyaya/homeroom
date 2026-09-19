import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Volume2,
  TimerIcon,
  Watch,
  Clock as ClockIcon,
  Users,
  Shuffle,
  UsersRound,
  ImageIcon,
  Minus,
  X,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Upload,
  Coffee,
  Mic,
  MicOff,
  Square,
  AlertTriangle,
} from "lucide-react";
import type { BrandColor } from "../components/ui";
import type { WidgetInstance, WidgetType } from "../lib/types";
import { useApp } from "../lib/store";
import { useBoard } from "./BoardContext";
import { Avatar, Button, SmileyScale, colorTokens } from "../components/ui";

export const WIDGET_ICON: Record<WidgetType, typeof Volume2> = {
  noise: Volume2,
  timer: TimerIcon,
  stopwatch: Watch,
  clock: ClockIcon,
  studentList: Users,
  picker: Shuffle,
  groups: UsersRound,
  image: ImageIcon,
};

export function widgetLiveValue(w: WidgetInstance): string | null {
  if (w.type === "timer") {
    const c = w.config as { remainingSec: number; running: boolean };
    return c.running || c.remainingSec > 0 ? mmss(c.remainingSec) : null;
  }
  if (w.type === "stopwatch") {
    const c = w.config as { elapsedSec: number };
    return c.elapsedSec > 0 ? mmss(c.elapsedSec) : null;
  }
  if (w.type === "noise") {
    const c = w.config as { listening: boolean; level: number };
    return c.listening ? `${Math.round(c.level)} dB` : null;
  }
  return null;
}

function mmss(total: number) {
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function WidgetShell({
  widget,
  title,
  onClose,
  children,
}: {
  widget: WidgetInstance;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { updateWidget, mode, selectedId, setSelectedId, bringToFront } = useBoard();
  const Icon = WIDGET_ICON[widget.type];
  const dragRef = useRef<{ startX: number; startY: number; wx: number; wy: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; ww: number; wh: number } | null>(null);
  const selected = selectedId === widget.id;

  function select() {
    setSelectedId(widget.id);
    bringToFront(widget.id);
  }

  function onDragStart(e: React.PointerEvent) {
    if (mode !== "cursor") return;
    (e.target as Element).setPointerCapture(e.pointerId);
    select();
    dragRef.current = { startX: e.clientX, startY: e.clientY, wx: widget.x, wy: widget.y };
  }
  function onDragMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    updateWidget(widget.id, { x: dragRef.current.wx + dx, y: dragRef.current.wy + dy });
  }
  function onDragEnd() {
    dragRef.current = null;
  }

  function onResizeStart(e: React.PointerEvent) {
    if (mode !== "cursor") return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    select();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, ww: widget.w, wh: widget.h };
  }
  function onResizeMove(e: React.PointerEvent) {
    if (!resizeRef.current) return;
    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;
    updateWidget(widget.id, {
      w: Math.max(200, resizeRef.current.ww + dx),
      h: Math.max(140, resizeRef.current.wh + dy),
    });
  }
  function onResizeEnd() {
    resizeRef.current = null;
  }

  return (
    <div
      onPointerDown={() => mode === "cursor" && select()}
      className={`animate-widget-in pointer-events-auto relative flex flex-col overflow-hidden rounded-2xl border-[3px] bg-(--color-surface) shadow-hard transition-shadow ${
        selected ? "border-(--color-sky-500) ring-4 ring-(--color-sky-500)/30" : "border-(--color-border)"
      }`}
      style={{ width: widget.w, minHeight: widget.h }}
    >
      <div
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        className="flex cursor-grab items-center gap-2 border-b-[3px] border-(--color-border) bg-(--color-paper-dim) px-3 py-2 active:cursor-grabbing"
      >
        <Icon size={14} className="text-(--color-ink-soft)" />
        <span className="flex-1 truncate text-xs font-bold text-(--color-ink)">{title}</span>
        <button
          onClick={() => updateWidget(widget.id, { minimized: true })}
          className="rounded p-1 text-(--color-ink-muted) hover:bg-(--color-surface) hover:text-(--color-ink)"
          title="Minimize"
        >
          <Minus size={13} />
        </button>
        <button
          onClick={onClose}
          className="rounded p-1 text-(--color-ink-muted) hover:bg-(--color-danger-100) hover:text-(--color-danger)"
          title="Close"
        >
          <X size={13} />
        </button>
      </div>
      <div className="flex-1 p-3">{children}</div>
      <div
        onPointerDown={onResizeStart}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeEnd}
        className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize touch-none"
        title="Resize"
      >
        <svg viewBox="0 0 12 12" className="h-full w-full text-(--color-ink-muted)">
          <path d="M10 2 L2 10 M10 6 L6 10 M10 10 L10 10" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    </div>
  );
}

const GENERIC_NAMES = ["Alex", "Sam", "Jordan", "Riley", "Casey", "Morgan", "Taylor", "Jamie"];
const GROUP_COLORS: BrandColor[] = ["orange", "sky", "lime", "pink", "purple"];

/* ---------------------------------- Noise monitor (real Web Audio) ---------------------------------- */

type NoiseConfig = {
  level: number;
  threshold: number;
  avg: number;
  peak: number;
  warningCount: number;
  calmStreakSec: number;
  listening: boolean;
  micStatus: "idle" | "requesting" | "granted" | "denied";
};

const DB_SCALE_MAX = 140;

/** Short badge status, tuned to the 94dBFS-calibrated 0-140 scale. */
function noiseStatus(level: number): { label: string; color: BrandColor } {
  if (level < 35) return { label: "Quiet", color: "lime" };
  if (level < 65) return { label: "Moderate", color: "sky" };
  if (level < 85) return { label: "Loud", color: "orange" };
  if (level < 100) return { label: "Very Loud", color: "pink" };
  return { label: "Extreme", color: "pink" };
}

/** Longer real-world reference, ported from the reference implementation. */
function classifyDb(level: number): string {
  if (level < 35) return "Quiet room, light rain";
  if (level < 55) return "Office, urban area";
  if (level < 65) return "Conversation, busy road";
  if (level < 85) return "Loud traffic, factory";
  if (level < 100) return "Subway, car horn";
  if (level < 120) return "Thunderclap, symphony orchestra";
  return "Fireworks, jet takeoff";
}

function playBeep(ctx: AudioContext) {
  // a clear run of beeps over ~3 seconds, loud enough to actually notice,
  // with the final beep given a longer tail so it tapers off rather than
  // cutting out abruptly (echoing the pace of the visual flash).
  const beepCount = 5;
  const interval = 0.55; // seconds between beep starts
  const shortDecay = 0.22; // seconds each of the first beeps rings for
  const finalDecay = 1.0; // seconds the last beep takes to fade out
  const peak = 0.34;

  for (let i = 0; i < beepCount; i++) {
    const isLast = i === beepCount - 1;
    const decay = isLast ? finalDecay : shortDecay;
    const t0 = ctx.currentTime + i * interval;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 880;

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + decay + 0.05);
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.trim().match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return [255, 255, 255];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function drawNoiseGraph(
  canvas: HTMLCanvasElement,
  values: number[],
  threshold: number,
  colors: { bg: string; grid: string; text: string; line: string; thresholdLine: string }
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const width = canvas.width;
  const height = canvas.height;
  if (width === 0 || height === 0) return;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 7; i++) {
    const y = (height / 7) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.fillStyle = colors.text;
  ctx.font = "9px sans-serif";
  for (let i = 0; i <= 7; i++) {
    const value = DB_SCALE_MAX - i * 20;
    const y = (height / 7) * i + 10;
    ctx.fillText(`${value}`, 3, y);
  }

  const threshY = height - (threshold / DB_SCALE_MAX) * height;
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = colors.thresholdLine;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, threshY);
  ctx.lineTo(width, threshY);
  ctx.stroke();
  ctx.setLineDash([]);

  if (values.length < 2) return;

  ctx.beginPath();
  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 2;
  values.forEach((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * width;
    const y = height - (value / DB_SCALE_MAX) * height;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

export function NoiseMonitorWidget({ widget, classId }: { widget: WidgetInstance; classId?: string }) {
  const { updateConfig } = useBoard();
  const { awardClassPoints } = useApp();
  const c = widget.config as NoiseConfig;

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const displayedDbRef = useRef(0);
  const historyRef = useRef<number[]>([]);
  const totalDbRef = useRef(0);
  const readingCountRef = useRef(0);
  const peakRef = useRef(0);
  const warningCountRef = useRef(0);
  const calmStreakRef = useRef(0);
  const thresholdRef = useRef(c.threshold);
  const lastBuzzRef = useRef(0);
  const waitingForUnderThresholdRef = useRef(false);
  const redEffectActiveRef = useRef(false);
  const redStartTimestampRef = useRef<number | null>(null);
  const lastSyncRef = useRef(0);

  // the rAF loop below is set up once per listening session (its effect only
  // depends on c.listening), so it closes over a stale `widget` on every
  // render; keep the threshold fresh via a ref synced on its own effect
  // instead of reading it back out of that stale closure.
  useEffect(() => {
    thresholdRef.current = c.threshold;
  }, [c.threshold]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  const [displayLevel, setDisplayLevel] = useState(0);
  const [description, setDescription] = useState("");

  async function start() {
    updateConfig(widget.id, { micStatus: "requesting" });
    try {
      // ask for the raw signal: default constraints enable echo cancellation,
      // noise suppression, and auto gain control (tuned for voice calls),
      // which actively suppress/flatten ambient room noise before it ever
      // reaches the analyser, making level readings sit artificially low.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      displayedDbRef.current = 0;
      historyRef.current = [];
      totalDbRef.current = 0;
      readingCountRef.current = 0;
      peakRef.current = 0;
      warningCountRef.current = 0;
      calmStreakRef.current = 0;
      lastBuzzRef.current = 0;
      waitingForUnderThresholdRef.current = false;
      redEffectActiveRef.current = false;

      updateConfig(widget.id, {
        micStatus: "granted",
        listening: true,
        level: 0,
        avg: 0,
        peak: 0,
        warningCount: 0,
        calmStreakSec: 0,
      });
    } catch {
      updateConfig(widget.id, { micStatus: "denied", listening: false });
    }
  }

  function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    streamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
    if (flashRef.current) flashRef.current.style.backgroundColor = "transparent";
    updateConfig(widget.id, { listening: false });
  }

  useEffect(() => {
    if (!c.listening || !analyserRef.current || !canvasRef.current) return;
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    const data = new Float32Array(analyser.fftSize);

    const style = getComputedStyle(document.documentElement);
    const colors = {
      bg: style.getPropertyValue("--color-paper-dim").trim() || "#efe2bd",
      grid: style.getPropertyValue("--color-line").trim() || "#e9dfc3",
      text: style.getPropertyValue("--color-ink-muted").trim() || "#7a7264",
      line: style.getPropertyValue("--color-orange-500").trim() || "#ff6b35",
      thresholdLine: style.getPropertyValue("--color-danger").trim() || "#e14a3b",
    };
    const dangerRgb = hexToRgb(colors.thresholdLine);

    const resizeObserver = new ResizeObserver(() => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    });
    resizeObserver.observe(canvas);
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    function loop() {
      analyser.getFloatTimeDomainData(data);
      let sumSquares = 0;
      for (let i = 0; i < data.length; i++) sumSquares += data[i] * data[i];
      const rms = Math.sqrt(sumSquares / data.length);
      const dbfs = 20 * Math.log10(Math.max(rms, 0.000001));
      const raw = Math.max(0, Math.min(DB_SCALE_MAX, 94 + dbfs));

      if (raw > displayedDbRef.current) displayedDbRef.current = raw;
      else displayedDbRef.current = displayedDbRef.current * 0.95 + raw * 0.05;
      const level = displayedDbRef.current;

      totalDbRef.current += level;
      readingCountRef.current += 1;
      const avg = totalDbRef.current / readingCountRef.current;

      historyRef.current.push(level);
      if (historyRef.current.length > 600) historyRef.current.shift();

      const threshold = thresholdRef.current;
      drawNoiseGraph(canvas, historyRef.current, threshold, colors);

      peakRef.current = Math.max(peakRef.current, level);

      setDisplayLevel(level);
      setDescription(classifyDb(level));

      const now = performance.now();

      if (waitingForUnderThresholdRef.current && level < threshold - 1) {
        waitingForUnderThresholdRef.current = false;
      }

      let warned = false;
      if (
        !waitingForUnderThresholdRef.current &&
        level >= threshold &&
        now - lastBuzzRef.current > 5000
      ) {
        if (audioCtxRef.current) playBeep(audioCtxRef.current);
        lastBuzzRef.current = now;
        waitingForUnderThresholdRef.current = true;
        redEffectActiveRef.current = true;
        redStartTimestampRef.current = now;
        warningCountRef.current += 1;
        warned = true;
      }

      if (redEffectActiveRef.current && redStartTimestampRef.current !== null && flashRef.current) {
        const elapsed = now - redStartTimestampRef.current;
        const duration = 6000;
        const peakAlpha = 0.5;
        if (elapsed < duration) {
          const progress = 1 - elapsed / duration;
          const alpha = peakAlpha * progress;
          flashRef.current.style.backgroundColor = `rgba(${dangerRgb[0]}, ${dangerRgb[1]}, ${dangerRgb[2]}, ${alpha})`;
        } else {
          flashRef.current.style.backgroundColor = "transparent";
          redEffectActiveRef.current = false;
          redStartTimestampRef.current = null;
        }
      }

      const over = level >= threshold;
      calmStreakRef.current = !over ? calmStreakRef.current + 1 : 0;

      if (now - lastSyncRef.current > 200 || warned) {
        lastSyncRef.current = now;
        updateConfig(widget.id, {
          level,
          avg,
          peak: peakRef.current,
          warningCount: warningCountRef.current,
          calmStreakSec: calmStreakRef.current,
        });
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.listening]);

  useEffect(() => () => stop(), []);

  const status = noiseStatus(displayLevel);
  const overThreshold = c.listening && displayLevel >= c.threshold;

  if (c.micStatus === "idle" || c.micStatus === "requesting" || c.micStatus === "denied") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        {c.micStatus === "denied" ? (
          <>
            <MicOff size={26} className="text-(--color-danger)" />
            <div>
              <p className="text-xs font-bold text-(--color-ink)">Microphone access blocked</p>
              <p className="mt-1 text-[11px] leading-snug text-(--color-ink-muted)">
                Homeroom needs mic access to measure classroom noise. Allow it from your browser's address bar
                icon, then try again.
              </p>
            </div>
            <Button size="sm" onClick={start}>
              <Mic size={13} /> Try again
            </Button>
          </>
        ) : (
          <>
            <Mic size={26} className={c.micStatus === "requesting" ? "animate-pulse text-(--color-orange-500)" : "text-(--color-ink-muted)"} />
            <p className="text-[11px] text-(--color-ink-muted)">
              {c.micStatus === "requesting" ? "Waiting for microphone permission..." : "Start monitoring to see live classroom noise."}
            </p>
            <Button size="sm" onClick={start} disabled={c.micStatus === "requesting"}>
              <Mic size={13} /> Start monitoring
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      {/* covers the entire widget card (title bar included) by anchoring to
          WidgetShell's own `relative` root, not just this padded content area */}
      <div ref={flashRef} className="pointer-events-none absolute inset-0 bg-transparent transition-colors duration-500" />
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1.5">
          <p className="font-display text-4xl font-bold leading-none text-(--color-ink)">{Math.round(displayLevel)}</p>
          <span className="text-sm font-bold text-(--color-ink-muted)">dB</span>
        </div>
        <span
          className={`rounded-full border-2 border-(--color-border) px-2.5 py-1 text-[11px] font-bold text-(--color-ink-on-accent) ${colorTokens(status.color).solid}`}
        >
          {status.label}
        </span>
      </div>
      <p className="-mt-1.5 text-[11px] font-semibold text-(--color-ink-muted)">{description}</p>

      <div className="relative h-2.5 w-full overflow-hidden rounded-full border-2 border-(--color-border) bg-(--color-paper-dim)">
        {/* fixed gradient spanning the full 0-140dB scale, so the color at any
            point always means the same dB level regardless of current width */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: "linear-gradient(90deg, var(--color-lime-500) 0%, var(--color-orange-500) 55%, var(--color-danger) 100%)" }}
        />
        {/* covers the not-yet-reached portion in the track color, sliding
            away from the right as the level rises */}
        <div
          className="absolute inset-y-0 right-0 rounded-r-full bg-(--color-paper-dim) transition-[width] duration-150 ease-out"
          style={{ width: `${100 - Math.min((displayLevel / DB_SCALE_MAX) * 100, 100)}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-center">
        <Stat label="Max" value={`${Math.round(c.peak)}`} />
        <Stat label="Avg" value={`${Math.round(c.avg)}`} />
        <div className="rounded-lg border-2 border-(--color-border) bg-(--color-paper-dim) py-1.5">
          <p className="text-sm font-bold text-(--color-ink)">{c.warningCount}</p>
          <button
            onClick={() => {
              warningCountRef.current = 0;
              updateConfig(widget.id, { warningCount: 0 });
            }}
            className="text-[9px] font-semibold uppercase tracking-wide text-(--color-orange-600) hover:underline"
          >
            Warnings, reset
          </button>
        </div>
      </div>

      <div className="rounded-lg border-2 border-(--color-border) bg-(--color-paper-dim) p-2.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wide text-(--color-ink-muted)">Alert threshold</p>
            <p className="text-base font-bold text-(--color-ink)">{c.threshold} dB</p>
          </div>
          <span
            className={`flex items-center gap-1 rounded-full border-2 border-(--color-border) px-2 py-0.5 text-[10px] font-bold ${
              overThreshold ? "bg-(--color-danger) text-white" : "bg-(--color-lime-500) text-(--color-ink-on-accent)"
            }`}
          >
            {overThreshold && <AlertTriangle size={11} />}
            {overThreshold ? "ALERT" : "SAFE"}
          </span>
        </div>
        <input
          type="range"
          min={40}
          max={120}
          value={c.threshold}
          onChange={(e) => updateConfig(widget.id, { threshold: Number(e.target.value) })}
          className="mt-2 w-full accent-(--color-orange-500)"
        />
      </div>

      <canvas ref={canvasRef} className="h-20 w-full rounded-lg border-2 border-(--color-border)" />

      {overThreshold && (
        <div className="flex items-start gap-1.5 rounded-lg border-2 border-(--color-border) bg-(--color-pink-100) px-2.5 py-2 text-[11px] font-semibold text-(--color-ink)">
          <Coffee size={13} className="mt-0.5 shrink-0" />
          Room's been loud a while. Try a 60 second brain break.
        </div>
      )}

      {classId && c.calmStreakSec > 0 && c.calmStreakSec % 20 === 0 && (
        <AwardOnce onFire={() => awardClassPoints(classId, 2)} streakKey={c.calmStreakSec} />
      )}

      <Button size="sm" variant="secondary" onClick={stop} className="mt-auto">
        <Square size={12} fill="currentColor" /> Stop monitoring
      </Button>
    </div>
  );
}

function AwardOnce({ onFire, streakKey }: { onFire: () => void; streakKey: number }) {
  const fired = useRef<number | null>(null);
  useEffect(() => {
    if (fired.current === streakKey) return;
    fired.current = streakKey;
    onFire();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streakKey]);
  return null;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border-2 border-(--color-border) bg-(--color-paper-dim) py-1.5">
      <p className="text-sm font-bold text-(--color-ink)">{value}</p>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-(--color-ink-muted)">{label}</p>
    </div>
  );
}

/* ---------------------------------- Timer / stopwatch / clock ---------------------------------- */

export function TimerWidget({ widget }: { widget: WidgetInstance }) {
  const { updateConfig } = useBoard();
  const c = widget.config as { presetMin: number; remainingSec: number; running: boolean };
  const done = c.remainingSec === 0;

  return (
    <div className="flex h-full flex-col items-center justify-between gap-3">
      <p
        className={`font-display text-4xl font-bold tabular-nums ${done ? "animate-pulse text-(--color-danger)" : "text-(--color-ink)"}`}
      >
        {mmss(c.remainingSec)}
      </p>
      <div className="flex gap-1.5">
        {[1, 5, 10, 15].map((m) => (
          <button
            key={m}
            onClick={() => updateConfig(widget.id, { presetMin: m, remainingSec: m * 60, running: false })}
            className="rounded-md border-2 border-(--color-border) px-2 py-1 text-[11px] font-bold text-(--color-ink-soft) hover:bg-(--color-orange-100)"
          >
            {m}m
          </button>
        ))}
      </div>
      <div className="flex w-full gap-2">
        <Button
          size="sm"
          className="flex-1"
          variant={c.running ? "secondary" : "primary"}
          onClick={() => updateConfig(widget.id, { running: !c.running })}
        >
          {c.running ? <Pause size={13} /> : <Play size={13} fill="currentColor" />}
          {c.running ? "Pause" : "Start"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => updateConfig(widget.id, { remainingSec: c.presetMin * 60, running: false })}
        >
          <RotateCcw size={13} />
        </Button>
      </div>
    </div>
  );
}

export function StopwatchWidget({ widget }: { widget: WidgetInstance }) {
  const { updateConfig } = useBoard();
  const c = widget.config as { elapsedSec: number; running: boolean };
  return (
    <div className="flex h-full flex-col items-center justify-between gap-3">
      <p className="font-display text-4xl font-bold tabular-nums text-(--color-ink)">{mmss(c.elapsedSec)}</p>
      <div className="flex w-full gap-2">
        <Button
          size="sm"
          className="flex-1"
          variant={c.running ? "secondary" : "primary"}
          onClick={() => updateConfig(widget.id, { running: !c.running })}
        >
          {c.running ? <Pause size={13} /> : <Play size={13} fill="currentColor" />}
          {c.running ? "Stop" : "Start"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => updateConfig(widget.id, { elapsedSec: 0, running: false })}>
          <RotateCcw size={13} />
        </Button>
      </div>
    </div>
  );
}

export function ClockWidget() {
  const { teacher } = useApp();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time =
    teacher.clockFormat === "24h"
      ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      : now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1">
      <p className="font-display text-3xl font-bold tabular-nums text-(--color-ink)">{time}</p>
      <p className="text-xs font-semibold text-(--color-ink-muted)">
        {now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
      </p>
    </div>
  );
}

/* ---------------------------------- Student list ---------------------------------- */

export function StudentListWidget({ classId }: { classId: string }) {
  const { students, classes, awardStudentPoints, awardClassPoints, addStudent } = useApp();
  const [mood, setMood] = useState<Record<string, { entry: number | null; exit: number | null }>>({});
  const [newName, setNewName] = useState("");
  const roster = students.filter((s) => s.classId === classId);
  const cls = classes.find((c) => c.id === classId);

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between rounded-lg border-2 border-(--color-border) bg-(--color-paper-dim) px-2.5 py-2">
        <div>
          <p className="text-xs font-bold text-(--color-ink)">{cls?.name}</p>
          <p className="text-[10px] font-semibold text-(--color-ink-muted)">{cls?.points} class points</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => awardClassPoints(classId, -1)} className="rounded-md border-2 border-(--color-border) bg-(--color-surface) p-1 hover:bg-(--color-pink-100)">
            <Minus size={12} />
          </button>
          <button onClick={() => awardClassPoints(classId, 1)} className="rounded-md border-2 border-(--color-border) bg-(--color-surface) p-1 hover:bg-(--color-lime-100)">
            <Plus size={12} />
          </button>
        </div>
      </div>

      <ul className="flex-1 space-y-1.5 overflow-y-auto scrollbar-thin">
        {roster.map((s) => (
          <li key={s.id} className="rounded-lg border-2 border-(--color-border) px-2 py-1.5">
            <div className="flex items-center gap-2">
              <Avatar name={s.name} size={22} />
              <span className="flex-1 truncate text-xs font-semibold text-(--color-ink)">{s.name}</span>
              <span className="text-[11px] font-bold text-(--color-ink-soft)">{s.points}</span>
              <button onClick={() => awardStudentPoints(s.id, -1)} className="rounded p-0.5 text-(--color-ink-muted) hover:bg-(--color-pink-100)">
                <Minus size={11} />
              </button>
              <button onClick={() => awardStudentPoints(s.id, 1)} className="rounded p-0.5 text-(--color-ink-muted) hover:bg-(--color-lime-100)">
                <Plus size={11} />
              </button>
            </div>
            <div className="mt-1 flex items-center gap-2 pl-7 text-[10px] font-semibold text-(--color-ink-muted)">
              <span className="w-8">In</span>
              <SmileyScale
                size="sm"
                value={mood[s.id]?.entry ?? null}
                onChange={(v) => setMood((m) => ({ ...m, [s.id]: { entry: v, exit: m[s.id]?.exit ?? null } }))}
              />
            </div>
            <div className="mt-0.5 flex items-center gap-2 pl-7 text-[10px] font-semibold text-(--color-ink-muted)">
              <span className="w-8">Out</span>
              <SmileyScale
                size="sm"
                value={mood[s.id]?.exit ?? null}
                onChange={(v) => setMood((m) => ({ ...m, [s.id]: { entry: m[s.id]?.entry ?? null, exit: v } }))}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="flex gap-1.5">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add student"
          className="min-w-0 flex-1 rounded-md border-2 border-(--color-border) px-2 py-1 text-xs outline-none focus:border-(--color-sky-500)"
        />
        <button
          onClick={() => {
            if (!newName.trim()) return;
            addStudent(classId, newName.trim());
            setNewName("");
          }}
          className="rounded-md border-2 border-(--color-border) px-2 text-(--color-ink-soft) hover:bg-(--color-orange-100)"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------- Random picker ---------------------------------- */

export function RandomPickerWidget({ widget, classId }: { widget: WidgetInstance; classId?: string }) {
  const { students } = useApp();
  const { updateConfig } = useBoard();
  const c = widget.config as { pickedIds: string[] };
  const roster = classId
    ? students.filter((s) => s.classId === classId).map((s) => ({ id: s.id, name: s.name }))
    : GENERIC_NAMES.map((n) => ({ id: n, name: n }));

  const remaining = roster.filter((r) => !c.pickedIds.includes(r.id));
  const picked = roster.filter((r) => c.pickedIds.includes(r.id));
  const lastPicked = picked[picked.length - 1];

  function pick() {
    if (remaining.length === 0) return;
    const chosen = remaining[Math.floor(Math.random() * remaining.length)];
    updateConfig(widget.id, { pickedIds: [...c.pickedIds, chosen.id] });
  }

  return (
    <div className="flex h-full flex-col gap-2.5">
      {lastPicked && (
        <div
          key={lastPicked.id}
          className="animate-widget-in rounded-xl border-[3px] border-(--color-border) bg-(--color-orange-500) px-3 py-3 text-center shadow-hard-sm"
        >
          <p className="text-[10px] font-bold uppercase tracking-wide text-(--color-ink-on-accent)/70">Picked</p>
          <p className="font-display text-lg font-bold text-(--color-ink-on-accent)">{lastPicked.name}</p>
        </div>
      )}
      <Button size="sm" onClick={pick} disabled={remaining.length === 0}>
        <Shuffle size={13} />
        Pick a student
      </Button>
      <div className="grid flex-1 grid-cols-2 gap-2 overflow-hidden">
        <div className="flex flex-col gap-1 overflow-y-auto scrollbar-thin">
          <p className="text-[10px] font-bold uppercase tracking-wide text-(--color-ink-muted)">Still to go</p>
          {remaining.map((r) => (
            <span key={r.id} className="truncate rounded-md border-2 border-(--color-border) bg-(--color-surface) px-2 py-1 text-xs font-semibold text-(--color-ink)">
              {r.name}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-1 overflow-y-auto scrollbar-thin">
          <p className="text-[10px] font-bold uppercase tracking-wide text-(--color-ink-muted)">Picked</p>
          {picked.map((r) => (
            <span key={r.id} className="truncate rounded-md border-2 border-(--color-border) bg-(--color-purple-100) px-2 py-1 text-xs font-semibold text-(--color-ink)">
              {r.name}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={() => updateConfig(widget.id, { pickedIds: [] })}
        className="self-start text-[11px] font-bold text-(--color-ink-muted) hover:underline"
      >
        Reset pool
      </button>
    </div>
  );
}

/* ---------------------------------- Group generator ---------------------------------- */

export function GroupGeneratorWidget({ widget, classId }: { widget: WidgetInstance; classId?: string }) {
  const { students } = useApp();
  const { updateConfig } = useBoard();
  const c = widget.config as { mode: "size" | "count"; value: number; groups: string[][] };
  const roster = classId ? students.filter((s) => s.classId === classId).map((s) => s.name) : GENERIC_NAMES;

  function generate() {
    const shuffled = [...roster].sort(() => Math.random() - 0.5);
    const groups: string[][] = [];
    if (c.mode === "size") {
      for (let i = 0; i < shuffled.length; i += c.value) groups.push(shuffled.slice(i, i + c.value));
    } else {
      for (let i = 0; i < c.value; i++) groups.push([]);
      shuffled.forEach((name, i) => groups[i % c.value].push(name));
    }
    updateConfig(widget.id, { groups });
  }

  return (
    <div className="flex h-full flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 rounded-lg border-2 border-(--color-border) bg-(--color-paper-dim) p-0.5">
          {(["size", "count"] as const).map((m) => (
            <button
              key={m}
              onClick={() => updateConfig(widget.id, { mode: m })}
              className={`flex-1 rounded-md py-1 text-[11px] font-bold transition-colors ${
                c.mode === m ? "bg-(--color-surface) text-(--color-ink) shadow-hard-sm" : "text-(--color-ink-muted)"
              }`}
            >
              By {m}
            </button>
          ))}
        </div>
        <input
          type="number"
          min={1}
          value={c.value}
          onChange={(e) => updateConfig(widget.id, { value: Number(e.target.value) || 1 })}
          className="w-12 rounded-md border-2 border-(--color-border) px-1.5 py-1 text-center text-xs outline-none"
        />
      </div>
      <Button size="sm" onClick={generate}>
        <UsersRound size={13} />
        Generate groups
      </Button>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="grid grid-cols-2 gap-1.5">
          {c.groups.map((g, i) => {
            const color = GROUP_COLORS[i % GROUP_COLORS.length];
            return (
              <div
                key={i}
                className={`animate-rise-in rounded-lg border-2 border-(--color-border) p-1.5 ${colorTokens(color).soft}`}
              >
                <p className="mb-1 text-[10px] font-bold uppercase text-(--color-ink-soft)">Group {i + 1}</p>
                {g.map((n) => (
                  <p key={n} className="truncate text-[11px] font-semibold text-(--color-ink)">
                    {n}
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Image widget ---------------------------------- */

export function ImageWidget({ widget }: { widget: WidgetInstance }) {
  const { updateConfig } = useBoard();
  const c = widget.config as { url: string | null };
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex h-full flex-col">
      {c.url ? (
        <img src={c.url} alt="" className="h-full w-full flex-1 rounded-lg border-2 border-(--color-border) object-cover" />
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-(--color-border) text-(--color-ink-muted) hover:bg-(--color-orange-100)"
        >
          <Upload size={20} />
          <span className="text-xs font-bold">Upload image</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) updateConfig(widget.id, { url: URL.createObjectURL(file) });
        }}
      />
    </div>
  );
}
