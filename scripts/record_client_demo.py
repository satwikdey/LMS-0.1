#!/usr/bin/env python3
"""
================================================================================
5 POINT ENGINEERING HIGH SCHOOL — ALL-PROFILES CLIENT DEMO & SCREEN RECORDER
================================================================================
Extensive, end-to-end automated demonstration covering EVERY single profile,
role, and institutional feature in the platform:

  1. Public Institution Portal & STEM Highlights
  2. Interactive Public Admission Inquiry Submission (Real-time lead capture)
  3. Authentication Hub & 9 Granular Role-Based Access Control Presets
  4. Managing Trustee / Stakeholder Executive Console (Fiduciary Health & Governance)
  5. Principal Academic Office (Classes, Streams, Lifecycle & Promotions)
  6. Teacher Incharge Console (Class 10 Oversight, Exams & Report Cards)
  7. Multi-Role Faculty (Teacher John — Section Head 10-A & Math 10-B Dual Roles)
  8. Dedicated Science Faculty (Teacher Priya — Laboratory Coursework & Rubrics)
  9. Accounts & Bursar Directorate (Ledger Audit, Offline Fee Receipt Posting)
 10. Admissions Directorate (Inquiries, Verification & Student Matriculation)
 11. Student & Parent Experience (Aarav Sharma — Digital ID, CBSE Report Card & ₹0 Ledger)
 12. Student Fee Dues Reminder & Alert View (Rohan Gupta — Class 10-B)
 13. Grand Finale & Comprehensive Institutional ERP Summary

Outputs:
  A high-definition, stream-ready MP4 video file with on-screen presenter HUD,
  progress bar, chapter narration, and glowing element spotlights.
"""

import os
import sys
import time
import argparse
import subprocess
from typing import Optional

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

try:
    import cv2
    import numpy as np
except ImportError:
    print("Error: opencv-python is required. Run: pip install opencv-python")
    sys.exit(1)

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
except ImportError:
    print("Error: selenium is required. Run: pip install selenium")
    sys.exit(1)


# ──────────────────────────────────────────────────────────────────────────────
# PRESENTER HUD & VISUAL CUES (INJECTED VIA JAVASCRIPT)
# ──────────────────────────────────────────────────────────────────────────────

HUD_INJECTION_SCRIPT = """
(function() {
    let hud = document.getElementById('demo-presenter-hud');
    if (!hud) {
        hud = document.createElement('div');
        hud.id = 'demo-presenter-hud';
        hud.style.cssText = `
            position: fixed;
            bottom: 22px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(11, 17, 32, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(14, 165, 233, 0.45);
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.75), 0 0 24px rgba(14, 165, 233, 0.25);
            border-radius: 16px;
            padding: 12px 22px;
            color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            z-index: 2147483647;
            pointer-events: none;
            width: min(860px, 92vw);
            display: flex;
            flex-direction: column;
            gap: 5px;
            box-sizing: border-box;
            transition: all 0.25s ease;
        `;

        hud.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        background: rgba(239, 68, 68, 0.2);
                        border: 1px solid rgba(239, 68, 68, 0.5);
                        padding: 2px 8px;
                        border-radius: 9999px;
                        font-size: 11px;
                        font-weight: 700;
                        color: #fca5a5;
                        letter-spacing: 0.05em;
                    ">
                        <span style="width: 7px; height: 7px; border-radius: 50%; background: #ef4444; animation: hud-pulse 1.5s infinite;"></span>
                        LIVE CLIENT DEMO
                    </div>
                    <div id="demo-hud-chapter" style="font-size: 11.5px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.06em;">
                        CHAPTER 1 OF 12
                    </div>
                </div>
                <div id="demo-hud-step-counter" style="font-size: 11.5px; color: #94a3b8; font-weight: 600;">
                    Step 1/12
                </div>
            </div>
            <div id="demo-hud-title" style="font-size: 15.5px; font-weight: 800; color: #ffffff; letter-spacing: -0.01em;">
                Initializing Demo...
            </div>
            <div id="demo-hud-desc" style="font-size: 12.5px; color: #cbd5e1; line-height: 1.4;">
                Please wait while the system connects to the portal.
            </div>
            <div style="width: 100%; height: 3px; background: rgba(255, 255, 255, 0.1); border-radius: 9999px; overflow: hidden; margin-top: 3px;">
                <div id="demo-hud-progress" style="width: 0%; height: 100%; background: linear-gradient(90deg, #0ea5e9, #14b8a6); transition: width 0.4s ease;"></div>
            </div>
        `;

        const style = document.createElement('style');
        style.id = 'demo-presenter-style';
        style.innerHTML = `
            @keyframes hud-pulse {
                0% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.4; transform: scale(0.85); }
                100% { opacity: 1; transform: scale(1); }
            }
            .demo-spotlight-active {
                outline: 3px solid #38bdf8 !important;
                outline-offset: 3px !important;
                box-shadow: 0 0 25px rgba(56, 189, 248, 0.7) !important;
                transition: all 0.25s ease !important;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(hud);
    }
})();
"""


