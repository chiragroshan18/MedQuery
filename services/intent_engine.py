"""Intent Classification Engine for MedQuery.

Classifies user healthcare inquiries into 10 structured intents:
- emergency_concern
- symptom_information
- medication_information
- nutrition
- sleep
- exercise
- mental_wellness
- preventive_care
- general_health
- unknown
"""

import re
from typing import Dict, List, Tuple


class IntentEngine:
    """Rule-based Intent Classifier with Confidence Scoring."""

    INTENT_RULES = {
        "emergency_concern": {
            "keywords": [
                "chest pain", "chest pressure", "difficulty breathing", "shortness of breath",
                "cannot breathe", "sudden numbness", "slurred speech", "loss of consciousness",
                "coughing blood", "severe bleeding", "thunderclap headache", "anaphylaxis",
                "suicidal thoughts", "heart attack", "stroke symptoms", "crushing pain",
                "passed out", "seizure"
            ],
            "patterns": [
                r"\b(can'?t|cannot) breathe\b",
                r"\b(chest|heart)\s+(hurts|hurting|crushing|squeezing)\b",
                r"\b(sudden|severe)\s+(numbness|paralysis|blindness|confusion)\b",
                r"\b(vomiting|coughing)\s+(up\s+)?blood\b",
                r"\bkill myself\b|\bsuicid(e|al)\b"
            ],
            "base_weight": 3.0
        },
        "medication_information": {
            "keywords": [
                "medication", "medicine", "pill", "tablet", "capsule", "antibiotic",
                "painkiller", "paracetamol", "ibuprofen", "aspirin", "dosage", "dose",
                "side effects", "side effect", "prescription", "contraindication",
                "drug interaction", "over the counter", "otc", "refill", "interactions"
            ],
            "patterns": [
                r"\b(how much|what dose|what dosage|how often to take)\b",
                r"\b(side effects of|can i take|interactions between)\b",
                r"\b(missed|forgot)\s+(a|my)?\s*(dose|pill|medicine)\b",
                r"\b(take with food|empty stomach)\b"
            ],
            "base_weight": 2.2
        },
        "sleep": {
            "keywords": [
                "sleep", "insomnia", "deep sleep", "rem sleep", "bedtime", "nap",
                "snoring", "sleep apnea", "nightmare", "restless", "waking up",
                "sleep hygiene", "circadian rhythm", "melatonin", "drowsy"
            ],
            "patterns": [
                r"\b(can'?t|trouble|hard to)\s+(fall\s+)?sleep\b",
                r"\b(improve|better|quality of)\s+sleep\b",
                r"\bwak(e|ing)\s+up\s+(tired|frequently|in the night)\b",
                r"\bhours of sleep\b"
            ],
            "base_weight": 2.2
        },
        "nutrition": {
            "keywords": [
                "nutrition", "diet", "food", "calories", "protein", "carbohydrates",
                "carbs", "fats", "hydration", "water intake", "vitamins", "vitamin d",
                "vitamin c", "minerals", "fiber", "cholesterol", "sugar", "sodium",
                "meal plan", "balanced diet", "vegetables", "fruits", "supplements"
            ],
            "patterns": [
                r"\b(healthy|balanced)\s+(diet|meal|eating|food)\b",
                r"\b(how much|how many)\s+(water|protein|calories)\b",
                r"\b(foods for|eat to|foods to avoid)\b",
                r"\b(nutrient|nutritional|deficiency)\b"
            ],
            "base_weight": 2.0
        },
        "exercise": {
            "keywords": [
                "exercise", "workout", "cardio", "strength training", "gym",
                "walking", "running", "jogging", "stretching", "yoga", "pilates",
                "aerobic", "fitness", "steps", "muscle building", "posture",
                "flexibility", "stamina"
            ],
            "patterns": [
                r"\b(exercise|workout)\s+(routine|plan|benefits|tips)\b",
                r"\b(how often|how long)\s+to\s+(exercise|walk|workout)\b",
                r"\b(physical activity|weight training)\b"
            ],
            "base_weight": 2.0
        },
        "mental_wellness": {
            "keywords": [
                "anxiety", "panic attack", "panic", "stress", "depression", "sadness",
                "burnout", "mental health", "meditation", "mindfulness", "overwhelmed",
                "calm", "relax", "relaxation", "breathing exercise", "mood swings",
                "loneliness", "nervous"
            ],
            "patterns": [
                r"\bfeeling\s+(anxious|stressed|depressed|sad|overwhelmed|nervous)\b",
                r"\b(manage|cope with|reduce)\s+(stress|anxiety)\b",
                r"\bmental\s+(health|wellness|wellbeing)\b"
            ],
            "base_weight": 2.0
        },
        "preventive_care": {
            "keywords": [
                "preventive", "prevention", "checkup", "annual exam", "screening",
                "vaccine", "vaccination", "immunization", "blood test", "mammogram",
                "colonoscopy", "sunscreen", "dental care", "hygiene", "wash hands",
                "routine check", "wellness visit"
            ],
            "patterns": [
                r"\b(prevent|avoid)\s+(getting sick|illness|disease|infection)\b",
                r"\b(when to get|schedule)\s+(a checkup|a vaccine|blood test)\b",
                r"\bpreventive\s+(care|health|measures)\b"
            ],
            "base_weight": 2.0
        },
        "symptom_information": {
            "keywords": [
                "headache", "migraine", "fever", "chills", "fatigue", "tiredness",
                "exhaustion", "body pain", "body ache", "cough", "sore throat",
                "stomach ache", "abdominal pain", "nausea", "vomiting", "diarrhea",
                "constipation", "dizziness", "lightheadedness", "back pain",
                "joint pain", "swelling", "rash", "itching", "congestion",
                "runny nose", "sneezing", "wheezing", "acid reflux", "heartburn"
            ],
            "patterns": [
                r"\b(i have|suffering from|experiencing|got)\s+(a|an)?\s*[a-z\s]+(pain|ache|fever|cough|rash)\b",
                r"\b(why does my|why do i feel|what causes)\b",
                r"\b(symptoms of|signs of)\b",
                r"\b(my\s+[a-z]+\s+(hurts|aches|is sore|is swollen))\b"
            ],
            "base_weight": 2.0
        },
        "general_health": {
            "keywords": [
                "health", "healthy", "vital signs", "blood pressure", "blood sugar",
                "heart rate", "immune system", "metabolism", "body temperature",
                "wellness", "body function", "organ", "hydration"
            ],
            "patterns": [
                r"\b(how does the|what is normal)\s+[a-z\s]+\b",
                r"\b(general health|overall wellness|healthy habits)\b",
                r"\b(normal\s+(blood pressure|heart rate|temperature))\b"
            ],
            "base_weight": 1.5
        }
    }

    def classify(self, normalized_text: str, extracted_keywords: List[str]) -> Tuple[str, float]:
        """
        Classifies the input text into an intent with a confidence score.
        Emergency concerns are given immediate absolute priority.
        """
        if not normalized_text or not normalized_text.strip():
            return "unknown", 0.0

        scores: Dict[str, float] = {intent: 0.0 for intent in self.INTENT_RULES}

        # 1. Check emergency red flags first
        emergency_rules = self.INTENT_RULES["emergency_concern"]
        for kw in emergency_rules["keywords"]:
            if kw in normalized_text or kw in extracted_keywords:
                scores["emergency_concern"] += 3.5
        for pattern in emergency_rules["patterns"]:
            if re.search(pattern, normalized_text):
                scores["emergency_concern"] += 4.0

        if scores["emergency_concern"] >= 3.0:
            confidence = min(0.98, 0.85 + (scores["emergency_concern"] * 0.03))
            return "emergency_concern", round(confidence, 2)

        # 2. Score remaining intents
        for intent, rules in self.INTENT_RULES.items():
            if intent == "emergency_concern":
                continue

            # Keyword matching
            matched_kws = 0
            for kw in rules["keywords"]:
                if kw in extracted_keywords or re.search(rf"\b{re.escape(kw)}\b", normalized_text):
                    matched_kws += 1
            scores[intent] += matched_kws * rules["base_weight"]

            # Regex pattern matching
            for pattern in rules["patterns"]:
                if re.search(pattern, normalized_text):
                    scores[intent] += 2.5

        # 3. Find top scoring intent
        best_intent, best_score = max(scores.items(), key=lambda item: item[1])

        if best_score <= 0.5:
            # Fallback for generic greetings or off-topic queries
            if any(greeting in normalized_text for greeting in ["hello", "hi", "hey", "good morning", "good evening"]):
                return "general_health", 0.65
            return "unknown", 0.30

        # Calculate a normalized confidence score between 0.60 and 0.95
        confidence = 0.60 + min(0.35, (best_score / 10.0) * 0.35)
        return best_intent, round(confidence, 2)
