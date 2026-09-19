export interface Teacher {
  id: string;
  name: string;
  email: string;
  weekStartDay: "Mon" | "Sun";
  defaultGoal: number;
  clockFormat: "12h" | "24h";
}

export interface SchoolClass {
  id: string;
  name: string;
  grade: number;
  subject: string;
  color: "orange" | "sky" | "lime" | "pink" | "purple";
  goal: number;
  points: number;
}

export interface Student {
  id: string;
  classId: string;
  name: string;
  points: number;
  streak: number;
  weeklyChange: number;
}

export interface TimetablePeriod {
  id: string;
  weekday: 1 | 2 | 3 | 4 | 5;
  start: string; // "09:00"
  end: string; // "09:50"
  subject: string;
  classId: string;
  room: string;
}

export interface ClassHistoryPoint {
  week: string; // "W20"
  points: number;
  avgEntry: number;
  avgExit: number;
}

export interface MoodCheckin {
  studentId: string;
  entry: number | null;
  exit: number | null;
}

export type WidgetType =
  | "noise"
  | "timer"
  | "stopwatch"
  | "clock"
  | "studentList"
  | "picker"
  | "groups"
  | "image";

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  minimized: boolean;
  config?: Record<string, unknown>;
}
