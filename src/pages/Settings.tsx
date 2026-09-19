import { useState } from "react";
import { Upload, Trash2, Plus, Check, ChevronDown, Users, Target, UserCog, FileText } from "lucide-react";
import { useApp } from "../lib/store";
import { supabase } from "../lib/supabase";
import { Card, Button, Badge } from "../components/ui";

type Tab = "uploads" | "classes" | "goals" | "profile";

interface UploadedFile {
  id: string;
  name: string;
  type: "timetable" | "syllabus";
  classIds: string[];
  url: string;
  createdAt: string;
}

const tabs: { id: Tab; label: string; icon: typeof Upload }[] = [
  { id: "uploads", label: "Uploads", icon: Upload },
  { id: "classes", label: "Classes & students", icon: Users },
  { id: "goals", label: "Class goals", icon: Target },
  { id: "profile", label: "Profile & preferences", icon: UserCog },
];

function parseTimetableFromText(text: string): Array<{ day: string; startTime: string; endTime: string; room: string }> {
  const timetable = [];
  const dayMap: Record<string, string> = {
    'monday': 'Monday', 'mon': 'Monday',
    'tuesday': 'Tuesday', 'tue': 'Tuesday',
    'wednesday': 'Wednesday', 'wed': 'Wednesday',
    'thursday': 'Thursday', 'thu': 'Thursday',
    'friday': 'Friday', 'fri': 'Friday',
  };

  const lines = text.split('\n');
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    const timeMatch = line.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
    const dayMatch = Object.keys(dayMap).find(d => line.toLowerCase().includes(d));
    const roomMatch = line.match(/([A-Za-z]+\d+|Lab\d+)/);

    if (timeMatch && dayMatch) {
      timetable.push({
        day: dayMap[dayMatch],
        startTime: `${String(timeMatch[1]).padStart(2, '0')}:${timeMatch[2]}`,
        endTime: `${String(timeMatch[3]).padStart(2, '0')}:${timeMatch[4]}`,
        room: roomMatch?.[0] || 'C1',
      });
    }
  }

  return timetable;
}

