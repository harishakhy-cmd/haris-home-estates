'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera, LogOut, Save } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { defaultAvatarForUser } from '@/lib/avatar';
import { useAuthStore } from '@/store/auth-store';

export default function ProfilePage() {
  const { user, hydrate, updateUser, logout } = useAuthStore();
  const [avatarUrl, setAvatarUrl] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    setAvatarUrl(user?.avatarUrl ?? '');
  }, [user?.avatarUrl]);

  if (!user) {
    return (
      <main>
        <Header />
        <section className="mx-auto grid min-h-[calc(100vh-70px)] max-w-lg place-items-center px-4">
          <Card className="space-y-4 p-6 text-center shadow-soft">
            <h1 className="text-2xl font-bold">Profile access required</h1>
            <p className="text-muted-foreground">Sign in to view and update your HARIS profile.</p>
            <Link href="/auth" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground">Sign in</Link>
          </Card>
        </section>
      </main>
    );
  }

  const roleLabel = user.role.charAt(0) + user.role.slice(1).toLowerCase();
  const status = user.role === 'LANDLORD' ? (user.landlordApproved ? 'Approved landlord' : 'Awaiting admin approval') : roleLabel;

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-3xl px-4 py-8">
        <Card className="overflow-hidden shadow-soft">
          <div className="border-b border-border p-6">
            <h1 className="text-3xl font-bold">User profile</h1>
            <p className="mt-1 text-muted-foreground">Manage your account preview, role status, and profile photo.</p>
          </div>
          <div className="grid gap-6 p-6 md:grid-cols-[180px_1fr]">
            <div className="space-y-3">
              <img src={avatarUrl || defaultAvatarForUser(user)} alt={`${user.firstName} ${user.lastName}`} className="aspect-square w-full rounded-lg border border-border object-cover" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Camera size={16} /> Profile photo</div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-xl font-semibold">{user.firstName} {user.lastName}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-semibold">{roleLabel}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-semibold">{status}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account contact</p>
                <p className="font-semibold">{user.email ?? user.phone ?? 'No contact saved'}</p>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-semibold">Custom profile photo URL</span>
                <Input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="Paste an image URL, or leave blank to use your email profile photo" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold">Upload from device</span>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      setAvatarUrl(String(reader.result));
                      setNotice('Photo loaded. Save it to update your profile preview.');
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              {notice && <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{notice}</p>}
              <div className="grid gap-3 md:grid-cols-2">
                <Button onClick={() => { updateUser({ avatarUrl: avatarUrl || null }); setNotice('Profile photo updated.'); }}><Save size={17} /> Save profile photo</Button>
                <Button className="bg-card text-foreground ring-1 ring-border" onClick={logout}><LogOut size={17} /> Sign out</Button>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
