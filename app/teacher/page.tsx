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

  // "Add student" form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoll, setNewRoll] = useState("");
  const [newReg, setNewReg] = useState("");
  const [newName, setNewName] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);
  const [addMessage, setAddMessage] = useState("");

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
      const savedRecords = existing.data().records || {};
      // Backfill any student not in the saved record (e.g. newly
      // added students) as "present" by default.
      const merged: Record<string, string> = { ...savedRecords };
      students.forEach((s) => {
        if (!merged[s.studentId]) {
          merged[s.studentId] = "present";
        }
      });
      setStatusMap(merged);
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

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    const roll = newRoll.trim();
    const reg = newReg.trim();
    const studentName = newName.trim();

    if (!roll || !studentName) {
      setAddMessage("Roll number and name are required.");
      return;
    }

    setAddingStudent(true);
    setAddMessage("");
    try {
      await setDoc(doc(db, "students", roll), {
        studentId: roll,
        regNo: reg,
        name: studentName,
        semester,
      });
      setAddMessage(`Added ${studentName} (Roll ${roll}).`);
      setNewRoll("");
      setNewReg("");
      setNewName("");
      // Refresh the list so the new student shows up immediately
      await loadStudents(teacherId, semester);
    } catch (err) {
      console.error(err);
      setAddMessage("Something went wrong while adding this student.");
    }
    setAddingStudent(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading students...
      </div>
    );
  }

  const presentCount = Object.values(statusMap).filter(
    (s) => s === "present"
  ).length;

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="max-w-xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-100">Hi, {name}</h1>
            <p className="text-sm text-gray-400">
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

        <p className="text-xs text-gray-500 mb-3">
          To mark a different semester or subject, log out and log back in
          with the new selection.
        </p>

        {/* Date selector */}
        <div className="bg-gray-800 rounded-lg shadow-md p-4 mb-4">
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-600 rounded-md px-2 py-2 text-sm bg-gray-700 text-gray-100"
          />
        </div>

        {/* Add student form */}
        <div className="bg-gray-800 rounded-lg shadow-md mb-4">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full flex justify-between items-center p-4 text-left"
          >
            <span className="text-sm font-medium text-gray-200">
              + Add a student to {semester} semester
            </span>
            <span className="text-gray-500 text-sm">
              {showAddForm ? "▲" : "▼"}
            </span>
          </button>

          {showAddForm && (
            <form
              onSubmit={handleAddStudent}
              className="border-t border-gray-700 p-4 space-y-3"
            >
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Roll number
                  </label>
                  <input
                    type="text"
                    value={newRoll}
                    onChange={(e) => setNewRoll(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 220370"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Registration no.
                  </label>
                  <input
                    type="text"
                    value={newReg}
                    onChange={(e) => setNewReg(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="optional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Rahim Uddin"
                  required
                />
              </div>

              <p className="text-xs text-gray-500">
                Will be added to {semester} semester. The student can then
                log in with this roll number and the shared student
                password.
              </p>

              <button
                type="submit"
                disabled={addingStudent}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50 text-sm"
              >
                {addingStudent ? "Adding..." : "Add student"}
              </button>

              {addMessage && (
                <p className="text-xs text-center text-gray-400">
                  {addMessage}
                </p>
              )}
            </form>
          )}
        </div>

        {/* Mark all present + live count */}
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={markAllPresent}
            className="text-sm bg-green-900 text-green-300 px-3 py-1.5 rounded-md hover:bg-green-800"
          >
            Mark all present
          </button>
          <span className="text-sm text-gray-400">
            {presentCount}/{students.length} marked present
          </span>
        </div>

        {/* Student list */}
        <div className="bg-gray-800 rounded-lg shadow-md divide-y divide-gray-700 mb-4">
          {students.length === 0 && (
            <p className="text-sm text-gray-500 p-4 text-center">
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
                  <p className="text-sm font-medium text-gray-100">
                    {s.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Roll: {s.studentId} &middot; Reg: {s.regNo}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    isPresent
                      ? "bg-green-900 text-green-300"
                      : "bg-red-900 text-red-300"
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
          <p className="text-center text-sm text-gray-300 mt-3">
            {savedMessage}
          </p>
        )}
      </div>
    </div>
  );
}
