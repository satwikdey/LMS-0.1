"use client";

import React, { useState } from "react";
import {
  UserPlus,
  Inbox,
  CheckCircle2,
  FileCheck,
  PhoneCall,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function AdmissionsView() {
  const [activeTab, setActiveTab] = useState<"enquiries" | "applications" | "enrollment">("enquiries");
  const [enquiries, setEnquiries] = useState([
    {
      id: "enq-1",
      number: "ENQ-2026-0001",
      studentName: "Aditya Varma",
      guardianName: "Manoj Varma",
      phone: "+91 98450 33445",
      grade: "Class 10",
      source: "WEBSITE",
      status: "NEW",
    },
    {
      id: "enq-2",
      number: "ENQ-2026-0002",
      studentName: "Ananya Iyer",
      guardianName: "Ganesh Iyer",
      phone: "+91 98450 55667",
      grade: "Class 11 (Science)",
      source: "WALK_IN",
      status: "FOLLOW_UP",
    },
  ]);

  const [enrolledNotice, setEnrolledNotice] = useState<string | null>(null);

  const handleEnrollDemo = (studentName: string) => {
    const admNo = `ADM202600${Math.floor(4 + Math.random() * 5)}`;
    setEnrolledNotice(`Successfully enrolled ${studentName} with Admission Number: ${admNo}. Student portal credentials provisioned!`);
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>Admissions Directorate</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Public enquiry processing, admissions pipeline, financial clearance audit, and student matriculation.
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginTop: "1.75rem" }}>
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              New Website Enquiries
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--cyan-400)" }}>
              {enquiries.length} Pending
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--teal-400)", marginTop: "0.25rem" }}>
              Ready for counselor outreach
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              Enrolled This Session
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#34d399" }}>
              3 Students
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Aarav, Diya & Rohan (Class 10)
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              Financial Clearance Rate
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fbbf24" }}>
              100%
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Cleared before matriculation
            </div>
          </div>
        </div>
      </div>

      {enrolledNotice && (
        <div
          style={{
            padding: "1rem 1.5rem",
            borderRadius: "10px",
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#34d399",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <CheckCircle2 size={20} />
            <div>{enrolledNotice}</div>
          </div>
          <button onClick={() => setEnrolledNotice(null)} className="btn-secondary" style={{ padding: "0.3rem 0.7rem", fontSize: "0.8rem" }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.75rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", marginBottom: "1.75rem" }}>
        <button
          onClick={() => setActiveTab("enquiries")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${activeTab === "enquiries" ? "var(--cyan-400)" : "transparent"}`,
            color: activeTab === "enquiries" ? "var(--cyan-400)" : "var(--text-secondary)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Incoming Inquiries
        </button>
        <button
          onClick={() => setActiveTab("applications")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${activeTab === "applications" ? "var(--cyan-400)" : "transparent"}`,
            color: activeTab === "applications" ? "var(--cyan-400)" : "var(--text-secondary)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Cleared Applications Ready to Enroll
        </button>
      </div>

      {/* Tab 1: Enquiries */}
      {activeTab === "enquiries" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Online & Walk-In Admission Leads</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Enquiry Ref</th>
                  <th>Student Name</th>
                  <th>Parent / Guardian</th>
                  <th>Phone Number</th>
                  <th>Target Grade</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((enq) => (
                  <tr key={enq.id}>
                    <td><code>{enq.number}</code></td>
                    <td style={{ fontWeight: 600 }}>{enq.studentName}</td>
                    <td>{enq.guardianName}</td>
                    <td>{enq.phone}</td>
                    <td><span className="badge badge-teal">{enq.grade}</span></td>
                    <td>
                      <span className={enq.status === "NEW" ? "badge badge-cyan" : "badge badge-gold"}>
                        {enq.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleEnrollDemo(enq.studentName)}
                        className="btn-secondary"
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                      >
                        Start Application →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Applications */}
      {activeTab === "applications" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Financial Clearance & Final Enrollment</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            The system strictly requires mandatory admission fees to be satisfied in the ledger before admitting students.
          </p>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Applied Grade</th>
                  <th>Assigned Fee Plan</th>
                  <th>Financial Clearance</th>
                  <th>Enrollment Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style={{ fontWeight: 600 }}>Kiran Desai</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Guardian: Vijay Desai</div>
                  </td>
                  <td>Class 10 - Sec A</td>
                  <td>Class 10 Regular (Term 1 ₹25,000)</td>
                  <td>
                    <span className="badge badge-emerald" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      <ShieldCheck size={14} /> CLEARED BY ACCOUNTS
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleEnrollDemo("Kiran Desai")}
                      className="btn-primary"
                      style={{ padding: "0.4rem 0.85rem", fontSize: "0.82rem" }}
                    >
                      <UserPlus size={14} /> Finalize Matriculation
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
