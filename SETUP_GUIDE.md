# College Admission Portal - Setup Guide

This guide will help you set up the project on a new machine.

## Prerequisites

1. **XAMPP** (includes Apache, MySQL, and phpMyAdmin)
   - Download from: https://www.apachefriends.org/
   - Install and start Apache + MySQL from XAMPP Control Panel

2. **Python 3.11+** (for AI services)
   - Download from: https://www.python.org/downloads/
   - During installation, check "Add Python to PATH"

## Step 1: Project Files Setup

1. Extract the project folder to: `C:\xampp\htdocs\combined-main`
   - Or any location, but update paths accordingly

2. Verify the folder structure:
   ```
   combined-main/
   ├── ai/
   ├── backend/
   ├── college-admission-portal/
   └── ...
   ```

## Step 2: Database Setup

### Export Database (from original machine):
1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Select database: **"student account"**
3. Click **"Export"** tab
4. Choose **"Quick"** method
5. Click **"Go"** to download the `.sql` file
6. Send this `.sql` file to your partner

### Import Database (on new machine):
1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Click **"New"** to create a database
3. Name it: **"student account"** (exact name, including space)
4. Select the database
5. Click **"Import"** tab
6. Choose the `.sql` file you received
7. Click **"Go"** to import

### Verify Database Connection:
1. Check `backend/db_connection.php`:
   ```php
   $servername = "localhost";
   $username = "root";        // Change if your MySQL user is different
   $password = "";            // Change if you set a MySQL password
   $dbname = "student account";
   ```
2. Update credentials if needed (if you set a MySQL password during XAMPP setup)

## Step 3: Python Environment Setup

1. Open PowerShell or Command Prompt
2. Navigate to project folder:
   ```bash
   cd C:\xampp\htdocs\combined-main
   ```

3. Create virtual environment:
   ```bash
   python -m venv ai-venv
   ```

4. Activate virtual environment:
   ```bash
   ai-venv\Scripts\activate
   ```

5. Install Python dependencies:
   ```bash
   pip install -r ai\requirements.txt
   ```
   - This will take several minutes (downloads ~500MB+ of packages)
   - If you see errors, make sure Python 3.11+ is installed

## Step 4: Start the AI Service

1. Make sure virtual environment is activated (you should see `(ai-venv)` in your prompt)

2. Start the FastAPI service:
   ```bash
   uvicorn ai.api:app --host 127.0.0.1 --port 5001
   ```

3. Keep this terminal window open while testing
   - You should see: `INFO:     Uvicorn running on http://127.0.0.1:5001`

4. Test the service:
   - Open browser: `http://127.0.0.1:5001/health`
   - Should return: `{"status":"ok"}`

## Step 5: Access the Website

1. Make sure **Apache** is running in XAMPP Control Panel

2. Open browser and go to:
   ```
   http://localhost/combined-main/college-admission-portal/landing.php
   ```
   Or:
   ```
   http://localhost/combined-main/college-admission-portal/index.html
   ```

## Step 6: Optional - AI Model File

If you have a custom Keras model for quality checking:
1. Place it at: `ai/models/grades_quality.keras`
2. The system will use it automatically if present

## Troubleshooting

### Database Connection Error:
- Check XAMPP MySQL is running
- Verify database name matches exactly: `"student account"`
- Check `backend/db_connection.php` credentials

### AI Service Not Working:
- Make sure Python virtual environment is activated
- Check port 5001 is not in use by another program
- Verify all dependencies installed: `pip list`

### "Failed to fetch" Error:
- Make sure AI service is running (`http://127.0.0.1:5001/health`)
- Check browser console (F12) for detailed error messages
- Ensure you're accessing via `http://localhost/...` not `file:///...`

### Files Not Uploading:
- Check `backend/` folder permissions
- Verify Apache is running
- Check PHP error logs in XAMPP

## Quick Start Checklist

- [ ] XAMPP installed and Apache + MySQL running
- [ ] Project files extracted to `htdocs/combined-main`
- [ ] Database imported into phpMyAdmin
- [ ] `backend/db_connection.php` credentials updated
- [ ] Python 3.11+ installed
- [ ] Virtual environment created and activated
- [ ] Dependencies installed (`pip install -r ai/requirements.txt`)
- [ ] AI service running (`uvicorn ai.api:app --host 127.0.0.1 --port 5001`)
- [ ] Website accessible at `http://localhost/combined-main/...`

## Notes

- The AI service must be running for file uploads to work properly
- Keep the terminal with `uvicorn` open while testing
- Database name has a space: `"student account"` (not `student_account`)
- For production, consider using environment variables for database credentials

---

**Need Help?** Check the error messages in:
- Browser console (F12)
- XAMPP error logs
- Python terminal output



