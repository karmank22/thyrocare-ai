/**
 * Simulated AI Risk Engine
 * Implements the RF + XGBoost ensemble logic using SHAP weights from the PRD.
 * 
 * Primary discriminators (from PRD Section 6, Layer 3):
 *   TSH: SHAP = 0.285
 *   T3:  SHAP = 0.198
 *   T4:  SHAP = 0.165
 *   Menstrual irregularity: SHAP = 0.075
 *   PCOS history: SHAP = 0.038
 *   ...etc.
 * 
 * ICMR Reference Ranges (from PRD Layer 2):
 *   TSH: 0.5–4.5 mIU/L
 *   Free T3: 2.0–4.4 pg/mL
 *   Free T4: 0.8–1.8 ng/dL
 */

import { type IntakeFormData, type RiskAssessment, type RiskClass, type SHAPValues } from '../types';

// ICMR reference ranges
const ICMR = {
  TSH_LOW: 0.5, TSH_HIGH: 4.5, TSH_CRITICAL: 10.0,
  T3_LOW: 2.0, T3_HIGH: 4.4,
  T4_LOW: 0.8, T4_HIGH: 1.8,
};

// SHAP feature weights (from PRD research paper)
const SHAP_WEIGHTS: Record<string, number> = {
  tsh: 0.285, t3: 0.198, t4: 0.165,
  menstrual_irregularity: 0.075, symptom_severity_score: 0.062,
  bmi: 0.048, pcos_history: 0.038, family_history_thyroid: 0.035,
  age: 0.028, hair_fall: 0.018, fatigue: 0.016,
  weight_gain: 0.015, cold_intolerance: 0.012, mood_changes: 0.008,
  constipation: 0.006, dry_skin: 0.006, pregnancy_status: 0.004,
  postpartum_flag: 0.004, diet_pref: 0.003, iodine_zone: 0.003,
};

function scoreTSH(tsh: number): number {
  if (tsh <= 0) return 0;
  if (tsh < ICMR.TSH_LOW) return 0.4; // Hyperthyroid risk
  if (tsh <= ICMR.TSH_HIGH) return 0.0; // Normal
  if (tsh <= 6.0) return 0.3; // Borderline
  if (tsh <= 8.0) return 0.55; // Elevated
  if (tsh <= ICMR.TSH_CRITICAL) return 0.75; // High
  return 1.0; // Critical
}

function scoreT3(t3: number): number {
  if (t3 <= 0) return 0;
  if (t3 < ICMR.T3_LOW) return 0.5;
  if (t3 <= ICMR.T3_HIGH) return 0.0;
  return 0.3;
}

function scoreT4(t4: number): number {
  if (t4 <= 0) return 0;
  if (t4 < ICMR.T4_LOW) return 0.5;
  if (t4 <= ICMR.T4_HIGH) return 0.0;
  return 0.3;
}

function scoreBMI(bmi: number): number {
  if (bmi < 18.5) return 0.1;
  if (bmi < 25) return 0.0;
  if (bmi < 30) return 0.2;
  return 0.4;
}

function scoreAge(age: number): number {
  if (age < 20) return 0.1;
  if (age < 35) return 0.05;
  if (age < 50) return 0.15;
  return 0.25;
}

/**
 * Computes the ensemble risk score and returns a full RiskAssessment
 */
