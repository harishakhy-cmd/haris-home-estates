'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, X, ExternalLink } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { connectSocket, getSocket } from '@/lib/socket';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


interface PropertyNotification {
  id: string;
  message: string;
  propertyId: string;
  city: string;
  price: string | number;
  timestamp: Date;
  read: boolean;
}

export function NotificationBell() {
  const router = useRouter();
  const { user, token, hydrate } = useAuthStore();
  const [notifications, setNotifications] = useState<PropertyNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!token || !user) return;

    const socket = connectSocket(token);

    const handler = (data: any) => {
      setNotifications((prev) => [
        {
          id: `${Date.now()}`,
          message: data.message,
          propertyId: data.propertyId,
          city: data.city ?? '',
          price: data.price ?? '',
          timestamp: new Date(),
          read: false,
        },
        ...prev,
      ].slice(0, 50));
    };

    socket.on('newProperty', handler);

    return () => {
      socket.off('newProperty', handler);
    };
  }, [token, user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!user) {
    return (
      <button
        onClick={() => router.push('/auth')}
        className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:bg-[hsl(var(--muted))]"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-[hsl(var(--foreground))]" />
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAllRead();
        }}
        className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:bg-[hsl(var(--muted))]"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-[hsl(var(--foreground))]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-12 z-50 w-80 max-h-96 overflow-y-auto rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 backdrop-blur-xl shadow-2xl',
            'animate-in fade-in slide-in-from-top-2 duration-200'
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Notifications</h3>
            <button onClick={() => setIsOpen(false)} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
              <X size={16} />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4">
              <Bell size={32} className="text-[hsl(var(--muted-foreground))] mb-2" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No notifications yet</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">You&apos;ll be notified when new properties are listed</p>
            </div>
          ) : (
            <div className="divide-y divide-[hsl(var(--border))]">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={`/property/?id=${n.propertyId}`}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[hsl(var(--muted))]',
                    !n.read && 'bg-[hsl(var(--primary))]/5'
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center mt-0.5">
                    <ExternalLink size={14} className="text-[hsl(var(--primary))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[hsl(var(--foreground))] line-clamp-2">{n.message}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                      {n.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] mt-2 flex-shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
