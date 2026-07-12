"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function RegisterPage() {
  const params = useParams();
  const code = (params?.code as string) || "";

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [semester, setSemester] = useState("");
  const [expiredMessage, setExpiredMessage] = useState("");

  const [roll, setRoll] = useState("");
  const [reg, setReg] = useState("");
  const [studentName, setStudentName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    checkLink();
  }, [code]);

  async function checkLink() {
    if (!code) {
      setLoading(false);
      return;
    }
    try {
      const linkDoc = await getDoc(doc(db, "registrationLinks", code));
      if (!linkDoc.exists()) {
        setExpiredMessage("This registration link is invalid.");
        setLoading(false);
        return;
      }
      const data = linkDoc.data();
      const expiresAt = new Date(data.expiresAt).getTime();
      if (Date.now() > expiresAt) {
        setExpiredMessage(
          "This registration link has expired. Please contact your teacher."
        );
        setLoading(false);
        return;
      }
      setSemester(data.semester);
      setValid(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setExpiredMessage("Something went wrong checking this link.");
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanRoll = roll.trim();
    const cleanName = studentName.trim();

    if (!cleanRoll || !cleanName) {
      setErrorMessage("Roll number and name are required.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    try {
      await setDoc(doc(db, "students", cleanRoll), {
        studentId: cleanRoll,
        regNo: reg.trim(),
        name: cleanName,
        semester,
      });
      setSuccessMessage(
        `You're registered, ${cleanName}! You can now log in with roll number ${cleanRoll}.`
      );
      setRoll("");
      setReg("");
      setStudentName("");
    } catch (err) {
      console.error(err);
      setErrorMessage("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400">
        Checking link...
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-sm text-center">
          <p className="text-red-400 font-medium">{expiredMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-xl font-bold mb-1 text-center text-gray-100">
          Student Registration
        </h1>
        <p className="text-sm text-gray-400 text-center mb-6">
          {semester} semester
        </p>

        {successMessage ? (
          <p className="text-sm text-green-400 text-center">
            {successMessage}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Roll number
              </label>
              <input
                type="text"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 220370"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Registration number
              </label>
              <input
                type="text"
                value={reg}
                onChange={(e) => setReg(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Full name
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Rahim Uddin"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submitting ? "Registering..." : "Register"}
            </button>

            {errorMessage && (
              <p className="text-red-400 text-sm text-center">
                {errorMessage}
              </p>
            )}
          </form>
        )}

        <p className="text-xs text-gray-500 text-center mt-6">
          Your password to log in will be the shared student password given
          by your teacher.
        </p>
      </div>
    </div>
  );
}
