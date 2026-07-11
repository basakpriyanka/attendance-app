"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { STUDENT_PASSWORD, TEACHER_PASSWORD } from "@/lib/constants";

export default function LoginPage() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleanId = id.trim();

      // 1. Check if this ID belongs to a student
      const studentQuery = query(
        collection(db, "students"),
        where("studentId", "==", cleanId)
      );
      const studentSnapshot = await getDocs(studentQuery);

      if (!studentSnapshot.empty) {
        if (password !== STUDENT_PASSWORD) {
          setError("Incorrect password");
          setLoading(false);
          return;
        }
        const studentData = studentSnapshot.docs[0].data();
        localStorage.setItem("userRole", "student");
        localStorage.setItem("userId", cleanId);
        localStorage.setItem("userName", studentData.name);
        router.push("/student");
        return;
      }

      // 2. Check if this ID belongs to a teacher
      const teacherQuery = query(
        collection(db, "teachers"),
        where("teacherId", "==", cleanId)
      );
      const teacherSnapshot = await getDocs(teacherQuery);

      if (!teacherSnapshot.empty) {
        if (password !== TEACHER_PASSWORD) {
          setError("Incorrect password");
          setLoading(false);
          return;
        }
        const teacherData = teacherSnapshot.docs[0].data();
        localStorage.setItem("userRole", "teacher");
        localStorage.setItem("userId", cleanId);
        localStorage.setItem("userName", teacherData.name);
        router.push("/teacher");
        return;
      }

      // Neither student nor teacher matched this ID
      setError("ID not found");
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1 text-center text-gray-800">
          Campus Attendance
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Sign in with your ID
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID
            </label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 101 or T1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Students use the student password. Teachers use the teacher password.
        </p>
      </div>
    </div>
  );
}
