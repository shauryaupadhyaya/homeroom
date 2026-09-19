import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { TopBar } from "./components/TopBar";
import { useApp } from "./lib/store";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Analytics } from "./pages/Analytics";
import { Settings } from "./pages/Settings";
import { Lesson } from "./pages/Lesson";
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
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route element={<FullScreenGuard />}>
        <Route path="/lesson/:classId" element={<Lesson />} />
        <Route path="/whiteboard/:boardId" element={<Whiteboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
