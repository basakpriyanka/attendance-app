// Central place for app-wide constants.

// Teacher initials -- also used as their login ID and as the "group
// code" that links them to specific student groups (e.g. group "1.AR"
// belongs to teacher AR).
export const TEACHER_CODES = ["AR", "RAC", "OZ", "LZ", "SSS", "MH", "IH"];

// Subjects a teacher can choose from when marking attendance.
export const SUBJECTS = ["DBMS-1", "DAA-1", "DT", "CAO", "IM"];

// Semester options shown in the login dropdown.
export const SEMESTERS = [
  "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th",
];

export const STUDENT_PASSWORD = "student123";
export const TEACHER_PASSWORD = "teacher123";

// A student needs at least this percentage attendance
// to be allowed to sit the exam.
export const ELIGIBILITY_THRESHOLD = 60;
