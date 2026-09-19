import { useState, useMemo } from "react";
import { useApp } from "../lib/store";
import { Card, Badge, colorTokens } from "../components/ui";
import { TrendingUp, Target, Award, Calendar } from "lucide-react";

interface StudentProgressData {
  studentId: string;
  totalLessonsAttended: number;
  attendanceRate: number;
  averageMarks: number;
  totalPointsEarned: number;
  skillsCompleted: number;
  topicsCompleted: number;
  improvementTrend: number;
  lastActivity: string;
}

export function StudentProgress() {
  const { classes, students } = useApp();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(classes[0]?.id || null);

  const [progressData] = useState<StudentProgressData[]>([
    { studentId: "s1", totalLessonsAttended: 15, attendanceRate: 93, averageMarks: 87, totalPointsEarned: 450, skillsCompleted: 8, topicsCompleted: 12, improvementTrend: 5, lastActivity: "2025-01-15" },
    { studentId: "s2", totalLessonsAttended: 14, attendanceRate: 88, averageMarks: 92, totalPointsEarned: 520, skillsCompleted: 9, topicsCompleted: 12, improvementTrend: 8, lastActivity: "2025-01-15" },
    { studentId: "s3", totalLessonsAttended: 12, attendanceRate: 75, averageMarks: 78, totalPointsEarned: 380, skillsCompleted: 6, topicsCompleted: 10, improvementTrend: -2, lastActivity: "2025-01-14" },
    { studentId: "s4", totalLessonsAttended: 16, attendanceRate: 100, averageMarks: 95, totalPointsEarned: 580, skillsCompleted: 10, topicsCompleted: 12, improvementTrend: 12, lastActivity: "2025-01-15" },
    { studentId: "s5", totalLessonsAttended: 13, attendanceRate: 81, averageMarks: 84, totalPointsEarned: 420, skillsCompleted: 7, topicsCompleted: 11, improvementTrend: 3, lastActivity: "2025-01-14" },
    { studentId: "s6", totalLessonsAttended: 14, attendanceRate: 88, averageMarks: 89, totalPointsEarned: 470, skillsCompleted: 8, topicsCompleted: 12, improvementTrend: 6, lastActivity: "2025-01-15" },
    { studentId: "s7", totalLessonsAttended: 15, attendanceRate: 94, averageMarks: 91, totalPointsEarned: 510, skillsCompleted: 9, topicsCompleted: 12, improvementTrend: 7, lastActivity: "2025-01-15" },
  ]);

  const selectedClass = useMemo(() => classes.find((c) => c.id === selectedClassId), [classes, selectedClassId]);
  const classStudents = useMemo(() => students.filter((s) => s.classId === selectedClassId), [students, selectedClassId]);

  const classProgress = useMemo(() => {
    const progressMap = new Map(progressData.map((p) => [p.studentId, p]));
    return classStudents.map((student) => ({ student, progress: progressMap.get(student.id) })).filter((item) => item.progress !== undefined);
  }, [classStudents, progressData]);

  const stats = useMemo(() => {
    const avgAttendance = classProgress.length > 0 ? Math.round(classProgress.reduce((sum, p) => sum + (p.progress?.attendanceRate || 0), 0) / classProgress.length) : 0;
    const avgMarks = classProgress.length > 0 ? Math.round(classProgress.reduce((sum, p) => sum + (p.progress?.averageMarks || 0), 0) / classProgress.length) : 0;
    const totalPoints = classProgress.reduce((sum, p) => sum + (p.progress?.totalPointsEarned || 0), 0);
    return { avgAttendance, avgMarks, totalPoints };
  }, [classProgress]);

  if (!selectedClass) return <div>No classes available</div>;

  const classColor = colorTokens(selectedClass.color);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-(--color-ink)">Student Progress</h1>
        <p className="mt-1 text-sm text-(--color-ink-muted)">Track learning metrics and individual growth</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr]">
        <div className="flex flex-col gap-2">
          {classes.map((cls) => (
            <button key={cls.id} onClick={() => setSelectedClassId(cls.id)} className={`rounded-lg border-2 px-3 py-2 text-sm font-bold transition-colors ${selectedClassId === cls.id ? `border-(--color-border) ${classColor.solid} text-(--color-ink-on-accent)` : "border-(--color-border) text-(--color-ink-muted) hover:bg-(--color-paper-dim)"}`}>
              {cls.name}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <Card>
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase text-(--color-ink-muted)"><TrendingUp size={14} /> Avg Attendance</span>
              <p className="mt-2 text-2xl font-bold text-(--color-ink)">{stats.avgAttendance}%</p>
            </Card>
            <Card>
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase text-(--color-ink-muted)"><Award size={14} /> Avg Marks</span>
              <p className="mt-2 text-2xl font-bold text-(--color-ink)">{stats.avgMarks}%</p>
            </Card>
            <Card>
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase text-(--color-ink-muted)"><Target size={14} /> Total Points</span>
              <p className="mt-2 text-2xl font-bold text-(--color-orange-600)">{stats.totalPoints}</p>
            </Card>
            <Card>
              <span className="text-xs font-bold uppercase text-(--color-ink-muted)">Students</span>
              <p className="mt-2 text-2xl font-bold text-(--color-ink)">{classProgress.length}</p>
            </Card>
          </div>

          <div className="space-y-2">
            {classProgress.map(({ student, progress }) => (
              <Card key={student.id}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-(--color-ink)">{student.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-(--color-sky-100) text-(--color-sky-600)">{progress!.averageMarks}%</Badge>
                      <Badge className={progress!.improvementTrend >= 0 ? "bg-(--color-success-100) text-(--color-success)" : "bg-(--color-danger-100) text-(--color-danger)"}>{progress!.improvementTrend > 0 ? "+" : ""}{progress!.improvementTrend}%</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <div className="rounded bg-(--color-paper-dim) p-2">
                      <span className="text-xs font-bold text-(--color-ink-muted)">Attendance</span>
                      <p className="mt-1 text-sm font-bold text-(--color-ink)">{progress!.attendanceRate}%</p>
                    </div>
                    <div className="rounded bg-(--color-paper-dim) p-2">
                      <span className="text-xs font-bold text-(--color-ink-muted)">Lessons</span>
                      <p className="mt-1 text-sm font-bold text-(--color-ink)">{progress!.totalLessonsAttended}</p>
                    </div>
                    <div className="rounded bg-(--color-paper-dim) p-2">
                      <span className="text-xs font-bold text-(--color-ink-muted)">Topics</span>
                      <p className="mt-1 text-sm font-bold text-(--color-ink)">{progress!.topicsCompleted}/12</p>
                    </div>
                    <div className="rounded bg-(--color-paper-dim) p-2">
                      <span className="text-xs font-bold text-(--color-ink-muted)">Points</span>
                      <p className="mt-1 text-sm font-bold text-(--color-orange-600)">{progress!.totalPointsEarned}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-(--color-ink-muted)">
                    <Calendar size={12} />
                    Last active: {progress!.lastActivity}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
