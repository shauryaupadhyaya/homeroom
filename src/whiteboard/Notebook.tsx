import { useEffect, useRef, useState } from "react";
import { Pen, Eraser, Trash2, Undo2, Palette, Type, Image, ZoomIn, ZoomOut } from "lucide-react";

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  erase: boolean;
}

interface TextBox {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  page: number;
}

interface ImageItem {
  id: string;
  x: number;
  y: number;
  src: string;
  width: number;
  height: number;
  page: number;
}

export function Notebook() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);
  const currentStroke = useRef<{ x: number; y: number }[]>([]);

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [mode, setMode] = useState<"pen" | "eraser" | "text" | "image">("pen");
  const [penColor, setPenColor] = useState("#000000");
  const [penWidth, setPenWidth] = useState(3);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputPos, setTextInputPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const imageCache = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.scale(zoom, zoom);

    const pageStrokes = strokes.filter(s => !('page' in s) || (s as any).page === currentPage);
    for (const stroke of pageStrokes) {
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

    const pageTexts = textBoxes.filter(t => t.page === currentPage);
    for (const box of pageTexts) {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = box.color;
      ctx.font = `${box.fontSize}px sans-serif`;
      ctx.fillText(box.text, box.x, box.y);
    }

    const pageImages = images.filter(i => i.page === currentPage);
    for (const img of pageImages) {
      if (!imageCache.current[img.id]) {
        const image = document.createElement('img');
        image.src = img.src;
        imageCache.current[img.id] = image;
      }
      const image = imageCache.current[img.id];
      if (image.complete) {
        ctx.drawImage(image, img.x, img.y, img.width, img.height);
      }
    }

    ctx.restore();
  }, [strokes, textBoxes, images, zoom, currentPage]);

  function getBoardCoords(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom,
    };
  }

  function onCanvasPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (mode === "text") {
      const coords = getBoardCoords(e.clientX, e.clientY);
      setTextInputPos({ x: coords.x, y: coords.y });
      setShowTextInput(true);
      return;
    }

    if (mode === "image") {
      fileInputRef.current?.click();
      return;
    }

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
      ctx.globalCompositeOperation = mode === "eraser" ? "destination-out" : "source-over";
      ctx.strokeStyle = penColor;
      ctx.lineWidth = mode === "eraser" ? penWidth * 2 : penWidth;
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
          width: mode === "eraser" ? penWidth * 2 : penWidth,
          points: currentStroke.current,
          erase: mode === "eraser",
        },
      ]);
    }
    currentStroke.current = [];
  }

  function addTextBox() {
    if (textInput.trim()) {
      setTextBoxes([...textBoxes, { id: Date.now().toString(), x: textInputPos.x, y: textInputPos.y, text: textInput, fontSize: 16, color: penColor, page: currentPage }]);
      setTextInput("");
      setShowTextInput(false);
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        setImages([...images, { id: Date.now().toString(), x: textInputPos.x, y: textInputPos.y, src, width: 200, height: 150, page: currentPage }]);
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-(--color-paper)">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b-2 border-(--color-border) bg-(--color-surface) p-4 overflow-x-auto">
        <button
          onClick={() => setMode("pen")}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold whitespace-nowrap ${
            mode === "pen" ? "bg-(--color-orange-500) text-(--color-ink-on-accent)" : "bg-(--color-paper-dim) text-(--color-ink)"
          }`}
        >
          <Pen size={16} /> Pen
        </button>

        <button
          onClick={() => setMode("eraser")}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold whitespace-nowrap ${
            mode === "eraser" ? "bg-(--color-orange-500) text-(--color-ink-on-accent)" : "bg-(--color-paper-dim) text-(--color-ink)"
          }`}
        >
          <Eraser size={16} /> Erase
        </button>

        <button
          onClick={() => setMode("text")}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold whitespace-nowrap ${
            mode === "text" ? "bg-(--color-orange-500) text-(--color-ink-on-accent)" : "bg-(--color-paper-dim) text-(--color-ink)"
          }`}
        >
          <Type size={16} /> Text
        </button>

        <button
          onClick={() => setMode("image")}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold whitespace-nowrap ${
            mode === "image" ? "bg-(--color-orange-500) text-(--color-ink-on-accent)" : "bg-(--color-paper-dim) text-(--color-ink)"
          }`}
        >
          <Image size={16} /> Image
        </button>

        <div className="mx-2 h-6 w-0.5 bg-(--color-border)" />

        <div className="flex items-center gap-2">
          <Palette size={16} className="text-(--color-ink-muted)" />
          <input
            type="color"
            value={penColor}
            onChange={(e) => setPenColor(e.target.value)}
            disabled={mode === "eraser"}
            className="h-8 w-8 cursor-pointer rounded border-2 border-(--color-border)"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-(--color-ink-muted) whitespace-nowrap">Size:</span>
          <input
            type="range"
            min="1"
            max="15"
            value={penWidth}
            onChange={(e) => setPenWidth(parseInt(e.target.value))}
            disabled={mode === "eraser"}
            className="w-24"
          />
          <span className="text-xs font-bold text-(--color-ink)">{penWidth}px</span>
        </div>

        <div className="mx-2 h-6 w-0.5 bg-(--color-border)" />

        <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="rounded-lg bg-(--color-paper-dim) p-2">
          <ZoomOut size={16} className="text-(--color-ink)" />
        </button>
        <span className="text-xs font-bold text-(--color-ink) whitespace-nowrap">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="rounded-lg bg-(--color-paper-dim) p-2">
          <ZoomIn size={16} className="text-(--color-ink)" />
        </button>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => { setStrokes(strokes.slice(0, -1)); setTextBoxes(textBoxes.slice(0, -1)); setImages(images.slice(0, -1)); }}
            disabled={strokes.length === 0 && textBoxes.length === 0 && images.length === 0}
            className="rounded-lg bg-(--color-paper-dim) p-2 hover:bg-(--color-orange-100) disabled:opacity-50 whitespace-nowrap"
          >
            <Undo2 size={16} className="text-(--color-ink)" />
          </button>

          <button
            onClick={() => { setStrokes([]); setTextBoxes([]); setImages([]); setCurrentPage(1); }}
            disabled={strokes.length === 0 && textBoxes.length === 0 && images.length === 0}
            className="rounded-lg bg-(--color-danger-100) p-2 hover:bg-(--color-danger)/20 whitespace-nowrap"
          >
            <Trash2 size={16} className="text-(--color-danger)" />
          </button>

          <span className="text-xs font-bold text-(--color-ink) whitespace-nowrap">Page {currentPage}</span>
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
          onWheel={(e) => {
            e.preventDefault();
            setCurrentPage(Math.max(1, currentPage + (e.deltaY > 0 ? 1 : -1)));
          }}
          className="w-full bg-white"
          style={{ cursor: mode === "eraser" ? "cell" : mode === "text" ? "text" : mode === "image" ? "crosshair" : "crosshair" }}
        />

        {showTextInput && (
          <div className="absolute bg-(--color-surface) border-2 border-(--color-border) rounded-lg p-2" style={{ left: textInputPos.x, top: textInputPos.y }}>
            <input
              type="text"
              autoFocus
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTextBox()}
              placeholder="Type text..."
              className="border border-(--color-border) rounded px-2 py-1 text-sm w-48"
            />
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}
