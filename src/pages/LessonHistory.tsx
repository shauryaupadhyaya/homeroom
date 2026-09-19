import { useState, useMemo } from "react";
import { useApp } from "../lib/store";
import { Card, Button, Badge, colorTokens } from "../components/ui";
import { Archive, Eye, Trash2, Calendar, Users, Clock } from "lucide-react";

interface HistoryLesson {
  id: string;
  classId: string;
  date: string;
  duration: number;
  attendanceRate: number;
  studentsPresent: number;
  totalStudents: number;
  pointsAwarded: number;
  widgetsUsed: string[];
  archived: boolean;
  notes?: string;
}

export function LessonHistory() {
  const { classes } = useApp();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(classes[0]?.id || null);
  const [filterArchived, setFilterArchived] = useState(false);
  const [lessons, setLessons] = useState<HistoryLesson[]>([
    {
      id: "l1",
      classId: "c1",
      date: "2025-01-15",
      duration: 45,
      attendanceRate: 86,
      studentsPresent: 6,
      totalStudents: 7,
      pointsAwarded: 120,
      widgetsUsed: ["Noise Monitor", "Student List", "Timer"],
      archived: false,
      notes: "Covered map reading basics",
    },
    {
      id: "l2",
      classId: "c1",
      date: "2025-01-10",
      duration: 40,
      attendanceRate: 71,
      studentsPresent: 5,
      totalStudents: 7,
      pointsAwarded: 95,
      widgetsUsed: ["Noise Monitor"],
      archived: false,
      notes: "Introduction to geography",
    },
    {
      id: "l3",
      classId: "c1",
      date: "2025-01-08",
      duration: 35,
      attendanceRate: 100,
      studentsPresent: 7,
      totalStudents: 7,
      pointsAwarded: 150,
      widgetsUsed: ["Noise Monitor", "Student List"],
      archived: true,
      notes: "Assessment review",
    },
    {
      id: "l4",
      classId: "c2",
      date: "2025-01-18",
      duration: 50,
      attendanceRate: 90,
      studentsPresent: 9,
      totalStudents: 10,
      pointsAwarded: 200,
      widgetsUsed: ["Timer", "Student List"],
      archived: false,
      notes: "Periodic table introduction",
    },
  ]);

  const selectedClass = useMemo(() => classes.find((c) => c.id === selectedClassId), [classes, selectedClassId]);
  const classLessons = useMemo(
    () => lessons.filter((lesson) => lesson.classId === selectedClassId && lesson.archived === filterArchived),
    [lessons, selectedClassId, filterArchived]
  );

  const stats = useMemo(() => {
    const totalLessons = classLessons.length;
    const avgAttendance = classLessons.length > 0 ? Math.round(classLessons.reduce((sum, l) => sum + l.attendanceRate, 0) / classLessons.length) : 0;
    const totalPoints = classLessons.reduce((sum, l) => sum + l.pointsAwarded, 0);
    const totalDuration = classLessons.reduce((sum, l) => sum + l.duration, 0);
    return { totalLessons, avgAttendance, totalPoints, totalDuration };
  }, [classLessons]);

  const archiveLesson = (lessonId: string) => {
    setLessons((prev) =>
      prev.map((lesson) => (lesson.id === lessonId ? { ...lesson, archived: true } : lesson))
    );
  };

  const unarchiveLesson = (lessonId: string) => {
    setLessons((prev) =>
      prev.map((lesson) => (lesson.id === lessonId ? { ...lesson, archived: false } : lesson))
    );
  };

  const deleteLesson = (lessonId: string) => {
    setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId));
  };

  if (!selectedClass) return <div>No classes available</div>;

  const classColor = colorTokens(selectedClass.color);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-(--color-ink)">Lesson History</h1>
        <p className="mt-1 text-sm text-(--color-ink-muted)">Review and archive past lessons</p>
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
              <span className="text-xs font-bold uppercase text-(--color-ink-muted)">Total Lessons</span>
              <p className="mt-2 text-2xl font-bold text-(--color-ink)">{stats.totalLessons}</p>
            </Card>

            <Card>
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase text-(--color-ink-muted)">
                <Users size={14} />
                Avg Attendance
              </span>
              <p className="mt-2 text-2xl font-bold text-(--color-ink)">{stats.avgAttendance}%</p>
            </Card>

            <Card>
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase text-(--color-ink-muted)">
                <Clock size={14} />
                Total Duration
              </span>
              <p className="mt-2 text-2xl font-bold text-(--color-ink)">{stats.totalDuration}m</p>
            </Card>

            <Card>
              <span className="text-xs font-bold uppercase text-(--color-ink-muted)">Points Awarded</span>
              <p className="mt-2 text-2xl font-bold text-(--color-orange-600)">{stats.totalPoints}</p>
            </Card>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setFilterArchived(false)}
              className={!filterArchived ? "bg-(--color-orange-500)" : "border-2 border-(--color-border)"}
            >
              Active
            </Button>
            <Button
              size="sm"
              onClick={() => setFilterArchived(true)}
              className={filterArchived ? "bg-(--color-orange-500)" : "border-2 border-(--color-border)"}
            >
              Archived
            </Button>
          </div>

          <div className="space-y-3">
            {classLessons.length === 0 ? (
              <Card>
                <p className="text-center text-sm text-(--color-ink-muted)">
                  {filterArchived ? "No archived lessons" : "No active lessons"}
                </p>
              </Card>
            ) : (
              classLessons.map((lesson) => (
                <Card key={lesson.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${classColor.solid}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-(--color-ink-muted)" />
                            <span className="font-bold text-(--color-ink)">{lesson.date}</span>
                          </div>
                          {lesson.notes && (
                            <p className="mt-1 text-xs text-(--color-ink-muted)">{lesson.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className="bg-(--color-sky-100) text-(--color-sky-600)">
                        {lesson.duration}m
                      </Badge>
                      <Badge className={lesson.attendanceRate >= 80 ? "bg-(--color-success-100) text-(--color-success)" : "bg-(--color-warning-100) text-(--color-warning)"}>
                        {lesson.attendanceRate}%
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs lg:grid-cols-4">
                    <div className="rounded bg-(--color-paper-dim) p-2">
                      <span className="font-bold text-(--color-ink-muted)">Attendance</span>
                      <p className="mt-1 font-bold text-(--color-ink)">{lesson.studentsPresent}/{lesson.totalStudents}</p>
                    </div>
                    <div className="rounded bg-(--color-paper-dim) p-2">
                      <span className="font-bold text-(--color-ink-muted)">Points</span>
                      <p className="mt-1 font-bold text-(--color-orange-600)">{lesson.pointsAwarded}</p>
                    </div>
                    <div className="rounded bg-(--color-paper-dim) p-2">
                      <span className="font-bold text-(--color-ink-muted)">Widgets</span>
                      <p className="mt-1 font-bold text-(--color-ink)">{lesson.widgetsUsed.length}</p>
                    </div>
                    <div className="rounded bg-(--color-paper-dim) p-2">
                      <span className="font-bold text-(--color-ink-muted)">Status</span>
                      <p className="mt-1 font-bold text-(--color-ink)">{lesson.archived ? "Archived" : "Active"}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="flex items-center gap-1">
                      <Eye size={14} />
                      View
                    </Button>
                    {!filterArchived ? (
                      <Button
                        size="sm"
                        onClick={() => archiveLesson(lesson.id)}
                        className="flex items-center gap-1 border-2 border-(--color-border)"
                      >
                        <Archive size={14} />
                        Archive
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => unarchiveLesson(lesson.id)}
                        className="flex items-center gap-1 border-2 border-(--color-border)"
                      >
                        Restore
                      </Button>
                    )}
                    <button
                      onClick={() => deleteLesson(lesson.id)}
                      className="rounded-lg border-2 border-(--color-border) bg-(--color-paper) p-2 hover:bg-(--color-danger-100)"
                    >
                      <Trash2 size={14} className="text-(--color-danger)" />
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
