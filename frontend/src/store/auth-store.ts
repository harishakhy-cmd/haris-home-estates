'use client';

import { create } from 'zustand';

type User = { id: string; email?: string | null; phone?: string | null; whatsapp?: string | null; firstName: string; lastName: string; role: 'TENANT' | 'LANDLORD' | 'ADMIN'; landlordApproved?: boolean; avatarUrl?: string | null; momoNumber?: string; momoProvider?: string; bankName?: string; bankAccount?: string; paymentPreference?: string };

type AuthState = {
  user: User | null;
  token: string | null;
  setSession: (token: string, user: User) => void;
  updateUser: (user: Partial<User>) => void;
  hydrate: () => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setSession: (token, user) => {
    localStorage.setItem('haris_token', token);
    localStorage.setItem('haris_user', JSON.stringify(user));
    set({ token, user });
  },
  updateUser: (patch) => set((state) => {
    if (!state.user) return state;
    const user = { ...state.user, ...patch };
    localStorage.setItem('haris_user', JSON.stringify(user));
    return { ...state, user };
  }),
  hydrate: () => {
    const token = localStorage.getItem('haris_token');
    const rawUser = localStorage.getItem('haris_user');
    set({ token, user: rawUser ? JSON.parse(rawUser) : null });
  },
  logout: () => {
    localStorage.removeItem('haris_token');
    localStorage.removeItem('haris_user');
    set({ token: null, user: null });
  },
}));
