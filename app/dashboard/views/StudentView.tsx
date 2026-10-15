"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  BookOpen,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  IndianRupee,
  Bell,
  FileText,
  AlertCircle,
} from "lucide-react";
import { formatINR } from "@/lib/money";

export default function StudentView({ studentInfo }: { studentInfo?: any }) {
  const [activeTab, setActiveTab] = useState<"academics" | "homework" | "reportCards" | "fees">("academics");

  return (
    <div>
      {/* ── Student Header Profile ── */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
              <span className="badge badge-teal">Academic Session 2026-2027</span>
              <span className="badge badge-cyan">Class 10 • Section A</span>
            </div>
            <h1 style={{ fontSize: "2.2rem", marginBottom: "0.3rem" }}>
              Welcome back, Aarav Sharma
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Admission Number: <code style={{ color: "var(--cyan-400)" }}>ADM2026001</code> • Roll #1
            </p>
          </div>

          <div
            style={{
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "10px",
              padding: "0.75rem 1.25rem",
              textAlign: "right",
            }}
          >
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Current Attendance</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#34d399" }}>98.5%</div>
            <div style={{ fontSize: "0.75rem", color: "#34d399" }}>Excellent Standing</div>
          </div>
        </div>

        {/* Quick Highlights */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginTop: "1.75rem" }}>
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              Term Academic Rank
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fbbf24" }}>
              #1 in Class
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Mid-Term Score: 95.0% (A1)
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              Coursework Submissions
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--cyan-400)" }}>
              All Submitted
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              0 Missing Assignments
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              Fee Account Status
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#34d399" }}>
              ₹0 Dues (Term 1)
            </div>
            <div style={{ fontSize: "0.78rem", color: "#34d399", marginTop: "0.25rem" }}>
              Merit Scholarship Applied
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.75rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", marginBottom: "1.75rem" }}>
        <button
          onClick={() => setActiveTab("academics")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${activeTab === "academics" ? "var(--cyan-400)" : "transparent"}`,
            color: activeTab === "academics" ? "var(--cyan-400)" : "var(--text-secondary)",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <BookOpen size={16} /> Enrolled Subjects
        </button>

        <button
          onClick={() => setActiveTab("homework")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${activeTab === "homework" ? "var(--cyan-400)" : "transparent"}`,
            color: activeTab === "homework" ? "var(--cyan-400)" : "var(--text-secondary)",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <FileText size={16} /> Coursework & Physical Submissions
        </button>

        <button
          onClick={() => setActiveTab("reportCards")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${activeTab === "reportCards" ? "var(--cyan-400)" : "transparent"}`,
            color: activeTab === "reportCards" ? "var(--cyan-400)" : "var(--text-secondary)",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Award size={16} /> Official Report Cards
        </button>

        <button
          onClick={() => setActiveTab("fees")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${activeTab === "fees" ? "var(--cyan-400)" : "transparent"}`,
            color: activeTab === "fees" ? "var(--cyan-400)" : "var(--text-secondary)",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <IndianRupee size={16} /> Fee Account & Receipts
        </button>
      </div>

      {/* Tab 1: Subjects */}
      {activeTab === "academics" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <span className="badge badge-teal" style={{ marginBottom: "0.5rem" }}>MATH10 • CORE</span>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "0.3rem" }}>Mathematics</h3>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Instructor: John Doe
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Curriculum: Polynomials, Quadratic Equations, Coordinate Geometry, Trigonometry.
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <span className="badge badge-teal" style={{ marginBottom: "0.5rem" }}>SCI10 • CORE</span>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "0.3rem" }}>Science (Physics, Chem, Bio)</h3>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Instructor: Priya Nair
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Curriculum: Chemical Reactions, Acids & Bases, Optics, Electricity & Magnetism.
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <span className="badge badge-teal" style={{ marginBottom: "0.5rem" }}>ENG10 • CORE</span>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "0.3rem" }}>English Language & Literature</h3>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Instructor: Faculty Assigned
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Curriculum: Critical Reading, Prose, Poetry, Formal Discourse & Rhetoric.
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <span className="badge badge-teal" style={{ marginBottom: "0.5rem" }}>SST10 • CORE</span>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "0.3rem" }}>Social Science</h3>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Instructor: Faculty Assigned
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Curriculum: Contemporary India, Democratic Politics, Economic Development.
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Coursework & Physical Submissions */}
      {activeTab === "homework" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Coursework Submission History</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Submissions are made physically in class and reviewed directly by your subject instructor.
          </p>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Subject</th>
                  <th>Due Date</th>
                  <th>Submission Status</th>
                  <th>Marks Scored</th>
                  <th>Teacher Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style={{ fontWeight: 600 }}>Chemical Reactions Lab Observation Journal</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Displacement reactions with balanced molecular equations
                    </div>
                  </td>
                  <td>Science</td>
                  <td>28 Aug 2026</td>
                  <td><span className="badge badge-emerald">SUBMITTED ON TIME</span></td>
                  <td style={{ fontWeight: 700, color: "var(--cyan-400)" }}>24.00 / 25.00</td>
                  <td style={{ fontSize: "0.85rem" }}>Exceptional diagrams and reaction stoichiometry.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Official Report Cards */}
      {activeTab === "reportCards" && (
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <span className="badge badge-gold" style={{ marginBottom: "0.5rem" }}>PUBLISHED RESULT</span>
              <h2 style={{ fontSize: "1.6rem" }}>Mid-Term Examination Report Card (2026)</h2>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                Class 10 • Section A • Academic Year 2026-2027
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Overall Performance</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--cyan-400)", fontFamily: "var(--font-heading)" }}>
                95.0% (A1)
              </div>
              <div style={{ fontSize: "0.82rem", color: "#fbbf24", fontWeight: 600 }}>Rank #1 in Class</div>
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject Code & Name</th>
                  <th>Pass Marks</th>
                  <th>Max Marks</th>
                  <th>Marks Obtained</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>MATH10 • Mathematics</td>
                  <td>35.00</td>
                  <td>100.00</td>
                  <td style={{ fontWeight: 700, color: "var(--cyan-400)" }}>96.00</td>
                  <td><span className="badge badge-emerald">A1</span></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>SCI10 • Science</td>
                  <td>35.00</td>
                  <td>100.00</td>
                  <td style={{ fontWeight: 700, color: "var(--cyan-400)" }}>94.00</td>
                  <td><span className="badge badge-emerald">A1</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Fees */}
      {activeTab === "fees" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Student Fee Ledger & Receipts</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            All tuition charges, scholarships, and verified offline payments.
          </p>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Entry Description</th>
                  <th>Amount</th>
                  <th>Allocation / Type</th>
                  <th>Date & Reference</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Term 1 Tuition & Admission Charge</strong></td>
                  <td>₹25,000.00</td>
                  <td><span className="badge badge-rose">CHARGE</span></td>
                  <td>Due 10 Apr 2026</td>
                </tr>
                <tr>
                  <td><strong>20% Academic Merit Scholarship</strong></td>
                  <td style={{ color: "#34d399", fontWeight: 600 }}>-₹5,000.00</td>
                  <td><span className="badge badge-gold">CONCESSION</span></td>
                  <td>Approved by Stakeholder (Olympiad Gold)</td>
                </tr>
                <tr>
                  <td><strong>Term 1 Settlement Payment</strong></td>
                  <td style={{ color: "#34d399", fontWeight: 700 }}>-₹20,000.00</td>
                  <td><span className="badge badge-emerald">PAYMENT (UPI)</span></td>
                  <td>Receipt: <code>REC-2026-0001</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
