// Core types mirroring the data models from Datamodels.md

export type RiskClass = 'Normal' | 'Mild' | 'Moderate' | 'High';
export type Language = 'en' | 'hi' | 'ta' | 'bn' | 'te' | 'mr';
export type Tier = 'Rural_PHC' | 'District_CHC' | 'Metro';
export type LiteracyLevel = 'low' | 'medium' | 'high';
export type DietPref = 'vegetarian' | 'non-vegetarian';
export type IodineZone = 'inland' | 'coastal';
export type ReferralTier = 'none' | 'telemedicine' | 'pmjay' | 'emergency';

// PatientProfile entity
export interface PatientProfile {
  patient_id: string;
  abdm_health_id?: string;
  age: number;
  region: string;
  state: string;
  tier: Tier;
  language_pref: Language;
  literacy_level: LiteracyLevel;
  pcos_history: boolean;
  pregnancy_status: boolean;
  postpartum_flag: boolean;
  diet_pref: DietPref;
  iodine_zone: IodineZone;
  created_at: string;
  updated_at: string;
}

// IntakeRecord entity — the 20-parameter form
export interface IntakeRecord {
  intake_id: string;
  patient_id: string;
  age: number;
  bmi: number;
  tsh_entered?: number;
  t3_entered?: number;
  t4_entered?: number;
  fatigue: boolean;
  hair_fall: boolean;
  weight_gain: boolean;
  cold_intolerance: boolean;
  menstrual_irregularity: boolean;
  mood_changes: boolean;
  constipation: boolean;
  dry_skin: boolean;
  symptom_severity_score: number;
  family_history_thyroid: boolean;
  pcos_history: boolean;
  pregnancy_status: boolean;
  postpartum_flag: boolean;
  medication_current: string;
  has_lab_report: boolean;
  diet_pref: DietPref;
  iodine_zone: IodineZone;
  submitted_at: string;
}

// RiskAssessment entity
export interface SHAPValues {
  tsh: number;
  t3: number;
  t4: number;
  menstrual_irregularity: number;
  bmi: number;
  symptom_severity_score: number;
  family_history_thyroid: number;
  pcos_history: number;
  age: number;
  hair_fall: number;
  fatigue: number;
  weight_gain: number;
  cold_intolerance: number;
  mood_changes: number;
  constipation: number;
  dry_skin: number;
  pregnancy_status: number;
  postpartum_flag: number;
  diet_pref: number;
  iodine_zone: number;
}

export interface RiskAssessment {
  assessment_id: string;
  intake_id: string;
  risk_class: RiskClass;
  rf_confidence: number;
  xgb_confidence: number;
  ensemble_confidence: number;
  shap_values: SHAPValues;
  top_shap_feature_1: string;
  top_shap_value_1: number;
  top_shap_feature_2: string;
  top_shap_value_2: number;
  top_shap_feature_3: string;
  top_shap_value_3: number;
  emergency_flag: boolean;
  assessed_at: string;
}

// Recommendations
export interface RecommendationSet {
  rec_id: string;
  assessment_id: string;
  diet_recommendations: string[];
  exercise_recommendations: string[];
  lifestyle_recommendations: string[];
  followup_interval_days: number;
  followup_test_required: string;
  referral_tier: ReferralTier;
  emergency_flag: boolean;
  referral_trigger?: string;
}

// GenAI Explanation
export interface GenAIExplanation {
  explanation_id: string;
  rec_id: string;
  language: Language;
  explanation_text: string;
  flesch_kincaid_grade: number;
  passed_readability: boolean;
}

// TSH Trend data point
export interface TSHTrendPoint {
  date: string;
  tsh: number;
  risk_class: RiskClass;
}

// Health history entry
export interface HistoryEntry {
  date: string;
  risk_class: RiskClass;
  tsh: number;
  notes: string;
}

// Referral facility
export interface Facility {
  facility_id: string;
  facility_name: string;
  tier: string;
  channel: string;
  facility_lat: number;
  facility_lng: number;
  distance_km: number;
  address: string;
}

// Wellness goal
export interface WellnessGoal {
  id: string;
  label: string;
  completed: boolean;
  icon: string;
}

// Intake form state (multi-step)
export interface IntakeFormData {
  // Step 1 — Basic
  age: string;
  bmi: string;
  has_lab_report: boolean | null;
  // Step 2 — Lab Values
  tsh: string;
  t3: string;
  t4: string;
  severity_score: string;
  // Step 3 — Symptoms
  fatigue: boolean;
  hair_fall: boolean;
  weight_gain: boolean;
  cold_intolerance: boolean;
  menstrual_irregularity: boolean;
  mood_changes: boolean;
  constipation: boolean;
  dry_skin: boolean;
  // Step 4 — History
  family_history_thyroid: boolean;
  pcos_history: boolean;
  pregnancy_status: boolean;
  postpartum_flag: boolean;
  medication_current: string;
  // Step 5 — Lifestyle
  diet_pref: DietPref;
  iodine_zone: IodineZone;
}
