import { useState } from "react";
import { useApp } from "../lib/store";
import { supabase } from "../lib/supabase";
import { Card, Button } from "../components/ui";
import { Wand2, Loader } from "lucide-react";

interface TimetableEntry {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
}

const ROOMS = ["C1", "C2", "C3", "Lab1", "Lab2"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const START_TIMES = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];

function generateSmartTimetable(sessionCount: number, daysPerWeek: number): TimetableEntry[] {
  const timetable: TimetableEntry[] = [];
  const sessionsPerDay = Math.ceil(sessionCount / daysPerWeek);
  let sessionIndex = 0;

  for (let d = 0; d < daysPerWeek && sessionIndex < sessionCount; d++) {
    const dayIndex = d % DAYS.length;
    const day = DAYS[dayIndex];

    for (let s = 0; s < sessionsPerDay && sessionIndex < sessionCount; s++) {
      const startTimeStr = START_TIMES[s % START_TIMES.length];
      const [hours, mins] = startTimeStr.split(":").map(Number);
      const endHour = Math.min(hours + 1, 16);
      const endTime = `${String(endHour).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;

      const room = ROOMS[sessionIndex % ROOMS.length];

      timetable.push({
        dayOfWeek: day,
        startTime: startTimeStr,
        endTime: endTime,
        room: room,
      });

      sessionIndex++;
    }
  }

  return timetable;
}

export function TimetableGenerator() {
  const { classes } = useApp();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(classes[0]?.id || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTimetable, setGeneratedTimetable] = useState<TimetableEntry[]>([]);
  const [sessionCount, setSessionCount] = useState("5");
  const [daysPerWeek, setDaysPerWeek] = useState("5");

  const handleGenerateTimetable = async () => {
    if (!selectedClassId) return;

    setIsGenerating(true);
    try {
      const sessions = Math.min(Math.max(parseInt(sessionCount) || 5, 1), 25);
      const days = Math.min(Math.max(parseInt(daysPerWeek) || 5, 1), 7);

      const timetable = generateSmartTimetable(sessions, days);
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
    } catch (error) {
      console.error("Generation failed:", error);
      alert("Failed to save timetable. Check Supabase connection.");
    } finally {
      setIsGenerating(false);
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
        <h1 className="font-display text-3xl font-bold text-(--color-ink)">Timetable Generator</h1>
        <p className="mt-1 text-sm text-(--color-ink-muted)">Generate optimized timetables instantly</p>
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
            <Card>
              <h2 className="mb-4 font-display text-lg font-bold text-(--color-ink)">Configure Timetable</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-bold text-(--color-ink-muted)">Sessions Per Week</label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={sessionCount}
                    onChange={(e) => setSessionCount(e.target.value)}
                    className="mt-2 w-full rounded-lg border-2 border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-(--color-ink-muted)">Days Per Week</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={daysPerWeek}
                    onChange={(e) => setDaysPerWeek(e.target.value)}
                    className="mt-2 w-full rounded-lg border-2 border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm font-bold"
                  />
                </div>
              </div>
              <Button
                onClick={handleGenerateTimetable}
                disabled={isGenerating}
                className="flex items-center gap-2 w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    Generate Timetable
                  </>
                )}
              </Button>
            </Card>
          )}

          {generatedTimetable.length > 0 && (
            <Card>
              <h2 className="mb-4 font-bold text-(--color-ink)">Generated Timetable</h2>
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
