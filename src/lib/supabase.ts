import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials not found in environment variables");
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "");

export interface DbClass {
  id: string;
  name: string;
  subject: string;
  color: string;
  room?: string;
  points: number;
  goal: number;
  created_at: string;
}

export interface DbStudent {
  id: string;
  name: string;
  class_id: string;
  email?: string;
  created_at: string;
}

export interface DbAttendance {
  id: string;
  student_id: string;
  date: string;
  status: "present" | "absent" | "late";
  created_at: string;
}

export const classesApi = {
  getAll: async () => {
    const { data, error } = await supabase.from("classes").select("*");
    if (error) throw error;
    return data as DbClass[];
  },

  create: async (name: string, subject: string, color: string) => {
    const { data, error } = await supabase
      .from("classes")
      .insert([{ id: `c${Date.now()}`, name, subject, color }])
      .select()
      .single();
    if (error) throw error;
    return data as DbClass;
  },

  update: async (id: string, updates: Partial<DbClass>) => {
    const { data, error } = await supabase
      .from("classes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as DbClass;
  },
};

export const studentsApi = {
  getByClass: async (classId: string) => {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("class_id", classId);
    if (error) throw error;
    return data as DbStudent[];
  },

  create: async (classId: string, name: string) => {
    const { data, error } = await supabase
      .from("students")
      .insert([{ id: `s${Date.now()}`, name, class_id: classId }])
      .select()
      .single();
    if (error) throw error;
    return data as DbStudent;
  },
};

export const attendanceApi = {
  getByStudent: async (studentId: string) => {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("student_id", studentId)
      .order("date", { ascending: false });
    if (error) throw error;
    return data as DbAttendance[];
  },

  record: async (studentId: string, date: string, status: "present" | "absent" | "late") => {
    const { data, error } = await supabase
      .from("attendance")
      .upsert([{ student_id: studentId, date, status }], { onConflict: "student_id,date" })
      .select()
      .single();
    if (error) throw error;
    return data as DbAttendance;
  },
};
