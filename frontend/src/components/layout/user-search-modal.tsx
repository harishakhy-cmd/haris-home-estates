'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, MessageCircle, Loader2, CheckCircle2, MapPin, Phone } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { getLocalUsers } from '@/lib/local-auth';
import { useAuthStore } from '@/store/auth-store';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  avatarUrl?: string | null;
  role?: string;
  location?: string | null;
  verified?: boolean;
};

interface Props {
  onClose: () => void;
  onSelectUser: (user: User) => void;
  friendsOnly?: boolean;
}

export const UserSearchModal: React.FC<Props> = ({ onClose, onSelectUser, friendsOnly }) => {
  const [query, setQuery]         = useState('');
  const [allUsers, setAllUsers]   = useState<User[]>([]);
  const [results, setResults]     = useState<User[]>([]);
  const [onlineIds, setOnlineIds] = useState<string[]>([]);
  const [loading, setLoading]     = useState(true);
  const [searching, setSearching] = useState(false);
  const [loadError, setLoadError] = useState('');
  const { user: currentUser, token, hydrate } = useAuthStore();

  const emptyQueryUsers = useCallback((users: User[]) => {
    const priorityRoles = new Set(['ADMIN', 'LANDLORD']);
    if (friendsOnly) return users;
    return [...users].sort((a, b) => {
      const aPriority = priorityRoles.has((a.role ?? '').toUpperCase());
      const bPriority = priorityRoles.has((b.role ?? '').toUpperCase());
      if (aPriority && !bPriority) return -1;
      if (!aPriority && bPriority) return 1;
      return 0;
    });
  }, [friendsOnly]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const isLocalSession = token?.startsWith('local-') ?? false;

  const localDirectory = useCallback(() => {
    return getLocalUsers().filter((item) => item.id !== currentUser?.id) as User[];
  }, [currentUser?.id]);

  /* Load ALL platform users + online list on mount */
  useEffect(() => {
    setLoading(true);
    setLoadError('');
    const usersPromise = isLocalSession
      ? Promise.resolve({ data: localDirectory() })
      : friendsOnly 
        ? api.get('/friendships') 
        : api.get('/users/search', { params: { q: '' } });

    Promise.all([
      usersPromise.catch(() => {
        setLoadError('Could not load members from the server. Please sign in again if this keeps happening.');
        return { data: [] };
      }),
      isLocalSession ? Promise.resolve({ data: [] }) : api.get('/users/online').catch(() => ({ data: [] })),
    ]).then(([usersRes, onlineRes]) => {
      const users: User[] = usersRes.data ?? [];
      const onlineUsersList = onlineRes.data ?? [];
      const onlineIdsList = onlineUsersList.map((u: any) => u.id);
      setOnlineIds(onlineIdsList);

      const sortedUsers = [...users].sort((a, b) => {
        const aOnline = onlineIdsList.includes(a.id);
        const bOnline = onlineIdsList.includes(b.id);
        if (aOnline && !bOnline) return -1;
        if (!aOnline && bOnline) return 1;
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      });

      setAllUsers(sortedUsers);
      setResults(emptyQueryUsers(sortedUsers));
    }).finally(() => setLoading(false));
  }, [emptyQueryUsers, friendsOnly, isLocalSession, localDirectory]);

  /* Debounced live search – 300 ms */
  const runSearch = useCallback((q: string) => {
    const term = q.trim();

    if (!term) {
      setResults(emptyQueryUsers(allUsers));
      return;
    }

    // Client-side filter first for instant feedback
    const lower = term.toLowerCase();
    const local = allUsers.filter(u =>
      [u.firstName, u.lastName, u.email, u.phone, u.whatsapp, u.location]
        .some(v => v?.toLowerCase().includes(lower)),
    );
    setResults(local);

    // Confirm with server (may find users not yet loaded client-side)
    setSearching(true);
    const searchPromise = friendsOnly || isLocalSession
      ? Promise.resolve({ data: local }) // already have all local/friend results
      : api.get('/users/search', { params: { q: term } });
      
    searchPromise
      .then(res => {
        const resUsers: User[] = res.data ?? [];
        const sorted = [...resUsers].sort((a, b) => {
          const aOnline = onlineIds.includes(a.id);
          const bOnline = onlineIds.includes(b.id);
          if (aOnline && !bOnline) return -1;
          if (!aOnline && bOnline) return 1;
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        });
        setResults(sorted);
        setLoadError('');
      })
      .catch(() => {
        setLoadError('Search is offline right now. Showing the members already loaded here.');
      })
      .finally(() => setSearching(false));
  }, [allUsers, emptyQueryUsers, onlineIds, friendsOnly, isLocalSession]);

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

  /** Best contact hint to show under the name */
  function contactHint(user: User): string {
    if (user.email) return user.email;
    if (user.phone) return user.phone;
    if (user.whatsapp) return `WhatsApp: ${user.whatsapp}`;
    if (user.location) return user.location;
    return '';
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl sm:rounded-2xl"
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
              <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[hsl(var(--primary))]" />
            )}
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Name, email, phone or location…"
              className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 pl-9 pr-9 text-sm text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))] transition focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
            />
          </div>
          {query && (
            <p className="mt-1.5 text-[11px] text-[hsl(var(--muted-foreground))]">
              {results.length} result{results.length !== 1 ? 's' : ''} for "<span className="font-medium">{query}</span>"
            </p>
          )}
          {loadError && (
            <p className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-600">
              {loadError}
            </p>
          )}
        </div>

        {/* List */}
        <div className="max-h-[360px] overflow-y-auto pb-2 scrollbar-thin">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-[hsl(var(--muted-foreground))]">
              <Loader2 size={18} className="animate-spin" /> Loading members…
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Search size={32} className="text-[hsl(var(--muted-foreground))]/30" />
              <div>
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">No members found</p>
                <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                  Try searching by first name, last name, email, phone, or WhatsApp number
                </p>
              </div>
            </div>
          )}

          {!loading && results.map(user => {
            const isOnline = onlineIds.includes(user.id);
            const hint = contactHint(user);

            return (
              <button
                key={user.id}
                onClick={() => { onSelectUser(user); onClose(); }}
                className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors duration-150 hover:bg-[hsl(var(--muted))]/50 active:bg-[hsl(var(--muted))]/80"
              >
                {/* Avatar + online dot */}
                <div className="relative shrink-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-[hsl(var(--border))]"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--primary))]/15 text-sm font-bold text-[hsl(var(--primary))]">
                      {user.firstName?.[0] ?? '?'}{user.lastName?.[0] ?? ''}
                    </div>
                  )}
                  <span
                    className={cn(
                      'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-[hsl(var(--card))]',
                      isOnline ? 'bg-emerald-400' : 'bg-[hsl(var(--muted-foreground))]/40',
                    )}
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  {/* Name row */}
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-[hsl(var(--foreground))]">
                      {user.firstName} {user.lastName}
                    </span>
                    {user.verified && (
                      <CheckCircle2 size={13} className="shrink-0 text-[hsl(var(--primary))]" />
                    )}
                  </div>

                  {/* Subtitle row */}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn(
                      'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                      isOnline
                        ? 'bg-emerald-400/15 text-emerald-500'
                        : 'bg-[hsl(var(--muted))]/60 text-[hsl(var(--muted-foreground))]',
                    )}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>

                    {user.role && (
                      <span className="shrink-0 rounded-full bg-[hsl(var(--primary))]/10 px-1.5 py-0.5 text-[10px] font-medium text-[hsl(var(--primary))]">
                        {roleLabel(user.role)}
                      </span>
                    )}

                    {hint && (
                      <span className="flex min-w-0 items-center gap-0.5 truncate text-[11px] text-[hsl(var(--muted-foreground))]">
                        {(user.phone || user.whatsapp) && !user.email
                          ? <Phone size={10} className="shrink-0" />
                          : user.location && !user.email && !user.phone
                          ? <MapPin size={10} className="shrink-0" />
                          : null}
                        <span className="truncate">{hint}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Chat caret */}
                <MessageCircle size={15} className="shrink-0 text-[hsl(var(--primary))]/40" />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="border-t border-[hsl(var(--border))] px-5 py-3 text-center text-[11px] text-[hsl(var(--muted-foreground))]">
            {results.length > 0
              ? `${results.length} member${results.length !== 1 ? 's' : ''} — click to start chatting`
              : 'Search by name · email · phone · WhatsApp · location'}
          </div>
        )}
      </div>
    </div>
  );
};
