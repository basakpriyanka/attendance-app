"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ELIGIBILITY_THRESHOLD } from "@/lib/constants";

export default function StudentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [group, setGroup] = useState("");
  const [loading, setLoading] = useState(true);
  const [subjectCards, setSubjectCards] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

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
    const studentQuery = query(
      collection(db, "students"),
      where("studentId", "==", id)
    );
    const studentSnapshot = await getDocs(studentQuery);

    if (studentSnapshot.empty) {
      setLoading(false);
      return;
    }

    const studentData = studentSnapshot.docs[0].data();
    const studentGroup = studentData.group || "";
    const studentSemester = studentData.semester || "";
    setGroup(studentGroup);

    // Every attendance session held for this student's semester --
    // regardless of which teacher ran it -- may include this student.
    const attendanceQuery = query(
      collection(db, "attendance"),
      where("semester", "==", studentSemester)
    );
    const snapshot = await getDocs(attendanceQuery);

    // Group attendance documents by "teacher - subject" so a student
    // sees separate stats for each course/teacher combination.
    const groups: Record<string, any[]> = {};
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data.records || data.records[id] === undefined) return;
      const key = `${data.subject} (${data.teacherId})`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(data);
    });

    const cards = Object.entries(groups).map(([key, records]) => {
      let total = 0;
      let present = 0;
      const history: { date: string; status: string }[] = [];

      records.forEach((r: any) => {
        const status = r.records ? r.records[id] : undefined;
        if (status === "present" || status === "absent") {
          total += 1;
          if (status === "present") present += 1;
          history.push({ date: r.date, status });
        }
      });

      history.sort((a, b) => (a.date < b.date ? 1 : -1));
      const percentage = total === 0 ? 100 : Math.round((present / total) * 100);

      return {
        key,
        totalClasses: total,
        presentCount: present,
        percentage,
        eligible: percentage >= ELIGIBILITY_THRESHOLD,
        history,
      };
    });

    setSubjectCards(cards);
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
            <p className="text-sm text-gray-500">
              Roll: {studentId} &middot; Group: {group}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-blue-600 hover:underline"
          >
            Logout
          </button>
        </div>

        {subjectCards.length === 0 ? (
          <p className="text-sm text-gray-400">
            No attendance recorded yet.
          </p>
        ) : (
          <div className="space-y-3">
            {subjectCards.map((card) => {
              const isExpanded = expanded === card.key;
              return (
                <div
                  key={card.key}
                  className="bg-white rounded-lg shadow-sm border border-gray-100"
                >
                  <button
                    onClick={() => setExpanded(isExpanded ? null : card.key)}
                    className="w-full flex justify-between items-center p-4 text-left"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{card.key}</p>
                      <p className="text-xs text-gray-400">
                        {card.presentCount}/{card.totalClasses} classes attended
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          card.eligible
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {card.percentage}%
                      </span>
                      <span className="text-gray-400 text-sm">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 py-3">
                      {card.history.length === 0 ? (
                        <p className="text-sm text-gray-400">
                          No classes recorded yet.
                        </p>
                      ) : (
                        <ul className="space-y-1">
                          {card.history.map((entry: any, idx: number) => (
                            <li
                              key={idx}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-gray-600">
                                {entry.date}
                              </span>
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
        )}
      </div>
    </div>
  );
}
