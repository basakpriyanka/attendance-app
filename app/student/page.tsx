"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { SUBJECTS } from "@/lib/constants";
import { calculateSubjectStats, calculateOverallStats } from "@/lib/attendance";

export default function StudentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [subjectStats, setSubjectStats] = useState<Record<string, any>>({});
  const [overall, setOverall] = useState<any>(null);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const id = localStorage.getItem("userId");
    const storedName = localStorage.getItem("userName");

    if (role !== "student" || !id) {
      router.push("/");
      return;
    }

    setStudentId(id);
    setName(storedName || "");
    loadAttendance(id);
  }, []);

  async function loadAttendance(id: string) {
    const statsMap: Record<string, any> = {};

    for (const subject of SUBJECTS) {
      const attendanceQuery = query(
        collection(db, "attendance"),
        where("subject", "==", subject)
      );
      const snapshot = await getDocs(attendanceQuery);
      statsMap[subject] = calculateSubjectStats(snapshot.docs, id);
    }

    setSubjectStats(statsMap);
    setOverall(calculateOverallStats(statsMap));
    setLoading(false);
  }

  function handleLogout() {
    localStorage.clear();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading your attendance...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Hi, {name}</h1>
            <p className="text-sm text-gray-500">ID: {studentId}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-blue-600 hover:underline"
          >
            Logout
          </button>
        </div>

        {/* Overall summary card */}
        <div className="bg-white rounded-lg shadow-md p-5 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Overall attendance</p>
              <p className="text-3xl font-bold text-gray-800">
                {overall.percentage}%
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                overall.eligible
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {overall.eligible ? "Eligible for exam" : "Not eligible"}
            </span>
          </div>
        </div>

        {/* Subject-wise breakdown */}
        <h2 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
          Subject-wise breakdown
        </h2>
        <div className="space-y-3">
          {SUBJECTS.map((subject) => {
            const stats = subjectStats[subject];
            const isExpanded = expandedSubject === subject;
            return (
              <div
                key={subject}
                className="bg-white rounded-lg shadow-sm border border-gray-100"
              >
                <button
                  onClick={() =>
                    setExpandedSubject(isExpanded ? null : subject)
                  }
                  className="w-full flex justify-between items-center p-4 text-left"
                >
                  <div>
                    <p className="font-medium text-gray-800">{subject}</p>
                    <p className="text-xs text-gray-400">
                      {stats.presentCount}/{stats.totalClasses} classes attended
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-semibold ${
                        stats.eligible ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {stats.percentage}%
                    </span>
                    <span className="text-gray-400 text-sm">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    {stats.history.length === 0 ? (
                      <p className="text-sm text-gray-400">
                        No classes recorded yet.
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {stats.history.map((entry: any, idx: number) => (
                          <li
                            key={idx}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-gray-600">{entry.date}</span>
                            <span
                              className={
                                entry.status === "present"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {entry.status === "present"
                                ? "Present"
                                : "Absent"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
