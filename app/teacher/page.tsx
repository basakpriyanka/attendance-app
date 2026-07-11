"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { SUBJECTS } from "@/lib/constants";

function todayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function TeacherPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [date, setDate] = useState(todayString());
  // statusMap: { studentId: "present" | "absent" }
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const storedName = localStorage.getItem("userName");

    if (role !== "teacher") {
      router.push("/");
      return;
    }
    setName(storedName || "");
    loadStudents();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      loadExistingAttendance(subject, date);
    }
  }, [subject, date, students]);

  async function loadStudents() {
    const snapshot = await getDocs(collection(db, "students"));
    const list = snapshot.docs.map((d) => d.data());
    list.sort((a, b) => a.studentId.localeCompare(b.studentId));
    setStudents(list);
    setLoading(false);
  }

  // If attendance for this subject+date was already marked earlier today,
  // load it so the teacher can review/edit instead of starting blank.
  async function loadExistingAttendance(subj: string, dt: string) {
    const docId = `${subj}_${dt}`;
    const existing = await getDoc(doc(db, "attendance", docId));

    if (existing.exists()) {
      setStatusMap(existing.data().records || {});
    } else {
      // Default: mark everyone present, teacher only taps the absentees
      const defaults: Record<string, string> = {};
      students.forEach((s) => {
        defaults[s.studentId] = "present";
      });
      setStatusMap(defaults);
    }
    setSavedMessage("");
  }

  function toggleStudent(studentId: string) {
    setStatusMap((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  }

  function markAllPresent() {
    const all: Record<string, string> = {};
    students.forEach((s) => {
      all[s.studentId] = "present";
    });
    setStatusMap(all);
  }

  async function handleSubmit() {
    setSaving(true);
    const docId = `${subject}_${date}`;
    try {
      await setDoc(doc(db, "attendance", docId), {
        subject,
        date,
        records: statusMap,
      });
      setSavedMessage("Attendance saved successfully.");
    } catch (err) {
      console.error(err);
      setSavedMessage("Something went wrong while saving.");
    }
    setSaving(false);
  }

  function handleLogout() {
    localStorage.clear();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading students...
      </div>
    );
  }

  const presentCount = Object.values(statusMap).filter(
    (s) => s === "present"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Hi, {name}</h1>
            <p className="text-sm text-gray-500">Mark attendance</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-blue-600 hover:underline"
          >
            Logout
          </button>
        </div>

        {/* Subject + date selectors */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
            />
          </div>
        </div>

        {/* Mark all present + live count */}
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={markAllPresent}
            className="text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-md hover:bg-green-200"
          >
            Mark all present
          </button>
          <span className="text-sm text-gray-500">
            {presentCount}/{students.length} marked present
          </span>
        </div>

        {/* Student list */}
        <div className="bg-white rounded-lg shadow-md divide-y divide-gray-100 mb-4">
          {students.map((s) => {
            const status = statusMap[s.studentId] || "present";
            const isPresent = status === "present";
            return (
              <button
                key={s.studentId}
                onClick={() => toggleStudent(s.studentId)}
                className="w-full flex justify-between items-center px-4 py-3 text-left"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {s.name}
                  </p>
                  <p className="text-xs text-gray-400">ID: {s.studentId}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    isPresent
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {isPresent ? "Present" : "Absent"}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save attendance"}
        </button>

        {savedMessage && (
          <p className="text-center text-sm text-gray-600 mt-3">
            {savedMessage}
          </p>
        )}
      </div>
    </div>
  );
}
