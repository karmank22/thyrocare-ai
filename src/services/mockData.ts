/**
 * Mock data service — provides realistic demo data for all dashboard panels
 */
import type { TSHTrendPoint, HistoryEntry, Facility, WellnessGoal } from '../types';

export const mockTSHTrend: TSHTrendPoint[] = [
  { date: 'Jan', tsh: 6.2, risk_class: 'Mild' },
  { date: 'Feb', tsh: 5.8, risk_class: 'Mild' },
  { date: 'Mar', tsh: 4.9, risk_class: 'Normal' },
  { date: 'Apr', tsh: 5.3, risk_class: 'Mild' },
  { date: 'May', tsh: 4.1, risk_class: 'Normal' },
  { date: 'Jun', tsh: 3.8, risk_class: 'Normal' },
];

export const mockHistory: HistoryEntry[] = [
  {
    date: '2026-06-01',
    risk_class: 'Normal',
    tsh: 3.8,
    notes: 'All values within ICMR normal range. Continue current regimen.',
  },
  {
    date: '2026-03-15',
    risk_class: 'Mild',
    tsh: 5.3,
    notes: 'Slightly elevated TSH. Dietitian referral made. Iodized salt advised.',
  },
  {
    date: '2025-12-20',
    risk_class: 'Mild',
    tsh: 5.8,
    notes: 'Menstrual irregularity flagged. PCOS co-assessment recommended.',
  },
  {
    date: '2025-09-05',
    risk_class: 'Moderate',
    tsh: 7.2,
    notes: 'TSH elevated. e-Sanjeevani telemedicine consultation scheduled.',
  },
  {
    date: '2025-06-10',
    risk_class: 'Moderate',
    tsh: 6.9,
    notes: 'Initial assessment. Medication (Levothyroxine 25mcg) prescribed.',
  },
];

export const mockFacilities: Facility[] = [
  {
    facility_id: 'pmjay-001',
    facility_name: 'District Government Hospital Ludhiana',
    tier: 'District_CHC',
    channel: 'pmjay',
    facility_lat: 30.9010,
    facility_lng: 75.8573,
    distance_km: 2.4,
    address: 'Civil Lines, Ludhiana, Punjab 141001',
  },
  {
    facility_id: 'esanj-001',
    facility_name: 'e-Sanjeevani OPD Node — PHC Machhiwara',
    tier: 'Rural_PHC',
    channel: 'e_sanjeevani',
    facility_lat: 30.9196,
    facility_lng: 76.1897,
    distance_km: 15.7,
    address: 'PHC Machhiwara, Punjab 141116',
  },
  {
    facility_id: 'pmjay-002',
    facility_name: 'Dayanand Medical College & Hospital',
    tier: 'Metro',
    channel: 'pmjay',
    facility_lat: 30.9049,
    facility_lng: 75.8517,
    distance_km: 3.1,
    address: 'Tagore Nagar, Ludhiana, Punjab 141001',
  },
  {
    facility_id: 'pmjay-003',
    facility_name: 'CHC Raikot — Thyroid Screening Centre',
    tier: 'District_CHC',
    channel: 'pmjay',
    facility_lat: 30.6497,
    facility_lng: 75.6063,
    distance_km: 28.3,
    address: 'Raikot, Ludhiana District, Punjab 141109',
  },
];

export const mockWellnessGoals: WellnessGoal[] = [
  { id: 'g1', label: 'Take thyroid medication on empty stomach', completed: false, icon: '💊' },
  { id: 'g2', label: 'Use iodized salt in all meals', completed: false, icon: '🧂' },
  { id: 'g3', label: 'Drink 8 glasses of water', completed: false, icon: '💧' },
  { id: 'g4', label: 'Morning Surya Namaskar (12 rounds)', completed: false, icon: '🧘' },
  { id: 'g5', label: 'Sarvangasana — 3 sets of 30 seconds', completed: false, icon: '🤸' },
  { id: 'g6', label: '30-minute brisk walk', completed: false, icon: '🚶' },
  { id: 'g7', label: 'Pranayama — Ujjayi breathing (10 min)', completed: false, icon: '🌬️' },
  { id: 'g8', label: 'Sleep by 10 PM (8-hour target)', completed: false, icon: '😴' },
];

export const wellnessResources = [
  {
    id: 'wr1',
    title: 'AYUSH Yoga for Thyroid Health',
    subtitle: 'Ministry of AYUSH, Govt. of India',
    description: 'Sarvangasana, Halasana, and Matsyasana protocols for endocrine balance.',
    url: 'https://yoga.ayush.gov.in',
    icon: '🧘',
    tags: ['Yoga', 'AYUSH'],
  },
  {
    id: 'wr2',
    title: 'NHM Thyroid Awareness Guide',
    subtitle: 'National Health Mission, India',
    description: 'Hindi & regional language factsheets on hypothyroidism symptoms and prevention.',
    url: 'https://nhm.gov.in',
    icon: '📖',
    tags: ['NHM', 'Awareness'],
  },
  {
    id: 'wr3',
    title: 'e-Sanjeevani Telemedicine',
    subtitle: 'Ministry of Health & Family Welfare',
    description: 'Free online doctor consultation. Available in 22 languages. No smartphone needed.',
    url: 'https://esanjeevani.mohfw.gov.in',
    icon: '📞',
    tags: ['Telemedicine', 'Free'],
  },
  {
    id: 'wr4',
    title: 'ABDM Health Locker',
    subtitle: 'Ayushman Bharat Digital Mission',
    description: 'Store and share your thyroid lab reports securely across all hospitals.',
    url: 'https://abdm.gov.in',
    icon: '🔒',
    tags: ['ABDM', 'Records'],
  },
  {
    id: 'wr5',
    title: 'ICMR Thyroid Guidelines',
    subtitle: 'Indian Council of Medical Research',
    description: 'Official clinical guidelines for thyroid screening and management in India.',
    url: 'https://icmr.gov.in',
    icon: '🏥',
    tags: ['ICMR', 'Clinical'],
  },
  {
    id: 'wr6',
    title: 'Iodine Deficiency: UNICEF India',
    subtitle: 'UNICEF India',
    description: 'Understanding iodine deficiency disorders and how iodized salt prevents them.',
    url: 'https://unicef.org/india',
    icon: '🧪',
    tags: ['Iodine', 'Prevention'],
  },
];
