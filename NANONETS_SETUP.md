# Nanonets Integration Setup Guide

## Overview

The AI model has been updated to integrate with Nanonets API for more accurate field extraction from educational documents. The system will automatically use Nanonets if configured, otherwise it falls back to the existing EasyOCR + regex approach.

## Configuration

To enable Nanonets integration, set the following environment variables:

```bash
# Windows (PowerShell)
$env:NANONETS_API_KEY="your_api_key_here"
$env:NANONETS_MODEL_ID="your_model_id_here"

# Windows (CMD)
set NANONETS_API_KEY=your_api_key_here
set NANONETS_MODEL_ID=your_model_id_here

# Linux/Mac
export NANONETS_API_KEY="your_api_key_here"
export NANONETS_MODEL_ID="your_model_id_here"
```

## How to Get Your Nanonets Credentials

1. **API Key**: 
   - Log in to your Nanonets account at https://app.nanonets.com
   - Go to Settings → API Keys
   - Copy your API key

2. **Model ID**:
   - Go to your model page in Nanonets
   - The Model ID is in the URL: `https://app.nanonets.com/#/apikey?t=model&appId=YOUR_MODEL_ID`
   - Or check the API documentation for your specific model

## Field Mapping

The system maps Nanonets field labels to form fields as follows:

### Basic Information
- `SCHOOL_NAME` → Senior High School Name
- `SCHOOL_ADDRESS` → School Address (optional)
- `FULL_NAME` → Full Name (optional)
- `JHS_COMPLETION_YEAR` → Junior HS Completion Year
- `SHS_COMPLETION_YEAR` → Senior HS Completion Year
- `TRACK_STRAND` → Track and Strand (parsed automatically)

### Junior High School Grades
- `10_MATH` → Mathematics Grade
- `10_SCI` → Science Grade
- `10_ENG` → English Grade

### Grade 11 Priority Subjects (Semester 1)
- `S_PRECAL` → Pre-Calculus (g11MathGrade1)
- `S_EARTHSCI` → Earth Science (g11ScienceGrade1)
- `S_ORALCOM` → Oral Communication (g11EnglishGrade1)

### Grade 11 Priority Subjects (Semester 2)
- `S_BASICCAL` → Basic Calculus (g11MathGrade2)
- `S_GENCHEMI` → General Chemistry I (g11ScienceGrade2)
- `S_READWRI` → Reading and Writing (g11EnglishGrade2)

### Alternative Subjects
- `ALT_GENMATH` → General Mathematics (alternative for Pre-Calculus)
- `ALT_STATPROB` → Statistics and Probability (alternative for Basic Calculus)
- `ALT_ENGAP` → English for Academic Purposes (alternative for Oral Communication)
- `ALT_GENCHEM_II` → General Chemistry II
- `ALT_GENPHYS_I` → General Physics I
- `ALT_GENBIO_I` → General Biology I
- `ALT_DRRR_NS` → Disaster Readiness & Risk Reduction
- `NS_*` variants → Non-standard/alternative subjects

## How It Works

1. When a file is uploaded, the system first checks if Nanonets is configured
2. If configured, it calls the Nanonets API with the uploaded file
3. Nanonets returns extracted fields based on the trained model
4. The system maps Nanonets field labels to form field names
5. Grade 11 entries are automatically processed with priority/alternative logic
6. If Nanonets is not configured or fails, it falls back to EasyOCR + regex

## Testing

To test the integration:

1. Set the environment variables
2. Restart the AI service (if running)
3. Upload a test document through the educattach.html page
4. Check the browser console and server logs for any errors
5. Verify that fields are auto-filled correctly

## Troubleshooting

### Nanonets API Not Working
- Check that API key and Model ID are correct
- Verify the model is active and trained in Nanonets
- Check network connectivity
- Review server logs for API error messages
- The system will automatically fall back to OCR if Nanonets fails

### Fields Not Mapping Correctly
- Verify that field labels in Nanonets match the labels in `NANONETS_FIELD_MAPPING`
- Check that the Nanonets model is extracting the correct field names
- Review the mapping in `ai/attachment_analyzer.py` if needed

### Grade 11 Fields Not Filling
- Ensure the JavaScript is updated (grade11 handling added)
- Check browser console for JavaScript errors
- Verify that Nanonets is returning grade11 entries in the response

## Notes

- The system maintains backward compatibility - if Nanonets is not configured, it uses the existing OCR method
- Grade extraction automatically validates that grades are between 60-100
- Alternative subjects are only used if the priority subject is not found
- The mapping supports both priority subjects and their alternatives

