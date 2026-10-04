/**
 * MedQuery — Client-Side NLP Engine for GitHub Pages Demonstration.
 * Faithfully mirrors the Python backend logic in modern browser JavaScript.
 * Implements Text Normalization, Tokenization, Keyword Extraction,
 * Rule-Based Intent Classification, Conservative Urgency Triage,
 * Emotional Tone Analysis, Educational Response Generation, and Centralized State.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MedQueryEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const ABBREVIATIONS = {
    bp: 'blood pressure',
    hr: 'heart rate',
    temp: 'temperature',
    rx: 'prescription',
    otc: 'over the counter',
    sob: 'shortness of breath',
    dr: 'doctor',
    meds: 'medications',
    med: 'medication',
    vit: 'vitamin',
    doc: 'doctor'
  };

  const STOP_WORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'all', 'am', 'an', 'and', 'any', 'are',
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between',
    'both', 'by', 'could', 'did', 'do', 'does', 'doing', 'down', 'during',
    'each', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he',
    'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i',
    'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more',
    'most', 'my', 'myself', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
    'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she',
    'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs',
    'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those',
    'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were',
    'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with',
    'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
  ]);

  const HEALTH_DICTIONARY = {
    // Emergency
    'chest pain': 'symptom',
    'chest pressure': 'symptom',
    'shortness of breath': 'symptom',
    'difficulty breathing': 'symptom',
    'sudden numbness': 'symptom',
    'slurred speech': 'symptom',
    'loss of consciousness': 'symptom',
    'coughing blood': 'symptom',
    'severe bleeding': 'symptom',
    'thunderclap headache': 'symptom',
    'anaphylaxis': 'symptom',
    'suicidal thoughts': 'symptom',

    // Physical Symptoms
    'headache': 'symptom',
    'migraine': 'symptom',
    'fever': 'symptom',
    'high fever': 'symptom',
    'chills': 'symptom',
    'fatigue': 'symptom',
    'tiredness': 'symptom',
    'exhaustion': 'symptom',
    'body pain': 'symptom',
    'body ache': 'symptom',
    'muscle ache': 'symptom',
    'cough': 'symptom',
    'dry cough': 'symptom',
    'productive cough': 'symptom',
    'sore throat': 'symptom',
    'stomach ache': 'symptom',
    'abdominal pain': 'symptom',
    'stomach pain': 'symptom',
    'nausea': 'symptom',
    'vomiting': 'symptom',
    'diarrhea': 'symptom',
    'constipation': 'symptom',
    'dizziness': 'symptom',
    'lightheadedness': 'symptom',
    'back pain': 'symptom',
    'joint pain': 'symptom',
    'knee pain': 'symptom',
    'swelling': 'symptom',
    'rash': 'symptom',
    'itching': 'symptom',
    'congestion': 'symptom',
    'runny nose': 'symptom',
    'sneezing': 'symptom',
    'wheezing': 'symptom',
    'insomnia': 'symptom',
    'palpitations': 'symptom',
    'blurred vision': 'symptom',
    'heartburn': 'symptom',
    'acid reflux': 'symptom',
    'cramps': 'symptom',

    // Mental Wellness
    'anxiety': 'mental_health',
    'panic attack': 'mental_health',
    'stress': 'mental_health',
    'depression': 'mental_health',
    'burnout': 'mental_health',
    'sadness': 'mental_health',
    'mood swings': 'mental_health',
    'restlessness': 'mental_health',

    // Lifestyle & Wellness
    'sleep': 'lifestyle',
    'deep sleep': 'lifestyle',
    'sleep hygiene': 'lifestyle',
    'nutrition': 'lifestyle',
    'diet': 'lifestyle',
    'calories': 'lifestyle',
    'protein': 'lifestyle',
    'hydration': 'lifestyle',
    'water intake': 'lifestyle',
    'vitamins': 'lifestyle',
    'vitamin d': 'lifestyle',
    'vitamin c': 'lifestyle',
    'exercise': 'lifestyle',
    'workout': 'lifestyle',
    'cardio': 'lifestyle',
    'walking': 'lifestyle',
    'strength training': 'lifestyle',
    'stretching': 'lifestyle',
    'meditation': 'lifestyle',
    'yoga': 'lifestyle',

    // Clinical & Medications
    'medication': 'clinical',
    'medicine': 'clinical',
    'antibiotic': 'clinical',
    'painkiller': 'clinical',
    'paracetamol': 'clinical',
    'ibuprofen': 'clinical',
    'aspirin': 'clinical',
    'dosage': 'clinical',
    'dose': 'clinical',
    'side effects': 'clinical',
    'side effect': 'clinical',
    'prescription': 'clinical',
    'blood pressure': 'clinical',
    'blood sugar': 'clinical',
    'heart rate': 'clinical',
    'cholesterol': 'clinical',
    'allergy': 'clinical',
    'vaccine': 'clinical',
    'checkup': 'clinical',
    'screening': 'clinical',
    'doctor': 'clinical',
    'physician': 'clinical',
    'clinic': 'clinical'
  };

  const DISCLAIMER_TEXT =
    'MedQuery provides general educational information and is not a substitute for professional medical advice, diagnosis, or treatment.';

  // 1. Text Processor
  class TextProcessor {
    constructor() {
      this.sortedTerms = Object.keys(HEALTH_DICTIONARY).sort((a, b) => b.length - a.length);
    }

    normalize(text) {
      if (!text) return '';
      let normalized = text.toLowerCase().trim();
      for (const [abbr, expansion] of Object.entries(ABBREVIATIONS)) {
        const regex = new RegExp(`\\b${abbr}\\b`, 'g');
        normalized = normalized.replace(regex, expansion);
      }
      return normalized.replace(/\s+/g, ' ');
    }

    tokenize(text) {
      if (!text) return [];
      const matches = text.toLowerCase().match(/\b[a-z0-9]+(?:-[a-z0-9]+)?\b/g);
      return matches || [];
    }

    removeStopwords(tokens) {
      return tokens.filter(t => !STOP_WORDS.has(t));
    }

    extractKeywords(normalizedText) {
      if (!normalizedText) return { keywords: [], termDetails: {} };
      const foundTerms = [];
      const termDetails = {};
      const matchedSpans = [];

      for (const term of this.sortedTerms) {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        let match;
        while ((match = regex.exec(normalizedText)) !== null) {
          const start = match.index;
          const end = start + term.length;
          const overlap = matchedSpans.some(([s, e]) => (s <= start && start < e) || (s < end && end <= e));
          if (!overlap) {
            matchedSpans.push([start, end]);
            if (!foundTerms.includes(term)) {
              foundTerms.push(term);
              termDetails[term] = HEALTH_DICTIONARY[term];
            }
          }
        }
      }

      return { keywords: foundTerms, termDetails };
    }

    process(text) {
      const normalized = this.normalize(text);
      const tokens = this.tokenize(normalized);
      const filteredTokens = this.removeStopwords(tokens);
      const { keywords, termDetails } = this.extractKeywords(normalized);

      return {
        rawText: text,
        normalizedText: normalized,
        tokens,
        filteredTokens,
        extractedKeywords: keywords,
        termDetails
      };
    }
  }

  // 2. Intent Engine
  class IntentEngine {
    constructor() {
      this.rules = {
        emergency_concern: {
          keywords: [
            'chest pain', 'chest pressure', 'difficulty breathing', 'shortness of breath',
            'cannot breathe', 'sudden numbness', 'slurred speech', 'loss of consciousness',
            'coughing blood', 'severe bleeding', 'thunderclap headache', 'anaphylaxis',
            'suicidal thoughts', 'heart attack', 'stroke', 'crushing pain'
          ],
          patterns: [
            /\b(can'?t|cannot) breathe\b/i,
            /\b(chest|heart)\s+(hurts|hurting|crushing|squeezing)\b/i,
            /\b(sudden|severe)\s+(numbness|paralysis|blindness|confusion)\b/i,
            /\b(vomiting|coughing)\s+(up\s+)?blood\b/i,
            /\bkill myself\b|\bsuicid(e|al)\b/i
          ],
          baseWeight: 3.5
        },
        medication_information: {
          keywords: [
            'medication', 'medicine', 'pill', 'tablet', 'antibiotic', 'painkiller',
            'paracetamol', 'ibuprofen', 'aspirin', 'dosage', 'dose', 'side effects',
            'prescription', 'drug interaction', 'otc'
          ],
          patterns: [
            /\b(how much|what dose|what dosage|how often to take)\b/i,
            /\b(side effects of|can i take|interactions between)\b/i
          ],
          baseWeight: 2.2
        },
        sleep: {
          keywords: ['sleep', 'insomnia', 'deep sleep', 'bedtime', 'snoring', 'sleep hygiene'],
          patterns: [
            /\b(can'?t|trouble|hard to)\s+(fall\s+)?sleep\b/i,
            /\b(improve|better|quality of)\s+sleep\b/i
          ],
          baseWeight: 2.2
        },
        nutrition: {
          keywords: ['nutrition', 'diet', 'food', 'calories', 'protein', 'hydration', 'water intake', 'vitamins'],
          patterns: [
            /\b(healthy|balanced)\s+(diet|meal|eating|food)\b/i,
            /\b(how much|how many)\s+(water|protein|calories)\b/i
          ],
          baseWeight: 2.0
        },
        exercise: {
          keywords: ['exercise', 'workout', 'cardio', 'strength training', 'walking', 'stretching', 'yoga'],
          patterns: [
            /\b(exercise|workout)\s+(routine|plan|benefits|tips)\b/i,
            /\b(physical activity|weight training)\b/i
          ],
          baseWeight: 2.0
        },
        mental_wellness: {
          keywords: ['anxiety', 'panic attack', 'stress', 'depression', 'sadness', 'burnout', 'mental health'],
          patterns: [
            /\bfeeling\s+(anxious|stressed|depressed|sad|overwhelmed|nervous)\b/i,
            /\b(manage|cope with|reduce)\s+(stress|anxiety)\b/i
          ],
          baseWeight: 2.0
        },
        preventive_care: {
          keywords: ['preventive', 'checkup', 'annual exam', 'screening', 'vaccine', 'vaccination', 'blood test'],
          patterns: [
            /\b(prevent|avoid)\s+(getting sick|illness|disease|infection)\b/i,
            /\b(when to get|schedule)\s+(a checkup|a vaccine|blood test)\b/i
          ],
          baseWeight: 2.0
        },
        symptom_information: {
          keywords: [
            'headache', 'migraine', 'fever', 'chills', 'fatigue', 'tiredness',
            'body pain', 'cough', 'sore throat', 'stomach ache', 'nausea', 'vomiting',
            'diarrhea', 'dizziness', 'back pain', 'joint pain', 'swelling', 'rash'
          ],
          patterns: [
            /\b(i have|suffering from|experiencing|got)\s+(a|an)?\s*[a-z\s]+(pain|ache|fever|cough|rash)\b/i,
            /\b(why does my|why do i feel|what causes)\b/i
          ],
          baseWeight: 2.0
        },
        general_health: {
          keywords: ['health', 'healthy', 'vital signs', 'blood pressure', 'blood sugar', 'heart rate', 'wellness'],
          patterns: [
            /\b(general health|overall wellness|healthy habits)\b/i
          ],
          baseWeight: 1.5
        }
      };
    }

    classify(normalizedText, extractedKeywords) {
      if (!normalizedText || !normalizedText.trim()) {
        return { intent: 'unknown', confidence: 0.0 };
      }

      // Check emergency red flags first
      const em = this.rules.emergency_concern;
      let emScore = 0;
      for (const kw of em.keywords) {
        if (normalizedText.includes(kw) || extractedKeywords.includes(kw)) emScore += 3.5;
      }
      for (const pat of em.patterns) {
        if (pat.test(normalizedText)) emScore += 4.0;
      }

      if (emScore >= 3.0) {
        const conf = Math.min(0.98, 0.85 + (emScore * 0.03));
        return { intent: 'emergency_concern', confidence: Math.round(conf * 100) / 100 };
      }

      const scores = {};
      for (const [intent, rule] of Object.entries(this.rules)) {
        if (intent === 'emergency_concern') continue;
        let score = 0;
        for (const kw of rule.keywords) {
          if (extractedKeywords.includes(kw) || new RegExp(`\\b${kw}\\b`, 'i').test(normalizedText)) {
            score += rule.baseWeight;
          }
        }
        for (const pat of rule.patterns) {
          if (pat.test(normalizedText)) score += 2.5;
        }
        scores[intent] = score;
      }

      let bestIntent = 'unknown';
      let bestScore = 0;
      for (const [intent, score] of Object.entries(scores)) {
        if (score > bestScore) {
          bestScore = score;
          bestIntent = intent;
        }
      }

      if (bestScore <= 0.5) {
        if (/hello|hi|hey|good morning|good evening/i.test(normalizedText)) {
          return { intent: 'general_health', confidence: 0.65 };
        }
        return { intent: 'unknown', confidence: 0.30 };
      }

      const conf = Math.min(0.95, 0.60 + ((bestScore / 10.0) * 0.35));
      return { intent: bestIntent, confidence: Math.round(conf * 100) / 100 };
    }
  }

  // 3. Urgency Engine
  class UrgencyEngine {
    constructor() {
      this.urgentIndicators = [
        'chest pain', 'chest pressure', 'shortness of breath', 'difficulty breathing',
        'cannot breathe', 'sudden numbness', 'slurred speech', 'loss of consciousness',
        'passed out', 'coughing blood', 'severe bleeding', 'thunderclap headache',
        'anaphylaxis', 'suicidal thoughts', 'crushing pain', 'heart attack', 'stroke'
      ];
      this.attentionIndicators = [
        'high fever', 'persistent fever', 'vomiting', 'diarrhea', 'swelling',
        'migraine', 'severe pain', 'worsening', 'infection', 'pus', 'rash spreading',
        'dizziness', 'palpitations', 'blurred vision', 'several days', 'weeks'
      ];
    }

    classify(normalizedText, intent, extractedKeywords) {
      if (!normalizedText) return { urgency: 'Routine', rationale: 'General educational inquiry.' };

      if (intent === 'emergency_concern') {
        return {
          urgency: 'Urgent',
          rationale: 'Red-flag symptom indicators detected. Immediate professional or emergency evaluation is advised.'
        };
      }

      for (const term of this.urgentIndicators) {
        if (normalizedText.includes(term) || extractedKeywords.includes(term)) {
          return {
            urgency: 'Urgent',
            rationale: `High-risk clinical term detected ('${term}'). Please seek immediate emergency medical care.`
          };
        }
      }

      if (/\b(can'?t|trouble|struggling\s+to)\s+breathe\b/i.test(normalizedText) ||
          /\b(severe|intense|crushing)\s+(chest\s+)?(pain|pressure)\b/i.test(normalizedText)) {
        return {
          urgency: 'Urgent',
          rationale: 'Acute severe distress pattern detected. Requires prompt emergency medical assessment.'
        };
      }

      for (const term of this.attentionIndicators) {
        if (normalizedText.includes(term) || extractedKeywords.includes(term)) {
          return {
            urgency: 'Needs Attention',
            rationale: `Moderate or persistent symptom indicator ('${term}') detected. Clinical evaluation by a doctor is recommended.`
          };
        }
      }

      if (/\b(for|past|over|lasting)\s+(\d+|several|a\s+few)\s+(days|weeks|months)\b/i.test(normalizedText) ||
          /\b(getting\s+worse|worsening)\b/i.test(normalizedText)) {
        return {
          urgency: 'Needs Attention',
          rationale: 'Persistent duration or progressive severity detected. Consultation with a healthcare provider is suggested.'
        };
      }

      if (intent === 'symptom_information') {
        return {
          urgency: 'Needs Attention',
          rationale: 'Symptom reported. Monitor progression and seek clinical advice if symptoms worsen or persist.'
        };
      }

      return {
        urgency: 'Routine',
        rationale: 'General educational, lifestyle, or preventive query. Standard self-care and routine medical consultation apply.'
      };
    }
  }

  // 4. Tone Analyzer
  class ToneAnalyzer {
    constructor() {
      this.lexicon = {
        Concerned: {
          keywords: ['worried', 'scared', 'afraid', 'fear', 'anxious', 'panic', 'nervous', 'alarmed', 'hurts a lot', 'badly', 'serious'],
          patterns: [/\b(i'?m|i\s+am)\s+(really\s+)?(worried|scared|afraid|anxious)\b/i, /\bis\s+it\s+(serious|dangerous)\b/i]
        },
        Frustrated: {
          keywords: ['frustrated', 'annoyed', 'exhausted', 'tired of', 'sick of', 'fed up', 'nothing works', 'hate this'],
          patterns: [/\b(tired|sick)\s+of\s+this\b/i, /\bnothing\s+(works|helps)\b/i]
        },
        Positive: {
          keywords: ['better', 'improving', 'great', 'good', 'thank you', 'thanks', 'grateful', 'recovering', 'healthy'],
          patterns: [/\bfeeling\s+(much\s+)?better\b/i, /\bthank\s+you\b/i]
        },
        Calm: {
          keywords: ['curious', 'wondering', 'interested', 'reading about', 'routine', 'learn', 'information'],
          patterns: [/\b(just\s+curious|wondering\s+about|wanted\s+to\s+know)\b/i]
        }
      };
    }

    analyze(text) {
      if (!text || !text.trim()) return { tone: 'Neutral', rationale: 'Objective informational statement.' };

      const lower = text.toLowerCase();
      const scores = { Concerned: 0, Frustrated: 0, Positive: 0, Calm: 0 };

      for (const [tone, rule] of Object.entries(this.lexicon)) {
        for (const kw of rule.keywords) {
          if (lower.includes(kw)) scores[tone] += 1.5;
        }
        for (const pat of rule.patterns) {
          if (pat.test(lower)) scores[tone] += 2.5;
        }
      }

      let topTone = 'Neutral';
      let topScore = 0;
      for (const [tone, score] of Object.entries(scores)) {
        if (score > topScore) {
          topScore = score;
          topTone = tone;
        }
      }

      if (topScore >= 1.5) {
        const rationales = {
          Concerned: 'Phrasing reflects worry, heightened apprehension, or health-related anxiety.',
          Frustrated: 'Phrasing reflects exhaustion, impatience, or dissatisfaction with persistent discomfort.',
          Positive: 'Phrasing reflects optimism, recovery progress, gratitude, or proactive attitude.',
          Calm: 'Phrasing reflects an inquisitive, structured, and measured inquiry.'
        };
        return { tone: topTone, rationale: rationales[topTone] };
      }

      return { tone: 'Neutral', rationale: 'Even-keeled, factual health inquiry with no strong emotional markers.' };
    }
  }

  // 5. Response Engine
  class ResponseEngine {
    constructor() {
      this.templates = {
        emergency_concern: {
          title: 'Emergency Medical Guidance',
          body: 'The symptoms or terms you mentioned indicate a potentially serious medical situation. MedQuery cannot diagnose conditions or assess acute medical crises. If you or someone nearby is experiencing acute chest discomfort, severe shortness of breath, sudden numbness, slurred speech, heavy bleeding, or thoughts of self-harm, please contact local emergency services (such as 911, 112, or 999) or visit the nearest emergency department immediately.',
          nextSteps: [
            'Call your local emergency number (e.g., 911 / 112) without delay.',
            'Do not attempt to drive yourself to the hospital if experiencing acute symptoms.',
            'If alone, notify a trusted family member, neighbor, or emergency contact immediately.'
          ]
        },
        symptom_information: {
          title: 'Educational Symptom Overview',
          body: 'Symptoms such as those you described can arise from various common causes, ranging from benign, temporary physiological factors (such as dehydration, mild viral infections, tension, or fatigue) to conditions requiring clinical investigation. Because physical symptoms can overlap across multiple health conditions, an accurate assessment requires a physical exam and medical evaluation by a licensed clinician.',
          nextSteps: [
            'Maintain adequate hydration, rest, and observe how your symptoms evolve.',
            'Track the onset, frequency, duration, and severity of your symptoms in a symptom diary.',
            'Seek medical evaluation if your symptoms persist for more than a few days, worsen progressively, or are accompanied by a high fever or severe pain.'
          ]
        },
        medication_information: {
          title: 'General Medication & Pharmacology Principles',
          body: 'Medication safety is essential for effective treatment and avoiding adverse interactions. Dosages, contraindications, and potential side effects depend heavily on individual factors such as age, weight, kidney and liver function, and concurrent medications. Never alter, discontinue, or start any prescription or over-the-counter medication without consulting your physician or licensed pharmacist.',
          nextSteps: [
            'Carefully read the official patient information leaflet included with your medication packaging.',
            'Consult your pharmacist or prescribing doctor for exact dosage schedules and food-drug interaction advice.',
            'Immediately report any unusual side effects, allergic rashes, or adverse reactions to your doctor.'
          ]
        },
        sleep: {
          title: 'Sleep Hygiene & Circadian Health',
          body: 'Quality sleep is fundamental to immune function, cognitive performance, and cardiovascular health. Difficulty falling or staying asleep (insomnia) is frequently linked to environmental cues, screen exposure, caffeine intake, or elevated stress levels. Practicing consistent sleep hygiene is the evidence-based first-line approach for improving sleep architecture.',
          nextSteps: [
            'Maintain a consistent sleep and wake schedule every day, including on weekends.',
            'Eliminate blue-light screens (smartphones, tablets, laptops) at least 60 minutes before bed.',
            'Keep your bedroom cool (around 65°F / 18°C), dark, and quiet.',
            'If sleep difficulties persist for more than 3 to 4 weeks or involve heavy snoring, consult a healthcare provider.'
          ]
        },
        nutrition: {
          title: 'Evidence-Based Nutritional Guidelines',
          body: 'Balanced nutrition emphasizes wholesome, minimally processed foods that supply essential macronutrients (proteins, complex carbohydrates, healthy unsaturated fats) and vital micronutrients (vitamins and minerals). Adequate daily hydration and dietary fiber are cornerstone habits supporting metabolic and digestive health.',
          nextSteps: [
            'Aim for a varied plate featuring leafy greens, colorful vegetables, lean proteins, and whole grains.',
            'Drink adequate water throughout the day (generally 2 to 3 liters, adjusted for activity level and climate).',
            'Limit ultra-processed foods, high-sodium snacks, and refined sugars.',
            'Consider consulting a Registered Dietitian (RD) for personalized nutritional planning tailored to your metabolic profile.'
          ]
        },
        exercise: {
          title: 'Physical Activity & Fitness Fundamentals',
          body: 'Regular physical activity promotes cardiovascular endurance, musculoskeletal strength, metabolic regulation, and mental clarity. Health guidelines generally recommend at least 150 minutes of moderate-intensity aerobic exercise (such as brisk walking or cycling) along with two days of muscle-strengthening exercises per week.',
          nextSteps: [
            'Begin gradually if you are new to working out, starting with 10–15 minute brisk walks.',
            'Incorporate light dynamic stretching before activity and gentle static stretching afterward.',
            'Listen to your body and avoid pushing through acute sharp joint or muscle pain.',
            'Speak with your physician before beginning a strenuous fitness program, especially if you have pre-existing conditions.'
          ]
        },
        mental_wellness: {
          title: 'Mental Wellness & Stress Regulation',
          body: 'Mental health is deeply interconnected with physical vitality. Periodic feelings of stress, anxiety, or sadness are common human responses to life challenges. Mind-body techniques such as diaphragmatic breathing, mindfulness meditation, and structured daily pauses can help down-regulate the sympathetic nervous system.',
          nextSteps: [
            'Try structured 4-7-8 rhythmic breathing or a 5-minute guided meditation when experiencing acute tension.',
            'Prioritize social connection and share your feelings with trusted friends, family, or counselors.',
            'Establish boundaries around work, news consumption, and digital devices.',
            'If emotional distress feels overwhelming, persistent, or interferes with daily life, reach out to a licensed mental health professional.'
          ]
        },
        preventive_care: {
          title: 'Preventive Care & Health Maintenance',
          body: 'Preventive healthcare focuses on early detection, routine screenings, and lifestyle modifications to maintain optimal health and prevent chronic disease before symptoms emerge. Routine checkups and timely immunizations remain among the most effective public health interventions.',
          nextSteps: [
            'Schedule periodic comprehensive health checkups and blood pressure screenings with your primary care clinician.',
            'Stay current on age-appropriate vaccinations and routine diagnostic screenings.',
            'Practice regular hand hygiene and sun protection with broad-spectrum SPF sunscreen.',
            'Discuss your personal and family medical history with your doctor to determine tailored screening intervals.'
          ]
        },
        general_health: {
          title: 'General Health & Wellness Guidance',
          body: 'Maintaining overall health involves foundational pillars: balanced daily nutrition, restorative sleep, consistent movement, hydration, and proactive stress management. Small, sustainable habits implemented consistently produce profound long-term positive outcomes for your vitality.',
          nextSteps: [
            'Establish predictable daily routines for sleep, meals, and physical activity.',
            'Stay mindful of early fatigue cues and prioritize recuperation.',
            'Keep a personal health record of immunizations, baseline vital signs, and family health history.',
            'Partner with a primary care clinician for routine annual health assessments.'
          ]
        },
        unknown: {
          title: 'General Health Assistance',
          body: 'Thank you for reaching out to MedQuery. I specialize in health, symptom, lifestyle, medication, nutrition, sleep, and wellness educational topics. I was not able to identify a specific medical or wellness subject in your question. Please feel free to ask about specific symptoms, health habits, or educational wellness concepts.',
          nextSteps: [
            'Describe any physical symptoms you are curious about (e.g., headache, sleep quality, joint stiffness).',
            'Ask questions regarding general lifestyle areas like nutrition, exercise, or stress management.',
            'Remember that MedQuery provides educational information and does not offer clinical diagnosis.'
          ]
        }
      };
    }

    generate(intent, urgency, tone, extractedKeywords) {
      const template = this.templates[intent] || this.templates.unknown;

      let tonePrefix = '';
      if (tone === 'Concerned') {
        tonePrefix = 'I understand you may be feeling concerned or uncomfortable. ';
      } else if (tone === 'Frustrated') {
        tonePrefix = 'Managing ongoing physical discomfort or uncertainty can be very frustrating. ';
      } else if (tone === 'Positive') {
        tonePrefix = "It's encouraging to hear positive momentum in your health journey. ";
      } else if (tone === 'Calm') {
        tonePrefix = 'Thank you for your structured question. ';
      }

      let kwNote = '';
      if (extractedKeywords && extractedKeywords.length > 0) {
        kwNote = `\n\nIdentified health terms: ${extractedKeywords.slice(0, 4).map(k => `'${k}'`).join(', ')}.`;
      }

      let urgencyCallout = '';
      if (urgency === 'Urgent') {
        urgencyCallout = '⚠️ URGENT HEALTH NOTICE: The indicators in your message suggest a potentially urgent medical condition. Do not wait. Seek immediate medical attention or call emergency services right away.';
      } else if (urgency === 'Needs Attention') {
        urgencyCallout = '📌 CLINICAL ATTENTION ADVISORY: These symptoms warrant assessment by a qualified doctor or healthcare provider to evaluate their underlying cause and prevent complications.';
      }

      return {
        title: template.title,
        reply: `${tonePrefix}${template.body}${kwNote}`,
        nextSteps: template.nextSteps,
        urgencyCallout,
        disclaimer: DISCLAIMER_TEXT
      };
    }
  }

  // 6. Centralized State Manager
  class StateManager {
    constructor() {
      this.reset();
    }

    reset() {
      this.sessionStarted = new Date().toISOString();
      this.messages = [];
      this.intentCounts = {};
      this.urgencyCounts = { 'Routine': 0, 'Needs Attention': 0, 'Urgent': 0 };
      this.toneCounts = { 'Calm': 0, 'Concerned': 0, 'Frustrated': 0, 'Positive': 0, 'Neutral': 0 };
      this.keywordCounts = {};
      this.nextId = 1;
    }

    addInteraction(userText, analysis, response) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Update counters
      const intent = analysis.intent || 'unknown';
      this.intentCounts[intent] = (this.intentCounts[intent] || 0) + 1;

      const urgency = analysis.urgency || 'Routine';
      this.urgencyCounts[urgency] = (this.urgencyCounts[urgency] || 0) + 1;

      const tone = analysis.tone || 'Neutral';
      this.toneCounts[tone] = (this.toneCounts[tone] || 0) + 1;

      const keywords = analysis.extractedKeywords || [];
      for (const kw of keywords) {
        this.keywordCounts[kw] = (this.keywordCounts[kw] || 0) + 1;
      }

      const userMsg = {
        id: `msg_${this.nextId++}`,
        sender: 'user',
        text: userText,
        timestamp: timeStr,
        analysis: {
          intent,
          confidence: analysis.confidence,
          urgency,
          urgencyRationale: analysis.urgencyRationale,
          tone,
          toneRationale: analysis.toneRationale,
          keywords,
          termDetails: analysis.termDetails,
          tokens: analysis.tokens,
          filteredTokens: analysis.filteredTokens
        }
      };
      this.messages.push(userMsg);

      const assistantMsg = {
        id: `msg_${this.nextId++}`,
        sender: 'assistant',
        title: response.title,
        text: response.reply,
        next_steps: response.nextSteps,
        urgency_callout: response.urgencyCallout,
        disclaimer: response.disclaimer,
        timestamp: timeStr,
        analysis_ref: userMsg.id,
        analysis: userMsg.analysis
      };
      this.messages.push(assistantMsg);

      return { userMsg, assistantMsg };
    }

    getConversation() {
      return this.messages;
    }

    getDashboard() {
      const totalMessages = this.messages.length;
      const userMessages = this.messages.filter(m => m.sender === 'user').length;
      const assistantMessages = this.messages.filter(m => m.sender === 'assistant').length;

      let mostCommonIntent = 'None yet';
      let maxIntentCount = 0;
      for (const [intent, count] of Object.entries(this.intentCounts)) {
        if (count > maxIntentCount) {
          maxIntentCount = count;
          mostCommonIntent = intent;
        }
      }

      const userMsgs = this.messages.filter(m => m.sender === 'user');
      let currentUrgency = 'Routine';
      let currentTone = 'Neutral';
      let latestIntent = 'None yet';
      let latestConfidence = 0.0;
      let latestKeywords = [];

      if (userMsgs.length > 0) {
        const last = userMsgs[userMsgs.length - 1].analysis;
        currentUrgency = last.urgency;
        currentTone = last.tone;
        latestIntent = last.intent;
        latestConfidence = last.confidence;
        latestKeywords = last.keywords;
      }

      const totalIntentQueries = Object.values(this.intentCounts).reduce((a, b) => a + b, 0);
      const intentDistribution = {};
      if (totalIntentQueries > 0) {
        for (const [intent, count] of Object.entries(this.intentCounts)) {
          intentDistribution[intent] = {
            count,
            percentage: Math.round((count / totalIntentQueries) * 1000) / 10
          };
        }
      }

      const totalUrgencies = Object.values(this.urgencyCounts).reduce((a, b) => a + b, 0);
      const urgencyDistribution = {};
      for (const [urg, count] of Object.entries(this.urgencyCounts)) {
        urgencyDistribution[urg] = {
          count,
          percentage: totalUrgencies > 0 ? Math.round((count / totalUrgencies) * 1000) / 10 : 0
        };
      }

      const totalTones = Object.values(this.toneCounts).reduce((a, b) => a + b, 0);
      const toneDistribution = {};
      for (const [tone, count] of Object.entries(this.toneCounts)) {
        toneDistribution[tone] = {
          count,
          percentage: totalTones > 0 ? Math.round((count / totalTones) * 1000) / 10 : 0
        };
      }

      const sortedKws = Object.entries(this.keywordCounts).sort((a, b) => b[1] - a[1]);
      const topKeywords = sortedKws.slice(0, 12).map(([term, count]) => ({ term, count }));
      const totalKeywordMentions = Object.values(this.keywordCounts).reduce((a, b) => a + b, 0);

      return {
        session_started: this.sessionStarted,
        total_messages: totalMessages,
        user_messages: userMessages,
        assistant_messages: assistantMessages,
        most_common_intent: mostCommonIntent,
        current_urgency: currentUrgency,
        current_tone: currentTone,
        latest_intent: latestIntent,
        latest_confidence: latestConfidence,
        latest_keywords: latestKeywords,
        total_unique_keywords: Object.keys(this.keywordCounts).length,
        total_keyword_mentions: totalKeywordMentions,
        intent_distribution: intentDistribution,
        urgency_counts: this.urgencyCounts,
        urgency_distribution: urgencyDistribution,
        tone_distribution: toneDistribution,
        top_keywords: topKeywords
      };
    }
  }

  // 7. Master Pipeline Coordinator
  class HealthNLPPipeline {
    constructor() {
      this.processor = new TextProcessor();
      this.intentEngine = new IntentEngine();
      this.urgencyEngine = new UrgencyEngine();
      this.toneAnalyzer = new ToneAnalyzer();
      this.responseEngine = new ResponseEngine();
      this.stateManager = new StateManager();
      // Seed initial state with realistic multi-turn clinical interactions
      this.restoreDemo();
    }

    analyze(text) {
      const proc = this.processor.process(text);
      const { intent, confidence } = this.intentEngine.classify(proc.normalizedText, proc.extractedKeywords);
      const { urgency, rationale: urgencyRationale } = this.urgencyEngine.classify(proc.normalizedText, intent, proc.extractedKeywords);
      const { tone, rationale: toneRationale } = this.toneAnalyzer.analyze(text);
      const response = this.responseEngine.generate(intent, urgency, tone, proc.extractedKeywords);

      return {
        ...proc,
        intent,
        confidence,
        urgency,
        urgencyRationale,
        tone,
        toneRationale,
        response
      };
    }

    processAndRecord(text) {
      const analysis = this.analyze(text);
      const interaction = this.stateManager.addInteraction(text, analysis, analysis.response);

      return {
        reply: analysis.response.reply,
        title: analysis.response.title,
        intent: analysis.intent,
        confidence: analysis.confidence,
        urgency: analysis.urgency,
        urgencyRationale: analysis.urgencyRationale,
        tone: analysis.tone,
        toneRationale: analysis.toneRationale,
        keywords: analysis.extractedKeywords,
        termDetails: analysis.termDetails,
        next_steps: analysis.response.nextSteps,
        urgency_callout: analysis.response.urgencyCallout,
        disclaimer: analysis.response.disclaimer,
        timestamp: interaction.assistantMsg.timestamp,
        user_message_id: interaction.userMsg.id,
        assistant_message_id: interaction.assistantMsg.id
      };
    }

    restoreDemo() {
      this.stateManager.reset();
      const demoQueries = [
        'I have had a throbbing headache and felt exhausted for the past two days.',
        'How can I improve my sleep hygiene to get more deep sleep?',
        'What are healthy high-protein options to support balanced daily nutrition?',
        'I feel sudden severe crushing chest pain and shortness of breath!'
      ];
      for (const q of demoQueries) {
        this.processAndRecord(q);
      }
      return {
        conversation: this.stateManager.getConversation(),
        dashboard: this.stateManager.getDashboard()
      };
    }
  }

  return {
    HealthNLPPipeline,
    TextProcessor,
    IntentEngine,
    UrgencyEngine,
    ToneAnalyzer,
    ResponseEngine,
    StateManager
  };
});
