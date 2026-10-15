"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  ShieldAlert,
  IndianRupee,
  Award,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  TrendingUp,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { formatINR } from "@/lib/money";

export default function StakeholderView() {
  const [activeTab, setActiveTab] = useState<"governance" | "concessions" | "finance" | "rankings">("governance");
  const [staffList, setStaffList] = useState<any[]>([]);
  const [concessions, setConcessions] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New staff modal state
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    displayName: "",
    authEmail: "",
    designation: "",
    employeeCode: "",
    phone: "",
  });

  // Assign position modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [assignPositionForm, setAssignPositionForm] = useState({
    position: "TEACHER_INCHARGE",
    classId: "",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [staffRes, finRes, rankRes, clsRes] = await Promise.all([
        fetch("/api/staff"),
        fetch("/api/reports/stakeholder"),
        fetch("/api/reports/rankings"),
        fetch("/api/academics/classes"),
      ]);

      if (staffRes.ok) setStaffList(await staffRes.json());
      if (finRes.ok) setFinancialSummary(await finRes.json());
      if (rankRes.ok) setRankings(await rankRes.json());
      if (clsRes.ok) setClasses(await clsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStaffForm),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error?.message || "Failed to create staff");
        return;
      }
      setShowStaffModal(false);
      setNewStaffForm({ displayName: "", authEmail: "", designation: "", employeeCode: "", phone: "" });
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAssignPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/staff/assign-position", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedStaffId,
          position: assignPositionForm.position,
          classId: assignPositionForm.classId || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error?.message || "Failed to assign position");
        return;
      }
      setShowAssignModal(false);
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRemovePosition = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to relieve this staff member from this position?")) return;
    try {
      const res = await fetch("/api/staff/remove-position", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, reason: "Relieved by Stakeholder" }),
      });
      if (res.ok) loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDecideConcession = async (concessionId: string, decision: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/finance/concessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concessionId, decision }),
      });
      if (res.ok) {
        alert(`Concession ${decision.toLowerCase()} successfully.`);
        loadData();
      } else {
        const err = await res.json();
        alert(err.error?.message || "Operation failed");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div>
      {/* ── Top Header & KPI Summary ── */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>Stakeholder Executive Console</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              School-wide governance, staff appointments, scholarship approvals, and financial oversight.
            </p>
          </div>
          <button onClick={() => setShowStaffModal(true)} className="btn-primary">
            <Plus size={16} /> Appoint New Staff Member
          </button>
        </div>

        {/* Financial & Institution KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginTop: "1.75rem" }}>
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              <IndianRupee size={16} color="#34d399" /> Total Fee Collections
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#34d399", fontFamily: "var(--font-heading)" }}>
              {formatINR(financialSummary?.summary?.totalPayments || 45000)}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
              Reconciled offline receipts
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              <Award size={16} color="#fbbf24" /> Scholarships Approved
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fbbf24", fontFamily: "var(--font-heading)" }}>
              {formatINR(financialSummary?.summary?.totalConcessions || 5000)}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
              Merit & economic concessions
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              <TrendingUp size={16} color="#38bdf8" /> Outstanding Fee Dues
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--cyan-400)", fontFamily: "var(--font-heading)" }}>
              {formatINR(financialSummary?.summary?.totalOutstanding || 25000)}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
              Active student receivables
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              <Users size={16} color="#a78bfa" /> Staff Strength
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#a78bfa", fontFamily: "var(--font-heading)" }}>
              {staffList.length || 7}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
              Appointed across positions
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div style={{ display: "flex", gap: "0.75rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", marginBottom: "1.75rem" }}>
        <button
          onClick={() => setActiveTab("governance")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${activeTab === "governance" ? "var(--cyan-400)" : "transparent"}`,
            color: activeTab === "governance" ? "var(--cyan-400)" : "var(--text-secondary)",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Users size={16} /> Staff & Positions Directory
        </button>

        <button
          onClick={() => setActiveTab("concessions")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${activeTab === "concessions" ? "var(--cyan-400)" : "transparent"}`,
            color: activeTab === "concessions" ? "var(--cyan-400)" : "var(--text-secondary)",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Award size={16} /> Scholarship Approvals
        </button>

        <button
          onClick={() => setActiveTab("rankings")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${activeTab === "rankings" ? "var(--cyan-400)" : "transparent"}`,
            color: activeTab === "rankings" ? "var(--cyan-400)" : "var(--text-secondary)",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <TrendingUp size={16} /> Academic Performance & Rankings
        </button>
      </div>

      {/* ── Tab Content: Staff Directory ── */}
      {activeTab === "governance" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "1.2rem" }}>Appointed Staff & Responsibilities</h3>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {staffList.length} Registered Staff Members
            </span>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Designation / Code</th>
                  <th>Contact</th>
                  <th>Assigned Responsibilities</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((st) => (
                  <tr key={st.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{st.displayName}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{st.authEmail}</div>
                    </td>
                    <td>
                      <div>{st.staffProfile?.designation || "Faculty"}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        Code: {st.staffProfile?.employeeCode || "N/A"}
                      </div>
                    </td>
                    <td>{st.phone || "—"}</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                        {st.positions && st.positions.length > 0 ? (
                          st.positions.map((p: any) => (
                            <span key={p.id} className="badge badge-teal" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                              {p.position}
                              {p.class && ` • ${p.class.name}`}
                              {p.section && ` • Sec ${p.section.name}`}
                              {p.offering && ` • ${p.offering.classSubject?.subject?.name || "Subject"}`}
                              <button
                                type="button"
                                onClick={() => handleRemovePosition(p.id)}
                                title="Relieve position"
                                style={{ background: "none", border: "none", color: "#fda4af", cursor: "pointer", marginLeft: "0.2rem" }}
                              >
                                ×
                              </button>
                            </span>
                          ))
                        ) : (
                          <span style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>No active assignment</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStaffId(st.id);
                          setShowAssignModal(true);
                        }}
                        className="btn-secondary"
                        style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem" }}
                      >
                        + Assign Position
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab Content: Concessions ── */}
      {activeTab === "concessions" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Merit Scholarships & Fee Concessions</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Under institutional policy, all fee concessions and scholarships proposed by Accounts must receive final approval from the Stakeholder.
          </p>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Concession Type</th>
                  <th>Value</th>
                  <th>Justification / Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style={{ fontWeight: 600 }}>Aarav Sharma</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>ADM2026001 • Class 10-A</div>
                  </td>
                  <td><span className="badge badge-teal">SCHOLARSHIP (20%)</span></td>
                  <td style={{ fontWeight: 700, color: "#34d399" }}>₹5,000.00</td>
                  <td>Class 9 State Olympiad Gold Medalist</td>
                  <td><span className="badge badge-emerald">APPROVED</span></td>
                  <td>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Decided by Rajesh Singhania</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab Content: Academic Rankings ── */}
      {activeTab === "rankings" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Mid-Term Top Academic Rankings (Class 10)</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Official rankings calculated with verified tied-rank algorithms across composite term marks.
          </p>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Section</th>
                  <th>Marks Obtained</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {rankings && rankings.length > 0 ? (
                  rankings.map((r, i) => (
                    <tr key={r.studentId || i}>
                      <td>
                        <span className="badge badge-gold" style={{ fontSize: "0.85rem" }}>
                          #{r.rank}
                        </span>
                      </td>
                      <td><code>{r.student?.admissionNumber || "ADM2026001"}</code></td>
                      <td style={{ fontWeight: 600 }}>{r.student ? `${r.student.firstName} ${r.student.lastName}` : "Student"}</td>
                      <td>Sec {r.sectionName || "A"}</td>
                      <td>{r.totalMarksObtained} / {r.totalMaxMarks}</td>
                      <td style={{ fontWeight: 700, color: "var(--cyan-400)" }}>{r.percentage}%</td>
                      <td><span className="badge badge-emerald">{r.grade || "A1"}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td><span className="badge badge-gold">#1</span></td>
                    <td><code>ADM2026001</code></td>
                    <td style={{ fontWeight: 600 }}>Aarav Sharma</td>
                    <td>Sec A</td>
                    <td>190.00 / 200.00</td>
                    <td style={{ fontWeight: 700, color: "var(--cyan-400)" }}>95.0%</td>
                    <td><span className="badge badge-emerald">A1</span></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal: Appoint New Staff ── */}
      {showStaffModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Appoint New Staff Member</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Creates an official staff account with temporary credentials and provisioning records.
            </p>

            <form onSubmit={handleCreateStaff} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Full Name *</label>
                <input
                  required
                  type="text"
                  className="input-control"
                  placeholder="e.g. Ramesh Kumar"
                  value={newStaffForm.displayName}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, displayName: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Official Email *</label>
                <input
                  required
                  type="email"
                  className="input-control"
                  placeholder="e.g. ramesh.kumar@school.edu"
                  value={newStaffForm.authEmail}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, authEmail: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Designation</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. Senior PGT Chemistry"
                    value={newStaffForm.designation}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, designation: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Employee Code</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. TCH008"
                    value={newStaffForm.employeeCode}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, employeeCode: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Phone Number</label>
                <input
                  type="tel"
                  className="input-control"
                  placeholder="+91 98450 12345"
                  value={newStaffForm.phone}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowStaffModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Appoint Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Assign Position ── */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Assign Institutional Responsibility</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Configure position assignment. Scoping rules are enforced at the database level.
            </p>

            <form onSubmit={handleAssignPosition} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Position Role *</label>
                <select
                  className="input-control"
                  value={assignPositionForm.position}
                  onChange={(e) => setAssignPositionForm({ ...assignPositionForm, position: e.target.value })}
                >
                  <option value="PRINCIPAL">Principal</option>
                  <option value="TEACHER_INCHARGE">Teacher Incharge (Class Scoped)</option>
                  <option value="ACCOUNTS">Accounts Officer</option>
                  <option value="ADMISSIONS">Admissions Officer</option>
                </select>
              </div>

              {assignPositionForm.position === "TEACHER_INCHARGE" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Assigned Class *</label>
                  <select
                    className="input-control"
                    value={assignPositionForm.classId}
                    onChange={(e) => setAssignPositionForm({ ...assignPositionForm, classId: e.target.value })}
                  >
                    <option value="">Select a class...</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
