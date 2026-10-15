"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  Save,
  CheckCircle2,
} from "lucide-react";

interface StudentRecord {
  id: string;
  admissionNumber: string;
  name: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY";
  remarks?: string;
}

export default function SectionHeadView({ sectionId }: { sectionId?: string }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<StudentRecord[]>([
    { id: "s1", admissionNumber: "ADM2026001", name: "Aarav Sharma", status: "PRESENT" },
    { id: "s2", admissionNumber: "ADM2026002", name: "Diya Patel", status: "PRESENT" },
  ]);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusChange = (studentId: string, status: any) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
    setIsSaved(false);
  };

  const markAll = (status: any) => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
    setIsSaved(false);
  };

  const handleSaveAttendance = async () => {
    setIsSubmitting(true);
    try {
      // Calls section attendance endpoint
      const res = await fetch("/api/operations/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: sectionId || "sec10A",
          date: selectedDate,
          records: students.map((s) => ({
            studentId: s.id,
            status: s.status,
            remarks: s.remarks,
          })),
        }),
      });

      // Show success feedback
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const presentCount = students.filter((s) => s.status === "PRESENT").length;

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>Section Head Console (Class 10 - Sec A)</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Daily roll call, section roster tracking, and attendance records.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <input
              type="date"
              className="input-control"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: "auto" }}
            />
            <button onClick={handleSaveAttendance} disabled={isSubmitting} className="btn-primary">
              <Save size={16} /> {isSubmitting ? "Saving..." : isSaved ? "Saved!" : "Save Attendance"}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginTop: "1.75rem" }}>
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              Total Section Roster
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{students.length} Students</div>
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              Marked Present Today
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#34d399" }}>
              {presentCount} / {students.length}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              Attendance Rate
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--cyan-400)" }}>
              {((presentCount / students.length) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Sheet */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h3 style={{ fontSize: "1.2rem" }}>Daily Roll Call Register</h3>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Date: {selectedDate}</div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => markAll("PRESENT")} className="btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.82rem" }}>
              Mark All Present
            </button>
            <button onClick={() => markAll("ABSENT")} className="btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.82rem" }}>
              Mark All Absent
            </button>
          </div>
        </div>

        {isSaved && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#34d399",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
              fontSize: "0.88rem",
            }}
          >
            <CheckCircle2 size={16} /> Attendance sheet successfully saved for {selectedDate}.
          </div>
        )}

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Roll / Admission</th>
                <th>Student Full Name</th>
                <th>Attendance Status</th>
                <th>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st, i) => (
                <tr key={st.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>Roll #{i + 1}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{st.admissionNumber}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{st.name}</td>
                  <td>
                    <span
                      className={
                        st.status === "PRESENT"
                          ? "badge badge-emerald"
                          : st.status === "ABSENT"
                          ? "badge badge-rose"
                          : st.status === "LATE"
                          ? "badge badge-gold"
                          : "badge badge-purple"
                      }
                    >
                      {st.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(st.id, "PRESENT")}
                        style={{
                          background: st.status === "PRESENT" ? "rgba(16, 185, 129, 0.25)" : "transparent",
                          border: "1px solid rgba(16, 185, 129, 0.4)",
                          color: "#34d399",
                          borderRadius: "4px",
                          padding: "0.3rem 0.6rem",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(st.id, "ABSENT")}
                        style={{
                          background: st.status === "ABSENT" ? "rgba(244, 63, 94, 0.25)" : "transparent",
                          border: "1px solid rgba(244, 63, 94, 0.4)",
                          color: "#fda4af",
                          borderRadius: "4px",
                          padding: "0.3rem 0.6rem",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Absent
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(st.id, "LATE")}
                        style={{
                          background: st.status === "LATE" ? "rgba(245, 158, 11, 0.25)" : "transparent",
                          border: "1px solid rgba(245, 158, 11, 0.4)",
                          color: "#fbbf24",
                          borderRadius: "4px",
                          padding: "0.3rem 0.6rem",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Late
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
