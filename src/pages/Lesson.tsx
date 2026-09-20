import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { X, Clock3, Check, ChevronDown } from "lucide-react";
import { useApp } from "../lib/store";
import { BoardProvider, useBoard } from "../whiteboard/BoardContext";
import { widgetLiveValue } from "../whiteboard/widgets";
import { Board } from "../whiteboard/Board";
import { Notebook } from "../whiteboard/Notebook";
import { ProgressBar, colorTokens, EmptyState, Button } from "../components/ui";

type AttendanceStatus = "present" | "absent" | "late";

interface LessonSession {
  classId: string;
  startTime: Date;
  endTime?: Date;
  attendance: Record<string, AttendanceStatus>;
  pointsAwarded: number;
  widgets: string[];
}

function AttendancePanel({ classId }: { classId: string }) {
  const { students } = useApp();
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [showPanel, setShowPanel] = useState(false);

  const classStudents = students.filter((s) => s.classId === classId);
  const markedCount = Object.keys(attendance).length;

  useEffect(() => {
    const key = `lesson-attendance-${classId}`;
    setAttendance(JSON.parse(sessionStorage.getItem(key) || "{}"));
  }, [classId]);

  useEffect(() => {
    sessionStorage.setItem(`lesson-attendance-${classId}`, JSON.stringify(attendance));
  }, [attendance, classId]);

  const updateAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="flex items-center gap-2 rounded-full border-2 border-(--color-border) bg-(--color-surface) px-4 py-2 font-bold shadow-hard"
      >
        <Check size={16} className="text-(--color-success)" />
        {markedCount}/{classStudents.length}
        <ChevronDown size={14} className={`transition-transform ${showPanel ? "rotate-180" : ""}`} />
      </button>

      {showPanel && (
        <div className="absolute bottom-16 right-0 w-64 space-y-2 rounded-xl border-[3px] border-(--color-border) bg-(--color-surface) p-4 shadow-hard">
          <h3 className="mb-3 font-bold text-(--color-ink)">Mark Attendance</h3>
          <div className="max-h-96 space-y-1 overflow-y-auto">
            {classStudents.map((student) => {
              const status = attendance[student.id];
              return (
                <div key={student.id} className="flex items-center justify-between rounded-lg border border-(--color-border) bg-(--color-paper) px-3 py-2">
                  <span className="text-sm font-medium text-(--color-ink)">{student.name}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateAttendance(student.id, "present")}
                      className={`rounded px-2 py-0.5 text-xs font-bold transition-colors ${
                        status === "present"
                          ? "bg-(--color-success) text-(--color-ink-on-accent) shadow-hard-sm"
                          : "border-2 border-(--color-border) text-(--color-ink-muted) bg-(--color-surface) hover:border-(--color-success) hover:bg-(--color-success-100)"
                      }`}
                    >
                      P
                    </button>
                    <button
                      onClick={() => updateAttendance(student.id, "absent")}
                      className={`rounded px-2 py-0.5 text-xs font-bold transition-colors ${
                        status === "absent"
                          ? "bg-(--color-danger) text-(--color-ink-on-accent) shadow-hard-sm"
                          : "border-2 border-(--color-border) text-(--color-ink-muted) bg-(--color-surface) hover:border-(--color-danger) hover:bg-(--color-danger-100)"
                      }`}
                    >
                      A
                    </button>
                    <button
                      onClick={() => updateAttendance(student.id, "late")}
                      className={`rounded px-2 py-0.5 text-xs font-bold transition-colors ${
                        status === "late"
                          ? "bg-(--color-warning) text-(--color-ink-on-accent) shadow-hard-sm"
                          : "border-2 border-(--color-border) text-(--color-ink-muted) bg-(--color-surface) hover:border-(--color-warning) hover:bg-(--color-warning-100)"
                      }`}
                    >
                      L
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function LessonTopBar({ classId, onEndLesson }: { classId: string; onEndLesson: () => void }) {
  const { classes } = useApp();
  const { widgets } = useBoard();
  const cls = classes.find((c) => c.id === classId)!;
  const t = colorTokens(cls.color);
  const runningTimer = widgets.find((w) => w.type === "timer" && (w.config as { running: boolean }).running);

  return (
    <div className="flex h-16 shrink-0 items-center gap-4 border-b-[3px] border-(--color-border) bg-(--color-surface) px-4">
      <button
        onClick={onEndLesson}
        className="flex items-center gap-1.5 rounded-lg border-2 border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm font-bold text-(--color-danger) hover:bg-(--color-danger-100)"
      >
        <X size={15} />
        End Lesson
      </button>

      <div className="h-6 w-0.5 bg-(--color-line)" />

      <div className="flex items-center gap-2">
        <span className={`h-3 w-3 rounded-full border-2 border-(--color-border) ${t.solid}`} />
        <span className="font-display text-base font-bold text-(--color-ink)">{cls.name}</span>
      </div>

      {runningTimer && (
        <span className="flex items-center gap-1.5 rounded-full border-2 border-(--color-border) bg-(--color-orange-100) px-2.5 py-1 text-xs font-bold text-(--color-orange-600)">
          <Clock3 size={12} />
          {widgetLiveValue(runningTimer)}
        </span>
      )}

      <div className="ml-auto flex w-72 items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wide text-(--color-ink-muted)">Class goal</span>
        <ProgressBar value={cls.points} max={cls.goal} color={cls.color} />
        <span className="text-xs font-bold text-(--color-ink)">
          {cls.points}/{cls.goal}
        </span>
      </div>
    </div>
  );
}

function LessonContent({ classId, startTime }: { classId: string; startTime: Date }) {
  const { classes } = useApp();
  const navigate = useNavigate();
  const cls = classes.find((c) => c.id === classId);
  const [lessonMode, setLessonMode] = useState<"whiteboard" | "notebook" | "widgets">("whiteboard");

  const handleEndLesson = () => {
    const attendance = JSON.parse(sessionStorage.getItem(`lesson-attendance-${classId}`) || "{}");
    const widgets = JSON.parse(sessionStorage.getItem(`lesson-widgets-${classId}`) || "[]");

    const session: LessonSession = {
      classId,
      startTime,
      endTime: new Date(),
      attendance,
      pointsAwarded: cls?.points || 0,
      widgets,
    };

    sessionStorage.setItem(`lesson-session-${classId}`, JSON.stringify(session));
    navigate(`/lesson/${classId}/summary`);
  };

  if (!cls) {
    return (
      <EmptyState
        title="This class doesn't exist"
        body="It may have been deleted. Head back to the dashboard to start a different lesson."
        action={<Button onClick={() => navigate("/")}>Back to Dashboard</Button>}
      />
    );
  }

  return (
    <BoardProvider
      key={cls.id}
      initialWidgets={[
        {
          id: `w-noise-${cls.id}`,
          type: "noise",
          x: 60,
          y: 100,
          w: 300,
          h: 500,
          zIndex: 1,
          minimized: false,
          config: {
            level: 0,
            threshold: 85,
            avg: 0,
            peak: 0,
            warningCount: 0,
            calmStreakSec: 0,
            listening: false,
            micStatus: "idle",
          },
        },
        { id: `w-list-${cls.id}`, type: "studentList", x: 420, y: 100, w: 300, h: 380, zIndex: 2, minimized: false, config: {} },
      ]}
    >
      <div className="flex h-screen flex-col">
        <LessonTopBar classId={cls.id} onEndLesson={handleEndLesson} />
        <div className="flex h-12 items-center gap-2 border-b-2 border-(--color-border) bg-(--color-surface) px-4">
          <button
            onClick={() => setLessonMode("whiteboard")}
            className={`px-3 py-1.5 text-sm font-bold rounded-lg ${
              lessonMode === "whiteboard" ? "bg-(--color-orange-500) text-(--color-ink-on-accent)" : "bg-(--color-paper-dim) text-(--color-ink)"
            }`}
          >
            Whiteboard
          </button>
          <button
            onClick={() => setLessonMode("notebook")}
            className={`px-3 py-1.5 text-sm font-bold rounded-lg ${
              lessonMode === "notebook" ? "bg-(--color-orange-500) text-(--color-ink-on-accent)" : "bg-(--color-paper-dim) text-(--color-ink)"
            }`}
          >
            Notebook
          </button>
          <button
            onClick={() => setLessonMode("widgets")}
            className={`px-3 py-1.5 text-sm font-bold rounded-lg ${
              lessonMode === "widgets" ? "bg-(--color-orange-500) text-(--color-ink-on-accent)" : "bg-(--color-paper-dim) text-(--color-ink)"
            }`}
          >
            Widgets
          </button>
        </div>
        <div className="relative flex-1 overflow-hidden">
          {lessonMode === "whiteboard" && <Board classId={cls.id} />}
          {lessonMode === "notebook" && <Notebook />}
          {lessonMode === "widgets" && <Board classId={cls.id} />}
          {lessonMode !== "widgets" && <AttendancePanel classId={cls.id} />}
        </div>
      </div>
    </BoardProvider>
  );
}

export function Lesson() {
  const { classId } = useParams<{ classId: string }>();
  const [startTime] = useState(new Date());

  if (!classId) {
    const navigate = useNavigate();
    return (
      <div className="flex h-screen items-center justify-center bg-(--color-paper) p-8">
        <EmptyState
          title="Invalid lesson"
          body="No class ID found. Head back to the dashboard to start a lesson."
          action={<Button onClick={() => navigate("/")}>Back to Dashboard</Button>}
        />
      </div>
    );
  }

  useEffect(() => {
    sessionStorage.setItem(`lesson-start-${classId}`, startTime.toISOString());
  }, [classId, startTime]);

  return <LessonContent classId={classId} startTime={startTime} />;
}
