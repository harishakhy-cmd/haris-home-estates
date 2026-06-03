'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, MessageCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role?: string;
};

interface Props {
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

export const UserSearchModal: React.FC<Props> = ({ onClose, onSelectUser }) => {
  const [query, setQuery]         = useState('');
  const [allUsers, setAllUsers]   = useState<User[]>([]);
  const [results, setResults]     = useState<User[]>([]);
  const [onlineIds, setOnlineIds] = useState<string[]>([]);
  const [loading, setLoading]     = useState(true);
  const [searching, setSearching] = useState(false);

  /* Load ALL platform users + online list on mount */
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/users/search', { params: { q: '' } }).catch(() => ({ data: [] })),
      api.get('/users/online').catch(() => ({ data: [] })),
    ]).then(([usersRes, onlineRes]) => {
      const users = usersRes.data ?? [];
      setAllUsers(users);
      setResults(users);
      setOnlineIds(onlineRes.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  /* Live search – debounced 300 ms */
  const runSearch = useCallback((q: string) => {
    const term = q.trim().toLowerCase();
    if (!term) {
      setResults(allUsers);
      return;
    }
    setSearching(true);
    api.get('/users/search', { params: { q: term } })
      .then(res => setResults(res.data ?? []))
      .catch(() => {
        /* fallback to client-side filter */
        setResults(
          allUsers.filter(u =>
            `${u.firstName} ${u.lastName}`.toLowerCase().includes(term),
          ),
        );
      })
      .finally(() => setSearching(false));
  }, [allUsers]);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  function roleLabel(role?: string) {
    if (!role) return '';
    return role.charAt(0) + role.slice(1).toLowerCase();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-[hsl(var(--primary))]" />
            <h3 className="text-base font-bold text-[hsl(var(--foreground))]">Start a Direct Chat</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))]/60"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            {searching && (
              <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[hsl(var(--primary))]" />
            )}
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or email…"
              className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 pl-9 pr-9 text-sm text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))] transition focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
            />
          </div>
        </div>

        {/* List */}
        <div className="max-h-72 overflow-y-auto pb-3 scrollbar-thin">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-[hsl(var(--muted-foreground))]">
              <Loader2 size={18} className="animate-spin" /> Loading members…
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Search size={28} className="text-[hsl(var(--muted-foreground))]/40" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {query ? `No members found for "${query}"` : 'No members on the platform yet.'}
              </p>
            </div>
          )}

          {!loading && results.map(user => {
            const isOnline = onlineIds.includes(user.id);
            return (
              <button
                key={user.id}
                onClick={() => { onSelectUser(user); onClose(); }}
                className={cn(
                  'flex w-full items-center gap-3 px-5 py-2.5 text-left transition-all duration-150',
                  'hover:bg-[hsl(var(--muted))]/50',
                )}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-[hsl(var(--border))]"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--primary))]/15 text-xs font-semibold text-[hsl(var(--primary))]">
                      {user.firstName?.[0] ?? '?'}{user.lastName?.[0] ?? ''}
                    </div>
                  )}
                  {/* Online dot */}
                  <span
                    className={cn(
                      'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[hsl(var(--card))]',
                      isOnline ? 'bg-emerald-400' : 'bg-[hsl(var(--muted-foreground))]/50',
                    )}
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[hsl(var(--foreground))]">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                    {isOnline ? '🟢 Online' : '⚫ Offline'}
                    {user.role ? ` · ${roleLabel(user.role)}` : ''}
                  </p>
                </div>

                {/* Chat icon hint */}
                <MessageCircle size={15} className="shrink-0 text-[hsl(var(--muted-foreground))]/50" />
              </button>
            );
          })}
        </div>

        {/* Footer hint */}
        {!loading && results.length > 0 && (
          <div className="border-t border-[hsl(var(--border))] px-5 py-3 text-center text-[11px] text-[hsl(var(--muted-foreground))]">
            {results.length} member{results.length !== 1 ? 's' : ''} · Click to start chatting
          </div>
        )}
      </div>
    </div>
  );
};
