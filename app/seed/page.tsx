"use client";

// This page exists ONLY to load sample data into Firestore, once.
// Visit /seed in the browser and click the button one time.
// After that, you can delete this whole "seed" folder if you want
// (it's not part of the real app, just a setup helper).

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

const SAMPLE_STUDENTS = [
  { studentId: "101", name: "Rahim" },
  { studentId: "102", name: "Karim" },
  { studentId: "103", name: "Fatima" },
];

const SAMPLE_TEACHERS = [
  { teacherId: "T1", name: "Prof. Ahmed", subjects: ["Math"] },
  { teacherId: "T2", name: "Prof. Sultana", subjects: ["Physics"] },
];

export default function SeedPage() {
  const [status, setStatus] = useState("");
  const [running, setRunning] = useState(false);

  async function handleSeed() {
    setRunning(true);
    setStatus("Adding students...");

    for (const student of SAMPLE_STUDENTS) {
      await setDoc(doc(db, "students", student.studentId), student);
    }

    setStatus("Adding teachers...");
    for (const teacher of SAMPLE_TEACHERS) {
      await setDoc(doc(db, "teachers", teacher.teacherId), teacher);
    }

    setStatus("Done! Sample students and teachers have been added.");
    setRunning(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-lg font-bold mb-2 text-gray-800">
          Seed Sample Data
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          Click below to add sample students and teachers to your database.
          Only do this once.
        </p>
        <button
          onClick={handleSeed}
          disabled={running}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {running ? "Adding..." : "Seed Sample Data"}
        </button>
        {status && <p className="text-sm text-gray-600 mt-4">{status}</p>}

        <div className="text-left mt-6 text-xs text-gray-400 border-t pt-4">
          <p className="font-medium text-gray-500 mb-1">Sample logins:</p>
          <p>Student: ID 101 / 102 / 103, password: student123</p>
          <p>Teacher: ID T1 / T2, password: teacher123</p>
        </div>
      </div>
    </div>
  );
}
