import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { WidgetInstance, WidgetType } from "../lib/types";

export type BoardMode = "cursor" | "pen";
export type PenColor = "ink" | "orange" | "sky" | "lime" | "pink";
export type LineStyle = "solid" | "dashed" | "dotted";

export const PEN_COLOR_HEX: Record<PenColor, string> = {
  ink: "#17140f",
  orange: "#ff6b35",
  sky: "#4fb8e8",
  lime: "#6fa82f",
  pink: "#e8548a",
};

export interface Stroke {
  color: string;
  width: number;
  points: { x: number; y: number }[];
  dash: number[];
  erase?: boolean;
}

export const WIDGET_DEFAULTS: Record<WidgetType, { w: number; h: number; label: string }> = {
  noise: { w: 300, h: 500, label: "Noise monitor" },
  timer: { w: 220, h: 190, label: "Timer" },
  stopwatch: { w: 220, h: 160, label: "Stopwatch" },
  clock: { w: 220, h: 130, label: "Clock" },
  studentList: { w: 300, h: 380, label: "Student list" },
  picker: { w: 280, h: 320, label: "Random picker" },
  groups: { w: 300, h: 320, label: "Group generator" },
  image: { w: 280, h: 210, label: "Image" },
};

function defaultConfig(type: WidgetType): Record<string, unknown> {
  switch (type) {
    case "timer":
      return { presetMin: 5, remainingSec: 300, running: false };
    case "stopwatch":
      return { elapsedSec: 0, running: false };
    case "noise":
      return {
        level: 0,
        threshold: 85,
        avg: 0,
        peak: 0,
        warningCount: 0,
        calmStreakSec: 0,
        listening: false,
        micStatus: "idle",
      };
    case "picker":
      return { pickedIds: [] as string[] };
    case "groups":
      return { mode: "size" as const, value: 4, groups: [] as string[][] };
    case "image":
      return { url: null };
    default:
      return {};
  }
}

export const BG_PRESETS: { id: string; label: string; color: string }[] = [
  { id: "cream", label: "Cream", color: "#f7eeda" },
  { id: "sky", label: "Sky", color: "#d8f1fb" },
  { id: "lime", label: "Lime", color: "#e4f4c8" },
  { id: "pink", label: "Pink", color: "#ffdcea" },
  { id: "purple", label: "Purple", color: "#e6e1fc" },
  { id: "charcoal", label: "Charcoal", color: "#221f27" },
];

export type BgMode = "grid" | "color" | "image";

interface BoardState {
  mode: BoardMode;
  setMode: (m: BoardMode) => void;
  zoom: number;
  setZoom: (z: number) => void;
  pan: { x: number; y: number };
  setPan: (p: { x: number; y: number }) => void;

  widgets: WidgetInstance[];
  addWidget: (type: WidgetType) => void;
  updateWidget: (id: string, patch: Partial<WidgetInstance>) => void;
  updateConfig: (id: string, patch: Record<string, unknown>) => void;
  removeWidget: (id: string) => void;
  restoreWidget: (id: string) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  bringToFront: (id: string) => void;

  penColor: PenColor;
  setPenColor: (c: PenColor) => void;
  penWidth: number;
  setPenWidth: (w: number) => void;
  lineStyle: LineStyle;
  setLineStyle: (s: LineStyle) => void;
  erasing: boolean;
  setErasing: (b: boolean) => void;
  strokes: Stroke[];
  redoStack: Stroke[];
  addStroke: (s: Stroke) => void;
  clearInk: () => void;
  undo: () => void;
  redo: () => void;

  bgMode: BgMode;
  setBgMode: (m: BgMode) => void;
  bgColor: string;
  setBgColor: (c: string) => void;
  bgUrl: string | null;
  setBgUrl: (u: string | null) => void;
  bgOverlay: boolean;
  setBgOverlay: (b: boolean) => void;

  classGoalWidgetsActive: boolean;
}

const BoardCtx = createContext<BoardState | null>(null);

