@echo off
copy /Y C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe %~dp0powershell.exe >nul
%~dp0powershell.exe %*
