

# Plan: Fix Discussion, Real Data, and Admin Entry Button

## Issues Identified

1. **Discussion tab shows "coming soon"** in `LectureModal.tsx` (line 305) — needs to be wired to the real `comments` table using `useComments` hook (already exists and works in `LessonView.tsx`)

2. **Course cards show hardcoded data** — `Courses.tsx` hardcodes `rating: 4.8`, `duration: "12h 00m"`, `lessons_count: 15` (lines 61-63) instead of fetching real lesson counts from the database

3. **AllClasses shows `lessonCount: 0`** — `AllClasses.tsx` sets `lessonCount: 0` (line 75) without querying actual lesson counts per course

4. **No Admin Panel button in sidebar** — The sidebar has no link to `/admin` for admin users

## Changes

### 1. Wire Discussion in LectureModal (`src/components/course/LectureModal.tsx`)
- Import `useComments` hook and `useAuth`
- Replace the "coming soon" placeholder with a real comment list and post form (similar to `LessonView.tsx` discussion tab)
- Show comment input with user avatar, textarea, and post button
- Display existing comments with username, timestamp, and message

### 2. Fix Course Card Real Data (`src/pages/Courses.tsx`)
- After fetching courses, query `lessons` table to get actual lesson count per course using a grouped count
- Calculate total duration from lesson `duration` column
- Pass real `lessons_count` and formatted `duration` to `CourseCard`

### 3. Fix AllClasses Lesson Count (`src/pages/AllClasses.tsx`)
- After fetching courses, query `lessons` table grouped by `course_id` to get real lesson counts
- Update each course's `lessonCount` with actual data

### 4. Add Admin Panel Button to Sidebar (`src/components/Layout/Sidebar.tsx`)
- Import `useAuth` hook (already imported)
- Check if user has admin role via `useAuth`
- Conditionally render an "Admin Panel" menu item with `ShieldAlert` icon linking to `/admin` — only visible to admin users
- Style it distinctly (e.g., with accent color) so it stands out

## Files to Modify

| File | Change |
|------|--------|
| `src/components/course/LectureModal.tsx` | Replace discussion placeholder with real comments |
| `src/pages/Courses.tsx` | Fetch real lesson counts instead of hardcoded values |
| `src/pages/AllClasses.tsx` | Fetch real lesson counts per course |
| `src/components/Layout/Sidebar.tsx` | Add conditional Admin Panel button for admin users |

