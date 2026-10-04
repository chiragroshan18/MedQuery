"""Text Preprocessing and Keyword Extraction Engine for MedQuery.

Handles text normalization, abbreviation expansion, tokenization,
stop-word filtering, and healthcare term extraction.
"""

import re
from typing import Dict, List, Set, Tuple

# Health-oriented abbreviation mappings
ABBREVIATIONS: Dict[str, str] = {
    "bp": "blood pressure",
    "hr": "heart rate",
    "temp": "temperature",
    "rx": "prescription",
    "otc": "over the counter",
    "sob": "shortness of breath",
    "dr": "doctor",
    "meds": "medications",
    "med": "medication",
    "vit": "vitamin",
    "doc": "doctor"
}

# Stop words to filter out while preserving key health-context modifiers
STOP_WORDS: Set[str] = {
    "a", "about", "above", "after", "again", "all", "am", "an", "and", "any", "are",
    "as", "at", "be", "because", "been", "before", "being", "below", "between",
    "both", "by", "could", "did", "do", "does", "doing", "down", "during",
    "each", "for", "from", "further", "had", "has", "have", "having", "he",
    "her", "here", "hers", "herself", "him", "himself", "his", "how", "i",
    "if", "in", "into", "is", "it", "its", "itself", "just", "me", "more",
    "most", "my", "myself", "of", "off", "on", "once", "only", "or", "other",
    "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "she",
    "should", "so", "some", "such", "than", "that", "the", "their", "theirs",
    "them", "themselves", "then", "there", "these", "they", "this", "those",
    "through", "to", "too", "under", "until", "up", "very", "was", "we", "were",
    "what", "when", "where", "which", "while", "who", "whom", "why", "with",
    "would", "you", "your", "yours", "yourself", "yourselves"
}

# Health terminology taxonomy with categories
HEALTH_DICTIONARY: Dict[str, str] = {
    # Emergency / Red Flag symptoms
    "chest pain": "symptom",
    "chest pressure": "symptom",
    "shortness of breath": "symptom",
    "difficulty breathing": "symptom",
    "sudden numbness": "symptom",
    "slurred speech": "symptom",
    "loss of consciousness": "symptom",
    "coughing blood": "symptom",
    "severe bleeding": "symptom",
    "thunderclap headache": "symptom",
    "anaphylaxis": "symptom",
    "suicidal thoughts": "symptom",

    # Common physical symptoms
    "headache": "symptom",
    "migraine": "symptom",
    "fever": "symptom",
    "high fever": "symptom",
    "chills": "symptom",
    "fatigue": "symptom",
    "tiredness": "symptom",
    "exhaustion": "symptom",
    "body pain": "symptom",
    "body ache": "symptom",
    "muscle ache": "symptom",
    "cough": "symptom",
    "dry cough": "symptom",
    "productive cough": "symptom",
    "sore throat": "symptom",
    "stomach ache": "symptom",
    "abdominal pain": "symptom",
    "stomach pain": "symptom",
    "nausea": "symptom",
    "vomiting": "symptom",
    "diarrhea": "symptom",
    "constipation": "symptom",
    "dizziness": "symptom",
    "lightheadedness": "symptom",
    "back pain": "symptom",
    "joint pain": "symptom",
    "knee pain": "symptom",
    "swelling": "symptom",
    "rash": "symptom",
    "itching": "symptom",
    "congestion": "symptom",
    "runny nose": "symptom",
    "sneezing": "symptom",
    "wheezing": "symptom",
    "insomnia": "symptom",
    "palpitations": "symptom",
    "blurred vision": "symptom",
    "heartburn": "symptom",
    "acid reflux": "symptom",
    "cramps": "symptom",

    # Mental / Emotional wellness
    "anxiety": "mental_health",
    "panic attack": "mental_health",
    "stress": "mental_health",
    "depression": "mental_health",
    "burnout": "mental_health",
    "sadness": "mental_health",
    "mood swings": "mental_health",
    "restlessness": "mental_health",

    # Lifestyle & Wellness
    "sleep": "lifestyle",
    "deep sleep": "lifestyle",
    "sleep hygiene": "lifestyle",
    "insomnia": "lifestyle",
    "nutrition": "lifestyle",
    "diet": "lifestyle",
    "calories": "lifestyle",
    "protein": "lifestyle",
    "hydration": "lifestyle",
    "water intake": "lifestyle",
    "vitamins": "lifestyle",
    "vitamin d": "lifestyle",
    "vitamin c": "lifestyle",
    "exercise": "lifestyle",
    "workout": "lifestyle",
    "cardio": "lifestyle",
    "walking": "lifestyle",
    "strength training": "lifestyle",
    "stretching": "lifestyle",
    "meditation": "lifestyle",
    "yoga": "lifestyle",

    # Clinical & Medications
    "medication": "clinical",
    "medicine": "clinical",
    "antibiotic": "clinical",
    "painkiller": "clinical",
    "paracetamol": "clinical",
    "ibuprofen": "clinical",
    "aspirin": "clinical",
    "dosage": "clinical",
    "dose": "clinical",
    "side effects": "clinical",
    "side effect": "clinical",
    "prescription": "clinical",
    "blood pressure": "clinical",
    "blood sugar": "clinical",
    "heart rate": "clinical",
    "cholesterol": "clinical",
    "allergy": "clinical",
    "allergic reaction": "clinical",
    "vaccine": "clinical",
    "vaccination": "clinical",
    "checkup": "clinical",
    "screening": "clinical",
    "doctor": "clinical",
    "physician": "clinical",
    "specialist": "clinical",
    "hospital": "clinical",
    "clinic": "clinical"
}


