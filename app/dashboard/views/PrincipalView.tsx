"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Layers,
  BookOpen,
  UserCheck,
  CheckCircle,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function PrincipalView() {
  const [activeTab, setActiveTab] = useState<"years" | "classes" | "incharges" | "promotions">("classes");
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Class Form Modal
  const [showClassModal, setShowClassModal] = useState(false);
  const [newClassForm, setNewClassForm] = useState({
    name: "",
    level: 9,
    hasStreams: false,
    academicYearId: "",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [yrRes, clsRes, stfRes] = await Promise.all([
        fetch("/api/academics/years"),
        fetch("/api/academics/classes"),
        fetch("/api/staff"),
      ]);

      if (yrRes.ok) {
        const yData = await yrRes.json();
        setAcademicYears(yData);
        if (yData.length > 0 && !newClassForm.academicYearId) {
          const activeYr = yData.find((y: any) => y.status === "ACTIVE") || yData[0];
          setNewClassForm((prev) => ({ ...prev, academicYearId: activeYr.id }));
        }
      }
      if (clsRes.ok) setClasses(await clsRes.json());
      if (stfRes.ok) setStaff(await stfRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/academics/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClassForm),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error?.message || "Failed to create class");
        return;
      }
      setShowClassModal(false);
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>Principal Academic Office</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Academic structure oversight, incharge appointments, and institutional curriculum alignment.
            </p>
          </div>
          <button onClick={() => setShowClassModal(true)} className="btn-primary">
            <Plus size={16} /> Add Class to Academic Year
          </button>
        </div>

        {/* Quick Academic Indicators */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginTop: "1.75rem" }}>
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
              Active Academic Year
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--cyan-400)" }}>
              2026-2027
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--teal-400)", marginTop: "0.25rem" }}>
              Status: ACTIVE (In Session)
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
              Total Classes Configured
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>
              {classes.length || 2}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Class 10 & Class 11 (Streams)
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
              Teacher Incharges Assigned
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#34d399" }}>
              1 Active
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Sunita Sharma (Class 10)
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.75rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", marginBottom: "1.75rem" }}>
        <button
          onClick={() => setActiveTab("classes")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${activeTab === "classes" ? "var(--cyan-400)" : "transparent"}`,
            color: activeTab === "classes" ? "var(--cyan-400)" : "var(--text-secondary)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Classes & Sections Setup
        </button>
        <button
          onClick={() => setActiveTab("years")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${activeTab === "years" ? "var(--cyan-400)" : "transparent"}`,
            color: activeTab === "years" ? "var(--cyan-400)" : "var(--text-secondary)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Academic Years Lifecycle
        </button>
        <button
          onClick={() => setActiveTab("promotions")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${activeTab === "promotions" ? "var(--cyan-400)" : "transparent"}`,
            color: activeTab === "promotions" ? "var(--cyan-400)" : "var(--text-secondary)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Year-End Promotions
        </button>
      </div>

      {/* Classes & Sections */}
      {activeTab === "classes" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem" }}>
          {classes.map((cls) => (
            <div key={cls.id} className="glass-panel" style={{ padding: "1.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.3rem" }}>{cls.name}</h3>
                  <div style={{ fontSize: "0.82rem", color: "var(--cyan-400)" }}>Grade Level {cls.level}</div>
                </div>
                {cls.hasStreams ? (
                  <span className="badge badge-purple">STREAM-BASED</span>
                ) : (
                  <span className="badge badge-teal">UNIFIED CORE</span>
                )}
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                  Active Sections:
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {cls.sections && cls.sections.length > 0 ? (
                    cls.sections.map((s: any) => (
                      <div
                        key={s.id}
                        style={{
                          background: "rgba(30, 41, 59, 0.6)",
                          padding: "0.4rem 0.8rem",
                          borderRadius: "6px",
                          fontSize: "0.85rem",
                          border: "1px solid rgba(255, 255, 255, 0.05)",
                        }}
                      >
                        Section {s.name} (Cap: {s.capacity})
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No sections configured</div>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                  Curriculum Subjects:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {cls.subjects && cls.subjects.length > 0 ? (
                    cls.subjects.map((cs: any) => (
                      <span key={cs.id} className="badge badge-cyan" style={{ textTransform: "none" }}>
                        {cs.subject?.name || cs.subject?.code} ({cs.type})
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Mathematics, Science, English, SST</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Academic Years Lifecycle */}
      {activeTab === "years" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Institutional Academic Years</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Academic Year</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {academicYears.map((y) => (
                  <tr key={y.id}>
                    <td style={{ fontWeight: 600 }}>{y.name}</td>
                    <td>{new Date(y.startDate).toLocaleDateString("en-IN")}</td>
                    <td>{new Date(y.endDate).toLocaleDateString("en-IN")}</td>
                    <td>
                      <span
                        className={
                          y.status === "ACTIVE"
                            ? "badge badge-emerald"
                            : y.status === "PLANNED"
                            ? "badge badge-cyan"
                            : "badge badge-gold"
                        }
                      >
                        {y.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Promotions Confirmation */}
      {activeTab === "promotions" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Annual Promotion Confirmations</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Teacher Incharges prepare promotion decisions at the end of the academic year. The Principal reviews academic records and provides final institutional confirmation.
          </p>
          <div
            style={{
              padding: "2rem",
              borderRadius: "10px",
              background: "rgba(15, 23, 42, 0.5)",
              border: "1px dashed rgba(255, 255, 255, 0.1)",
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            Academic Year 2026-2027 is currently in progress. Promotion submissions will unlock after the Annual Examination.
          </div>
        </div>
      )}

      {/* Modal: Add Class */}
      {showClassModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Add Class to Academic Year</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Define a new class level. Sections and subjects can be linked once created.
            </p>

            <form onSubmit={handleCreateClass} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Class Name *</label>
                <input
                  required
                  type="text"
                  className="input-control"
                  placeholder="e.g. Class 12"
                  value={newClassForm.name}
                  onChange={(e) => setNewClassForm({ ...newClassForm, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Grade Level (Integer) *</label>
                <input
                  required
                  type="number"
                  className="input-control"
                  value={newClassForm.level}
                  onChange={(e) => setNewClassForm({ ...newClassForm, level: Number(e.target.value) })}
                />
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.88rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={newClassForm.hasStreams}
                    onChange={(e) => setNewClassForm({ ...newClassForm, hasStreams: e.target.checked })}
                  />
                  <span>Supports Streams (Science, Commerce, Arts)</span>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowClassModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
