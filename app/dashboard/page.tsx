"use client";

import React from "react";
import { useDashboard } from "./DashboardContext";
import StakeholderView from "./views/StakeholderView";
import PrincipalView from "./views/PrincipalView";
import InchargeView from "./views/InchargeView";
import SectionHeadView from "./views/SectionHeadView";
import SubjectTeacherView from "./views/SubjectTeacherView";
import AccountsView from "./views/AccountsView";
import AdmissionsView from "./views/AdmissionsView";
import StudentView from "./views/StudentView";
import { ShieldAlert } from "lucide-react";

export default function DashboardPage() {
  const { account, activePosition, student, isLoading } = useDashboard();

  if (isLoading || !account) {
    return null; // Shell handles loading state
  }

  // If student
  if (account.kind === "STUDENT") {
    return <StudentView studentInfo={student} />;
  }

  // If staff with active position
  if (activePosition) {
    switch (activePosition.position) {
      case "STAKEHOLDER":
        return <StakeholderView />;
      case "PRINCIPAL":
        return <PrincipalView />;
      case "TEACHER_INCHARGE":
        return <InchargeView classId={activePosition.class?.id} />;
      case "SECTION_HEAD":
        return <SectionHeadView sectionId={activePosition.section?.id} />;
      case "SUBJECT_TEACHER":
        return <SubjectTeacherView offeringInfo={activePosition.offering} />;
      case "ACCOUNTS":
        return <AccountsView />;
      case "ADMISSIONS":
        return <AdmissionsView />;
      default:
        break;
    }
  }

  // Staff account without any active position assigned yet
  return (
    <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", maxWidth: "600px", margin: "4rem auto" }}>
      <ShieldAlert size={48} color="#fbbf24" style={{ margin: "0 auto 1rem" }} />
      <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>No Active Position Assigned</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
        Your staff profile (<code>{account.displayName}</code>) is active, but you do not currently hold an active institutional responsibility.
        Please contact the Stakeholder or Principal to receive a position assignment.
      </p>
    </div>
  );
}
