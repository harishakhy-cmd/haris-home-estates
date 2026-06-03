'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, UserRound, MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const { user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const profileHref = user ? '/profile' : '/auth';
  const chatHref = user ? '/dashboard/chat' : '/auth';

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/properties', label: 'Search', icon: Search },
    { href: chatHref, label: 'Chat', icon: MessageCircle },
    { href: '/dashboard/tenant', label: 'Saved', icon: Heart },
    { href: profileHref, label: 'Account', icon: UserRound },
  ];


  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-lg md:hidden">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Exact match for Home, prefix match for others to keep highlight when deep routing
          const isActive = item.href === '/' 
            ? pathname === '/' 
            : pathname === item.href || pathname?.startsWith(item.href + '/') || (item.href === '/properties' && (pathname === '/property' || pathname === '/property/'));
          
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex w-16 flex-col items-center justify-center gap-1 py-1 text-[10px] font-semibold transition-all duration-200",
                isActive ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={20} className={cn("transition-transform duration-200", isActive && "stroke-[2.5px]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
