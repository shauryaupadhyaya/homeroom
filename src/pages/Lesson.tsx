import { useNavigate, useParams } from "react-router-dom";
import { X, Clock3 } from "lucide-react";
import { useApp } from "../lib/store";
import { BoardProvider, useBoard } from "../whiteboard/BoardContext";
import { widgetLiveValue } from "../whiteboard/widgets";
import { Board } from "../whiteboard/Board";
import { ProgressBar, colorTokens, EmptyState, Button } from "../components/ui";

function LessonTopBar({ classId }: { classId: string }) {
  const { classes } = useApp();
  const navigate = useNavigate();
  const { widgets } = useBoard();
  const cls = classes.find((c) => c.id === classId)!;
  const t = colorTokens(cls.color);
  const runningTimer = widgets.find((w) => w.type === "timer" && (w.config as { running: boolean }).running);

  return (
    <div className="flex h-16 shrink-0 items-center gap-4 border-b-[3px] border-(--color-border) bg-(--color-surface) px-4">
      <button
        onClick={() => navigate("/")}
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

export function Lesson() {
  const { classId } = useParams<{ classId: string }>();
  const { classes } = useApp();
  const navigate = useNavigate();
  const cls = classes.find((c) => c.id === classId);

  if (!cls) {
    return (
      <div className="flex h-screen items-center justify-center bg-(--color-paper) p-8">
        <EmptyState
          title="This class doesn't exist"
          body="It may have been deleted. Head back to the dashboard to start a different lesson."
          action={<Button onClick={() => navigate("/")}>Back to Dashboard</Button>}
        />
      </div>
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
        <LessonTopBar classId={cls.id} />
        <div className="flex-1 overflow-hidden">
          <Board classId={cls.id} />
        </div>
      </div>
    </BoardProvider>
  );
}
