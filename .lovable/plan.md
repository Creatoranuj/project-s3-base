

# Implementation Plan: Storage Buckets, PWA Enhancement & Capacitor Setup

## Phase 1: Create Missing Storage Buckets

Create `comment-images` and `course-materials` buckets via SQL migration with RLS policies.

**SQL Migration:**
```sql
-- Create missing buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('comment-images', 'comment-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('course-materials', 'course-materials', true);

-- RLS for comment-images: authenticated users can upload, anyone can read
CREATE POLICY "Public read comment-images" ON storage.objects FOR SELECT USING (bucket_id = 'comment-images');
CREATE POLICY "Auth users upload comment-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'comment-images');
CREATE POLICY "Users delete own comment-images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'comment-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS for course-materials: authenticated read, admin/teacher manage
CREATE POLICY "Auth read course-materials" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'course-materials');
CREATE POLICY "Admin upload course-materials" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'course-materials' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')));
CREATE POLICY "Admin delete course-materials" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'course-materials' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')));
```

## Phase 2: Update useStorage Hook

Add `comment-images` and `course-materials` to the `StorageBucket` type in `src/hooks/useStorage.ts`.

## Phase 3: PWA Enhancement

The PWA is already configured (`manifest.json`, `sw.js`, meta tags in `index.html`). Minor improvements:
- The service worker and manifest are functional
- Icons exist at `/icons/icon-192x192.png` and `/icons/icon-512x512.png`
- All PWA criteria are met (manifest, service worker, HTTPS via Lovable hosting)

No changes needed for PWA -- it's already installable.

## Phase 4: Capacitor Setup for APK

Install Capacitor dependencies and create config:
- Add `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`
- Create `capacitor.config.ts` with app ID `app.lovable.b37af6442649452885c0456243e70148`
- Server URL pointing to the Lovable preview for hot-reload during dev

**Post-implementation user steps:**
1. Export to GitHub, clone locally
2. `npm install` → `npx cap add android` → `npm run build` → `npx cap sync`
3. Open in Android Studio → Build APK

## Phase 5: Update memorywork.md

Document all changes: new buckets, Capacitor config, APK generation steps.

---

## Files to Modify
| File | Change |
|------|--------|
| SQL Migration | Create `comment-images` and `course-materials` buckets + RLS |
| `src/hooks/useStorage.ts` | Add new bucket types |
| `package.json` | Add Capacitor dependencies |
| `capacitor.config.ts` | New file - Capacitor config |
| `memorywork.md` | Documentation update |

## RLS Status
The profiles table RLS is already properly hardened:
- Users can only view/update their own profile
- Admins can view all profiles via `has_role()` function
- Public access is blocked
- No DELETE allowed

No additional RLS migration needed.

