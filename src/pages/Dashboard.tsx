import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from "recharts";
import { Play, SquarePlus, ArrowUpRight, CalendarDays, Clock3, Target } from "lucide-react";
import { useApp } from "../lib/store";
import { Card, Button, Badge, ProgressBar, colorTokens } from "../components/ui";
import { CLASS_COLOR_HEX } from "../lib/colors";
import {
  getLiveOrNextPeriod,
  todaysPeriods,
  isPeriodLive,
  WEEKDAY_LABELS,
  WEEKDAY_SHORT,
  formatTimeRange,
} from "../lib/schedule";

const now = new Date();

export function Dashboard() {
  const { classes, timetable } = useApp();
  const navigate = useNavigate();
  const [view, setView] = useState<"day" | "week">("day");

  const classById = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);
  const status = useMemo(() => getLiveOrNextPeriod(timetable, now), [timetable]);
  const today = useMemo(() => todaysPeriods(timetable, now), [timetable]);

  const chartData = classes.map((c) => ({ name: c.name.split(" ")[0], points: c.points, color: c.color }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
      {/* Left rail */}
      <div className="flex flex-col gap-5">
        <Card className="animate-rise-in relative overflow-hidden" style={{ animationDelay: "0ms" }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-(--color-ink-muted)">
              {status?.state === "live" ? "Live now" : "Up next"}
            </span>
            {status?.state === "live" && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-(--color-danger)">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-(--color-danger)" />
                In session
              </span>
            )}
          </div>

          {status ? (
            <>
              <p className="font-display mt-3 text-3xl font-bold text-(--color-ink)">
                {classById.get(status.period.classId)?.name}
              </p>
              <p className="mt-0.5 text-sm text-(--color-ink-muted)">
                {status.period.subject} · Room {status.period.room}
              </p>

              <div className="mt-4 flex items-center gap-4 text-sm text-(--color-ink-soft)">
                <span className="flex items-center gap-1.5">
                  <Clock3 size={15} />
                  {formatTimeRange(status.period.start, status.period.end)}
                </span>
                {status.daysAway > 0 && (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={15} />
                    {status.daysAway === 1 ? "Tomorrow" : WEEKDAY_LABELS[status.period.weekday]}
                  </span>
                )}
              </div>

              <Button
                size="lg"
                className="mt-5 w-full"
                onClick={() => navigate(`/lesson/${status.period.classId}`)}
              >
                <Play size={16} fill="currentColor" />
                Start Lesson
              </Button>
            </>
          ) : (
            <p className="mt-4 text-sm text-(--color-ink-muted)">
              No periods scheduled. Upload a timetable in Settings to get started.
            </p>
          )}
        </Card>

        {status && (
          <Card
            hoverLift
            onClick={() => navigate(`/lesson/${status.period.classId}`)}
            className="animate-rise-in cursor-pointer"
            style={{ animationDelay: "80ms" }}
          >
            {(() => {
              const cls = classById.get(status.period.classId);
              if (!cls) return null;
              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-(--color-ink-muted)">
                      <Target size={13} /> Class goal
                    </span>
                    <span className="font-display text-sm font-bold text-(--color-ink)">{cls.name}</span>
                  </div>
                  <ProgressBar value={cls.points} max={cls.goal} color={cls.color} className="mt-3" />
                  <p className="mt-2 text-sm font-bold text-(--color-ink)">
                    {cls.points} <span className="font-medium text-(--color-ink-muted)">/ {cls.goal} pts</span>
                  </p>
                </>
              );
            })()}
          </Card>
        )}

        <Button
          variant="secondary"
          size="lg"
          className="animate-rise-in w-full"
          style={{ animationDelay: "160ms" }}
          onClick={() => navigate("/whiteboard/scratch")}
        >
          <SquarePlus size={17} />
          New Whiteboard
        </Button>

        <Card className="animate-rise-in group" style={{ animationDelay: "240ms" }} onClick={() => navigate("/analytics")}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-(--color-ink-muted)">
              Class points
            </span>
            <ArrowUpRight
              size={15}
              className="text-(--color-ink-muted) transition-colors group-hover:text-(--color-orange-500)"
            />
          </div>
          <div className="mt-3 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#8c8374" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(36,31,26,0.04)" }}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e6ddc9",
                    fontSize: 12,
                    boxShadow: "0 8px 24px -12px rgba(36,31,26,0.25)",
                  }}
                />
                <Bar dataKey="points" radius={[5, 5, 0, 0]} maxBarSize={28}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={CLASS_COLOR_HEX[d.color as keyof typeof CLASS_COLOR_HEX]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Main timetable panel */}
      <Card padded={false} className="animate-rise-in overflow-hidden" style={{ animationDelay: "40ms" }}>
        <div className="flex items-center justify-between border-b-[3px] border-(--color-border) px-5 py-4">
          <h1 className="font-display text-2xl font-bold text-(--color-ink)">TIMETABLE</h1>
          <div className="flex rounded-lg border-2 border-(--color-border) bg-(--color-paper-dim) p-1">
            {(["day", "week"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`nav-hover rounded-md px-3.5 py-1.5 text-sm font-bold capitalize ${
                  view === v ? "bg-(--color-surface) text-(--color-ink) shadow-pill" : "text-(--color-ink-muted)"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {view === "day" ? (
          <DayView
            periods={today}
            classById={classById}
            onStart={(id) => navigate(`/lesson/${id}`)}
          />
        ) : (
          <WeekView timetable={timetable} classById={classById} onStart={(id) => navigate(`/lesson/${id}`)} />
        )}
      </Card>
    </div>
  );
}

function DayView({
  periods,
  classById,
  onStart,
}: {
  periods: ReturnType<typeof todaysPeriods>;
  classById: Map<string, ReturnType<typeof useApp>["classes"][number]>;
  onStart: (classId: string) => void;
}) {
  if (periods.length === 0) {
    return (
      <div className="px-5 py-16 text-center">
        <p className="font-display text-lg font-semibold text-(--color-ink)">No lessons today</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-(--color-ink-muted)">
          {WEEKDAY_LABELS[new Date().getDay()] ?? "Today"} is free on your timetable. Switch to Week
          view to see what's coming up.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y-2 divide-(--color-line)">
      {periods.map((p) => {
        const cls = classById.get(p.classId);
        const live = isPeriodLive(p, now);
        const t = colorTokens(cls?.color ?? "orange");
        return (
          <li
            key={p.id}
            className={`flex items-center gap-4 px-5 py-4 transition-colors ${live ? t.soft : "hover:bg-(--color-paper-dim)"}`}
          >
            <div className="w-28 shrink-0 text-sm font-medium text-(--color-ink-soft)">
              {formatTimeRange(p.start, p.end)}
            </div>
            <div className={`h-9 w-1 shrink-0 rounded-full ${t.solid}`} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-(--color-ink)">{cls?.name}</p>
              <p className="text-xs text-(--color-ink-muted)">
                {p.subject} · Room {p.room}
              </p>
            </div>
            {live && <Badge color={cls?.color}>Live now</Badge>}
            <Button size="sm" variant={live ? "primary" : "secondary"} onClick={() => onStart(p.classId)}>
              <Play size={13} fill="currentColor" />
              Start
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

function WeekView({
  timetable,
  classById,
  onStart,
}: {
  timetable: ReturnType<typeof useApp>["timetable"];
  classById: Map<string, ReturnType<typeof useApp>["classes"][number]>;
  onStart: (classId: string) => void;
}) {
  const slots = Array.from(new Set(timetable.map((p) => p.start))).sort();
  const days = [1, 2, 3, 4, 5] as const;

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[720px] grid-cols-[72px_repeat(5,1fr)]">
        <div />
        {days.map((d) => (
          <div
            key={d}
            className="border-b border-l border-(--color-line) px-3 py-3 text-center text-sm font-semibold text-(--color-ink)"
          >
            {WEEKDAY_SHORT[d]}
          </div>
        ))}

        {slots.map((slot) => (
          <FragmentRow key={slot} slot={slot} days={days} timetable={timetable} classById={classById} onStart={onStart} />
        ))}
      </div>
    </div>
  );
}

function FragmentRow({
  slot,
  days,
  timetable,
  classById,
  onStart,
}: {
  slot: string;
  days: readonly number[];
  timetable: ReturnType<typeof useApp>["timetable"];
  classById: Map<string, ReturnType<typeof useApp>["classes"][number]>;
  onStart: (classId: string) => void;
}) {
  return (
    <>
      <div className="border-b border-(--color-line) px-2 py-3 text-right text-xs font-medium text-(--color-ink-muted)">
        {slot}
      </div>
      {days.map((d) => {
        const period = timetable.find((p) => p.weekday === d && p.start === slot);
        if (!period) return <div key={d} className="border-b border-l border-(--color-line) p-1.5" />;
        const cls = classById.get(period.classId);
        const t = colorTokens(cls?.color ?? "orange");
        const live = isPeriodLive(period, now);
        return (
          <div key={d} className="border-b border-l border-(--color-line) p-1.5">
            <button
              onClick={() => onStart(period.classId)}
              className={`w-full rounded-lg border-2 px-2.5 py-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-hard-sm ${t.soft} ${
                live ? "border-(--color-border) shadow-hard-sm" : "border-transparent"
              }`}
            >
              <p className="truncate text-xs font-semibold text-(--color-ink)">{cls?.name}</p>
              <p className="truncate text-[11px] text-(--color-ink-muted)">{period.subject}</p>
            </button>
          </div>
        );
      })}
    </>
  );
}
