"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";

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
  const [teacherId, setTeacherId] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [date, setDate] = useState(todayString());
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const id = localStorage.getItem("userId");
    const storedName = localStorage.getItem("userName");
    const storedSemester = localStorage.getItem("userSemester");
    const storedSubject = localStorage.getItem("userSubject");

    if (role !== "teacher" || !id || !storedSemester || !storedSubject) {
      router.push("/");
      return;
    }
    setTeacherId(id);
    setName(storedName || "");
    setSemester(storedSemester);
    setSubject(storedSubject);
    loadStudents(id, storedSemester);
  }, []);

  useEffect(() => {
    if (students.length > 0 && teacherId && semester && subject) {
      loadExistingAttendance(teacherId, semester, subject, date);
    }
  }, [date, students]);

  // All students in the semester the teacher selected at login --
  // not filtered by group, since a subject class includes the whole
  // semester regardless of project group.
  async function loadStudents(code: string, sem: string) {
    const snapshot = await getDocs(collection(db, "students"));
    const list = snapshot.docs
      .map((d) => d.data())
      .filter((s: any) => s.semester === sem);
    list.sort((a: any, b: any) => a.studentId.localeCompare(b.studentId));
    setStudents(list);
    setLoading(false);
  }

  async function loadExistingAttendance(
    code: string,
    sem: string,
    subj: string,
    dt: string
  ) {
    const docId = `${code}_${sem}_${subj}_${dt}`;
    const existing = await getDoc(doc(db, "attendance", docId));

    if (existing.exists()) {
      setStatusMap(existing.data().records || {});
    } else {
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
    const docId = `${teacherId}_${semester}_${subject}_${date}`;
    try {
      await setDoc(doc(db, "attendance", docId), {
        teacherId,
        semester,
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
            <p className="text-sm text-gray-500">
              {semester} semester &middot; {subject} &middot; Group {teacherId}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-blue-600 hover:underline"
          >
            Logout
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-3">
          To mark a different semester or subject, log out and log back in
          with the new selection.
        </p>

        {/* Date selector */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
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
          {students.length === 0 && (
            <p className="text-sm text-gray-400 p-4 text-center">
              No students found for {semester} semester.
            </p>
          )}
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
                  <p className="text-xs text-gray-400">
                    Roll: {s.studentId} &middot; Reg: {s.regNo}
                  </p>
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
          disabled={saving || students.length === 0}
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
