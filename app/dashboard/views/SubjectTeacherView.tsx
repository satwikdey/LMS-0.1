"use client";

import React, { useState } from "react";
import {
  BookOpen,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  Plus,
  Save,
  Award,
} from "lucide-react";

export default function SubjectTeacherView({ offeringInfo }: { offeringInfo?: any }) {
  const [activeTab, setActiveTab] = useState<"coursework" | "submissions" | "marks">("coursework");
  const [showCourseworkModal, setShowCourseworkModal] = useState(false);
  const [newCwForm, setNewCwForm] = useState({
    title: "",
    description: "",
    kind: "HOMEWORK",
    maxMarks: 20,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  });

  const [submissions, setSubmissions] = useState([
    {
      studentId: "s3",
      admissionNumber: "ADM2026003",
      name: "Rohan Gupta",
      status: "SUBMITTED",
      marksObtained: "18",
      remarks: "Very clean step-by-step factoring.",
    },
  ]);

  const [marksSaved, setMarksSaved] = useState(false);

  const handleCreateCoursework = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Coursework assignment published for the class!");
    setShowCourseworkModal(false);
  };

  const handleSaveSubmissions = () => {
    setMarksSaved(true);
    setTimeout(() => setMarksSaved(false), 3000);
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>
              Subject Teacher Workspace
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Curriculum delivery, homework sets, physical submission registers, and exam marks.
            </p>
          </div>

          <button onClick={() => setShowCourseworkModal(true)} className="btn-primary">
            <Plus size={16} /> Create Coursework / Homework
          </button>
        </div>

        {/* Offering Badge Banner */}
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem 1.5rem",
            borderRadius: "10px",
            background: "rgba(14, 165, 233, 0.1)",
            border: "1px solid rgba(14, 165, 233, 0.25)",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "rgba(14, 165, 233, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--cyan-400)",
            }}
          >
            <BookOpen size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem" }}>
              Active Offering: Mathematics (Class 10 - Section B)
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Subject Code: MATH10 • Core Curriculum • Capacity: 40 Students
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.75rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", marginBottom: "1.75rem" }}>
        <button
          onClick={() => setActiveTab("coursework")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${activeTab === "coursework" ? "var(--cyan-400)" : "transparent"}`,
            color: activeTab === "coursework" ? "var(--cyan-400)" : "var(--text-secondary)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Published Coursework
        </button>
        <button
          onClick={() => setActiveTab("submissions")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${activeTab === "submissions" ? "var(--cyan-400)" : "transparent"}`,
            color: activeTab === "submissions" ? "var(--cyan-400)" : "var(--text-secondary)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Physical Submission Register
        </button>
      </div>

      {/* Tab 1: Coursework */}
      {activeTab === "coursework" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Assigned Problem Sets & Homework</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title & Description</th>
                  <th>Type</th>
                  <th>Max Marks</th>
                  <th>Due Date</th>
                  <th>Submission Progress</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style={{ fontWeight: 600 }}>Quadratic Equations Problem Set 1</div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      Solve problems 1 through 15 from Chapter 4 in your standard textbook. Show all derivation steps.
                    </div>
                  </td>
                  <td><span className="badge badge-teal">HOMEWORK</span></td>
                  <td>20.00</td>
                  <td>25 Aug 2026</td>
                  <td>
                    <span className="badge badge-emerald">1 / 1 Recorded</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Physical Submissions */}
      {activeTab === "submissions" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h3 style={{ fontSize: "1.2rem" }}>Physical Submission Log</h3>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                Task: Quadratic Equations Problem Set 1 (Max: 20 Marks)
              </div>
            </div>

            <button onClick={handleSaveSubmissions} className="btn-primary" style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>
              <Save size={15} /> Save Marks & Remarks
            </button>
          </div>

          {marksSaved && (
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
              <CheckCircle2 size={16} /> Physical submission entries saved successfully!
            </div>
          )}

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Submission Status</th>
                  <th>Marks (Max 20)</th>
                  <th>Teacher Remarks</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.studentId}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{s.admissionNumber}</div>
                    </td>
                    <td>
                      <select
                        className="input-control"
                        style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem", width: "auto" }}
                        value={s.status}
                        onChange={(e) =>
                          setSubmissions((prev) =>
                            prev.map((item) =>
                              item.studentId === s.studentId ? { ...item, status: e.target.value } : item
                            )
                          )
                        }
                      >
                        <option value="SUBMITTED">SUBMITTED</option>
                        <option value="LATE">LATE</option>
                        <option value="MISSING">MISSING</option>
                        <option value="EXCUSED">EXCUSED</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input-control"
                        style={{ width: "90px", padding: "0.4rem 0.6rem" }}
                        value={s.marksObtained}
                        onChange={(e) =>
                          setSubmissions((prev) =>
                            prev.map((item) =>
                              item.studentId === s.studentId ? { ...item, marksObtained: e.target.value } : item
                            )
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="input-control"
                        style={{ padding: "0.4rem 0.6rem" }}
                        value={s.remarks}
                        onChange={(e) =>
                          setSubmissions((prev) =>
                            prev.map((item) =>
                              item.studentId === s.studentId ? { ...item, remarks: e.target.value } : item
                            )
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: New Coursework */}
      {showCourseworkModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Create New Coursework / Homework</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Publish an assignment to all enrolled students in your offering.
            </p>

            <form onSubmit={handleCreateCoursework} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Title *</label>
                <input
                  required
                  type="text"
                  className="input-control"
                  placeholder="e.g. Derivation of Quadratic Formula"
                  value={newCwForm.title}
                  onChange={(e) => setNewCwForm({ ...newCwForm, title: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Instructions / Details</label>
                <textarea
                  rows={3}
                  className="input-control"
                  placeholder="Provide textbook pages, specific questions, or project steps..."
                  value={newCwForm.description}
                  onChange={(e) => setNewCwForm({ ...newCwForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Type</label>
                  <select
                    className="input-control"
                    value={newCwForm.kind}
                    onChange={(e) => setNewCwForm({ ...newCwForm, kind: e.target.value })}
                  >
                    <option value="HOMEWORK">Homework</option>
                    <option value="ASSIGNMENT">Assignment / Project</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Max Marks</label>
                  <input
                    type="number"
                    className="input-control"
                    value={newCwForm.maxMarks}
                    onChange={(e) => setNewCwForm({ ...newCwForm, maxMarks: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Due Date</label>
                <input
                  type="date"
                  className="input-control"
                  value={newCwForm.dueDate}
                  onChange={(e) => setNewCwForm({ ...newCwForm, dueDate: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowCourseworkModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Publish Coursework
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
