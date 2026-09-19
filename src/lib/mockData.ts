import type {
  Teacher,
  SchoolClass,
  Student,
  TimetablePeriod,
  ClassHistoryPoint,
} from "./types";

export const teacher: Teacher = {
  id: "t1",
  name: "John Smith",
  email: "john.smith@school.com",
  weekStartDay: "Mon",
  defaultGoal: 500,
  clockFormat: "24h",
};

export const classes: SchoolClass[] = [
  { id: "c1", name: "10A", grade: 10, subject: "Physics", color: "orange", goal: 700, points: 512 },
  { id: "c2", name: "10B", grade: 10, subject: "Chemistry", color: "sky", goal: 650, points: 588 },
  { id: "c3", name: "9A", grade: 9, subject: "Maths", color: "lime", goal: 500, points: 401 },
  { id: "c4", name: "9B", grade: 9, subject: "English", color: "pink", goal: 550, points: 612 },
  { id: "c5", name: "8A", grade: 8, subject: "History", color: "purple", goal: 450, points: 214 },
  { id: "c6", name: "8B", grade: 8, subject: "Geography", color: "orange", goal: 480, points: 356 },
  { id: "c7", name: "7A", grade: 7, subject: "Art", color: "sky", goal: 320, points: 268 },
  { id: "c8", name: "7B", grade: 7, subject: "Music", color: "lime", goal: 300, points: 190 },
  { id: "c9", name: "7C", grade: 7, subject: "Drama", color: "pink", goal: 340, points: 305 },
];

const ROOM_BY_CLASS: Record<string, string> = {
  c1: "B12", c2: "B14", c3: "A3", c4: "A5", c5: "C1", c6: "C2", c7: "D6", c8: "D7", c9: "D8",
};

const names = [
  "Ava Thompson", "Noah Bennett", "Isla Robinson", "Leo Marchetti", "Freya Osei",
  "Oscar Whitfield", "Maya Chowdhury", "Ethan Park", "Grace Nakamura", "Jacob Fenwick",
  "Ruby Alonso", "Finn Delacroix", "Zara Malik", "Theo Sandberg", "Nina Petrova",
  "Arlo Mensah", "Ivy Sorensen", "Kai Yamamoto", "Chloe Beaumont", "Reuben Adeyemi",
  "Layla Hassan", "Milo Fitzgerald", "Amara Coleman", "Felix Novak", "Sadie Okonkwo",
  "Elliot Reyes", "Poppy Lindqvist", "Hugo Ferreira", "Willow Chen", "Dexter Osafo",
  "Rosa Fernandez", "Callum Ng", "Iris Kowalski", "Sami Farouk", "Belle Harrington",
  "Tobias Lindberg", "Aisha Rahman", "Wyatt Correia", "Nadia Ibrahim", "Louis Bergstrom",
  "Priya Anand", "Marcus Oduya", "Erin McAllister", "Kofi Boateng", "Stella Marchetti",
  "Dylan Foss", "Anya Petrov", "Gabriel Souza", "Freddie Vance", "Mei Lin",
  "Jonah Whitaker", "Talia Brandt", "Rocco Salvatore", "Wren Ashby", "Idris Osei",
  "Clara Vantongeren", "Beckett Muir", "Sana Qureshi", "Otis Renner", "Juno Falkenberg",
];

let nameIdx = 0;
function nextName() {
  const n = names[nameIdx % names.length];
  nameIdx += 1;
  return n;
}

export const students: Student[] = classes.flatMap((cls, ci) => {
  const count = 5 + ((ci * 2) % 4); // 5-8 students per class
  return Array.from({ length: count }, (_, i) => ({
    id: `${cls.id}-s${i}`,
    classId: cls.id,
    name: nextName(),
    points: Math.round(20 + Math.random() * 60),
    streak: Math.round(Math.random() * 12),
    weeklyChange: Math.round((Math.random() - 0.3) * 20),
  }));
});

const SLOTS = ["09:00", "10:00", "11:10", "13:00", "14:00"];
const SLOT_END: Record<string, string> = {
  "09:00": "09:50",
  "10:00": "10:50",
  "11:10": "12:00",
  "13:00": "13:50",
  "14:00": "14:50",
};

export const timetable: TimetablePeriod[] = [];
{
  let counter = 0;
  for (let day = 1; day <= 5; day++) {
    for (let slotIdx = 0; slotIdx < SLOTS.length; slotIdx++) {
      const classIdx = (day * SLOTS.length + slotIdx) % classes.length;
      const cls = classes[classIdx];
      const start = SLOTS[slotIdx];
      counter += 1;
      timetable.push({
        id: `p${counter}`,
        weekday: day as 1 | 2 | 3 | 4 | 5,
        start,
        end: SLOT_END[start],
        subject: cls.subject,
        classId: cls.id,
        room: ROOM_BY_CLASS[cls.id],
      });
    }
  }
}

function buildHistory(seedPoints: number, seedMood: number): ClassHistoryPoint[] {
  const weeks = ["W19", "W20", "W21", "W22", "W23", "W24", "W25", "W26"];
  let points = seedPoints;
  let entry = seedMood;
  let exit = seedMood + 0.35;
  return weeks.map((week) => {
    points += Math.round(18 + Math.random() * 26);
    entry = Math.min(4.6, entry + (Math.random() * 0.12 - 0.02));
    exit = Math.min(4.9, exit + (Math.random() * 0.14 + 0.01));
    return {
      week,
      points,
      avgEntry: Math.round(entry * 10) / 10,
      avgExit: Math.round(exit * 10) / 10,
    };
  });
}

const HISTORY_SEEDS: Record<string, [number, number]> = {
  c1: [220, 3.0],
  c2: [260, 3.2],
  c3: [180, 3.4],
  c4: [320, 2.9],
  c5: [60, 3.6],
  c6: [140, 3.1],
  c7: [90, 3.5],
  c8: [50, 3.3],
  c9: [110, 3.4],
};

export const classHistory: Record<string, ClassHistoryPoint[]> = Object.fromEntries(
  classes.map((c) => [c.id, buildHistory(...HISTORY_SEEDS[c.id])])
);

export const currentSession = {
  classId: "c1",
  entries: students
    .filter((s) => s.classId === "c1")
    .map((s) => ({ studentId: s.id, entry: 3 + Math.round(Math.random() * 2), exit: null as number | null })),
};
