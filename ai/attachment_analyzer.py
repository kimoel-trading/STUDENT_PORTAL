from __future__ import annotations

import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Sequence

import cv2
import numpy as np
from PIL import Image

try:  # Optional heavy dependencies
    import easyocr
except ImportError:  # pragma: no cover
    easyocr = None  # type: ignore

try:
    import fitz  # PyMuPDF
except ImportError:  # pragma: no cover
    fitz = None  # type: ignore

try:
    from tensorflow import keras
except ImportError:  # pragma: no cover
    keras = None  # type: ignore

try:
    import requests
    from requests.auth import HTTPBasicAuth
except ImportError:  # pragma: no cover
    requests = None  # type: ignore
    HTTPBasicAuth = None  # type: ignore


SHS_SUBJECT_ALIASES: Dict[str, List[str]] = {
    "pre_calculus": ["PRE-CALCULUS"],
    "general_mathematics": ["GENERAL MATHEMATICS"],
    "earth_science": ["EARTH SCIENCE"],
    "earth_and_life_science": ["EARTH AND LIFE SCIENCE"],
    "oral_communication": ["ORAL COMMUNICATION"],
    "basic_calculus": ["BASIC CALCULUS"],
    "statistics_probability": ["STATISTICS AND PROBABILITY"],
    "general_chemistry_i": ["GENERAL CHEMISTRY I"],
    "general_chemistry_ii": ["GENERAL CHEMISTRY II"],
    "physical_science": ["PHYSICAL SCIENCE"],
    "general_physics_i": ["GENERAL PHYSICS I"],
    "general_biology_i": ["GENERAL BIOLOGY I"],
    "disaster_readiness": ["DISASTER READINESS", "DISASTER READINESS AND RISK REDUCTION"],
    "reading_and_writing": ["READING AND WRITING"],
    "english_academic": ["ENGLISH FOR ACADEMIC PURPOSES"],
}

GRADE11_PRIORITY_CONFIG: List[Dict[str, object]] = [
    {
        "grade_field": "g11MathGrade1",
        "priority_key": "pre_calculus",
        "alt_select_field": "g11MathAlt1",
        "alternatives": [
            {"key": "general_mathematics", "label": "General Mathematics"},
        ],
    },
    {
        "grade_field": "g11ScienceGrade1",
        "priority_key": "earth_science",
        "alt_select_field": "g11ScienceAlt1",
        "alternatives": [
            {"key": "earth_and_life_science", "label": "Earth and Life Science"},
            {"key": "general_chemistry_ii", "label": "General Chemistry II"},
            {"key": "general_physics_i", "label": "General Physics I"},
            {"key": "general_biology_i", "label": "General Biology I"},
            {"key": "disaster_readiness", "label": "Disaster Readiness & Risk Reduction"},
        ],
    },
    {
        "grade_field": "g11EnglishGrade1",
        "priority_key": "oral_communication",
        "alt_select_field": "g11EnglishAlt1",
        "alternatives": [
            {"key": "english_academic", "label": "English for Academic Purposes"},
        ],
    },
    {
        "grade_field": "g11MathGrade2",
        "priority_key": "basic_calculus",
        "alt_select_field": "g11MathAlt2",
        "alternatives": [
            {"key": "statistics_probability", "label": "Statistics and Probability"},
        ],
    },
    {
        "grade_field": "g11ScienceGrade2",
        "priority_key": "general_chemistry_i",
        "alt_select_field": "g11ScienceAlt2",
        "alternatives": [
            {"key": "general_chemistry_ii", "label": "General Chemistry II"},
            {"key": "general_physics_i", "label": "General Physics I"},
            {"key": "general_biology_i", "label": "General Biology I"},
            {"key": "disaster_readiness", "label": "Disaster Readiness & Risk Reduction"},
            {"key": "earth_and_life_science", "label": "Earth and Life Science"},
            {"key": "physical_science", "label": "Physical Science"},
        ],
    },
    {
        "grade_field": "g11EnglishGrade2",
        "priority_key": "reading_and_writing",
        "alt_select_field": None,
        "alternatives": [],
    },
]


@dataclass(slots=True)
class QualityReport:
    is_blurry: bool
    is_cropped: bool
    blur_score: float
    crop_coverage: float

    def to_dict(self) -> Dict[str, float | bool]:
        return {
            "is_blurry": self.is_blurry,
            "is_cropped": self.is_cropped,
            "blur_score": round(self.blur_score, 2),
            "crop_coverage": round(self.crop_coverage, 4),
            "passed": not (self.is_blurry or self.is_cropped),
        }


