

# Plan: Redesign Lesson View to Match Vedantu-Style Layout

## Current State
- `LessonView.tsx` (728 lines) is a two-column desktop layout: video+tabs on left, playlist sidebar on right
- `LessonActionBar.tsx` shows Like/Doubts/Download buttons in a horizontal row
- Description is inside an "Overview" tab, not directly visible below video
- No "Topics Covered" timestamps section or "Smart Notes" card section exists
- Mobile layout stacks columns but doesn't match the screenshot's clean vertical flow

## Target Layout (from screenshot, top to bottom on mobile)
1. **Header**: Back arrow + lesson title + date
2. **Video Player**: Full-width, aspect-video
3. **Action Bar**: Pill-shaped buttons — `👍 168 Likes` | `💬 Comments` | `❓ Doubts`
4. **Lesson Info**: Title + teacher name, subject/grade badge, truncated description with "Read More"
5. **Class PDF button**: Download button if PDF exists
6. **Smart Notes Card**: Expandable card linking to notes tab
7. **Topics Covered**: Timestamped list (from lesson description or a new field — placeholder for now)
8. **Playlist Sidebar**: On desktop stays as right column; on mobile moves below everything

## Changes

### 1. Redesign `LessonView.tsx` — Main Layout
- Move description, teacher info, and "Read More" toggle out of tabs and into the main flow below the action bar
- Add a "Topics Covered" section below description (placeholder data parsed from description or static)
- Add a "Smart Notes" card section (links to the existing Notes tab)
- Keep tabs (Overview/Resources/Notes/Discussion) but move them further down
- On mobile: pure vertical stack, no sidebar visible by default — add a "Course Content" expandable drawer at bottom
- On desktop: keep the right sidebar playlist

### 2. Update `LessonActionBar.tsx` — Match Screenshot Style
- Change buttons to pill/chip style with rounded-full, matching the screenshot's `👍 168 Likes | 💬 Comments | ❓ Doubts` layout
- Add "Comments" button that scrolls to discussion tab
- Remove duplicate Download/Class PDF buttons (consolidate into one)

### 3. Add Description Section with "Read More"
- Show lesson title + teacher name (from course data or profile)
- Subject + grade badge
- Truncated description (3 lines) with "Read More" toggle
- Class PDF download button inline

### 4. Add Topics Covered Section
- Parse timestamps from lesson description if present (format: `0:00:18 Topic name`)
- Otherwise show placeholder "No topics added yet"
- Clickable timestamps that seek the video (future enhancement)

### 5. Add Smart Notes Card
- Card with icon that opens the Notes tab when clicked
- "Ask in class Doubt" sub-card linking to Discussion tab

### 6. Mobile Playlist Drawer
- On mobile, replace the fixed sidebar with a bottom sheet / collapsible section
- "Course Content" button at bottom that expands to show lesson list

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/LessonView.tsx` | Major layout restructure — vertical flow, description section, topics covered, smart notes card |
| `src/components/video/LessonActionBar.tsx` | Pill-style buttons, consolidate duplicate buttons, add Comments action |

