'use client';

import { create } from 'zustand';

export interface ColorTheme {
  name: string;
  label: string;
  lightPrimary: string;
  darkPrimary: string;
}

export interface GradientTheme {
  name: string;
  label: string;
  lightFrom: string;
  lightTo: string;
  darkFrom: string;
  darkTo: string;
}

export const colorThemes: ColorTheme[] = [
  { name: 'teal', label: 'Teal (HARIS)', lightPrimary: '168 76% 30%', darkPrimary: '166 68% 42%' },
  { name: 'blue', label: 'Blue (Ocean)', lightPrimary: '221.2 83.2% 53.3%', darkPrimary: '217.2 91.2% 59.8%' },
  { name: 'violet', label: 'Violet (Royal)', lightPrimary: '262.1 83.3% 58%', darkPrimary: '263.4 90% 70%' },
  { name: 'rose', label: 'Rose (Garden)', lightPrimary: '346.8 77.2% 49.8%', darkPrimary: '350.2 88.7% 65.6%' },
  { name: 'amber', label: 'Amber (Golden)', lightPrimary: '35.4 91.7% 32.9%', darkPrimary: '47.9 95.8% 53.1%' },
  { name: 'green', label: 'Green (Forest)', lightPrimary: '142.1 76.2% 36.3%', darkPrimary: '142.1 70.6% 45.3%' },
];

export const gradientThemes: GradientTheme[] = [
  { name: 'teal-sky', label: 'Teal Sky', lightFrom: '168 76% 30%', lightTo: '199 89% 48%', darkFrom: '166 68% 42%', darkTo: '199 89% 58%' },
  { name: 'blue-violet', label: 'Blue Violet', lightFrom: '221.2 83.2% 53.3%', lightTo: '262.1 83.3% 58%', darkFrom: '217.2 91.2% 59.8%', darkTo: '263.4 90% 70%' },
  { name: 'rose-amber', label: 'Rose Amber', lightFrom: '346.8 77.2% 49.8%', lightTo: '35.4 91.7% 45%', darkFrom: '350.2 88.7% 65.6%', darkTo: '47.9 95.8% 53.1%' },
  { name: 'green-teal', label: 'Green Teal', lightFrom: '142.1 76.2% 36.3%', lightTo: '168 76% 30%', darkFrom: '142.1 70.6% 45.3%', darkTo: '166 68% 42%' },
];

export interface FontTheme {
  name: string;
  label: string;
}

export const googleFontFamilies = [
  'ABeeZee',
  'Abel',
  'Abril Fatface',
  'Aclonica',
  'Alegreya',
  'Alegreya Sans',
  'Alfa Slab One',
  'Amatic SC',
  'Anton',
  'Archivo',
  'Archivo Black',
  'Arimo',
  'Arvo',
  'Asap',
  'Assistant',
  'Bangers',
  'Barlow',
  'Barlow Condensed',
  'Bebas Neue',
  'Bitter',
  'Bree Serif',
  'Cabin',
  'Cairo',
  'Catamaran',
  'Cinzel',
  'Comfortaa',
  'Cormorant Garamond',
  'Crimson Text',
  'Dancing Script',
  'DM Sans',
  'Domine',
  'Dosis',
  'EB Garamond',
  'Exo 2',
  'Fira Sans',
  'Fjalla One',
  'Fredoka',
  'Great Vibes',
  'Heebo',
  'IBM Plex Sans',
  'IBM Plex Serif',
  'Inconsolata',
  'Inter',
  'Josefin Sans',
  'Kanit',
  'Karla',
  'Lato',
  'Lexend',
  'Libre Baskerville',
  'Libre Franklin',
  'Lobster',
  'Lora',
  'Manrope',
  'Merriweather',
  'Montserrat',
  'Mukta',
  'Mulish',
  'Nanum Gothic',
  'Noto Sans',
  'Noto Serif',
  'Nunito',
  'Nunito Sans',
  'Open Sans',
  'Oswald',
  'Outfit',
  'Overpass',
  'Pacifico',
  'Patrick Hand',
  'Playfair Display',
  'Plus Jakarta Sans',
  'Poppins',
  'Prompt',
  'PT Sans',
  'PT Serif',
  'Quicksand',
  'Raleway',
  'Roboto',
  'Roboto Condensed',
  'Roboto Mono',
  'Roboto Slab',
  'Rubik',
  'Satisfy',
  'Shadows Into Light',
  'Signika',
  'Slabo 27px',
  'Source Code Pro',
  'Source Sans 3',
  'Source Serif 4',
  'Space Grotesk',
  'Tajawal',
  'Titillium Web',
  'Ubuntu',
  'Varela Round',
  'Work Sans',
  'Yanone Kaffeesatz',
].sort();

export const fontThemes: FontTheme[] = googleFontFamilies.map((name) => ({
  name,
  label: name,
}));

export function normalizeGoogleFontName(value: string) {
  return value.replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();
}

export function googleFontsCssUrl(fontFamily: string) {
  const safeFontFamily = normalizeGoogleFontName(fontFamily) || 'Inter';
  const family = safeFontFamily.replace(/\s+/g, '+');
  return `https://fonts.googleapis.com/css2?family=${family}:wght@300;400;500;600;700&display=swap`;
}

export function googleFontsImport(fontFamily: string) {
  return `@import url('${googleFontsCssUrl(fontFamily)}');`;
}

export const defaultFontThemes: FontTheme[] = [
  { name: 'Inter', label: 'Inter' },
  { name: 'Roboto', label: 'Roboto' },
  { name: 'Poppins', label: 'Poppins' },
  { name: 'Lato', label: 'Lato' },
  { name: 'Montserrat', label: 'Montserrat' },
  { name: 'Open Sans', label: 'Open Sans' },
];

type SettingsState = {
  accentMode: 'solid' | 'gradient';
  primaryColor: string;
  gradientColor: string;
  fontFamily: string;
  showSettingsModal: boolean;
  setThemeSettings: (primaryColor: string, fontFamily: string, accentMode?: 'solid' | 'gradient', gradientColor?: string) => void;
  setShowSettingsModal: (show: boolean) => void;
  hydrateSettings: () => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  accentMode: 'solid',
  primaryColor: 'teal',
  gradientColor: 'teal-sky',
  fontFamily: 'Inter',
  showSettingsModal: false,
  setThemeSettings: (primaryColor, fontFamily, accentMode = 'solid', gradientColor = 'teal-sky') => {
    localStorage.setItem('haris_primary_color', primaryColor);
    localStorage.setItem('haris_accent_mode', accentMode);
    localStorage.setItem('haris_gradient_color', gradientColor);
    localStorage.setItem('haris_font_family', fontFamily);
    set({ accentMode, primaryColor, gradientColor, fontFamily });
  },
  setShowSettingsModal: (showSettingsModal) => set({ showSettingsModal }),
  hydrateSettings: () => {
    if (typeof window === 'undefined') return;
    const accentMode = (localStorage.getItem('haris_accent_mode') === 'gradient' ? 'gradient' : 'solid') as 'solid' | 'gradient';
    const primaryColor = localStorage.getItem('haris_primary_color') ?? 'teal';
    const gradientColor = localStorage.getItem('haris_gradient_color') ?? 'teal-sky';
    const fontFamily = localStorage.getItem('haris_font_family') ?? 'Inter';
    set({ accentMode, primaryColor, gradientColor, fontFamily });
  },
}));
