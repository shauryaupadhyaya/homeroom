import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../lib/store";
import { Card, Button, Badge, colorTokens } from "../components/ui";
import { ArrowLeft, BookOpen, TrendingUp, Calendar } from "lucide-react";

interface StudentMark {
  assessmentId: string;
  marks: number;
}

interface StudentAttendance {
  date: string;
  status: "present" | "absent" | "late";
}

export function StudentProfile() {
  const { studentId } = useParams<{ studentId: string }>();
  const { students, classes } = useApp();
  const navigate = useNavigate();

  const student = useMemo(() => students.find((s) => s.id === studentId), [students, studentId]);
  const studentClass = useMemo(() => student && classes.find((c) => c.id === student.classId), [student, classes]);

  const [marks] = useState<StudentMark[]>([
    { assessmentId: "a1", marks: 85 },
    { assessmentId: "a2", marks: 92 },
  ]);

  const [attendance] = useState<StudentAttendance[]>([
    { date: "2025-01-20", status: "present" },
    { date: "2025-01-21", status: "late" },
    { date: "2025-01-22", status: "present" },
    { date: "2025-01-23", status: "present" },
  ]);

  if (!student || !studentClass) {
    return (
      <div className="flex h-screen items-center justify-center bg-(--color-paper) p-8">
        <Card>
          <p className="text-sm text-(--color-ink-muted)">Student not found</p>
          <Button onClick={() => navigate("/")} className="mt-4 w-full">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const classColor = colorTokens(studentClass.color);
  const presentCount = attendance.filter((a) => a.status === "present").length;
  const lateCount = attendance.filter((a) => a.status === "late").length;
  const attendanceRate = Math.round(((presentCount + lateCount) / attendance.length) * 100);
  const averageMarks = marks.length > 0 ? Math.round(marks.reduce((a, b) => a + b.marks, 0) / marks.length) : 0;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 rounded-lg border-2 border-(--color-border) bg-(--color-paper-dim) px-3 py-2 text-sm font-bold text-(--color-ink-soft) hover:bg-(--color-paper)"
      >
        <ArrowLeft size={14} />
        Back to Dashboard
      </button>

      <div className="space-y-2">
        <h1 className="font-display text-4xl font-bold text-(--color-ink)">{student.name}</h1>
        <div className="flex items-center gap-3">
          <div className={`h-4 w-4 rounded-full ${classColor.solid}`} />
          <p className="text-lg font-bold text-(--color-ink)">{studentClass.name} - {studentClass.subject}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card>
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase text-(--color-ink-muted)">
            <TrendingUp size={14} />
            Average Marks
          </span>
          <p className="mt-2 text-2xl font-bold text-(--color-ink)">{averageMarks}%</p>
        </Card>

        <Card>
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase text-(--color-ink-muted)">
            <Calendar size={14} />
            Attendance
          </span>
          <p className="mt-2 text-2xl font-bold text-(--color-ink)">{attendanceRate}%</p>
        </Card>

        <Card>
          <span className="text-xs font-bold uppercase text-(--color-ink-muted)">Present</span>
          <p className="mt-2 text-2xl font-bold text-(--color-success)">{presentCount}</p>
        </Card>

        <Card>
          <span className="text-xs font-bold uppercase text-(--color-ink-muted)">Late</span>
          <p className="mt-2 text-2xl font-bold text-(--color-warning)">{lateCount}</p>
        </Card>
      </div>

      <Card>
        <h2 className="font-display text-xl font-bold text-(--color-ink)">Attendance Progress</h2>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-(--color-ink)">Attendance Rate</span>
            <Badge>{attendanceRate}%</Badge>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-(--color-paper-dim)">
            <div
              className={`h-full ${classColor.solid} transition-all`}
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-xl font-bold text-(--color-ink)">Recent Attendance</h2>
        <div className="mt-4 space-y-2">
          {attendance.map((record) => {
            const statusColors: Record<string, string> = {
              present: "bg-(--color-success) text-(--color-ink-on-accent)",
              late: "bg-(--color-warning) text-(--color-ink-on-accent)",
              absent: "bg-(--color-danger) text-(--color-ink-on-accent)",
            };
            return (
              <div key={record.date} className="flex items-center justify-between rounded-lg border border-(--color-border) bg-(--color-paper) px-4 py-2">
                <span className="text-sm font-medium text-(--color-ink)">{record.date}</span>
                <Badge className={statusColors[record.status]}>
                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-xl font-bold text-(--color-ink)">Assessment Performance</h2>
        <div className="mt-4 space-y-3">
          {marks.map((mark, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-(--color-ink)">Assessment {idx + 1}</span>
                <Badge>{mark.marks}%</Badge>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-(--color-paper-dim)">
                <div
                  className={`h-full ${classColor.solid} transition-all`}
                  style={{ width: `${mark.marks}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-(--color-orange-600)" />
          <h2 className="font-display text-lg font-bold text-(--color-ink)">Portfolio</h2>
        </div>
        <p className="mt-3 text-sm text-(--color-ink-muted)">No portfolio items yet. Portfolio features coming soon.</p>
      </Card>
    </div>
  );
}
