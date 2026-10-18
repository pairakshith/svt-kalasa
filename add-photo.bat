@echo off
chcp 65001 >nul
title SVT Kalasa - Quick Photo Publisher

if "%~1"=="" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\add-photo.ps1"
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\add-photo.ps1" -ImagePath "%~1"
)

pause

