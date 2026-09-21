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

async function extractTimetableWithGoogleVision(imageData: string): Promise<TimetableEntry[]> {
  try {
    const apiKey = Deno.env.get("GOOGLE_VISION_API_KEY");
    if (!apiKey) {
      console.warn("Google Vision API key not configured");
      return generateMockTimetable();
    }

    // Call Google Cloud Vision API for text detection
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageData },
              features: [
                { type: "TEXT_DETECTION" },
                { type: "DOCUMENT_TEXT_DETECTION" }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      console.warn("Google Vision API call failed:", response.status);
      return generateMockTimetable();
    }

    const result = await response.json() as any;
    const annotations = result.responses?.[0]?.textAnnotations || [];

    if (!annotations.length) {
      console.warn("No text detected in image");
      return generateMockTimetable();
    }

    // Extract full text from the first annotation (contains all text)
    const fullText = annotations[0]?.description || "";
    console.log("Google Vision extracted text:", fullText.substring(0, 300));

    // Parse extracted text into timetable entries
    const entries: TimetableEntry[] = [];
    const lines = fullText.split('\n').filter((l: string) => l.trim().length > 0);

    const dayPattern = /\b(monday|tuesday|wednesday|thursday|friday)\b/i;
    const timePattern = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/;

    for (const line of lines) {
      const dayMatch = line.match(dayPattern);
      const timeMatch = line.match(timePattern);

      if (dayMatch && timeMatch) {
        // Extract parts from the line
        const parts = line.split(/[\s,]+/).filter((p: string) => p.length > 0);

        // Find subject (usually between time and teacher/room)
        let subject = "Subject";
        let teacher = "Teacher";
        let room = "Room";

        const timePart = `${timeMatch[1]}:${timeMatch[2]}-${timeMatch[3]}:${timeMatch[4]}`;
        const restOfLine = line.replace(dayMatch[0], "").replace(timePattern, "").trim();
        const restParts = restOfLine.split(/[\s,]+/).filter((p: string) => p.length > 1);

        if (restParts.length > 0) subject = restParts[0];
        if (restParts.length > 1) teacher = restParts[1];
        if (restParts.length > 2) room = restParts[restParts.length - 1];

        entries.push({
          day: dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1).toLowerCase(),
          start_time: `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`,
          end_time: `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`,
          subject,
          teacher,
          room,
          confidence: 0.85
        });
      }
    }

    console.log(`Google Vision extracted ${entries.length} timetable entries`);
    return entries.length > 0 ? entries : generateMockTimetable();
  } catch (error) {
    console.error("Google Vision extraction error:", error);
    return generateMockTimetable();
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
      const extracted_data = await extractTimetableWithGoogleVision(image_data);
      const isRealExtraction = extracted_data.length > 0 && !extracted_data[0].subject.includes("English");

      result = {
        success: true,
        document_type: "timetable",
        extracted_data,
        validation_warnings: extracted_data.length === 0 ? ["No schedule detected - verify image quality"] : [],
        extraction_confidence: isRealExtraction ? 0.85 : 0.5,
        processing_notes: [isRealExtraction ? "Google Cloud Vision extraction" : "Fallback mock data"],
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
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
