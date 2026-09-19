# Homeroom

Homeroom is a classroom whiteboard app for teachers. A teacher signs in, sees their timetable, starts a
lesson, and gets an infinite whiteboard they can draw on and drop interactive widgets onto (noise
monitor, timer, student picker, group generator, and more). A point system lets teachers reward
students and whole classes, a wellbeing layer lets students log how they feel at the start and end of
a lesson, and an analytics area rolls all of it up into trends over time.

Three ideas run through the whole product:

- **AI** — the timetable is created by uploading a screenshot; an AI extracts the periods automatically.
- **Resilience / wellbeing** — entry and exit mood check-ins per student, tracked over time.
- **Kaizen / continuous improvement** — class goals and "over time" analytics that visibly trend upward.

> **Status**: this build is the frontend and product-design layer of Homeroom. It runs entirely on
> mock/in-memory data with a fully working UI, real device features (microphone, canvas drawing,
> file uploads), and every screen in the spec implemented. There is no backend yet — see
> [How the backend will work](#how-the-backend-will-work) for the Supabase architecture this frontend
> is built to plug into.

---

## Tech stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 19 (SPA) | View-based routing via `react-router-dom`, no server rendering |
| Build tool | Vite 8 | Dev server + production bundling |
| Language | TypeScript | Strict mode, project-referenced build (`tsc -b`) |
| Styling | Tailwind CSS v4 | CSS-variable-driven design tokens (see [Design system](#design-system)) |
| Charts | Recharts | Leaderboards, points-over-time, happiness trends |
| Icons | lucide-react | — |
| Drawing | HTML5 `<canvas>` 2D context | Pen/ink layer on the whiteboard |
| Audio | Web Audio API (`getUserMedia` + `AnalyserNode`) | Live noise monitoring from the mic |
| State | React Context (`AppProvider`, `BoardProvider`) | No external state library |
| Planned backend | Supabase (Postgres + Auth + Storage) | Not yet wired up — see below |

There is no separate backend server today. All "persistence" currently lives in React state
(`src/lib/store.tsx` for app-wide data, `src/whiteboard/BoardContext.tsx` for whiteboard/widget state),
seeded from `src/lib/mockData.ts`. Refreshing the page resets everything.

---

## Getting started

```bash
npm install
npm run dev      # starts the Vite dev server
npm run build     # type-checks (tsc -b) then produces a production build
npm run preview   # serves the production build locally
```

---

## Architecture overview

Homeroom is a single-page app with **view-based routing**, not file-based routing — every "page" is a
component rendered by `react-router-dom` inside `src/App.tsx`:

- `/login` — `Login.tsx`, unauthenticated
- `/` — `Dashboard.tsx`
- `/analytics` — `Analytics.tsx`
- `/settings` — `Settings.tsx`
- `/lesson/:classId` — `Lesson.tsx`, full-screen whiteboard tied to a class
- `/whiteboard/:boardId` — `Whiteboard.tsx`, full-screen scratch whiteboard, no class attached

`/`, `/analytics`, and `/settings` render inside `AppLayout`, which adds the persistent `TopBar` and a
short fade/rise `page-transition` animation on route change. `/lesson/*` and `/whiteboard/*` render
full-screen with no top bar, since the whiteboard needs the entire viewport.

Two React Contexts hold all app state:

- **`AppProvider`** (`src/lib/store.tsx`) — the teacher, classes, students, timetable, class history,
  theme, and scratch boards. Every page reads from this via the `useApp()` hook.
- **`BoardProvider`** (`src/whiteboard/BoardContext.tsx`) — one instance per whiteboard (`Lesson` and
  `Whiteboard` each mount their own, keyed so switching classes resets it). Holds widgets, pen state,
  zoom/pan, ink strokes, and the background layer for *that specific board*.

---

## Features and how they work

### Authentication (mock)

`Login.tsx` has working sign-in/sign-up tabs, an email/password form with validation and inline error
states, a show/hide password toggle, and a "Forgot password" link. Submitting calls `login()` from
`AppProvider`, which just flips an `isAuthed` boolean — no real account is created or verified. This is
the piece [the Supabase plan](#authentication) replaces first.

### Dashboard

`Dashboard.tsx` computes the **live or next period** by comparing `timetable` entries against the real
system clock (`src/lib/schedule.ts`), and shows it in a "Start Lesson" card with a pulsing "Live now"
indicator when a class is actually in session right now. Below it, a **Class Goal** card shows that
same class's point progress. A **Day / Week** toggle switches the main panel between a scrollable list
of today's periods and a 5-day grid — both read the same `timetable` array, just rendered differently.
Clicking any period or the Start Lesson button navigates to `/lesson/:classId`.

### Timetable upload (AI, simulated)

In Settings → Timetable upload, uploading an image triggers a fake "analyzing" delay
(`setTimeout`) and then shows a pre-filled, **editable review grid** — every cell is a plain input, and
a banner flags a period whose class name doesn't match an existing class, offering to create it. This
UI is fully built to spec ("AI drafts it, you confirm"), but the actual AI vision call is not wired up:
there's no server to send the image to yet, so the extracted rows are hardcoded rather than real
model output. [The backend plan](#ai-timetable-extraction) below covers what that call needs to look
like.

### The whiteboard engine

`src/whiteboard/Board.tsx` renders an infinite, zoomable, pannable board as three layers inside one
transformed viewport (`translate(pan) scale(zoom)`):

1. **Background layer** — dot-grid, a plain color, or an uploaded image (with an optional readability
   overlay), independent of the ink layer.
2. **Widget layer** — absolutely positioned widget cards, each with an explicit `zIndex` so the
   most-recently-selected widget always renders on top of the others (not just DOM order).
3. **Ink layer** — an HTML5 `<canvas>`, active only in pen mode. Pointer coordinates are converted from
   screen space to canvas space using `getBoundingClientRect()`, so strokes land exactly under the pen
   regardless of current zoom.

**Cursor / Pen toggle** — in cursor mode widgets are draggable and clickable; in pen mode the canvas
captures pointer events instead and all open widgets **auto-minimize** to the sidebar dock (their
state keeps running — a timer keeps counting — because minimized widgets stay mounted in the widgets
array, only their board position is hidden). Tapping a docked widget restores it and switches back to
cursor mode.

**Pen tools** — thickness (4 presets + a slider), line style (solid/dashed/dotted via
`ctx.setLineDash`), color, an eraser (draws with `globalCompositeOperation: "destination-out"`), and
undo/redo (a `strokes` array plus a `redoStack`, both in `BoardContext`).

**Widgets** are draggable (pointer events on the title bar), resizable (a corner drag-handle), and
selectable (clicking one calls `bringToFront()`, which bumps a monotonically increasing z-index
counter). Creating or deleting a widget plays a scale/fade animation before it's actually removed from
state, so nothing pops in or out instantly.

**Zoom/pan** — `+`/`-`/Fit buttons, `Ctrl`/`Cmd`+scroll, and space-drag panning, clamped to 0.4×–2.5×.

### Widget catalogue

All widgets share a `WidgetShell` chrome (draggable title bar, minimize, close) and are fully opaque
(solid background, thick border, hard offset shadow — see [Design system](#design-system)).

- **Noise monitor** — the most complex widget. Requests the microphone with `noiseSuppression`,
  `echoCancellation`, and `autoGainControl` all explicitly disabled (the browser's default voice-call
  processing actively suppresses ambient noise, which would defeat the point of a noise *meter*). Runs
  an `AnalyserNode` in a `requestAnimationFrame` loop, computing an approximate SPL value as
  `94 + 20·log10(rms)` (the standard 0 dBFS ≈ 94 dB SPL convention used by browser-based sound meters),
  smoothed with fast-attack/slow-decay (jumps up instantly, eases back down) to match how real meters
  feel. Tracks a true cumulative average and running max, classifies the room into both a short status
  badge and a longer real-world reference ("Conversation, busy road"), and draws its own live graph
  directly on a `<canvas>` (not a charting library, for smooth 60fps updates) with gridlines and a
  threshold reference line. Crossing the configurable threshold (with hysteresis — it won't re-fire
  until the level drops back below the threshold, plus a 5-second cooldown) plays a synthesized beep
  (an oscillator + gain envelope, since there's no audio asset to ship), flashes the *entire* widget
  card red for a few seconds (a translucent overlay so it respects light/dark theme automatically), and
  increments a warning counter. Staying calm for a sustained stretch quietly auto-awards the class a
  couple of points, tying the widget back into the Kaizen point system.
- **Timer / Stopwatch / Clock** — large, glanceable numbers meant to be readable from across a room.
  The timer has quick presets and pulses red at zero.
- **Student list** — the class roster with per-student point buttons, inline rename/add, and the
  entry/exit mood smiley scale (Section on [Mood check-ins](#mood--wellbeing) below) all in one widget.
- **Random picker** — picks from students who haven't been picked yet in the current pool ("Still to
  go" vs. "Picked" — deliberately never shows a count), with a reset to re-pool everyone. In scratch
  mode (no class attached) it falls back to a generic name list.
- **Group generator** — splits the roster by group size or by number of groups, rendering each group
  as its own colored card.
- **Image widget** — upload an image (via `URL.createObjectURL`, no server round-trip today) and place
  it on the board.

### Points & Kaizen

Awarding a student updates both that student's total and their class's total (`awardStudentPoints` in
`AppProvider`). The class's **goal meter** (a `ProgressBar` colored to that class's accent) appears on
the Lesson top bar and the Dashboard's Class Goal card, animating smoothly on every change. Weekly
snapshots (`classHistory` in the mock data) power the "Points over time" trend chart in Analytics —
this is the data that would come from the `class_history` table once the backend exists.

### Mood & wellbeing

Every row in the student-list widget has an entry and an exit mood, captured as a 5-point smiley scale
(😞 → 😄). This feeds the **Happiness Index** panel in Analytics: an aggregate happiness score, the
"mood lift" (exit − entry), the percentage of students who left happier than they arrived, an
entry-vs-exit trend line, and — as an explicit stretch feature from the original spec — a scatter plot
correlating each class's happiness against its average recorded noise level, captioned to make clear
it shows correlation, not causation.

### Analytics

Class and student **leaderboards** are rendered as ranking cards (not a table), with the top 3 given a
distinct solid color treatment (1st orange, 2nd pink, 3rd purple) and the rest neutral. Both boards
support filtering by grade, by class, and by time period (week/month/all-time, which changes the
window used to compute the "improvement" figure from `classHistory`). Each student row shows a streak
count and a point-change indicator; each class row shows points-per-student average and improvement.
A multi-line "Points over time" chart and the Happiness Index panel (above) round out the page.

### Settings

Four tabs: Timetable upload (above), Class & student management (kept in sync with the same data the
student-list widget reads/writes), Class goals (editable per class, drives the goal meters everywhere
else), and Profile & preferences (teacher name, week-start day, default goal, clock format, and the
dark-mode toggle).

### Dark mode

`AppProvider` stores a `theme` value (`"light" | "dark"`), persisted to `localStorage` and applied by
setting `data-theme` on `<html>`. Every color in the app is a CSS custom property (`--color-*`) defined
once for light mode and overridden under `[data-theme="dark"]` in `src/index.css` — components never
branch on theme in JS, they just reference the token and the CSS variable resolves differently.

---

## Design system

The visual language is intentionally "neo-brutalist classroom": warm cream surfaces, thick black
borders, hard offset shadows (no blur — `box-shadow: 5px 6px 0 0 var(--color-shadow)`), bold
typography (Space Grotesk for headings, Inter for body), and five bright accent colors (orange, lime,
sky, pink, purple) assigned per-class for identity and reused semantically elsewhere (orange = primary
action, lime = positive, top-3 leaderboard colors, etc).

A couple of implementation details worth knowing if you're editing styles:

- **CSS variables must be referenced with Tailwind's parentheses syntax**, e.g. `bg-(--color-paper)`,
  *not* square brackets (`bg-[--color-paper]`). The bracket form compiles to a literal, invalid
  `background-color: --color-paper` in Tailwind v4 — it silently produces no visible color at all. This
  bit the whole app once already; every color-token class in the codebase uses the parentheses form.
- Interactive press/hover physics live in two reusable CSS classes, not scattered Tailwind
  `hover:`/`active:` utilities: `.press-hard` (buttons — lifts 2px and scales up slightly on hover,
  slams down on press) and `.card-hover` (clickable cards — a gentler 3px lift). Keeping them in one
  place avoids the two states fighting each other via CSS cascade order.
- Small, tightly-scrolled toggle chips (Cursor/Pen, Day/Week, Analytics' time-period filter) use
  `.shadow-pill` — a small *even* shadow on all four sides — instead of the large directional
  `shadow-hard`, which gets visually clipped inside a scrolling or narrow container.

---

## Data model (current mock shape)

`src/lib/types.ts` defines the shapes below; `src/lib/mockData.ts` seeds them with nine classes
(10A/10B/9A/9B/8A/8B/7A/7B/7C) and a roster of students.

```ts
Teacher       { id, name, email, weekStartDay, defaultGoal, clockFormat }
SchoolClass   { id, name, grade, subject, color, goal, points }
Student       { id, classId, name, points, streak, weeklyChange }
TimetablePeriod { id, weekday, start, end, subject, classId, room }
ClassHistoryPoint { week, points, avgEntry, avgExit }
WidgetInstance { id, type, x, y, w, h, zIndex, minimized, config }
```

This maps directly onto the Postgres schema below — the migration to a real backend is mostly a matter
of replacing the `useState` calls in `AppProvider`/`BoardProvider` with Supabase queries that return
the same shapes.

---

## How the backend will work

The frontend is deliberately built with no server of its own — Supabase is meant to provide
**Postgres, Auth, and Storage in one**, called directly from the client via `supabase-js`. Nothing
below is wired up yet; this is the plan the current data model was designed against.

### Authentication

Supabase Auth (email + password). Sign-up, sign-in, sign-out, and password reset all map onto
Supabase's built-in flows — `Login.tsx`'s form already has the right fields and validation, it just
needs its `login()`/`signup()` calls pointed at `supabase.auth.signInWithPassword()` /
`supabase.auth.signUp()` instead of `AppProvider`'s mock `login()`. On sign-in, the app would hydrate
`AppProvider`'s state from Supabase queries instead of `mockData.ts`.

### Database schema

Every table is owned by a teacher and protected by row-level security:

| Table | Key columns |
|---|---|
| `teachers` | `id` (= auth user id), `name`, `email`, `settings jsonb` |
| `classes` | `id`, `teacher_id`, `name`, `goal`, `points` |
| `students` | `id`, `class_id`, `name`, `points` |
| `class_history` | `id`, `class_id`, `week`, `points`, `avg_entry`, `avg_exit` |
| `timetable` | `id`, `teacher_id`, `weekday`, `start`, `end`, `subject`, `class_id` |
| `lesson_sessions` | `id`, `class_id`, `date`, `started_at`, `points_awarded` |
| `mood_checkins` | `id`, `session_id`, `student_id`, `entry`, `exit` |
| `boards` | `id`, `teacher_id`, `class_id` (nullable = scratch board), `widgets jsonb`, `ink_url`, `bg_url`, `zoom`, `pan_x`, `pan_y` |

**Row-level security is mandatory, not optional hardening.** Every table's policy ties rows to the
signed-in teacher (`teacher_id = auth.uid()`, or via a join to `classes`/`lesson_sessions` for the
child tables), so no teacher can ever read or write another teacher's data — enforced by Postgres
itself, not by the frontend remembering to filter correctly.

### State & data flow

On login, the app would fetch that teacher's classes, students, timetable, and recent history in one
batch and hydrate `AppProvider`. Mutations stay **optimistic**: update local React state immediately
(exactly as it does today), then persist to Supabase in the background. Point-award taps would be
debounced before hitting the database, since a teacher tapping "+1" repeatedly shouldn't fire a
request per tap. Ending a lesson snapshots the current class/student totals and that session's mood
averages into `class_history` — this is what the Analytics trend charts already read.

### Storage

Uploaded images (timetable screenshots, whiteboard backgrounds, the image widget) go to a Supabase
Storage bucket; the database only ever stores the resulting URL, not the file itself. The frontend
already builds local object URLs (`URL.createObjectURL`) as a stand-in for this — swapping that for a
`supabase.storage.from(...).upload()` call and storing the returned public URL is a small, contained
change per upload site.

### AI timetable extraction

This is the one call that **must not** happen directly from the client, because it needs a
server-held API key. The plan is a Supabase Edge Function: the client uploads the screenshot to
Storage, calls the edge function with that file's path, the function calls a vision model server-side
using a key that never reaches the browser, normalizes the response into
`{ weekday, start, end, subject, class }` rows, and returns them to the client for the **already-built**
editable review step. Nothing about the review-grid UI needs to change — only the source of the rows
switches from a hardcoded array to a real API response. Newly-named classes surfaced during import
would prompt to create matching `classes` rows, exactly as the current mock flow's banner suggests.

### What changes on the frontend when this lands

Concretely: `AppProvider` and `BoardProvider`'s `useState` initial values (currently `mockData.ts`)
become Supabase queries; every mutator function (`awardStudentPoints`, `setClassGoal`, `addStudent`,
etc.) gains a `supabase.from(...).update()`/`.insert()` call alongside its existing `setState` call;
`Login.tsx` points at `supabase.auth`; image-upload call sites point at Supabase Storage; and the
Settings timetable-upload flow calls the edge function instead of a `setTimeout`. The component tree,
routing, whiteboard engine, and every widget's UI stay exactly as they are today.

---

## Project structure

```
src/
  App.tsx              route table + layout shells
  main.tsx             entry point, wraps App in AppProvider
  index.css            design tokens (light + dark), animations, utility classes
  components/
    TopBar.tsx          persistent nav + user menu dropdown
    ui.tsx              shared primitives: Button, Card, Badge, ProgressBar, Avatar, SmileyScale, ...
  lib/
    types.ts             shared TypeScript shapes
    mockData.ts           seed data (classes, students, timetable, history)
    store.tsx              AppProvider / useApp() — app-wide state
    schedule.ts            live/next-period lookup against the real clock
    colors.ts               hex mirrors of the CSS color tokens, for Recharts
  pages/
    Login.tsx, Dashboard.tsx, Analytics.tsx, Settings.tsx, Lesson.tsx, Whiteboard.tsx
  whiteboard/
    BoardContext.tsx      BoardProvider / useBoard() — per-board state
    Board.tsx               the whiteboard engine (canvas, sidebar, zoom/pan)
    widgets.tsx              every widget component + WidgetShell chrome
```
