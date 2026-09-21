import { useState } from "react";
import {
  UploadCloud,
  Users,
  Target,
  UserCog,
  Pencil,
  Trash2,
  Plus,
  Check,
  ChevronDown,
  Sun,
  Moon,
  Upload,
  FileText,
  AlertCircle,
  Loader,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { useApp } from "../lib/store";
import { supabase, timetableApi, syllabusFilesApi } from "../lib/supabase";
import { Card, Button, Avatar, colorTokens } from "../components/ui";
import { fileToBase64 } from "../lib/extractionApi";

// Type definitions for AI extraction results
interface ExtractionResult {
  success: boolean;
  document_type: string;
  extracted_data: any[];
  validation_warnings: string[];
  extraction_confidence: number;
  processing_notes: string[];
}

interface TimetableEntry {
  day: string;
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

async function callExtractionAPI(
  documentType: "timetable" | "syllabus",
  imageData: string,
  classIds?: string[]
): Promise<ExtractionResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl) throw new Error("Supabase URL not configured");

  const functionUrl = `${supabaseUrl}/functions/v1/extract-document`;
  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(anonKey && { "Authorization": `Bearer ${anonKey}` }),
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

  return response.json();
}

type Tab = "profile" | "uploads" | "classes" | "goals";

const tabs: { id: Tab; label: string; icon: typeof UploadCloud }[] = [
  { id: "profile", label: "Profile & preferences", icon: UserCog },
  { id: "uploads", label: "Uploads", icon: UploadCloud },
  { id: "classes", label: "Classes & students", icon: Users },
  { id: "goals", label: "Class goals", icon: Target },
];

export function Settings() {
  const [tab, setTab] = useState<Tab>("profile");

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
            {t.label}
          </button>
        ))}
      </nav>

      <div>
        {tab === "uploads" && <Uploads />}
        {tab === "classes" && <ClassesAndStudents />}
        {tab === "goals" && <ClassGoals />}
        {tab === "profile" && <Profile />}
      </div>
    </div>
  );
}

