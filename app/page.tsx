"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Cpu,
  Atom,
  Building,
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  Send,
  Lock,
} from "lucide-react";

export default function HomePage() {
  const [enquiryForm, setEnquiryForm] = useState({
    studentName: "",
    guardianName: "",
    phone: "",
    email: "",
    classGrade: "10",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    number?: string;
    error?: string;
  } | null>(null);

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      const res = await fetch("/api/public/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: enquiryForm.studentName,
          guardianName: enquiryForm.guardianName,
          phone: enquiryForm.phone,
          email: enquiryForm.email || null,
          message: `Interested in Grade ${enquiryForm.classGrade}. ${enquiryForm.message}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to submit enquiry");
      }

      setSubmissionResult({ success: true, number: data.enquiryNumber });
      setEnquiryForm({
        studentName: "",
        guardianName: "",
        phone: "",
        email: "",
        classGrade: "10",
        message: "",
      });
    } catch (err: any) {
      setSubmissionResult({ success: false, error: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ── Top Announcement Bar ── */}
      <div
        style={{
          background: "linear-gradient(90deg, #0f172a, #0b1120, #0d9488)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "0.5rem 1.5rem",
          fontSize: "0.82rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "var(--text-secondary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--teal-400)" }}>
            <Sparkles size={14} /> Admissions Open for Academic Year 2026-2027
          </span>
          <span style={{ display: "none", alignItems: "center", gap: "0.35rem" }} className="hide-mobile">
            • CBSE Affiliation No. 1930482
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <Clock size={13} /> Mon - Sat: 8:00 AM - 4:00 PM IST
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <Phone size={13} /> +91 80 2345 6789
          </span>
        </div>
      </div>

      {/* ── Main Navigation Header ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(11, 17, 32, 0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
          padding: "0.85rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #0ea5e9, #14b8a6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(14, 165, 233, 0.35)",
            }}
          >
            <GraduationCap size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.01em" }}>
              5 Point Engineering
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--teal-400)", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
              High School • Bengaluru
            </div>
          </div>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: "1.75rem" }}>
          <a href="#academics" style={{ color: "var(--text-secondary)", fontSize: "0.92rem", fontWeight: 500 }} className="hover:text-white">
            Academics
          </a>
          <a href="#streams" style={{ color: "var(--text-secondary)", fontSize: "0.92rem", fontWeight: 500 }} className="hover:text-white">
            Streams & Labs
          </a>
          <a href="#admissions" style={{ color: "var(--text-secondary)", fontSize: "0.92rem", fontWeight: 500 }} className="hover:text-white">
            Admissions
          </a>
          <a href="#contact" style={{ color: "var(--text-secondary)", fontSize: "0.92rem", fontWeight: 500 }} className="hover:text-white">
            Campus
          </a>
          <Link
            href="/auth/login"
            className="btn-primary"
            style={{ padding: "0.55rem 1.15rem", fontSize: "0.88rem" }}
          >
            <Lock size={15} /> Portal Sign In
          </Link>
        </nav>
      </header>

      {/* ── Hero Section ── */}
      <section
        style={{
          position: "relative",
          padding: "5rem 2rem 4rem",
          overflow: "hidden",
          background: "radial-gradient(circle at 50% 10%, rgba(14, 165, 233, 0.12) 0%, rgba(7, 11, 20, 0) 70%)",
        }}
      >
        <div style={{ maxWidth: "1140px", margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.35rem 0.95rem",
              borderRadius: "9999px",
              background: "rgba(20, 184, 166, 0.12)",
              border: "1px solid rgba(20, 184, 166, 0.3)",
              color: "var(--teal-400)",
              fontSize: "0.84rem",
              fontWeight: 600,
              marginBottom: "1.5rem",
            }}
          >
            <ShieldCheck size={16} /> CBSE Affiliated Senior Secondary School • Code 1930482
          </div>

          <h1
            style={{
              fontSize: "3.5rem",
              lineHeight: 1.15,
              marginBottom: "1.25rem",
              fontWeight: 800,
            }}
          >
            Pioneering Minds. <br />
            <span className="text-gradient-teal">Engineering Futures.</span>
          </h1>

          <p
            style={{
              fontSize: "1.2rem",
              color: "var(--text-secondary)",
              maxWidth: "740px",
              margin: "0 auto 2.5rem",
              lineHeight: 1.6,
            }}
          >
            A premier academic ecosystem where mathematics, pure sciences, and modern technology converge.
            Empowering students with deep conceptual rigor, specialized laboratories, and institutional excellence.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "4rem" }}>
            <a href="#admissions" className="btn-primary" style={{ padding: "0.85rem 1.8rem", fontSize: "1rem" }}>
              Enquire for Admission 2026-27 <ArrowRight size={18} />
            </a>
            <Link href="/auth/login" className="btn-secondary" style={{ padding: "0.85rem 1.8rem", fontSize: "1rem" }}>
              <Lock size={18} /> Student & Staff Portal
            </Link>
          </div>

          {/* Key School Metrics */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.25rem",
              textAlign: "left",
            }}
          >
            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <div style={{ color: "var(--cyan-400)", fontSize: "2.25rem", fontWeight: 800, fontFamily: "var(--font-heading)" }}>
                100%
              </div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: "0.25rem" }}>CBSE Board Pass Rate</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                Class 10 & 12 Board Exams with 45+ Distinctions
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <div style={{ color: "var(--teal-400)", fontSize: "2.25rem", fontWeight: 800, fontFamily: "var(--font-heading)" }}>
                1 : 12
              </div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: "0.25rem" }}>Faculty Ratio</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                Individual mentorship by dedicated Subject Specialists
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <div style={{ color: "#fbbf24", fontSize: "2.25rem", fontWeight: 800, fontFamily: "var(--font-heading)" }}>
                15+
              </div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: "0.25rem" }}>Advanced STEM Labs</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                Robotics, AI, Physics, Chemistry & Applied Electronics
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <div style={{ color: "#34d399", fontSize: "2.25rem", fontWeight: 800, fontFamily: "var(--font-heading)" }}>
                ₹0
              </div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: "0.25rem" }}>Hidden Surcharges</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                Fully transparent fee ledger and merit scholarships
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Academic Structure Section ── */}
      <section id="academics" style={{ padding: "5rem 2rem", background: "var(--bg-primary)" }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <span className="badge badge-teal" style={{ marginBottom: "0.75rem" }}>
              Academic Blueprint 2026-2027
            </span>
            <h2 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
              Structured For Deep Conceptual Mastery
            </h2>
            <p style={{ color: "var(--text-secondary)", maxWidth: "650px", margin: "0 auto" }}>
              Our multi-tiered academic framework supports core foundations in secondary school,
              leading to specialized stream offerings and elective flexibility.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
            {/* Secondary: Class 9 - 10 */}
            <div className="glass-panel" style={{ padding: "2.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <div
                  style={{
                    background: "rgba(14, 165, 233, 0.15)",
                    color: "var(--cyan-400)",
                    padding: "0.6rem",
                    borderRadius: "10px",
                  }}
                >
                  <Atom size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.35rem" }}>Secondary School</h3>
                  <div style={{ fontSize: "0.85rem", color: "var(--cyan-400)", fontWeight: 600 }}>Class 9 & Class 10</div>
                </div>
              </div>
              <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                Rigorous core subjects structured around analytical logic, scientific method, and board readiness.
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
                  <CheckCircle2 size={16} color="#2dd4bf" /> Advanced Mathematics (Derivations & Algebra)
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
                  <CheckCircle2 size={16} color="#2dd4bf" /> Integrated Science (Physics, Chemistry, Biology)
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
                  <CheckCircle2 size={16} color="#2dd4bf" /> Social Science & Contemporary History
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
                  <CheckCircle2 size={16} color="#2dd4bf" /> English Language & Literary Analysis
                </li>
              </ul>
            </div>

            {/* Senior Secondary: Science Stream */}
            <div className="glass-panel" style={{ padding: "2.25rem", border: "1px solid rgba(14, 165, 233, 0.35)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <div
                  style={{
                    background: "rgba(20, 184, 166, 0.15)",
                    color: "var(--teal-400)",
                    padding: "0.6rem",
                    borderRadius: "10px",
                  }}
                >
                  <Cpu size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.35rem" }}>Engineering & Pure Science</h3>
                  <div style={{ fontSize: "0.85rem", color: "var(--teal-400)", fontWeight: 600 }}>Class 11 & Class 12 Stream</div>
                </div>
              </div>
              <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                Tailored for future engineers and scientists with direct laboratory immersion and competitive exam preparation.
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
                  <CheckCircle2 size={16} color="#2dd4bf" /> Physics (Mechanics, Electromagnetism & Optics)
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
                  <CheckCircle2 size={16} color="#2dd4bf" /> Chemistry (Organic, Inorganic & Physical)
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
                  <CheckCircle2 size={16} color="#2dd4bf" /> Higher Mathematics & Calculus
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
                  <CheckCircle2 size={16} color="#2dd4bf" /> Computer Science (Python, Algorithms, Data Structures)
                </li>
              </ul>
            </div>

            {/* Senior Secondary: Commerce Stream */}
            <div className="glass-panel" style={{ padding: "2.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <div
                  style={{
                    background: "rgba(245, 158, 11, 0.15)",
                    color: "#fbbf24",
                    padding: "0.6rem",
                    borderRadius: "10px",
                  }}
                >
                  <Building size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.35rem" }}>Commerce & Analytical Economics</h3>
                  <div style={{ fontSize: "0.85rem", color: "#fbbf24", fontWeight: 600 }}>Class 11 & Class 12 Stream</div>
                </div>
              </div>
              <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                Bridging commerce with analytical data, quantitative economics, and financial principles.
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
                  <CheckCircle2 size={16} color="#2dd4bf" /> Accountancy & Financial Statement Analysis
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
                  <CheckCircle2 size={16} color="#2dd4bf" /> Business Studies & Management Strategy
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
                  <CheckCircle2 size={16} color="#2dd4bf" /> Micro & Macro Economics with Statistics
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
                  <CheckCircle2 size={16} color="#2dd4bf" /> Applied Mathematics & Financial Modeling
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Admission & Enquiry Section ── */}
      <section id="admissions" style={{ padding: "5rem 2rem", background: "var(--bg-space)" }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "3rem", alignItems: "center" }}>
            <div>
              <span className="badge badge-cyan" style={{ marginBottom: "0.75rem" }}>
                Admissions 2026-27
              </span>
              <h2 style={{ fontSize: "2.5rem", marginBottom: "1.25rem" }}>
                Take The First Step Toward Academic Excellence
              </h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", lineHeight: 1.7 }}>
                We maintain small section sizes (max 40 students) to guarantee individual attention.
                Submit an online enquiry, and our Admissions Coordinator will contact you within 24 business hours
                to arrange campus visits and aptitude evaluations.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(14, 165, 233, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--cyan-400)", fontWeight: 700 }}>
                    1
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Submit Online Enquiry</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Receive instant reference number and counselor assignment</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(20, 184, 166, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--teal-400)", fontWeight: 700 }}>
                    2
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Counseling & Verification</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Fee structure briefing, document verification & optional scholarship evaluation</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-emerald)", fontWeight: 700 }}>
                    3
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Clearance & Enrollment</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Instant admission number generation with student portal account provisioning</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Enquiry Form */}
            <div className="glass-panel" style={{ padding: "2.5rem" }}>
              <h3 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Direct Admission Enquiry</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "1.75rem" }}>
                Fill out the details below to initiate your application.
              </p>

              {submissionResult?.success ? (
                <div
                  style={{
                    padding: "1.5rem",
                    borderRadius: "10px",
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    textAlign: "center",
                  }}
                >
                  <CheckCircle2 size={38} color="#34d399" style={{ margin: "0 auto 0.75rem" }} />
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#34d399", marginBottom: "0.5rem" }}>
                    Enquiry Submitted Successfully!
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1rem" }}>
                    Your Enquiry Number is: <strong style={{ color: "var(--text-primary)" }}>{submissionResult.number}</strong>
                  </p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                    Our Admissions Office will call you shortly to schedule your campus tour.
                  </p>
                  <button
                    onClick={() => setSubmissionResult(null)}
                    className="btn-secondary"
                    style={{ marginTop: "1rem", fontSize: "0.85rem" }}
                  >
                    Submit Another Enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {submissionResult?.error && (
                    <div style={{ padding: "0.75rem", borderRadius: "8px", background: "rgba(244, 63, 94, 0.15)", color: "#fda4af", fontSize: "0.85rem" }}>
                      {submissionResult.error}
                    </div>
                  )}

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                      Student Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      className="input-control"
                      placeholder="e.g. Aarav Sharma"
                      value={enquiryForm.studentName}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, studentName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                      Parent / Guardian Name *
                    </label>
                    <input
                      required
                      type="text"
                      className="input-control"
                      placeholder="e.g. Sanjay Sharma"
                      value={enquiryForm.guardianName}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, guardianName: e.target.value })}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                        Phone Number *
                      </label>
                      <input
                        required
                        type="tel"
                        className="input-control"
                        placeholder="e.g. +91 98450 12345"
                        value={enquiryForm.phone}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                        Target Grade *
                      </label>
                      <select
                        className="input-control"
                        value={enquiryForm.classGrade}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, classGrade: e.target.value })}
                      >
                        <option value="9">Class 9 (Foundation)</option>
                        <option value="10">Class 10 (Secondary)</option>
                        <option value="11">Class 11 (Science / Commerce)</option>
                        <option value="12">Class 12 (Senior Sec)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      className="input-control"
                      placeholder="e.g. parent@example.com"
                      value={enquiryForm.email}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                      Questions / Notes
                    </label>
                    <textarea
                      rows={2}
                      className="input-control"
                      placeholder="Specify stream preference, previous marks, or transportation queries..."
                      value={enquiryForm.message}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                    style={{ width: "100%", marginTop: "0.5rem" }}
                  >
                    {isSubmitting ? (
                      "Transmitting..."
                    ) : (
                      <>
                        <Send size={16} /> Submit Admission Enquiry
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="contact" style={{ background: "var(--bg-secondary)", borderTop: "1px solid rgba(255, 255, 255, 0.08)", padding: "4rem 2rem 2rem", marginTop: "auto" }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "2.5rem", marginBottom: "3rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #0ea5e9, #14b8a6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <GraduationCap size={20} color="#fff" />
              </div>
              <div style={{ fontWeight: 800, fontFamily: "var(--font-heading)", fontSize: "1.1rem" }}>
                5 Point Engineering
              </div>
            </div>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
              Dedicated to nurturing ethical, rigorous, and technologically empowered leaders of tomorrow.
            </p>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Affiliation: CBSE Central Board of Secondary Education
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontFamily: "var(--font-heading)", marginBottom: "1rem", color: "var(--text-primary)" }}>
              Campus Address
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                <MapPin size={16} color="#0ea5e9" style={{ flexShrink: 0, marginTop: "0.2rem" }} />
                <span>Knowledge Park, Campus Road, Phase II, Electronic City, Bengaluru, Karnataka - 560100</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Phone size={16} color="#0ea5e9" /> +91 80 2345 6789
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Mail size={16} color="#0ea5e9" /> contact@5point-engineering.edu.in
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontFamily: "var(--font-heading)", marginBottom: "1rem", color: "var(--text-primary)" }}>
              Governance & Policies
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
              <span>• Fee Transparency Ledger</span>
              <span>• Merit Scholarship Guidelines</span>
              <span>• Student Code of Conduct</span>
              <span>• Grievance & Redressal Cell</span>
              <span>• Anti-Ragging Committee</span>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontFamily: "var(--font-heading)", marginBottom: "1rem", color: "var(--text-primary)" }}>
              Institutional Portal
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Secure portal access for enrolled students, subject teachers, department in-charges, and school leadership.
            </p>
            <Link href="/auth/login" className="btn-primary" style={{ width: "100%", fontSize: "0.9rem" }}>
              <Lock size={15} /> Access Portal
            </Link>
          </div>
        </div>

        <div style={{ maxWidth: "1140px", margin: "0 auto", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap", gap: "1rem" }}>
          <div>© 2026 5 Point Engineering High School. All rights reserved.</div>
          <div>Timezone: Asia/Kolkata (IST) • Standard Currency: INR (₹)</div>
        </div>
      </footer>
    </div>
  );
}
