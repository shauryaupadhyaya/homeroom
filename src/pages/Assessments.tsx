import { useState, useMemo, useEffect } from "react";
import { useApp } from "../lib/store";
import { Card, Button } from "../components/ui";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { assessmentsApi } from "../lib/supabase";

type AssessmentType = "test" | "exam" | "quiz" | "assignment" | "project";

interface Assessment {
  id: string;
  class_id: string;
  subject: string;
  date: string;
  total_marks: number;
  title?: string;
  type?: AssessmentType;
}

interface StudentMark {
  studentId: string;
  assessmentId: string;
  marks: number;
}

export function Assessments() {
  const { classes, students } = useApp();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(classes[0]?.id || null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [marks, setMarks] = useState<StudentMark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    date: new Date().toISOString().split("T")[0],
    totalMarks: 100,
  });

  useEffect(() => {
    if (selectedClassId) {
      loadAssessments();
    }
  }, [selectedClassId]);

  const loadAssessments = async () => {
    setLoading(true);
    setError(null);
    try {
      if (selectedClassId) {
        const data = await assessmentsApi.getByClass(selectedClassId);
        setAssessments(data);
      }
    } catch (err) {
      console.error("Failed to load assessments:", err);
      setError("Failed to load assessments");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssessment = async () => {
    if (!formData.subject.trim() || !selectedClassId) {
      setError("Enter a subject name");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const classStudents = students.filter((s) => s.classId === selectedClassId);
      for (const student of classStudents) {
        await assessmentsApi.create(student.id, selectedClassId, formData.subject, 0, formData.totalMarks, formData.date);
      }
      await loadAssessments();
      setFormData({ subject: "", date: new Date().toISOString().split("T")[0], totalMarks: 100 });
      setShowForm(false);
    } catch (err) {
      console.error("Failed to create assessment:", err);
      setError(`Failed to create assessment: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!window.confirm("Delete this assessment? This cannot be undone.")) return;
    try {
      await assessmentsApi.delete(assessmentId);
      await loadAssessments();
    } catch (err) {
      console.error("Failed to delete assessment:", err);
      setError("Failed to delete assessment");
    }
  };

  const selectedClass = useMemo(() => classes.find((c) => c.id === selectedClassId), [classes, selectedClassId]);
  const classStudents = useMemo(
    () => students.filter((s) => s.classId === selectedClassId),
    [students, selectedClassId]
  );

  const getStudentMark = (studentId: string, assessmentId: string) => {
    const mark = marks.find((m) => m.studentId === studentId && m.assessmentId === assessmentId);
    return mark?.marks ?? 0;
  };

  const updateMark = async (studentId: string, assessmentId: string, marksValue: number) => {
    if (marksValue < 0) return;
    const assessment = assessments.find((a) => a.id === assessmentId);
    if (assessment && marksValue > assessment.total_marks) return;

    try {
      await assessmentsApi.update(assessmentId, { marks: marksValue });
      setMarks((prev) => {
        const existing = prev.find((m) => m.studentId === studentId && m.assessmentId === assessmentId);
        if (existing) {
          return prev.map((m) =>
            m.studentId === studentId && m.assessmentId === assessmentId ? { ...m, marks: marksValue } : m
          );
        }
        return [...prev, { studentId, assessmentId, marks: marksValue }];
      });
    } catch (err) {
      console.error("Failed to update mark:", err);
      setError("Failed to save mark");
    }
  };

  const getAssessmentStats = (assessmentId: string) => {
    const assessment = assessments.find((a) => a.id === assessmentId);
    if (!assessment) return { average: 0, highest: 0, lowest: 0 };

    const assessmentMarks = assessments
      .filter((a) => a.id === assessmentId)
      .map((a) => a.total_marks)
      .filter((m) => m > 0);

    if (assessmentMarks.length === 0) return { average: 0, highest: 0, lowest: 0 };

    const average = Math.round(assessmentMarks.reduce((a, b) => a + b, 0) / assessmentMarks.length);
    const highest = Math.max(...assessmentMarks);
    const lowest = Math.min(...assessmentMarks);

    return { average, highest, lowest };
  };

  if (!selectedClass) return <div>No classes available</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-(--color-ink)">Assessments</h1>
        <p className="mt-1 text-sm text-(--color-ink-muted)">Track tests, exams, assignments, and student marks</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border-2 border-(--color-danger) bg-(--color-danger-100) p-4 text-(--color-danger)">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

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
            <Button size="sm" onClick={() => setShowForm(!showForm)} className="flex items-center gap-1">
              <Plus size={14} />
              New Assessment
            </Button>
          </div>

          {showForm && (
            <Card>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-bold text-(--color-ink)">Subject / Topic</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Chapter 5 Quiz"
                    className="mt-1 w-full rounded-lg border-2 border-(--color-border) px-3 py-2 text-sm focus:border-(--color-sky-500) focus:ring-2 focus:ring-(--color-sky-500)/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-(--color-ink)">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="mt-1 w-full rounded-lg border-2 border-(--color-border) px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-(--color-ink)">Total Marks</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.totalMarks}
                      onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) || 100 })}
                      className="mt-1 w-full rounded-lg border-2 border-(--color-border) px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateAssessment} disabled={loading} className="flex-1">
                    {loading ? "Creating..." : "Create Assessment"}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowForm(false)} disabled={loading}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {loading && assessments.length === 0 ? (
            <Card>
              <p className="text-sm text-(--color-ink-muted)">Loading assessments...</p>
            </Card>
          ) : assessments.length === 0 ? (
            <Card>
              <p className="text-sm text-(--color-ink-muted)">No assessments yet. Create one to get started.</p>
            </Card>
          ) : (
            assessments.map((assessment) => {
              const stats = getAssessmentStats(assessment.id);
              return (
                <Card key={assessment.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-lg font-bold text-(--color-ink)">{assessment.subject}</h3>
                      <p className="mt-1 text-sm text-(--color-ink-muted)">{assessment.date} | {assessment.total_marks} marks</p>
                    </div>
                    <button
                      onClick={() => handleDeleteAssessment(assessment.id)}
                      className="rounded-lg border-2 border-(--color-border) bg-(--color-paper) p-2 hover:bg-(--color-danger-100) hover:border-(--color-danger)"
                    >
                      <Trash2 size={14} className="text-(--color-danger)" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-(--color-paper-dim) p-3">
                      <span className="text-xs font-bold uppercase text-(--color-ink-muted)">Average</span>
                      <p className="mt-1 text-xl font-bold text-(--color-ink)">{stats.average}/{assessment.total_marks}</p>
                    </div>
                    <div className="rounded-lg bg-(--color-paper-dim) p-3">
                      <span className="text-xs font-bold uppercase text-(--color-ink-muted)">Highest</span>
                      <p className="mt-1 text-xl font-bold text-(--color-success)">{stats.highest}/{assessment.total_marks}</p>
                    </div>
                    <div className="rounded-lg bg-(--color-paper-dim) p-3">
                      <span className="text-xs font-bold uppercase text-(--color-ink-muted)">Lowest</span>
                      <p className="mt-1 text-xl font-bold text-(--color-danger)">{stats.lowest}/{assessment.total_marks}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-bold text-(--color-ink)">Student Marks</h4>
                    <div className="max-h-48 space-y-1 overflow-y-auto">
                      {classStudents.map((student) => {
                        const studentMark = getStudentMark(student.id, assessment.id);
                        const percentage = studentMark ? Math.round((studentMark / assessment.total_marks) * 100) : 0;
                        return (
                          <div key={student.id} className="flex items-center justify-between rounded border border-(--color-border) bg-(--color-paper) px-3 py-2 text-sm">
                            <span className="font-medium text-(--color-ink)">{student.name}</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max={assessment.total_marks}
                                value={studentMark || ""}
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