export function computeRiskAssessment(formData: IntakeFormData): RiskAssessment {
  const tsh = parseFloat(formData.tsh) || 2.5;
  const t3 = parseFloat(formData.t3) || 3.2;
  const t4 = parseFloat(formData.t4) || 1.3;
  const bmi = parseFloat(formData.bmi) || 22;
  const age = parseFloat(formData.age) || 30;
  const severity = parseFloat(formData.severity_score) || 0;

  // Feature scores (0.0 = no risk contribution, 1.0 = max contribution)
  const featureScores: Record<string, number> = {
    tsh: scoreTSH(tsh),
    t3: scoreT3(t3),
    t4: scoreT4(t4),
    menstrual_irregularity: formData.menstrual_irregularity ? 0.8 : 0.0,
    symptom_severity_score: severity / 10.0,
    bmi: scoreBMI(bmi),
    pcos_history: formData.pcos_history ? 0.7 : 0.0,
    family_history_thyroid: formData.family_history_thyroid ? 0.6 : 0.0,
    age: scoreAge(age),
    hair_fall: formData.hair_fall ? 0.5 : 0.0,
    fatigue: formData.fatigue ? 0.5 : 0.0,
    weight_gain: formData.weight_gain ? 0.45 : 0.0,
    cold_intolerance: formData.cold_intolerance ? 0.4 : 0.0,
    mood_changes: formData.mood_changes ? 0.35 : 0.0,
    constipation: formData.constipation ? 0.3 : 0.0,
    dry_skin: formData.dry_skin ? 0.25 : 0.0,
    pregnancy_status: formData.pregnancy_status ? 0.3 : 0.0,
    postpartum_flag: formData.postpartum_flag ? 0.35 : 0.0,
    diet_pref: formData.diet_pref === 'vegetarian' && formData.iodine_zone === 'inland' ? 0.2 : 0.0,
    iodine_zone: formData.iodine_zone === 'inland' ? 0.15 : 0.0,
  };

  // Weighted risk score (sum of feature_score * shap_weight)
  let rfScore = 0;
  let xgbScore = 0;
  const shapValues: SHAPValues = {} as SHAPValues;

  for (const [feature, shapWeight] of Object.entries(SHAP_WEIGHTS)) {
    const featureScore = featureScores[feature] ?? 0;
    const contribution = featureScore * shapWeight;
    // Slight variation between RF and XGB for realism
    rfScore += contribution;
    xgbScore += contribution * (0.92 + Math.random() * 0.16);
    (shapValues as Record<string, number>)[feature] = contribution;
  }

  // Normalize to 0-1
  const maxPossibleScore = Object.values(SHAP_WEIGHTS).reduce((a, b) => a + b, 0);
  const rfConf = Math.min(rfScore / maxPossibleScore, 1.0);
  const xgbConf = Math.min(xgbScore / maxPossibleScore, 1.0);
  const ensembleConf = rfConf * 0.55 + xgbConf * 0.45; // RF weighted more per PRD

  // Map ensemble score to 4-class risk
  let riskClass: RiskClass;
  if (ensembleConf < 0.20) riskClass = 'Normal';
  else if (ensembleConf < 0.42) riskClass = 'Mild';
  else if (ensembleConf < 0.65) riskClass = 'Moderate';
  else riskClass = 'High';

  // Override: TSH > 10 always = High (per PRD emergency rules)
  if (tsh > ICMR.TSH_CRITICAL || severity > 7) riskClass = 'High';

  // Emergency flag
  const emergencyFlag = tsh > ICMR.TSH_CRITICAL || severity > 7;

  // Top SHAP features (sorted by contribution)
  const sortedFeatures = Object.entries(shapValues)
    .sort(([, a], [, b]) => b - a);

  return {
    assessment_id: crypto.randomUUID(),
    intake_id: crypto.randomUUID(),
    risk_class: riskClass,
    rf_confidence: parseFloat(rfConf.toFixed(3)),
    xgb_confidence: parseFloat(xgbConf.toFixed(3)),
    ensemble_confidence: parseFloat(ensembleConf.toFixed(3)),
    shap_values: shapValues,
    top_shap_feature_1: sortedFeatures[0]?.[0] ?? 'tsh',
    top_shap_value_1: parseFloat((sortedFeatures[0]?.[1] ?? 0).toFixed(4)),
    top_shap_feature_2: sortedFeatures[1]?.[0] ?? 't3',
    top_shap_value_2: parseFloat((sortedFeatures[1]?.[1] ?? 0).toFixed(4)),
    top_shap_feature_3: sortedFeatures[2]?.[0] ?? 't4',
    top_shap_value_3: parseFloat((sortedFeatures[2]?.[1] ?? 0).toFixed(4)),
    emergency_flag: emergencyFlag,
    assessed_at: new Date().toISOString(),
  };
}

/**
 * Generates personalized recommendations based on risk assessment + patient profile
 */
