'use client';

import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useVersionDetection } from '@/hooks/useVersionDetection';
import { cn } from '@/lib/utils';

interface UpdateNotificationProps {
  className?: string;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ className }) => {
  const { hasUpdate, refreshPage, dismissUpdate } = useVersionDetection();

  if (!hasUpdate) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-green-25 px-4 py-3 shadow-sm',
        className,
      )}
    >
      <RefreshCw size={18} className="flex-shrink-0 animate-spin text-green-600" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">Update Available</p>
        <p className="text-xs text-gray-600">
          A new version of HARIS is ready. Refresh to get the latest features.
        </p>
      </div>

      <button
        onClick={refreshPage}
        className="flex-shrink-0 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 active:scale-95"
      >
        Refresh
      </button>

      <button
        onClick={dismissUpdate}
        className="flex-shrink-0 rounded-lg p-1 text-gray-400 transition hover:bg-green-100"
        title="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
};
