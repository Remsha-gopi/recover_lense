from typing import List, Dict, Any, Optional

QUESTION_BANK = {
    "pain": {
        "en": {
            "question": "How is your discomfort or pain level today on a scale of 0 to 10?",
            "tts": "How is your discomfort or pain level today on a scale of 0 to 10? Zero is no pain, ten is severe pain."
        },
        "ta": {
            "question": "இன்று உங்கள் வலி அல்லது அசௌகரியத்தின் அளவு என்ன (0 முதல் 10 வரை)?",
            "tts": "இன்று உங்கள் வலி அல்லது அசௌகரியத்தின் அளவு என்ன? பூஜ்ஜியம் என்றால் வலி இல்லை, பத்து என்றால் கடுமையான வலி."
        },
        "hi": {
            "question": "0 से 10 के पैमाने पर आज आपका दर्द या परेशानी का स्तर क्या है?",
            "tts": "0 से 10 के पैमाने पर आज आपका दर्द का स्तर क्या है? शून्य मतलब कोई दर्द नहीं, दस मतलब तीव्र दर्द।"
        },
        "unit": "scale (0-10)",
        "min_val": 0.0,
        "max_val": 10.0,
        "step": 1.0,
        "direction_better": "lower",
        "suggested_options": ["0 - No Pain", "3 - Mild", "6 - Moderate", "8 - Severe", "10 - Extreme"]
    },
    "mobility": {
        "en": {
            "question": "How would you rate your joint movement and walking comfort today (0 to 10)?",
            "tts": "How would you rate your joint movement and walking comfort today? Higher means easier movement."
        },
        "ta": {
            "question": "இன்று உங்கள் உடல் அசைவு மற்றும் நடக்கும் வசதியை எவ்வாறு மதிப்பிடுவீர்கள் (0 முதல் 10)?",
            "tts": "இன்று உங்கள் உடல் அசைவு மற்றும் நடக்கும் வசதியை எவ்வாறு மதிப்பிடுவீர்கள்? அதிக எண் சிறந்த அசைவைக் குறிக்கும்."
        },
        "hi": {
            "question": "आज आपकी जोड़ों की गतिशीलता और चलने में सहजता कैसी है (0 से 10)?",
            "tts": "आज आपकी जोड़ों की गतिशीलता और चलने में सहजता कैसी है? अधिक संख्या बेहतर गतिशीलता दर्शाती है।"
        },
        "unit": "scale (0-10)",
        "min_val": 0.0,
        "max_val": 10.0,
        "step": 1.0,
        "direction_better": "higher",
        "suggested_options": ["2 - Very Stiff", "5 - Moderate Range", "8 - Good Movement", "10 - Full Mobility"]
    },
    "fatigue": {
        "en": {
            "question": "How intense is your tiredness or exhaustion today (0 to 10)?",
            "tts": "How intense is your tiredness or exhaustion today? Zero is completely energized, ten is completely exhausted."
        },
        "ta": {
            "question": "இன்று உங்கள் சோர்வு அல்லது களைப்பின் அளவு என்ன (0 முதல் 10 வரை)?",
            "tts": "இன்று உங்கள் சோர்வு அல்லது களைப்பின் அளவு என்ன? பூஜ்ஜியம் என்றால் சுறுசுறுப்பு, பத்து என்றால் கடுமையான சோர்வு."
        },
        "hi": {
            "question": "आज आपकी थकान या कमजोरी का स्तर क्या है (0 से 10)?",
            "tts": "आज आपकी थकान या कमजोरी का स्तर क्या है? शून्य मतलब पूरी ऊर्जा, दस मतलब अत्यधिक थकान।"
        },
        "unit": "scale (0-10)",
        "min_val": 0.0,
        "max_val": 10.0,
        "step": 1.0,
        "direction_better": "lower",
        "suggested_options": ["1 - Energetic", "4 - Mild Fatigue", "7 - Heavy Fatigue", "10 - Bedridden"]
    },
    "activity": {
        "en": {
            "question": "How much light physical activity or upright time were you able to maintain (0 to 10)?",
            "tts": "How much light physical activity or upright time were you able to maintain today?"
        },
        "ta": {
            "question": "இன்று உங்களால் எவ்வளவு நேரம் சுறுசுறுப்பாக இயங்க முடிந்தது (0 முதல் 10 வரை)?",
            "tts": "இன்று உங்களால் எவ்வளவு நேரம் சுறுசுறுப்பாக இயங்க முடிந்தது?"
        },
        "hi": {
            "question": "आज आप कितनी शारीरिक गतिविधि या सामान्य काम कर पाए (0 से 10)?",
            "tts": "आज आप कितनी शारीरिक गतिविधि या सामान्य काम कर पाए?"
        },
        "unit": "scale (0-10)",
        "min_val": 0.0,
        "max_val": 10.0,
        "step": 1.0,
        "direction_better": "higher",
        "suggested_options": ["2 - Mostly Resting", "5 - Light Walking", "8 - Normal Routine", "10 - High Activity"]
    },
    "sleep": {
        "en": {
            "question": "How restorative and uninterrupted was your sleep last night (0 to 10)?",
            "tts": "How restorative and uninterrupted was your sleep last night on a scale of 0 to 10?"
        },
        "ta": {
            "question": "நேற்றிரவு உங்கள் தூக்கம் எவ்வளவு அமைதியாகவும் புத்துணர்ச்சியாகவும் இருந்தது (0 முதல் 10)?",
            "tts": "நேற்றிரவு உங்கள் தூக்கம் எவ்வளவு அமைதியாகவும் புத்துணர்ச்சியாகவும் இருந்தது?"
        },
        "hi": {
            "question": "पिछली रात आपकी नींद कितनी गहरी और आरामदायक थी (0 से 10)?",
            "tts": "पिछली रात आपकी नींद कितनी गहरी और आरामदायक थी?"
        },
        "unit": "scale (0-10)",
        "min_val": 0.0,
        "max_val": 10.0,
        "step": 1.0,
        "direction_better": "higher",
        "suggested_options": ["2 - Very Restless", "5 - Average Sleep", "8 - Sound Sleep", "10 - Deeply Restorative"]
    },
    "adherence": {
        "en": {
            "question": "Did you complete your prescribed rehab exercises / medication today (0 to 10)?",
            "tts": "Did you complete your prescribed recovery exercises or regimen today?"
        },
        "ta": {
            "question": "இன்று உங்கள் பரிந்துரைக்கப்பட்ட உடற்பயிற்சிகளை சரியாகச் செய்தீர்களா (0 முதல் 10)?",
            "tts": "இன்று உங்கள் பரிந்துரைக்கப்பட்ட உடற்பயிற்சிகளை சரியாகச் செய்தீர்களா?"
        },
        "hi": {
            "question": "क्या आपने आज अपने निर्धारित व्यायाम या दवाएं पूरी कीं (0 से 10)?",
            "tts": "क्या आपने आज अपने निर्धारित व्यायाम या दवाएं पूरी कीं?"
        },
        "unit": "scale (0-10)",
        "min_val": 0.0,
        "max_val": 10.0,
        "step": 1.0,
        "direction_better": "higher",
        "suggested_options": ["0 - Skipped", "5 - Partial (50%)", "8 - Mostly Done", "10 - 100% Completed"]
    }
}

