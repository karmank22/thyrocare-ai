import uuid
from typing import Dict, Any, List

ICMR = {
    "TSH_LOW": 0.5, "TSH_HIGH": 4.5, "TSH_CRITICAL": 10.0,
    "T3_LOW": 2.0, "T3_HIGH": 4.4,
    "T4_LOW": 0.8, "T4_HIGH": 1.8,
}

SHAP_WEIGHTS = {
    "tsh": 0.285, "t3": 0.198, "t4": 0.165,
    "menstrual_irregularity": 0.075, "symptom_severity_score": 0.062,
    "bmi": 0.048, "pcos_history": 0.038, "family_history_thyroid": 0.035,
    "age": 0.028, "hair_fall": 0.018, "fatigue": 0.016,
    "weight_gain": 0.015, "cold_intolerance": 0.012, "mood_changes": 0.008,
    "constipation": 0.006, "dry_skin": 0.006, "pregnancy_status": 0.004,
    "postpartum_flag": 0.004, "diet_pref": 0.003, "iodine_zone": 0.003,
}

def score_tsh(tsh: float) -> float:
    if tsh <= 0: return 0.0
    if tsh < ICMR["TSH_LOW"]: return 0.4
    if tsh <= ICMR["TSH_HIGH"]: return 0.0
    if tsh <= 6.0: return 0.3
    if tsh <= 8.0: return 0.55
    if tsh <= ICMR["TSH_CRITICAL"]: return 0.75
    return 1.0

def score_t3(t3: float) -> float:
    if t3 <= 0: return 0.0
    if t3 < ICMR["T3_LOW"]: return 0.5
    if t3 <= ICMR["T3_HIGH"]: return 0.0
    return 0.3

def score_t4(t4: float) -> float:
    if t4 <= 0: return 0.0
    if t4 < ICMR["T4_LOW"]: return 0.5
    if t4 <= ICMR["T4_HIGH"]: return 0.0
    return 0.3

def score_bmi(bmi: float) -> float:
    if bmi < 18.5: return 0.1
    if bmi < 25: return 0.0
    if bmi < 30: return 0.2
    return 0.4

def score_age(age: float) -> float:
    if age < 20: return 0.1
    if age < 35: return 0.05
    if age < 50: return 0.15
    return 0.25

class AIService:
    @staticmethod
    def compute_risk(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Computes the ensemble risk score based on PRD SHAP weights.
        """
        tsh = float(data.get("tsh") or 2.5)
        t3 = float(data.get("t3") or 3.2)
        t4 = float(data.get("t4") or 1.3)
        bmi = float(data.get("bmi") or 22.0)
        age = float(data.get("age") or 30.0)
        severity = float(data.get("severity_score") or 0.0)

        feature_scores = {
            "tsh": score_tsh(tsh),
            "t3": score_t3(t3),
            "t4": score_t4(t4),
            "menstrual_irregularity": 0.8 if data.get("menstrual_irregularity") else 0.0,
            "symptom_severity_score": severity / 10.0,
            "bmi": score_bmi(bmi),
            "pcos_history": 0.7 if data.get("pcos_history") else 0.0,
            "family_history_thyroid": 0.6 if data.get("family_history_thyroid") else 0.0,
            "age": score_age(age),
            "hair_fall": 0.5 if data.get("hair_fall") else 0.0,
            "fatigue": 0.5 if data.get("fatigue") else 0.0,
            "weight_gain": 0.45 if data.get("weight_gain") else 0.0,
            "cold_intolerance": 0.4 if data.get("cold_intolerance") else 0.0,
            "mood_changes": 0.35 if data.get("mood_changes") else 0.0,
            "constipation": 0.3 if data.get("constipation") else 0.0,
            "dry_skin": 0.25 if data.get("dry_skin") else 0.0,
            "pregnancy_status": 0.3 if data.get("pregnancy_status") else 0.0,
            "postpartum_flag": 0.35 if data.get("postpartum_flag") else 0.0,
            "diet_pref": 0.2 if data.get("diet_pref") == "vegetarian" and data.get("iodine_zone") == "inland" else 0.0,
            "iodine_zone": 0.15 if data.get("iodine_zone") == "inland" else 0.0,
        }

        rf_score = 0.0
        shap_values = {}
        for feature, weight in SHAP_WEIGHTS.items():
            contribution = feature_scores.get(feature, 0.0) * weight
            rf_score += contribution
            shap_values[feature] = contribution
        
        # In a real model, XGB might differ slightly.
        xgb_score = rf_score * 0.95 

        max_possible = sum(SHAP_WEIGHTS.values())
        rf_conf = min(rf_score / max_possible, 1.0)
        xgb_conf = min(xgb_score / max_possible, 1.0)
        ensemble_conf = (rf_conf * 0.55) + (xgb_conf * 0.45)

        if ensemble_conf < 0.20:
            risk_class = "Normal"
        elif ensemble_conf < 0.42:
            risk_class = "Mild"
        elif ensemble_conf < 0.65:
            risk_class = "Moderate"
        else:
            risk_class = "High"

        # Emergency Overrides
        if tsh > ICMR["TSH_CRITICAL"] or severity > 7:
            risk_class = "High"
            
        emergency_flag = tsh > ICMR["TSH_CRITICAL"] or severity > 7

        # Sort SHAP values descending
        sorted_features = sorted(shap_values.items(), key=lambda x: x[1], reverse=True)
        top_features = [{"feature": f[0], "value": f[1]} for f in sorted_features[:3]]

        return {
            "model_version": "Ensemble-v1.0",
            "risk_class": risk_class,
            "risk_score": ensemble_conf,
            "emergency_flag": emergency_flag,
            "top_features": top_features
        }

    @staticmethod
    def generate_recommendations(risk_class: str, emergency_flag: bool, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates personalized recommendations.
        """
        is_inland = data.get("iodine_zone") == "inland"
        is_veg = data.get("diet_pref") == "vegetarian"
        has_pcos = data.get("pcos_history")
        is_pregnant = data.get("pregnancy_status")

        diet_recs = []
        if risk_class == "Normal":
            diet_recs.append("Use iodized salt in all cooking." if is_inland else "Include seafood 2-3 times weekly.")
            diet_recs.append("Eat selenium-rich foods: Brazil nuts, sunflower seeds.")
        elif risk_class == "Mild":
            diet_recs.append("Switch to double-fortified iodized salt." if is_inland else "Increase coastal seafood intake.")
            diet_recs.append("Add moringa leaves to diet for iodine and antioxidants.")
        elif risk_class == "Moderate":
            diet_recs.append("Consult a nutritionist for a thyroid-specific meal plan.")
            diet_recs.append("Critical: Use only iodized salt." if is_inland else "Maximize iodine from seafood daily.")
        elif risk_class == "High":
            diet_recs.append("⚠️ URGENT: Do not self-medicate. Dietary changes alone will not correct high-risk TSH levels.")
            diet_recs.append("High-selenium foods daily: 2-3 Brazil nuts.")

        referral_tier = "none"
        referral_trigger = None
        if emergency_flag:
            referral_tier = "emergency"
            referral_trigger = "TSH > 10 mIU/L or severe symptoms"
        elif risk_class == "High":
            referral_tier = "pmjay"
        elif risk_class == "Moderate":
            referral_tier = "telemedicine"

        return {
            "diet": diet_recs,
            "lifestyle": ["Prioritize 7-9 hours of sleep", "Manage stress through mindfulness"],
            "referral_tier": referral_tier,
            "referral_trigger": referral_trigger,
            "emergency_flag": emergency_flag
        }
