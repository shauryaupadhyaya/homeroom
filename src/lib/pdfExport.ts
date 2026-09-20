/**
 * PDF export utilities for Notebook and Whiteboard
 *
 * User requirement: "Add a section for Lesson Materials... Notebook, Whiteboard. The teacher should be able to download the lesson materials."
 * Callers: LessonSummary.tsx (lesson export), potentially Lesson.tsx (mid-lesson export)
 * APIs: jsPDF for PDF generation
 * No database changes - client-side only
 */

import jsPDF from "jspdf";

const PAGE_WIDTH = 210; // mm (A4 portrait)
const PAGE_HEIGHT = 297; // mm (A4 portrait)

export interface NotebookPageData {
  number: number;
  canvas: HTMLCanvasElement;
}

/**
 * Export notebook pages to multi-page PDF
 * Each notebook page becomes a PDF page
 */
export async function exportNotebookToPDF(pages: NotebookPageData[], fileName: string = "Notebook.pdf") {
  if (pages.length === 0) return;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  for (let i = 0; i < pages.length; i++) {
    const canvas = pages[i].canvas;
    const imageData = canvas.toDataURL("image/png");

    if (i > 0) {
      pdf.addPage();
    }

    pdf.addImage(imageData, "PNG", 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  }

  pdf.save(fileName);
}

/**
 * Export whiteboard canvas to single-page PDF
 * Whiteboard content (landscape orientation)
 */
export async function exportWhiteboardToPDF(canvas: HTMLCanvasElement, fileName: string = "Whiteboard.pdf") {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const imageData = canvas.toDataURL("image/png");
  pdf.addImage(imageData, "PNG", 0, 0, 297, 210); // landscape: 297mm width x 210mm height

  pdf.save(fileName);
}
