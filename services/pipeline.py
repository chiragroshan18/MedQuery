"""Pipeline Coordinator for MedQuery Healthcare NLP Assistant.

Executes sequential NLP stages:
Normalize -> Tokenize -> Filter -> Keyword Extraction -> Intent Classification
-> Urgency Classification -> Tone Analysis -> Response Generation
"""

from datetime import datetime
from typing import Dict, Optional

from services.intent_engine import IntentEngine
from services.response_engine import ResponseEngine
from services.state_manager import StateManager
from services.text_processor import TextProcessor
from services.tone_analyzer import ToneAnalyzer
from services.urgency_engine import UrgencyEngine


class HealthNLPPipeline:
    """End-to-end Healthcare NLP Pipeline."""

    def __init__(self):
        self.text_processor = TextProcessor()
        self.intent_engine = IntentEngine()
        self.urgency_engine = UrgencyEngine()
        self.tone_analyzer = ToneAnalyzer()
        self.response_engine = ResponseEngine()

    def analyze_text(self, text: str) -> Dict:
        """
        Executes analysis on user text without saving to conversation state.
        Useful for live previews, testing, and the /api/analyze endpoint.
        """
        # 1. Text Preprocessing & Keyword Extraction
        proc_result = self.text_processor.process(text)
        normalized_text = proc_result["normalized_text"]
        extracted_keywords = proc_result["extracted_keywords"]

        # 2. Intent Classification
        intent, confidence = self.intent_engine.classify(normalized_text, extracted_keywords)

        # 3. Urgency Classification
        urgency, urgency_rationale = self.urgency_engine.classify(normalized_text, intent, extracted_keywords)

        # 4. Tone / Sentiment Analysis
        tone, tone_rationale = self.tone_analyzer.analyze(text)

        # 5. Response Generation
        response_data = self.response_engine.generate(
            intent=intent,
            urgency=urgency,
            tone=tone,
            extracted_keywords=extracted_keywords
        )

        return {
            "raw_text": text,
            "normalized_text": normalized_text,
            "tokens": proc_result["tokens"],
            "filtered_tokens": proc_result["filtered_tokens"],
            "extracted_keywords": extracted_keywords,
            "term_details": proc_result["term_details"],
            "intent": intent,
            "confidence": confidence,
            "urgency": urgency,
            "urgency_rationale": urgency_rationale,
            "tone": tone,
            "tone_rationale": tone_rationale,
            "response": response_data,
            "timestamp": datetime.now().strftime("%I:%M %p")
        }

    def process_and_record(self, text: str, state_manager: StateManager) -> Dict:
        """
        Executes analysis, generates educational response, and commits
        the interaction to centralized runtime state.
        """
        analysis = self.analyze_text(text)
        interaction = state_manager.add_interaction(
            user_text=text,
            analysis_data={
                "intent": analysis["intent"],
                "confidence": analysis["confidence"],
                "urgency": analysis["urgency"],
                "urgency_rationale": analysis["urgency_rationale"],
                "tone": analysis["tone"],
                "tone_rationale": analysis["tone_rationale"],
                "extracted_keywords": analysis["extracted_keywords"],
                "term_details": analysis["term_details"],
                "tokens": analysis["tokens"],
                "filtered_tokens": analysis["filtered_tokens"]
            },
            response_data=analysis["response"]
        )

        return {
            "reply": analysis["response"]["reply"],
            "title": analysis["response"]["title"],
            "intent": analysis["intent"],
            "confidence": analysis["confidence"],
            "urgency": analysis["urgency"],
            "urgency_rationale": analysis["urgency_rationale"],
            "tone": analysis["tone"],
            "tone_rationale": analysis["tone_rationale"],
            "keywords": analysis["extracted_keywords"],
            "term_details": analysis["term_details"],
            "next_steps": analysis["response"]["next_steps"],
            "urgency_callout": analysis["response"]["urgency_callout"],
            "disclaimer": analysis["response"]["disclaimer"],
            "timestamp": analysis["timestamp"],
            "user_message_id": interaction["user_message"]["id"],
            "assistant_message_id": interaction["assistant_message"]["id"]
        }