export function Settings() {
  const { classes } = useApp();
  const [tab, setTab] = useState<Tab>("uploads");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedClassesForSyllabus, setSelectedClassesForSyllabus] = useState<string[]>([]);
  const [timetableCount, setTimetableCount] = useState(0);

  const handleTimetableUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const text = await file.text();
      const timetable = parseTimetableFromText(text);

      if (timetable.length === 0) {
        alert("Could not parse timetable.\nFormat each line: 'Monday 09:00-10:00 C1'");
        setIsUploading(false);
        return;
      }

      // Save to all classes
      let addedCount = 0;
      for (const cls of classes) {
        for (const session of timetable) {
          await supabase.from("timetable").insert({
            id: `tt${Date.now()}-${Math.random()}`,
            class_id: cls.id,
            day_of_week: session.day,
            start_time: session.startTime,
            end_time: session.endTime,
            room: session.room,
          });
          addedCount++;
        }
      }

      setTimetableCount(addedCount);
      alert(`✅ Timetable uploaded!\n${timetable.length} sessions × ${classes.length} classes = ${addedCount} total entries`);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload timetable. Check file format.");
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleSyllabusUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || selectedClassesForSyllabus.length === 0) {
      alert("Please select at least one class");
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `syllabi/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("syllabi").upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("syllabi").getPublicUrl(fileName);

      // Save to all selected classes
      for (const classId of selectedClassesForSyllabus) {
        await supabase.from("syllabus_files").insert({
          id: `sf${Date.now()}-${Math.random()}`,
          class_id: classId,
          filename: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          uploaded_by: "teacher@example.com",
        });

        // Create syllabus tracking record
        await supabase.from("syllabus").insert({
          id: `s${Date.now()}-${Math.random()}`,
          class_id: classId,
          topic: file.name.replace(/\.[^/.]+$/, ""),
          status: "pending",
        });
      }

      alert(`✅ Syllabus uploaded to ${selectedClassesForSyllabus.length} class(es)\nTrack progress by class`);
      setSelectedClassesForSyllabus([]);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload syllabus");
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const toggleClass = (classId: string) => {
    setSelectedClassesForSyllabus((prev) =>
      prev.includes(classId) ? prev.filter((c) => c !== classId) : [...prev, classId]
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
      <nav className="flex flex-row gap-1 overflow-x-auto py-1.5 lg:flex-col lg:overflow-visible lg:py-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`nav-hover flex shrink-0 items-center gap-2.5 rounded-lg border-2 px-3.5 py-2.5 text-left text-sm font-bold ${
              tab === t.id
                ? "border-(--color-border) bg-(--color-orange-500) text-(--color-ink-on-accent) shadow-pill"
                : "border-transparent text-(--color-ink-soft) hover:bg-(--color-paper-dim)"
            }`}
          >
            <t.icon size={16} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </nav>

      <div className="space-y-6">
        {tab === "uploads" && (
          <>
            <div>
              <h2 className="font-display text-2xl font-bold text-(--color-ink)">Uploads</h2>
              <p className="mt-1 text-sm text-(--color-ink-muted)">Upload and manage timetables and syllabus materials</p>
            </div>

            {/* Timetable Upload */}
            <Card>
              <h3 className="mb-1 font-bold text-(--color-ink)">Upload Timetable</h3>
              <p className="mb-4 text-sm text-(--color-ink-muted)">Upload TXT, PDF, or image → converts to all classes</p>

              {timetableCount > 0 && (
                <div className="mb-4 rounded-lg bg-(--color-success-100) p-3">
                  <p className="text-sm font-bold text-(--color-success)">✅ {timetableCount} sessions added</p>
                </div>
              )}

              <div className="rounded-lg border-2 border-dashed border-(--color-border) p-8 text-center">
                <Upload size={32} className="mx-auto mb-3 text-(--color-orange-500)" />
                <p className="mb-2 font-bold text-(--color-ink)">Drop timetable file or click to select</p>
                <p className="mb-4 text-xs text-(--color-ink-muted)">Formats: TXT, PDF, JPG, PNG</p>
                <label>
                  <input
                    type="file"
                    accept=".txt,.pdf,.jpg,.jpeg,.png,.gif"
                    onChange={handleTimetableUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                  <Button
                    as="span"
                    disabled={isUploading}
                    className="cursor-pointer"
                  >
                    {isUploading ? "Processing..." : "Select File"}
                  </Button>
                </label>
                <p className="mt-3 text-xs text-(--color-ink-muted)">Each line: Monday 09:00-10:00 C1</p>
              </div>
            </Card>

            {/* Syllabus Upload */}
            <Card>
              <h3 className="mb-1 font-bold text-(--color-ink)">Upload Syllabus</h3>
              <p className="mb-4 text-sm text-(--color-ink-muted)">Upload PDF → add to classes → track progress per class</p>

              <div className="mb-4">
                <label className="mb-3 block text-sm font-bold text-(--color-ink)">Select Classes to Add</label>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                  {classes.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => toggleClass(cls.id)}
                      className={`rounded-lg border-2 px-3 py-2.5 text-sm font-bold transition-colors ${
                        selectedClassesForSyllabus.includes(cls.id)
                          ? "border-(--color-orange-500) bg-(--color-orange-100) text-(--color-orange-600)"
                          : "border-(--color-border) text-(--color-ink-muted) hover:bg-(--color-paper-dim)"
                      }`}
                    >
                      {selectedClassesForSyllabus.includes(cls.id) && <Check size={14} className="inline mr-1" />}
                      {cls.name}
                    </button>
                  ))}
                </div>
                {selectedClassesForSyllabus.length > 0 && (
                  <p className="mt-2 text-xs font-bold text-(--color-orange-600)">
                    {selectedClassesForSyllabus.length} class(es) selected
                  </p>
                )}
              </div>

              <div className="rounded-lg border-2 border-dashed border-(--color-border) p-8 text-center">
                <FileText size={32} className="mx-auto mb-3 text-(--color-orange-500)" />
                <p className="mb-2 font-bold text-(--color-ink)">Drop syllabus PDF or click to select</p>
                <p className="mb-4 text-xs text-(--color-ink-muted)">Progress tracked for each class individually</p>
                <label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleSyllabusUpload}
                    disabled={isUploading || selectedClassesForSyllabus.length === 0}
                    className="hidden"
                  />
                  <Button
                    as="span"
                    disabled={isUploading || selectedClassesForSyllabus.length === 0}
                    className="cursor-pointer"
                  >
                    {isUploading ? "Uploading..." : "Select PDF"}
                  </Button>
                </label>
              </div>
            </Card>
          </>
        )}

        {tab === "classes" && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-(--color-ink)">Classes & Students</h2>
            <Card>
              <p className="text-(--color-ink-muted)">Manage your classes and students</p>
            </Card>
          </div>
        )}

        {tab === "goals" && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-(--color-ink)">Class Goals</h2>
            <Card>
              <p className="text-(--color-ink-muted)">Set and track class achievement goals</p>
            </Card>
          </div>
        )}

        {tab === "profile" && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-(--color-ink)">Profile & Preferences</h2>
            <Card>
              <p className="text-(--color-ink-muted)">Manage your profile and preferences</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
