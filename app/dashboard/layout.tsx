"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Bell,
  LogOut,
  ChevronDown,
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  Shield,
  User,
  ArrowRight,
} from "lucide-react";
import { DashboardProvider, useDashboard, type PositionInfo } from "./DashboardContext";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { account, positions, student, activePosition, setActivePosition, isLoading, logout } =
    useDashboard();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Fetch notifications if user is loaded
    if (account) {
      fetch("/api/reports/alerts")
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []);
    }
  }, [account]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-space)",
          color: "var(--text-secondary)",
          fontFamily: "var(--font-heading)",
          fontSize: "1.1rem",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #0ea5e9, #14b8a6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "pulse 1.5s infinite",
            }}
          >
            <GraduationCap size={28} color="#fff" />
          </div>
          <span>Loading 5 Point Engineering Portal...</span>
        </div>
      </div>
    );
  }

  const formatPositionLabel = (pos: PositionInfo) => {
    switch (pos.position) {
      case "STAKEHOLDER":
        return "Stakeholder / Trustee";
      case "PRINCIPAL":
        return "Principal";
      case "TEACHER_INCHARGE":
        return `Incharge (${pos.class?.name || "Class"})`;
      case "SECTION_HEAD":
        return `Section Head (${pos.section?.name || "Section"})`;
      case "SUBJECT_TEACHER":
        const subj = pos.offering?.classSubject?.subject?.name || "Subject";
        const sec = pos.offering?.section?.name || "";
        return `Teacher (${subj} • Sec ${sec})`;
      case "ACCOUNTS":
        return "Accounts Officer";
      case "ADMISSIONS":
        return "Admissions Officer";
      default:
        return pos.position;
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-space)" }}>
      {/* ── Top Portal Navigation Bar ── */}
      <header
        style={{
          background: "var(--bg-primary)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "0.75rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Brand & Academic Year Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #0ea5e9, #14b8a6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <GraduationCap size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontFamily: "var(--font-heading)", fontSize: "1.05rem" }}>
                5 Point Engineering
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--teal-400)", fontWeight: 600 }}>
                High School Portal
              </div>
            </div>
          </Link>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "0.25rem 0.65rem",
              borderRadius: "6px",
              fontSize: "0.78rem",
              color: "var(--text-secondary)",
            }}
          >
            <Calendar size={13} color="#0ea5e9" />
            <span>Academic Year: <strong style={{ color: "var(--text-primary)" }}>2026-2027 (ACTIVE)</strong></span>
          </div>
        </div>

        {/* Right Side Controls: Role Switcher & User Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Dual-Role Context Switcher (if staff has multiple positions) */}
          {account?.kind === "STAFF" && positions.length > 1 && (
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "rgba(14, 165, 233, 0.12)",
                  border: "1px solid rgba(14, 165, 233, 0.35)",
                  color: "var(--cyan-400)",
                  padding: "0.4rem 0.8rem",
                  borderRadius: "8px",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Layers size={15} />
                <span>Active Role: {activePosition ? formatPositionLabel(activePosition) : "Select Role"}</span>
                <ChevronDown size={14} />
              </button>

              {showRoleMenu && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "105%",
                    background: "var(--bg-secondary)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
                    padding: "0.5rem",
                    minWidth: "260px",
                    zIndex: 200,
                  }}
                >
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", padding: "0.25rem 0.5rem", textTransform: "uppercase", fontWeight: 700 }}>
                    Switch Active Workspace
                  </div>
                  {positions.map((pos) => {
                    const isCurrent = activePosition?.id === pos.id;
                    return (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => {
                          setActivePosition(pos);
                          setShowRoleMenu(false);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "0.55rem 0.75rem",
                          borderRadius: "6px",
                          background: isCurrent ? "rgba(14, 165, 233, 0.18)" : "transparent",
                          color: isCurrent ? "var(--cyan-400)" : "var(--text-primary)",
                          border: "none",
                          fontSize: "0.85rem",
                          fontWeight: isCurrent ? 600 : 400,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{formatPositionLabel(pos)}</span>
                        {isCurrent && <CheckCircle2 size={15} color="#38bdf8" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Single Position Badge if only 1 position */}
          {account?.kind === "STAFF" && positions.length === 1 && activePosition && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                background: "rgba(20, 184, 166, 0.12)",
                border: "1px solid rgba(20, 184, 166, 0.3)",
                color: "var(--teal-400)",
                fontSize: "0.82rem",
                fontWeight: 600,
              }}
            >
              <Shield size={14} />
              <span>{formatPositionLabel(activePosition)}</span>
            </div>
          )}

          {/* Student Badge */}
          {account?.kind === "STUDENT" && student && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                background: "rgba(14, 165, 233, 0.12)",
                border: "1px solid rgba(14, 165, 233, 0.3)",
                color: "var(--cyan-400)",
                fontSize: "0.82rem",
                fontWeight: 600,
              }}
            >
              <GraduationCap size={15} />
              <span>Student • {student.admissionNumber}</span>
            </div>
          )}

          {/* User Display & Sign Out */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>
                {account?.displayName}
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                {account?.authEmail}
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="btn-ghost"
              title="Sign Out of Portal"
              style={{ padding: "0.45rem", color: "#fda4af" }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Workspace Body ── */}
      <main style={{ flex: 1, padding: "2rem" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>{children}</div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
