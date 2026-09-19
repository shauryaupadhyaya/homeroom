import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { TopBar } from "./components/TopBar";
import { useApp } from "./lib/store";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Analytics } from "./pages/Analytics";
import { Settings } from "./pages/Settings";
import { Attendance } from "./pages/Attendance";
import { Assessments } from "./pages/Assessments";
import { Syllabus } from "./pages/Syllabus";
import { LessonHistory } from "./pages/LessonHistory";
import { StudentProgress } from "./pages/StudentProgress";
import { Lesson } from "./pages/Lesson";
import { LessonSummary } from "./pages/LessonSummary";
import { StudentProfile } from "./pages/StudentProfile";
import { Whiteboard } from "./pages/Whiteboard";

function AppLayout() {
  const { isAuthed } = useApp();
  const location = useLocation();
  if (!isAuthed) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen bg-(--color-paper)">
      <TopBar />
      <main className="mx-auto max-w-[1440px] px-6 py-8">
        <div key={location.pathname} className="page-transition">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function FullScreenGuard() {
  const { isAuthed } = useApp();
  if (!isAuthed) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/assessments" element={<Assessments />} />
        <Route path="/syllabus" element={<Syllabus />} />
        <Route path="/lesson-history" element={<LessonHistory />} />
        <Route path="/student-progress" element={<StudentProgress />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/student/:studentId" element={<StudentProfile />} />
      </Route>

      <Route element={<FullScreenGuard />}>
        <Route path="/lesson/:classId" element={<Lesson />} />
        <Route path="/lesson/:classId/summary" element={<LessonSummary />} />
        <Route path="/whiteboard/:boardId" element={<Whiteboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
