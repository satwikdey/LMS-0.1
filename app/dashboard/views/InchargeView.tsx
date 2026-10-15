"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Award,
  Users,
  CheckCircle2,
  Plus,
  Send,
  FileText,
  Calendar,
} from "lucide-react";

export default function InchargeView({ classId }: { classId?: string }) {
  const [activeTab, setActiveTab] = useState<"exams" | "reports" | "sections">("exams");
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New exam modal
  const [showExamModal, setShowExamModal] = useState(false);
  const [newExamForm, setNewExamForm] = useState({
    name: "Final Term Examination 2027",
    category: "ANNUAL",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const clsRes = await fetch("/api/academics/classes");
      if (clsRes.ok) {
        const clsData = await clsRes.json();
        setClasses(clsData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePublishResults = async (examId: string) => {
    if (!confirm("Are you sure you want to publish report cards for this exam? Published cards will be visible to students in their portal.")) return;
    try {
      const res = await fetch("/api/operations/publish-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId }),
      });
      if (res.ok) {
        alert("Report cards successfully published and distributed to student portals!");
      } else {
        const err = await res.json();
        alert(err.error?.message || "Failed to publish exam results");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>Class 10 Academic Incharge</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Overseeing Class 10 sections, examinations, marks compilation, and official report card publishing.
            </p>
          </div>
          <button onClick={() => setShowExamModal(true)} className="btn-primary">
            <Plus size={16} /> Schedule Class Examination
          </button>
        </div>

        {/* Status Indicators */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginTop: "1.75rem" }}>
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
              Assigned Grade Scope
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--cyan-400)" }}>
              Class 10 (Secondary)
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Sections: 10-A, 10-B
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
              Latest Term Examination
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#34d399" }}>
              Mid-Term 2026
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--teal-400)", marginTop: "0.25rem" }}>
              Status: PUBLISHED (Report cards live)
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
              Enrolled Students
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fbbf24" }}>
              3 Active
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Across Section A & Section B
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.75rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", marginBottom: "1.75rem" }}>
        <button
          onClick={() => setActiveTab("exams")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${activeTab === "exams" ? "var(--cyan-400)" : "transparent"}`,
            color: activeTab === "exams" ? "var(--cyan-400)" : "var(--text-secondary)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Examinations & Papers
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${activeTab === "reports" ? "var(--cyan-400)" : "transparent"}`,
            color: activeTab === "reports" ? "var(--cyan-400)" : "var(--text-secondary)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Published Report Cards
        </button>
      </div>

      {/* Tab 1: Exams */}
      {activeTab === "exams" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Scheduled Class Examinations</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam Title</th>
                  <th>Category</th>
                  <th>Included Papers</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style={{ fontWeight: 600 }}>Mid-Term Examination 2026</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Class-wide composite examination</div>
                  </td>
                  <td><span className="badge badge-purple">HALF_YEARLY</span></td>
                  <td>Mathematics (100 Marks), Science (100 Marks)</td>
                  <td><span className="badge badge-emerald">PUBLISHED</span></td>
                  <td>
                    <button
                      onClick={() => handlePublishResults("exam-midterm-10")}
                      className="btn-secondary"
                      style={{ padding: "0.4rem 0.8rem", fontSize: "0.82rem" }}
                    >
                      <Send size={14} /> Re-Publish Cards
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Report Cards */}
      {activeTab === "reports" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Mid-Term 2026 Class 10 Report Cards</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Generated student report cards with verified marks, composite percentages, grades, and section rankings.
          </p>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Section</th>
                  <th>Score Summary</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                  <th>Rank in Section</th>
                  <th>Rank in Class</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style={{ fontWeight: 600 }}>Aarav Sharma</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>ADM2026001</div>
                  </td>
                  <td>Sec A</td>
                  <td>190.00 / 200.00</td>
                  <td style={{ fontWeight: 700, color: "var(--cyan-400)" }}>95.0%</td>
                  <td><span className="badge badge-emerald">A1</span></td>
                  <td>Rank #1</td>
                  <td><span className="badge badge-gold">#1 in Class</span></td>
                </tr>
                <tr>
                  <td>
                    <div style={{ fontWeight: 600 }}>Diya Patel</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>ADM2026002</div>
                  </td>
                  <td>Sec A</td>
                  <td>179.00 / 200.00</td>
                  <td style={{ fontWeight: 700, color: "var(--cyan-400)" }}>89.5%</td>
                  <td><span className="badge badge-emerald">A2</span></td>
                  <td>Rank #2</td>
                  <td><span className="badge badge-gold">#2 in Class</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
