import { useState, useMemo } from "react";
import { useApp } from "../lib/store";
import { Card, Button, Badge, colorTokens } from "../components/ui";
import { Plus, Check, Edit2, Trash2, ChevronDown } from "lucide-react";

interface SyllabusItem {
  id: string;
  classId: string;
  topic: string;
  subtopic?: string;
  status: "pending" | "in-progress" | "completed";
  dateStarted?: string;
  dateCompleted?: string;
  lessonsUsed: string[];
  notes?: string;
}

export function Syllabus() {
  const { classes } = useApp();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(classes[0]?.id || null);
  const [syllabusItems, setSyllabusItems] = useState<SyllabusItem[]>([
    {
      id: "s1",
      classId: "c1",
      topic: "Map Skills",
      subtopic: "Reading and interpreting maps",
      status: "completed",
      dateStarted: "2025-01-06",
      dateCompleted: "2025-01-10",
      lessonsUsed: ["lesson-1", "lesson-2"],
    },
    {
      id: "s2",
      classId: "c1",
      topic: "Geographical Features",
      subtopic: "Mountains, rivers, and plateaus",
      status: "in-progress",
      dateStarted: "2025-01-13",
      lessonsUsed: ["lesson-3"],
    },
    {
      id: "s3",
      classId: "c1",
      topic: "Climate Zones",
      status: "pending",
      lessonsUsed: [],
    },
    {
      id: "s4",
      classId: "c2",
      topic: "Periodic Table",
      status: "completed",
      dateStarted: "2025-01-05",
      dateCompleted: "2025-01-12",
      lessonsUsed: ["lesson-1", "lesson-2", "lesson-3"],
    },
  ]);
  const [newTopic, setNewTopic] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const selectedClass = useMemo(() => classes.find((c) => c.id === selectedClassId), [classes, selectedClassId]);
  const classSyllabusItems = useMemo(
    () => syllabusItems.filter((item) => item.classId === selectedClassId),
    [syllabusItems, selectedClassId]
  );

  const stats = useMemo(() => {
    const completed = classSyllabusItems.filter((item) => item.status === "completed").length;
    const inProgress = classSyllabusItems.filter((item) => item.status === "in-progress").length;
    const pending = classSyllabusItems.filter((item) => item.status === "pending").length;
    const coverage = classSyllabusItems.length > 0 ? Math.round((completed / classSyllabusItems.length) * 100) : 0;
    return { completed, inProgress, pending, coverage };
  }, [classSyllabusItems]);

  const addTopic = () => {
    if (newTopic.trim() && selectedClassId) {
      const newItem: SyllabusItem = {
        id: `s${Date.now()}`,
        classId: selectedClassId,
        topic: newTopic,
        status: "pending",
        lessonsUsed: [],
      };
      setSyllabusItems([...syllabusItems, newItem]);
      setNewTopic("");
    }
  };

  const updateStatus = (itemId: string, newStatus: SyllabusItem["status"]) => {
    setSyllabusItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            status: newStatus,
            dateStarted: newStatus !== "pending" && !item.dateStarted ? new Date().toISOString().split("T")[0] : item.dateStarted,
            dateCompleted: newStatus === "completed" ? new Date().toISOString().split("T")[0] : undefined,
          };
        }
        return item;
      })
    );
  };

  const deleteItem = (itemId: string) => {
    setSyllabusItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  if (!selectedClass) return <div>No classes available</div>;

  const classColor = colorTokens(selectedClass.color);
  const statusColors: Record<SyllabusItem["status"], string> = {
    pending: "bg-(--color-paper-dim) text-(--color-ink-muted)",
    "in-progress": "bg-(--color-orange-100) text-(--color-orange-600)",
    completed: "bg-(--color-success-100) text-(--color-success)",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-(--color-ink)">Syllabus Tracker</h1>
        <p className="mt-1 text-sm text-(--color-ink-muted)">Track curriculum progress and coverage</p>
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
              <span className="text-xs font-bold uppercase text-(--color-ink-muted)">Coverage</span>
              <p className="mt-2 text-2xl font-bold text-(--color-ink)">{stats.coverage}%</p>
            </Card>

            <Card>
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase text-(--color-ink-muted)">
                <Check size={14} className="text-(--color-success)" />
                Completed
              </span>
              <p className="mt-2 text-2xl font-bold text-(--color-ink)">{stats.completed}</p>
            </Card>

            <Card>
              <span className="text-xs font-bold uppercase text-(--color-ink-muted)">In Progress</span>
              <p className="mt-2 text-2xl font-bold text-(--color-orange-600)">{stats.inProgress}</p>
            </Card>

            <Card>
              <span className="text-xs font-bold uppercase text-(--color-ink-muted)">Pending</span>
              <p className="mt-2 text-2xl font-bold text-(--color-ink-muted)">{stats.pending}</p>
            </Card>
          </div>

          <Card>
            <h2 className="font-display text-lg font-bold text-(--color-ink)">Add New Topic</h2>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTopic()}
                placeholder="Enter topic name..."
                className="flex-1 rounded-lg border-2 border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm font-bold placeholder:text-(--color-ink-muted)"
              />
              <Button onClick={addTopic} className="flex items-center gap-1">
                <Plus size={14} />
                Add
              </Button>
            </div>
          </Card>

          <div className="space-y-2">
            {classSyllabusItems.map((item) => (
              <Card key={item.id} className="p-0">
                <div
                  className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-(--color-paper-dim)"
                  onClick={() => toggleExpanded(item.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${expandedItems.has(item.id) ? "rotate-180" : ""}`}
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-(--color-ink)">{item.topic}</h3>
                      {item.subtopic && <p className="text-xs text-(--color-ink-muted)">{item.subtopic}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[item.status]}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                    <button className="rounded-lg border-2 border-(--color-border) bg-(--color-paper) p-1.5 hover:bg-(--color-paper-dim)">
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem(item.id);
                      }}
                      className="rounded-lg border-2 border-(--color-border) bg-(--color-paper) p-1.5 hover:bg-(--color-danger-100)"
                    >
                      <Trash2 size={14} className="text-(--color-danger)" />
                    </button>
                  </div>
                </div>

                {expandedItems.has(item.id) && (
                  <div className="border-t-2 border-(--color-border) space-y-3 px-4 py-3 bg-(--color-paper-dim)">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs font-bold uppercase text-(--color-ink-muted)">Date Started</span>
                        <p className="mt-1 text-sm font-bold text-(--color-ink)">{item.dateStarted || "—"}</p>
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase text-(--color-ink-muted)">Date Completed</span>
                        <p className="mt-1 text-sm font-bold text-(--color-ink)">{item.dateCompleted || "—"}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-bold uppercase text-(--color-ink-muted)">Lessons Used</span>
                      <p className="mt-1 text-sm font-bold text-(--color-ink)">{item.lessonsUsed.length || "None"} lesson(s)</p>
                    </div>

                    <div className="flex gap-2">
                      {item.status !== "completed" && (
                        <>
                          {item.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => updateStatus(item.id, "in-progress")}
                              className="flex-1 bg-(--color-orange-500)"
                            >
                              Start Teaching
                            </Button>
                          )}
                          {item.status === "in-progress" && (
                            <Button
                              size="sm"
                              onClick={() => updateStatus(item.id, "completed")}
                              className="flex-1 bg-(--color-success)"
                            >
                              Mark Complete
                            </Button>
                          )}
                        </>
                      )}
                      {item.status !== "pending" && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(item.id, "pending")}
                          className="flex-1"
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
