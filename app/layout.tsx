import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "5 Point Engineering High School | Excellence in STEM & Academic Leadership",
  description:
    "CBSE Affiliated Senior Secondary School specializing in pure sciences, engineering foundation, robotics, and academic rigor in Bengaluru.",
  icons: {
    icon: "/favicon.ico",
  },
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
