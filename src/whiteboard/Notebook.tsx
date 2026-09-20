import { useEffect, useRef, useState } from "react";
import { Pen, Eraser, Trash2, Undo2, Palette } from "lucide-react";

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  erase: boolean;
}

export function Notebook() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const currentStroke = useRef<{ x: number; y: number }[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [penColor, setPenColor] = useState("#000000");
  const [penWidth, setPenWidth] = useState(3);
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (const p of stroke.points.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  }, [strokes]);

  function getBoardCoords(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  function onCanvasPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = true;
    currentStroke.current = [getBoardCoords(e.clientX, e.clientY)];
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  function onCanvasPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const pt = getBoardCoords(e.clientX, e.clientY);
    currentStroke.current.push(pt);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && currentStroke.current.length > 1) {
      const [a, b] = currentStroke.current.slice(-2);
      ctx.globalCompositeOperation = erasing ? "destination-out" : "source-over";
      ctx.strokeStyle = penColor;
      ctx.lineWidth = erasing ? penWidth * 2 : penWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
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
      setStrokes([
        ...strokes,
        {
          color: penColor,
          width: erasing ? penWidth * 2 : penWidth,
          points: currentStroke.current,
          erase: erasing,
        },
      ]);
    }
    currentStroke.current = [];
  }

  return (
    <div className="flex h-screen flex-col bg-(--color-paper)">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b-2 border-(--color-border) bg-(--color-surface) p-4">
        <button
          onClick={() => setErasing(false)}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${
            !erasing ? "bg-(--color-orange-500) text-(--color-ink-on-accent)" : "bg-(--color-paper-dim) text-(--color-ink)"
          }`}
        >
          <Pen size={16} /> Pen
        </button>

        <button
          onClick={() => setErasing(true)}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${
            erasing ? "bg-(--color-orange-500) text-(--color-ink-on-accent)" : "bg-(--color-paper-dim) text-(--color-ink)"
          }`}
        >
          <Eraser size={16} /> Erase
        </button>

        <div className="mx-2 h-6 w-0.5 bg-(--color-border)" />

        <div className="flex items-center gap-2">
          <Palette size={16} className="text-(--color-ink-muted)" />
          <input
            type="color"
            value={penColor}
            onChange={(e) => setPenColor(e.target.value)}
            disabled={erasing}
            className="h-8 w-8 cursor-pointer rounded border-2 border-(--color-border)"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-(--color-ink-muted)">Size:</span>
          <input
            type="range"
            min="1"
            max="15"
            value={penWidth}
            onChange={(e) => setPenWidth(parseInt(e.target.value))}
            disabled={erasing}
            className="w-24"
          />
          <span className="text-xs font-bold text-(--color-ink)">{penWidth}px</span>
        </div>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setStrokes(strokes.slice(0, -1))}
            disabled={strokes.length === 0}
            className="rounded-lg bg-(--color-paper-dim) p-2 hover:bg-(--color-orange-100) disabled:opacity-50"
          >
            <Undo2 size={16} className="text-(--color-ink)" />
          </button>

          <button
            onClick={() => setStrokes([])}
            disabled={strokes.length === 0}
            className="rounded-lg bg-(--color-danger-100) p-2 hover:bg-(--color-danger)/20"
          >
            <Trash2 size={16} className="text-(--color-danger)" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
          className="w-full cursor-crosshair bg-white"
          style={{ cursor: erasing ? "cell" : "crosshair" }}
        />
      </div>
    </div>
  );
}