export function BoardProvider({
  children,
  initialWidgets = [],
  classGoalWidgetsActive = true,
}: {
  children: ReactNode;
  initialWidgets?: WidgetInstance[];
  classGoalWidgetsActive?: boolean;
}) {
  const [mode, setMode] = useState<BoardMode>("cursor");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [widgets, setWidgets] = useState<WidgetInstance[]>(initialWidgets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [penColor, setPenColor] = useState<PenColor>("ink");
  const [penWidth, setPenWidth] = useState(4);
  const [lineStyle, setLineStyle] = useState<LineStyle>("solid");
  const [erasing, setErasing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [bgMode, setBgMode] = useState<BgMode>("grid");
  const [bgColor, setBgColor] = useState("#f7eeda");
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [bgOverlay, setBgOverlay] = useState(true);
  const counter = useRef(0);
  const zCounter = useRef(Math.max(1, ...initialWidgets.map((w) => w.zIndex ?? 1)));

  // single tick loop drives timer/stopwatch/noise regardless of minimized state
  useEffect(() => {
    const id = setInterval(() => {
      setWidgets((ws) =>
        ws.map((w) => {
          if (w.type === "timer") {
            const cfg = w.config as { remainingSec: number; running: boolean };
            if (!cfg.running || cfg.remainingSec <= 0) return w;
            return { ...w, config: { ...cfg, remainingSec: Math.max(0, cfg.remainingSec - 1) } };
          }
          if (w.type === "stopwatch") {
            const cfg = w.config as { elapsedSec: number; running: boolean };
            if (!cfg.running) return w;
            return { ...w, config: { ...cfg, elapsedSec: cfg.elapsedSec + 1 } };
          }
          return w;
        })
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const value = useMemo<BoardState>(
    () => ({
      mode,
      setMode: (m) => {
        setMode(m);
        if (m === "pen") {
          setWidgets((ws) => ws.map((w) => ({ ...w, minimized: true })));
        }
      },
      zoom,
      setZoom: (z) => setZoom(Math.max(0.4, Math.min(2.5, z))),
      pan,
      setPan,

      widgets,
      addWidget: (type) => {
        counter.current += 1;
        zCounter.current += 1;
        const d = WIDGET_DEFAULTS[type];
        const offset = (counter.current % 5) * 24;
        const w: WidgetInstance = {
          id: `w${Date.now()}-${counter.current}`,
          type,
          x: 420 + offset,
          y: 160 + offset,
          w: d.w,
          h: d.h,
          zIndex: zCounter.current,
          minimized: false,
          config: defaultConfig(type),
        };
        setWidgets((ws) => [...ws, w]);
        setSelectedId(w.id);
      },
      updateWidget: (id, patch) => setWidgets((ws) => ws.map((w) => (w.id === id ? { ...w, ...patch } : w))),
      updateConfig: (id, patch) =>
        setWidgets((ws) => ws.map((w) => (w.id === id ? { ...w, config: { ...w.config, ...patch } } : w))),
      removeWidget: (id) => setWidgets((ws) => ws.filter((w) => w.id !== id)),
      restoreWidget: (id) => {
        setWidgets((ws) => ws.map((w) => (w.id === id ? { ...w, minimized: false } : w)));
        setMode("cursor");
      },
      selectedId,
      setSelectedId,
      bringToFront: (id) => {
        zCounter.current += 1;
        const z = zCounter.current;
        setWidgets((ws) => ws.map((w) => (w.id === id ? { ...w, zIndex: z } : w)));
      },

      penColor,
      setPenColor,
      penWidth,
      setPenWidth,
      lineStyle,
      setLineStyle,
      erasing,
      setErasing,
      strokes,
      redoStack,
      addStroke: (s) => {
        setStrokes((ss) => [...ss, s]);
        setRedoStack([]);
      },
      clearInk: () => {
        setStrokes([]);
        setRedoStack([]);
      },
      undo: () =>
        setStrokes((ss) => {
          if (ss.length === 0) return ss;
          const last = ss[ss.length - 1];
          setRedoStack((rs) => [...rs, last]);
          return ss.slice(0, -1);
        }),
      redo: () =>
        setRedoStack((rs) => {
          if (rs.length === 0) return rs;
          const last = rs[rs.length - 1];
          setStrokes((ss) => [...ss, last]);
          return rs.slice(0, -1);
        }),

      bgMode,
      setBgMode,
      bgColor,
      setBgColor,
      bgUrl,
      setBgUrl: (u) => {
        setBgUrl(u);
        if (u) setBgMode("image");
      },
      bgOverlay,
      setBgOverlay,

      classGoalWidgetsActive,
    }),
    [
      mode,
      zoom,
      pan,
      widgets,
      selectedId,
      penColor,
      penWidth,
      lineStyle,
      erasing,
      strokes,
      redoStack,
      bgMode,
      bgColor,
      bgUrl,
      bgOverlay,
      classGoalWidgetsActive,
    ]
  );

  return <BoardCtx.Provider value={value}>{children}</BoardCtx.Provider>;
}

export function useBoard() {
  const ctx = useContext(BoardCtx);
  if (!ctx) throw new Error("useBoard must be used within BoardProvider");
  return ctx;
}
