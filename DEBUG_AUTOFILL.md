# Debugging Auto-Fill Issues

## Changes Made

1. **Fixed JavaScript** - Now auto-fills for ALL files (not just file 1)
2. **Added Console Logging** - Check browser console (F12) to see what's happening
3. **Added Python Logging** - Check AI service terminal to see Nanonets responses

## How to Debug

### Step 1: Open Browser Console
1. Go to `educattach.html`
2. Press **F12** to open Developer Tools
3. Click on the **Console** tab

### Step 2: Upload a File
1. Upload any document (Grades Form 1, JHS Form 137, or SHS Form 137)
2. Watch the console for messages like:
   - "AI Analysis Result: ..."
   - "Applying auto-fill from AI: ..."
   - "Setting input ... = ..."
   - "Element not found for selector: ..."

### Step 3: Check AI Service Terminal
Look for messages like:
- `[Nanonets] API call successful for document type: ...`
- `[Nanonets] Extracted X fields: [...]`
- `[Nanonets] Mapping ... -> ...`
- `[Fallback] Using OCR instead of Nanonets...`

## Common Issues

### Issue 1: "No fields found in AI analysis"
**Cause:** Nanonets didn't extract any fields, or response structure is different
**Fix:** Check AI service terminal for Nanonets response structure

### Issue 2: "Element not found for selector"
**Cause:** Field name doesn't match HTML form field name
**Fix:** Check the field mapping in `NANONETS_FIELD_MAPPING`

### Issue 3: "[Fallback] Using OCR instead of Nanonets"
**Cause:** Nanonets API call failed or not configured
**Fix:** 
- Check if environment variables are set
- Verify API key and model IDs are correct
- Check network connectivity

### Issue 4: Fields extracted but not filling
**Cause:** Field names don't match form field names
**Fix:** Check console logs to see what fields are being set vs what fields exist

## What to Check

1. **Browser Console (F12)**
   - Is `applyAutoFillFromAI` being called?
   - What fields are in the `analysis.fields` object?
   - Are elements being found?

2. **AI Service Terminal**
   - Is Nanonets being called?
   - What fields is Nanonets extracting?
   - Is the mapping working?

3. **Network Tab (F12)**
   - Is the API call to `/attachments/analyze` successful?
   - What's the response from the API?

## Next Steps

After checking the logs, we can:
1. Fix field name mismatches
2. Adjust Nanonets response parsing
3. Update field mappings
4. Fix any other issues found

