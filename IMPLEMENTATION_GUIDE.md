# Critical Implementation Guide

## Status Summary

**Working:** Timetable parser improved, Assessments tracker, Settings tabs  
**Blocking:** Notebook feature, Mode toggle, PDF chapter preview  

## Next Priority: LESSON MODE TOGGLE (BLOCKING)

### 1. Notebook Feature
- **File:** Create `src/whiteboard/Notebook.tsx`
- **Copy canvas logic from:** `src/whiteboard/Board.tsx` (lines 207-288)
- **Add:** Clear, Undo, Pen colors, Eraser
- **Keep separate from whiteboard widgets**

### 2. Mode Toggle in Lesson
- **File:** Modify `src/pages/Lesson.tsx`
- **Add state:** `const [lessonMode, setLessonMode] = useState<"whiteboard" | "notebook" | "widgets">("whiteboard")`
- **Add buttons:** Display 3 tabs for Whiteboard/Notebook/Widgets
- **Conditionally render:** Show only selected mode
- **Keep widgets accessible** from all modes

### 3. PDF Chapter Extraction (Syllabus)
- **File:** Modify `src/pages/Settings.tsx`
- **Add library:** `npm install pdfjs-dist`
- **Extract chapters:** Parse PDF text to find section headers
- **Show in preview:** Display chapter list before confirming upload

## Implementation Order
1. Create Notebook.tsx
2. Update Lesson.tsx with mode toggle
3. Add PDF extraction to Settings.tsx syllabus upload
4. Test end-to-end

## Database
- No schema changes needed
- Uses existing: `timetable`, `syllabus_files`, `assessments` tables

## Files to Modify
- `src/pages/Lesson.tsx` - Add mode buttons + conditional rendering
- `src/pages/Settings.tsx` - Add PDF chapter preview
- `package.json` - Add pdfjs-dist

## Test Cases
- [ ] Switch Whiteboard ↔ Notebook ↔ Widgets in lesson
- [ ] Draw in notebook, switch modes, return
- [ ] Timetable upload with real format
- [ ] PDF upload shows chapters

**Current commit:** ec4b9d0 (timetable parser improved)  
**Ready for notebook implementation**
