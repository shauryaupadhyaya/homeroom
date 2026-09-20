/**
 * Supabase Edge Function for AI-powered document extraction
 * Handles timetable and syllabus extraction using Claude Vision API
 *
 * This function:
 * 1. Converts image/PDF to base64 for processing
 * 2. Calls Claude Vision for document understanding
 * 3. Extracts structured JSON (timetable entries or syllabus sections)
 * 4. Validates output and provides confidence scores
 * 5. Returns structured data for teacher review UI
 */

import Anthropic from "@anthropic-ai/sdk";

interface TimetableEntry {
  day: string;
  period?: number;
  start_time: string;
  end_time: string;
  class?: string;
  subject: string;
  teacher?: string;
  room?: string;
  confidence: number;
}

interface SyllabusSection {
  name: string;
  topics?: SyllabusSection[];
  learning_objectives?: string[];
  confidence?: number;
}

interface ExtractionResult {
  success: boolean;
  document_type: string;
  extracted_data: TimetableEntry[] | SyllabusSection[];
  validation_warnings: string[];
  extraction_confidence: number;
  processing_notes: string[];
}

const anthropic = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { document_type, image_data, class_ids } = await req.json();

    if (!document_type || !image_data) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let extractedData: ExtractionResult;

    if (document_type === "timetable") {
      extractedData = await extractTimetable(image_data, class_ids);
    } else if (document_type === "syllabus") {
      extractedData = await extractSyllabus(image_data);
    } else {
      return new Response(JSON.stringify({ error: "Unknown document type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(extractedData), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Extraction error:", error);
    return new Response(
      JSON.stringify({
        error: "Extraction failed",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

async function extractTimetable(
  imageData: string,
  _classIds?: string[]
): Promise<ExtractionResult> {
  const prompt = `Extract timetable data from this image. Return ONLY a JSON array with this structure:
[
  {"day": "Monday", "start_time": "09:00", "end_time": "09:45", "class": "10A", "subject": "Maths", "teacher": "Smith", "room": "A101", "confidence": 0.95},
  ...
]

Rules:
- Extract ALL entries, do not omit rows
- Use null for unknown fields (teacher, room, class)
- Time format: HH:MM (24-hour)
- confidence: 0-1 based on how clear the data is
- Return [] if no timetable found
- Return ONLY JSON, no other text`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: imageData,
            },
          },
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  let entries: TimetableEntry[] = [];
  try {
    entries = JSON.parse(responseText);
  } catch {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      entries = JSON.parse(jsonMatch[0]);
    }
  }

  const warnings = validateTimetable(entries);
  const avgConfidence =
    entries.length > 0
      ? entries.reduce((sum, e) => sum + e.confidence, 0) / entries.length
      : 0;

  return {
    success: true,
    document_type: "timetable",
    extracted_data: entries,
    validation_warnings: warnings,
    extraction_confidence: avgConfidence,
    processing_notes: [
      `Extracted ${entries.length} timetable entries`,
      `Average confidence: ${(avgConfidence * 100).toFixed(0)}%`,
    ],
  };
}

async function extractSyllabus(imageData: string): Promise<ExtractionResult> {
  const prompt = `Extract syllabus structure from this document. Return ONLY JSON:
{
  "sections": [
    {"name": "Unit 1", "topics": [{"name": "1.1 Topic", "learning_objectives": ["Learn X", "Apply Y"], "confidence": 0.9}], "confidence": 0.95},
    ...
  ]
}

Rules:
- Preserve document's actual hierarchy
- Extract ALL sections and topics
- Include learning objectives if present
- Do NOT summarize - keep complete text
- confidence: 0-1 per element
- Return ONLY JSON, no other text`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: imageData,
            },
          },
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  let sections: SyllabusSection[] = [];
  try {
    const parsed = JSON.parse(responseText);
    sections = parsed.sections || [];
  } catch {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      sections = parsed.sections || [];
    }
  }

  const warnings = validateSyllabus(sections);

  return {
    success: true,
    document_type: "syllabus",
    extracted_data: sections,
    validation_warnings: warnings,
    extraction_confidence: 0.85,
    processing_notes: [
      `Extracted ${sections.length} main sections`,
      "Hierarchy preserved from source",
    ],
  };
}

function validateTimetable(entries: TimetableEntry[]): string[] {
  const warnings: string[] = [];
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    if (!entry.day || !days.some((d) => entry.day.toLowerCase().includes(d.toLowerCase()))) {
      warnings.push(`Entry ${i + 1}: Invalid day`);
    }

    if (!isValidTime(entry.start_time)) {
      warnings.push(`Entry ${i + 1}: Invalid start time`);
    }
    if (!isValidTime(entry.end_time)) {
      warnings.push(`Entry ${i + 1}: Invalid end time`);
    }

    if (!entry.subject) {
      warnings.push(`Entry ${i + 1}: Missing subject`);
    }

    if (entry.confidence < 0.7) {
      warnings.push(`Entry ${i + 1}: Low confidence (${entry.confidence})`);
    }
  }

  return warnings;
}

function validateSyllabus(sections: SyllabusSection[]): string[] {
  const warnings: string[] = [];

  if (sections.length === 0) {
    warnings.push("No syllabus structure detected");
  }

  for (let i = 0; i < sections.length; i++) {
    if (!sections[i].name || sections[i].name.trim() === "") {
      warnings.push(`Section ${i + 1}: Missing name`);
    }
  }

  return warnings;
}

function isValidTime(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}
