"""Response Generation Engine for MedQuery.

Generates safe, structured, educational responses adhering strictly to healthcare
safety standards (no diagnosis, no prescription, conservative triage guidance).
"""

from typing import Dict, List

DISCLAIMER_TEXT = (
    "MedQuery provides general educational information and is not a substitute "
    "for professional medical advice, diagnosis, or treatment."
)


class ResponseEngine:
    """Generates empathetic, educational, and safety-compliant health responses."""

    INTENT_RESPONSES = {
        "emergency_concern": {
            "title": "Emergency Medical Guidance",
            "body": (
                "The symptoms or terms you mentioned indicate a potentially serious medical situation. "
                "MedQuery cannot diagnose conditions or assess acute medical crises. "
                "If you or someone nearby is experiencing acute chest discomfort, severe shortness of breath, "
                "sudden numbness, slurred speech, heavy bleeding, or thoughts of self-harm, please contact "
                "local emergency services (such as 911, 112, or 999) or visit the nearest emergency department immediately."
            ),
            "next_steps": [
                "Call your local emergency number (e.g., 911 / 112) without delay.",
                "Do not attempt to drive yourself to the hospital if experiencing acute symptoms.",
                "If alone, notify a trusted family member, neighbor, or emergency contact immediately."
            ]
        },
        "symptom_information": {
            "title": "Educational Symptom Overview",
            "body": (
                "Symptoms such as those you described can arise from various common causes, ranging from benign, "
                "temporary physiological factors (such as dehydration, mild viral infections, tension, or fatigue) "
                "to conditions requiring clinical investigation. Because physical symptoms can overlap across multiple "
                "health conditions, an accurate assessment requires a physical exam and medical evaluation by a licensed clinician."
            ),
            "next_steps": [
                "Maintain adequate hydration, rest, and observe how your symptoms evolve.",
                "Track the onset, frequency, duration, and severity of your symptoms in a symptom diary.",
                "Seek medical evaluation if your symptoms persist for more than a few days, worsen progressively, or are accompanied by a high fever or severe pain."
            ]
        },
        "medication_information": {
            "title": "General Medication & Pharmacology Principles",
            "body": (
                "Medication safety is essential for effective treatment and avoiding adverse interactions. "
                "Dosages, contraindications, and potential side effects depend heavily on individual factors such as "
                "age, weight, kidney and liver function, and concurrent medications. "
                "Never alter, discontinue, or start any prescription or over-the-counter medication without consulting "
                "your physician or licensed pharmacist."
            ),
            "next_steps": [
                "Carefully read the official patient information leaflet included with your medication packaging.",
                "Consult your pharmacist or prescribing doctor for exact dosage schedules and food-drug interaction advice.",
                "Immediately report any unusual side effects, allergic rashes, or adverse reactions to your doctor."
            ]
        },
        "sleep": {
            "title": "Sleep Hygiene & Circadian Health",
            "body": (
                "Quality sleep is fundamental to immune function, cognitive performance, and cardiovascular health. "
                "Difficulty falling or staying asleep (insomnia) is frequently linked to environmental cues, screen exposure, "
                "caffeine intake, or elevated stress levels. Practicing consistent sleep hygiene is the evidence-based "
                "first-line approach for improving sleep architecture."
            ),
            "next_steps": [
                "Maintain a consistent sleep and wake schedule every day, including on weekends.",
                "Eliminate blue-light screens (smartphones, tablets, laptops) at least 60 minutes before bed.",
                "Keep your bedroom cool (around 65°F / 18°C), dark, and quiet.",
                "If sleep difficulties persist for more than 3 to 4 weeks or involve heavy snoring, consult a healthcare provider."
            ]
        },
        "nutrition": {
            "title": "Evidence-Based Nutritional Guidelines",
            "body": (
                "Balanced nutrition emphasizes wholesome, minimally processed foods that supply essential macronutrients "
                "(proteins, complex carbohydrates, healthy unsaturated fats) and vital micronutrients (vitamins and minerals). "
                "Adequate daily hydration and dietary fiber are cornerstone habits supporting metabolic and digestive health."
            ),
            "next_steps": [
                "Aim for a varied plate featuring leafy greens, colorful vegetables, lean proteins, and whole grains.",
                "Drink adequate water throughout the day (generally 2 to 3 liters, adjusted for activity level and climate).",
                "Limit ultra-processed foods, high-sodium snacks, and refined sugars.",
                "Consider consulting a Registered Dietitian (RD) for personalized nutritional planning tailored to your metabolic profile."
            ]
        },
        "exercise": {
            "title": "Physical Activity & Fitness Fundamentals",
            "body": (
                "Regular physical activity promotes cardiovascular endurance, musculoskeletal strength, metabolic regulation, "
                "and mental clarity. Health guidelines generally recommend at least 150 minutes of moderate-intensity aerobic "
                "exercise (such as brisk walking or cycling) along with two days of muscle-strengthening exercises per week."
            ),
            "next_steps": [
                "Begin gradually if you are new to working out, starting with 10–15 minute brisk walks.",
                "Incorporate light dynamic stretching before activity and gentle static stretching afterward.",
                "Listen to your body and avoid pushing through acute sharp joint or muscle pain.",
                "Speak with your physician before beginning a strenuous fitness program, especially if you have pre-existing conditions."
            ]
        },
        "mental_wellness": {
            "title": "Mental Wellness & Stress Regulation",
            "body": (
                "Mental health is deeply interconnected with physical vitality. Periodic feelings of stress, anxiety, or sadness "
                "are common human responses to life challenges. Mind-body techniques such as diaphragmatic breathing, "
                "mindfulness meditation, and structured daily pauses can help down-regulate the sympathetic nervous system."
            ),
            "next_steps": [
                "Try structured 4-7-8 rhythmic breathing or a 5-minute guided meditation when experiencing acute tension.",
                "Prioritize social connection and share your feelings with trusted friends, family, or counselors.",
                "Establish boundaries around work, news consumption, and digital devices.",
                "If emotional distress feels overwhelming, persistent, or interferes with daily life, reach out to a licensed mental health professional."
            ]
        },
        "preventive_care": {
            "title": "Preventive Care & Health Maintenance",
            "body": (
                "Preventive healthcare focuses on early detection, routine screenings, and lifestyle modifications to maintain "
                "optimal health and prevent chronic disease before symptoms emerge. Routine checkups and timely immunizations "
                "remain among the most effective public health interventions."
            ),
            "next_steps": [
                "Schedule periodic comprehensive health checkups and blood pressure screenings with your primary care clinician.",
                "Stay current on age-appropriate vaccinations and routine diagnostic screenings.",
                "Practice regular hand hygiene and sun protection with broad-spectrum SPF sunscreen.",
                "Discuss your personal and family medical history with your doctor to determine tailored screening intervals."
            ]
        },
        "general_health": {
            "title": "General Health & Wellness Guidance",
            "body": (
                "Maintaining overall health involves foundational pillars: balanced daily nutrition, restorative sleep, "
                "consistent movement, hydration, and proactive stress management. Small, sustainable habits implemented "
                "consistently produce profound long-term positive outcomes for your vitality."
            ),
            "next_steps": [
                "Establish predictable daily routines for sleep, meals, and physical activity.",
                "Stay mindful of early fatigue cues and prioritize recuperation.",
                "Keep a personal health record of immunizations, baseline vital signs, and family health history.",
                "Partner with a primary care clinician for routine annual health assessments."
            ]
        },
        "unknown": {
            "title": "General Health Assistance",
            "body": (
                "Thank you for reaching out to MedQuery. I specialize in health, symptom, lifestyle, medication, nutrition, "
                "sleep, and wellness educational topics. I was not able to identify a specific medical or wellness subject "
                "in your question. Please feel free to ask about specific symptoms, health habits, or educational wellness concepts."
            ),
            "next_steps": [
                "Describe any physical symptoms you are curious about (e.g., headache, sleep quality, joint stiffness).",
                "Ask questions regarding general lifestyle areas like nutrition, exercise, or stress management.",
                "Remember that MedQuery provides educational information and does not offer clinical diagnosis."
            ]
        }
    }

    def generate(
        self,
        intent: str,
        urgency: str,
        tone: str,
        extracted_keywords: List[str]
    ) -> Dict:
        """
        Builds a comprehensive educational response with next steps,
        empathy preamble based on tone, and urgency triage instructions.
        """
        template = self.INTENT_RESPONSES.get(intent, self.INTENT_RESPONSES["unknown"])

        # Tone empathy prefix
        tone_prefix = ""
        if tone == "Concerned":
            tone_prefix = "I understand you may be feeling concerned or uncomfortable. "
        elif tone == "Frustrated":
            tone_prefix = "Managing ongoing physical discomfort or uncertainty can be very frustrating. "
        elif tone == "Positive":
            tone_prefix = "It's encouraging to hear positive momentum in your health journey. "
        elif tone == "Calm":
            tone_prefix = "Thank you for your structured question. "

        # Keyword context note
        kw_note = ""
        if extracted_keywords:
            terms_display = ", ".join(f"'{k}'" for k in extracted_keywords[:4])
            kw_note = f"\n\nIdentified health terms: {terms_display}."

        # Urgency callout
        urgency_callout = ""
        if urgency == "Urgent":
            urgency_callout = (
                "⚠️ URGENT HEALTH NOTICE: The indicators in your message suggest a potentially urgent medical condition. "
                "Do not wait. Seek immediate medical attention or call emergency services right away."
            )
        elif urgency == "Needs Attention":
            urgency_callout = (
                "📌 CLINICAL ATTENTION ADVISORY: These symptoms warrant assessment by a qualified doctor or healthcare "
                "provider to evaluate their underlying cause and prevent complications."
            )

        # Assemble full educational response
        full_text = f"{tone_prefix}{template['body']}{kw_note}"

        return {
            "title": template["title"],
            "reply": full_text,
            "next_steps": template["next_steps"],
            "urgency_callout": urgency_callout,
            "disclaimer": DISCLAIMER_TEXT
        }