class DemoPresenter:
    """
    Coordinates presentation actions, glowing spotlight highlights,
    on-screen narrator subtitles, and video frame recording.
    """

    def __init__(self, driver: webdriver.Chrome, video_path: str, fps: int = 15, width: int = 1920, height: int = 1080):
        self.driver = driver
        self.video_path = video_path
        self.fps = fps
        self.width = width
        self.height = height
        self.temp_raw_path = video_path.replace(".mp4", "_raw_temp.mp4")
        if self.temp_raw_path == video_path:
            self.temp_raw_path = "temp_raw_demo.mp4"

        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        self.writer = cv2.VideoWriter(self.temp_raw_path, fourcc, self.fps, (self.width, self.height))
        self.frame_count = 0
        self.total_steps = 12

        print(f"[Presenter] Initialized video recorder: {self.width}x{self.height} @ {self.fps} FPS")

    def capture_frame(self):
        """Captures a screenshot from Chrome and writes to video."""
        try:
            png_bytes = self.driver.get_screenshot_as_png()
            frame = cv2.imdecode(np.frombuffer(png_bytes, np.uint8), cv2.IMREAD_COLOR)
            if frame is not None:
                if frame.shape[1] != self.width or frame.shape[0] != self.height:
                    frame = cv2.resize(frame, (self.width, self.height), interpolation=cv2.INTER_AREA)
                self.writer.write(frame)
                self.frame_count += 1
        except Exception:
            pass

    def hold(self, seconds: float):
        """Pauses execution while capturing continuous frames for smooth video."""
        interval = 1.0 / self.fps
        steps = max(1, int(seconds * self.fps))
        for _ in range(steps):
            t0 = time.time()
            self.capture_frame()
            elapsed = time.time() - t0
            time.sleep(max(0.005, interval - elapsed))

    def ensure_hud(self):
        """Re-injects the HUD overlay if navigating between pages."""
        try:
            self.driver.execute_script(HUD_INJECTION_SCRIPT)
        except Exception:
            pass

    def update_hud(self, chapter_num: int, title: str, description: str, progress_pct: float):
        """Updates the presenter HUD with the current story chapter."""
        self.ensure_hud()
        js = f"""
            (function() {{{{
                const ch = document.getElementById('demo-hud-chapter');
                const ti = document.getElementById('demo-hud-title');
                const de = document.getElementById('demo-hud-desc');
                const pr = document.getElementById('demo-hud-progress');
                const sc = document.getElementById('demo-hud-step-counter');
                if (ch) ch.innerText = 'CHAPTER {chapter_num} OF {self.total_steps}';
                if (sc) sc.innerText = 'Step {chapter_num}/{self.total_steps}';
                if (ti) ti.innerText = {repr(title)};
                if (de) de.innerText = {repr(description)};
                if (pr) pr.style.width = '{progress_pct}%';
            }}}})();
        """
        try:
            self.driver.execute_script(js)
        except Exception:
            pass
        self.capture_frame()

    def smooth_scroll(self, scroll_by: int, steps: int = 14, pause: float = 0.02):
        """Smoothly scrolls the page up or down, capturing frames at each step."""
        step_amount = scroll_by / steps
        for _ in range(steps):
            self.driver.execute_script(f"window.scrollBy(0, {step_amount});")
            self.capture_frame()
            time.sleep(pause)
        self.hold(0.2)

    def scroll_to_top(self, steps: int = 15):
        """Smoothly scrolls back to the top of the page."""
        try:
            current_y = self.driver.execute_script("return window.pageYOffset || document.documentElement.scrollTop;")
            if current_y and current_y > 0:
                self.smooth_scroll(-int(current_y), steps=steps)
        except Exception:
            self.driver.execute_script("window.scrollTo(0, 0);")
            self.capture_frame()

    def spotlight(self, element, duration: float = 0.8):
        """Applies a luminous glowing spotlight to an element to guide client attention."""
        try:
            self.driver.execute_script("arguments[0].scrollIntoView({block: 'nearest', behavior: 'smooth'});", element)
            self.driver.execute_script("arguments[0].classList.add('demo-spotlight-active');", element)
            self.hold(duration)
            self.driver.execute_script("arguments[0].classList.remove('demo-spotlight-active');", element)
        except Exception:
            self.hold(duration)

    def highlight_and_click(self, element, wait_after: float = 1.0):
        """Highlights an element with a glowing outline, clicks it, and captures the result."""
        self.spotlight(element, duration=0.6)
        try:
            element.click()
        except Exception:
            self.driver.execute_script("arguments[0].click();", element)
        self.hold(wait_after)

    def finalize(self):
        """Closes video writer and runs FFmpeg to produce stream-ready H.264 MP4."""
        self.writer.release()
        print(f"[Presenter] Raw video captured: {self.frame_count} frames.")
        print(f"[Presenter] Encoding final broadcast video via FFmpeg -> {self.video_path}")

        try:
            cmd = [
                "ffmpeg", "-y",
                "-i", self.temp_raw_path,
                "-c:v", "libx264",
                "-preset", "medium",
                "-crf", "20",
                "-pix_fmt", "yuv420p",
                "-movflags", "+faststart",
                self.video_path
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if res.returncode == 0 and os.path.exists(self.video_path):
                file_size_mb = os.path.getsize(self.video_path) / (1024 * 1024)
                print(f"[Presenter] SUCCESS! Presentation recording saved: {self.video_path} ({file_size_mb:.2f} MB)")
                if os.path.exists(self.temp_raw_path):
                    os.remove(self.temp_raw_path)
            else:
                print(f"[Presenter] Warning: FFmpeg returned code {res.returncode}. Keeping raw video as fallback.")
                if os.path.exists(self.temp_raw_path):
                    os.rename(self.temp_raw_path, self.video_path)
        except Exception as e:
            print(f"[Presenter] FFmpeg error: {e}. Raw video kept at {self.temp_raw_path}")


# ──────────────────────────────────────────────────────────────────────────────
# HELPER ACTIONS
# ──────────────────────────────────────────────────────────────────────────────

def login_as_preset(presenter: DemoPresenter, driver: webdriver.Chrome, wait: WebDriverWait, preset_keyword: str, base_url: str):
    """Safely navigates to login, scrolls to the preset, clicks it, and signs in."""
    if "/auth/login" not in driver.current_url:
        driver.get(f"{base_url}/auth/login")
        presenter.hold(1.0)

    presenter.ensure_hud()

    # Locate preset button inside right-side list
    preset_btn = wait.until(EC.presence_of_element_located((
        By.XPATH, f"//button[contains(., '{preset_keyword}')]"
    )))
    driver.execute_script("arguments[0].scrollIntoView({block: 'center', behavior: 'smooth'});", preset_btn)
    presenter.hold(0.3)
    presenter.highlight_and_click(preset_btn, wait_after=0.6)

    # Click Sign In button
    submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
    presenter.highlight_and_click(submit_btn, wait_after=1.8)

    # Wait for dashboard transition
    try:
        wait.until(EC.presence_of_element_located((By.XPATH, "//button[@title='Sign Out of Portal'] | //h1")))
    except Exception:
        pass
    presenter.ensure_hud()
    presenter.hold(1.0)


def sign_out(presenter: DemoPresenter, driver: webdriver.Chrome, wait: WebDriverWait, base_url: str):
    """Signs out of the current portal view and returns to the login page."""
    try:
        logout_btn = driver.find_element(By.XPATH, "//button[@title='Sign Out of Portal']")
        presenter.highlight_and_click(logout_btn, wait_after=1.0)
    except Exception:
        pass

    if "/auth/login" not in driver.current_url:
        driver.get(f"{base_url}/auth/login")
        presenter.hold(0.8)

    try:
        wait.until(EC.presence_of_element_located((By.XPATH, "//button[@type='submit']")))
    except Exception:
        pass
    presenter.ensure_hud()


def click_tab(driver: webdriver.Chrome, presenter: DemoPresenter, tab_keyword: str, wait_after: float = 1.5):
    """Finds a tab button matching tab_keyword, spotlights it, clicks it, and holds."""
    try:
        tab_btn = driver.find_element(By.XPATH, f"//button[contains(., '{tab_keyword}')]")
        presenter.highlight_and_click(tab_btn, wait_after=wait_after)
    except Exception:
        pass


# ──────────────────────────────────────────────────────────────────────────────
# MAIN DEMO WALKTHROUGH FLOW (ALL 12 CHAPTERS)
# ──────────────────────────────────────────────────────────────────────────────

def run_client_demo(base_url: str, output_path: str, headless: bool = False, fps: int = 15):
    print("=" * 80)
    print("🎬 STARTING 5 POINT ENGINEERING LMS — COMPLETE ALL-PROFILES CLIENT DEMO")
    print(f"Target URL:    {base_url}")
    print(f"Output Video:  {output_path}")
    print(f"Display Mode:  {'Headless (Background)' if headless else 'Headed (Interactive Display)'}")
    print("=" * 80)

    chrome_options = Options()
    if headless:
        chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_argument("--disable-infobars")
    chrome_options.add_argument("--disable-notifications")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--force-device-scale-factor=1")

    driver = webdriver.Chrome(options=chrome_options)
    driver.set_window_size(1920, 1080)
    wait = WebDriverWait(driver, 12)

    presenter = DemoPresenter(driver, video_path=output_path, fps=fps, width=1920, height=1080)

    try:
        # ======================================================================
        # CHAPTER 1: PUBLIC PORTAL & LIVE INQUIRY SUBMISSION
        # ======================================================================
        print("\n[Chapter 1/12] Public Institution Portal & Live Inquiry Submission...")
        driver.get(base_url)
        time.sleep(1.2)
        presenter.update_hud(
            chapter_num=1,
            title="Public Institution Website — 5 Point Engineering High School",
            description="CBSE Affiliated Senior Secondary School (Code 1930482) • Excellence in STEM & Academic Leadership",
            progress_pct=8
        )
        presenter.hold(2.5)

        # Highlight CBSE Accreditation badge
        try:
            cbse_badge = driver.find_element(By.XPATH, "//*[contains(text(), 'CBSE Affiliated')]")
            presenter.spotlight(cbse_badge, duration=1.0)
        except Exception:
            pass

        # Smooth scroll down to Key School Metrics
        presenter.smooth_scroll(scroll_by=480, steps=14)
        presenter.update_hud(
            chapter_num=1,
            title="Institutional Benchmarks & High Academic Rigor",
            description="100% CBSE Pass Rate • 45+ Students Scoring >95% • State-of-the-Art Engineering Labs",
            progress_pct=12
        )
        presenter.hold(2.2)

        # Smooth scroll further down to Academic Streams & Robotics Labs
        presenter.smooth_scroll(scroll_by=620, steps=16)
        presenter.update_hud(
            chapter_num=1,
            title="Curriculum & Labs: Robotics, AI & Commerce",
            description="Physics, Chemistry, Biology, CS with Python, Accountancy, and Dedicated Innovation Centers",
            progress_pct=15
        )
        presenter.hold(2.2)

        # Smooth scroll down to Admissions Inquiry Form
        presenter.smooth_scroll(scroll_by=650, steps=16)
        presenter.update_hud(
            chapter_num=1,
            title="Interactive Public Admission Inquiry Capture",
            description="Submitting live inquiry for Student Kabir Mehta (Grade 10) into the admissions CRM",
            progress_pct=18
        )

        # Fill and submit the inquiry form
        try:
            student_input = driver.find_element(By.XPATH, "//input[@placeholder='e.g. Aarav Sharma' or @name='studentName' or contains(@placeholder, 'Aarav')]")
            driver.execute_script("arguments[0].scrollIntoView({block: 'center', behavior: 'smooth'});", student_input)
            presenter.hold(0.4)
            student_input.send_keys("Kabir Mehta")

            guardian_input = driver.find_element(By.XPATH, "//input[@placeholder='e.g. Sanjay Sharma' or contains(@placeholder, 'Sharma') or @name='guardianName']")
            guardian_input.send_keys("Vikram Mehta")

            phone_input = driver.find_element(By.XPATH, "//input[@type='tel' or contains(@placeholder, '98450')]")
            phone_input.send_keys("+91 98450 77889")

            email_input = driver.find_element(By.XPATH, "//input[@type='email']")
            email_input.send_keys("kabir.parent@gmail.com")

            presenter.hold(1.0)

            # Submit inquiry
            enquiry_submit_btn = driver.find_element(By.XPATH, "//button[contains(., 'Submit Admission') or contains(., 'Enquiry')]")
            presenter.highlight_and_click(enquiry_submit_btn, wait_after=2.0)

            presenter.update_hud(
                chapter_num=1,
                title="Inquiry Registered in Real-Time!",
                description="Tracking reference number generated — Lead immediately available to Admissions Directorate",
                progress_pct=22
            )
            presenter.hold(2.2)
        except Exception as e:
            print(f"Note: Public inquiry fill skipped: {e}")

        # Scroll back up to the header and click "Portal Sign In"
        presenter.scroll_to_top(steps=18)
        portal_btn = wait.until(EC.element_to_be_clickable((
            By.XPATH, "//a[contains(text(), 'Portal Sign In') or contains(text(), 'Student & Staff Portal')]"
        )))
        presenter.highlight_and_click(portal_btn, wait_after=1.2)

        # ======================================================================
        # CHAPTER 2: AUTHENTICATION HUB & GRANULAR RBAC PRESETS
        # ======================================================================
        print("\n[Chapter 2/12] Unified Authentication & 9 Role Presets...")
        presenter.update_hud(
            chapter_num=2,
            title="Unified Single Sign-On & Role-Based Access Control",
            description="Granular permissions across 9 distinct roles: Trustees, Head of School, Coordinators, Faculty, Accounts & Students",
            progress_pct=25
        )
        presenter.hold(2.0)

        try:
            presets_panel = driver.find_element(By.XPATH, "//*[contains(text(), 'Quick Demo Access')]")
            presenter.spotlight(presets_panel, duration=1.2)
        except Exception:
            pass

        # ======================================================================
        # CHAPTER 3: STAKEHOLDER / TRUSTEE EXECUTIVE CONSOLE
        # ======================================================================
        print("\n[Chapter 3/12] Stakeholder / Trustee Executive Console...")
        presenter.update_hud(
            chapter_num=3,
            title="Profile 1: Managing Trustee & Stakeholder Console",
            description="School-wide governance, fee realization oversight, staff appointments & scholarship approvals",
            progress_pct=30
        )

        login_as_preset(presenter, driver, wait, "Stakeholder", base_url)

        presenter.update_hud(
            chapter_num=3,
            title="Executive Cockpit: High-Level Financial & Academic KPIs",
            description="Reconciled Collections (₹45,000) • Scholarships (₹5,000) • Active Receivables (₹25,000)",
            progress_pct=33
        )
        presenter.hold(2.5)

        # Tab: Concessions & Scholarships
        click_tab(driver, presenter, "Concessions")
        presenter.update_hud(
            chapter_num=3,
            title="Scholarship Approvals: Aarav Sharma (20% Academic Merit)",
            description="Class 9 State Olympiad Gold Medalist • Fiduciary audit trail with direct Trustee sign-off",
            progress_pct=36
        )
        presenter.hold(2.2)

        # Tab: Academic Rankings
        click_tab(driver, presenter, "Rankings")
        presenter.update_hud(
            chapter_num=3,
            title="Institutional Academic Standing & Cohort Analysis",
            description="Cross-section performance analysis and grade distribution for Class 10",
            progress_pct=38
        )
        presenter.hold(2.0)

        sign_out(presenter, driver, wait, base_url)

        # ======================================================================
        # CHAPTER 4: PRINCIPAL ACADEMIC OFFICE
        # ======================================================================
        print("\n[Chapter 4/12] Principal Academic Office...")
        presenter.update_hud(
            chapter_num=4,
            title="Profile 2: Principal & Head of Institution",
            description="Academic structure configuration, curriculum alignment, grade levels, and year-end promotions",
            progress_pct=42
        )

        login_as_preset(presenter, driver, wait, "Principal", base_url)

        presenter.update_hud(
            chapter_num=4,
            title="Institutional Structure: Class 10 & Class 11 Streams",
            description="Active Academic Year 2026-2027 • Stream differentiation (Science with Python vs. Commerce)",
            progress_pct=45
        )
        presenter.hold(2.5)

        # Tab: Academic Years Lifecycle
        click_tab(driver, presenter, "Academic Years")
        presenter.update_hud(
            chapter_num=4,
            title="Academic Years Lifecycle Management",
            description="2025-26 (CLOSED) • 2026-27 (ACTIVE) • 2027-28 (PLANNED) — Continuous operational continuity",
            progress_pct=48
        )
        presenter.hold(2.2)

        # Tab: Year-End Promotions
        click_tab(driver, presenter, "Promotions")
        presenter.update_hud(
            chapter_num=4,
            title="Automated Cohort Promotions & Matriculation",
            description="Criteria-based progression rules ensuring students meet attendance and academic benchmarks",
            progress_pct=50
        )
        presenter.hold(2.0)

        sign_out(presenter, driver, wait, base_url)

        # ======================================================================
        # CHAPTER 5: TEACHER INCHARGE CONSOLE (CLASS 10)
        # ======================================================================
        print("\n[Chapter 5/12] Teacher Incharge Console (Class 10)...")
        presenter.update_hud(
            chapter_num=5,
            title="Profile 3: Teacher Incharge (Senior PGT Sunita Sharma)",
            description="Grade-level academic coordination: Class 10 examinations, marks compilation & report card release",
            progress_pct=54
        )

        login_as_preset(presenter, driver, wait, "Teacher Incharge", base_url)

        presenter.update_hud(
            chapter_num=5,
            title="Class 10 Examination Administration",
            description="Mid-Term 2026 Examination cycle • Subject papers, maximum marks, and scheduling",
            progress_pct=57
        )
        presenter.hold(2.5)

        # Tab: Published Report Cards
        click_tab(driver, presenter, "Published Report Cards")
        presenter.update_hud(
            chapter_num=5,
            title="Official Report Cards Distribution Engine",
            description="Compiled marks published securely to student & parent digital portals with Principal remarks",
            progress_pct=60
        )
        presenter.hold(2.2)

        sign_out(presenter, driver, wait, base_url)

        # ======================================================================
        # CHAPTER 6: MULTI-ROLE FACULTY (TEACHER JOHN DOE)
        # ======================================================================
        print("\n[Chapter 6/12] Multi-Role Faculty (Teacher John Doe)...")
        presenter.update_hud(
            chapter_num=6,
            title="Profile 4: Multi-Role Faculty Suite (Teacher John Doe)",
            description="Demonstrating dual responsibilities: Section Head (10-A) AND Subject Teacher (10-B Mathematics)",
            progress_pct=64
        )

        login_as_preset(presenter, driver, wait, "Teacher John", base_url)

        # Role A: Section Head 10-A
        presenter.update_hud(
            chapter_num=6,
            title="Role A: Section Head (Class 10 - Section A)",
            description="Daily roll call register (98.5% attendance), student contact roster, and pastoral monitoring",
            progress_pct=67
        )
        presenter.hold(2.0)

        # Interactive Attendance action
        try:
            mark_all_btn = driver.find_element(By.XPATH, "//button[contains(., 'Mark All Present')]")
            presenter.highlight_and_click(mark_all_btn, wait_after=0.8)

            save_att_btn = driver.find_element(By.XPATH, "//button[contains(., 'Save Attendance')]")
            presenter.highlight_and_click(save_att_btn, wait_after=1.5)
            presenter.update_hud(
                chapter_num=6,
                title="Section Attendance Saved & Digitally Logged!",
                description="Instant synchronization with student attendance metrics and parent SMS notifications",
                progress_pct=70
            )
            presenter.hold(2.0)
        except Exception:
            pass

        # Switch to Role B: Subject Teacher via Navbar Dropdown
        try:
            role_switcher = driver.find_element(By.XPATH, "//button[contains(., 'Active Role:')]")
            presenter.highlight_and_click(role_switcher, wait_after=0.8)

            subj_option = driver.find_element(By.XPATH, "//button[contains(., 'Teacher (Mathematics')]")
            presenter.highlight_and_click(subj_option, wait_after=1.8)

            presenter.update_hud(
                chapter_num=6,
                title="Role B: Subject Teacher (Mathematics 10-B)",
                description="Seamless workspace switch: Curriculum delivery, homework assignments & exam grading",
                progress_pct=73
            )
            presenter.hold(2.5)

            # View marks tab & save marks
            click_tab(driver, presenter, "Submissions", wait_after=1.2)
            presenter.hold(1.5)
        except Exception:
            pass

        sign_out(presenter, driver, wait, base_url)

        # ======================================================================
        # CHAPTER 7: SCIENCE SUBJECT TEACHER (TEACHER PRIYA NAIR)
        # ======================================================================
        print("\n[Chapter 7/12] Dedicated Science Subject Teacher (Priya Nair)...")
        presenter.update_hud(
            chapter_num=7,
            title="Profile 5: Subject Teacher (TGT Science Priya Nair)",
            description="Pure Sciences curriculum delivery across Section 10-A and 10-B (Physics, Chemistry, Biology)",
            progress_pct=76
        )

        login_as_preset(presenter, driver, wait, "Teacher Priya", base_url)

        presenter.update_hud(
            chapter_num=7,
            title="Science Curriculum Delivery & Lab Journals",
            description="Active Offering: Science (SCI10) • Chemical Reactions Lab Observation Journal assignments",
            progress_pct=79
        )
        presenter.hold(2.5)

        sign_out(presenter, driver, wait, base_url)

        # ======================================================================
        # CHAPTER 8: ACCOUNTS & BURSAR'S DIRECTORATE
        # ======================================================================
        print("\n[Chapter 8/12] Accounts & Bursar's Directorate...")
        presenter.update_hud(
            chapter_num=8,
            title="Profile 6: Accounts & Bursar's Directorate",
            description="Fee collection, ledger management, UPI/Cheque reconciliation, and immutable receipt posting",
            progress_pct=82
        )

        login_as_preset(presenter, driver, wait, "Accounts Officer", base_url)

        presenter.update_hud(
            chapter_num=8,
            title="Audited Fee Ledger & Posted Payment Receipts",
            description="Showing verified receipt REC-2026-0001 (Aarav Sharma ₹20,000 via UPI)",
            progress_pct=85
        )
        presenter.hold(2.2)

        # Interactive Action: Record Payment
        try:
            record_pay_btn = driver.find_element(By.XPATH, "//button[contains(., 'Record Offline Payment Receipt')]")
            presenter.highlight_and_click(record_pay_btn, wait_after=1.0)
            presenter.update_hud(
                chapter_num=8,
                title="Instant Offline Payment Processing",
                description="Recording Term 1 Fee for Student Rohan Gupta (ADM2026003) via UPI Transfer",
                progress_pct=87
            )
            presenter.hold(1.5)

            submit_pay = driver.find_element(By.XPATH, "//form//button[@type='submit']")
            presenter.highlight_and_click(submit_pay, wait_after=2.0)

            presenter.update_hud(
                chapter_num=8,
                title="Payment Successfully Reconciled!",
                description="Receipt generated instantly with tamper-evident digital tracking code",
                progress_pct=89
            )
            presenter.hold(2.2)
        except Exception:
            pass

        # Tab: Fee Plans & Installments
        click_tab(driver, presenter, "Fee Plans")
        presenter.update_hud(
            chapter_num=8,
            title="Curriculum Fee Schedules & Installment Architecture",
            description="Configured fee heads: Tuition, Lab & Equipment, Sports & Institutional Development",
            progress_pct=91
        )
        presenter.hold(2.2)

        sign_out(presenter, driver, wait, base_url)

        # ======================================================================
        # CHAPTER 9: ADMISSIONS DIRECTORATE
        # ======================================================================
        print("\n[Chapter 9/12] Admissions Directorate...")
        presenter.update_hud(
            chapter_num=9,
            title="Profile 7: Admissions Directorate",
            description="Inquiry pipeline processing, financial clearance audit, and automated student matriculation",
            progress_pct=93
        )

        login_as_preset(presenter, driver, wait, "Admissions Officer", base_url)

        presenter.update_hud(
            chapter_num=9,
            title="Online Leads & Walk-In Inquiries Pipeline",
            description="Including website inquiry submitted for Kabir Mehta in Chapter 1 ready for counselor review",
            progress_pct=94
        )
        presenter.hold(2.5)

        # Tab: Cleared Applications & Matriculation
        click_tab(driver, presenter, "Cleared Applications")
        presenter.update_hud(
            chapter_num=9,
            title="Financial Clearance & Final Student Matriculation",
            description="Applicant Kiran Desai cleared by Accounts Directorate — One-click digital matriculation",
            progress_pct=95
        )
        presenter.hold(1.8)

        # Click Finalize Matriculation
        try:
            matriculate_btn = driver.find_element(By.XPATH, "//button[contains(., 'Finalize Matriculation')]")
            presenter.highlight_and_click(matriculate_btn, wait_after=2.0)
            presenter.update_hud(
                chapter_num=9,
                title="Matriculation Complete & Credentials Provisioned!",
                description="Student admitted with auto-generated admission number and instant portal credentials",
                progress_pct=96
            )
            presenter.hold(2.2)
        except Exception:
            pass

        sign_out(presenter, driver, wait, base_url)

        # ======================================================================
        # CHAPTER 10: STUDENT & PARENT DIGITAL PORTAL (AARAV SHARMA)
        # ======================================================================
        print("\n[Chapter 10/12] Student & Parent Portal (Aarav Sharma)...")
        presenter.update_hud(
            chapter_num=10,
            title="Profile 8: Student & Parent Digital Portal",
            description="Student Aarav Sharma • Class 10-A • Roll #1 • 98.5% Attendance (Top Standing)",
            progress_pct=97
        )

        login_as_preset(presenter, driver, wait, "Student: Aarav", base_url)

        presenter.update_hud(
            chapter_num=10,
            title="Student Digital ID & Academic Overview",
            description="Real-time attendance (98.5%), Rank #1 in Class, Coursework status and curriculum timeline",
            progress_pct=97.5
        )
        presenter.hold(2.2)

        # Tab: Coursework
        click_tab(driver, presenter, "Coursework")
        presenter.update_hud(
            chapter_num=10,
            title="Coursework Submissions: Science Lab Journal",
            description="Displacement reactions observation journal (24/25) with detailed instructor feedback",
            progress_pct=98
        )
        presenter.hold(2.2)

        # Tab: Official CBSE Report Cards
        click_tab(driver, presenter, "Report Cards")
        presenter.update_hud(
            chapter_num=10,
            title="CBSE Mid-Term Report Card: 95.0% Aggregate (Grade A1)",
            description="Itemized score breakdown across Mathematics, Science, English, SST with Principal endorsement",
            progress_pct=98.5
        )
        presenter.hold(2.5)

        # Tab: Fee Account & Receipts
        click_tab(driver, presenter, "Fee")
        presenter.update_hud(
            chapter_num=10,
            title="Fee Transparency: ₹25,000 Tuition - ₹5,000 Scholarship = ₹0 Net Dues",
            description="Verified payment receipt REC-2026-0001 • Merit scholarship deduction fully itemized",
            progress_pct=99
        )
        presenter.hold(2.8)

        sign_out(presenter, driver, wait, base_url)

        # ======================================================================
        # CHAPTER 11: STUDENT DUES & REMINDER VIEW (ROHAN GUPTA)
        # ======================================================================
        print("\n[Chapter 11/12] Student Fee Dues Reminder View (Rohan Gupta)...")
        presenter.update_hud(
            chapter_num=11,
            title="Profile 9: Student Fee Dues Tracking (Rohan Gupta - Class 10-B)",
            description="Student Rohan Gupta • Showing transparent fee dues reminder and pending semester balance",
            progress_pct=99.5
        )

        login_as_preset(presenter, driver, wait, "Student: Rohan", base_url)

        click_tab(driver, presenter, "Fee")
        presenter.update_hud(
            chapter_num=11,
            title="Proactive Fee Reminders & Defaulter Mitigation",
            description="Transparent financial billing keeping parents informed of upcoming due dates",
            progress_pct=99.8
        )
        presenter.hold(2.5)

        sign_out(presenter, driver, wait, base_url)

        # ======================================================================
        # CHAPTER 12: GRAND FINALE & INSTITUTIONAL OUTRO
        # ======================================================================
        print("\n[Chapter 12/12] Grand Finale & Summary...")
        driver.get(base_url)
        time.sleep(1.0)
        presenter.update_hud(
            chapter_num=12,
            title="5 Point Engineering High School — The Complete School Platform",
            description="100% Integrated • Fiduciary Governance • Dual-Role Faculty Workspaces • Real-Time Parent Portals",
            progress_pct=100
        )
        presenter.hold(3.5)

        print("\n[Presenter] Walkthrough completed successfully! Finalizing video encoding...")

    except Exception as e:
        print(f"\n[Error] Exception during walkthrough: {e}")
        import traceback
        traceback.print_exc()

    finally:
        presenter.finalize()
        driver.quit()
        print("=" * 80)
        print("🎉 CLIENT DEMO & SCREEN RECORDING COMPLETE!")
        print("=" * 80)


# ──────────────────────────────────────────────────────────────────────────────
# CLI ENTRY POINT
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="5 Point Engineering LMS — All-Profiles Selenium Demo & Screen Recorder")
    parser.add_argument("--url", default="http://localhost:3005", help="Base URL of the running portal (default: http://localhost:3005)")
    parser.add_argument("--output", default="5_Point_Engineering_LMS_Client_Demo.mp4", help="Output MP4 file path (default: 5_Point_Engineering_LMS_Client_Demo.mp4)")
    parser.add_argument("--headless", action="store_true", default=False, help="Run Chrome in headless mode (default: False / headed)")
    parser.add_argument("--fps", type=int, default=15, help="Video frame rate (default: 15)")

    args = parser.parse_args()
    run_client_demo(base_url=args.url, output_path=args.output, headless=args.headless, fps=args.fps)
