import { useState } from "react";
import { useApp } from "../lib/store";
import { supabase } from "../lib/supabase";
import { Card, Button } from "../components/ui";
import { Upload, Loader, FileText } from "lucide-react";

interface TimetableEntry {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
}

const ROOMS = ["C1", "C2", "C3", "Lab1", "Lab2"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function parseTimetableFromText(text: string): TimetableEntry[] {
  const timetable: TimetableEntry[] = [];

  // Look for patterns like "Monday 09:00-10:00 C1" or "Mon 9am-10am Room C1"
  const patterns = [
    /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\d{1,2}):?(\d{2})?\s*(?:am|pm)?[\s\-]*(\d{1,2}):?(\d{2})?\s*(?:am|pm)?\s+([A-Za-z0-9]+)/gi,
    /(\d{1,2}):(\d{2})\s*(?:am|pm)?\s*[-–]\s*(\d{1,2}):(\d{2})\s*(?:am|pm)?\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+([A-Za-z0-9]+)/gi,
  ];

  const dayMap: Record<string, string> = {
    'monday': 'Monday', 'mon': 'Monday',
    'tuesday': 'Tuesday', 'tue': 'Tuesday',
    'wednesday': 'Wednesday', 'wed': 'Wednesday',
    'thursday': 'Thursday', 'thu': 'Thursday',
    'friday': 'Friday', 'fri': 'Friday',
    'saturday': 'Saturday', 'sat': 'Saturday',
    'sunday': 'Sunday', 'sun': 'Sunday',
  };

  // Extract all times and days
  const lines = text.split('\n');
  let sessionIndex = 0;

  for (const line of lines) {
    if (line.trim().length === 0) continue;

    const timeMatch = line.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
    const dayMatch = line.match(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun/i);
    const roomMatch = line.match(/([A-Za-z]+\d+|Lab\d+)/);

    if (timeMatch && dayMatch) {
      const startHour = String(timeMatch[1]).padStart(2, '0');
      const startMin = timeMatch[2];
      const endHour = String(timeMatch[3]).padStart(2, '0');
      const endMin = timeMatch[4];
      const day = dayMap[dayMatch[0].toLowerCase()] || dayMatch[0];
      const room = roomMatch ? roomMatch[0] : ROOMS[sessionIndex % ROOMS.length];

      timetable.push({
        dayOfWeek: day,
        startTime: `${startHour}:${startMin}`,
        endTime: `${endHour}:${endMin}`,
        room: room,
      });

      sessionIndex++;
    }
  }

  return timetable.length > 0 ? timetable : [];
}

export function TimetableGenerator() {
  const { classes } = useApp();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(classes[0]?.id || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedTimetable, setGeneratedTimetable] = useState<TimetableEntry[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState("");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedClassId) return;

    setIsProcessing(true);
    try {
      const text = await file.text();
      const timetable = parseTimetableFromText(text);

      if (timetable.length === 0) {
        alert("Could not parse timetable. Format: 'Monday 09:00-10:00 C1' per line");
        setIsProcessing(false);
        return;
      }

      setUploadedFileName(file.name);
      setGeneratedTimetable(timetable);

      for (const entry of timetable) {
        await supabase.from("timetable").insert({
          id: `tt${Date.now()}-${Math.random()}`,
          class_id: selectedClassId,
          day_of_week: entry.dayOfWeek,
          start_time: entry.startTime,
          end_time: entry.endTime,
          room: entry.room,
        });
      }

      alert("✅ Timetable uploaded and saved!");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to process file");
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const groupedByDay = generatedTimetable.reduce(
    (acc, entry) => {
      if (!acc[entry.dayOfWeek]) acc[entry.dayOfWeek] = [];
      acc[entry.dayOfWeek].push(entry);
      return acc;
    },
    {} as Record<string, TimetableEntry[]>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-(--color-ink)">Upload Timetable</h1>
        <p className="mt-1 text-sm text-(--color-ink-muted)">Upload a timetable file and convert to schedule</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr]">
        <div className="flex flex-col gap-2">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`rounded-lg border-2 px-3 py-2 text-sm font-bold transition-colors ${
                selectedClassId === cls.id
                  ? "border-(--color-border) bg-(--color-orange-500) text-(--color-ink-on-accent)"
                  : "border-(--color-border) text-(--color-ink-muted) hover:bg-(--color-paper-dim)"
              }`}
            >
              {cls.name}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {selectedClass && (
            <Card className="border-dashed">
              <div className="flex flex-col items-center justify-center py-8">
                <Upload size={32} className="mb-3 text-(--color-orange-500)" />
                <h3 className="mb-2 font-bold text-(--color-ink)">Upload Timetable</h3>
                <p className="mb-2 text-center text-sm text-(--color-ink-muted)">
                  Upload a .txt or .pdf file
                  <br />
                  Format each line: "Monday 09:00-10:00 C1"
                </p>
                <label>
                  <input
                    type="file"
                    accept=".txt,.pdf"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                    className="hidden"
                  />
                  <Button
                    as="span"
                    disabled={isProcessing}
                    className="cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader size={16} className="animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload size={16} className="mr-2" />
                        Select File
                      </>
                    )}
                  </Button>
                </label>
              </div>
            </Card>
          )}

          {generatedTimetable.length > 0 && (
            <Card>
              <h2 className="mb-2 font-bold text-(--color-ink)">Timetable from {uploadedFileName}</h2>
              <p className="mb-4 text-sm text-(--color-ink-muted)">{generatedTimetable.length} sessions imported</p>
              <div className="space-y-4">
                {daysOrder.map((day) => {
                  const daySchedule = groupedByDay[day];
                  if (!daySchedule) return null;
                  return (
                    <div key={day} className="rounded-lg border border-(--color-border) bg-(--color-paper) p-3">
                      <p className="mb-2 font-bold text-(--color-ink)">{day}</p>
                      <div className="space-y-1">
                        {daySchedule.map((session, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-(--color-ink)">{session.startTime} - {session.endTime}</span>
                            <span className="text-(--color-ink-muted)">{session.room}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
