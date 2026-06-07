'use client';

import React, { useState } from 'react';
import { Wifi, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
  position?: 'top' | 'bottom';
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className,
  position = 'bottom',
}) => {
  const { isOnline, isSyncing } = useOfflineSync();
  const { queue } = useOfflineQueue();
  const [showDetails, setShowDetails] = useState(false);

  if (isOnline && queue.length === 0) return null;

  return (
    <div
      className={cn(
        'fixed left-4 right-4 z-50 rounded-lg border shadow-lg backdrop-blur-sm',
        position === 'bottom' ? 'bottom-4' : 'top-4',
        isOnline
          ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-amber-25'
          : 'border-red-200 bg-gradient-to-r from-red-50 to-red-25',
        className,
      )}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <RefreshCw
                size={18}
                className={cn(
                  'flex-shrink-0',
                  isSyncing ? 'animate-spin text-amber-600' : 'text-amber-600'
                )}
              />
            ) : (
              <Wifi
                size={18}
                className="flex-shrink-0 text-red-600 opacity-50"
                style={{ strokeDasharray: '3, 3' }}
              />
            )}

            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-semibold', isOnline ? 'text-amber-900' : 'text-red-900')}>
                {isOnline ? 'Syncing Messages' : 'No Connection'}
              </p>
              {queue.length > 0 && (
                <p className={cn('text-xs', isOnline ? 'text-amber-700' : 'text-red-700')}>
                  {queue.length} message{queue.length !== 1 ? 's' : ''} waiting to send
                </p>
              )}
            </div>
          </div>

          {queue.length > 0 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex-shrink-0 text-xs font-semibold transition hover:opacity-80"
              title="Show details"
            >
              {showDetails ? 'Hide' : 'Show'}
            </button>
          )}
        </div>

        {showDetails && queue.length > 0 && (
          <div className="mt-3 border-t border-current border-opacity-20 pt-3">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {queue.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2 text-xs">
                  {msg.retries > 0 ? (
                    <AlertTriangle
                      size={14}
                      className="flex-shrink-0 mt-0.5"
                      style={{ color: isOnline ? 'rgb(217, 119, 6)' : 'rgb(220, 38, 38)' }}
                    />
                  ) : (
                    <CheckCircle
                      size={14}
                      className="flex-shrink-0 mt-0.5"
                      style={{ color: isOnline ? 'rgb(217, 119, 6)' : 'rgb(220, 38, 38)' }}
                    />
                  )}
                  <span
                    className={cn(
                      'line-clamp-2',
                      isOnline ? 'text-amber-700' : 'text-red-700'
                    )}
                  >
                    {msg.content.substring(0, 60)}
                    {msg.content.length > 60 ? '...' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
