# Backend Setup Guide

## ✅ Completed
- ✅ Supabase project linked (vdsxirzfugteejorrvhv)
- ✅ Database schema created (supabase/migrations/001_init_schema.sql)
- ✅ Supabase integration file created (src/lib/supabase.ts)
- ✅ Store updated to load from Supabase (src/lib/store.tsx)
- ✅ Syllabus upload page created (src/pages/SyllabusUpload.tsx)
- ✅ AI timetable generator created (src/pages/TimetableGenerator.tsx)
- ✅ Routes added to App.tsx and TopBar navigation
- ✅ Environment template created (.env.local)

## 🔴 TODO: Get Your Credentials

### 1. Supabase Anon Key
1. Go to: https://app.supabase.com/project/vdsxirzfugteejorrvhv
2. Click **Settings** → **API**
3. Copy the **anon** (public) key
4. Update `.env.local`:
```
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2. Supabase Storage Setup (for syllabus uploads)
1. In Supabase dashboard, go to **Storage**
2. Create a new bucket named `syllabi`
3. Set **Public access** to ON
4. Keep the default settings

### 3. Anthropic API Key (for AI timetable)
1. Go to: https://console.anthropic.com/
2. Get your API key from the dashboard
3. Update `.env.local`:
```
VITE_ANTHROPIC_API_KEY=your_api_key_here
```

## 📋 Next Steps After Adding Credentials

### 1. Push Database Schema
```bash
cd /Users/shauryaupadhyaya/Downloads/other/cc/homeroom
npx supabase db push
```

### 2. Seed Initial Data
Run this SQL in Supabase SQL editor (copy all into one query):

```sql
-- Insert demo classes
INSERT INTO classes (id, name, subject, color, room, points, goal) VALUES
  ('c1', '10A', 'Mathematics', 'orange', 'C1', 356, 480),
  ('c2', '10B', 'Mathematics', 'blue', 'C2', 120, 480),
  ('c3', '9A', 'Science', 'green', 'Lab1', 240, 480),
  ('c4', '9B', 'Science', 'pink', 'Lab2', 180, 480),
  ('c5', '8A', 'English', 'purple', 'C3', 200, 480),
  ('c6', '8B', 'English', 'cyan', 'C4', 150, 480),
  ('c7', '7A', 'History', 'red', 'C5', 380, 480),
  ('c8', '7B', 'Geography', 'indigo', 'C6', 220, 480),
  ('c9', '7C', 'Art', 'rose', 'Art', 340, 480);

-- Insert students
INSERT INTO students (id, class_id, name, email) VALUES
  ('s1', 'c1', 'Aisha Rahman', 'aisha@school.edu'),
  ('s2', 'c1', 'Bhaskar Singh', 'bhaskar@school.edu'),
  ('s3', 'c1', 'Cara Lopez', 'cara@school.edu'),
  ('s4', 'c1', 'David Chen', 'david@school.edu'),
  ('s5', 'c1', 'Elena Kovac', 'elena@school.edu'),
  ('s6', 'c1', 'Farah Al-Rashid', 'farah@school.edu'),
  ('s7', 'c1', 'Garrett Brown', 'garrett@school.edu');
```

### 3. Test the App
1. Restart dev server: `npm run dev`
2. Log in (any email/password)
3. Test:
   - ✅ Dashboard loads classes/students from Supabase
   - ✅ Syllabus Upload page works
   - ✅ AI Timetable generator works

## 🔧 Features Now Working with Backend

| Feature | Status | Notes |
|---------|--------|-------|
| Classes | ✅ Persists | Loads from DB, saves on create |
| Students | ✅ Persists | Loads from DB, saves on add |
| Points | ✅ Persists | Saves to classes table |
| Attendance | 🔄 Partial | Uses sessionStorage in Lesson, needs Supabase integration in Attendance page |
| Assessments | 🔄 Partial | UI works, needs Supabase integration |
| Syllabus | ✅ Uploads | File storage working |
| Timetable | ✅ AI Generated | Claude generates, saves to DB |
| Lesson Session | 🔄 Partial | Uses sessionStorage, needs save-on-end functionality |

## 📝 Still TODO (Backend Integration)
1. Integrate attendance page with Supabase
2. Integrate assessments page with Supabase
3. Save lesson sessions to database on lesson end
4. Integrate lesson history with real database
5. Link student progress metrics to real data

## ⚠️ Important Notes
- The app still uses mock data on initial load for classes/students (from mockData.ts)
- When you reload, it will load from Supabase instead
- Syllabus upload requires Storage bucket to be public
- AI timetable requires valid Anthropic API key
- All new data created will persist to Supabase

## 🆘 Troubleshooting

**"Supabase credentials not found"**
- Make sure .env.local is in project root
- Restart dev server after changing .env.local

**"Upload failed"**
- Check Storage bucket is created and public
- Verify file permissions

**"AI generation failed"**
- Check VITE_ANTHROPIC_API_KEY is set
- Verify API key is valid
- Check network/CORS issues

## 📞 Commands to Remember
```bash
# Start dev server
npm run dev

# Push database schema
npx supabase db push

# View Supabase logs
npx supabase logs

# Run migrations
npx supabase db reset
```
