import { useState, useMemo } from "react";
import { useApp } from "../lib/store";
import { Card, Badge, colorTokens } from "../components/ui";
import { Check, X, Clock } from "lucide-react";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

interface AttendanceRecord {
  studentId: string;
  date: string;
  status: AttendanceStatus;
}

export function Attendance() {
  const { classes, students } = useApp();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(classes[0]?.id || null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  const selectedClass = useMemo(() => classes.find((c) => c.id === selectedClassId), [classes, selectedClassId]);
  const classStudents = useMemo(
    () => students.filter((s) => s.classId === selectedClassId),
    [students, selectedClassId]
  );

  const todayRecords = useMemo(
    () => attendanceRecords.filter((r) => r.date === selectedDate),
    [attendanceRecords, selectedDate]
  );

  const getRecord = (studentId: string) => todayRecords.find((r) => r.studentId === studentId);

  const updateAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords((prev) => {
      const existing = prev.find((r) => r.studentId === studentId && r.date === selectedDate);
      if (existing) {
        return prev.map((r) =>
          r.studentId === studentId && r.date === selectedDate ? { ...r, status } : r
        );
      }
      return [...prev, { studentId, date: selectedDate, status }];
    });
  };

  const stats = useMemo(() => {
    if (classStudents.length === 0) return { present: 0, absent: 0, late: 0, rate: 0 };
    const present = todayRecords.filter((r) => r.status === "present").length;
    const absent = todayRecords.filter((r) => r.status === "absent").length;
    const late = todayRecords.filter((r) => r.status === "late").length;
    const rate = classStudents.length > 0 ? Math.round(((present + late) / classStudents.length) * 100) : 0;
    return { present, absent, late, rate };
  }, [classStudents, todayRecords]);

  if (!selectedClass) return <div>No classes available</div>;

  const classColor = colorTokens(selectedClass.color);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-(--color-ink)">Attendance</h1>
        <p className="mt-1 text-sm text-(--color-ink-muted)">Track and manage student attendance</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr]">
        <div className="flex flex-col gap-2">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`rounded-lg border-2 px-3 py-2 text-sm font-bold transition-colors ${
                selectedClassId === cls.id
                  ? `border-(--color-border) ${classColor.solid} text-(--color-ink-on-accent)`
                  : "border-(--color-border) text-(--color-ink-muted) hover:bg-(--color-paper-dim)"
              }`}
            >
              {cls.name}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <Card>
              <span className="text-xs font-bold uppercase text-(--color-ink-muted)">Date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-2 w-full rounded border-2 border-(--color-border) bg-(--color-surface) px-2 py-1 text-sm font-bold"
              />
            </Card>

            <Card>
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase text-(--color-ink-muted)">
                <Check size={14} className="text-(--color-success)" /> Present
              </span>
              <p className="mt-2 text-2xl font-bold text-(--color-ink)">{stats.present}</p>
            </Card>

            <Card>
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase text-(--color-ink-muted)">
                <X size={14} className="text-(--color-danger)" /> Absent
              </span>
              <p className="mt-2 text-2xl font-bold text-(--color-ink)">{stats.absent}</p>
            </Card>

            <Card>
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase text-(--color-ink-muted)">
                <Clock size={14} className="text-(--color-warning)" /> Late
              </span>
              <p className="mt-2 text-2xl font-bold text-(--color-ink)">{stats.late}</p>
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-(--color-ink-muted)">
                Attendance Rate
              </span>
              <Badge>{stats.rate}%</Badge>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-(--color-paper-dim)">
              <div
                className={`h-full ${classColor.solid} transition-all`}
                style={{ width: `${stats.rate}%` }}
              />
            </div>
          </Card>

          <div className="rounded-lg border-2 border-(--color-border) bg-(--color-surface) p-4">
            <h3 className="mb-4 font-display text-lg font-bold text-(--color-ink)">Mark Attendance</h3>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {classStudents.map((student) => {
                const record = getRecord(student.id);
                return (
                  <div key={student.id} className="flex items-center justify-between rounded-lg border border-(--color-border) bg-(--color-paper) p-3">
                    <span className="text-sm font-bold text-(--color-ink)">{student.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateAttendance(student.id, "present")}
                        className={`rounded px-3 py-1.5 text-xs font-bold transition-colors ${
                          record?.status === "present"
                            ? "bg-green-600 text-white shadow-hard-sm"
                            : "border-2 border-green-600 text-green-700 bg-green-100 hover:bg-green-600 hover:text-white"
                        }`}
                      >
                        P
                      </button>
                      <button
                        onClick={() => updateAttendance(student.id, "absent")}
                        className={`rounded px-3 py-1.5 text-xs font-bold transition-colors ${
                          record?.status === "absent"
                            ? "bg-(--color-danger) text-white shadow-hard-sm"
                            : "border-2 border-(--color-danger) text-(--color-danger) bg-(--color-danger-100) hover:bg-(--color-danger) hover:text-white"
                        }`}
                      >
                        A
                      </button>
                      <button
                        onClick={() => updateAttendance(student.id, "late")}
                        className={`rounded px-3 py-1.5 text-xs font-bold transition-colors ${
                          record?.status === "late"
                            ? "bg-(--color-orange-500) text-white shadow-hard-sm"
                            : "border-2 border-(--color-orange-500) text-(--color-orange-600) bg-(--color-orange-100) hover:bg-(--color-orange-500) hover:text-white"
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
        </div>
      </div>
    </div>
  );
}
