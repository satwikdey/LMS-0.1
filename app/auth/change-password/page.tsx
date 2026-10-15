"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to update password");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "var(--bg-space)",
      }}
    >
      <div className="glass-panel" style={{ width: "100%", maxWidth: "460px", padding: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--cyan-400)", marginBottom: "0.75rem" }}>
          <Lock size={20} />
          <span style={{ fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase" }}>Security Update</span>
        </div>
        <h1 style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>Update Your Password</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "1.75rem" }}>
          Your account requires a personal password update before entering the portal.
        </p>

        {errorMessage && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem",
              borderRadius: "8px",
              background: "rgba(244, 63, 94, 0.15)",
              color: "#fda4af",
              fontSize: "0.85rem",
              marginBottom: "1.25rem",
            }}
          >
            <AlertCircle size={16} />
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
              Current Password (Optional if temporary)
            </label>
            <input
              type="password"
              className="input-control"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
              New Password (min 8 characters, letters & digits) *
            </label>
            <input
              required
              type="password"
              className="input-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
              Confirm New Password *
            </label>
            <input
              required
              type="password"
              className="input-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary" style={{ marginTop: "0.5rem", width: "100%" }}>
            {isLoading ? "Saving..." : (
              <>
                Update & Proceed to Portal <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
