# Campus Attendance App — Setup Guide

## What's in this zip
```
app/
  page.tsx            -> Login page (entry point)
  layout.tsx           -> Root layout, loads global styles + PWA manifest
  globals.css           -> Tailwind styles
  student/page.tsx     -> Student dashboard (view-only)
  teacher/page.tsx     -> Teacher dashboard (mark attendance)
  seed/page.tsx         -> One-time helper page to add sample data
lib/
  firebase.js           -> Connects the app to your Firestore database
  constants.js           -> Subjects list, passwords, eligibility threshold
  attendance.js          -> Functions that calculate attendance percentages
public/
  manifest.json          -> Makes the app installable on phones (PWA)
  icon-192.png, icon-512.png -> Placeholder app icons (swap for your campus logo)
```

## How to install this into your existing project

1. Unzip this file.
2. Copy the `app`, `lib`, and `public` folders into your existing
   `attendance-app` project folder, **overwriting** files with the same name
   when asked. Your `node_modules` and `package.json` are untouched.
3. In your project terminal, make sure the dev server is running:
   ```
   npm run dev
   ```
4. Open `http://localhost:3000/seed` in your browser and click
   **"Seed Sample Data"** — this adds sample students and teachers into
   your Firestore database (only do this once).
5. Go to `http://localhost:3000` and log in with:
   - Student: ID `101`, `102`, or `103`, password `student123`
   - Teacher: ID `T1` or `T2`, password `teacher123`

## How the app works (short version)

- **Login (`app/page.tsx`)**: takes an ID + password, checks the `students`
  collection first, then the `teachers` collection in Firestore. If a match
  is found and the password is correct, it saves the role/ID/name in the
  browser's `localStorage` and redirects to the right dashboard.
- **Teacher dashboard**: teacher picks a subject + date, sees the student
  list defaulted to "Present," taps anyone who's absent, then saves. This
  writes one document to the `attendance` collection per subject+date.
- **Student dashboard**: reads every `attendance` document for each subject,
  counts how many times the logged-in student was marked present vs total
  classes, and calculates a percentage. If it's below 60%, the student is
  marked "Not eligible."
- **PWA (`manifest.json`)**: tells the phone browser this app can be
  "installed" with an icon on the home screen, so it behaves a bit like a
  native app.

## To use your own campus logo
Replace `public/icon-192.png` and `public/icon-512.png` with your logo
(same file names, ideally square images). You can also add your campus
name into the login page title in `app/page.tsx`.

## Adding real students/teachers later
Either:
- Edit the sample list inside `app/seed/page.tsx` and visit `/seed` again, or
- Add documents directly in the Firebase Console under the `students` and
  `teachers` collections, matching the same field names (`studentId`,
  `name` / `teacherId`, `name`, `subjects`).
