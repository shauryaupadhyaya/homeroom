import { useMemo, useState, type ElementType } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import { Trophy, Smile, TrendingUp, TrendingDown, Wind, Crown, Medal, Flame, Minus } from "lucide-react";
import { useApp } from "../lib/store";
import { Card, Avatar, StatTile, colorTokens, type BrandColor } from "../components/ui";
import { CLASS_COLOR_HEX } from "../lib/colors";

const noiseByClass: Record<string, number> = {
  c1: 38, c2: 44, c3: 33, c4: 52, c5: 29, c6: 41, c7: 31, c8: 27, c9: 36,
};

type Period = "week" | "month" | "all";

const RANK_STYLE: { bg: string; text: string }[] = [
  { bg: "bg-(--color-orange-500)", text: "text-(--color-ink-on-accent)" },
  { bg: "bg-(--color-pink-500)", text: "text-(--color-ink-on-accent)" },
  { bg: "bg-(--color-purple-500)", text: "text-(--color-ink-on-accent)" },
];

function rankStyle(i: number) {
  return RANK_STYLE[i] ?? { bg: "bg-(--color-surface)", text: "text-(--color-ink)" };
}

function ChangeBadge({ value, onAccent = false }: { value: number; onAccent?: boolean }) {
  if (value === 0) {
    return (
      <span className={`flex items-center gap-1 text-xs font-bold ${onAccent ? "text-(--color-ink-on-accent)" : "text-(--color-ink-muted)"}`}>
        <Minus size={12} /> 0
      </span>
    );
  }
  const up = value > 0;
  const color = onAccent
    ? up
      ? "text-white"
      : "text-(--color-ink-on-accent)"
    : up
      ? "text-(--color-lime-600)"
      : "text-(--color-danger)";
  return (
    <span className={`flex items-center gap-1 text-xs font-bold ${color}`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {up ? "+" : ""}
      {value}
    </span>
  );
}

export function Analytics() {
  const { classes, students, classHistory } = useApp();
  const [grade, setGrade] = useState<number | "all">("all");
  const [classId, setClassId] = useState<string | "all">("all");
  const [period, setPeriod] = useState<Period>("week");

  const grades = useMemo(() => Array.from(new Set(classes.map((c) => c.grade))).sort((a, b) => b - a), [classes]);

  const filteredClasses = useMemo(
    () => classes.filter((c) => (grade === "all" || c.grade === grade) && (classId === "all" || c.id === classId)),
    [classes, grade, classId]
  );
  const filteredClassIds = useMemo(() => new Set(filteredClasses.map((c) => c.id)), [filteredClasses]);
  const filteredStudents = useMemo(
    () => students.filter((s) => filteredClassIds.has(s.classId)),
    [students, filteredClassIds]
  );
  const classById = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);
  const periodScale = period === "week" ? 1 : period === "month" ? 3.4 : 6.2;

  const rankedClasses = useMemo(() => {
    return [...filteredClasses]
      .map((c) => {
        const roster = students.filter((s) => s.classId === c.id);
        const hist = classHistory[c.id];
        const windowSize = period === "week" ? 1 : period === "month" ? 4 : hist.length - 1;
        const startIdx = Math.max(0, hist.length - 1 - windowSize);
        const improvement = hist[hist.length - 1].points - hist[startIdx].points;
        return {
          cls: c,
          avg: roster.length ? Math.round(c.points / roster.length) : 0,
          improvement,
        };
      })
      .sort((a, b) => b.cls.points - a.cls.points);
  }, [filteredClasses, students, classHistory, period]);

  const rankedStudents = useMemo(
    () =>
      [...filteredStudents]
        .map((s) => ({ ...s, scaledChange: Math.round(s.weeklyChange * periodScale) }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 12),
    [filteredStudents, periodScale]
  );

  const mostImprovedStudent = useMemo(
    () => [...filteredStudents].sort((a, b) => b.weeklyChange - a.weeklyChange)[0],
    [filteredStudents]
  );

  const weeks = classHistory[filteredClasses[0]?.id ?? classes[0].id].map((p) => p.week);
  const pointsSeries = weeks.map((week, i) => {
    const row: Record<string, string | number> = { week };
    filteredClasses.forEach((c) => {
      row[c.id] = classHistory[c.id][i].points;
    });
    return row;
  });

  const happinessSeries = weeks.map((week, i) => {
    const src = filteredClasses.length ? filteredClasses : classes;
    const entryAvg = src.reduce((sum, c) => sum + classHistory[c.id][i].avgEntry, 0) / src.length;
    const exitAvg = src.reduce((sum, c) => sum + classHistory[c.id][i].avgExit, 0) / src.length;
    return { week, entry: Math.round(entryAvg * 100) / 100, exit: Math.round(exitAvg * 100) / 100 };
  });

  const happinessSrc = filteredClasses.length ? filteredClasses : classes;
  const happiness = happinessSrc.map((c) => {
    const hist = classHistory[c.id];
    const latest = hist[hist.length - 1];
    const first = hist[0];
    return {
      cls: c,
      index: Math.round((latest.avgExit / 5) * 100),
      lift: Math.round((latest.avgExit - latest.avgEntry) * 100) / 100,
      improvement: Math.round((latest.avgExit - first.avgExit) * 100) / 100,
      pctHappier: Math.round(55 + (latest.avgExit - latest.avgEntry) * 20),
      noise: noiseByClass[c.id] ?? 40,
    };
  });

  const happiest = [...happiness].sort((a, b) => b.index - a.index)[0];
  const mostImproved = [...happiness].sort((a, b) => b.improvement - a.improvement)[0];
  const overallLift = Math.round((happiness.reduce((s, h) => s + h.lift, 0) / happiness.length) * 100) / 100;
  const overallPctHappier = Math.round(happiness.reduce((s, h) => s + h.pctHappier, 0) / happiness.length);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-(--color-ink)">ANALYTICS</h1>
          <p className="mt-1 text-sm font-medium text-(--color-ink-muted)">
            How the room is scoring, and how the room is feeling, side by side.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="rounded-lg border-2 border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm font-bold text-(--color-ink) outline-none"
          >
            <option value="all">All grades</option>
            {grades.map((g) => (
              <option key={g} value={g}>
                Year {g}
              </option>
            ))}
          </select>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="rounded-lg border-2 border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm font-bold text-(--color-ink) outline-none"
          >
            <option value="all">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="flex rounded-lg border-2 border-(--color-border) bg-(--color-paper-dim) p-1">
            {(["week", "month", "all"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`nav-hover rounded-md px-3 py-1.5 text-xs font-bold capitalize ${
                  period === p ? "bg-(--color-surface) text-(--color-ink) shadow-pill" : "text-(--color-ink-muted)"
                }`}
              >
                {p === "all" ? "All time" : `This ${p}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Class leaderboard */}
        <Card padded={false}>
          <div className="p-5 pb-0">
            <SectionHeader icon={Trophy} title="Class leaderboard" sub="Ranked by total points earned" />
          </div>
          <ul className="mt-4 flex flex-col gap-2 p-5 pt-0">
            {rankedClasses.map((r, i) => {
              const rs = rankStyle(i);
              return (
                <li
                  key={r.cls.id}
                  className={`flex items-center gap-3 rounded-xl border-2 border-(--color-border) px-3.5 py-3 ${rs.bg} ${
                    i > 2 ? "shadow-hard-sm" : "shadow-hard"
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-(--color-border) bg-(--color-surface) text-xs font-bold text-(--color-ink)">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-display text-base font-bold ${rs.text}`}>{r.cls.name}</span>
                      <span className={`text-[10px] font-bold uppercase opacity-70 ${rs.text}`}>Yr {r.cls.grade}</span>
                    </div>
                    <p className={`text-xs font-semibold opacity-80 ${rs.text}`}>{r.avg} pts / student avg</p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className={`font-display text-lg font-bold ${rs.text}`}>{r.cls.points}</span>
                    <ChangeBadge value={r.improvement} onAccent={i < 3} />
                  </div>
                </li>
              );
            })}
            {rankedClasses.length === 0 && <EmptyRow text="No classes match this filter." />}
          </ul>
        </Card>

        {/* Student leaderboard */}
        <Card padded={false}>
          <div className="p-5 pb-0">
            <SectionHeader icon={Medal} title="Student leaderboard" sub="Top scorers across every class" />
          </div>
          <ul className="mt-4 flex max-h-[420px] flex-col gap-2 overflow-y-auto p-5 pt-0 scrollbar-thin">
            {rankedStudents.map((s, i) => {
              const cls = classById.get(s.classId);
              const rs = rankStyle(i);
              return (
                <li
                  key={s.id}
                  className={`flex items-center gap-3 rounded-xl border-2 border-(--color-border) px-3.5 py-2.5 ${rs.bg} ${
                    i > 2 ? "shadow-hard-sm" : "shadow-hard"
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-(--color-border) bg-(--color-surface) text-[11px] font-bold text-(--color-ink)">
                    {i + 1}
                  </span>
                  <Avatar name={s.name} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-bold ${rs.text}`}>{s.name}</p>
                    <p className={`truncate text-xs font-semibold opacity-75 ${rs.text}`}>{cls?.name}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-(--color-orange-600)" title="Streak">
                    <Flame size={12} className={rs.text} />
                    <span className={rs.text}>{s.streak}</span>
                  </span>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className={`text-sm font-bold ${rs.text}`}>{s.points} pts</span>
                    <ChangeBadge value={s.scaledChange} onAccent={i < 3} />
                  </div>
                </li>
              );
            })}
            {rankedStudents.length === 0 && <EmptyRow text="No students match this filter." />}
          </ul>
        </Card>

        {/* Points over time - Kaizen */}
        <Card className="lg:col-span-2">
          <SectionHeader icon={TrendingUp} title="Points over time" sub="Weekly totals per class: the Kaizen view" />
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {filteredClasses.map((c) => (
              <span key={c.id} className="flex items-center gap-1.5 text-xs font-bold text-(--color-ink-soft)">
                <span className="h-2.5 w-2.5 rounded-full border border-(--color-border)" style={{ background: CLASS_COLOR_HEX[c.color] }} />
                {c.name}
              </span>
            ))}
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pointsSeries} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="#e6ddc9" strokeDasharray="0" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#8c8374" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#8c8374" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "2px solid #17140f", fontSize: 12 }}
                  labelStyle={{ fontWeight: 700, color: "#17140f" }}
                />
                {filteredClasses.map((c) => (
                  <Line
                    key={c.id}
                    type="monotone"
                    dataKey={c.id}
                    name={c.name}
                    stroke={CLASS_COLOR_HEX[c.color]}
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Happiness Index panel */}
        <Card className="lg:col-span-2">
          <SectionHeader icon={Smile} title="Happiness Index" sub="The wellbeing counterpart to the leaderboards: Resilience" />

          <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <StatTile label="Avg happiness index" value={`${Math.round(happiness.reduce((s, h) => s + h.index, 0) / happiness.length)}`} sub="out of 100" color="sky" />
            <StatTile label="Mood lift" value={`+${overallLift}`} sub="exit vs entry, avg" color="sky" />
            <StatTile label="Left happier" value={`${overallPctHappier}%`} sub="of students, avg" color="lime" />
            <StatTile
              label="Happiest class"
              value={happiest.cls.name}
              sub={`index ${happiest.index}`}
              color={happiest.cls.color}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-(--color-ink-muted)">
                Happiness over time: entry vs exit
              </p>
              <div className="mt-3 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={happinessSeries} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke="#e6ddc9" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#8c8374" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: "#8c8374" }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: "2px solid #17140f", fontSize: 12 }} />
                    <Line type="monotone" dataKey="entry" name="Entry mood" stroke="#8c8374" strokeWidth={2} strokeDasharray="4 3" dot={false} />
                    <Line type="monotone" dataKey="exit" name="Exit mood" stroke="#2e9bcf" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex gap-4 text-xs font-semibold text-(--color-ink-muted)">
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 bg-(--color-ink-muted)" /> Entry mood</span>
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 bg-(--color-sky-500)" /> Exit mood</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-(--color-ink-muted)">
                <Crown size={13} /> Most improved
              </div>
              <ul className="mt-3 flex flex-col gap-2">
                <ImprovedRow label="Happiest class" name={happiest.cls.name} value={`${happiest.index}/100`} color={happiest.cls.color} />
                <ImprovedRow label="Most improved class" name={mostImproved.cls.name} value={`+${mostImproved.improvement}`} color={mostImproved.cls.color} />
                {mostImprovedStudent && (
                  <ImprovedRow
                    label="Most improved student"
                    name={mostImprovedStudent.name}
                    value={`+${mostImprovedStudent.weeklyChange}`}
                    color={classById.get(mostImprovedStudent.classId)?.color ?? "orange"}
                  />
                )}
              </ul>

              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-(--color-ink-muted)">
                <Wind size={13} /> Mood vs calm (stretch)
              </div>
              <div className="mt-2 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="#e6ddc9" />
                    <XAxis
                      dataKey="noise"
                      name="Avg noise"
                      unit="dB"
                      tick={{ fontSize: 10, fill: "#8c8374" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="index"
                      name="Happiness"
                      domain={[50, 100]}
                      tick={{ fontSize: 10, fill: "#8c8374" }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <ZAxis range={[80, 80]} />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      contentStyle={{ borderRadius: 10, border: "2px solid #17140f", fontSize: 11 }}
                    />
                    <Scatter data={happiness} fill="#2e9bcf">
                      {happiness.map((h) => (
                        <Scatter key={h.cls.id} data={[h]} fill={CLASS_COLOR_HEX[h.cls.color]} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-1 text-[11px] font-medium leading-snug text-(--color-ink-muted)">
                Calmer classes trend happier in this dataset. That is a correlation, not proof that calm causes it.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ImprovedRow({ label, name, value, color }: { label: string; name: string; value: string; color: BrandColor }) {
  const t = colorTokens(color);
  return (
    <li className={`rounded-xl border-2 border-(--color-border) px-3.5 py-3 ${t.soft}`}>
      <p className="text-xs font-bold text-(--color-ink-muted)">{label}</p>
      <div className="mt-0.5 flex items-baseline justify-between gap-2">
        <span className="truncate text-sm font-bold text-(--color-ink)">{name}</span>
        <span className={`shrink-0 text-sm font-bold ${t.text}`}>{value}</span>
      </div>
    </li>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <li className="rounded-xl border-2 border-dashed border-(--color-border) px-3.5 py-6 text-center text-sm font-semibold text-(--color-ink-muted)">{text}</li>;
}

function SectionHeader({
  icon: Icon,
  title,
  sub,
}: {
  icon: ElementType;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-(--color-border) bg-(--color-paper-dim) text-(--color-ink-soft)">
        <Icon size={16} />
      </div>
      <div>
        <h2 className="font-display text-base font-bold text-(--color-ink)">{title}</h2>
        <p className="text-xs font-semibold text-(--color-ink-muted)">{sub}</p>
      </div>
    </div>
  );
}
