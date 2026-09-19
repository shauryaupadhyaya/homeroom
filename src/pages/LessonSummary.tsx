import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../lib/store";
import { Card, Button, Badge, colorTokens } from "../components/ui";
import { ArrowRight, Clock, Users } from "lucide-react";

interface LessonSession {
  classId: string;
  startTime: Date;
  endTime: Date;
  attendance: Record<string, "present" | "absent" | "late">;
  pointsAwarded: number;
  moodEntry?: number;
  moodExit?: number;
  widgets: string[];
  notes?: string;
}

export function LessonSummary() {
  const { classId } = useParams<{ classId: string }>();
  const { classes, students } = useApp();
  const navigate = useNavigate();

  const [session] = useState<LessonSession | null>(() => {
    const session = sessionStorage.getItem(`lesson-session-${classId}`);
    return session ? JSON.parse(session) : null;
  });

  const selectedClass = useMemo(() => classes.find((c) => c.id === classId), [classes, classId]);
  const classStudents = useMemo(
    () => students.filter((s) => s.classId === classId),
    [students, classId]
  );

  if (!selectedClass || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-(--color-paper)">
        <Card>
          <p className="text-sm text-(--color-ink-muted)">No lesson session data found</p>
          <Button onClick={() => navigate("/")} className="mt-4 w-full">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const startDate = new Date(session.startTime);
  const endDate = new Date(session.endTime);
  const duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
  const presentCount = Object.values(session.attendance).filter((s) => s === "present").length;
  const lateCount = Object.values(session.attendance).filter((s) => s === "late").length;
  const attendanceRate = classStudents.length > 0 ? Math.round(((presentCount + lateCount) / classStudents.length) * 100) : 0;

  const classColor = colorTokens(selectedClass.color);

  return (
    <div className="min-h-screen bg-(--color-paper) px-6 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="font-display text-4xl font-bold text-(--color-ink)">Lesson Summary</h1>
          <p className="mt-2 text-lg font-bold text-(--color-ink)">{selectedClass.name} - {selectedClass.subject}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase text-(--color-ink-muted)">
              <Clock size={14} />
              Duration
            </span>
            <p className="mt-2 text-2xl font-bold text-(--color-ink)">{duration}m</p>
          </Card>

          <Card>
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase text-(--color-ink-muted)">
              <Users size={14} />
              Attendance
            </span>
            <p className="mt-2 text-2xl font-bold text-(--color-ink)">{attendanceRate}%</p>
          </Card>

          <Card>
            <span className="text-xs font-bold uppercase text-(--color-ink-muted)">Points Awarded</span>
            <p className="mt-2 text-2xl font-bold text-(--color-orange-600)">{session.pointsAwarded}</p>
          </Card>

          <Card>
            <span className="text-xs font-bold uppercase text-(--color-ink-muted)">Widgets Used</span>
            <p className="mt-2 text-2xl font-bold text-(--color-ink)">{session.widgets.length}</p>
          </Card>
        </div>

        <Card>
          <h2 className="font-display text-xl font-bold text-(--color-ink)">Attendance Summary</h2>
          <div className="mt-4 space-y-2">
            {classStudents.map((student) => {
              const status = session.attendance[student.id] || "absent";
              const statusColors: Record<string, string> = {
                present: "bg-(--color-success) text-(--color-ink-on-accent)",
                late: "bg-(--color-warning) text-(--color-ink-on-accent)",
                absent: "bg-(--color-danger) text-(--color-ink-on-accent)",
              };
              return (
                <div key={student.id} className="flex items-center justify-between rounded-lg border border-(--color-border) bg-(--color-paper) px-4 py-2">
                  <span className="font-medium text-(--color-ink)">{student.name}</span>
                  <Badge className={statusColors[status]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-xl font-bold text-(--color-ink)">Wellbeing</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-(--color-paper-dim) p-4">
              <span className="text-sm font-bold text-(--color-ink-muted)">Entry Mood</span>
              <p className="mt-2 text-3xl">{session.moodEntry ? "😊" : "—"}</p>
            </div>
            <div className="rounded-lg bg-(--color-paper-dim) p-4">
              <span className="text-sm font-bold text-(--color-ink-muted)">Exit Mood</span>
              <p className="mt-2 text-3xl">{session.moodExit ? "😊" : "—"}</p>
            </div>
          </div>
        </Card>

        {session.widgets.length > 0 && (
          <Card>
            <h2 className="font-display text-xl font-bold text-(--color-ink)">Widgets Used</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {session.widgets.map((widget) => (
                <Badge key={widget} className="bg-(--color-orange-100) text-(--color-orange-600)">
                  {widget}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        <div className="flex gap-3">
          <Button
            size="lg"
            className="flex items-center justify-center gap-2"
            onClick={() => navigate("/")}
          >
            Back to Dashboard
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
