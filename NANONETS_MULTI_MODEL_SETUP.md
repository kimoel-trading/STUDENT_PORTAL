# Nanonets Multi-Model Setup Guide

## Overview

Your system uses **three different Nanonets models** for different document types:

1. **Grades Form 1** - For Regular Admission grades form
2. **Junior High School Form 137** - For JHS transcript
3. **Senior High School Form 137** - For SHS transcript

The system automatically selects the correct model based on which file is being uploaded.

## Configuration

### Environment Variables

All three models are configured via environment variables:

```powershell
# API Key (shared across all models)
NANONETS_API_KEY = "5078eb1d-b0db-11f0-890d-e6e0013317b1"

# Model IDs for each document type
NANONETS_MODEL_ID_GRADES_FORM_1 = "ab11f2c6-728c-4024-8f33-ed6a25cf0ab0"
NANONETS_MODEL_ID_JHS_137 = "4b96dc43-641d-4c60-99cd-c73e89e5f765"
NANONETS_MODEL_ID_SHS_137 = "be5fec5f-0dec-43ad-8ba3-2344ce3a78bf"
```

### Quick Setup

Run the setup script:
```powershell
.\setup-all-nanonets-models.ps1
```

Or set manually:
```powershell
$env:NANONETS_API_KEY = "5078eb1d-b0db-11f0-890d-e6e0013317b1"
$env:NANONETS_MODEL_ID_GRADES_FORM_1 = "ab11f2c6-728c-4024-8f33-ed6a25cf0ab0"
$env:NANONETS_MODEL_ID_JHS_137 = "4b96dc43-641d-4c60-99cd-c73e89e5f765"
$env:NANONETS_MODEL_ID_SHS_137 = "be5fec5f-0dec-43ad-8ba3-2344ce3a78bf"
```

## How It Works

### Document Type Detection

When a file is uploaded through `educattach.html`, the system:

1. **Receives the document label** from the upload form:
   - File 1: "Grades Form 1 (for Regular Admission)"
   - File 2: "Junior High School Form 137"
   - File 3: "Senior High School Form 137"

2. **Selects the appropriate model** based on the label:
   - Contains "Grades Form 1" or "Regular Admission" → Uses `MODEL_ID_GRADES_FORM_1`
   - Contains "Junior" and "137" → Uses `MODEL_ID_JHS_137`
   - Contains "Senior" and "137" → Uses `MODEL_ID_SHS_137`

3. **Calls the Nanonets API** with the selected model

4. **Maps extracted fields** to form fields using the field mapping

### Model Selection Logic

The code in `ai/attachment_analyzer.py` uses this logic:

```python
def _get_model_id_for_document(self, document_type: Optional[str]) -> Optional[str]:
    doc_lower = document_type.lower()
    
    if "grades form 1" in doc_lower or "regular admission" in doc_lower:
        return self._nanonets_models.get("grades_form_1")
    elif "junior" in doc_lower and "137" in doc_lower:
        return self._nanonets_models.get("jhs_137")
    elif "senior" in doc_lower and "137" in doc_lower:
        return self._nanonets_models.get("shs_137")
    
    # Default fallback
    return self._nanonets_models.get("grades_form_1")
```

## Testing

Test all three models:
```bash
python test-all-nanonets-models.py
```

This will verify:
- ✅ All environment variables are set
- ✅ All three models are accessible via API
- ✅ Authentication is working

## Field Mapping

Each model extracts different fields:

### Grades Form 1 Model
- School information (name, address)
- Track and Strand
- Completion years
- Junior High School grades (10_MATH, 10_SCI, 10_ENG)
- Grade 11 subjects and grades

### JHS Form 137 Model
- Junior High School information
- JHS completion year
- JHS grades

### SHS Form 137 Model
- Senior High School information
- SHS completion year
- Grade 11 subjects and grades
- Track and Strand information

## Troubleshooting

### Model Not Selected Correctly
- Check that the document label matches the expected patterns
- Verify environment variables are set correctly
- Check server logs for model selection messages

### Authentication Errors
- Verify API key is correct
- Check that all three model IDs are valid
- Run `test-all-nanonets-models.py` to verify access

### Fields Not Extracting
- Verify the model is trained for the expected fields
- Check that field labels in Nanonets match the mapping in code
- Review the `NANONETS_FIELD_MAPPING` dictionary in `attachment_analyzer.py`

## Notes

- The system falls back to EasyOCR if Nanonets is not configured or fails
- Each model is optimized for its specific document type
- Field extraction accuracy depends on how well each model was trained
- The system automatically combines data from all three documents when available

