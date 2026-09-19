import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutGrid, BarChart3, Settings as SettingsIcon, LogOut, NotebookPen, ChevronDown, Calendar, ClipboardList, BookOpen, History, Users, Upload, Wand2 } from "lucide-react";
import { useApp } from "../lib/store";
import { Avatar } from "./ui";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/attendance", label: "Attendance", icon: Calendar, end: false },
  { to: "/assessments", label: "Assessments", icon: ClipboardList, end: false },
  { to: "/syllabus", label: "Syllabus", icon: BookOpen, end: false },
  { to: "/syllabus-upload", label: "Upload", icon: Upload, end: false },
  { to: "/timetable-generator", label: "AI Timetable", icon: Wand2, end: false },
  { to: "/lesson-history", label: "History", icon: History, end: false },
  { to: "/student-progress", label: "Progress", icon: Users, end: false },
  { to: "/analytics", label: "Analytics", icon: BarChart3, end: false },
];

export function TopBar() {
  const { teacher, logout } = useApp();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b-[3px] border-(--color-border) bg-(--color-paper) px-6">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-(--color-border) bg-(--color-orange-500) text-(--color-ink-on-accent)">
            <NotebookPen size={18} strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">Homeroom</span>
        </div>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `nav-hover flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-sm font-bold ${
                  isActive
                    ? "border-(--color-border) bg-(--color-orange-500) text-(--color-ink-on-accent) shadow-hard-sm"
                    : "border-transparent text-(--color-ink-soft) hover:bg-(--color-paper-dim) hover:text-(--color-ink)"
                }`
              }
            >
              <item.icon size={16} strokeWidth={2.5} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="nav-hover flex items-center gap-2 rounded-full border-2 border-(--color-border) bg-(--color-paper-dim) py-1 pl-1 pr-2.5 hover:bg-(--color-orange-100)"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <Avatar name={teacher.name} size={30} />
          <span className="text-sm font-bold text-(--color-ink)">{teacher.name}</span>
          <ChevronDown size={15} className={`text-(--color-ink-muted) transition-transform ${menuOpen ? "rotate-180" : ""}`} />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="animate-rise-in absolute right-0 top-[calc(100%+8px)] w-48 overflow-hidden rounded-xl border-[3px] border-(--color-border) bg-(--color-surface) shadow-hard"
          >
            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                navigate("/settings");
              }}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-bold text-(--color-ink) hover:bg-(--color-paper-dim)"
            >
              <SettingsIcon size={16} />
              Settings
            </button>
            <div className="h-[2px] bg-(--color-border)" />
            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                logout();
                navigate("/login");
              }}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-bold text-(--color-danger) hover:bg-(--color-danger-100)"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
