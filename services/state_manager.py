"""Centralized Runtime State Manager for MedQuery.

Maintains live in-memory conversation history and dynamic analytics aggregation.
Zero hardcoded dashboard metrics.
"""

from datetime import datetime
from typing import Dict, List, Optional


class StateManager:
    """Manages runtime session state, conversation history, and dynamic analytics."""

    def __init__(self):
        self.reset()

    def reset(self) -> None:
        """Resets the state to an empty session."""
        self.session_started = datetime.now().isoformat()
        self.messages: List[Dict] = []
        self.intent_counts: Dict[str, int] = {}
        self.urgency_counts: Dict[str, int] = {
            "Routine": 0,
            "Needs Attention": 0,
            "Urgent": 0
        }
        self.tone_counts: Dict[str, int] = {
            "Calm": 0,
            "Concerned": 0,
            "Frustrated": 0,
            "Positive": 0,
            "Neutral": 0
        }
        self.keyword_counts: Dict[str, int] = {}
        self._next_id = 1

    def add_interaction(
        self,
        user_text: str,
        analysis_data: Dict,
        response_data: Dict
    ) -> Dict:
        """
        Records both user inquiry and assistant response, updating live analytics.
        Returns the pair of created messages.
        """
        now_str = datetime.now().strftime("%I:%M %p")
        iso_str = datetime.now().isoformat()

        # Update Intent counts
        intent = analysis_data.get("intent", "unknown")
        self.intent_counts[intent] = self.intent_counts.get(intent, 0) + 1

        # Update Urgency counts
        urgency = analysis_data.get("urgency", "Routine")
        if urgency not in self.urgency_counts:
            self.urgency_counts[urgency] = 0
        self.urgency_counts[urgency] += 1

        # Update Tone counts
        tone = analysis_data.get("tone", "Neutral")
        if tone not in self.tone_counts:
            self.tone_counts[tone] = 0
        self.tone_counts[tone] += 1

        # Update Keyword counts
        keywords = analysis_data.get("extracted_keywords", [])
        for kw in keywords:
            self.keyword_counts[kw] = self.keyword_counts.get(kw, 0) + 1

        user_msg = {
            "id": f"msg_{self._next_id}",
            "sender": "user",
            "text": user_text,
            "timestamp": now_str,
            "iso_timestamp": iso_str,
            "analysis": {
                "intent": intent,
                "confidence": analysis_data.get("confidence", 0.0),
                "urgency": urgency,
                "urgency_rationale": analysis_data.get("urgency_rationale", ""),
                "tone": tone,
                "tone_rationale": analysis_data.get("tone_rationale", ""),
                "keywords": keywords,
                "term_details": analysis_data.get("term_details", {}),
                "tokens": analysis_data.get("tokens", []),
                "filtered_tokens": analysis_data.get("filtered_tokens", [])
            }
        }
        self._next_id += 1
        self.messages.append(user_msg)

        assistant_msg = {
            "id": f"msg_{self._next_id}",
            "sender": "assistant",
            "title": response_data.get("title", "Guidance"),
            "text": response_data.get("reply", ""),
            "next_steps": response_data.get("next_steps", []),
            "urgency_callout": response_data.get("urgency_callout", ""),
            "disclaimer": response_data.get("disclaimer", ""),
            "timestamp": now_str,
            "iso_timestamp": iso_str,
            "analysis_ref": user_msg["id"],
            "analysis": user_msg["analysis"]
        }
        self._next_id += 1
        self.messages.append(assistant_msg)

        return {
            "user_message": user_msg,
            "assistant_message": assistant_msg
        }

    def get_conversation(self) -> List[Dict]:
        """Returns the full list of conversation messages."""
        return self.messages

    def get_dashboard(self) -> Dict:
        """
        Dynamically aggregates metrics across the active session.
        Never returns hardcoded values.
        """
        total_messages = len(self.messages)
        user_messages = sum(1 for m in self.messages if m["sender"] == "user")
        assistant_messages = sum(1 for m in self.messages if m["sender"] == "assistant")

        # Most common intent
        if self.intent_counts:
            most_common_intent = max(self.intent_counts.items(), key=lambda x: x[1])[0]
        else:
            most_common_intent = "None yet"

        # Latest urgency and tone from the most recent user message
        latest_user_msgs = [m for m in self.messages if m["sender"] == "user"]
        if latest_user_msgs:
            current_urgency = latest_user_msgs[-1]["analysis"]["urgency"]
            current_tone = latest_user_msgs[-1]["analysis"]["tone"]
            latest_intent = latest_user_msgs[-1]["analysis"]["intent"]
            latest_confidence = latest_user_msgs[-1]["analysis"]["confidence"]
            latest_keywords = latest_user_msgs[-1]["analysis"]["keywords"]
        else:
            current_urgency = "Routine"
            current_tone = "Neutral"
            latest_intent = "None yet"
            latest_confidence = 0.0
            latest_keywords = []

        # Intent distribution percentages
        total_intent_queries = sum(self.intent_counts.values())
        intent_distribution = {}
        if total_intent_queries > 0:
            for intent, count in self.intent_counts.items():
                intent_distribution[intent] = {
                    "count": count,
                    "percentage": round((count / total_intent_queries) * 100, 1)
                }

        # Urgency distribution percentages
        total_urgencies = sum(self.urgency_counts.values())
        urgency_distribution = {}
        for urg, count in self.urgency_counts.items():
            pct = round((count / total_urgencies) * 100, 1) if total_urgencies > 0 else 0.0
            urgency_distribution[urg] = {
                "count": count,
                "percentage": pct
            }

        # Tone distribution percentages
        total_tones = sum(self.tone_counts.values())
        tone_distribution = {}
        for tone_label, count in self.tone_counts.items():
            pct = round((count / total_tones) * 100, 1) if total_tones > 0 else 0.0
            tone_distribution[tone_label] = {
                "count": count,
                "percentage": pct
            }

        # Top keywords sorted by frequency
        sorted_kws = sorted(self.keyword_counts.items(), key=lambda x: x[1], reverse=True)
        top_keywords = [{"term": term, "count": count} for term, count in sorted_kws[:12]]

        return {
            "session_started": self.session_started,
            "total_messages": total_messages,
            "user_messages": user_messages,
            "assistant_messages": assistant_messages,
            "most_common_intent": most_common_intent,
            "current_urgency": current_urgency,
            "current_tone": current_tone,
            "latest_intent": latest_intent,
            "latest_confidence": latest_confidence,
            "latest_keywords": latest_keywords,
            "total_unique_keywords": len(self.keyword_counts),
            "total_keyword_mentions": sum(self.keyword_counts.values()),
            "intent_counts": self.intent_counts,
            "intent_distribution": intent_distribution,
            "urgency_counts": self.urgency_counts,
            "urgency_distribution": urgency_distribution,
            "tone_counts": self.tone_counts,
            "tone_distribution": tone_distribution,
            "top_keywords": top_keywords
        }
