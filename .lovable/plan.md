

# Plan: APK Generation Guide, Download Page & Error Fixes

## Current State
- Capacitor is already installed and configured (`capacitor.config.ts` exists with correct appId and appName)
- PWA manifest and service worker are in place
- No console errors or network errors detected
- The service worker cache name still says `refresh-academy-v1` (stale branding)
- `DEPLOY.md` still references "Sadhguru Coaching Centre" (stale branding)

## What Will Be Done

### 1. Fix Service Worker Branding
Update `public/sw.js` cache name from `refresh-academy-v1` to `sadguru-coaching-v1`.

### 2. Fix DEPLOY.md Branding
Update title from "Sadhguru Coaching Centre" to "Sadguru Coaching Classes".

### 3. Create Download/Install Guide Page
Create a new page at `/install` (`src/pages/Install.tsx`) that:
- Detects if user is on Android, iOS, or desktop
- Shows platform-specific installation instructions
- For Android: "Install as PWA" instructions + link to download APK from GitHub release
- For iOS: Safari "Add to Home Screen" instructions
- For Desktop: Browser install instructions
- Clean, branded UI matching the app's design system

### 4. Add Route for Install Page
Add `/install` route in `src/App.tsx`.

### 5. Create APK Build Documentation
Create `docs/APK-BUILD-GUIDE.md` with step-by-step instructions:

```text
APK Generation Flow:
┌──────────────┐    ┌──────────┐    ┌──────────────┐
│ Export to     │───>│ npm      │───>│ npx cap add  │
│ GitHub       │    │ install  │    │ android      │
└──────────────┘    └──────────┘    └──────────────┘
                                          │
┌──────────────┐    ┌──────────┐    ┌─────▼────────┐
│ Upload APK   │<───│ Build in │<───│ npx cap sync │
│ to Release   │    │ Studio   │    │              │
└──────────────┘    └──────────┘    └──────────────┘
```

Steps documented:
1. Export to GitHub, clone locally
2. `npm install`
3. `npx cap add android`
4. `npm run build && npx cap sync`
5. `npx cap open android`
6. Build → Build APK in Android Studio
7. Create GitHub release, attach APK

### 6. Update DEPLOY.md
Add Capacitor/APK section to existing deployment docs.

### 7. Update memorywork.md
Document APK guide creation and install page.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/Install.tsx` | Create — download/install guide page |
| `src/App.tsx` | Add `/install` route |
| `docs/APK-BUILD-GUIDE.md` | Create — full APK build documentation |
| `public/sw.js` | Fix cache name branding |
| `DEPLOY.md` | Update branding + add Capacitor section |
| `memorywork.md` | Document changes |

