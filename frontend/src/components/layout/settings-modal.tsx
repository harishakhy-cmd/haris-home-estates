'use client';

import { X, Palette, Type } from 'lucide-react';
import { useSettingsStore, colorThemes, defaultFontThemes, fontThemes, gradientThemes, normalizeGoogleFontName } from '@/store/settings-store';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';

export function SettingsModal() {
  const {
    accentMode,
    primaryColor,
    gradientColor,
    fontFamily,
    showSettingsModal,
    setThemeSettings,
    setShowSettingsModal,
    hydrateSettings,
  } = useSettingsStore();
  const { bubbleShape, setBubbleShape } = useSettingsStore();
  const [fontSearch, setFontSearch] = useState(fontFamily);

  useEffect(() => {
    hydrateSettings();
  }, [hydrateSettings]);

  useEffect(() => {
    setFontSearch(fontFamily);
  }, [fontFamily, showSettingsModal]);

  const visibleFonts = useMemo(() => {
    const term = fontSearch.trim().toLowerCase();
    const source = term
      ? fontThemes.filter((font) => font.name.toLowerCase().includes(term))
      : defaultFontThemes;
    const selected = fontThemes.find((font) => font.name === fontFamily);
    const merged = selected ? [selected, ...source.filter((font) => font.name !== selected.name)] : source;
    return merged.slice(0, 12);
  }, [fontFamily, fontSearch]);

  const applyFont = (value: string) => {
    const nextFont = normalizeGoogleFontName(value) || 'Inter';
    setFontSearch(nextFont);
    setThemeSettings(primaryColor, nextFont, accentMode, gradientColor);
  };

  if (!showSettingsModal) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300 animate-in fade-in"
      onClick={() => setShowSettingsModal(false)}
    >
      <div
        className={cn(
          "relative w-full max-w-md mx-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/90 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300",
          "scale-in-95 animate-in slide-in-from-bottom-4 duration-300"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2">
            <Palette size={20} className="text-[hsl(var(--primary))]" />
            <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">Appearance Settings</h2>
          </div>
          <button
            onClick={() => setShowSettingsModal(false)}
            className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))]/60 hover:text-[hsl(var(--foreground))]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Color Theme Selector */}
        <div className="mb-6">
          <label className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            <Palette size={14} /> Color Accent
          </label>
          <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl bg-[hsl(var(--muted))]/50 p-1">
            {(['solid', 'gradient'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setThemeSettings(primaryColor, fontFamily, mode, gradientColor)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold capitalize transition-all",
                  accentMode === mode
                    ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(accentMode === 'solid' ? colorThemes : gradientThemes).map((theme) => {
              const isSolidTheme = 'lightPrimary' in theme;
              const bgStyle = {
                background: isSolidTheme
                  ? `hsl(${theme.lightPrimary})`
                  : `linear-gradient(135deg, hsl(${theme.lightFrom}), hsl(${theme.lightTo}))`,
              };
              const isSelected = isSolidTheme ? primaryColor === theme.name : gradientColor === theme.name;

              return (
                <button
                  key={theme.name}
                  onClick={() => setThemeSettings(
                    isSolidTheme ? theme.name : primaryColor,
                    fontFamily,
                    accentMode,
                    isSolidTheme ? gradientColor : theme.name,
                  )}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all duration-200",
                    isSelected
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 shadow-sm ring-1 ring-[hsl(var(--primary))]"
                      : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/40"
                  )}
                >
                  <span className="w-6 h-6 rounded-full border border-white/20 shadow-md" style={bgStyle} />
                  <span className="text-xs font-medium text-[hsl(var(--foreground))]">{theme.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Family Selector */}
        <div className="mb-6">
          <label className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            <Type size={14} /> Typography / Font Family
          </label>
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20 p-3">
            <input
              value={fontSearch}
              onChange={(event) => {
                const value = event.target.value;
                setFontSearch(value);
                const exactMatch = fontThemes.find((font) => font.name.toLowerCase() === value.trim().toLowerCase());
                if (exactMatch) applyFont(exactMatch.name);
              }}
              onBlur={(event) => applyFont(event.target.value)}
              list="haris-google-fonts"
              placeholder="Search or type any Google Font"
              className="h-10 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 text-sm text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
            />
            <datalist id="haris-google-fonts">
              {fontThemes.map((font) => <option key={font.name} value={font.name} />)}
            </datalist>
            <div className="mt-3 grid max-h-52 grid-cols-1 gap-2 overflow-y-auto pr-1 scrollbar-thin">
              {visibleFonts.map((font) => {
              const isSelected = fontFamily === font.name;
              return (
                <button
                  key={font.name}
                  onClick={() => applyFont(font.name)}
                  className={cn(
                    "flex items-center justify-between w-full p-3 rounded-lg border text-left transition-all duration-200",
                    isSelected
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 shadow-sm ring-1 ring-[hsl(var(--primary))]"
                      : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/40"
                  )}
                  style={{ fontFamily: font.name }}
                >
                  <span className="text-sm font-medium text-[hsl(var(--foreground))]">{font.label}</span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">Abc 123</span>
                </button>
              );
            })}
            </div>
            <div className="mt-3 rounded-lg bg-[hsl(var(--card))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" style={{ fontFamily }}>
              {fontFamily} - The quick brown fox jumps over the lazy dog.
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-4">
          <label className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Bubble Shape</label>
          <div className="flex gap-2">
            {[
              { key: 'rounded-2xl', label: 'Rounded' },
              { key: 'pill', label: 'Pill' },
              { key: 'square', label: 'Square' },
              { key: 'asym', label: 'Asym' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setBubbleShape(opt.key)}
                className={cn(
                  'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  bubbleShape === opt.key
                    ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowSettingsModal(false)}
          className="w-full h-11 rounded-xl bg-[hsl(var(--primary))] text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-lg shadow-[hsl(var(--primary))]/25 transition-all duration-200 hover:shadow-xl active:scale-[0.98]"
        >
          Save & Apply Settings
        </button>
      </div>
    </div>
  );
}
