import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
};

interface Props {
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

export const UserSearchModal: React.FC<Props> = ({ onClose, onSelectUser }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) { setResults([]); return; }
    setLoading(true);
    api.get('/users/search', { params: { q: query } })
      .then(res => setResults(res.data ?? []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">Start Direct Chat</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/60">
            <X size={18} />
          </button>
        </div>
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search members..."
            className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 pl-9 pr-4 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--primary))]"
          />
        </div>
        {loading && <div className="text-center py-2">Loading...</div>}
        <div className="max-h-80 overflow-y-auto">
          {results.length === 0 && !loading && <p className="text-sm text-[hsl(var(--muted-foreground))]">No members found.</p>}
          {results.map(user => (
            <button
              key={user.id}
              onClick={() => { onSelectUser(user); onClose(); }}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg p-2 hover:bg-[hsl(var(--muted))]/50',
                'text-left text-sm text-[hsl(var(--foreground))]'
              )}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-xs font-medium text-[hsl(var(--foreground))]">
                  {user.firstName?.[0] ?? '?'}{user.lastName?.[0] ?? ''}
                </div>
              )}
              <span>{user.firstName} {user.lastName}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
