# LMS-0.1 — 5 Point Engineering High School Portal

A modern, full-stack School Management System and Learning Management Portal built with **Next.js 14, React 18, PostgreSQL, Prisma ORM, and Tailwind-free Vanilla CSS design system**.

---

## 🌟 Key Highlights & Architecture

- **Public Institution Showcase**: CBSE Affiliated Senior Secondary School (Code `1930482`), STEM & AI Lab highlights, Academic streams (Science & Commerce), and online inquiry capture.
- **Unified Role-Based Access Control (RBAC)**: Granular permissions for:
  - **Stakeholder / Managing Trustee**: Institutional governance, fee realization oversight, and scholarship sign-off.
  - **Principal & Head of School**: Academic structure, Class 10/11 streams setup, and promotion matrix.
  - **Teacher Incharge**: Grade-level coordination, exam scheduling, and report card publishing.
  - **Multi-Role Faculty (Dual Responsibilities)**: Section Head attendance registers + Subject Teacher coursework & grading.
  - **Accounts & Bursar Directorate**: Fee ledger reconciliation, offline UPI/Cash/Bank receipt generation, and fee structures.
  - **Admissions Directorate**: Public enquiry pipeline, applicant verification, and automated matriculation.
  - **Student & Parent Digital Portal**: Real-time attendance, official CBSE report cards (A1 grade), and zero-dues ledger transparency.
- **Embedded Database Automation**: Built-in zero-config embedded PostgreSQL server for instant local development and testing (`npm run db:local`).
- **Automated Client Demo & Screen Recorder**: High-definition Selenium script with on-screen HUD, smooth scroll engine, and automated FFmpeg MP4 recording (`npm run demo`).

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js >= 20
- Python 3.10+ (for running the automated demo script)
- FFmpeg (for automated video encoding)

### 1. Installation
```bash
npm install
```

### 2. Start Local PostgreSQL Database & Seed Demo Data
```bash
npm run db:local -- --seed
```
This launches a local embedded PostgreSQL server on port `54329`, runs Prisma migrations, and seeds test accounts.

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or configured port) in your browser.

---

## 🔑 Default Demo Login Credentials

All demo accounts share the default password: `Password@123`

| Role | Username / Identifier | Description |
|---|---|---|
| **Stakeholder** | `stakeholder@school.edu` | Managing Trustee (Governance & Scholarship Sign-off) |
| **Principal** | `principal@school.edu` | Head of Institution (Academics & Promotions) |
| **Teacher Incharge** | `incharge10@school.edu` | Class 10 Academic Coordinator |
| **Teacher John (Dual)** | `teacher.john@school.edu` | Head 10-A + Teaches 10-B Mathematics |
| **Teacher Priya** | `teacher.priya@school.edu` | Subject Teacher (Science 10-A & 10-B) |
| **Accounts Officer** | `accounts@school.edu` | Finance, Ledger, Payments & Receipts |
| **Admissions Officer** | `admissions@school.edu` | Enquiries, Applications & Enrollment |
| **Student (Aarav)** | `ADM2026001` | Class 10-A • 98.5% Attendance • #1 Rank |
| **Student (Rohan)** | `ADM2026003` | Class 10-B • Pending Fee Reminder |

---

## 🎬 Automated Client Demo & Video Recorder

Run the end-to-end Selenium walkthrough with on-screen narration HUD and automated MP4 screen recording:

```bash
# Watch the Chrome browser live while recording:
npm run demo

# Run silently in background headless mode:
npm run demo:headless
```

Or double-click `run_demo.bat` on Windows.

---

## 📦 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Frontend**: React 18, Lucide Icons, Recharts, Custom Glassmorphism CSS
- **Database**: PostgreSQL with Prisma ORM
- **Automation & Testing**: Vitest, Playwright, Selenium WebDriver (Python), OpenCV, FFmpeg

---

## 📄 License
Private & Proprietary — 5 Point Engineering Academy.
