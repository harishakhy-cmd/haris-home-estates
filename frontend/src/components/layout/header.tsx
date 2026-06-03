'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Moon, Search, Sun, UserRound } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { defaultAvatarForUser } from '@/lib/avatar';
import { NotificationBell } from './notification-bell';

const navLinks = [
  { href: '/properties', label: 'Listings' },
  { href: '/dashboard/tenant', label: 'Tenant' },
  { href: '/dashboard/landlord', label: 'Landlord' },
  { href: '/admin', label: 'Admin' },
];

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const roleLabel = user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : 'Guest';
  const statusLabel = user?.role === 'LANDLORD'
    ? user.landlordApproved ? 'Approved' : 'Pending'
    : user?.role === 'ADMIN' ? 'Admin' : user?.role === 'TENANT' ? 'Tenant' : 'Sign in';

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="relative size-10 overflow-hidden rounded-md bg-card ring-1 ring-border">
            <Image src="/haris-logo.png" alt="HARIS logo" fill className="object-contain p-1" sizes="40px" priority />
          </span>
          HARIS
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {navLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/properties" className={cn('hidden h-11 items-center justify-center gap-2 rounded-md bg-card px-5 text-sm font-semibold text-foreground ring-1 ring-border transition hover:opacity-90 md:inline-flex')}>
            <Search size={16} /> Search
          </Link>
          <Button aria-label="Toggle theme" className="size-11 bg-card p-0 text-foreground ring-1 ring-border" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <Sun className="hidden dark:block" size={17} />
            <Moon className="dark:hidden" size={17} />
          </Button>
          <NotificationBell />
          <Link href={user ? '/profile' : '/auth'} className="flex h-11 items-center gap-2 rounded-md bg-card px-2 pr-3 text-sm ring-1 ring-border transition hover:opacity-90">
            {user ? (
              <img src={defaultAvatarForUser(user)} alt={`${user.firstName} ${user.lastName}`} className="size-8 rounded-full object-cover" />
            ) : (
              <span className="grid size-8 place-items-center rounded-full bg-muted"><UserRound size={16} /></span>
            )}
            <span className="hidden leading-tight sm:block">
              <span className="block max-w-28 truncate font-semibold">{user ? `${user.firstName} ${user.lastName}` : 'Account'}</span>
              <span className="block text-xs text-muted-foreground">{roleLabel} · {statusLabel}</span>
            </span>
          </Link>
        </div>
      </div>
      <nav className="border-t border-border md:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-4 gap-1 px-2 py-2 text-center text-xs font-semibold text-muted-foreground">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-md px-2 py-2 transition hover:bg-muted hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
