import os
import json
import requests
from typing import Dict, Any, List
from app.config import settings

SYSTEM_PROMPT = """You are RecoverLens Recovery Coach, an empathetic, AI-powered recovery assistant.
CRITICAL SAFETY BOUNDARIES:
1. You provide RECOVERY MONITORING AND DECISION SUPPORT ONLY.
2. You NEVER diagnose conditions, NEVER prescribe medications or treatments, and NEVER guarantee specific recovery dates.
3. You NEVER replace a healthcare professional's judgment. Always remind patients to consult their doctor or care team for clinical advice.
4. Base your responses EXCLUSIVELY on the patient's provided recovery data, metrics, and care team instructions.
5. Answer concisely, empathetically, and in the patient's requested language ({language}).
"""

DISCLAIMER_TEXT = {
    "en": "Decision Support Only: RecoverLens does not diagnose or prescribe. Always consult your care team for clinical concerns.",
    "ta": "முடிவு ஆதரவு மட்டுமே: RecoverLens நோய் கண்டறிதல் அல்லது சிகிச்சையை பரிந்துரைக்காது. மருத்துவ ஆலோசனைகளுக்கு உங்கள் மருத்துவக் குழுவை அணுகவும்.",
    "hi": "केवल निर्णय सहायता: RecoverLens निदान या उपचार निर्धारित नहीं करता है। चिकित्सीय सलाह के लिए हमेशा अपनी केयर टीम से परामर्श करें।"
}

def ask_recovery_coach(
    patient_data: Dict[str, Any],
    question: str,
    language: str = "en"
) -> Dict[str, Any]:
    """
    Answers a patient question using either the Gemini API (if GEMINI_API_KEY is available)
    or an intelligent data-grounded clinical assistant fallback.
    """
    disclaimer = DISCLAIMER_TEXT.get(language, DISCLAIMER_TEXT["en"])
    data_sources = [
        f"Condition: {patient_data.get('condition_name', 'Recovery')}",
        f"Current Day: Day {patient_data.get('current_day', 1)} of {patient_data.get('expected_duration_days', 56)}",
        f"Status: {patient_data.get('status', 'on_track')}",
        f"Latest Composite Score: {patient_data.get('latest_score', 75)}/100",
        f"Recent Care Team Note: {patient_data.get('latest_care_team_note', 'Follow standard rehab protocol.')}"
    ]

    # Try Gemini API if key is present
    if settings.GEMINI_API_KEY:
        try:
            prompt_content = f"""
{SYSTEM_PROMPT.format(language=language)}

PATIENT DATA SUMMARY:
{json.dumps(patient_data, indent=2)}

PATIENT QUESTION:
"{question}"

Please provide a helpful, reassuring, and data-grounded response in {language}.
"""
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            payload = {
                "contents": [{"parts": [{"text": prompt_content}]}],
                "generationConfig": {"temperature": 0.2, "maxOutputTokens": 400}
            }
            resp = requests.post(url, json=payload, timeout=10)
            if resp.status_code == 200:
                result = resp.json()
                answer_text = result["candidates"][0]["content"]["parts"][0]["text"].strip()
                return {
                    "answer": answer_text,
                    "safety_disclaimer": disclaimer,
                    "data_sources_used": data_sources
                }
        except Exception:
            pass  # Fallback to local clinical generator below

    # Intelligent data-grounded clinical responder
    q_lower = question.lower()
    condition = patient_data.get("condition_name", "your recovery")
    day = patient_data.get("current_day", 1)
    status = patient_data.get("status", "on_track")
    score = patient_data.get("latest_score", 70)
    care_note = patient_data.get("latest_care_team_note", "Continue your daily movement exercises.")
    projected = patient_data.get("projected_range", "a few weeks")

    if language == "ta":
        if "pain" in q_lower or "வலி" in question:
            answer = f"உங்கள் நாள் {day} தரவின்படி, உங்கள் தற்போதைய மீட்பு நிலை: {status} (மதிப்பெண்: {score}/100). மிதமான வலி இயல்பான திசு குணப்படுத்துதலின் ஒரு பகுதியாகும். உங்கள் பராமரிப்பு குழு குறிப்பு: '{care_note}'. வலி அதிகமானால் உடனடியாக உங்கள் மருத்துவரை தொடர்பு கொள்ளவும்."
        elif "time" in q_lower or "எப்போது" in question or "நாள்" in question:
            answer = f"உங்கள் தற்போதைய கணிப்பு தோராயமாக {projected} ஆகும். இது உங்கள் தினசரி பதிவு மற்றும் முன்னேற்றத்தை அடிப்படையாகக் கொண்டது, ஆனால் இது ஒரு நிலையான உத்தரவாதம் அல்ல."
        else:
            answer = f"வணக்கம். நீங்கள் தற்போது {condition} சிகிச்சையில் நாள் {day}-ல் உள்ளீர்கள். உங்கள் மீட்பு நிலை: {status}. உங்கள் பராமரிப்புக் குழு அறிவுறுத்தியுள்ளபடி: '{care_note}'. ஆரோக்கியமான ஓய்வு மற்றும் சீரான நீர்ச்சத்தை பராமரிக்கவும்."
    elif language == "hi":
        if "pain" in q_lower or "दर्द" in question:
            answer = f"आपके दिन {day} के आंकड़ों के अनुसार, आपकी रिकवरी स्थिति '{status}' है (स्कोर: {score}/100)। हल्का दर्द ऊतकों के ठीक होने की सामान्य प्रक्रिया है। आपकी केयर टीम का संदेश: '{care_note}'। यदि दर्द बढ़े, तो तुरंत डॉक्टर से संपर्क करें।"
        elif "time" in q_lower or "कब" in question or "दिन" in question:
            answer = f"आपके वर्तमान रुझान के आधार पर अनुमानित समय लगभग {projected} है। यह आपकी दैनिक प्रगति पर निर्भर है और कोई निश्चित गारंटी नहीं है।"
        else:
            answer = f"नमस्ते। आप {condition} की रिकवरी के दिन {day} पर हैं। आपकी वर्तमान रिकवरी स्थिति '{status}' है। आपकी केयर टीम का नवीनतम निर्देश: '{care_note}'। कृपया अपनी निर्धारित देखभाल दिनचर्या का पालन करें।"
    else:
        if "pain" in q_lower or "hurt" in q_lower or "ache" in q_lower:
            answer = f"Looking at your Day {day} check-in, your recovery status is '{status}' with a composite score of {score}/100. Mild tissue discomfort is typical at this stage of {condition}. Your care team's recent instruction advises: '{care_note}'. If you experience sharp, escalating pain or redness, please notify your care team immediately."
        elif "normal" in q_lower or "track" in q_lower or "how am i doing" in q_lower:
            answer = f"You are currently on Day {day} for {condition}. Your status is evaluated as '{status.replace('_', ' ').title()}' based on your recent check-ins. Your recovery trajectory is tracking closely to clinical expectations."
        elif "long" in q_lower or "when" in q_lower or "finish" in q_lower or "heal" in q_lower:
            answer = f"Your statistical timeline prediction currently points to approximately {projected}, with a confidence rating based on your check-in adherence. Note that biological healing varies, and this range updates dynamically as you log more data."
        else:
            answer = f"Based on your profile for {condition} (Day {day}), your recovery status is '{status.replace('_', ' ').title()}'. Your care team note says: '{care_note}'. Remember to log your daily check-in and reach out to your clinic for any acute symptoms."

    return {
        "answer": answer,
        "safety_disclaimer": disclaimer,
        "data_sources_used": data_sources
    }
