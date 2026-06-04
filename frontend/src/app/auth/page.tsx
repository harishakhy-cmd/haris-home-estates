'use client';

import { useEffect, useState } from 'react';
import { Building2, Mail, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signInWithPopup } from 'firebase/auth';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { firebaseAuth, googleProvider } from '@/lib/firebase';
import { localLogin, localRegister } from '@/lib/local-auth';
import { useAuthStore } from '@/store/auth-store';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [role, setRole] = useState<'TENANT' | 'LANDLORD' | 'ADMIN'>('TENANT');
  const [identifier, setIdentifier] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const setSession = useAuthStore((state) => state.setSession);

  function afterAuthPath(nextUser: { role: string }) {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect?.startsWith('/')) return redirect;
    return nextUser.role === 'TENANT' ? '/dashboard/tenant' : nextUser.role === 'LANDLORD' ? '/dashboard/landlord' : '/admin';
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('role') === 'LANDLORD') {
      setRole('LANDLORD');
      setMode('register');
      setMethod('phone');
    }
    if (params.get('role') === 'ADMIN') {
      setRole('ADMIN');
      setMode('login');
      setMethod('email');
    }
  }, []);

  async function login() {
    try {
      const { data } = await api.post('/auth/login', { identifier, password });
      setSession(data.accessToken, data.user);
      setNotice(`Signed in as ${data.user.firstName}.`);
      router.push(afterAuthPath(data.user));
    } catch {
      const local = await localLogin(identifier, password);
      if (local) {
        setSession(local.accessToken, local.user);
        setNotice(`Signed in locally as ${local.user.firstName}.`);
        router.push(afterAuthPath(local.user));
        return;
      }
      setNotice(role === 'LANDLORD'
        ? 'Could not sign in as a landlord. Check your WhatsApp/contact or password, or register a landlord account first.'
        : role === 'ADMIN'
          ? 'Could not sign in as admin. Enter the authorized admin email and password.'
          : 'Could not sign in. Check your email/contact and password, or create a tenant account first.');
    }
  }

  async function register() {
    if (role === 'ADMIN') {
      setNotice('Admin registration is disabled. Use the authorized admin sign-in credentials.');
      return;
    }
    if (role === 'LANDLORD' && (!identifier || !whatsapp)) {
      setNotice('Landlord registration requires both an Email and a WhatsApp contact number.');
      return;
    }
    try {
      const payload = {
        firstName,
        lastName,
        password,
        role,
        ...(role === 'LANDLORD' ? { email: identifier, whatsapp } : method === 'email' ? { email: identifier } : { phone: identifier }),
      };
      const { data } = await api.post('/auth/register', payload);
      setSession(data.accessToken, data.user);
      setNotice(role === 'LANDLORD' ? 'Landlord account created. Awaiting admin approval.' : 'Tenant account created.');
      router.push(afterAuthPath(data.user));
    } catch {
      const local = localRegister({ identifier, password, firstName, lastName, role, method, whatsapp });
      setSession(local.accessToken, local.user);
      setNotice(role === 'LANDLORD' ? 'Landlord account created. Awaiting admin approval.' : 'Tenant account created locally.');
      router.push(afterAuthPath(local.user));
    }
  }

  async function continueWithGoogle() {
    try {
      const credential = await signInWithPopup(firebaseAuth, googleProvider);
      const firebaseUser = credential.user;
      const token = await firebaseUser.getIdToken();

      const res = await api.post('/auth/google-login', { idToken: token });
      setSession(res.data.accessToken, res.data.user);
      setNotice(role === 'LANDLORD' ? 'Google landlord session created. Awaiting admin approval.' : 'Google tenant session created.');
      router.push(afterAuthPath(res.data.user));
    } catch {
      setNotice('Google sign-in could not complete. Check Firebase authorized domains and popup settings.');
    }
  }

  return (
    <main>
      <Header />
      <section className="mx-auto grid min-h-[calc(100vh-70px)] max-w-md place-items-center px-4">
        <Card className="w-full space-y-4 p-6 shadow-soft">
          <div className="grid size-12 place-items-center rounded-md bg-primary text-primary-foreground"><Building2 /></div>
          <div>
            <h1 className="text-2xl font-bold">Welcome to HARIS</h1>
            <p className="mt-1 text-sm text-muted-foreground">Use email, contact number, or Google. Admin can sign in with the seeded credentials.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-1">
            {(['login', 'register'] as const).map((item) => (
              <button key={item} type="button" className={`h-9 rounded-md text-sm font-semibold ${mode === item ? 'bg-card shadow-sm' : 'text-muted-foreground'}`} onClick={() => setMode(item)}>
                {item === 'login' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={`flex h-10 items-center justify-center gap-2 rounded-md border text-sm ${method === 'email' ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`} onClick={() => setMethod('email')}>
              <Mail size={16} /> Email
            </button>
            <button type="button" className={`flex h-10 items-center justify-center gap-2 rounded-md border text-sm ${method === 'phone' ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`} onClick={() => setMethod('phone')}>
              <Phone size={16} /> {role === 'LANDLORD' && mode === 'login' ? 'WhatsApp' : 'Contact'}
            </button>
          </div>
          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-1">
                {(['TENANT', 'LANDLORD'] as const).map((item) => (
                  <button key={item} type="button" className={`h-9 rounded-md text-sm font-semibold ${role === item ? 'bg-card shadow-sm' : 'text-muted-foreground'}`} onClick={() => { setRole(item); if (item === 'LANDLORD') setMethod('phone'); }}>
                    {item === 'TENANT' ? 'Tenant' : 'Landlord'}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" />
                <Input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last name" />
              </div>
            </>
          )}
          {role === 'ADMIN' && (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">Admin access is restricted to the authorized admin account.</p>
          )}
          {mode === 'register' && role === 'LANDLORD' ? (
            <>
              <Input value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="Email address" />
              <Input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="WhatsApp contact (e.g. +256700000000)" />
            </>
          ) : (
            <Input value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={method === 'email' ? 'Email address' : role === 'LANDLORD' ? 'WhatsApp contact (e.g. +256700000000)' : 'Contact (e.g. +256700000000)'} />
          )}
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
          {notice && <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{notice}</p>}
          <Button className="w-full" onClick={mode === 'login' ? login : register}>{mode === 'login' ? 'Sign in' : `Create ${role.toLowerCase()} account`}</Button>
          <button type="button" className="flex h-11 items-center justify-center rounded-md border border-border text-sm font-semibold" onClick={continueWithGoogle}>
            Continue with Google
          </button>
        </Card>
      </section>
    </main>
  );
}
