"""MedQuery — Healthcare Question & Symptom Guidance Assistant.

Flask REST API and web application server.
Provides educational health text analysis, triage, and conversation state management.
"""

from datetime import datetime
from flask import Flask, jsonify, render_template, request

from services.pipeline import HealthNLPPipeline
from services.state_manager import StateManager

app = Flask(__name__)

# Centralized runtime state and NLP pipeline instances
state_manager = StateManager()
pipeline = HealthNLPPipeline()

MAX_MESSAGE_LENGTH = 2000

SAMPLE_DEMO_QUERIES = [
    "I have had a throbbing headache and felt exhausted for the past two days.",
    "How can I improve my sleep hygiene to get more deep sleep?",
    "What are healthy high-protein options to support balanced daily nutrition?",
    "I'm feeling sudden severe chest pressure and shortness of breath!"
]


@app.route("/")
def index():
    """Renders the main single-page MedQuery healthcare interface."""
    return render_template("index.html")


@app.route("/api/health", methods=["GET"])
def health_check():
    """Server and pipeline health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "MedQuery",
        "version": "1.0.0",
        "mode": "Educational Healthcare NLP",
        "timestamp": datetime.now().isoformat()
    }), 200


@app.route("/api/chat", methods=["POST"])
def chat():
    """
    Main chatbot interaction endpoint.
    Processes user health question, computes NLP metrics, updates runtime state,
    and returns a structured educational response.
    """
    if not request.is_json:
        return jsonify({"error": "Request body must be JSON."}), 400

    data = request.get_json(silent=True)
    if data is None or "message" not in data:
        return jsonify({"error": "Missing required 'message' field in JSON request."}), 400

    raw_message = data.get("message")
    if not isinstance(raw_message, str):
        return jsonify({"error": "'message' field must be a string."}), 400

    cleaned_message = raw_message.strip()
    if not cleaned_message:
        return jsonify({"error": "Message cannot be empty or whitespace only."}), 400

    if len(cleaned_message) > MAX_MESSAGE_LENGTH:
        return jsonify({
            "error": f"Message exceeds maximum allowed length of {MAX_MESSAGE_LENGTH} characters."
        }), 400

    # Process through pipeline and record to state
    result = pipeline.process_and_record(cleaned_message, state_manager)
    return jsonify(result), 200


@app.route("/api/analyze", methods=["POST"])
def analyze():
    """
    Analyzes user text through the full NLP pipeline without mutating conversation state.
    """
    if not request.is_json:
        return jsonify({"error": "Request body must be JSON."}), 400

    data = request.get_json(silent=True)
    if data is None or "message" not in data:
        return jsonify({"error": "Missing required 'message' field in JSON request."}), 400

    raw_message = data.get("message")
    if not isinstance(raw_message, str):
        return jsonify({"error": "'message' field must be a string."}), 400

    cleaned_message = raw_message.strip()
    if not cleaned_message:
        return jsonify({"error": "Message cannot be empty or whitespace only."}), 400

    if len(cleaned_message) > MAX_MESSAGE_LENGTH:
        return jsonify({
            "error": f"Message exceeds maximum allowed length of {MAX_MESSAGE_LENGTH} characters."
        }), 400

    analysis = pipeline.analyze_text(cleaned_message)
    return jsonify(analysis), 200


@app.route("/api/dashboard", methods=["GET"])
def get_dashboard():
    """Returns dynamic analytics calculated from active session state."""
    analytics = state_manager.get_dashboard()
    return jsonify(analytics), 200


@app.route("/api/conversation", methods=["GET"])
def get_conversation():
    """Returns current runtime conversation messages."""
    return jsonify({
        "messages": state_manager.get_conversation(),
        "total": len(state_manager.messages)
    }), 200


@app.route("/api/conversation/clear", methods=["POST"])
def clear_conversation():
    """Resets the runtime conversation state."""
    state_manager.reset()
    return jsonify({
        "status": "cleared",
        "message": "Conversation history and analytics reset successfully.",
        "timestamp": datetime.now().isoformat()
    }), 200


@app.route("/api/demo", methods=["POST"])
def restore_demo():
    """Restores sample educational interactions into runtime session state."""
    state_manager.reset()
    for query in SAMPLE_DEMO_QUERIES:
        pipeline.process_and_record(query, state_manager)

    return jsonify({
        "status": "demo_restored",
        "message": "Sample educational conversation restored.",
        "conversation": state_manager.get_conversation(),
        "dashboard": state_manager.get_dashboard()
    }), 200


@app.errorhandler(404)
def not_found_error(error):
    return jsonify({"error": "Resource not found."}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "An internal server error occurred."}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
