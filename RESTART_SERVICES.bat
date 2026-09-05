@echo off
echo ===================================================
echo   BlockCred - Full Java Web Application Launcher
echo ===================================================

echo [1/2] Stopping any existing processes on port 8080...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul

echo [2/2] Launching Java Spring Boot Application (Port 8080)...
cd core-service
start /b cmd /c "mvnw.cmd spring-boot:run"
cd ..

echo ===================================================
echo   Application is launching!
echo   Open in browser: http://localhost:8080
echo   H2 Console:      http://localhost:8080/h2-console
echo ===================================================
