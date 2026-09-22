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

export interface DbTimetable {
  id: string;
  class_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room?: string;
  created_at: string;
}

export interface DbSyllabusFile {
  id: string;
  class_id: string;
  filename: string;
  file_url: string;
  file_size?: number;
  uploaded_by?: string;
  created_at: string;
}

export interface DbAssessment {
  id: string;
  student_id: string;
  class_id: string;
  subject: string;
  marks: number;
  total_marks: number;
  date: string;
  created_at: string;
}

export const timetableApi = {
  getByClass: async (classId: string) => {
    const { data, error } = await supabase
      .from("timetable")
      .select("*")
      .eq("class_id", classId)
      .order("day_of_week", { ascending: true });
    if (error) throw error;
    return data as DbTimetable[];
  },

  create: async (classId: string, dayOfWeek: string, startTime: string, endTime: string, room?: string) => {
    const uniqueId = `t${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data, error } = await supabase
      .from("timetable")
      .upsert([{ id: uniqueId, class_id: classId, day_of_week: dayOfWeek, start_time: startTime, end_time: endTime, room }], { onConflict: "id" })
      .select()
      .single();
    if (error) throw error;
    return data as DbTimetable;
  },

  deleteByClass: async (classId: string) => {
    const { error } = await supabase.from("timetable").delete().eq("class_id", classId);
    if (error) throw error;
  },
};

export const syllabusFilesApi = {
  getByClass: async (classId: string) => {
    const { data, error } = await supabase
      .from("syllabus_files")
      .select("*")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as DbSyllabusFile[];
  },

  create: async (classId: string, filename: string, fileUrl: string, fileSize?: number, uploadedBy?: string) => {
    const uniqueId = `sf${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data, error } = await supabase
      .from("syllabus_files")
      .upsert([{ id: uniqueId, class_id: classId, filename, file_url: fileUrl, file_size: fileSize, uploaded_by: uploadedBy }], { onConflict: "id" })
      .select()
      .single();
    if (error) throw error;
    return data as DbSyllabusFile;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from("syllabus_files").delete().eq("id", id);
    if (error) throw error;
  },
};

export const assessmentsApi = {
  getByClass: async (classId: string) => {
    const { data, error } = await supabase
      .from("assessments")
      .select("*")
      .eq("class_id", classId)
      .order("date", { ascending: false });
    if (error) throw error;
    return data as DbAssessment[];
  },

  getByStudent: async (studentId: string) => {
    const { data, error } = await supabase
      .from("assessments")
      .select("*")
      .eq("student_id", studentId)
      .order("date", { ascending: false });
    if (error) throw error;
    return data as DbAssessment[];
  },

  create: async (studentId: string, classId: string, subject: string, marks: number, totalMarks: number, date: string) => {
    const { data, error } = await supabase
      .from("assessments")
      .insert([{ id: `a${Date.now()}`, student_id: studentId, class_id: classId, subject, marks, total_marks: totalMarks, date }])
      .select()
      .single();
    if (error) throw error;
    return data as DbAssessment;
  },

  update: async (id: string, updates: Partial<DbAssessment>) => {
    const { data, error } = await supabase
      .from("assessments")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as DbAssessment;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from("assessments").delete().eq("id", id);
    if (error) throw error;
  },
};
