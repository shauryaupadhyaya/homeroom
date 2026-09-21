/**
 * Supabase Edge Function for AI-powered document extraction
 * Currently using mock data for testing UI workflow
 */

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
    { 
      name: "Unit 1: Introduction", 
      confidence: 0.95, 
      topics: [
        { name: "1.1 Fundamentals", confidence: 0.93, learning_objectives: ["Understand basics", "Learn key concepts"] },
        { name: "1.2 Advanced Topics", confidence: 0.90, learning_objectives: ["Apply knowledge", "Solve problems"] },
      ]
    },
    { 
      name: "Unit 2: Practical Application", 
      confidence: 0.92, 
      topics: [
        { name: "2.1 Case Studies", confidence: 0.91, learning_objectives: ["Analyze examples", "Draw conclusions"] },
        { name: "2.2 Exercises", confidence: 0.88, learning_objectives: ["Practice skills", "Build confidence"] },
      ]
    },
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
      result = {
        success: true,
        document_type: "timetable",
        extracted_data: generateMockTimetable(),
        validation_warnings: [],
        extraction_confidence: 0.91,
        processing_notes: ["Mock data - ready for real extraction"],
      };
    } else if (document_type === "syllabus") {
      result = {
        success: true,
        document_type: "syllabus",
        extracted_data: generateMockSyllabus(),
        validation_warnings: [],
        extraction_confidence: 0.90,
        processing_notes: ["Mock data - ready for real extraction"],
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
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
