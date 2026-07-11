import { ELIGIBILITY_THRESHOLD } from "@/lib/constants";

// Takes the raw attendance documents for one subject (each doc = one day's
// roll call) and one student's ID, and works out that student's stats
// for the subject: how many classes held, how many attended, and %.
export function calculateSubjectStats(attendanceDocs, studentId) {
  let totalClasses = 0;
  let presentCount = 0;
  const history = [];

  attendanceDocs.forEach((doc) => {
    const data = doc.data();
    const status = data.records ? data.records[studentId] : undefined;

    // Only count days where this student was actually recorded
    if (status === "present" || status === "absent") {
      totalClasses += 1;
      if (status === "present") presentCount += 1;
      history.push({ date: data.date, status });
    }
  });

  const percentage =
    totalClasses === 0 ? 100 : Math.round((presentCount / totalClasses) * 100);

  // Sort history newest first
  history.sort((a, b) => (a.date < b.date ? 1 : -1));

  return {
    totalClasses,
    presentCount,
    percentage,
    eligible: percentage >= ELIGIBILITY_THRESHOLD,
    history,
  };
}

// Combines stats across all subjects into one overall percentage.
export function calculateOverallStats(subjectStatsMap) {
  let totalClasses = 0;
  let presentCount = 0;

  Object.values(subjectStatsMap).forEach((stats) => {
    totalClasses += stats.totalClasses;
    presentCount += stats.presentCount;
  });

  const percentage =
    totalClasses === 0 ? 100 : Math.round((presentCount / totalClasses) * 100);

  return {
    totalClasses,
    presentCount,
    percentage,
    eligible: percentage >= ELIGIBILITY_THRESHOLD,
  };
}