function Uploads() {
  const { classes } = useApp();
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedClassesForSyllabus, setSelectedClassesForSyllabus] = useState<string[]>([]);
  const [uploadMessage, setUploadMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [extractionProgress, setExtractionProgress] = useState("");
  const [uploadedTimetables, setUploadedTimetables] = useState<TimetableEntry[]>([]);
  const [uploadedSyllabi, setUploadedSyllabi] = useState<any[]>([]);
  const [timetableResult, setTimetableResult] = useState<ExtractionResult | null>(null);
  const [syllabusResult, setSyllabusResult] = useState<ExtractionResult | null>(null);
  const [timetableFile, setTimetableFile] = useState<File | null>(null);
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);

  const handleTimetableUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsExtracting(true);
    setUploadMessage(null);
    setExtractionProgress("Analyzing timetable image...");

    try {
      const imageData = await fileToBase64(file);
      setExtractionProgress("Extracting timetable data with AI...");
      const result = await callExtractionAPI("timetable", imageData, classes.map(c => c.id));

      if (!result.success || result.extracted_data.length === 0) {
        setUploadMessage({ type: "error", text: "No timetable data extracted. Try a clearer image." });
        event.target.value = "";
      } else {
        setTimetableFile(file);
        setTimetableResult(result);
      }
    } catch (error) {
      console.error("Timetable extraction failed:", error);
      setUploadMessage({ type: "error", text: `Extraction failed: ${error instanceof Error ? error.message : "Unknown error"}` });
    } finally {
      setIsExtracting(false);
      setExtractionProgress("");
      event.target.value = "";
    }
  };

  const confirmTimetableUpload = async () => {
    if (!timetableResult) return;
    setIsUploading(true);
    try {
      const entries = timetableResult.extracted_data as TimetableEntry[];
      for (const cls of classes) {
        await timetableApi.deleteByClass(cls.id);
        for (const entry of entries) {
          await timetableApi.create(cls.id, entry.day, entry.start_time, entry.end_time);
        }
      }
      setUploadMessage({ type: "success", text: `✓ Timetable saved for ${classes.length} classes (${entries.length} periods)` });
      setUploadedTimetables(entries);
      setTimetableResult(null);
      setTimetableFile(null);
    } catch (error) {
      console.error("Timetable save failed:", error);
      setUploadMessage({ type: "error", text: `Save failed: ${error instanceof Error ? error.message : "Unknown error"}` });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSyllabusUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || selectedClassesForSyllabus.length === 0) {
      setUploadMessage({ type: "error", text: "Select at least one class" });
      return;
    }

    setIsExtracting(true);
    setUploadMessage(null);
    setExtractionProgress("Analyzing syllabus...");

    try {
      const imageData = await fileToBase64(file);
      setExtractionProgress("Extracting syllabus structure with AI...");
      const result = await callExtractionAPI("syllabus", imageData, selectedClassesForSyllabus);

      setSyllabusFile(file);
      setSyllabusResult(result);
    } catch (error) {
      console.error("Syllabus extraction failed:", error);
      setUploadMessage({ type: "error", text: `Extraction failed: ${error instanceof Error ? error.message : "Unknown error"}` });
    } finally {
      setIsExtracting(false);
      setExtractionProgress("");
      event.target.value = "";
    }
  };

  const confirmSyllabusUpload = async () => {
    if (!syllabusResult || !syllabusFile) return;
    setIsUploading(true);
    setUploadMessage(null);
    try {
      const filePath = `syllabi/${Date.now()}-${syllabusFile.name}`;
      const { error: uploadError } = await supabase.storage.from("syllabi").upload(filePath, syllabusFile);
      if (uploadError) throw uploadError;

      const { data: fileData } = supabase.storage.from("syllabi").getPublicUrl(filePath);
      const fileUrl = fileData.publicUrl;

      for (const classId of selectedClassesForSyllabus) {
        await syllabusFilesApi.create(classId, syllabusFile.name, fileUrl, syllabusFile.size);
      }

      setUploadMessage({ type: "success", text: `✓ Syllabus saved to ${selectedClassesForSyllabus.length} class(es)` });
      setUploadedSyllabi([...uploadedSyllabi, { name: syllabusFile.name, classes: selectedClassesForSyllabus.length }]);
      setSelectedClassesForSyllabus([]);
      setSyllabusResult(null);
      setSyllabusFile(null);
    } catch (error) {
      console.error("Syllabus save failed:", error);
      setUploadMessage({ type: "error", text: `Save failed: ${error instanceof Error ? error.message : "Unknown error"}` });
    } finally {
      setIsUploading(false);
    }
  };

  const toggleClass = (classId: string) => {
    setSelectedClassesForSyllabus((prev) =>
      prev.includes(classId) ? prev.filter((c) => c !== classId) : [...prev, classId]
    );
  };

  return (
    <div className="space-y-6">
      {uploadMessage && (
        <div
          className={`flex items-start gap-3 rounded-lg border-2 p-4 ${
            uploadMessage.type === "success"
              ? "border-(--color-success) bg-(--color-success-100) text-(--color-success)"
              : "border-(--color-danger) bg-(--color-danger-100) text-(--color-danger)"
          }`}
        >
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm font-bold">{uploadMessage.text}</p>
        </div>
      )}

      {extractionProgress && (
        <div className="flex items-center gap-3 rounded-lg border-2 border-(--color-sky-500) bg-(--color-sky-100) p-4 text-(--color-sky-600)">
          <Loader size={18} className="animate-spin" />
          <p className="text-sm font-bold">{extractionProgress}</p>
        </div>
      )}

      <Card>
        <h2 className="font-display text-lg font-semibold text-(--color-ink)">Upload Timetable</h2>
        <p className="mt-1 text-sm text-(--color-ink-muted)">Upload image/PDF → AI extracts schedule → review & approve</p>

        {timetableResult && (
          <div className="mt-4 space-y-4 rounded-lg border-2 border-(--color-orange-500) bg-(--color-orange-100)/50 p-4">
            <div>
              <p className="font-bold text-(--color-ink)">File: {timetableFile?.name}</p>
              <p className="mt-1 text-sm text-(--color-ink-muted)">
                {(timetableResult.extracted_data as TimetableEntry[]).length} periods extracted · Confidence: {Math.round(timetableResult.extraction_confidence * 100)}%
              </p>
            </div>
            {timetableResult.validation_warnings.length > 0 && (
              <div className="rounded-lg border border-(--color-warning) bg-(--color-warning-100)/50 p-3">
                <div className="flex gap-2 text-sm text-(--color-warning)">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold mb-1">{timetableResult.validation_warnings.length} warning(s):</p>
                    <ul className="text-xs space-y-0.5">
                      {timetableResult.validation_warnings.slice(0, 3).map((w, i) => <li key={i}>• {w}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            <div className="max-h-64 space-y-2 overflow-y-auto rounded bg-(--color-paper) p-3">
              {(timetableResult.extracted_data as TimetableEntry[]).map((entry, i) => (
                <div key={i} className="flex items-center justify-between text-sm border-b border-(--color-border) pb-2 last:border-0">
                  <div className="flex-1">
                    <div className="font-medium text-(--color-ink)">{entry.day}</div>
                    <div className="text-xs text-(--color-ink-muted)">{entry.start_time} - {entry.end_time}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.subject && <span className="text-xs bg-(--color-sky-100) text-(--color-sky-600) px-2 py-1 rounded">{entry.subject}</span>}
                    {entry.confidence < 0.7 && <AlertTriangle size={14} className="text-(--color-warning)" />}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={confirmTimetableUpload} disabled={isUploading} className="flex-1">
                {isUploading ? "Saving..." : "✓ Approve & Save"}
              </Button>
              <Button onClick={() => { setTimetableResult(null); setTimetableFile(null); }} variant="ghost" disabled={isUploading}>
                Discard
              </Button>
            </div>
          </div>
        )}

        {!timetableResult && (
          <div className="mt-5 rounded-lg border-2 border-dashed border-(--color-border) p-8 text-center">
          <Upload size={32} className="mx-auto mb-3 text-(--color-orange-500)" />
          <p className="mb-2 font-bold text-(--color-ink)">Drop timetable image or click to select</p>
          <p className="mb-4 text-xs text-(--color-ink-muted)">Formats: JPG, PNG, PDF (clear tables work best)</p>
          <input
            id="timetable-input"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleTimetableUpload}
            disabled={isUploading || isExtracting}
            className="hidden"
          />
          <button
            onClick={() => document.getElementById("timetable-input")?.click()}
            disabled={isUploading || isExtracting}
            className="rounded-lg border-2 border-(--color-border) bg-(--color-orange-500) px-4 py-2.5 text-sm font-bold text-(--color-ink-on-accent) transition-all hover:shadow-hard-sm disabled:opacity-50"
          >
            {isExtracting ? "Analyzing..." : "Select File"}
          </button>
          </div>
        )}

        {uploadedTimetables.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase text-(--color-ink-muted)">Uploaded entries</p>
            <div className="mt-2 space-y-1">
              {uploadedTimetables.map((entry, i) => (
                <p key={i} className="text-sm text-(--color-ink)">
                  {entry.day} · {entry.start_time} - {entry.end_time}
                  {entry.subject && <span className="text-(--color-ink-muted)"> ({entry.subject})</span>}
                </p>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-display text-lg font-semibold text-(--color-ink)">Upload Syllabus</h2>
        <p className="mt-1 text-sm text-(--color-ink-muted)">Upload image/PDF → AI extracts structure → review & approve</p>

        {syllabusResult && (
          <div className="mt-4 space-y-4 rounded-lg border-2 border-(--color-orange-500) bg-(--color-orange-100)/50 p-4">
            <div>
              <p className="font-bold text-(--color-ink)">File: {syllabusFile?.name}</p>
              <p className="mt-1 text-sm text-(--color-ink-muted)">
                {(syllabusResult.extracted_data as SyllabusSection[]).length} sections extracted · Confidence: {Math.round(syllabusResult.extraction_confidence * 100)}%
              </p>
            </div>
            {syllabusResult.validation_warnings.length > 0 && (
              <div className="rounded-lg border border-(--color-warning) bg-(--color-warning-100)/50 p-3">
                <div className="flex gap-2 text-sm text-(--color-warning)">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold mb-1">{syllabusResult.validation_warnings.length} warning(s):</p>
                    <ul className="text-xs space-y-0.5">
                      {syllabusResult.validation_warnings.slice(0, 2).map((w, i) => <li key={i}>• {w}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            <div className="max-h-64 overflow-y-auto rounded bg-(--color-paper) p-3 space-y-2">
              {(syllabusResult.extracted_data as SyllabusSection[]).length > 0 ? (
                (syllabusResult.extracted_data as SyllabusSection[]).map((section, i) => (
                  <div key={i} className="text-sm">
                    <div className="font-bold text-(--color-ink) flex items-center gap-2">
                      <ChevronRight size={14} />
                      {section.name}
                    </div>
                    {section.topics && section.topics.length > 0 && (
                      <div className="ml-5 mt-1 text-xs text-(--color-ink-muted) space-y-0.5">
                        {section.topics.slice(0, 3).map((t, j) => (
                          <div key={j}>• {t.name}</div>
                        ))}
                        {section.topics.length > 3 && <div className="text-xs italic">+{section.topics.length - 3} more</div>}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-(--color-ink-muted)">No sections detected</p>
              )}
            </div>
            <div className="rounded-lg bg-(--color-surface) p-2">
              <p className="text-xs font-bold text-(--color-ink-muted) mb-1">Adding to:</p>
              <p className="text-sm text-(--color-ink)">{selectedClassesForSyllabus.length} class(es)</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={confirmSyllabusUpload} disabled={isUploading} className="flex-1">
                {isUploading ? "Saving..." : "✓ Approve & Save"}
              </Button>
              <Button onClick={() => { setSyllabusResult(null); setSyllabusFile(null); }} variant="ghost" disabled={isUploading}>
                Discard
              </Button>
            </div>
          </div>
        )}

        {!syllabusResult && (
          <>
            <div className="mt-4">
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
        <div className="mt-5 rounded-lg border-2 border-dashed border-(--color-border) p-8 text-center">
          <FileText size={32} className="mx-auto mb-3 text-(--color-orange-500)" />
          <p className="mb-2 font-bold text-(--color-ink)">Drop syllabus image or click to select</p>
          <p className="mb-4 text-xs text-(--color-ink-muted)">Upload image or PDF screenshot for best results</p>
          <input
            id="syllabus-input"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleSyllabusUpload}
            disabled={isUploading || isExtracting || selectedClassesForSyllabus.length === 0}
            className="hidden"
          />
          <button
            onClick={() => document.getElementById("syllabus-input")?.click()}
            disabled={isUploading || isExtracting || selectedClassesForSyllabus.length === 0}
            className="rounded-lg border-2 border-(--color-border) bg-(--color-orange-500) px-4 py-2.5 text-sm font-bold text-(--color-ink-on-accent) transition-all hover:shadow-hard-sm disabled:opacity-50"
          >
            {isExtracting ? "Analyzing..." : "Select File"}
          </button>
          </div>
          </>
        )}

        {uploadedSyllabi.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase text-(--color-ink-muted)">Uploaded syllabi</p>
            <div className="mt-2 space-y-1">
              {uploadedSyllabi.map((item, i) => (
                <p key={i} className="text-sm text-(--color-ink)">
                  {item.name} · {item.classes} class(es)
                </p>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function ClassesAndStudents() {
  const { classes, students, addClass, deleteClass, addStudent, renameStudent, removeStudent } = useApp();
  const [expanded, setExpanded] = useState<string | null>(classes[0]?.id ?? null);
  const [newClassName, setNewClassName] = useState("");
  const [newStudentName, setNewStudentName] = useState<Record<string, string>>({});

  return (
    <Card padded={false}>
      <div className="flex items-center justify-between border-b-2 border-(--color-border) p-5">
        <div>
          <h2 className="font-display text-lg font-semibold text-(--color-ink)">Classes & students</h2>
          <p className="mt-1 text-sm text-(--color-ink-muted)">
            Changes here stay in sync with the student-list widget on the whiteboard.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b-2 border-(--color-border) px-5 py-3">
        <input
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          placeholder="New class name, e.g. 9 Cobalt"
          className="flex-1 rounded-lg border-2 border-(--color-border) px-3 py-2 text-sm outline-none focus:border-(--color-sky-500) focus:ring-2 focus:ring-(--color-sky-500)/20"
        />
        <Button
          size="sm"
          onClick={() => {
            if (!newClassName.trim()) return;
            addClass(newClassName.trim(), "General");
            setNewClassName("");
          }}
        >
          <Plus size={14} /> Add class
        </Button>
      </div>

      <ul className="divide-y divide-(--color-line)">
        {classes.map((c) => {
          const roster = students.filter((s) => s.classId === c.id);
          const isOpen = expanded === c.id;
          const t = colorTokens(c.color);
          return (
            <li key={c.id}>
              <button
                onClick={() => setExpanded(isOpen ? null : c.id)}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-(--color-paper-dim)"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${t.solid}`} />
                <span className="flex-1 text-sm font-semibold text-(--color-ink)">{c.name}</span>
                <span className="text-xs text-(--color-ink-muted)">{roster.length} students</span>
                <ChevronDown size={16} className={`text-(--color-ink-muted) transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen && (
                <div className="bg-(--color-paper-dim) px-5 py-4">
                  <div className="flex items-center gap-2">
                    <input
                      value={newStudentName[c.id] ?? ""}
                      onChange={(e) => setNewStudentName((m) => ({ ...m, [c.id]: e.target.value }))}
                      placeholder="Add a student"
                      className="flex-1 rounded-lg border-2 border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm outline-none focus:border-(--color-sky-500)"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const name = newStudentName[c.id]?.trim();
                        if (!name) return;
                        addStudent(c.id, name);
                        setNewStudentName((m) => ({ ...m, [c.id]: "" }));
                      }}
                    >
                      <Plus size={13} /> Add
                    </Button>
                    <Button size="sm" variant="ghost" className="text-(--color-danger)" onClick={() => deleteClass(c.id)}>
                      <Trash2 size={13} /> Delete class
                    </Button>
                  </div>

                  <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {roster.map((s) => (
                      <li key={s.id} className="flex items-center gap-2 rounded-lg bg-(--color-surface) px-2.5 py-1.5">
                        <Avatar name={s.name} size={24} />
                        <input
                          defaultValue={s.name}
                          onBlur={(e) => renameStudent(s.id, e.target.value)}
                          className="flex-1 truncate rounded border border-transparent bg-transparent text-sm focus:border-(--color-line) focus:outline-none"
                        />
                        <span className="text-xs text-(--color-ink-muted)">{s.points}pt</span>
                        <button onClick={() => removeStudent(s.id)} className="text-(--color-ink-muted) hover:text-(--color-danger)">
                          <Trash2 size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function ClassGoals() {
  const { classes, setClassGoal } = useApp();
  return (
    <Card>
      <h2 className="font-display text-lg font-semibold text-(--color-ink)">Class goals</h2>
      <p className="mt-1 text-sm text-(--color-ink-muted)">
        Drives the in-lesson goal meter: set the point total each class is working toward.
      </p>
      <ul className="mt-5 flex flex-col gap-3">
        {classes.map((c) => {
          const t = colorTokens(c.color);
          return (
            <li key={c.id} className="flex items-center gap-4 rounded-xl border-2 border-(--color-border) px-4 py-3">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${t.solid}`} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-(--color-ink)">{c.name}</p>
                <p className="text-xs text-(--color-ink-muted)">{c.points} points so far</p>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  defaultValue={c.goal}
                  onBlur={(e) => setClassGoal(c.id, Number(e.target.value) || c.goal)}
                  className="w-24 rounded-lg border-2 border-(--color-border) px-2.5 py-1.5 text-right text-sm outline-none focus:border-(--color-sky-500) focus:ring-2 focus:ring-(--color-sky-500)/20"
                />
                <span className="text-xs text-(--color-ink-muted)">pts goal</span>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function Profile() {
  const { teacher, updateTeacher, theme, toggleTheme } = useApp();
  return (
    <Card>
      <h2 className="font-display text-lg font-bold text-(--color-ink)">Profile & preferences</h2>
      <div className="mt-5 flex max-w-md flex-col gap-5">
        <label className="flex flex-col gap-1.5 text-sm font-bold text-(--color-ink)">
          Teacher name
          <input
            defaultValue={teacher.name}
            onBlur={(e) => updateTeacher({ name: e.target.value })}
            className="rounded-lg border-2 border-(--color-border) px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-(--color-sky-500)/30"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-bold text-(--color-ink)">
          Email
          <input
            disabled
            value={teacher.email}
            className="rounded-lg border-2 border-(--color-border) bg-(--color-paper-dim) px-3 py-2 text-sm font-medium text-(--color-ink-muted)"
          />
        </label>

        <div className="flex flex-col gap-1.5 text-sm font-bold text-(--color-ink)">
          Week starts on
          <div className="flex gap-2">
            {(["Mon", "Sun"] as const).map((d) => (
              <button
                key={d}
                onClick={() => updateTeacher({ weekStartDay: d })}
                className={`rounded-lg border-2 px-3.5 py-1.5 text-sm font-bold transition-colors ${
                  teacher.weekStartDay === d
                    ? "border-(--color-border) bg-(--color-orange-500) text-(--color-ink-on-accent) shadow-hard-sm"
                    : "border-(--color-border) text-(--color-ink-soft) hover:bg-(--color-paper-dim)"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-bold text-(--color-ink)">
          Default class goal
          <input
            type="number"
            defaultValue={teacher.defaultGoal}
            onBlur={(e) => updateTeacher({ defaultGoal: Number(e.target.value) || teacher.defaultGoal })}
            className="rounded-lg border-2 border-(--color-border) px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-(--color-sky-500)/30"
          />
        </label>

        <div className="flex flex-col gap-1.5 text-sm font-bold text-(--color-ink)">
          Clock format
          <div className="flex gap-2">
            {(["24h", "12h"] as const).map((f) => (
              <button
                key={f}
                onClick={() => updateTeacher({ clockFormat: f })}
                className={`rounded-lg border-2 px-3.5 py-1.5 text-sm font-bold transition-colors ${
                  teacher.clockFormat === f
                    ? "border-(--color-border) bg-(--color-orange-500) text-(--color-ink-on-accent) shadow-hard-sm"
                    : "border-(--color-border) text-(--color-ink-soft) hover:bg-(--color-paper-dim)"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-sm font-bold text-(--color-ink)">
          Appearance
          <div className="flex rounded-lg border-2 border-(--color-border) bg-(--color-paper-dim) p-1">
            <button
              onClick={() => theme !== "light" && toggleTheme()}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-bold transition-colors ${
                theme === "light" ? "bg-(--color-surface) text-(--color-ink) shadow-hard-sm" : "text-(--color-ink-muted)"
              }`}
            >
              <Sun size={14} /> Light
            </button>
            <button
              onClick={() => theme !== "dark" && toggleTheme()}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-bold transition-colors ${
                theme === "dark" ? "bg-(--color-surface) text-(--color-ink) shadow-hard-sm" : "text-(--color-ink-muted)"
              }`}
            >
              <Moon size={14} /> Dark
            </button>
          </div>
        </div>

        <Button className="w-fit">
          <Pencil size={14} />
          Save preferences
        </Button>
      </div>
    </Card>
  );
}
