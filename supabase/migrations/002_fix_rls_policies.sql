-- Fix RLS policies to allow anon key to insert/update timetable and syllabus data

-- Enable RLS on timetable if not already enabled
ALTER TABLE IF EXISTS timetable ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for timetable inserts
DROP POLICY IF EXISTS "Allow all users to insert timetable" ON timetable;
CREATE POLICY "Allow all users to insert timetable" ON timetable
  FOR INSERT WITH CHECK (true);

-- Create permissive policy for timetable updates
DROP POLICY IF EXISTS "Allow all users to update timetable" ON timetable;
CREATE POLICY "Allow all users to update timetable" ON timetable
  FOR UPDATE USING (true) WITH CHECK (true);

-- Create permissive policy for timetable reads
DROP POLICY IF EXISTS "Allow all users to read timetable" ON timetable;
CREATE POLICY "Allow all users to read timetable" ON timetable
  FOR SELECT USING (true);

-- Enable RLS on syllabus_files if not already enabled
ALTER TABLE IF EXISTS syllabus_files ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for syllabus_files inserts
DROP POLICY IF EXISTS "Allow all users to insert syllabus files" ON syllabus_files;
CREATE POLICY "Allow all users to insert syllabus files" ON syllabus_files
  FOR INSERT WITH CHECK (true);

-- Create permissive policy for syllabus_files updates
DROP POLICY IF EXISTS "Allow all users to update syllabus files" ON syllabus_files;
CREATE POLICY "Allow all users to update syllabus files" ON syllabus_files
  FOR UPDATE USING (true) WITH CHECK (true);

-- Create permissive policy for syllabus_files reads
DROP POLICY IF EXISTS "Allow all users to read syllabus files" ON syllabus_files;
CREATE POLICY "Allow all users to read syllabus files" ON syllabus_files
  FOR SELECT USING (true);
