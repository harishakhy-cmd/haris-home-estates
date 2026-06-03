'use client';

import { create } from 'zustand';

export interface ColorTheme {
  name: string;
  label: string;
  lightPrimary: string;
  darkPrimary: string;
}

export const colorThemes: ColorTheme[] = [
  { name: 'teal', label: 'Teal (HARIS)', lightPrimary: '168 76% 30%', darkPrimary: '166 68% 42%' },
  { name: 'blue', label: 'Blue (Ocean)', lightPrimary: '221.2 83.2% 53.3%', darkPrimary: '217.2 91.2% 59.8%' },
  { name: 'violet', label: 'Violet (Royal)', lightPrimary: '262.1 83.3% 58%', darkPrimary: '263.4 90% 70%' },
  { name: 'rose', label: 'Rose (Garden)', lightPrimary: '346.8 77.2% 49.8%', darkPrimary: '350.2 88.7% 65.6%' },
  { name: 'amber', label: 'Amber (Golden)', lightPrimary: '35.4 91.7% 32.9%', darkPrimary: '47.9 95.8% 53.1%' },
  { name: 'green', label: 'Green (Forest)', lightPrimary: '142.1 76.2% 36.3%', darkPrimary: '142.1 70.6% 45.3%' },
];

export interface FontTheme {
  name: string;
  label: string;
}

export const fontThemes: FontTheme[] = [
  { name: 'Inter', label: 'Inter (Default)' },
  { name: 'Outfit', label: 'Outfit (Modern)' },
  { name: 'Playfair Display', label: 'Playfair (Elegant)' },
  { name: 'Plus Jakarta Sans', label: 'Jakarta (Geometric)' },
  { name: 'Space Grotesk', label: 'Space (Tech)' },
  { name: 'Courier Prime', label: 'Courier (Retro)' },
];

type SettingsState = {
  primaryColor: string;
  fontFamily: string;
  showSettingsModal: boolean;
  setThemeSettings: (primaryColor: string, fontFamily: string) => void;
  setShowSettingsModal: (show: boolean) => void;
  hydrateSettings: () => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  primaryColor: 'teal',
  fontFamily: 'Inter',
  showSettingsModal: false,
  setThemeSettings: (primaryColor, fontFamily) => {
    localStorage.setItem('haris_primary_color', primaryColor);
    localStorage.setItem('haris_font_family', fontFamily);
    set({ primaryColor, fontFamily });
  },
  setShowSettingsModal: (showSettingsModal) => set({ showSettingsModal }),
  hydrateSettings: () => {
    if (typeof window === 'undefined') return;
    const primaryColor = localStorage.getItem('haris_primary_color') ?? 'teal';
    const fontFamily = localStorage.getItem('haris_font_family') ?? 'Inter';
    set({ primaryColor, fontFamily });
  },
}));
