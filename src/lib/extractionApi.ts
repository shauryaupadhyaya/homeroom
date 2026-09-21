/**
 * Client-side API for AI document extraction via Supabase Edge Function
 * Converts documents to structured timetable/syllabus data with validation
 */

export interface ExtractionResult {
  success: boolean;
  document_type: string;
  extracted_data: any[];
  validation_warnings: string[];
  extraction_confidence: number;
  processing_notes: string[];
}

export type TimetableEntry = {
  day: string;
  start_time: string;
  end_time: string;
  class?: string;
  subject: string;
  teacher?: string;
  room?: string;
  confidence: number;
};

export type SyllabusSection = {
  name: string;
  topics?: SyllabusSection[];
  learning_objectives?: string[];
  confidence?: number;
};

export async function extractDocument(
  documentType: "timetable" | "syllabus",
  imageData: string,
  classIds?: string[]
): Promise<ExtractionResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("Supabase URL not configured");
  }

  const functionUrl = `${supabaseUrl}/functions/v1/extract-document`;

  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      document_type: documentType,
      image_data: imageData,
      class_ids: classIds,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Extraction failed");
  }

  return response.json() as Promise<ExtractionResult>;
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function convertDocumentToImage(file: File): Promise<string> {
  if (file.type === "application/pdf") {
    throw new Error("PDF support coming soon - please upload a screenshot instead");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image file (PNG, JPG, etc.)");
  }

  return fileToBase64(file);
}
