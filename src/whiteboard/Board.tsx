import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, CSSProperties } from "react";
import {
  MousePointer2,
  Pen,
  ZoomIn,
  ZoomOut,
  Maximize,
  Eraser,
  Undo2,
  Redo2,
  ImagePlus,
  Trash2,
  Palette,
  Grid3x3,
  X,
  Volume2,
  TimerIcon,
  Watch,
  Clock as ClockIcon,
  Users,
  Shuffle,
  UsersRound,
  ImageIcon,
} from "lucide-react";
import type { WidgetInstance, WidgetType } from "../lib/types";
import {
  useBoard,
  PEN_COLOR_HEX,
  type PenColor,
  type LineStyle,
  WIDGET_DEFAULTS,
  BG_PRESETS,
} from "./BoardContext";
import {
  WidgetShell,
  WIDGET_ICON,
  widgetLiveValue,
  NoiseMonitorWidget,
  TimerWidget,
  StopwatchWidget,
  ClockWidget,
  StudentListWidget,
  RandomPickerWidget,
  GroupGeneratorWidget,
  ImageWidget,
} from "./widgets";

const THICKNESS_OPTIONS = [
  { value: 2, label: "Thin" },
  { value: 5, label: "Medium" },
  { value: 9, label: "Thick" },
  { value: 14, label: "Extra thick" },
];

const LINE_STYLES: { value: LineStyle; label: string }[] = [
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
];

function dashPattern(style: LineStyle, width: number): number[] {
  if (style === "dashed") return [width * 2.5, width * 1.8];
  if (style === "dotted") return [0.1, width * 2.2];
  return [];
}

const PALETTE: { type: WidgetType; icon: typeof Volume2; label: string; classOnly?: boolean }[] = [
  { type: "noise", icon: Volume2, label: "Noise monitor" },
  { type: "timer", icon: TimerIcon, label: "Timer" },
  { type: "stopwatch", icon: Watch, label: "Stopwatch" },
  { type: "clock", icon: ClockIcon, label: "Clock" },
  { type: "studentList", icon: Users, label: "Student list", classOnly: true },
  { type: "picker", icon: Shuffle, label: "Random picker" },
  { type: "groups", icon: UsersRound, label: "Group generator" },
  { type: "image", icon: ImageIcon, label: "Image" },
];

function renderWidgetContent(w: WidgetInstance, classId?: string) {
  switch (w.type) {
    case "noise":
      return <NoiseMonitorWidget widget={w} classId={classId} />;
    case "timer":
      return <TimerWidget widget={w} />;
    case "stopwatch":
      return <StopwatchWidget widget={w} />;
    case "clock":
      return <ClockWidget />;
    case "studentList":
      return classId ? <StudentListWidget classId={classId} /> : null;
    case "picker":
      return <RandomPickerWidget widget={w} classId={classId} />;
    case "groups":
      return <GroupGeneratorWidget widget={w} classId={classId} />;
    case "image":
      return <ImageWidget widget={w} />;
  }
}

function BackgroundPanel() {
  const board = useBoard();
  return (
    <div className="mt-2 flex flex-col gap-2.5">
      <div className="grid grid-cols-3 gap-1.5">
        <button
          onClick={() => board.setBgMode("grid")}
          className={`flex flex-col items-center gap-1 rounded-lg border-[3px] border-(--color-border) py-2 text-[10px] font-bold ${
            board.bgMode === "grid" ? "bg-(--color-orange-100) shadow-hard-sm" : "bg-(--color-surface) text-(--color-ink-soft)"
          }`}
        >
          <Grid3x3 size={14} /> Grid
        </button>
        <button
          onClick={() => board.setBgMode("color")}
          className={`flex flex-col items-center gap-1 rounded-lg border-[3px] border-(--color-border) py-2 text-[10px] font-bold ${
            board.bgMode === "color" ? "bg-(--color-orange-100) shadow-hard-sm" : "bg-(--color-surface) text-(--color-ink-soft)"
          }`}
        >
          <Palette size={14} /> Color
        </button>
        <label
          className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border-[3px] border-(--color-border) py-2 text-[10px] font-bold ${
            board.bgMode === "image" ? "bg-(--color-orange-100) shadow-hard-sm" : "bg-(--color-surface) text-(--color-ink-soft)"
          }`}
        >
          <ImagePlus size={14} /> Image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) board.setBgUrl(URL.createObjectURL(f));
            }}
          />
        </label>
      </div>

      {board.bgMode === "color" && (
        <div className="grid grid-cols-6 gap-1.5">
          {BG_PRESETS.map((p) => (
            <button
              key={p.id}
              title={p.label}
              onClick={() => board.setBgColor(p.color)}
              className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                board.bgColor === p.color ? "border-(--color-border) shadow-hard-sm" : "border-(--color-border)/30"
              }`}
              style={{ background: p.color }}
            />
          ))}
          <input
            type="color"
            value={board.bgColor}
            onChange={(e) => board.setBgColor(e.target.value)}
            className="h-7 w-7 cursor-pointer rounded-full border-2 border-(--color-border)/30 bg-transparent p-0"
            title="Custom color"
          />
        </div>
      )}

      {board.bgMode === "image" && !board.bgUrl && (
        <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-(--color-border) bg-(--color-paper-dim) py-4 text-[11px] font-bold text-(--color-ink-soft) hover:bg-(--color-orange-100)">
          <ImagePlus size={16} />
          Upload background image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) board.setBgUrl(URL.createObjectURL(f));
            }}
          />
        </label>
      )}

      {board.bgMode === "image" && board.bgUrl && (
        <div className="flex flex-col gap-2">
          <div className="relative overflow-hidden rounded-lg border-[3px] border-(--color-border)">
            <img src={board.bgUrl} alt="" className="h-20 w-full object-cover" />
            <button
              onClick={() => {
                board.setBgUrl(null);
                board.setBgMode("grid");
              }}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-(--color-border) bg-(--color-surface)"
            >
              <X size={12} />
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-(--color-ink-soft)">
            <input
              type="checkbox"
              checked={board.bgOverlay}
              onChange={(e) => board.setBgOverlay(e.target.checked)}
              className="accent-(--color-orange-500)"
            />
            Readability overlay
          </label>
        </div>
      )}
    </div>
  );
}

