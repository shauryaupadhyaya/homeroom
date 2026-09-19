import { useState, useMemo } from "react";
import { useApp } from "../lib/store";
import { Card, Button, Badge, colorTokens } from "../components/ui";
import { Plus, Edit2 } from "lucide-react";

type AssessmentType = "test" | "exam" | "quiz" | "assignment" | "project";

interface Assessment {
  id: string;
  title: string;
  classId: string;
  subject: string;
  type: AssessmentType;
  date: string;
  totalMarks: number;
}

interface StudentMark {
  studentId: string;
  assessmentId: string;
  marks: number;
}

export function Assessments() {
  const { classes, students } = useApp();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(classes[0]?.id || null);
  const [assessments, setAssessments] = useState<Assessment[]>([
    {
      id: "a1",
      title: "Midterm Exam",
      classId: "c1",
      subject: "Physics",
      type: "exam",
      date: "2025-01-20",
      totalMarks: 100,
    },
    {
      id: "a2",
      title: "Chapter 5 Quiz",
      classId: "c2",
      subject: "Chemistry",
      type: "quiz",
      date: "2025-01-15",
      totalMarks: 20,
    },
  ]);
  const [marks, setMarks] = useState<StudentMark[]>([
    { studentId: "s1", assessmentId: "a1", marks: 85 },
    { studentId: "s2", assessmentId: "a1", marks: 92 },
  ]);

  const selectedClass = useMemo(() => classes.find((c) => c.id === selectedClassId), [classes, selectedClassId]);
  const classAssessments = useMemo(
    () => assessments.filter((a) => a.classId === selectedClassId),
    [assessments, selectedClassId]
  );
  const classStudents = useMemo(
    () => students.filter((s) => s.classId === selectedClassId),
    [students, selectedClassId]
  );

  const getStudentMark = (studentId: string, assessmentId: string) => {
    const mark = marks.find((m) => m.studentId === studentId && m.assessmentId === assessmentId);
    return mark?.marks ?? null;
  };

  const updateMark = (studentId: string, assessmentId: string, marksValue: number) => {
    setMarks((prev) => {
      const existing = prev.find((m) => m.studentId === studentId && m.assessmentId === assessmentId);
      if (existing) {
        return prev.map((m) =>
          m.studentId === studentId && m.assessmentId === assessmentId
            ? { ...m, marks: marksValue }
            : m
        );
      }
      return [...prev, { studentId, assessmentId, marks: marksValue }];
    });
  };

  const getAssessmentStats = (assessmentId: string) => {
    const assessment = assessments.find((a) => a.id === assessmentId);
    if (!assessment) return { average: 0, highest: 0, lowest: 0 };

    const assessmentMarks = marks
      .filter((m) => m.assessmentId === assessmentId)
      .map((m) => m.marks);

    if (assessmentMarks.length === 0) return { average: 0, highest: 0, lowest: 0 };

    const average = Math.round(assessmentMarks.reduce((a, b) => a + b, 0) / assessmentMarks.length);
    const highest = Math.max(...assessmentMarks);
    const lowest = Math.min(...assessmentMarks);

    return { average, highest, lowest };
  };

  if (!selectedClass) return <div>No classes available</div>;

  const typeColors: Record<AssessmentType, string> = {
    test: "bg-(--color-orange-100) text-(--color-orange-600)",
    exam: "bg-(--color-danger-100) text-(--color-danger)",
    quiz: "bg-(--color-sky-100) text-(--color-sky-600)",
    assignment: "bg-(--color-lime-100) text-(--color-lime-600)",
    project: "bg-(--color-pink-100) text-(--color-pink-600)",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-(--color-ink)">Assessments</h1>
        <p className="mt-1 text-sm text-(--color-ink-muted)">Track tests, exams, assignments, and student marks</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr]">
        <div className="flex flex-col gap-2">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`rounded-lg border-2 px-3 py-2 text-sm font-bold transition-colors ${
                selectedClassId === cls.id
                  ? `border-(--color-border) bg-(--color-orange-500) text-(--color-ink-on-accent)`
                  : "border-(--color-border) text-(--color-ink-muted) hover:bg-(--color-paper-dim)"
              }`}
            >
              {cls.name}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-(--color-ink)">Assessments in {selectedClass.name}</h2>
            <Button size="sm" className="flex items-center gap-1">
              <Plus size={14} />
              New
            </Button>
          </div>

          {classAssessments.length === 0 ? (
            <Card>
              <p className="text-sm text-(--color-ink-muted)">No assessments yet. Create one to get started.</p>
            </Card>
          ) : (
            classAssessments.map((assessment) => {
              const stats = getAssessmentStats(assessment.id);
              return (
                <Card key={assessment.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg font-bold text-(--color-ink)">{assessment.title}</h3>
                        <Badge className={typeColors[assessment.type]}>{assessment.type}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-(--color-ink-muted)">{assessment.date} | {assessment.totalMarks} marks</p>
                    </div>
                    <button className="rounded-lg border-2 border-(--color-border) bg-(--color-paper) p-2 hover:bg-(--color-paper-dim)">
                      <Edit2 size={14} />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-(--color-paper-dim) p-3">
                      <span className="text-xs font-bold uppercase text-(--color-ink-muted)">Average</span>
                      <p className="mt-1 text-xl font-bold text-(--color-ink)">{stats.average}/{assessment.totalMarks}</p>
                    </div>
                    <div className="rounded-lg bg-(--color-paper-dim) p-3">
                      <span className="text-xs font-bold uppercase text-(--color-ink-muted)">Highest</span>
                      <p className="mt-1 text-xl font-bold text-(--color-success)">{stats.highest}/{assessment.totalMarks}</p>
                    </div>
                    <div className="rounded-lg bg-(--color-paper-dim) p-3">
                      <span className="text-xs font-bold uppercase text-(--color-ink-muted)">Lowest</span>
                      <p className="mt-1 text-xl font-bold text-(--color-danger)">{stats.lowest}/{assessment.totalMarks}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-bold text-(--color-ink)">Student Marks</h4>
                    <div className="max-h-48 space-y-1 overflow-y-auto">
                      {classStudents.map((student) => {
                        const studentMark = getStudentMark(student.id, assessment.id);
                        const percentage = studentMark ? Math.round((studentMark / assessment.totalMarks) * 100) : 0;
                        return (
                          <div key={student.id} className="flex items-center justify-between rounded border border-(--color-border) bg-(--color-paper) px-3 py-2 text-sm">
                            <span className="font-medium text-(--color-ink)">{student.name}</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max={assessment.totalMarks}
                                value={studentMark ?? ""}
                                onChange={(e) => updateMark(student.id, assessment.id, parseInt(e.target.value) || 0)}
                                className="w-16 rounded border border-(--color-border) bg-(--color-surface) px-2 py-1 text-right text-sm font-bold"
                                placeholder="-"
                              />
                              <span className="w-12 text-right text-sm font-bold text-(--color-ink-muted)">
                                {percentage}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