export function generateRecommendations(
  assessment: RiskAssessment,
  formData: IntakeFormData,
) {
  const { risk_class, emergency_flag } = assessment;
  const isInland = formData.iodine_zone === 'inland';
  const isVeg = formData.diet_pref === 'vegetarian';
  const hasPCOS = formData.pcos_history;

  const dietRecs: Record<RiskClass, string[]> = {
    Normal: [
      isInland
        ? 'Use iodized salt (sendha namak with iodine) in all cooking.'
        : 'Include seafood 2–3 times weekly for natural iodine.',
      'Eat selenium-rich foods: Brazil nuts, sunflower seeds, brown rice.',
      isVeg
        ? 'Include paneer, tofu, and lentils for adequate protein.'
        : 'Include eggs and lean meats for balanced thyroid nutrition.',
      'Limit raw goitrogens (cabbage, broccoli, cauliflower) when cooked — safe in moderation.',
      'Stay hydrated: 8–10 glasses of water daily.',
    ],
    Mild: [
      isInland
        ? 'Switch to double-fortified iodized salt immediately.'
        : 'Increase coastal seafood intake: mackerel, sardines twice a week.',
      hasPCOS
        ? 'Follow a low-GI diet: millets (ragi, jowar), oats, and legumes to manage insulin + thyroid.'
        : 'Include ragi (finger millet) — a traditional Indian grain rich in calcium and iron.',
      'Add moringa (drumstick) leaves to diet — rich in iodine and antioxidants.',
      isVeg
        ? 'Add 2 tablespoons of flaxseeds daily for omega-3 support.'
        : 'Eat fatty fish (rohu, katla) twice weekly for omega-3 and selenium.',
      'Avoid excess soy products — may interfere with thyroid hormone absorption.',
      'Limit refined sugar and ultra-processed foods.',
    ],
    Moderate: [
      'Consult a nutritionist to design a thyroid-specific meal plan.',
      isInland
        ? 'Critical: Use only iodized salt. Consider iodine-rich foods daily: seaweed, eggs, milk.'
        : 'Maximize iodine from seafood daily. Consider iodine supplementation under doctor guidance.',
      'AYUSH-recommended: Ashwagandha (Withania somnifera) may support thyroid function — consult doctor before use.',
      hasPCOS
        ? 'PCOS + hypothyroid diet: eliminate refined carbs, eat every 3–4 hours, prioritize fiber.'
        : 'Eat every 3–4 hours to maintain steady metabolism.',
      'Avoid fluoride excess: use non-fluoridated water if possible; fluoride competes with iodine.',
      'Increase zinc intake: pumpkin seeds, chickpeas, lentils.',
    ],
    High: [
      '⚠️ URGENT: Do not self-medicate. Dietary changes alone will not correct high-risk TSH levels.',
      'See an endocrinologist immediately. This plan is supportive only.',
      'After medical treatment begins: strict iodized salt only, no raw goitrogens.',
      'High-selenium foods daily: 2–3 Brazil nuts, sunflower seeds.',
      'Avoid alcohol and smoking — both worsen thyroid function.',
      'Small, frequent meals (5–6 per day) to support impaired metabolism.',
    ],
  };

  const exerciseRecs: Record<RiskClass, string[]> = {
    Normal: [
      'AYUSH Yoga: Sarvangasana (Shoulderstand) — 3 sets of 30 seconds — activates thyroid gland.',
      'Halasana (Plow Pose) — 2 sets of 20 seconds — stimulates neck and throat region.',
      'Surya Namaskar (Sun Salutation) — 12 cycles daily in the morning.',
      'Brisk walking 30 minutes, 5 days a week.',
      'Pranayama: Ujjayi breathing — 10 minutes daily to regulate metabolism.',
    ],
    Mild: [
      'AYUSH Yoga (daily, 30 minutes):',
      '• Sarvangasana — 1 min hold × 3 sets',
      '• Matsyasana (Fish Pose) — counterpose for neck stimulation',
      '• Viparita Karani (Legs-up-the-wall) — 5 minutes for circulation',
      'Walking 40 minutes daily; avoid intense cardio until TSH is normalized.',
      'Avoid intense weight training until thyroid levels stabilize.',
      'Kapalbhati Pranayama: 5–10 minutes daily.',
    ],
    Moderate: [
      'Medical clearance recommended before starting new exercise.',
      'Gentle Yoga only: Shavasana, Balasana (Child Pose), Sukhasana (Easy Pose).',
      'Short 15-minute walks — do not exert beyond mild breathlessness.',
      'Sarvangasana: start at 15 seconds with a wall for support.',
      'Bhramari Pranayama (Humming Bee): 5 minutes — known to calm thyroid in AYUSH tradition.',
      'Avoid high-impact exercise, heavy lifting until under specialist care.',
    ],
    High: [
      '⚠️ Rest is prescribed. Exercise is secondary to emergency medical treatment.',
      'Only gentle Shavasana and bed yoga if mobility is limited.',
      'After stabilization: begin Surya Namaskar at 25% intensity, 3 cycles.',
      'Daily Pranayama: Anulom Vilom (Alternate Nostril Breathing) — 5 minutes.',
    ],
  };

  const lifestyleRecs: Record<RiskClass, string[]> = {
    Normal: [
      'Sleep 7–9 hours nightly. Thyroid hormones regenerate during deep sleep.',
      'Reduce screen time before bed — blue light suppresses melatonin, which affects thyroid.',
      'Stress management: 10 minutes of mindfulness daily.',
      'Next TSH test in 12 months or if new symptoms develop.',
    ],
    Mild: [
      'Prioritize sleep 8–9 hours. Use a consistent bedtime even on weekends.',
      'Identify and manage stressors — cortisol (stress hormone) directly suppresses TSH.',
      'Avoid raw cruciferous vegetables (cabbage, kale, broccoli) at dinner — steam them instead.',
      'Track symptoms in a diary to share at your next doctor visit.',
      'Take thyroid medication (if prescribed) on an empty stomach, 30–60 min before eating.',
      'Repeat TSH test in 60 days.',
    ],
    Moderate: [
      'This is a medical condition requiring consistent treatment. Do not skip medications.',
      'Avoid iodine supplements without medical supervision — can worsen both hypo and hyperthyroid.',
      'Environmental: avoid exposure to pesticides (associated with thyroid disruption in women).',
      formData.pregnancy_status
        ? '⚠️ Pregnancy note: untreated hypothyroidism in pregnancy can affect fetal neurodevelopment. Contact your OB-GYN today.'
        : 'Schedule a specialist appointment within 2 weeks.',
      'Sleep with room temperature between 20–22°C — helps manage temperature sensitivity.',
      'Repeat TSH + T3 + T4 panel in 30 days.',
    ],
    High: [
      '🚨 Seek emergency care immediately. TSH > 10 or severe symptoms require urgent intervention.',
      'Do not adjust medications without a doctor. Abrupt changes can cause thyroid storm.',
      formData.pregnancy_status
        ? '🚨 PREGNANCY EMERGENCY: Contact your OB-GYN NOW. Severe hypothyroidism in pregnancy is a medical emergency.'
        : 'Go to your nearest PMJAY hospital or call 104 immediately.',
      'Rest. Reduce all physical and mental exertion until stabilized.',
    ],
  };

  const followupDays: Record<RiskClass, number> = {
    Normal: 180, Mild: 60, Moderate: 30, High: 7,
  };

  const followupTest: Record<RiskClass, string> = {
    Normal: 'TSH only',
    Mild: 'TSH + FT4',
    Moderate: 'TSH + FT3 + FT4',
    High: 'TSH + FT3 + FT4 + Anti-TPO antibodies + clinical evaluation',
  };

  const referralTier = emergency_flag ? 'emergency'
    : risk_class === 'High' ? 'pmjay'
    : risk_class === 'Moderate' ? 'telemedicine'
    : 'none';

  return {
    rec_id: crypto.randomUUID(),
    assessment_id: assessment.assessment_id,
    diet_recommendations: dietRecs[risk_class],
    exercise_recommendations: exerciseRecs[risk_class],
    lifestyle_recommendations: lifestyleRecs[risk_class],
    followup_interval_days: followupDays[risk_class],
    followup_test_required: followupTest[risk_class],
    referral_tier: referralTier as 'none' | 'telemedicine' | 'pmjay' | 'emergency',
    emergency_flag,
    referral_trigger: emergency_flag
      ? 'TSH > 10 mIU/L or symptom severity > 7/10 — immediate escalation required'
      : undefined,
  };
}

