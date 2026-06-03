'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, Heart, UserRound, MessageCircle, Settings, HelpCircle, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useSettingsStore } from '@/store/settings-store';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { NotificationBell } from './notification-bell';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrate } = useAuthStore();
  const { setShowSettingsModal } = useSettingsStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const profileHref = user ? '/profile' : '/auth';
  const chatHref = user ? '/dashboard/chat' : '/auth';

  const menuItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/properties', label: 'Listings', icon: Search },
    { href: chatHref, label: 'Messages', icon: MessageCircle, protected: true },
    { href: '/dashboard/tenant', label: 'Saved', icon: Heart, protected: true },
    { href: profileHref, label: 'Profile', icon: UserRound },
  ];

  // If landlord, show landlord dashboard link
  if (user?.role === 'LANDLORD') {
    menuItems.push({ href: '/dashboard/landlord', label: 'Landlord Portal', icon: LayoutDashboard });
  }

  // If admin, show admin panel link
  if (user?.role === 'ADMIN') {
    menuItems.push({ href: '/admin', label: 'Admin Control', icon: LayoutDashboard });
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]/40 backdrop-blur-xl shrink-0 z-30">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-[hsl(var(--border))]">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-wider text-[hsl(var(--foreground))]">
          <img src="/haris-logo.png" alt="HARIS logo" className="w-8 h-8 object-contain" />
          HARIS
        </Link>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-md shadow-[hsl(var(--primary))]/20 scale-[1.02]"
                  : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/50 hover:text-[hsl(var(--foreground))]"
              )}
            >
              <Icon size={18} className={cn("shrink-0", isActive ? "stroke-[2.5px]" : "")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Actions & Settings Footer */}
      <div className="p-4 border-t border-[hsl(var(--border))] space-y-1.5">
        {/* Settings button */}
        <button
          onClick={() => setShowSettingsModal(true)}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/50 hover:text-[hsl(var(--foreground))] transition-all duration-200"
        >
          <Settings size={18} className="shrink-0" />
          <span>Appearance</span>
        </button>

        {/* User profile / Guest section */}
        <div className="pt-2">
          {user ? (
            <div className="flex items-center gap-3 p-2 rounded-xl bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))]/30">
              <img
                src={user.avatarUrl ?? '/default-avatar.png'}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-9 h-9 rounded-full object-cover border border-[hsl(var(--border))]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName}%20${user.lastName}`;
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[hsl(var(--foreground))] truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] capitalize truncate">
                  {user.role.toLowerCase()}
                </p>
              </div>
            </div>
          ) : (
            <Link
              href="/auth"
              className="flex items-center justify-center w-full h-10 rounded-xl bg-[hsl(var(--primary))]/10 text-xs font-bold text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/20 transition-all duration-200"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
