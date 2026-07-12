"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  STUDENT_PASSWORD,
  TEACHER_PASSWORD,
  SUBJECTS,
  SEMESTERS,
} from "@/lib/constants";

export default function LoginPage() {
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [semester, setSemester] = useState(SEMESTERS[0]);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleanId = id.trim();

      if (role === "student") {
        const studentQuery = query(
          collection(db, "students"),
          where("studentId", "==", cleanId)
        );
        const snapshot = await getDocs(studentQuery);

        if (snapshot.empty) {
          setError("ID not found");
          setLoading(false);
          return;
        }
        if (password !== STUDENT_PASSWORD) {
          setError("Incorrect password");
          setLoading(false);
          return;
        }
        const data = snapshot.docs[0].data();
        localStorage.setItem("userRole", "student");
        localStorage.setItem("userId", cleanId);
        localStorage.setItem("userName", data.name);
        router.push("/student");
        return;
      }

      // Teacher login
      const teacherQuery = query(
        collection(db, "teachers"),
        where("teacherId", "==", cleanId)
      );
      const snapshot = await getDocs(teacherQuery);

      if (snapshot.empty) {
        setError("ID not found");
        setLoading(false);
        return;
      }
      if (password !== TEACHER_PASSWORD) {
        setError("Incorrect password");
        setLoading(false);
        return;
      }
      const data = snapshot.docs[0].data();
      localStorage.setItem("userRole", "teacher");
      localStorage.setItem("userId", cleanId);
      localStorage.setItem("userName", data.name);
      localStorage.setItem("userSemester", semester);
      localStorage.setItem("userSubject", subject);
      router.push("/teacher");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <img
            src="/icon-512.png"
            alt="Mymensingh Engineering College logo"
            className="w-20 h-20 rounded-full"
          />
        </div>
        <h1 className="text-2xl font-bold mb-1 text-center text-gray-100">
          Mymensingh Engineering College
        </h1>
        <p className="text-sm text-gray-400 text-center mb-6">
          Attendance Portal &middot; Sign in with your ID
        </p>

        {/* Role toggle */}
        <div className="flex mb-5 bg-gray-700 rounded-md p-1">
          <button
            type="button"
            onClick={() => setRole("student")}
            className={`flex-1 text-sm py-1.5 rounded-md transition ${
              role === "student"
                ? "bg-blue-600 shadow text-white font-medium"
                : "text-gray-400"
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setRole("teacher")}
            className={`flex-1 text-sm py-1.5 rounded-md transition ${
              role === "teacher"
                ? "bg-blue-600 shadow text-white font-medium"
                : "text-gray-400"
            }`}
          >
            Teacher
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              {role === "student" ? "Roll number" : "Initials (e.g. AR)"}
            </label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={role === "student" ? "e.g. 220301" : "e.g. AR"}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
              required
            />
          </div>

          {role === "teacher" && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full border border-gray-600 rounded-md px-2 py-2 text-sm bg-gray-700 text-gray-100"
                >
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border border-gray-600 rounded-md px-2 py-2 text-sm bg-gray-700 text-gray-100"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
