'use client';

import { X, Palette, Type } from 'lucide-react';
import { useSettingsStore, colorThemes, fontThemes } from '@/store/settings-store';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export function SettingsModal() {
  const {
    primaryColor,
    fontFamily,
    showSettingsModal,
    setThemeSettings,
    setShowSettingsModal,
    hydrateSettings,
  } = useSettingsStore();

  useEffect(() => {
    hydrateSettings();
  }, [hydrateSettings]);

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
          <div className="grid grid-cols-3 gap-3">
            {colorThemes.map((theme) => {
              // Custom background color based on light HSL variable
              const bgStyle = {
                backgroundColor: `hsl(${theme.lightPrimary})`,
              };
              const isSelected = primaryColor === theme.name;

              return (
                <button
                  key={theme.name}
                  onClick={() => setThemeSettings(theme.name, fontFamily)}
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
          <div className="space-y-2">
            {fontThemes.map((font) => {
              const isSelected = fontFamily === font.name;
              return (
                <button
                  key={font.name}
                  onClick={() => setThemeSettings(primaryColor, font.name)}
                  className={cn(
                    "flex items-center justify-between w-full p-3 rounded-xl border text-left transition-all duration-200",
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
        </div>

        {/* Action Button */}
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