export function Board({ classId }: { classId?: string }) {
  const board = useBoard();
  const { mode, setMode, zoom, setZoom, pan, setPan, widgets, addWidget, removeWidget, restoreWidget } = board;
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const currentStroke = useRef<{ x: number; y: number }[]>([]);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const panRef = useRef<{ startX: number; startY: number; px: number; py: number } | null>(null);

  function toBoardCoords(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of board.strokes) {
      if (s.points.length < 2) continue;
      ctx.globalCompositeOperation = s.erase ? "destination-out" : "source-over";
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash(s.dash);
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (const p of s.points.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.setLineDash([]);
  }, [board.strokes]);

  function onCanvasPointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (mode !== "pen") return;
    drawingRef.current = true;
    currentStroke.current = [toBoardCoords(e.clientX, e.clientY)];
    (e.target as Element).setPointerCapture(e.pointerId);
  }
  function onCanvasPointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const pt = toBoardCoords(e.clientX, e.clientY);
    currentStroke.current.push(pt);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && currentStroke.current.length > 1) {
      const [a, b] = currentStroke.current.slice(-2);
      ctx.globalCompositeOperation = board.erasing ? "destination-out" : "source-over";
      ctx.strokeStyle = PEN_COLOR_HEX[board.penColor];
      ctx.lineWidth = board.erasing ? board.penWidth * 3 : board.penWidth;
      ctx.lineCap = "round";
      ctx.setLineDash(board.erasing ? [] : dashPattern(board.lineStyle, board.penWidth));
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }
  }
  function onCanvasPointerUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (currentStroke.current.length > 1) {
      board.addStroke({
        color: PEN_COLOR_HEX[board.penColor],
        width: board.erasing ? board.penWidth * 3 : board.penWidth,
        points: currentStroke.current,
        dash: board.erasing ? [] : dashPattern(board.lineStyle, board.penWidth),
        erase: board.erasing,
      });
    }
    currentStroke.current = [];
  }

  function onViewportPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains("dot-grid")) {
      board.setSelectedId(null);
    }
    if (!spaceHeld) return;
    panRef.current = { startX: e.clientX, startY: e.clientY, px: pan.x, py: pan.y };
  }
  function onViewportPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!panRef.current) return;
    setPan({ x: panRef.current.px + (e.clientX - panRef.current.startX), y: panRef.current.py + (e.clientY - panRef.current.startY) });
  }
  function onViewportPointerUp() {
    panRef.current = null;
  }

  function onWheel(e: React.WheelEvent) {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    setZoom(zoom + (e.deltaY > 0 ? -0.08 : 0.08));
  }

  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  function closeWidget(id: string) {
    setRemovingIds((s) => new Set(s).add(id));
    setTimeout(() => {
      removeWidget(id);
      setRemovingIds((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }, 160);
  }

  const minimizedWidgets = widgets.filter((w) => w.minimized);
  const onBoardWidgets = widgets.filter((w) => !w.minimized);

  const boardSurfaceStyle: CSSProperties = {
    width: 3000,
    height: 2000,
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
  };
  if (board.bgMode === "color") {
    boardSurfaceStyle.background = board.bgColor;
  } else if (board.bgMode === "image" && board.bgUrl) {
    boardSurfaceStyle.backgroundImage = `url(${board.bgUrl})`;
    boardSurfaceStyle.backgroundSize = "cover";
    boardSurfaceStyle.backgroundPosition = "center";
  }

  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => e.code === "Space" && setSpaceHeld(true)}
      onKeyUp={(e) => e.code === "Space" && setSpaceHeld(false)}
      className="flex h-screen w-full bg-(--color-paper) outline-none"
    >
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r-[3px] border-(--color-border) bg-(--color-surface) p-4 scrollbar-thin">
        <div className="flex rounded-xl border-[3px] border-(--color-border) bg-(--color-paper-dim) p-1">
          <button
            onClick={() => setMode("cursor")}
            className={`nav-hover flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold ${
              mode === "cursor"
                ? "border border-(--color-border) bg-(--color-surface) text-(--color-ink) shadow-pill"
                : "border border-transparent text-(--color-ink-muted)"
            }`}
          >
            <MousePointer2 size={14} /> Cursor
          </button>
          <button
            onClick={() => setMode("pen")}
            className={`nav-hover flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold ${
              mode === "pen"
                ? "border border-(--color-border) bg-(--color-orange-500) text-(--color-ink-on-accent) shadow-pill"
                : "border border-transparent text-(--color-ink-muted)"
            }`}
          >
            <Pen size={14} /> Pen
          </button>
        </div>

        {mode === "pen" ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-(--color-ink-muted)">Pen</p>
            <div className="mt-2 flex gap-2">
              {(Object.keys(PEN_COLOR_HEX) as PenColor[]).map((c) => (
                <button
                  key={c}
                  onClick={() => board.setPenColor(c)}
                  className={`h-8 w-8 rounded-full border-[3px] transition-transform hover:scale-110 ${
                    board.penColor === c ? "border-(--color-border) shadow-hard-sm" : "border-(--color-border)/30"
                  }`}
                  style={{ background: PEN_COLOR_HEX[c] }}
                />
              ))}
            </div>

            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-(--color-ink-muted)">Thickness</p>
            <div className="mt-2 flex gap-2">
              {THICKNESS_OPTIONS.map((w) => (
                <button
                  key={w.value}
                  onClick={() => board.setPenWidth(w.value)}
                  title={w.label}
                  className={`flex h-9 flex-1 items-center justify-center rounded-lg border-[3px] border-(--color-border) ${
                    board.penWidth === w.value ? "bg-(--color-orange-100) shadow-hard-sm" : "bg-(--color-surface)"
                  }`}
                >
                  <span className="rounded-full bg-(--color-ink)" style={{ width: w.value + 2, height: w.value + 2 }} />
                </button>
              ))}
            </div>
            <input
              type="range"
              min={1}
              max={16}
              value={board.penWidth}
              onChange={(e) => board.setPenWidth(Number(e.target.value))}
              className="mt-2 w-full accent-(--color-orange-500)"
            />

            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-(--color-ink-muted)">Line type</p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {LINE_STYLES.map((ls) => (
                <button
                  key={ls.value}
                  onClick={() => board.setLineStyle(ls.value)}
                  className={`flex h-9 items-center justify-center rounded-lg border-[3px] border-(--color-border) text-[10px] font-bold ${
                    board.lineStyle === ls.value ? "bg-(--color-orange-100) shadow-hard-sm" : "bg-(--color-surface) text-(--color-ink-soft)"
                  }`}
                >
                  {ls.label}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-1.5">
              <button
                onClick={() => board.setErasing(!board.erasing)}
                className={`flex items-center justify-center gap-1.5 rounded-lg border-[3px] border-(--color-border) py-2 text-xs font-bold ${
                  board.erasing ? "bg-(--color-pink-100) shadow-hard-sm" : "bg-(--color-surface) text-(--color-ink-soft)"
                }`}
              >
                <Eraser size={13} /> Eraser
              </button>
              <button
                onClick={board.clearInk}
                className="flex items-center justify-center gap-1.5 rounded-lg border-[3px] border-(--color-border) bg-(--color-surface) py-2 text-xs font-bold text-(--color-ink-soft) hover:bg-(--color-danger-100)"
              >
                <Trash2 size={13} /> Clear
              </button>
              <button
                onClick={board.undo}
                disabled={board.strokes.length === 0}
                className="flex items-center justify-center gap-1.5 rounded-lg border-[3px] border-(--color-border) bg-(--color-surface) py-2 text-xs font-bold text-(--color-ink-soft) disabled:opacity-30"
              >
                <Undo2 size={13} /> Undo
              </button>
              <button
                onClick={board.redo}
                disabled={board.redoStack.length === 0}
                className="flex items-center justify-center gap-1.5 rounded-lg border-[3px] border-(--color-border) bg-(--color-surface) py-2 text-xs font-bold text-(--color-ink-soft) disabled:opacity-30"
              >
                <Redo2 size={13} /> Redo
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-(--color-ink-muted)">Add widget</p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {PALETTE.filter((p) => !p.classOnly || classId).map((p) => (
                <button
                  key={p.type}
                  onClick={() => addWidget(p.type)}
                  className="press-hard flex flex-col items-center gap-1.5 rounded-lg border-[3px] border-(--color-border) bg-(--color-surface) py-2.5 text-[11px] font-bold text-(--color-ink-soft) shadow-hard-sm hover:bg-(--color-orange-100) hover:text-(--color-ink)"
                >
                  <p.icon size={16} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-(--color-ink-muted)">Background</p>
          <BackgroundPanel />
        </div>

        {minimizedWidgets.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-(--color-ink-muted)">Docked</p>
            <div className="mt-2 flex flex-col gap-1.5">
              {minimizedWidgets.map((w) => {
                const Icon = WIDGET_ICON[w.type];
                const live = widgetLiveValue(w);
                return (
                  <button
                    key={w.id}
                    onClick={() => restoreWidget(w.id)}
                    className="animate-rise-in flex items-center gap-2 rounded-lg border-[3px] border-(--color-border) bg-(--color-paper-dim) px-2.5 py-2 text-left hover:bg-(--color-orange-100)"
                  >
                    <Icon size={14} className="text-(--color-ink-soft)" />
                    <span className="flex-1 truncate text-xs font-bold text-(--color-ink)">
                      {WIDGET_DEFAULTS[w.type].label}
                    </span>
                    {live && <span className="text-[10px] font-bold tabular-nums text-(--color-orange-600)">{live}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      {/* Viewport */}
      <div
        ref={viewportRef}
        onWheel={onWheel}
        onPointerDown={onViewportPointerDown}
        onPointerMove={onViewportPointerMove}
        onPointerUp={onViewportPointerUp}
        className="relative flex-1 overflow-hidden bg-(--color-paper)"
        style={{ cursor: spaceHeld ? "grab" : mode === "pen" ? "crosshair" : "default" }}
      >
        <div
          className={`absolute left-0 top-0 origin-top-left ${board.bgMode === "grid" ? "dot-grid" : ""}`}
          style={boardSurfaceStyle}
        >
          {board.bgMode === "image" && board.bgUrl && board.bgOverlay && (
            <div className="absolute inset-0 bg-(--color-paper)/55" />
          )}

          <canvas
            ref={canvasRef}
            width={3000}
            height={2000}
            onPointerDown={onCanvasPointerDown}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
            className="absolute left-0 top-0"
            style={{ pointerEvents: mode === "pen" ? "auto" : "none", cursor: board.erasing ? "cell" : undefined }}
          />

          <div className="absolute left-0 top-0" style={{ pointerEvents: mode === "cursor" ? "auto" : "none" }}>
            {onBoardWidgets.map((w) => (
              <div
                key={w.id}
                className={`absolute ${removingIds.has(w.id) ? "animate-widget-out" : ""}`}
                style={{ left: w.x, top: w.y, zIndex: w.zIndex }}
              >
                <WidgetShell widget={w} title={WIDGET_DEFAULTS[w.type].label} onClose={() => closeWidget(w.id)}>
                  {renderWidgetContent(w, classId)}
                </WidgetShell>
              </div>
            ))}
          </div>
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-5 right-5 flex items-center gap-1 rounded-xl border-[3px] border-(--color-border) bg-(--color-surface) p-1 shadow-hard-sm">
          <button onClick={() => setZoom(zoom - 0.1)} className="rounded-lg p-2 text-(--color-ink-soft) hover:bg-(--color-paper-dim)">
            <ZoomOut size={15} />
          </button>
          <span className="w-10 text-center text-xs font-semibold text-(--color-ink)">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(zoom + 0.1)} className="rounded-lg p-2 text-(--color-ink-soft) hover:bg-(--color-paper-dim)">
            <ZoomIn size={15} />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="ml-1 rounded-lg border-l border-(--color-line) p-2 pl-2.5 text-(--color-ink-soft) hover:bg-(--color-paper-dim)"
          >
            <Maximize size={15} />
          </button>
        </div>

        {mode === "pen" && (
          <div className="animate-rise-in absolute left-1/2 top-4 -translate-x-1/2 rounded-full border-[3px] border-(--color-border) bg-(--color-orange-500) px-3.5 py-1.5 text-xs font-bold text-(--color-ink-on-accent) shadow-hard-sm">
            Pen mode: widgets are docked to the sidebar
          </div>
        )}
      </div>
    </div>
  );
}
