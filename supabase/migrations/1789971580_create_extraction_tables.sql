-- Create timetable table
CREATE TABLE IF NOT EXISTS public.timetable (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create syllabus_files table
CREATE TABLE IF NOT EXISTS public.syllabus_files (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_timetable_class ON public.timetable(class_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_files_class ON public.syllabus_files(class_id);

-- Enable RLS
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Allow public read timetable" ON public.timetable;
DROP POLICY IF EXISTS "Allow public insert timetable" ON public.timetable;
DROP POLICY IF EXISTS "Allow public delete timetable" ON public.timetable;
DROP POLICY IF EXISTS "Allow public read syllabus" ON public.syllabus_files;
DROP POLICY IF EXISTS "Allow public insert syllabus" ON public.syllabus_files;
DROP POLICY IF EXISTS "Allow public delete syllabus" ON public.syllabus_files;

CREATE POLICY "Allow public read timetable" ON public.timetable FOR SELECT USING (true);
CREATE POLICY "Allow public insert timetable" ON public.timetable FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete timetable" ON public.timetable FOR DELETE USING (true);

CREATE POLICY "Allow public read syllabus" ON public.syllabus_files FOR SELECT USING (true);
CREATE POLICY "Allow public insert syllabus" ON public.syllabus_files FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete syllabus" ON public.syllabus_files FOR DELETE USING (true);