/**
 * Generates a multilingual GenAI explanation for the patient
 */
export function generateExplanation(
  assessment: RiskAssessment,
  language: string,
  tsh: number,
): string {
  const tshLabel = tsh <= 0 ? 'not provided' : `${tsh.toFixed(1)} mIU/L`;
  const riskClass = assessment.risk_class;

  const explanations: Record<string, Record<RiskClass, string>> = {
    en: {
      Normal: `Your thyroid activity level is within the healthy range. Your TSH is ${tshLabel}, which means your thyroid gland is working at the right speed. Keep following a balanced diet with adequate iodine, practice regular yoga, and repeat your TSH test in 6 months. Well done on taking care of your health! ✅`,
      Mild: `Your thyroid activity level is slightly outside the normal range. Your TSH reading (${tshLabel}) suggests your thyroid gland may be working a little slowly. This is manageable with the right diet, lifestyle changes, and a doctor's review in the next 2 months. Please follow the diet and exercise recommendations on this page. 🟡`,
      Moderate: `Your thyroid gland appears to be working significantly slower than normal (TSH: ${tshLabel}). This means your body may not be getting enough thyroid hormone, which can affect your energy, weight, and mood. Please see a doctor within 2 weeks. You can book a free e-Sanjeevani telemedicine consultation using the button below. 🟠`,
      High: `⚠️ Your thyroid level requires urgent medical attention. TSH at ${tshLabel} is critically elevated, meaning your thyroid gland has nearly stopped working. Please call the 104 helpline or go to your nearest PMJAY hospital immediately. Do not wait. Your health is the priority. 🔴`,
    },
    hi: {
      Normal: `आपका थायरॉइड स्तर सामान्य है। आपका TSH ${tshLabel} है, जिसका अर्थ है कि आपकी थायरॉइड ग्रंथि सही गति से काम कर रही है। आयोडीन युक्त नमक का उपयोग करते रहें, नियमित योगाभ्यास करें और 6 महीने में TSH परीक्षण दोहराएं। आपने अपने स्वास्थ्य का ख्याल रखा — शाबाश! ✅`,
      Mild: `आपका थायरॉइड स्तर सामान्य सीमा से थोड़ा बाहर है। TSH ${tshLabel} दर्शाता है कि आपकी थायरॉइड ग्रंथि थोड़ी धीमी काम कर रही है। सही आहार और जीवनशैली बदलाव से यह ठीक हो सकता है। 2 महीने में डॉक्टर से मिलें। 🟡`,
      Moderate: `आपकी थायरॉइड ग्रंथि सामान्य से काफी धीमी काम कर रही है (TSH: ${tshLabel})। इससे आपकी ऊर्जा, वजन और मूड प्रभावित हो सकता है। 2 सप्ताह के भीतर डॉक्टर से मिलें। नीचे दिए गए बटन से मुफ्त e-Sanjeevani परामर्श बुक करें। 🟠`,
      High: `⚠️ आपके थायरॉइड स्तर को तुरंत चिकित्सा देखभाल की आवश्यकता है। TSH ${tshLabel} है, जो बेहद उच्च है। कृपया 104 हेल्पलाइन पर कॉल करें या तुरंत निकटतम PMJAY अस्पताल जाएं। देरी न करें। 🔴`,
    },
    ta: {
      Normal: `உங்கள் தைராய்டு அளவு சாதாரணமாக உள்ளது. உங்கள் TSH ${tshLabel}, அதாவது உங்கள் தைராய்டு சுரப்பி சரியான வேகத்தில் வேலை செய்கிறது. அயோடின் உப்பு தொடர்ந்து பயன்படுத்துங்கள், தினமும் யோகா பயிற்சி செய்யுங்கள். 6 மாதத்தில் TSH மீண்டும் சோதிக்கவும். ✅`,
      Mild: `உங்கள் தைராய்டு அளவு சற்று அசாதாரணமாக உள்ளது (TSH: ${tshLabel}). உங்கள் சுரப்பி சற்று மெதுவாக வேலை செய்கிறது. சரியான உணவு மற்றும் வாழ்க்கை முறை மாற்றங்களால் இது சரியாகும். 2 மாதத்தில் மருத்துவரை சந்தியுங்கள். 🟡`,
      Moderate: `உங்கள் தைராய்டு சுரப்பி மிகவும் மெதுவாக வேலை செய்கிறது (TSH: ${tshLabel}). இது உங்கள் ஆற்றல், எடை மற்றும் மனநிலையை பாதிக்கலாம். 2 வாரங்களுக்குள் மருத்துவரை சந்தியுங்கள். கீழே உள்ள பொத்தானைப் பயன்படுத்தி e-Sanjeevani ஆலோசனை பதிவு செய்யுங்கள். 🟠`,
      High: `⚠️ உங்கள் தைராய்டு அளவுக்கு அவசர மருத்துவ கவனிப்பு தேவை. TSH ${tshLabel} மிகவும் அதிகமாக உள்ளது. உடனடியாக 104 உதவி எண்ணை அழையுங்கள் அல்லது அருகிலுள்ள PMJAY மருத்துவமனைக்கு செல்லுங்கள். 🔴`,
    },
    bn: {
      Normal: `আপনার থাইরয়েড স্তর স্বাভাবিক। আপনার TSH ${tshLabel}, যার মানে আপনার থাইরয়েড গ্রন্থি সঠিক গতিতে কাজ করছে। আয়োডিনযুক্ত লবণ ব্যবহার চালিয়ে যান, নিয়মিত যোগব্যায়াম করুন এবং ৬ মাসে TSH পরীক্ষা করুন। ✅`,
      Mild: `আপনার থাইরয়েড স্তর স্বাভাবিক সীমার একটু বাইরে (TSH: ${tshLabel})। আপনার গ্রন্থি সামান্য ধীরে কাজ করছে। সঠিক খাদ্য ও জীবনধারা পরিবর্তনে এটি নিয়ন্ত্রণে আসবে। ২ মাসের মধ্যে ডাক্তার দেখান। 🟡`,
      Moderate: `আপনার থাইরয়েড গ্রন্থি স্বাভাবিকের চেয়ে অনেক ধীরে কাজ করছে (TSH: ${tshLabel})। ২ সপ্তাহের মধ্যে ডাক্তার দেখান। নিচের বোতাম দিয়ে বিনামূল্যে e-Sanjeevani পরামর্শ বুক করুন। 🟠`,
      High: `⚠️ আপনার থাইরয়েড মাত্রার জরুরি চিকিৎসা দরকার। TSH ${tshLabel} অত্যন্ত বেশি। এখনই ১০৪ হেল্পলাইনে ফোন করুন বা নিকটতম PMJAY হাসপাতালে যান। 🔴`,
    },
    te: {
      Normal: `మీ థైరాయిడ్ స్థాయి సాధారణంగా ఉంది. మీ TSH ${tshLabel}, అంటే మీ థైరాయిడ్ గ్రంధి సరైన వేగంతో పనిచేస్తోంది. అయోడిన్ ఉప్పు వాడుతూనే ఉండండి, రోజూ యోగా చేయండి, 6 నెలలలో TSH పరీక్ష చేయించుకోండి. ✅`,
      Mild: `మీ థైరాయిడ్ స్థాయి కొద్దిగా అసాధారణంగా ఉంది (TSH: ${tshLabel}). సరైన ఆహారం మరియు జీవనశైలి మార్పులతో ఇది నియంత్రించవచ్చు. 2 నెలల్లో డాక్టర్‌ను సందర్శించండి. 🟡`,
      Moderate: `మీ థైరాయిడ్ గ్రంధి చాలా నెమ్మదిగా పనిచేస్తోంది (TSH: ${tshLabel}). 2 వారాలలో డాక్టర్‌ను చూడండి. దిగువ బటన్ ద్వారా ఉచిత e-Sanjeevani సంప్రదింపు బుక్ చేయండి. 🟠`,
      High: `⚠️ మీ థైరాయిడ్ స్థాయికి అత్యవసర వైద్య సహాయం అవసరం. TSH ${tshLabel} చాలా ఎక్కువగా ఉంది. వెంటనే 104 హెల్ప్‌లైన్‌కు కాల్ చేయండి లేదా దగ్గరలోని PMJAY ఆస్పత్రికి వెళ్ళండి. 🔴`,
    },
    mr: {
      Normal: `तुमची थायरॉइड पातळी सामान्य आहे. तुमचे TSH ${tshLabel} आहे, याचा अर्थ तुमची थायरॉइड ग्रंथी योग्य वेगाने काम करत आहे. आयोडाइज्ड मीठ वापरत राहा, नियमित योगा करा आणि 6 महिन्यांनी TSH चाचणी करा. ✅`,
      Mild: `तुमची थायरॉइड पातळी थोडी असामान्य आहे (TSH: ${tshLabel}). योग्य आहार आणि जीवनशैली बदलांनी हे नियंत्रणात आणता येते. 2 महिन्यांत डॉक्टरांना भेटा. 🟡`,
      Moderate: `तुमची थायरॉइड ग्रंथी सामान्यपेक्षा खूप हळू काम करत आहे (TSH: ${tshLabel}). 2 आठवड्यांत डॉक्टरांना भेटा. खाली दिलेल्या बटणाने मोफत e-Sanjeevani सल्ला बुक करा. 🟠`,
      High: `⚠️ तुमच्या थायरॉइड पातळीला तातडीच्या वैद्यकीय मदतीची गरज आहे. TSH ${tshLabel} अत्यंत उच्च आहे. आत्ताच 104 हेल्पलाइनवर कॉल करा किंवा जवळच्या PMJAY रुग्णालयात जा. 🔴`,
    },
  };

  const langMap = explanations[language] || explanations['en'];
  return langMap[riskClass] || explanations['en'][riskClass];
}
