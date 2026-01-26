@echo off
echo ========================================
echo PDFify Frontend Setup
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js 20+ from https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js found

echo.
echo [2/4] Installing dependencies...
call pnpm install
if errorlevel 1 (
    echo.
    echo pnpm not found, trying npm...
    call npm install
)

echo.
echo [3/4] Setting up environment file...
if not exist .env (
    copy .env.example .env
    echo ✓ Created .env file
    echo.
    echo ⚠️  Update VITE_API_URL in .env if needed
    echo Default: http://localhost:5000
    echo.
) else (
    echo ✓ .env file already exists
)

echo.
echo [4/4] Setup complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Make sure backend is running
echo 2. Run: pnpm dev (to start development server)
echo.
echo Frontend will be at: http://localhost:5173
echo ========================================
pause
