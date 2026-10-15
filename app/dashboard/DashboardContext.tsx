"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface PositionInfo {
  id: string;
  position:
    | "STAKEHOLDER"
    | "PRINCIPAL"
    | "TEACHER_INCHARGE"
    | "SECTION_HEAD"
    | "SUBJECT_TEACHER"
    | "ACCOUNTS"
    | "ADMISSIONS";
  class?: { id: string; name: string; level: number } | null;
  section?: { id: string; name: string; class?: { name: string } } | null;
  offering?: {
    id: string;
    classSubject?: { subject?: { name: string; code: string } };
    section?: { name: string; class?: { name: string } };
  } | null;
}

export interface StudentInfo {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  enrollments?: Array<{
    id: string;
    status: string;
    class?: { id: string; name: string };
    section?: { id: string; name: string };
  }>;
}

export interface AccountInfo {
  id: string;
  displayName: string;
  authEmail: string;
  registeredEmail?: string | null;
  kind: "STAFF" | "STUDENT";
  mustChangePassword: boolean;
}

interface DashboardContextType {
  account: AccountInfo | null;
  positions: PositionInfo[];
  student: StudentInfo | null;
  activePosition: PositionInfo | null;
  setActivePosition: (pos: PositionInfo) => void;
  isLoading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [positions, setPositions] = useState<PositionInfo[]>([]);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [activePosition, setActivePositionState] = useState<PositionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        throw new Error("Failed to load user profile");
      }
      const data = await res.json();
      setAccount(data.account);
      setPositions(data.positions || []);
      setStudent(data.student || null);

      if (data.positions && data.positions.length > 0) {
        // Retain current position if still valid, or default to first
        setActivePositionState((prev) => {
          if (prev) {
            const match = data.positions.find((p: PositionInfo) => p.id === prev.id);
            if (match) return match;
          }
          return data.positions[0];
        });
      }
    } catch (err) {
      console.error(err);
      router.push("/auth/login");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

  const setActivePosition = (pos: PositionInfo) => {
    setActivePositionState(pos);
  };

  return (
    <DashboardContext.Provider
      value={{
        account,
        positions,
        student,
        activePosition,
        setActivePosition,
        isLoading,
        logout,
        refresh: fetchUser,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return ctx;
}
