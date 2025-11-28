# Testing Guide - Nanonets Integration

## Quick Answer: Will it be more effective?

**YES!** Here's why:

### Before (Old System):
- ❌ Used EasyOCR + regex patterns
- ❌ Generic text extraction
- ❌ Pattern matching that could miss variations
- ❌ Less accurate field extraction

### Now (With Nanonets):
- ✅ Uses trained AI models specifically for each document type
- ✅ Models trained on actual Forms 137 and Grades Forms
- ✅ Better understanding of document structure
- ✅ More accurate field extraction
- ✅ Handles variations in document formats better

## How to Test

### Step 1: Start the AI Service

**Option A: Using PowerShell (Recommended)**
```powershell
.\start-ai-service.ps1
```

**Option B: Using Batch File**
```cmd
start-ai-validator-with-nanonets.bat
```

**Option C: Manual Start**
```powershell
# Set environment variables
$env:NANONETS_API_KEY = "5078eb1d-b0db-11f0-890d-e6e0013317b1"
$env:NANONETS_MODEL_ID_GRADES_FORM_1 = "ab11f2c6-728c-4024-8f33-ed6a25cf0ab0"
$env:NANONETS_MODEL_ID_JHS_137 = "4b96dc43-641d-4c60-99cd-c73e89e5f765"
$env:NANONETS_MODEL_ID_SHS_137 = "be5fec5f-0dec-43ad-8ba3-2344ce3a78bf"

# Start service
.\ai-venv\Scripts\uvicorn ai.api:app --host 127.0.0.1 --port 5001
```

### Step 2: Verify Service is Running

Open browser and go to:
```
http://127.0.0.1:5001/health
```

You should see: `{"status":"ok"}`

### Step 3: Start XAMPP (if not already running)

1. Open XAMPP Control Panel
2. Start **Apache**
3. Start **MySQL** (if using database)

### Step 4: Access Your Website

Open your browser and go to:
```
http://localhost/combined-main/college-admission-portal/educattach.html
```

### Step 5: Test File Upload

1. **Upload Grades Form 1** (File 1)
   - Click "Choose File" for "Grades Form 1 (for Regular Admission)"
   - Select a Grades Form 1 PDF/image
   - Watch for "Analyzing..." message
   - Check if fields auto-fill:
     - School Name
     - Track and Strand
     - Completion Years
     - JHS Grades (Math, Science, English)
     - Grade 11 Grades

2. **Upload JHS Form 137** (File 2)
   - Click "Choose File" for "Junior High School Form 137"
   - Select a JHS Form 137 document
   - Check if JHS information is extracted

3. **Upload SHS Form 137** (File 3)
   - Click "Choose File" for "Senior High School Form 137"
   - Select a SHS Form 137 document
   - Check if SHS information and Grade 11 grades are extracted

## What to Look For

### ✅ Success Indicators:
- File upload shows "Analyzing..." then "AI ✓" checkmark
- Form fields automatically fill with extracted data
- Grades appear in the correct fields
- No error messages in browser console (F12)

### ⚠️ If Something Goes Wrong:

1. **Check Browser Console (F12)**
   - Look for errors in the Console tab
   - Check Network tab for failed API calls

2. **Check AI Service Terminal**
   - Look for error messages
   - Check if Nanonets API is being called
   - Verify environment variables are set

3. **Common Issues:**
   - **"AI analysis failed"** → Check if AI service is running
   - **"Authentication failed"** → Verify Nanonets API key is correct
   - **Fields not filling** → Check if model is extracting the right fields
   - **Timeout errors** → Large PDFs may take longer, be patient

## Testing Checklist

- [ ] AI service is running on port 5001
- [ ] XAMPP Apache is running
- [ ] Can access educattach.html page
- [ ] Upload Grades Form 1 - fields auto-fill
- [ ] Upload JHS Form 137 - JHS data extracted
- [ ] Upload SHS Form 137 - SHS data and grades extracted
- [ ] Grade 11 grades appear in correct fields
- [ ] Alternative subjects are selected when needed
- [ ] No errors in browser console
- [ ] No errors in AI service terminal

## Expected Improvements

You should notice:
- **Better accuracy** in field extraction
- **Fewer manual corrections** needed
- **Faster processing** (trained models are optimized)
- **Better handling** of different document formats
- **More reliable** grade extraction

## Need Help?

If something doesn't work:
1. Check the AI service terminal for error messages
2. Open browser console (F12) and check for JavaScript errors
3. Verify all three Nanonets models are accessible: `python test-all-nanonets-models.py`
4. Make sure environment variables are set in the terminal running the AI service

