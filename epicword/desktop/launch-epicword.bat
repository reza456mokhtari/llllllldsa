@echo off
rem EpicWord desktop launcher — Microsoft Edge in app mode (no install needed)
setlocal
set "TARGET=%~dp0..\index.html"
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="file:///%TARGET:\=/%"
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="file:///%TARGET:\=/%"
) else (
  start "" "" file:///%TARGET:\=/%
)
