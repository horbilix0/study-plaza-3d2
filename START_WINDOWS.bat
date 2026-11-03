@echo off
setlocal
cd /d "%~dp0"
title Study Plaza 3D Launcher
echo.
echo ==============================================
echo         STUDY PLAZA 3D - FIXED LAUNCHER
echo ==============================================
echo.
where node >nul 2>&1
if errorlevel 1 (
  echo [HATA] Node.js bulunamadi.
  echo https://nodejs.org adresinden LTS surumunu kur.
  echo Sonra bu dosyayi yeniden ac.
  pause
  exit /b 1
)
set "PORT=4174"
echo Sunucu yeni pencerede aciliyor. Port: %PORT%
start "Study Plaza 3D Server" /min cmd /k "set PORT=%PORT%&&node server.mjs"
set /a attempt=0
:CHECK_READY
powershell -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 'http://127.0.0.1:4174/api/health'; if($r.StatusCode -eq 200){exit 0} } catch {} exit 1" >nul 2>&1
if not errorlevel 1 goto READY
set /a attempt+=1
if %attempt% GEQ 15 goto FAILED
timeout /t 1 /nobreak >nul
goto CHECK_READY
:READY
echo [OK] Study Plaza hazir. Tarayici aciliyor...
start "" "http://127.0.0.1:4174"
exit /b 0
:FAILED
echo.
echo [HATA] Sunucu baslatilamadi. "Study Plaza 3D Server" penceresindeki hatayi kontrol et.
echo Node.js surumu en az 18 olmali.
pause
exit /b 1
