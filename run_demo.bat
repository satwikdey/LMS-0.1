@echo off
setlocal
title 5 Point Engineering LMS - Client Demo & Screen Recorder

echo =========================================================================
echo   5 POINT ENGINEERING HIGH SCHOOL - CLIENT DEMO & SCREEN RECORDER
echo =========================================================================
echo.

:: Check Python installation
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.10+ and re-run.
    pause
    exit /b 1
)

:: Check if local portal is responding on port 3005 or port 3000
set "PORTAL_URL=http://localhost:3005"
if not "%~1"=="" set "PORTAL_URL=%~1"

echo [*] Target Portal URL: %PORTAL_URL%
echo [*] Output Video:     5_Point_Engineering_LMS_Client_Demo.mp4
echo.
echo Launching automated demonstration with real-time on-screen HUD...
echo You can watch the demo live in the Chrome window while it records!
echo.

python scripts\record_client_demo.py --url %PORTAL_URL% --output 5_Point_Engineering_LMS_Client_Demo.mp4 %2 %3 %4 %5

if errorlevel 0 (
    echo.
    echo =========================================================================
    echo [SUCCESS] Demo presentation recorded successfully!
    echo Video saved to: 5_Point_Engineering_LMS_Client_Demo.mp4
    echo =========================================================================
) else (
    echo.
    echo [ERROR] Demo recording exited with an error. Please check logs above.
)

echo.
pause
