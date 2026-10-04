"""Urgency Classification Engine for MedQuery.

Classifies healthcare inquiries into 3 conservative triage tiers:
- Urgent (Emergency red flags, severe acute symptoms)
- Needs Attention (Persistent, moderate, or worsening symptoms)
- Routine (General educational, lifestyle, preventive questions)
"""

import re
from typing import Dict, List, Tuple


class UrgencyEngine:
    """Rule-based conservative urgency triage classifier."""

    URGENT_INDICATORS = [
        "chest pain", "chest pressure", "shortness of breath", "difficulty breathing",
        "cannot breathe", "sudden numbness", "slurred speech", "loss of consciousness",
        "passed out", "coughing blood", "severe bleeding", "uncontrolled bleeding",
        "thunderclap headache", "anaphylaxis", "allergic reaction throat", "suicidal",
        "kill myself", "crushing pain", "heart attack", "stroke", "blue lips",
        "stiff neck and high fever"
    ]

    NEEDS_ATTENTION_INDICATORS = [
        "high fever", "persistent fever", "vomiting", "diarrhea", "swelling",
        "migraine", "severe pain", "worsening", "infection", "pus", "rash spreading",
        "blood in stool", "blood in urine", "dizziness", "fainting", "palpitations",
        "blurred vision", "burn", "sprain", "injured", "can't eat", "dehydrated",
        "antibiotic side effect", "several days", "weeks", "not improving"
    ]

    def classify(self, normalized_text: str, intent: str, extracted_keywords: List[str]) -> Tuple[str, str]:
        """
        Classifies the urgency of a message and provides a conservative triage rationale.
        Returns: (urgency_level, triage_rationale)
        """
        if not normalized_text:
            return "Routine", "General educational inquiry."

        # 1. Immediate Red Flag / Urgent Check
        if intent == "emergency_concern":
            return "Urgent", "Red-flag symptom indicators detected. Immediate professional or emergency evaluation is advised."

        for term in self.URGENT_INDICATORS:
            if term in normalized_text or term in extracted_keywords:
                return "Urgent", f"High-risk clinical term detected ('{term}'). Please seek immediate emergency medical care."

        # Regex for severe descriptions
        urgent_patterns = [
            r"\b(severe|intense|unbearable|crushing)\s+(chest\s+)?(pain|pressure|agony)\b",
            r"\b(can'?t|trouble|struggling\s+to)\s+breathe\b",
            r"\b(vomiting|coughing)\s+blood\b"
        ]
        for pattern in urgent_patterns:
            if re.search(pattern, normalized_text):
                return "Urgent", "Acute severe distress pattern detected. Requires prompt emergency medical assessment."

        # 2. Check for Needs Attention (moderate, persistent, worsening symptoms)
        for term in self.NEEDS_ATTENTION_INDICATORS:
            if term in normalized_text or term in extracted_keywords:
                return "Needs Attention", f"Moderate or persistent symptom indicator ('{term}') detected. Clinical evaluation by a doctor is recommended."

        # Duration or severity clues
        needs_attention_patterns = [
            r"\b(for|past|over|lasting)\s+(\d+|several|a\s+few)\s+(days|weeks|months)\b",
            r"\b(getting\s+worse|worsening|not\s+getting\s+better)\b",
            r"\b(high\s+fever|fever\s+above\s+10[1-5])\b"
        ]
        for pattern in needs_attention_patterns:
            if re.search(pattern, normalized_text):
                return "Needs Attention", "Persistent duration or progressive severity detected. Consultation with a healthcare provider is suggested."

        # If symptom_information intent with recognized symptoms, classify as Needs Attention or Routine
        if intent == "symptom_information":
            symptom_keywords = [kw for kw in extracted_keywords if kw in ["fever", "cough", "body pain", "stomach ache", "vomiting", "diarrhea"]]
            if len(symptom_keywords) >= 2:
                return "Needs Attention", "Multiple concurrent symptoms reported. Monitor closely and consult a clinician if symptoms persist."
            return "Needs Attention", "Symptom reported. Monitor progression and seek clinical advice if symptoms worsen or persist."

        # 3. Routine
        return "Routine", "General educational, lifestyle, or preventive query. Standard self-care and routine medical consultation apply."
