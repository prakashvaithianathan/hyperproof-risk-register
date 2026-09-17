@echo off
echo ===================================================
echo Starting Hyperproof Risk Register (Full Stack)
echo ===================================================
echo Starting Spring Boot Backend on port 8080...
start "Hyperproof Risk Backend (Port 8080)" cmd /k "cd /d "%~dp0backend" && mvn spring-boot:run"

echo Starting React Frontend on port 5173...
start "Hyperproof Risk Frontend (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"

echo ===================================================
echo Both services are launching!
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:5173
echo ===================================================
