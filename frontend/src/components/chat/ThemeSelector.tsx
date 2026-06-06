'use client';

import React, { useEffect, useState } from 'react';
import tokens from '../../styles/chat-bubble-tokens.json';

const themeSlugs = Object.keys(tokens) as string[];

export default function ThemeSelector() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>(() => typeof window !== 'undefined' ? localStorage.getItem('haris_theme') ?? 'midnight-glass' : 'midnight-glass');

  useEffect(() => {
    applyTheme(active);
    localStorage.setItem('haris_theme', active);
  }, [active]);

  function applyTheme(slug: string) {
    const root = document.documentElement;
    // remove any existing theme- prefix classes
    Array.from(root.classList).filter(c => c.startsWith('theme-')).forEach(c => root.classList.remove(c));
    root.classList.add('theme-' + slug);
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/60">
        Theme
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 shadow-lg">
          <div className="grid grid-cols-3 gap-2">
            {themeSlugs.map(slug => (
              <button key={slug} onClick={() => { setActive(slug); setOpen(false); }} className="flex h-16 w-full flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs">
                <div className={`h-8 w-full rounded-md border`} style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(0,0,0,0.02))' }} />
                <div className="truncate">{(tokens as Record<string, { name: string }>)[slug]?.name || slug}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
