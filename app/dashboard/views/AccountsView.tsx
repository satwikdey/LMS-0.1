"use client";

import React, { useState } from "react";
import {
  IndianRupee,
  Receipt,
  CreditCard,
  Plus,
  CheckCircle2,
  FileText,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { formatINR } from "@/lib/money";

export default function AccountsView() {
  const [activeTab, setActiveTab] = useState<"payments" | "concessions" | "plans" | "expenses">("payments");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    studentAdmissionNo: "ADM2026003",
    amount: "25000",
    method: "UPI",
    reference: "UPI/39481923019/SBI",
  });
  const [receiptSuccess, setReceiptSuccess] = useState<string | null>(null);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const receiptNum = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setReceiptSuccess(receiptNum);
    setShowPaymentModal(false);
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>Accounts & Bursar&apos;s Office</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Offline fee collection, immutable payment receipts, fee structures, and expenditure registers.
            </p>
          </div>

          <button onClick={() => setShowPaymentModal(true)} className="btn-primary">
            <Plus size={16} /> Record Offline Payment Receipt
          </button>
        </div>

        {/* Financial Overview Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginTop: "1.75rem" }}>
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              Total Reconciled Collections
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#34d399" }}>
              {formatINR(45000)}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Via UPI, Cash & Bank Transfers
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              Pending Dues (Receivables)
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--cyan-400)" }}>
              {formatINR(25000)}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              1 Student Pending Term 1
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              Scholarships Applied
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fbbf24" }}>
              {formatINR(5000)}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Approved by Stakeholder
            </div>
          </div>
        </div>
      </div>

      {receiptSuccess && (
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
            <div>
              <strong>Payment Recorded & Receipt Issued!</strong>
              <div style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>
                Official Receipt Number: <code>{receiptSuccess}</code>
              </div>
            </div>
          </div>
          <button onClick={() => setReceiptSuccess(null)} className="btn-secondary" style={{ padding: "0.3rem 0.7rem", fontSize: "0.8rem" }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.75rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", marginBottom: "1.75rem" }}>
        <button
          onClick={() => setActiveTab("payments")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${activeTab === "payments" ? "var(--cyan-400)" : "transparent"}`,
            color: activeTab === "payments" ? "var(--cyan-400)" : "var(--text-secondary)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Payment Receipts Register
        </button>
        <button
          onClick={() => setActiveTab("plans")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${activeTab === "plans" ? "var(--cyan-400)" : "transparent"}`,
            color: activeTab === "plans" ? "var(--cyan-400)" : "var(--text-secondary)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Fee Plans & Installments
        </button>
      </div>

      {/* Tab 1: Payments */}
      {activeTab === "payments" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Recorded Offline Payments (Ledger Audit)</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt Number</th>
                  <th>Student Admission</th>
                  <th>Amount Paid</th>
                  <th>Method & Reference</th>
                  <th>Status</th>
                  <th>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>REC-2026-0001</code></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>Aarav Sharma</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>ADM2026001</div>
                  </td>
                  <td style={{ fontWeight: 700, color: "#34d399" }}>₹20,000.00</td>
                  <td>
                    <div>UPI</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>UPI/38491823901/SBI</div>
                  </td>
                  <td><span className="badge badge-emerald">POSTED</span></td>
                  <td>Suresh Menon (Accounts)</td>
                </tr>
                <tr>
                  <td><code>REC-2026-0002</code></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>Diya Patel</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>ADM2026002</div>
                  </td>
                  <td style={{ fontWeight: 700, color: "#34d399" }}>₹25,000.00</td>
                  <td>
                    <div>BANK_TRANSFER</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>NEFT/HDFC/93810293</div>
                  </td>
                  <td><span className="badge badge-emerald">POSTED</span></td>
                  <td>Suresh Menon (Accounts)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Fee Plans */}
      {activeTab === "plans" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Class 10 Regular Fee Plan 2026-27</h3>
          <div style={{ marginBottom: "1.5rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Total Annual Fee: <strong style={{ color: "var(--text-primary)" }}>₹65,000.00</strong> (Structured in 3 Installments)
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Installment Name</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Admission Clearance Flag</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>Term 1 (At Admission)</td>
                  <td>₹25,000.00</td>
                  <td>10 Apr 2026</td>
                  <td>
                    <span className="badge badge-rose">MANDATORY FOR ADMISSION</span>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Term 2 (Mid-Year)</td>
                  <td>₹20,000.00</td>
                  <td>15 Sep 2026</td>
                  <td><span className="badge badge-teal">REGULAR</span></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Term 3 (Final Term)</td>
                  <td>₹20,000.00</td>
                  <td>15 Dec 2026</td>
                  <td><span className="badge badge-teal">REGULAR</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Record Payment */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Record Offline Payment</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Enter payment received outside the portal. Creates an immutable receipt and allocates funds according to charge priority.
            </p>

            <form onSubmit={handleRecordPayment} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Student Admission Number *</label>
                <input
                  required
                  type="text"
                  className="input-control"
                  placeholder="e.g. ADM2026003"
                  value={paymentForm.studentAdmissionNo}
                  onChange={(e) => setPaymentForm({ ...paymentForm, studentAdmissionNo: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Amount Received (₹) *</label>
                  <input
                    required
                    type="number"
                    className="input-control"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Payment Method *</label>
                  <select
                    className="input-control"
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  >
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Transaction / Receipt Reference</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. UPI/12345/SBI or Cash Receipt Slip #41"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Post Payment & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
