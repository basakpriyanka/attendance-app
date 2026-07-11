// Central place for app-wide constants.
// Keeping this in one file makes it easy to change later
// (e.g. add more subjects, or change passwords).

export const SUBJECTS = ["Math", "Physics"];

export const STUDENT_PASSWORD = "student123";
export const TEACHER_PASSWORD = "teacher123";

// A student needs at least this percentage attendance
// in a subject to be allowed to sit the exam.
export const ELIGIBILITY_THRESHOLD = 60;
