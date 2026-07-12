"use client";

// This page exists ONLY to load student/teacher data into Firestore.
// Visit /seed in the browser and click the button one time.
// If you update the lists below and click the button again, it will
// just overwrite the existing entries with the same ID (safe to re-run).

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

const SAMPLE_STUDENTS = [
  { studentId: "220301", regNo: "2022555009", name: "Priyanka Basak", group: "1.AR" },
  { studentId: "220322", regNo: "2022655008", name: "Atika Israt Ethila", group: "1.AR" },
  { studentId: "220313", regNo: "2022955005", name: "Mugdhasree Paul", group: "1.AR" },

  { studentId: "220317", regNo: "2022955041", name: "MD. Mosharrof Hossain", group: "2.RAC" },
  { studentId: "220311", regNo: "2022555045", name: "Ehsanul Azam Sihab", group: "2.RAC" },
  { studentId: "220329", regNo: "2022655044", name: "Shahreer Islam Sayem", group: "2.RAC" },

  { studentId: "220342", regNo: "2022255048", name: "MD. Tanvir Hossain", group: "3.OZ" },
  { studentId: "220303", regNo: "2022555054", name: "Sairin Jaman Fahim", group: "3.OZ" },
  { studentId: "220357", regNo: "2022755052", name: "Ann Nur Tasnuha", group: "3.OZ" },

  { studentId: "220344", regNo: "2022455028", name: "Maisha Mubashshira", group: "4.LZ" },
  { studentId: "220309", regNo: "2022055022", name: "Md. Jubaer Hossain Fahad", group: "4.LZ" },
  { studentId: "220310", regNo: "2022455046", name: "Md. Fahim Hossain Abir", group: "4.LZ" },

  { studentId: "220330", regNo: "2022555027", name: "Md. Tamim Khan", group: "5.SSS" },
  { studentId: "220365", regNo: "1326", name: "Md. Sabbir Hossain", group: "5.SSS" },
  { studentId: "220343", regNo: "2022455055", name: "Rakib Hossain", group: "5.SSS" },

  { studentId: "220341", regNo: "2022855015", name: "Md. Golam Azam", group: "6.MH" },
  { studentId: "220334", regNo: "2022155049", name: "Mostaq Muzahid Mahi", group: "6.MH" },
  { studentId: "220349", regNo: "2022655017", name: "MD. Rabin Alam", group: "6.MH" },

  { studentId: "220307", regNo: "2022555036", name: "Amio Sarkar", group: "7.IH" },
  { studentId: "220355", regNo: "2022155030", name: "Salman Haider Sajib", group: "7.IH" },
  { studentId: "220347", regNo: "2022955050", name: "MD. Akram Hossen", group: "7.IH" },

  { studentId: "220337", regNo: "2022355047", name: "Arju Talukder Joy", group: "8.AR" },
  { studentId: "220318", regNo: "2022055013", name: "Md. Rana Ahmed", group: "8.AR" },
  { studentId: "220356", regNo: "2022355038", name: "Enamul Hasan", group: "8.AR" },

  { studentId: "220331", regNo: "2022155058", name: "Rajdeep Mondal Rudra", group: "9.RAC" },
  { studentId: "220304", regNo: "2022155003", name: "Md. Shahariar Najim Chowdhury", group: "9.RAC" },
  { studentId: "220354", regNo: "2022055040", name: "Joyanta Kumar Roy Joy", group: "9.RAC" },

  { studentId: "220353", regNo: "2022255057", name: "Jahidul Islam", group: "10.OZ" },
  { studentId: "220336", regNo: "2022755025", name: "Mohammad Rifat", group: "10.OZ" },
  { studentId: "220324", regNo: "2022155012", name: "Abdullah Al Muaz", group: "10.OZ" },

  { studentId: "220320", regNo: "2022255011", name: "Asfaqur Rahman Khan", group: "11.LZ" },
  { studentId: "220305", regNo: "2022955023", name: "Sayed Tahsan-Al-Fabian", group: "11.LZ" },
  { studentId: "220321", regNo: "2022855042", name: "Md. Shahriyar Ahammed Joy", group: "11.LZ" },

  { studentId: "220348", regNo: "2022855051", name: "Md. Morshed Hawlader", group: "12.SSS" },
  { studentId: "220325", regNo: "2022855006", name: "Md. Naeem Hossen", group: "12.SSS" },
  { studentId: "220333", regNo: "2022355029", name: "MD. Nafiul Islam", group: "12.SSS" },

  { studentId: "220328", regNo: "2022755043", name: "S.M. Jahirul Islam Bayazed", group: "13.MH" },
  { studentId: "220368", regNo: "1342", name: "Abdullah Al Jihad", group: "13.MH" },
  { studentId: "220363", regNo: "1346", name: "Naine Naine Won", group: "13.MH" },

  { studentId: "220302", regNo: "2022755007", name: "Zarin Tasnim", group: "14.IH" },
  { studentId: "220359", regNo: "2022155021", name: "Nusrat Zahan", group: "14.IH" },
  { studentId: "220362", regNo: "1321", name: "MD. Zahidul Islam Asif", group: "14.IH" },

  { studentId: "220335", regNo: "2022555018", name: "Johana Hossain", group: "15.OZ" },
  { studentId: "220352", regNo: "2022455037", name: "Sadia Islam", group: "15.OZ" },
  { studentId: "220308", regNo: "2022955032", name: "Nafisa Rahman Nazmoni", group: "15.OZ" },

  { studentId: "220312", regNo: "2022755034", name: "Fareha Aysha Shammey", group: "16.SSS" },
  { studentId: "220316", regNo: "2022055031", name: "Nishat Tasnim Etu", group: "16.SSS" },
  { studentId: "220306", regNo: "2022855060", name: "Tasnim Hasan", group: "16.SSS" },

  { studentId: "220367", regNo: "1315", name: "Ruhul Ma Ani Mazumder", group: "17.LZ" },
  { studentId: "220366", regNo: "1319", name: "Md. Shahadat Hossain Khan", group: "17.LZ" },
  { studentId: "220340", regNo: "2022655026", name: "Md. Sagor Islam", group: "17.LZ" },
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
    setStatus(`Adding ${SAMPLE_STUDENTS.length} students...`);

    for (const student of SAMPLE_STUDENTS) {
      await setDoc(doc(db, "students", student.studentId), student);
    }

    setStatus("Adding teachers...");
    for (const teacher of SAMPLE_TEACHERS) {
      await setDoc(doc(db, "teachers", teacher.teacherId), teacher);
    }

    setStatus(
      `Done! ${SAMPLE_STUDENTS.length} students and ${SAMPLE_TEACHERS.length} teachers added.`
    );
    setRunning(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-lg font-bold mb-2 text-gray-800">
          Seed Class Data
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          Click below to add your class's students and teachers to the
          database. Safe to click again later if you update the list.
        </p>
        <button
          onClick={handleSeed}
          disabled={running}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {running ? "Adding..." : "Seed Class Data"}
        </button>
        {status && <p className="text-sm text-gray-600 mt-4">{status}</p>}

        <div className="text-left mt-6 text-xs text-gray-400 border-t pt-4">
          <p className="font-medium text-gray-500 mb-1">Login info:</p>
          <p>Student: your Roll number, password: student123</p>
          <p>Teacher: ID T1 or T2, password: teacher123</p>
        </div>
      </div>
    </div>
  );
}
