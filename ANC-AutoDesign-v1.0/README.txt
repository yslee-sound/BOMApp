========================================
ANC Auto Design System v1.0
========================================

HOW TO RUN:
  1. Double-click ANC-AutoDesign.exe
  2. Browser will open automatically (http://localhost:8000)
  3. If browser doesn't open, manually open the URL

HOW TO STOP:
  - Close the browser and terminate process in Task Manager
  - Or press Ctrl+C if console window is visible

NOTES:
  - Do not move the exe file while it's running
  - Port 8000 must be available
  - Firewall or antivirus may block it (allow if needed)

TROUBLESHOOTING:
  
  Won't run:
    - If Windows Defender SmartScreen warning appears:
      Click "More info" -> "Run anyway"
    
  Port conflict:
    - Close programs using port 8000
    - Check: netstat -ano | findstr :8000
  
  Reset data:
    - Delete .db files in the same folder as exe

DATA STORAGE:
  - Program data is stored in the same folder as exe
  - Backup .db files if needed

VERSION INFO:
  - Version: 1.0.0
  - Build date: 2026-02-27

========================================
