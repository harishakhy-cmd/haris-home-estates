'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Search, UserPlus, Loader2, UserMinus } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type PendingRequest = {
  friendshipId: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    role?: string;
  };
};

interface Props {
  onClose: () => void;
}

export const FriendRequestsModal: React.FC<Props> = ({ onClose }) => {
  const [tab, setTab] = useState<'pending' | 'add'>('pending');
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Add friend state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (tab === 'pending') {
      fetchPending();
    }
  }, [tab]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/friendships/pending');
      setPendingRequests(res.data ?? []);
    } catch {
      toast.error('Failed to load pending requests');
    }
    setLoading(false);
  };

  const handleAccept = async (senderId: string, friendshipId: string) => {
    try {
      await api.post(`/friendships/accept/${senderId}`);
      setPendingRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId));
      toast.success('Friend request accepted');
    } catch {
      toast.error('Failed to accept request');
    }
  };

  const handleDecline = async (senderId: string, friendshipId: string) => {
    try {
      await api.post(`/friendships/decline/${senderId}`);
      setPendingRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId));
      toast.success('Friend request declined');
    } catch {
      toast.error('Failed to decline request');
    }
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get('/users/search', { params: { q } });
      setSearchResults(res.data ?? []);
    } catch {
      // ignore
    }
    setSearching(false);
  };

  const sendRequest = async (userId: string) => {
    try {
      await api.post(`/friendships/request/${userId}`);
      toast.success('Friend request sent!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4">
          <h3 className="text-base font-bold text-[hsl(var(--foreground))]">Friends</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))]/60"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-[hsl(var(--border))]">
          <button
            onClick={() => setTab('pending')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              tab === 'pending'
                ? 'border-b-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
            )}
          >
            Pending Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
          </button>
          <button
            onClick={() => setTab('add')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              tab === 'add'
                ? 'border-b-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
            )}
          >
            Add Friend
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {tab === 'pending' && (
            <div className="space-y-3">
              {loading && <div className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]"><Loader2 className="mx-auto animate-spin" /></div>}
              {!loading && pendingRequests.length === 0 && (
                <div className="py-12 text-center">
                  <UserPlus className="mx-auto mb-3 h-10 w-10 text-[hsl(var(--muted-foreground))]/30" />
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">No pending requests</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">When someone adds you, it will appear here.</p>
                </div>
              )}
              {!loading &&
                pendingRequests.map((req) => (
                  <div key={req.friendshipId} className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-3">
                    <div className="relative shrink-0">
                      {req.sender.avatarUrl ? (
                        <img src={req.sender.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--primary))]/15 text-sm font-bold text-[hsl(var(--primary))]">
                          {req.sender.firstName[0]}
                          {req.sender.lastName[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[hsl(var(--foreground))]">
                        {req.sender.firstName} {req.sender.lastName}
                      </p>
                      <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">{req.sender.role}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => handleAccept(req.sender.id, req.friendshipId)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] transition hover:bg-[hsl(var(--primary))]/90"
                        title="Accept"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleDecline(req.sender.id, req.friendshipId)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500 transition hover:bg-red-500/20"
                        title="Decline"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {tab === 'add' && (
            <div className="space-y-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <input
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search by name, email, or phone..."
                  className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                />
              </div>

              {searching && <div className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]"><Loader2 className="mx-auto animate-spin" /></div>}

              {!searching && searchResults.length > 0 && (
                <div className="space-y-3">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] p-3">
                      <div className="relative shrink-0">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--primary))]/15 text-sm font-bold text-[hsl(var(--primary))]">
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[hsl(var(--foreground))]">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">
                          {user.location || user.role || 'User'}
                        </p>
                      </div>
                      <button
                        onClick={() => sendRequest(user.id)}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[hsl(var(--primary))]/10 px-3 py-1.5 text-xs font-semibold text-[hsl(var(--primary))] transition hover:bg-[hsl(var(--primary))]/20"
                      >
                        <UserPlus size={14} /> Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
