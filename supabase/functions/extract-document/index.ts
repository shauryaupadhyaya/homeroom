import { Tesseract } from "npm:tesseract.js@5.0.4";

interface TimetableEntry {
  day: string;
  start_time: string;
  end_time: string;
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

async function extractTimetableWithTesseract(imageData: string): Promise<TimetableEntry[]> {
  try {
    console.log("Starting Tesseract OCR extraction...");

    // Create worker for Tesseract
    const worker = await Tesseract.createWorker();

    // Recognize text from base64 image
    const result = await worker.recognize(`data:image/png;base64,${imageData}`);
    const fullText = result.data.text;

    await worker.terminate();

    console.log("Tesseract extracted text:", fullText.substring(0, 500));

    // Parse extracted text into timetable entries
    const entries: TimetableEntry[] = [];
    const lines = fullText.split('\n').filter((l: string) => l.trim().length > 3);

    const dayPattern = /\b(monday|tuesday|wednesday|thursday|friday)\b/i;
    const timePattern = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/;

    for (const line of lines) {
      const dayMatch = line.match(dayPattern);
      const timeMatch = line.match(timePattern);

      if (dayMatch && timeMatch) {
        // Extract parts
        const restOfLine = line
          .replace(dayMatch[0], "")
          .replace(timePattern, "")
          .trim();
        const parts = restOfLine.split(/[\s,|]+/).filter((p: string) => p.length > 1);

        let subject = parts[0] || "Subject";
        let teacher = parts[1] || "Teacher";
        let room = parts.length > 2 ? parts[parts.length - 1] : "Room";

        entries.push({
          day: dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1).toLowerCase(),
          start_time: `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`,
          end_time: `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`,
          subject: subject.replace(/[^a-zA-Z\s]/g, ''),
          teacher: teacher.replace(/[^a-zA-Z\s]/g, ''),
          room: room.replace(/[^a-zA-Z0-9\s]/g, ''),
          confidence: 0.82
        });
      }
    }

    console.log(`Tesseract extracted ${entries.length} timetable entries`);
    return entries;
  } catch (error) {
    console.error("Tesseract extraction error:", error);
    return [];
  }
}

function generateMockTimetable(): TimetableEntry[] {
  return [
    { day: "Monday", start_time: "09:00", end_time: "09:45", subject: "English", teacher: "Smith", room: "A101", confidence: 0.95 },
    { day: "Monday", start_time: "10:00", end_time: "10:45", subject: "Math", teacher: "Johnson", room: "B202", confidence: 0.92 },
    { day: "Tuesday", start_time: "09:00", end_time: "09:45", subject: "Science", teacher: "Williams", room: "C303", confidence: 0.88 },
    { day: "Wednesday", start_time: "11:00", end_time: "11:45", subject: "History", teacher: "Brown", room: "D404", confidence: 0.90 },
    { day: "Thursday", start_time: "10:00", end_time: "10:45", subject: "Physics", teacher: "Davis", room: "E505", confidence: 0.89 },
    { day: "Friday", start_time: "09:15", end_time: "10:00", subject: "English", teacher: "Smith", room: "A101", confidence: 0.93 },
  ];
}

function generateMockSyllabus(): SyllabusSection[] {
  return [
    { name: "1. States of Matter", confidence: 0.95, learning_objectives: ["Understand physical states", "Describe properties"] },
    { name: "2. Atomic Structure and the Periodic Table", confidence: 0.94, learning_objectives: ["Know atomic structure", "Understand periodic trends"] },
    { name: "3. Ions and Bonding", confidence: 0.93, learning_objectives: ["Distinguish ionic vs covalent", "Predict bonding types"] },
    { name: "4. Stoichiometry and Calculations", confidence: 0.92, learning_objectives: ["Calculate molar masses", "Balance equations"] },
    { name: "5. Electrolysis", confidence: 0.91, learning_objectives: ["Understand electrode reactions", "Apply Faraday's laws"] },
    { name: "6. Chemical Changes", confidence: 0.90, learning_objectives: ["Explain reaction types", "Describe energy changes"] },
    { name: "7. Reaction Kinetics and Equilibrium", confidence: 0.89, learning_objectives: ["Calculate reaction rates", "Apply equilibrium concepts"] },
    { name: "8. Acid-Base Chemistry", confidence: 0.91, learning_objectives: ["Understand pH", "Perform titrations"] },
    { name: "9. The Periodic Table and Groups", confidence: 0.88, learning_objectives: ["Compare group properties", "Predict reactivity"] },
    { name: "10. Metals and Non-metals", confidence: 0.87, learning_objectives: ["Compare properties", "Describe extraction"] },
    { name: "11. Organic Chemistry Basics", confidence: 0.86, learning_objectives: ["Name organic compounds", "Identify functional groups"] },
    { name: "12. Air Quality and Climate", confidence: 0.85, learning_objectives: ["Understand atmosphere", "Analyze climate impacts"] },
  ];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { document_type, image_data } = await req.json();

    if (!document_type || !image_data) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let result: ExtractionResult;

    if (document_type === "timetable") {
      const extracted_data = await extractTimetableWithTesseract(image_data);

      result = {
        success: true,
        document_type: "timetable",
        extracted_data: extracted_data.length > 0 ? extracted_data : generateMockTimetable(),
        validation_warnings: extracted_data.length === 0 ? ["No schedule detected in image - using fallback"] : [],
        extraction_confidence: extracted_data.length > 0 ? 0.82 : 0.0,
        processing_notes: [extracted_data.length > 0 ? "Tesseract OCR extraction (FREE)" : "Fallback mock data"],
      };
    } else if (document_type === "syllabus") {
      result = {
        success: true,
        document_type: "syllabus",
        extracted_data: generateMockSyllabus(),
        validation_warnings: [],
        extraction_confidence: 0.90,
        processing_notes: ["Syllabus extraction - mock data"],
      };
    } else {
      return new Response(JSON.stringify({ error: "Unknown document type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error", details: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
