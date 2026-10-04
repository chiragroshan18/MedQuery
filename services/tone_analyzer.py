"""Tone and Sentiment Analysis Engine for MedQuery.

Analyzes user health inquiry tone across 5 emotional states:
- Calm
- Concerned
- Frustrated
- Positive
- Neutral
"""

import re
from typing import Dict, List, Tuple


class ToneAnalyzer:
    """Rule-based Tone and Sentiment Analyzer for healthcare interactions."""

    TONE_LEXICON: Dict[str, Dict[str, List[str]]] = {
        "Concerned": {
            "keywords": [
                "worried", "scared", "afraid", "fear", "anxious", "panic", "terrified",
                "nervous", "alarmed", "frightened", "concern", "hurts a lot",
                "really hurts", "badly", "unbearable", "stressing", "distressed",
                "serious", "danger"
            ],
            "patterns": [
                r"\b(i'?m|i\s+am)\s+(really\s+)?(worried|scared|afraid|anxious|terrified)\b",
                r"\b(is\s+it|could\s+this\s+be)\s+(serious|dangerous|cancer|fatal)\b",
                r"\b(freaking\s+out|extremely\s+painful)\b"
            ]
        },
        "Frustrated": {
            "keywords": [
                "frustrated", "annoyed", "exhausted", "tired of", "sick of",
                "fed up", "nothing works", "nothing helps", "hate this", "miserable",
                "hopeless", "can't stand", "again", "still hurts", "waste of time"
            ],
            "patterns": [
                r"\b(tired|sick)\s+of\s+(this|being\s+sick|pain)\b",
                r"\bnothing\s+(is\s+working|seems\s+to\s+work|helps)\b",
                r"\b(why\s+won'?t\s+this\s+go\s+away)\b"
            ]
        },
        "Positive": {
            "keywords": [
                "better", "improving", "great", "good", "thank you", "thanks",
                "grateful", "hopeful", "relief", "recovering", "optimistic",
                "excited", "healthy", "feeling good", "progress"
            ],
            "patterns": [
                r"\b(feeling|getting)\s+(much\s+)?(better|stronger|healthier)\b",
                r"\b(thank\s+you|appreciate|good\s+progress|great\s+advice)\b",
                r"\b(happy\s+with|recovery\s+is\s+going\s+well)\b"
            ]
        },
        "Calm": {
            "keywords": [
                "curious", "wondering", "interested", "reading about", "inquiring",
                "routine", "general question", "understand", "learn", "information"
            ],
            "patterns": [
                r"\b(just\s+curious|wondering\s+about|wanted\s+to\s+know)\b",
                r"\b(could\s+you\s+explain|routine\s+checkup)\b",
                r"\b(for\s+educational\s+purposes)\b"
            ]
        }
    }

    def analyze(self, text: str) -> Tuple[str, str]:
        """
        Analyzes the emotional tone of the input text.
        Returns: (tone_label, tone_rationale)
        """
        if not text or not text.strip():
            return "Neutral", "Objective informational statement."

        lower_text = text.lower()
        scores: Dict[str, float] = {"Concerned": 0.0, "Frustrated": 0.0, "Positive": 0.0, "Calm": 0.0}

        for tone, rules in self.TONE_LEXICON.items():
            for kw in rules["keywords"]:
                if kw in lower_text:
                    scores[tone] += 1.5
            for pattern in rules["patterns"]:
                if re.search(pattern, lower_text):
                    scores[tone] += 2.5

        top_tone, top_score = max(scores.items(), key=lambda x: x[1])

        if top_score >= 1.5:
            rationales = {
                "Concerned": "Phrasing reflects worry, heightened apprehension, or health-related anxiety.",
                "Frustrated": "Phrasing reflects exhaustion, impatience, or dissatisfaction with persistent discomfort.",
                "Positive": "Phrasing reflects optimism, recovery progress, gratitude, or proactive attitude.",
                "Calm": "Phrasing reflects an inquisitive, structured, and measured inquiry."
            }
            return top_tone, rationales[top_tone]

        return "Neutral", "Even-keeled, factual health inquiry with no strong emotional markers."
