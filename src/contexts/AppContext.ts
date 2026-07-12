import { createContext, useContext } from 'react';
import type { RiskAssessment, RecommendationSet, IntakeFormData, Language } from '../types';

export type Theme = 'dark' | 'light';

export interface User {
  id: string;
  username: string;
  preferred_name: string;
  role: 'patient' | 'worker';
}

interface AppContextType {
  assessment: RiskAssessment | null;
  setAssessment: (a: RiskAssessment | null) => void;
  recommendations: RecommendationSet | null;
  setRecommendations: (r: RecommendationSet | null) => void;
  formData: IntakeFormData | null;
  setFormData: (f: IntakeFormData | null) => void;
  language: Language;
  switchLanguage: (lang: Language) => void;
  theme: Theme;
  toggleTheme: () => void;
  currentUser: User | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const AppContext = createContext<AppContextType>({
  assessment: null,
  setAssessment: () => {},
  recommendations: null,
  setRecommendations: () => {},
  formData: null,
  setFormData: () => {},
  language: 'en',
  switchLanguage: () => {},
  theme: 'dark',
  toggleTheme: () => {},
  currentUser: null,
  login: () => {},
  logout: () => {},
});

export const useApp = () => useContext(AppContext);