class TextProcessor:
    """Preprocesses input text, tokenizes, and extracts medical keywords."""

    def __init__(self):
        # Sort multi-word phrases by length descending to match longest matches first
        self.sorted_terms = sorted(HEALTH_DICTIONARY.keys(), key=lambda x: len(x), reverse=True)

    def normalize(self, text: str) -> str:
        """Lowercases text, expands abbreviations, removes extraneous spaces."""
        if not text:
            return ""

        # Lowercase
        normalized = text.lower().strip()

        # Expand abbreviations using word boundaries
        for abbr, expansion in ABBREVIATIONS.items():
            pattern = rf"\b{re.escape(abbr)}\b"
            normalized = re.sub(pattern, expansion, normalized)

        # Normalize whitespace
        normalized = re.sub(r"\s+", " ", normalized)
        return normalized

    def tokenize(self, text: str) -> List[str]:
        """Splits normalized text into word tokens, stripping punctuation."""
        if not text:
            return []
        # Match words including hyphens
        tokens = re.findall(r"\b[a-z0-9]+(?:-[a-z0-9]+)?\b", text.lower())
        return tokens

    def remove_stopwords(self, tokens: List[str]) -> List[str]:
        """Filters non-essential stop words while keeping context tokens."""
        return [t for t in tokens if t not in STOP_WORDS]

    def extract_keywords(self, normalized_text: str) -> Tuple[List[str], Dict[str, str]]:
        """
        Extracts matched health terms and assigns their category.
        Returns:
            extracted_list: list of matched unique terms preserving order of appearance
            term_details: dict mapping term -> category
        """
        if not normalized_text:
            return [], {}

        found_terms = []
        term_details = {}
        matched_spans = []

        # Find multi-word and single-word keywords
        for term in self.sorted_terms:
            pattern = rf"\b{re.escape(term)}\b"
            for match in re.finditer(pattern, normalized_text):
                start, end = match.span()
                # Check for overlap with already matched longer phrases
                overlap = any(s <= start < e or s < end <= e for s, e in matched_spans)
                if not overlap:
                    matched_spans.append((start, end))
                    if term not in found_terms:
                        found_terms.append(term)
                        term_details[term] = HEALTH_DICTIONARY[term]

        return found_terms, term_details

    def process(self, text: str) -> Dict:
        """
        Runs the full text processing pipeline.
        Returns dictionary containing cleaned text, tokens, filtered tokens,
        extracted keywords, and term metadata.
        """
        normalized = self.normalize(text)
        tokens = self.tokenize(normalized)
        filtered_tokens = self.remove_stopwords(tokens)
        extracted_keywords, term_details = self.extract_keywords(normalized)

        return {
            "raw_text": text,
            "normalized_text": normalized,
            "tokens": tokens,
            "filtered_tokens": filtered_tokens,
            "extracted_keywords": extracted_keywords,
            "term_details": term_details
        }
