import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus Attendance",
  description: "Attendance tracking for students and teachers",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