RECOVERY_PRIORITY_ORDER = {
    "post_surgery": ["pain", "mobility", "adherence", "sleep"],
    "illness": ["fatigue", "activity", "sleep", "adherence"],
    "injury": ["mobility", "pain", "adherence", "sleep"]
}

def get_next_question(
    recovery_type_code: str,
    answered_keys: List[str],
    language: str = "en"
) -> Dict[str, Any]:
    """
    Decides the next adaptive check-in question.
    Skips indicators already answered, strictly caps session at 4 questions.
    """
    priority_keys = RECOVERY_PRIORITY_ORDER.get(recovery_type_code, ["pain", "mobility", "sleep", "adherence"])
    total_questions = len(priority_keys)

    remaining_keys = [k for k in priority_keys if k not in answered_keys]

    if not remaining_keys:
        return {
            "is_done": True,
            "question_number": len(answered_keys),
            "total_questions": total_questions,
            "question": None
        }

    next_key = remaining_keys[0]
    q_data = QUESTION_BANK.get(next_key, QUESTION_BANK["pain"])
    lang_content = q_data.get(language, q_data["en"])

    question_obj = {
        "indicator_key": next_key,
        "question_text": lang_content["question"],
        "tts_text": lang_content["tts"],
        "unit": q_data["unit"],
        "min_val": q_data["min_val"],
        "max_val": q_data["max_val"],
        "step": q_data["step"],
        "direction_better": q_data["direction_better"],
        "suggested_options": q_data["suggested_options"]
    }

    return {
        "is_done": False,
        "question_number": len(answered_keys) + 1,
        "total_questions": total_questions,
        "question": question_obj
    }
