

# Fix Plan: .env Recovery, Mobile Nav, Video Player & Admin Verification

## 1. Critical Fix: Restore .env File (Blank Screen)

The `.env` file was deleted/lost, causing the runtime error. Need to recreate it with the correct Supabase credentials:

```
VITE_SUPABASE_PROJECT_ID="wegamscqtvqhxowlskfm"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://wegamscqtvqhxowlskfm.supabase.co"
```

## 2. Mobile Hamburger Menu for Landing Page

The `Navigation` component in `src/pages/Index.tsx` currently hides some links on small screens but has no hamburger menu. Changes:

- Add a `useState` for mobile menu open/close
- Show a `Menu` icon button on screens < `sm`
- Hide desktop nav links on mobile, show them in a dropdown/sheet panel instead
- Use the existing `Sheet` component (already in project) for a slide-out mobile menu
- Include all nav items: Courses, Books, Login/Sign Up/Dashboard

## 3. Video Player Navigation & Glitches

In `MahimaGhostPlayer.tsx`:
- Verify the watermark timing logic (first 10s hidden, last 10s locked visible) is working correctly after the previous edit
- Ensure progress bar seeking has no flicker — confirm `touchcancel` handler exists
- Verify end screen suppression sends both `stopVideo` and `seekTo(0, false)`
- No major structural changes expected — just verify and fix any remaining edge cases

## 4. Admin Upload & Breadcrumbs Verification

`AdminUpload.tsx` already has breadcrumb drill-down (Course → Chapter → Sub-chapter). `Breadcrumbs.tsx` component is clean. Will verify:
- Course selection loads chapters correctly
- Chapter selection loads sub-chapters
- Upload form targets the correct chapter/sub-chapter
- Breadcrumb navigation links work for back-navigation

## Files to Modify

| File | Changes |
|------|---------|
| `.env` | Recreate with Supabase credentials |
| `src/pages/Index.tsx` | Add mobile hamburger menu using Sheet component |
| `src/components/video/MahimaGhostPlayer.tsx` | Verify/fix seeking glitches and watermark edge cases |

