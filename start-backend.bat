@echo off
echo ===================================================
echo Starting Hyperproof Risk Register Backend (Spring Boot)
echo ===================================================
cd /d "%~dp0backend"
mvn spring-boot:run
pause
