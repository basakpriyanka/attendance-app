# Viva / Project Defense — Q&A Prep

## "Explain your tech stack"
- **Next.js** (React framework) for the frontend — handles routing between
  the login, student, and teacher pages automatically based on folder names
  inside `app/`.
- **Firebase Firestore** as the database — a NoSQL cloud database, meaning
  data is stored as flexible documents (like JSON objects) inside
  "collections," rather than rigid tables with fixed columns like SQL.
- **Tailwind CSS** for styling — utility classes directly in the markup
  instead of separate CSS files.
- **Vercel** for hosting — deploys directly from GitHub, free tier.

## "Why Firebase instead of a traditional SQL database?"
Firestore needs no server setup — it's fully managed, has a generous free
tier, and its JavaScript SDK works directly from the browser without
needing to build a separate backend API. For a project with a tight
deadline, this saved significant time compared to setting up
PostgreSQL/MySQL with an Express backend.

## "How does the login system work?"
When a user submits an ID and password, the app queries the `students`
collection for a matching `studentId`. If found, it checks the password.
If not found there, it checks the `teachers` collection the same way.
Once matched, the role, ID, and name are saved in the browser's
`localStorage`, and the user is redirected to `/student` or `/teacher`.

## "Is this secure?"
Honest answer: not fully — all students share one password, and all
teachers share another, rather than each person having their own. This
was a deliberate trade-off for speed given the project deadline. A
production version would use per-user passwords with proper hashing
(e.g., Firebase Authentication), so this is a known limitation, not an
oversight.

## "How is attendance data stored?"
Each time a teacher submits attendance for a subject on a given date,
one document is created in the `attendance` collection with:
```
{
  subject: "Math",
  date: "2026-07-11",
  records: { "101": "present", "102": "absent", ... }
}
```
The document ID is `subject_date` (e.g. `Math_2026-07-11`), so re-marking
the same subject/date overwrites the same document instead of creating
duplicates.

## "How is the attendance percentage calculated?"
For each subject, the app fetches every attendance document for that
subject, checks whether the logged-in student's ID appears in each
document's `records`, and counts how many times they were marked
"present" out of the total classes recorded. That's turned into a
percentage: `(present / total) * 100`.

## "How does exam eligibility work?"
A constant (`ELIGIBILITY_THRESHOLD = 60`) is compared against each
subject's calculated percentage. If it's below 60%, the student sees a
"Not eligible" badge instead of "Eligible for exam." This is calculated
live every time the student dashboard loads — it isn't a stored value,
so it's always accurate as new attendance is added.

## "Why did you choose 'Mark all present + tap absentees' instead of QR
codes or manual checkboxes?"
Most classes have far more present students than absent ones, so
defaulting everyone to "present" and only requiring taps for the
exceptions is faster for the teacher than checking every single name.
It also avoids the security concern of QR-based check-in, where a
student's QR code could be shared or scanned on someone else's behalf.

## "What is a PWA, and why did you use one?"
PWA stands for Progressive Web App — a website that can be "installed"
on a phone's home screen with its own icon, without going through an
app store. We added a `manifest.json` file that tells the browser the
app's name, icon, and how it should look when opened (full-screen,
no browser address bar), which gives it an app-like feel without the
overhead of native app development or app store approval delays.

## "What would you improve given more time?"
- Individual passwords per user with proper authentication (Firebase Auth)
- Attendance editing history / audit log (who changed what, when)
- Email or push notifications when attendance drops close to the cutoff
- Admin role to manage students/teachers without editing Firestore directly
- Automated tests for the percentage calculation logic
