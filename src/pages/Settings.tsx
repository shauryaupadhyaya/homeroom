import { useState } from "react";
import {
  UploadCloud,
  Sparkles,
  Users,
  Target,
  UserCog,
  Pencil,
  Trash2,
  Plus,
  Check,
  ChevronDown,
  ImageUp,
  Sun,
  Moon,
} from "lucide-react";
import { useApp } from "../lib/store";
import { Card, Button, Badge, Avatar, colorTokens } from "../components/ui";

type Tab = "timetable" | "classes" | "goals" | "profile";

const tabs: { id: Tab; label: string; icon: typeof UploadCloud }[] = [
  { id: "timetable", label: "Timetable upload", icon: UploadCloud },
  { id: "classes", label: "Classes & students", icon: Users },
  { id: "goals", label: "Class goals", icon: Target },
  { id: "profile", label: "Profile & preferences", icon: UserCog },
];

export function Settings() {
  const [tab, setTab] = useState<Tab>("timetable");

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
        {tab === "timetable" && <TimetableUpload />}
        {tab === "classes" && <ClassesAndStudents />}
        {tab === "goals" && <ClassGoals />}
        {tab === "profile" && <Profile />}
      </div>
    </div>
  );
}

type UploadState = "idle" | "analyzing" | "review";

function TimetableUpload() {
  const [state, setState] = useState<UploadState>("idle");
  const [rows, setRows] = useState([
    { id: "r1", weekday: "Mon", start: "09:00", end: "09:50", subject: "Science", cls: "7 Sapphire", isNew: false },
    { id: "r2", weekday: "Mon", start: "10:00", end: "10:50", subject: "Maths", cls: "8 Amber", isNew: false },
    { id: "r3", weekday: "Mon", start: "11:10", end: "12:00", subject: "Drama", cls: "9 Hazel", isNew: true },
    { id: "r4", weekday: "Mon", start: "13:00", end: "13:50", subject: "History", cls: "10 Cedar", isNew: false },
  ]);

  function updateRow(id: string, patch: Partial<(typeof rows)[number]>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  return (
    <Card>
      <h2 className="font-display text-lg font-semibold text-(--color-ink)">Timetable upload</h2>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-(--color-ink-muted)">
        <Sparkles size={14} className="text-(--color-orange-500)" />
        AI drafts it, you confirm. Nothing saves until you review and approve every row.
      </p>

      {state === "idle" && (
        <button
          onClick={() => {
            setState("analyzing");
            setTimeout(() => setState("review"), 1100);
          }}
          className="mt-5 flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-(--color-border) bg-(--color-paper-dim) px-6 py-12 text-center transition-colors hover:border-(--color-orange-500) hover:bg-(--color-orange-100)"
        >
          <ImageUp size={28} className="text-(--color-ink-muted)" />
          <span className="text-sm font-semibold text-(--color-ink)">Drop a timetable screenshot, or click to upload</span>
          <span className="text-xs text-(--color-ink-muted)">PNG or JPG. A school portal export works well.</span>
        </button>
      )}

      {state === "analyzing" && (
        <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border-2 border-(--color-border) bg-(--color-paper-dim) px-6 py-12 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--color-orange-400) border-t-(--color-orange-500)" />
          <span className="text-sm font-semibold text-(--color-ink)">Reading your timetable…</span>
          <span className="text-xs text-(--color-ink-muted)">The AI is extracting periods, times, and classes</span>
        </div>
      )}

      {state === "review" && (
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-(--color-ink)">20 periods found. Review before saving.</p>
            <button onClick={() => setState("idle")} className="text-xs font-medium text-(--color-ink-muted) hover:underline">
              Upload a different file
            </button>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border-2 border-(--color-border)">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-(--color-paper-dim) text-left text-xs font-semibold uppercase tracking-wide text-(--color-ink-muted)">
                  <th className="px-3 py-2.5">Day</th>
                  <th className="px-3 py-2.5">Start</th>
                  <th className="px-3 py-2.5">End</th>
                  <th className="px-3 py-2.5">Subject</th>
                  <th className="px-3 py-2.5">Class</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-line)">
                {rows.map((r) => (
                  <tr key={r.id} className="align-middle">
                    <td className="px-3 py-2">
                      <input
                        value={r.weekday}
                        onChange={(e) => updateRow(r.id, { weekday: e.target.value })}
                        className="w-14 rounded-md border border-transparent bg-transparent px-1.5 py-1 hover:border-(--color-border) focus:border-2 focus:border-(--color-sky-500) focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={r.start}
                        onChange={(e) => updateRow(r.id, { start: e.target.value })}
                        className="w-16 rounded-md border border-transparent bg-transparent px-1.5 py-1 hover:border-(--color-border) focus:border-2 focus:border-(--color-sky-500) focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={r.end}
                        onChange={(e) => updateRow(r.id, { end: e.target.value })}
                        className="w-16 rounded-md border border-transparent bg-transparent px-1.5 py-1 hover:border-(--color-border) focus:border-2 focus:border-(--color-sky-500) focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={r.subject}
                        onChange={(e) => updateRow(r.id, { subject: e.target.value })}
                        className="w-28 rounded-md border border-transparent bg-transparent px-1.5 py-1 hover:border-(--color-border) focus:border-2 focus:border-(--color-sky-500) focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <input
                          value={r.cls}
                          onChange={(e) => updateRow(r.id, { cls: e.target.value })}
                          className="w-28 rounded-md border border-transparent bg-transparent px-1.5 py-1 hover:border-(--color-border) focus:border-2 focus:border-(--color-sky-500) focus:outline-none"
                        />
                        {r.isNew && <Badge color="pink">New class</Badge>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-lg bg-(--color-pink-100) px-3.5 py-2.5 text-xs text-(--color-ink-soft)">
            <span>"9 Hazel" doesn't match an existing class yet. Create it when you save?</span>
            <Badge color="pink">Will create</Badge>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setState("idle")}>Discard</Button>
            <Button onClick={() => setState("idle")}>
              <Check size={15} />
              Save timetable
            </Button>
          </div>
        </div>
      )}
    </Card>
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
