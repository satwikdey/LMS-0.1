"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Lock, User, ArrowRight, AlertCircle, KeyRound, Check } from "lucide-react";

const DEMO_PRESETS = [
  { label: "Stakeholder", ident: "stakeholder@school.edu", desc: "School Trustee (All access & Concession approval)" },
  { label: "Principal", ident: "principal@school.edu", desc: "Head of Institution (Setup & Promotions)" },
  { label: "Teacher Incharge", ident: "incharge10@school.edu", desc: "Class 10 Academic Incharge" },
  { label: "Teacher John (Dual)", ident: "teacher.john@school.edu", desc: "Head 10-A + Teaches 10-B Mathematics" },
  { label: "Teacher Priya", ident: "teacher.priya@school.edu", desc: "Subject Teacher (Science 10-A & 10-B)" },
  { label: "Accounts Officer", ident: "accounts@school.edu", desc: "Finance, Ledger, Payments & Payroll" },
  { label: "Admissions Officer", ident: "admissions@school.edu", desc: "Enquiries, Applications & Enrollment" },
  { label: "Student: Aarav", ident: "ADM2026001", desc: "Class 10-A • Admission No: ADM2026001" },
  { label: "Student: Rohan", ident: "ADM2026003", desc: "Class 10-B • Has pending fee reminder" },
];

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Invalid credentials. Please verify your identifier and password.");
      }

      if (data.user?.mustChangePassword) {
        router.push("/auth/change-password");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const applyPreset = (ident: string) => {
    setIdentifier(ident);
    setPassword("Password@123");
    setErrorMessage(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "radial-gradient(circle at 50% 20%, rgba(14, 165, 233, 0.1) 0%, rgba(7, 11, 20, 1) 75%)",
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "960px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Left Side: Credentials Form */}
        <div style={{ padding: "3rem 2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
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
                <div style={{ fontWeight: 800, fontFamily: "var(--font-heading)", fontSize: "1.1rem" }}>
                  5 Point Engineering
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--teal-400)", textTransform: "uppercase", fontWeight: 600 }}>
                  Institutional Portal
                </div>
              </div>
            </Link>
          </div>

          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>Portal Sign In</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "2rem" }}>
            Enter your Admission Number (e.g. <code>ADM2026001</code>) or official email address to continue.
          </p>

          {errorMessage && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.85rem 1rem",
                borderRadius: "8px",
                background: "rgba(244, 63, 94, 0.15)",
                border: "1px solid rgba(244, 63, 94, 0.3)",
                color: "#fda4af",
                fontSize: "0.85rem",
                marginBottom: "1.5rem",
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                Admission Number or Registered Email
              </label>
              <div style={{ position: "relative" }}>
                <User size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  required
                  type="text"
                  className="input-control"
                  style={{ paddingLeft: "2.75rem" }}
                  placeholder="ADM2026001 or name@school.edu"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  required
                  type="password"
                  className="input-control"
                  style={{ paddingLeft: "2.75rem" }}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{ width: "100%", marginTop: "0.5rem", padding: "0.85rem" }}
            >
              {isLoading ? "Authenticating..." : (
                <>
                  Sign In <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Need help? Contact School IT Desk at <code>contact@5point-engineering.edu.in</code>
          </div>
        </div>

        {/* Right Side: Demo Quick Credentials Panel */}
        <div
          style={{
            background: "rgba(11, 17, 32, 0.65)",
            borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "3rem 2.25rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", color: "var(--teal-400)" }}>
            <KeyRound size={18} />
            <span style={{ fontWeight: 700, fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Quick Demo Access
            </span>
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
            Click any role below to pre-populate credentials (Default password: <code>Password@123</code>):
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
              overflowY: "auto",
              maxHeight: "380px",
              paddingRight: "0.5rem",
            }}
          >
            {DEMO_PRESETS.map((p) => {
              const isSelected = identifier.toLowerCase() === p.ident.toLowerCase();
              return (
                <button
                  key={p.ident}
                  type="button"
                  onClick={() => applyPreset(p.ident)}
                  style={{
                    background: isSelected ? "rgba(14, 165, 233, 0.15)" : "rgba(30, 41, 59, 0.4)",
                    border: `1px solid ${isSelected ? "var(--cyan-500)" : "rgba(255, 255, 255, 0.06)"}`,
                    borderRadius: "8px",
                    padding: "0.65rem 0.85rem",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "rgba(51, 65, 85, 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "rgba(30, 41, 59, 0.4)";
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.86rem", color: isSelected ? "var(--cyan-400)" : "var(--text-primary)" }}>
                      {p.label}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.desc}</div>
                  </div>
                  {isSelected && <Check size={16} color="#38bdf8" />}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: "auto", paddingTop: "1.5rem", borderTop: "1px solid rgba(255, 255, 255, 0.06)", fontSize: "0.78rem", color: "var(--text-dim)" }}>
            Tip: &quot;Teacher John&quot; has dual responsibilities. Once logged in, use the header badge to switch between Section Head (10-A) and Subject Teacher (10-B Math).
          </div>
        </div>
      </div>
    </div>
  );
}
