import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, NotebookPen } from "lucide-react";
import { useApp } from "../lib/store";
import { BoardProvider } from "../whiteboard/BoardContext";
import { Board } from "../whiteboard/Board";

export function Whiteboard() {
  const { boardId } = useParams<{ boardId: string }>();
  const { scratchBoards } = useApp();
  const navigate = useNavigate();
  const board = scratchBoards.find((b) => b.id === boardId) ?? scratchBoards[0];

  return (
    <BoardProvider key={board?.id ?? boardId} classGoalWidgetsActive={false}>
      <div className="flex h-screen flex-col">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b-[3px] border-(--color-border) bg-(--color-surface) px-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 rounded-lg border-2 border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm font-bold text-(--color-ink-soft) hover:bg-(--color-paper-dim)"
          >
            <ArrowLeft size={15} />
            Dashboard
          </button>
          <div className="h-6 w-0.5 bg-(--color-line)" />
          <div className="flex items-center gap-2">
            <NotebookPen size={15} className="text-(--color-ink-muted)" />
            <span className="font-display text-base font-bold text-(--color-ink)">{board?.name ?? "Scratch board"}</span>
          </div>
          <span className="ml-auto text-xs font-semibold text-(--color-ink-muted)">
            No class attached. Points, mood, and the goal meter are off.
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <Board />
        </div>
      </div>
    </BoardProvider>
  );
}
