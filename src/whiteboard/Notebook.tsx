import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Undo2, ChevronLeft, ChevronRight, Pen, Type, Eraser, ZoomIn, ZoomOut, Copy } from "lucide-react";

// A4 dimensions in pixels (210mm x 297mm at 96 DPI)
const PAGE_WIDTH = 816;
const PAGE_HEIGHT = 1056;
const GRID_SIZE = 24;

interface Stroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  erase: boolean;
  page: number;
}

interface TextElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  page: number;
}

interface NotebookPage {
  id: string;
  number: number;
  strokes: Stroke[];
  textElements: TextElement[];
}

export function Notebook({ classId }: { classId?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);

  // Page management - load from sessionStorage if available
  const [pages, setPages] = useState<NotebookPage[]>(() => {
    if (classId) {
      const stored = sessionStorage.getItem(`lesson-notebook-${classId}`);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          return [{ id: `page-1`, number: 1, strokes: [], textElements: [] }];
        }
      }
    }
    return [{ id: `page-1`, number: 1, strokes: [], textElements: [] }];
  });
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const currentPage = pages[currentPageIndex];

  // Drawing state
  const [mode, setMode] = useState<"pen" | "eraser" | "text" | "select">("pen");
  const [penColor, setPenColor] = useState("#000000");
  const [penWidth, setPenWidth] = useState(2);

  // Text editing
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textEditInput, setTextEditInput] = useState("");

  // UI state
  const [zoom, setZoom] = useState(1);
  const [draggedTextId, setDraggedTextId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Persist pages to sessionStorage
  useEffect(() => {
    if (classId) {
      sessionStorage.setItem(`lesson-notebook-${classId}`, JSON.stringify(pages));
    }
  }, [pages, classId]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scaledWidth = PAGE_WIDTH * zoom;
    const scaledHeight = PAGE_HEIGHT * zoom;

    canvas.width = scaledWidth;
    canvas.height = scaledHeight;

    ctx.fillStyle = "#fafaf8";
    ctx.fillRect(0, 0, scaledWidth, scaledHeight);

    // Draw grid
    ctx.strokeStyle = "#e5e5e5";
    ctx.lineWidth = 1 / zoom;
    for (let x = 0; x <= scaledWidth; x += GRID_SIZE * zoom) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, scaledHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= scaledHeight; y += GRID_SIZE * zoom) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(scaledWidth, y);
      ctx.stroke();
    }

    // Draw margins
    ctx.strokeStyle = "#d0d0c8";
    ctx.lineWidth = 2 / zoom;
    const margin = 40 * zoom;
    ctx.strokeRect(margin, margin, scaledWidth - 2 * margin, scaledHeight - 2 * margin);

    // Draw strokes
    for (const stroke of currentPage.strokes) {
      if (stroke.points.length < 2) continue;
      ctx.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width * zoom;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x * zoom, stroke.points[0].y * zoom);
      for (const p of stroke.points.slice(1)) {
        ctx.lineTo(p.x * zoom, p.y * zoom);
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  }, [currentPage, zoom]);

  function getCanvasCoords(clientX: number, clientY: number) {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom,
    };
  }

  function onCanvasPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (mode === "text") {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      const id = `text-${Date.now()}`;
      const newElement: TextElement = {
        id,
        x: coords.x,
        y: coords.y,
        width: 200,
        height: 40,
        text: "",
        fontSize: 14,
        color: penColor,
        bold: false,
        italic: false,
        page: currentPage.number,
      };
      setPages((prev) => {
        const updated = [...prev];
        updated[currentPageIndex].textElements.push(newElement);
        return updated;
      });
      setEditingTextId(id);
      setTextEditInput("");
      return;
    }

    drawingRef.current = true;
    currentStrokeRef.current = [getCanvasCoords(e.clientX, e.clientY)];
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  function onCanvasPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const pt = getCanvasCoords(e.clientX, e.clientY);
    currentStrokeRef.current.push(pt);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && currentStrokeRef.current.length > 1) {
      const [a, b] = currentStrokeRef.current.slice(-2);
      ctx.globalCompositeOperation = mode === "eraser" ? "destination-out" : "source-over";
      ctx.strokeStyle = penColor;
      ctx.lineWidth = (mode === "eraser" ? penWidth * 2 : penWidth) * zoom;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(a.x * zoom, a.y * zoom);
      ctx.lineTo(b.x * zoom, b.y * zoom);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }
  }

  function onCanvasPointerUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (currentStrokeRef.current.length > 1) {
      const newStroke: Stroke = {
        id: `stroke-${Date.now()}`,
        points: currentStrokeRef.current,
        color: penColor,
        width: mode === "eraser" ? penWidth * 2 : penWidth,
        erase: mode === "eraser",
        page: currentPage.number,
      };
      setPages((prev) => {
        const updated = [...prev];
        updated[currentPageIndex].strokes.push(newStroke);
        return updated;
      });
    }
    currentStrokeRef.current = [];
  }

  function handleTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLCanvasElement>) {
    if (!touchStartRef.current) return;
    const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    const diff = touchEnd.x - touchStartRef.current.x;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentPageIndex > 0) {
        setCurrentPageIndex((prev) => prev - 1);
      } else if (diff < 0 && currentPageIndex < pages.length - 1) {
        setCurrentPageIndex((prev) => prev + 1);
      }
    }
    touchStartRef.current = null;
  }

  function addPage() {
    if (pages.length >= 10) return;
    setPages((prev) => [
      ...prev,
      {
        id: `page-${Date.now()}`,
        number: prev.length + 1,
        strokes: [],
        textElements: [],
      },
    ]);
    setCurrentPageIndex(pages.length);
  }

  function deletePage() {
    if (pages.length <= 1) return;
    setPages((prev) => prev.filter((_, i) => i !== currentPageIndex));
    setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
  }

  function duplicatePage() {
    if (pages.length >= 10) return;
    const pageToDuplicate = pages[currentPageIndex];
    const newPage: NotebookPage = {
      id: `page-${Date.now()}`,
      number: pages.length + 1,
      strokes: pageToDuplicate.strokes.map((s) => ({ ...s, id: `stroke-${Date.now()}-${Math.random()}` })),
      textElements: pageToDuplicate.textElements.map((t) => ({ ...t, id: `text-${Date.now()}-${Math.random()}` })),
    };
    setPages((prev) => [...prev, newPage]);
  }

  function undo() {
    if (currentPage.strokes.length === 0 && currentPage.textElements.length === 0) return;
    setPages((prev) => {
      const updated = [...prev];
      if (updated[currentPageIndex].strokes.length > 0) {
        updated[currentPageIndex].strokes.pop();
      } else if (updated[currentPageIndex].textElements.length > 0) {
        updated[currentPageIndex].textElements.pop();
      }
      return updated;
    });
  }

  function clearPage() {
    if (confirm("Clear this page? This cannot be undone.")) {
      setPages((prev) => {
        const updated = [...prev];
        updated[currentPageIndex].strokes = [];
        updated[currentPageIndex].textElements = [];
        return updated;
      });
    }
  }

  return (
    <div className="flex h-screen flex-col bg-(--color-paper)">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b-2 border-(--color-border) bg-(--color-surface) p-3 overflow-x-auto">
        <button
          onClick={() => setMode("pen")}
          title="Pen tool"
          className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold ${
            mode === "pen" ? "bg-(--color-orange-500) text-(--color-ink-on-accent)" : "bg-(--color-paper-dim) text-(--color-ink)"
          }`}
        >
          <Pen size={14} />
        </button>

        <button
          onClick={() => setMode("eraser")}
          title="Eraser tool"
          className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold ${
            mode === "eraser" ? "bg-(--color-orange-500) text-(--color-ink-on-accent)" : "bg-(--color-paper-dim) text-(--color-ink)"
          }`}
        >
          <Eraser size={14} />
        </button>

        <button
          onClick={() => setMode("text")}
          title="Text tool"
          className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold ${
            mode === "text" ? "bg-(--color-orange-500) text-(--color-ink-on-accent)" : "bg-(--color-paper-dim) text-(--color-ink)"
          }`}
        >
          <Type size={14} />
        </button>

        <div className="mx-1 h-5 w-0.5 bg-(--color-border)" />

        <input
          type="color"
          value={penColor}
          onChange={(e) => setPenColor(e.target.value)}
          disabled={mode === "eraser"}
          className="h-7 w-7 cursor-pointer rounded border-2 border-(--color-border)"
          title="Pen color"
        />

        <select
          value={penWidth}
          onChange={(e) => setPenWidth(parseInt(e.target.value))}
          className="rounded border border-(--color-border) bg-(--color-paper) px-1.5 py-1 text-xs font-bold text-(--color-ink)"
          title="Pen width"
        >
          <option value="1">1px</option>
          <option value="2">2px</option>
          <option value="3">3px</option>
          <option value="4">4px</option>
          <option value="5">5px</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            title="Zoom out"
            className="rounded-lg bg-(--color-paper-dim) p-1.5 hover:bg-(--color-orange-100)"
          >
            <ZoomOut size={14} className="text-(--color-ink)" />
          </button>
          <span className="text-xs font-bold text-(--color-ink) w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            title="Zoom in"
            className="rounded-lg bg-(--color-paper-dim) p-1.5 hover:bg-(--color-orange-100)"
          >
            <ZoomIn size={14} className="text-(--color-ink)" />
          </button>

          <div className="mx-1 h-5 w-0.5 bg-(--color-border)" />

          <button
            onClick={undo}
            disabled={currentPage.strokes.length === 0 && currentPage.textElements.length === 0}
            title="Undo"
            className="rounded-lg bg-(--color-paper-dim) p-1.5 hover:bg-(--color-orange-100) disabled:opacity-40"
          >
            <Undo2 size={14} className="text-(--color-ink)" />
          </button>

          <button
            onClick={clearPage}
            disabled={currentPage.strokes.length === 0 && currentPage.textElements.length === 0}
            title="Clear page"
            className="rounded-lg bg-(--color-danger-100) p-1.5 hover:bg-(--color-danger-200) disabled:opacity-40"
          >
            <Trash2 size={14} className="text-(--color-danger)" />
          </button>
        </div>
      </div>

      {/* Main notebook area */}
      <div ref={containerRef} className="flex flex-1 items-center justify-center overflow-auto bg-(--color-paper-dim) p-4">
        <div className="relative" style={{ width: `${PAGE_WIDTH * zoom}px`, height: `${PAGE_HEIGHT * zoom}px` }}>
          <canvas
            ref={canvasRef}
            onPointerDown={onCanvasPointerDown}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="absolute top-0 left-0 bg-white cursor-crosshair"
            style={{ width: "100%", height: "100%", imageRendering: "crisp-edges" }}
          />

          {/* Text elements overlay */}
          {currentPage.textElements.map((textEl) => (
            <div
              key={textEl.id}
              className="absolute border-2 border-transparent hover:border-(--color-orange-500) rounded"
              style={{
                left: `${textEl.x * zoom}px`,
                top: `${textEl.y * zoom}px`,
                width: `${textEl.width * zoom}px`,
                height: `${textEl.height * zoom}px`,
                cursor: editingTextId === textEl.id ? "text" : "move",
              }}
              onClick={() => setEditingTextId(textEl.id)}
              onMouseDown={(e) => {
                if (editingTextId !== textEl.id) {
                  setDraggedTextId(textEl.id);
                  setDragOffset({
                    x: e.clientX - textEl.x * zoom,
                    y: e.clientY - textEl.y * zoom,
                  });
                }
              }}
              onMouseMove={(e) => {
                if (draggedTextId === textEl.id) {
                  const newX = (e.clientX - dragOffset.x) / zoom;
                  const newY = (e.clientY - dragOffset.y) / zoom;
                  setPages((prev) => {
                    const updated = [...prev];
                    const textIdx = updated[currentPageIndex].textElements.findIndex((t) => t.id === textEl.id);
                    if (textIdx !== -1) {
                      updated[currentPageIndex].textElements[textIdx].x = Math.max(0, Math.min(newX, PAGE_WIDTH - textEl.width));
                      updated[currentPageIndex].textElements[textIdx].y = Math.max(0, Math.min(newY, PAGE_HEIGHT - textEl.height));
                    }
                    return updated;
                  });
                }
              }}
              onMouseUp={() => setDraggedTextId(null)}
              onMouseLeave={() => setDraggedTextId(null)}
            >
              {editingTextId === textEl.id ? (
                <textarea
                  autoFocus
                  value={textEditInput}
                  onChange={(e) => setTextEditInput(e.target.value)}
                  onBlur={() => {
                    setPages((prev) => {
                      const updated = [...prev];
                      const idx = updated[currentPageIndex].textElements.findIndex((t) => t.id === textEl.id);
                      if (idx !== -1) {
                        updated[currentPageIndex].textElements[idx].text = textEditInput;
                      }
                      return updated;
                    });
                    setEditingTextId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setEditingTextId(null);
                    }
                  }}
                  className="w-full h-full p-1 border-none bg-transparent text-(--color-ink) font-sans focus:outline-none resize-none"
                  style={{ fontSize: `${textEl.fontSize * zoom}px` }}
                />
              ) : (
                <div className="p-1 text-(--color-ink) break-words" style={{ fontSize: `${textEl.fontSize * zoom}px` }}>
                  {textEl.text}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Page navigation */}
      <div className="flex items-center justify-between border-t-2 border-(--color-border) bg-(--color-surface) px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
            disabled={currentPageIndex === 0}
            title="Previous page"
            className="rounded-lg border-2 border-(--color-border) bg-(--color-paper) p-1.5 hover:bg-(--color-orange-100) disabled:opacity-40"
          >
            <ChevronLeft size={16} className="text-(--color-ink)" />
          </button>

          <span className="text-xs font-bold text-(--color-ink) px-3">
            Page {currentPageIndex + 1} / {pages.length}
          </span>

          <button
            onClick={() => setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))}
            disabled={currentPageIndex === pages.length - 1}
            title="Next page"
            className="rounded-lg border-2 border-(--color-border) bg-(--color-paper) p-1.5 hover:bg-(--color-orange-100) disabled:opacity-40"
          >
            <ChevronRight size={16} className="text-(--color-ink)" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={addPage}
            disabled={pages.length >= 10}
            title="Add page"
            className="flex items-center gap-1 rounded-lg bg-(--color-orange-500) px-3 py-1.5 text-xs font-bold text-(--color-ink-on-accent) hover:bg-(--color-orange-600) disabled:opacity-40"
          >
            <Plus size={14} /> Add Page
          </button>

          <button
            onClick={duplicatePage}
            disabled={pages.length >= 10}
            title="Duplicate page"
            className="rounded-lg border-2 border-(--color-border) bg-(--color-paper) p-1.5 hover:bg-(--color-orange-100) disabled:opacity-40"
          >
            <Copy size={14} className="text-(--color-ink)" />
          </button>

          <button
            onClick={deletePage}
            disabled={pages.length <= 1}
            title="Delete page"
            className="rounded-lg border-2 border-(--color-border) bg-(--color-paper) p-1.5 hover:bg-(--color-danger-100) disabled:opacity-40"
          >
            <Trash2 size={14} className="text-(--color-danger)" />
          </button>
        </div>
      </div>
    </div>
  );
}
