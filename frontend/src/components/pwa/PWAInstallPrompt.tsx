'use client';

import React, { useState } from 'react';
import { Download, X, ChevronDown } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { cn } from '@/lib/utils';

interface PWAInstallPromptProps {
  className?: string;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ className }) => {
  const { isInstallable, isInstalled, isIOSInstallable, showPrompt } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  if (isInstalled || isDismissed) return null;

  // Android/Chrome install prompt
  if (isInstallable) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border border-[hsl(var(--border))] bg-gradient-to-r from-[hsl(var(--primary))]/10 to-[hsl(var(--primary))]/5 px-4 py-3 shadow-sm',
          className,
        )}
      >
        <Download size={18} className="flex-shrink-0 text-[hsl(var(--primary))]" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Install HARIS</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Add to your home screen for quick access
          </p>
        </div>

        <button
          onClick={showPrompt}
          className="flex-shrink-0 rounded-lg bg-[hsl(var(--primary))] px-3 py-1.5 text-xs font-semibold text-[hsl(var(--primary-foreground))] transition hover:opacity-90 active:scale-95"
        >
          Install
        </button>

        <button
          onClick={() => setIsDismissed(true)}
          className="flex-shrink-0 rounded-lg p-1 text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))]/50"
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  // iOS install instructions
  if (isIOSInstallable) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="rounded-lg border border-[hsl(var(--border))] bg-gradient-to-r from-[hsl(var(--primary))]/10 to-[hsl(var(--primary))]/5 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Install HARIS</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Get app-like experience on iOS
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowIOSInstructions(!showIOSInstructions)}
                className="flex-shrink-0 rounded-lg bg-[hsl(var(--primary))] px-3 py-1.5 text-xs font-semibold text-[hsl(var(--primary-foreground))] transition hover:opacity-90 active:scale-95 flex items-center gap-1"
              >
                How
                <ChevronDown
                  size={14}
                  className={cn('transition-transform', showIOSInstructions && 'rotate-180')}
                />
              </button>

              <button
                onClick={() => setIsDismissed(true)}
                className="flex-shrink-0 rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))]/50"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {showIOSInstructions && (
            <div className="mt-4 space-y-3 border-t border-[hsl(var(--border))]/30 pt-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[hsl(var(--foreground))]">
                  How to install on iOS:
                </p>
                <ol className="space-y-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                  <li className="flex gap-2">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] text-[10px] font-bold">
                      1
                    </span>
                    <span>Tap the Share button (↑) at the bottom of Safari</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] text-[10px] font-bold">
                      2
                    </span>
                    <span>Scroll down and tap "Add to Home Screen"</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] text-[10px] font-bold">
                      3
                    </span>
                    <span>Enter a name and tap "Add"</span>
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
