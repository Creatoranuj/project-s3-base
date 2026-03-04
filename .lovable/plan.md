

# Sadhguru Coaching Centre -- Master Implementation & Testing Plan

This plan covers all 27 items from your checklist, organized into sequential phases.

---

## Phase 1: Security & Infrastructure

### 1A. RLS Security Hardening (Items 5, 8)
- Run SQL migration to drop permissive `USING(true)` policies on profiles table INSERT/UPDATE/DELETE
- Add controlled RLS: users can only read/update their own profile
- Secure `profiles_public` view with RLS or replace with a security-definer function
- Run a full security scan after migration

### 1B. Storage Buckets (Item 15)
- Create missing storage buckets via migration: `content`, `comment-images`, `course-videos`, `course-materials`, `receipts`
- Add RLS policies: authenticated users can upload to their own paths, admins can manage all

### 1C. Leaked Password Protection (Item 12)
- This is a Supabase Dashboard setting (Authentication > Password Security > HaveIBeenPwned). **You must enable this manually** in the Supabase Dashboard -- it cannot be done via code.

---

## Phase 2: Video Player Polish (Items 6, 9, 17)

**File: `src/components/video/MahimaGhostPlayer.tsx`**

Already mostly implemented based on code review. Remaining refinements:
- **Watermark fade-in animation at 10s**: Add CSS `transition: opacity 500ms` (already present). Verify `watermarkVisible` logic -- currently correct: hidden < 10s, visible >= 10s, forced visible in last 10s
- **Pulsing border in last 10s**: Add a CSS keyframe `@keyframes pulse-border` and apply conditionally when `isInLastTenSeconds` is true on the watermark container
- **End screen suppression**: Already implemented (`stopVideo` + `seekTo(0, false)` on state 0). Verify custom `EndScreenOverlay` renders
- **Progress bar flicker fix**: `touchcancel` handler already exists. `will-change: transform` already in CSS

---

## Phase 3: Real Progress Tracking (Items 11, 14, 23)

**File: `src/pages/LessonView.tsx`**

Already implemented based on code review:
- Lines 82-92: Queries `user_progress` table for completed lessons on mount
- Lines 99-119: `handleVideoTimeUpdate` saves progress at 80% threshold via upsert
- The `completedLessonIds` Set drives the progress bar

**Verification needed**: Confirm the progress bar UI uses `completedLessonIds.size / lessons.length` for the percentage display.

---

## Phase 4: Admin Upload & MIME Validation (Items 3, 20, 24, 26)

**File: `src/pages/AdminUpload.tsx`**

Already implemented:
- Breadcrumb drill-down (Course > Chapter > Sub-chapter) -- lines 322-355
- Sub-folder creation -- lines 170-197
- MIME type validation with blocked extensions list -- lines 199-220
- File validation called before upload -- lines 231-232

No code changes needed. Will verify end-to-end via browser testing.

---

## Phase 5: Manifest & Branding Fix (Items 10, 18)

**File: `public/manifest.json`**
- Currently shows "Sadhguru Coaching Centre" -- correct per current branding
- If rebranding to "Naveen Bharat" is needed, update `name`, `short_name`, `description`
- Verify landing page, login page, video watermark all use consistent branding

---

## Phase 6: Real-Time Subscriptions (Item 16)

- Add Supabase real-time subscriptions for `messages` and `comments` tables in their respective hooks
- Use `supabase.channel().on('postgres_changes', ...)` pattern
- Auto-refresh comment lists and message feeds when new records arrive

---

## Phase 7: Mobile Hamburger Menu (Items 1, 25, 27)

**File: `src/pages/Index.tsx`**

Already implemented! The Navigation component has:
- Sheet-based mobile menu triggered by hamburger icon on `md:hidden`
- All nav items (Courses, Books, Login/Sign Up/Dashboard) in the slide-out panel

Will verify via browser testing at mobile viewport.

---

## Phase 8: Comprehensive Testing (Items 2, 7, 13, 18, 19, 20, 21, 22, 25, 27)

All 25 levels of testing:

| # | Test | Method |
|---|------|--------|
| 1 | Mobile hamburger menu | Browser test at 375px width |
| 2 | Video watermark hidden first 10s | Play video, observe watermark state |
| 3 | Watermark fade-in at 10s | Verify opacity transition |
| 4 | Watermark locked last 10s | Seek near end, verify persistent |
| 5 | Pulsing border last 10s | Visual check |
| 6 | End screen suppression | Let video end, confirm no YT recommendations |
| 7 | Custom EndScreenOverlay | Verify replay/next buttons |
| 8 | Progress bar seek (mouse) | Click progress bar |
| 9 | Progress bar seek (touch) | Touch-drag on mobile |
| 10 | Skip forward/backward 10s | Click skip buttons |
| 11 | Keyboard shortcuts | Space, arrows, M, F |
| 12 | Admin login & role check | Login as admin |
| 13 | Admin breadcrumb drill-down | Course > Chapter > Sub-chapter |
| 14 | Admin create chapter | Fill form, submit |
| 15 | Admin create sub-folder | Fill form, submit |
| 16 | Admin upload content | Upload video/PDF |
| 17 | MIME type validation | Try uploading .exe |
| 18 | Student login | Login as student |
| 19 | Course progress bar | Verify real data from user_progress |
| 20 | 80% auto-complete | Watch 80% of video, check progress updates |
| 21 | RLS policies | Verify profiles access control |
| 22 | Storage bucket access | Upload/download files |
| 23 | PWA manifest | Check installed app name |
| 24 | Landing page responsive | Check all sections at various viewports |
| 25 | Branding consistency | Verify name across all pages |

---

## Phase 9: Documentation (Item 10)

**File: `memorywork.md`**
- Append full audit checklist report with all findings
- Document each phase's changes, security scan results, and test outcomes

---

## Phase 10: Project Remix (Item 4)

This is a Lovable platform feature. To remix your project:
1. Click the project name in the top-left corner
2. Go to Settings
3. Click "Remix this project"

This creates a complete copy with the same codebase.

---

## Implementation Order

1. Security migrations (RLS + storage buckets)
2. Video player pulsing border CSS addition
3. Real-time subscriptions for messages/comments
4. Manifest/branding verification
5. memorywork.md documentation update
6. Full 25-level browser testing sweep

## Files to Modify

| File | Changes |
|------|---------|
| New SQL migration | RLS policy fixes + storage buckets |
| `src/components/video/MahimaGhostPlayer.tsx` | Pulsing border CSS class in last 10s |
| `src/index.css` | `@keyframes pulse-border` animation |
| `src/hooks/useComments.ts` | Add real-time subscription |
| `src/hooks/useMessages.ts` | Add real-time subscription |
| `memorywork.md` | Full audit checklist report |

Most items (mobile menu, progress tracking, MIME validation, breadcrumb nav, watermark timing, end screen suppression) are already implemented and need verification only.

