import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SchoolClass, Student, WidgetInstance } from "./types";
import {
  teacher as initialTeacher,
  classes as initialClasses,
  students as initialStudents,
  timetable,
  classHistory,
} from "./mockData";
import { supabase } from "./supabase";

export interface ScratchBoard {
  id: string;
  name: string;
  widgets: WidgetInstance[];
  bgUrl: string | null;
}

export type Theme = "light" | "dark";

interface AppState {
  isAuthed: boolean;
  login: () => void;
  logout: () => void;

  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;

  teacher: typeof initialTeacher;
  updateTeacher: (patch: Partial<typeof initialTeacher>) => void;

  classes: SchoolClass[];
  students: Student[];
  timetable: typeof timetable;
  classHistory: typeof classHistory;

  awardClassPoints: (classId: string, delta: number) => void;
  awardStudentPoints: (studentId: string, delta: number) => void;
  setClassGoal: (classId: string, goal: number) => void;
  addClass: (name: string, subject: string) => void;
  renameClass: (classId: string, name: string) => void;
  deleteClass: (classId: string) => void;
  addStudent: (classId: string, name: string) => void;
  renameStudent: (studentId: string, name: string) => void;
  removeStudent: (studentId: string) => void;

  scratchBoards: ScratchBoard[];
  addScratchBoard: () => ScratchBoard;
}

const AppContext = createContext<AppState | null>(null);

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("homeroom-theme");
  return stored === "dark" ? "dark" : "light";
}

function readStoredAuth(): boolean {
  if (typeof window === "undefined") return false;
  const stored = window.localStorage.getItem("homeroom-isAuthed");
  return stored === "true";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setAuthed] = useState(readStoredAuth);
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);
  const [teacherState, setTeacherState] = useState(initialTeacher);
  const [classesState, setClassesState] = useState<SchoolClass[]>(initialClasses);
  const [studentsState, setStudentsState] = useState<Student[]>(initialStudents);
  const [scratchBoards, setScratchBoards] = useState<ScratchBoard[]>([
    { id: "sb1", name: "Scratch board", widgets: [], bgUrl: null },
  ]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("homeroom-theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("homeroom-isAuthed", isAuthed.toString());
  }, [isAuthed]);

  useEffect(() => {
    if (!isAuthed) return;
    loadDataFromSupabase();
  }, [isAuthed]);

  const loadDataFromSupabase = async () => {
    try {
      const [{ data: classesData }, { data: studentsData }] = await Promise.all([
        supabase.from("classes").select("*"),
        supabase.from("students").select("*"),
      ]);

      if (classesData?.length) {
        const validColors: ("orange" | "sky" | "lime" | "pink" | "purple")[] = ["orange", "sky", "lime", "pink", "purple"];
        setClassesState(
          classesData.map((c: any) => {
            const color = validColors.includes(c.color) ? c.color : "orange";
            return {
              id: c.id,
              name: c.name,
              subject: c.subject,
              grade: Number(c.name.match(/\d+/)?.[0]) || 7,
              color,
              points: c.points || 0,
              goal: c.goal || 480,
            };
          })
        );
      }

      if (studentsData?.length) {
        setStudentsState(
          studentsData.map((s: any) => ({
            id: s.id,
            classId: s.class_id,
            name: s.name,
            points: 0,
            streak: 0,
            weeklyChange: 0,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load data from Supabase:", error);
    }
  };

  const value = useMemo<AppState>(
    () => ({
      isAuthed,
      login: () => setAuthed(true),
      logout: async () => {
        await supabase.auth.signOut();
        setAuthed(false);
      },

      theme,
      setTheme: setThemeState,
      toggleTheme: () => setThemeState((t) => (t === "light" ? "dark" : "light")),

      teacher: teacherState,
      updateTeacher: (patch) => setTeacherState((t) => ({ ...t, ...patch })),

      classes: classesState,
      students: studentsState,
      timetable,
      classHistory,

      awardClassPoints: async (classId, delta) => {
        setClassesState((cs) =>
          cs.map((c) => (c.id === classId ? { ...c, points: Math.max(0, c.points + delta) } : c))
        );

        try {
          const cls = classesState.find((c) => c.id === classId);
          if (cls) {
            await supabase.from("classes").update({ points: Math.max(0, cls.points + delta) }).eq("id", classId);
          }
        } catch (error) {
          console.error("Failed to award points:", error);
        }
      },
      awardStudentPoints: (studentId, delta) => {
        const s = studentsState.find((st) => st.id === studentId);
        setStudentsState((ss) =>
          ss.map((st) => (st.id === studentId ? { ...st, points: Math.max(0, st.points + delta) } : st))
        );
        if (s) {
          setClassesState((cs) =>
            cs.map((c) => (c.id === s.classId ? { ...c, points: Math.max(0, c.points + delta) } : c))
          );
        }
      },
      setClassGoal: (classId, goal) =>
        setClassesState((cs) => cs.map((c) => (c.id === classId ? { ...c, goal } : c))),
      addClass: async (name, subject) => {
        const classId = `c${Date.now()}`;
        const newClass: SchoolClass = { id: classId, name, grade: Number(name.match(/\d+/)?.[0]) || 7, subject, color: "orange", goal: 500, points: 0 };
        setClassesState((cs) => [...cs, newClass]);

        try {
          await supabase.from("classes").insert({
            id: classId,
            name,
            subject,
            color: "orange",
            goal: 500,
            points: 0,
          });
        } catch (error) {
          console.error("Failed to add class:", error);
        }
      },
      renameClass: (classId, name) =>
        setClassesState((cs) => cs.map((c) => (c.id === classId ? { ...c, name } : c))),
      deleteClass: (classId) => {
        setClassesState((cs) => cs.filter((c) => c.id !== classId));
        setStudentsState((ss) => ss.filter((s) => s.classId !== classId));
      },
      addStudent: async (classId, name) => {
        const studentId = `s${Date.now()}`;
        const newStudent = { id: studentId, classId, name, points: 0, streak: 0, weeklyChange: 0 };
        setStudentsState((ss) => [...ss, newStudent]);

        try {
          await supabase.from("students").insert({
            id: studentId,
            class_id: classId,
            name,
          });
        } catch (error) {
          console.error("Failed to add student:", error);
        }
      },
      renameStudent: (studentId, name) =>
        setStudentsState((ss) => ss.map((s) => (s.id === studentId ? { ...s, name } : s))),
      removeStudent: (studentId) => setStudentsState((ss) => ss.filter((s) => s.id !== studentId)),

      scratchBoards,
      addScratchBoard: () => {
        const b: ScratchBoard = {
          id: `sb${Date.now()}`,
          name: `Scratch board ${scratchBoards.length + 1}`,
          widgets: [],
          bgUrl: null,
        };
        setScratchBoards((bs) => [...bs, b]);
        return b;
      },
    }),
    [isAuthed, theme, teacherState, classesState, studentsState, scratchBoards]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
