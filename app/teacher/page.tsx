"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc, query, where } from "firebase/firestore";
import { ELIGIBILITY_THRESHOLD } from "@/lib/constants";

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Registration link generation
  const [linkExpiry, setLinkExpiry] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);
  const [linkMessage, setLinkMessage] = useState("");

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

  async function handleDeleteStudent(rollNumber: string) {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "students", rollNumber));
      setConfirmDeleteId(null);
      await loadStudents(teacherId, semester);
    } catch (err) {
      console.error(err);
      setAddMessage("Something went wrong while deleting this student.");
    }
    setDeleting(false);
  }

  async function handleExportNotEligible() {
    setExporting(true);
    try {
      const attendanceQuery = query(
        collection(db, "attendance"),
        where("teacherId", "==", teacherId),
        where("semester", "==", semester),
        where("subject", "==", subject)
      );
      const snapshot = await getDocs(attendanceQuery);
      const allRecords = snapshot.docs.map((d) => d.data());

      const rows = students.map((s) => {
        let total = 0;
        let present = 0;
        allRecords.forEach((r: any) => {
          const status = r.records ? r.records[s.studentId] : undefined;
          if (status === "present" || status === "absent") {
            total += 1;
            if (status === "present") present += 1;
          }
        });
        const percentage =
          total === 0 ? 100 : Math.round((present / total) * 100);
        return {
          roll: s.studentId,
          reg: s.regNo || "",
          name: s.name,
          percentage,
          eligible: percentage >= ELIGIBILITY_THRESHOLD,
        };
      });

      const notEligible = rows.filter((r) => !r.eligible);

      if (notEligible.length === 0) {
        setAddMessage("Everyone is eligible -- nothing to export.");
        setExporting(false);
        return;
      }

      const header = "Roll,Registration No,Name,Attendance %,Status\n";
      const csvBody = notEligible
        .map(
          (r) =>
            `${r.roll},${r.reg},"${r.name}",${r.percentage}%,Not Eligible`
        )
        .join("\n");
      const csvContent = header + csvBody;

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `not-eligible_${semester}_${subject}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setAddMessage("Something went wrong while exporting.");
    }
    setExporting(false);
  }

  function randomCode(length = 6) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I confusion
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  async function handleGenerateLink() {
    if (!linkExpiry) {
      setLinkMessage("Please pick a deadline first.");
      return;
    }
    const expiryDate = new Date(linkExpiry);
    if (expiryDate.getTime() <= Date.now()) {
      setLinkMessage("Deadline must be in the future.");
      return;
    }

    setGeneratingLink(true);
    setLinkMessage("");
    try {
      const code = randomCode();
      await setDoc(doc(db, "registrationLinks", code), {
        code,
        teacherId,
        semester,
        expiresAt: expiryDate.toISOString(),
        createdAt: new Date().toISOString(),
      });
      const link = `${window.location.origin}/register/${code}`;
      setGeneratedLink(link);
    } catch (err) {
      console.error(err);
      setLinkMessage("Something went wrong while generating the link.");
    }
    setGeneratingLink(false);
  }

  function copyLink() {
    navigator.clipboard.writeText(generatedLink);
    setLinkMessage("Copied to clipboard!");
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

        {/* Self-registration link generator */}
        <div className="bg-gray-800 rounded-lg shadow-md p-4 mb-4">
          <p className="text-sm font-medium text-gray-200 mb-2">
            Student self-registration link
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Students can use this link to add themselves to {semester}{" "}
            semester until the deadline you set. After it expires, you can
            still add or remove students manually below.
          </p>

          <div className="flex gap-2 mb-3">
            <input
              type="datetime-local"
              value={linkExpiry}
              onChange={(e) => setLinkExpiry(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleGenerateLink}
              disabled={generatingLink}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50 text-sm whitespace-nowrap"
            >
              {generatingLink ? "Generating..." : "Generate link"}
            </button>
          </div>

          {generatedLink && (
            <div className="flex gap-2 items-center bg-gray-700 rounded-md px-3 py-2">
              <span className="text-xs text-gray-200 truncate flex-1">
                {generatedLink}
              </span>
              <button
                onClick={copyLink}
                className="text-xs bg-gray-600 text-gray-200 px-2 py-1 rounded hover:bg-gray-500 whitespace-nowrap"
              >
                Copy
              </button>
            </div>
          )}

          {linkMessage && (
            <p className="text-xs text-gray-400 mt-2">{linkMessage}</p>
          )}
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
            const isConfirming = confirmDeleteId === s.studentId;
            return (
              <div
                key={s.studentId}
                className="w-full flex justify-between items-center px-4 py-3"
              >
                <button
                  onClick={() => toggleStudent(s.studentId)}
                  className="flex-1 text-left"
                >
                  <p className="text-sm font-medium text-gray-100">
                    {s.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Roll: {s.studentId} &middot; Reg: {s.regNo}
                  </p>
                </button>

                {isConfirming ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Delete?</span>
                    <button
                      onClick={() => handleDeleteStudent(s.studentId)}
                      disabled={deleting}
                      className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded-md hover:bg-red-800 disabled:opacity-50"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-md hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStudent(s.studentId)}
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        isPresent
                          ? "bg-green-900 text-green-300"
                          : "bg-red-900 text-red-300"
                      }`}
                    >
                      {isPresent ? "Present" : "Absent"}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(s.studentId)}
                      className="text-xs text-gray-500 hover:text-red-400 px-1"
                      title="Delete student"
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>
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

        <button
          onClick={handleExportNotEligible}
          disabled={exporting || students.length === 0}
          className="w-full mt-3 bg-gray-700 text-gray-200 py-2.5 rounded-md hover:bg-gray-600 transition disabled:opacity-50 text-sm"
        >
          {exporting
            ? "Preparing spreadsheet..."
            : `Export not-eligible list (${semester} - ${subject})`}
        </button>
      </div>
    </div>
  );
}