# Nanonets field label mapping to form fields
NANONETS_FIELD_MAPPING: Dict[str, Dict[str, str]] = {
    # Basic Information
    "SCHOOL_NAME": {"type": "input", "field": "shsName"},
    "SCHOOL_ADDRESS": {"type": "input", "field": "schoolAddress"},  # Optional field
    "FULL_NAME": {"type": "input", "field": "fullName"},  # Optional field
    "JHS_COMPLETION_YEAR": {"type": "input", "field": "jhsCompletionYear"},
    "SHS_COMPLETION_YEAR": {"type": "input", "field": "shsCompletionYear"},
    "TRACK_STRAND": {"type": "track_strand", "field": "track_strand"},
    
    # Junior High School Grades
    "10_MATH": {"type": "input", "field": "jhsMath"},
    "10_SCI": {"type": "input", "field": "jhsScience"},
    "10_ENG": {"type": "input", "field": "jhsEnglish"},
    
    # Grade 11 Priority Subjects (Semester 1)
    "S_PRECAL": {"type": "grade11", "grade_field": "g11MathGrade1", "priority": True, "subject_key": "pre_calculus"},
    "S_EARTHSCI": {"type": "grade11", "grade_field": "g11ScienceGrade1", "priority": True, "subject_key": "earth_science"},
    "S_ORALCOM": {"type": "grade11", "grade_field": "g11EnglishGrade1", "priority": True, "subject_key": "oral_communication"},
    
    # Grade 11 Priority Subjects (Semester 2)
    "S_BASICCAL": {"type": "grade11", "grade_field": "g11MathGrade2", "priority": True, "subject_key": "basic_calculus"},
    "S_GENCHEMI": {"type": "grade11", "grade_field": "g11ScienceGrade2", "priority": True, "subject_key": "general_chemistry_i"},
    "S_READWRI": {"type": "grade11", "grade_field": "g11EnglishGrade2", "priority": True, "subject_key": "reading_and_writing"},
    
    # Alternative Subjects
    "ALT_GENMATH": {"type": "grade11_alt", "alt_for": "S_PRECAL", "alt_select": "g11MathAlt1", "label": "General Mathematics"},
    "ALT_STATPROB": {"type": "grade11_alt", "alt_for": "S_BASICCAL", "alt_select": "g11MathAlt2", "label": "Statistics and Probability"},
    "ALT_ENGAP": {"type": "grade11_alt", "alt_for": "S_ORALCOM", "alt_select": "g11EnglishAlt1", "label": "English for Academic Purposes"},
    "ALT_ENGAP_NS": {"type": "grade11_alt", "alt_for": "S_ORALCOM", "alt_select": "g11EnglishAlt1", "label": "English for Academic Purposes"},
    "ALT_GENCHEM_II": {"type": "grade11_alt", "alt_for": "S_GENCHEMI", "alt_select": "g11ScienceAlt2", "label": "General Chemistry II"},
    "ALT_GENPHYS_I": {"type": "grade11_alt", "alt_for": "S_EARTHSCI", "alt_select": "g11ScienceAlt1", "label": "General Physics I"},
    "ALT_GENBIO_I": {"type": "grade11_alt", "alt_for": "S_EARTHSCI", "alt_select": "g11ScienceAlt1", "label": "General Biology I"},
    "ALT_DRRR_NS": {"type": "grade11_alt", "alt_for": "S_EARTHSCI", "alt_select": "g11ScienceAlt1", "label": "Disaster Readiness & Risk Reduction"},
    "ALT_BUSSMATH_NS": {"type": "grade11_alt", "alt_for": "S_PRECAL", "alt_select": "g11MathAlt1", "label": "Business Mathematics"},
    
    # NS (Non-Standard) variants - treated as alternatives
    "NS_PHYSCI": {"type": "grade11_alt", "alt_for": "S_EARTHSCI", "alt_select": "g11ScienceAlt1", "label": "Physical Science"},
    "NS_READWRI": {"type": "grade11_alt", "alt_for": "S_READWRI", "alt_select": None, "label": ""},
    "NS_STATPROB": {"type": "grade11_alt", "alt_for": "S_BASICCAL", "alt_select": "g11MathAlt2", "label": "Statistics and Probability"},
    "NS_EARTHSCI": {"type": "grade11_alt", "alt_for": "S_EARTHSCI", "alt_select": "g11ScienceAlt1", "label": "Earth Science"},
    "NS_GENMATH": {"type": "grade11_alt", "alt_for": "S_PRECAL", "alt_select": "g11MathAlt1", "label": "General Mathematics"},
    "NS_ORALCOM": {"type": "grade11_alt", "alt_for": "S_ORALCOM", "alt_select": "g11EnglishAlt1", "label": "Oral Communication"},
}


