/**
 * Render notebook page data to canvas for PDF export
 *
 * User Requirement: "Notebook PDF export... PDF Page 1 = Notebook Page 1... Preserve: page dimensions, grid, text, drawings"
 * Callers: LessonSummary (export PDF), potentially mid-lesson preview
 * Database: None - client-side rendering only
 * Note: Page data comes from sessionStorage(lesson-notebook-{classId})
 */

const PAGE_WIDTH = 816; // pixels (210mm at 96 DPI)
const PAGE_HEIGHT = 1056; // pixels (297mm at 96 DPI)
const GRID_SIZE = 24;

export function renderNotebookPageToCanvas(pageData: any): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_WIDTH;
  canvas.height = PAGE_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Fill background
  ctx.fillStyle = "#fafaf8";
  ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);

  // Draw grid
  ctx.strokeStyle = "#e5e5e5";
  ctx.lineWidth = 1;
  for (let x = 0; x <= PAGE_WIDTH; x += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, PAGE_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= PAGE_HEIGHT; y += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(PAGE_WIDTH, y);
    ctx.stroke();
  }

  // Draw margins
  ctx.strokeStyle = "#d0d0c8";
  ctx.lineWidth = 2;
  const margin = 40;
  ctx.strokeRect(margin, margin, PAGE_WIDTH - 2 * margin, PAGE_HEIGHT - 2 * margin);

  // Draw strokes
  for (const stroke of pageData.strokes || []) {
    if (!stroke.points || stroke.points.length < 2) continue;
    ctx.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (const p of stroke.points.slice(1)) {
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";

  // Draw text
  for (const textEl of pageData.textElements || []) {
    ctx.fillStyle = textEl.color || "#000000";
    const fontParts = [];
    if (textEl.bold) fontParts.push("bold");
    if (textEl.italic) fontParts.push("italic");
    fontParts.push(`${textEl.fontSize}px sans-serif`);
    ctx.font = fontParts.join(" ");
    ctx.fillText(textEl.text, textEl.x, textEl.y + textEl.fontSize);
  }

  return canvas;
}