class AttachmentAnalyzer:
    _instance: Optional["AttachmentAnalyzer"] = None

    def __init__(self) -> None:
        self._reader = None
        self._quality_model = None
        self._quality_model_input = None
        self._blur_threshold = 110.0
        self._crop_threshold = 0.975
        self._max_pdf_pages = int(os.getenv("EDUC_AI_MAX_PDF_PAGES", "8"))
        self._max_long_edge_px = int(os.getenv("EDUC_AI_MAX_LONG_EDGE", "2200"))
        
        # Nanonets configuration
        self._nanonets_api_key = os.getenv("NANONETS_API_KEY")
        # Support multiple models for different document types
        self._nanonets_models = {
            "grades_form_1": os.getenv("NANONETS_MODEL_ID_GRADES_FORM_1") or os.getenv("NANONETS_MODEL_ID"),  # Fallback to old var
            "jhs_137": os.getenv("NANONETS_MODEL_ID_JHS_137"),
            "shs_137": os.getenv("NANONETS_MODEL_ID_SHS_137"),
        }
        self._use_nanonets = bool(self._nanonets_api_key and any(self._nanonets_models.values()))

        if easyocr:
            use_gpu = False
            try:
                import torch

                use_gpu = bool(getattr(torch.cuda, "is_available", lambda: False)())
            except Exception:  # pragma: no cover
                use_gpu = False
            self._reader = easyocr.Reader(["en"], gpu=use_gpu)

        if keras:
            model_path = Path(__file__).with_name("models").joinpath("grades_quality.keras")
            if model_path.exists():
                try:
                    self._quality_model = keras.models.load_model(model_path)
                    input_shape = self._quality_model.inputs[0].shape
                    self._quality_model_input = (int(input_shape[1]), int(input_shape[2]))
                except Exception:
                    self._quality_model = None
                    self._quality_model_input = None

    @classmethod
    def get(cls) -> "AttachmentAnalyzer":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def analyze(self, file_path: Path, document_type: Optional[str] = None) -> Dict[str, object]:
        images = self._load_images(file_path)
        if not images:
            raise ValueError("Unable to decode file.")

        quality_reports = [self._evaluate_quality(image) for image in images]
        aggregated = self._aggregate_quality(quality_reports)

        # Try Nanonets first if configured, fallback to OCR
        nanonets_result = None
        if self._use_nanonets and requests:
            try:
                nanonets_result = self._call_nanonets_api(file_path, document_type=document_type)
            except Exception as exc:
                # Log but don't fail - fallback to OCR
                print(f"Nanonets API call failed: {exc}")

        if nanonets_result:
            print(f"[Nanonets] API call successful for document type: {document_type}")
            print(f"[Nanonets] Response keys: {list(nanonets_result.keys())}")
            fields = self._convert_nanonets_to_fields(nanonets_result, document_type)
            print(f"[Nanonets] Extracted fields: inputs={len(fields.get('inputs', {}))}, selects={len(fields.get('selects', {}))}, grade11={len(fields.get('grade11', []))}")
            raw_text = nanonets_result.get("message", "")  # Nanonets may provide extracted text
        else:
            print(f"[Fallback] Using OCR instead of Nanonets for document type: {document_type}")
            raw_text = self._extract_text(images)
            fields = self._extract_fields(raw_text, document_type=document_type)

        return {
            "quality": aggregated,
            "fields": fields,
            "raw_text": raw_text,
        }

    # ------------------------------------------------------------------ quality
    def _evaluate_quality(self, image: Image.Image) -> QualityReport:
        arr = np.array(image)
        gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
        blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        edges = cv2.Canny(gray, 60, 180)
        coords = cv2.findNonZero(edges)
        if coords is None:
            crop_coverage = 0.0
        else:
            x, y, w, h = cv2.boundingRect(coords)
            crop_coverage = (w * h) / (arr.shape[0] * arr.shape[1])

        is_blurry = blur_score < self._blur_threshold
        is_cropped = crop_coverage > self._crop_threshold

        if self._quality_model and self._quality_model_input is not None:
            height, width = self._quality_model_input
            resized = cv2.resize(arr, (width, height)).astype("float32") / 255.0
            batch = np.expand_dims(resized, axis=0)
            try:
                prediction = self._quality_model.predict(batch, verbose=0)
                if isinstance(prediction, (list, tuple)) and prediction:
                    score = float(prediction[0].squeeze())
                    is_blurry = bool(score > 0.5)
            except Exception:
                pass

        return QualityReport(is_blurry=is_blurry, is_cropped=is_cropped, blur_score=blur_score, crop_coverage=crop_coverage)

    def _aggregate_quality(self, reports: List[QualityReport]) -> Dict[str, float | bool]:
        avg_blur = sum(r.blur_score for r in reports) / len(reports)
        avg_crop = sum(r.crop_coverage for r in reports) / len(reports)
        any_blurry = any(r.is_blurry for r in reports)
        any_cropped = any(r.is_cropped for r in reports)
        return QualityReport(any_blurry, any_cropped, avg_blur, avg_crop).to_dict()

    # --------------------------------------------------------------------- OCR
    def _extract_text(self, images: List[Image.Image]) -> str:
        if not self._reader:
            return ""
        chunks: List[str] = []
        threshold = self._ocr_confidence_threshold()
        for image in images:
            try:
                results = self._reader.readtext(np.array(image), detail=1, paragraph=False)
            except Exception:
                results = []
            filtered: List[str] = []
            for bbox, text, confidence in results:
                try:
                    conf = float(confidence)
                except (TypeError, ValueError):
                    conf = 0.0
                if conf >= threshold:
                    filtered.append(text)
            chunks.append("\n".join(filtered))
        return "\n".join(chunks)

    def _ocr_confidence_threshold(self) -> float:
        return float(os.getenv("EDUC_AI_OCR_CONFIDENCE", "0.5"))

    # ------------------------------------------------------------- field parse
    def _extract_fields(self, raw_text: str, document_type: Optional[str]) -> Dict[str, object]:
        if not raw_text:
            return {"inputs": {}, "selects": {}, "checkboxes": {}, "grade11": []}

        text = self._sanitize_text(raw_text)
        inputs: Dict[str, object] = {}
        selects: Dict[str, object] = {}
        checkboxes: Dict[str, bool] = {}
        grade11_entries: List[Dict[str, object]] = []

        self._capture_into(
            inputs,
            text,
            "shsName",
            [
                r"School\s+Name\s*[:\-]\s*([A-Za-z0-9 ,.'\n-]{3,160})",
                r"Senior\s+High\s+School\s*[:\-]\s*([A-Za-z0-9 ,.'\n-]{3,160})",
            ],
        )
        if inputs.get("shsName"):
            inputs["shsName"] = self._normalize_school_name(str(inputs["shsName"]))
        self._capture_into(
            inputs,
            text,
            "shsEmail",
            [
                r"(?:SHS\s+Contact.*?Email|Email)\s*[:\-]\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})",
            ],
            flags=re.IGNORECASE,
        )
        self._capture_into(
            inputs,
            text,
            "jhsCompletionYear",
            [r"JHS\s+Completion\s+Year[:\- ]+(\d{4})", r"Junior\s+HS\s+Completion.*?(\d{4})"],
        )
        self._capture_into(
            inputs,
            text,
            "shsCompletionYear",
            [r"SHS\s+Completion\s+Year[:\- ]+(\d{4})", r"Senior\s+HS\s+Completion.*?(\d{4})"],
        )

        track_line = self._extract_label_line(text, r"TRACK\s*&\s*STRAND\s*[:\-]\s*([^\n]+)")
        if track_line:
            parsed_track, parsed_strand = self._parse_track_strand_line(track_line)
            if parsed_track:
                selects["track"] = parsed_track
            if parsed_strand:
                selects["strand"] = parsed_strand
        else:
            track_map = {
                "academic": r"ACADEMIC",
                "arts": r"ARTS\s+AND\s+DESIGN",
                "sports": r"SPORTS",
                "tvl": r"(?:TVL|TECHNICAL[\s-]?VOCATIONAL)",
            }
            for value, pattern in track_map.items():
                if re.search(pattern, text, re.IGNORECASE):
                    selects["track"] = value
                    break

            strand_map = {
                "stem": r"STEM|SCIENCE,\s*TECHNOLOGY",
                "abm": r"ABM|ACCOUNTANCY",
                "humss": r"HUMSS|HUMANITIES",
                "gas": r"GAS|GENERAL\s+ACADEMIC",
                "maritime": r"MARITIME",
            }
            for value, pattern in strand_map.items():
                if re.search(pattern, text, re.IGNORECASE):
                    selects["strand"] = value
                    break

        grade_patterns = {
            "jhsMath": [
                r"Mathematics[:\s]+(\d{2,3})",
                r"Math\s*Grade\s*[:\-]\s*(\d{2,3})",
            ],
            "jhsScience": [
                r"Science[:\s]+(\d{2,3})",
                r"Science\s*Grade\s*[:\-]\s*(\d{2,3})",
            ],
            "jhsEnglish": [
                r"English[:\s]+(\d{2,3})",
                r"English\s*Grade\s*[:\-]\s*(\d{2,3})",
            ],
        }
        for field, patterns in grade_patterns.items():
            self._capture_into(inputs, text, field, patterns, value_filter=self._is_valid_grade)

        if document_type and "senior" in document_type.lower():
            subject_grades = self._extract_shs_subject_grades(text)
            grade11_entries = self._map_grade11_priorities(subject_grades)

        return {
            "inputs": inputs,
            "selects": selects,
            "checkboxes": checkboxes,
            "grade11": grade11_entries,
        }

    def _capture_into(
        self,
        store: Dict[str, object],
        text: str,
        key: str,
        patterns: Sequence[str],
        *,
        value_filter=None,
        flags: int = re.IGNORECASE,
    ) -> None:
        for pattern in patterns:
            match = re.search(pattern, text, flags)
            if match:
                value = match.group(1).strip()
                value = value.replace("\n", " ").strip(" :;\t\r")
                if value_filter and not value_filter(value):
                    continue
                store[key] = value
                return

    def _sanitize_text(self, text: str) -> str:
        cleaned = re.sub(r"LRN[:\s]*\d+", "", text, flags=re.IGNORECASE)
        cleaned = re.sub(r"\b(M|F)ALE\b", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s{2,}", " ", cleaned)
        return cleaned

    def _extract_shs_subject_grades(self, text: str) -> Dict[str, str]:
        results: Dict[str, str] = {}
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        for key, aliases in SHS_SUBJECT_ALIASES.items():
            for line in lines:
                upper_line = line.upper()
                if any(alias in upper_line for alias in aliases):
                    digits = re.findall(r"\d{2,3}", line)
                    if digits:
                        results[key] = digits[-1]
                        break
            if key in results:
                continue
        return results

    def _map_grade11_priorities(self, subject_grades: Dict[str, str]) -> List[Dict[str, object]]:
        entries: List[Dict[str, object]] = []
        for config in GRADE11_PRIORITY_CONFIG:
            entry = self._resolve_grade11_entry(config, subject_grades)
            if entry:
                entries.append(entry)
        return entries

    def _resolve_grade11_entry(
        self,
        config: Dict[str, object],
        subject_grades: Dict[str, str],
    ) -> Optional[Dict[str, object]]:
        priority_key: str = config["priority_key"]  # type: ignore[assignment]
        grade_field: str = config["grade_field"]  # type: ignore[assignment]
        alt_select_field: Optional[str] = config.get("alt_select_field")  # type: ignore[arg-type]
        alternatives: Sequence[Dict[str, str]] = config.get("alternatives", [])  # type: ignore[assignment]

        if priority_key in subject_grades:
            return {
                "gradeField": grade_field,
                "grade": subject_grades[priority_key],
                "useAlternative": False,
                "altSelectField": alt_select_field,
                "altValue": "",
            }

        for alt in alternatives:
            alt_key = alt["key"]
            if alt_key in subject_grades:
                label = alt["label"]
                return {
                    "gradeField": grade_field,
                    "grade": subject_grades[alt_key],
                    "useAlternative": True,
                    "altSelectField": alt_select_field,
                    "altValue": label,
                }

        return None

    def _get_model_id_for_document(self, document_type: Optional[str]) -> Optional[str]:
        """Get the appropriate Nanonets model ID based on document type."""
        if not document_type:
            return self._nanonets_models.get("grades_form_1")  # Default
        
        doc_lower = document_type.lower()
        
        # Map document labels to model IDs
        if "grades form 1" in doc_lower or "regular admission" in doc_lower:
            return self._nanonets_models.get("grades_form_1")
        elif "junior" in doc_lower and "137" in doc_lower:
            return self._nanonets_models.get("jhs_137")
        elif "senior" in doc_lower and "137" in doc_lower:
            return self._nanonets_models.get("shs_137")
        
        # Default to Grades Form 1 if no match
        return self._nanonets_models.get("grades_form_1")

    def _call_nanonets_api(self, file_path: Path, document_type: Optional[str] = None) -> Optional[Dict[str, object]]:
        """Call Nanonets API to extract fields from document."""
        if not requests or not self._nanonets_api_key:
            return None

        model_id = self._get_model_id_for_document(document_type)
        if not model_id:
            return None

        url = f"https://app.nanonets.com/api/v2/OCR/Model/{model_id}/LabelFile/"
        
        try:
            with open(file_path, "rb") as f:
                files = {"file": (file_path.name, f, "application/octet-stream")}
                # Nanonets uses HTTPBasicAuth with API key as username, empty password
                if HTTPBasicAuth:
                    auth = HTTPBasicAuth(self._nanonets_api_key, "")
                else:
                    auth = (self._nanonets_api_key, "")
                response = requests.post(url, files=files, auth=auth, timeout=120)

            if response.status_code != 200:
                error_msg = response.text[:500] if hasattr(response, 'text') else str(response.status_code)
                raise ValueError(f"Nanonets API error: {response.status_code} - {error_msg}")

            result = response.json()
            print(f"[Nanonets] Raw API response received")
            print(f"[Nanonets] Response keys: {list(result.keys())}")
            # Log a sample of the response structure (first 500 chars to avoid huge output)
            import json
            response_str = json.dumps(result, indent=2)[:1000]
            print(f"[Nanonets] Response sample: {response_str}...")
            return result
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Failed to connect to Nanonets API: {e}") from e

    def _convert_nanonets_to_fields(
        self, nanonets_result: Dict[str, object], document_type: Optional[str]
    ) -> Dict[str, object]:
        """Convert Nanonets API response to our field format."""
        inputs: Dict[str, object] = {}
        selects: Dict[str, object] = {}
        checkboxes: Dict[str, bool] = {}
        grade11_entries: List[Dict[str, object]] = []

        # Extract results from Nanonets response
        # Nanonets response structure: {"result": [{"prediction": [{"label": "...", "ocr_text": "..."}]}]}
        predictions = []
        if "result" in nanonets_result:
            result_data = nanonets_result["result"]
            if isinstance(result_data, list):
                for page_result in result_data:
                    if isinstance(page_result, dict) and "prediction" in page_result:
                        pred_list = page_result["prediction"]
                        if isinstance(pred_list, list):
                            predictions.extend(pred_list)
                        elif isinstance(pred_list, dict):
                            predictions.append(pred_list)

        # Process each prediction - predictions ARE the fields
        # Store full prediction data for cross-validation
        nanonets_fields: Dict[str, str] = {}
        nanonets_predictions: Dict[str, Dict] = {}  # Store full prediction data
        print(f"[Nanonets] Processing {len(predictions)} predictions")
        for pred in predictions:
            if isinstance(pred, dict):
                # Nanonets structure: each prediction has "label" and "ocr_text"
                field_name = pred.get("label", "") or pred.get("field_name", "") or pred.get("name", "")
                field_value = pred.get("ocr_text", "") or pred.get("text", "") or pred.get("value", "")
                
                # Handle numeric values
                if isinstance(field_value, (int, float)):
                    field_value = str(field_value)
                field_value = str(field_value).strip()
                
                if field_name and field_value:
                    # Use score/confidence if available, otherwise keep first occurrence
                    score = float(pred.get("score", 0) or pred.get("confidence", 0))
                    # Log bounding box for debugging grade mismatches
                    bbox = f"({pred.get('xmin', '?')}, {pred.get('ymin', '?')})"
                    
                    if field_name not in nanonets_fields:
                        nanonets_fields[field_name] = field_value
                        nanonets_predictions[field_name] = pred  # Store full prediction
                        print(f"[Nanonets] Found field: {field_name} = '{field_value}' (score: {score}, bbox: {bbox})")
                    else:
                        # Keep higher score/confidence value
                        existing_score = float(nanonets_predictions[field_name].get("score", 0) or nanonets_predictions[field_name].get("confidence", 0))
                        if score > existing_score:
                            old_value = nanonets_fields[field_name]
                            nanonets_fields[field_name] = field_value
                            nanonets_predictions[field_name] = pred
                            print(f"[Nanonets] Updated field: {field_name} = '{field_value}' (was '{old_value}', higher score: {score}, bbox: {bbox})")
                        else:
                            print(f"[Nanonets] Keeping existing value for {field_name} = '{nanonets_fields[field_name]}' (new value '{field_value}' has lower score)")

        # Map Nanonets fields to form fields
        # Process priority subjects FIRST, then alternatives
        grade11_data: Dict[str, Dict[str, str]] = {}  # grade_field -> {grade, alt_select, alt_value}
        
        # First pass: Process priority subjects (type="grade11")
        print(f"[Nanonets] Extracted {len(nanonets_fields)} fields: {list(nanonets_fields.keys())}")
        print(f"[Nanonets] First pass: Processing priority subjects...")
        for nanonets_label, value in nanonets_fields.items():
            mapping = NANONETS_FIELD_MAPPING.get(nanonets_label)
            if not mapping or mapping.get("type") != "grade11":
                continue
                
            field_type = mapping.get("type")
            grade_field = mapping.get("grade_field")
            if not grade_field:
                continue
                
            print(f"[Nanonets] Processing priority subject: {nanonets_label} -> {grade_field}")
            grade_value = self._extract_grade_value(value)
            if grade_value:
                grade11_data[grade_field] = {
                    "grade": grade_value,
                    "useAlternative": False,
                    "altSelectField": None,
                    "altValue": "",
                }
                print(f"[Nanonets] ✓ Set priority {grade_field} = {grade_value} from {nanonets_label}")
        
        # Second pass: Process alternatives (type="grade11_alt") only if priority not found
        print(f"[Nanonets] Second pass: Processing alternatives...")
        for nanonets_label, value in nanonets_fields.items():
            mapping = NANONETS_FIELD_MAPPING.get(nanonets_label)
            if not mapping:
                print(f"[Nanonets] No mapping found for label: {nanonets_label}")
                continue
            field_type = mapping.get("type")
            if not field_type:
                print(f"[Nanonets] No type found in mapping for {nanonets_label}")
                continue
                
            print(f"[Nanonets] Mapping {nanonets_label} -> type={field_type}, field={mapping.get('field', mapping.get('grade_field', 'N/A'))}")

            if field_type == "input":
                field_name = mapping.get("field")
                if not field_name:
                    print(f"[Nanonets] No 'field' key in mapping for {nanonets_label}")
                    continue
                # Direct input field
                if field_name == "shsName":
                    inputs[field_name] = self._normalize_school_name(value)
                else:
                    inputs[field_name] = value

            elif field_type == "track_strand":
                # Parse TRACK_STRAND (e.g., "ACADEMIC - STEM")
                parsed_track, parsed_strand = self._parse_track_strand_line(value)
                if parsed_track:
                    selects["track"] = parsed_track
                if parsed_strand:
                    selects["strand"] = parsed_strand

            elif field_type == "grade11_alt":
                # Alternative subject - check if priority was found
                alt_for = mapping.get("alt_for")
                if alt_for:
                    alt_mapping = NANONETS_FIELD_MAPPING.get(alt_for)
                    if alt_mapping:
                        grade_field = alt_mapping.get("grade_field")
                        if not grade_field:
                            print(f"[Nanonets] No 'grade_field' in alt_mapping for {alt_for}")
                            continue
                        # Only use alternative if priority wasn't found
                        if grade_field not in grade11_data:
                            print(f"[Nanonets] Extracting grade from alternative '{nanonets_label}' (raw value: '{value}')")
                            grade_value = self._extract_grade_value(value)
                            if grade_value:
                                # Check if a priority subject with higher score exists in nanonets_fields
                                priority_label = alt_for
                                priority_value = nanonets_fields.get(priority_label)
                                priority_score = 0.0
                                
                                # Find priority subject score from predictions
                                for pred in predictions:
                                    if isinstance(pred, dict) and pred.get("label") == priority_label:
                                        priority_score = float(pred.get("score", 0) or pred.get("confidence", 0))
                                        break
                                
                                current_score = float(pred.get("score", 0) or pred.get("confidence", 0)) if isinstance(pred, dict) else 0.0
                                
                                # If priority exists but wasn't processed yet (maybe lower score), wait for it
                                # Otherwise, use alternative
                                if priority_value and priority_score > current_score:
                                    print(f"[Nanonets] Priority {priority_label} exists with higher score ({priority_score} > {current_score}), deferring alternative")
                                    # Don't set alternative yet - let priority be processed first
                                else:
                                    print(f"[Nanonets] Extracted grade {grade_value} for alternative {nanonets_label} -> {grade_field}")
                                    grade11_data[grade_field] = {
                                        "grade": grade_value,
                                        "useAlternative": True,
                                        "altSelectField": mapping.get("alt_select"),
                                        "altValue": mapping.get("label", ""),
                                    }
                            else:
                                print(f"[Nanonets] ⚠️ Could not extract valid grade from '{value}' for alternative {nanonets_label}")
                        else:
                            print(f"[Nanonets] Priority subject already found for {grade_field}, skipping alternative {nanonets_label}")

        # Convert grade11_data to grade11_entries format
        for grade_field, data in grade11_data.items():
            entry = {
                "gradeField": grade_field,
                "grade": data["grade"],
                "useAlternative": data["useAlternative"],
                "altSelectField": data.get("altSelectField"),
                "altValue": data.get("altValue", ""),
            }
            grade11_entries.append(entry)

        result = {
            "inputs": inputs,
            "selects": selects,
            "checkboxes": checkboxes,
            "grade11": grade11_entries,
        }
        print(f"[Nanonets] Final result: inputs={len(inputs)}, selects={len(selects)}, checkboxes={len(checkboxes)}, grade11={len(grade11_entries)}")
        if len(inputs) == 0 and len(selects) == 0 and len(grade11_entries) == 0:
            print(f"[Nanonets] ⚠️ WARNING: No fields extracted! Nanonets fields found: {list(nanonets_fields.keys())}")
            print(f"[Nanonets] Available mappings: {list(NANONETS_FIELD_MAPPING.keys())[:10]}...")  # Show first 10
        return result

    def _extract_grade_value(self, text: str) -> Optional[str]:
        """Extract numeric grade from text (e.g., "85", "85%", "Grade: 85")."""
        if not text:
            return None
            
        # Remove common prefixes/suffixes
        cleaned = re.sub(r"(?:Grade|Score|Mark)[:\s]*", "", text, flags=re.IGNORECASE)
        cleaned = re.sub(r"%", "", cleaned).strip()
        
        # Extract 2-3 digit number - try to get the LAST number (grades are usually at the end)
        # This helps when text contains subject name + grade
        matches = list(re.finditer(r"\b(\d{2,3})\b", cleaned))
        if matches:
            # Take the last match (most likely the grade)
            match = matches[-1]
            grade = match.group(1)
            if self._is_valid_grade(grade):
                return grade
            # If last match isn't valid, try others
            for match in reversed(matches):
                grade = match.group(1)
                if self._is_valid_grade(grade):
                    return grade
        return None

    def _load_images(self, file_path: Path) -> List[Image.Image]:
        suffix = file_path.suffix.lower()
        if suffix == ".pdf":
            if not fitz:
                raise RuntimeError("PyMuPDF is required to parse PDF files.")
            return self._pdf_to_images(file_path)
        return [self._downscale_image(Image.open(file_path).convert("RGB"))]

    def _pdf_to_images(self, pdf_path: Path) -> List[Image.Image]:
        doc = fitz.open(pdf_path)  # type: ignore[arg-type]
        images: List[Image.Image] = []
        for index, page in enumerate(doc):
            if index >= self._max_pdf_pages:
                break
            pix = page.get_pixmap(alpha=False)
            img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
            images.append(self._downscale_image(img))
        return images

    def _downscale_image(self, image: Image.Image) -> Image.Image:
        max_edge = max(image.size)
        if max_edge <= self._max_long_edge_px:
            return image
        scale = self._max_long_edge_px / float(max_edge)
        new_size = (int(image.width * scale), int(image.height * scale))
        return image.resize(new_size, Image.Resampling.LANCZOS)

    @staticmethod
    def _is_valid_grade(value: str) -> bool:
        if not re.fullmatch(r"\d{2,3}", value):
            return False
        number = int(value)
        return 60 <= number <= 100

    def _extract_label_line(self, text: str, pattern: str) -> Optional[str]:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            value = match.group(1).strip()
            value = value.split("\n")[0].strip(" :;\t\r")
            return value
        return None

    def _parse_track_strand_line(self, line: str) -> tuple[Optional[str], Optional[str]]:
        normalized = line.upper()
        # Handle formats like "ACADEMIC / SCIENCE , TECHNOLOGY , ENGINEERING , MATHEMATICS"
        # Split by "/" or "-" to separate track and strand
        parts = re.split(r"[/\-]", normalized)
        normalized = " ".join(parts)  # Rejoin for full text search
        
        track_value = None
        strand_value = None

        # Track detection
        if "ACADEMIC" in normalized:
            track_value = "academic"
        elif "ARTS" in normalized:
            track_value = "arts"
        elif "SPORT" in normalized:
            track_value = "sports"
        elif "TVL" in normalized or "TECHNICAL" in normalized:
            track_value = "tvl"

        # Strand detection - check for STEM pattern (SCIENCE, TECHNOLOGY, ENGINEERING, MATHEMATICS)
        if "STEM" in normalized:
            strand_value = "stem"
        elif ("SCIENCE" in normalized and "TECHNOLOGY" in normalized and 
              "ENGINEERING" in normalized and "MATHEMATICS" in normalized):
            strand_value = "stem"
        elif "HUMSS" in normalized or ("HUMANITIES" in normalized and "SOCIAL" in normalized):
            strand_value = "humss"
        elif "ABM" in normalized or ("ACCOUNTANCY" in normalized and "BUSINESS" in normalized):
            strand_value = "abm"
        elif "GAS" in normalized or ("GENERAL" in normalized and "ACADEMIC" in normalized):
            strand_value = "gas"
        elif "MARITIME" in normalized:
            strand_value = "maritime"

        return track_value, strand_value

    def _normalize_school_name(self, value: str) -> str:
        cleaned = re.sub(r"[^A-Za-z0-9 .,'-]", " ", value)
        cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()
        replacements = {
            "LEGNNA": "LAGUNA",
            "SENIOR HIGH SCH00L": "SENIOR HIGH SCHOOL",
        }
        upper_cleaned = cleaned.upper()
        for bad, good in replacements.items():
            if bad in upper_cleaned:
                upper_cleaned = upper_cleaned.replace(bad, good)
        return upper_cleaned.title()


def analyze_file(file_path: Path, document_type: Optional[str] = None) -> Dict[str, object]:
    analyzer = AttachmentAnalyzer.get()
    return analyzer.analyze(file_path, document_type=document_type)



