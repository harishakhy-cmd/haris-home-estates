type LocalUser = {
  id: string;
  email?: string | null;
  phone?: string | null;
  firstName: string;
  lastName: string;
  role: 'TENANT' | 'LANDLORD' | 'ADMIN';
  landlordApproved?: boolean;
};

const USERS_KEY = 'haris_local_users';
const ADMIN_PASSWORD_HASH = 'fc07f5a84894ef7d91e81c90fdd027f90362305da67041180dfedaa04b26b88f';

type LocalAuthUser = LocalUser & { identifier: string; password?: string; passwordHash?: string };

const seededUsers: LocalAuthUser[] = [
  {
    id: 'local-admin-haris',
    identifier: 'harishakhy@gmail.com',
    email: 'harishakhy@gmail.com',
    passwordHash: ADMIN_PASSWORD_HASH,
    firstName: 'Haris',
    lastName: 'Admin',
    role: 'ADMIN',
    landlordApproved: true,
  },
  {
    id: 'local-tenant-demo',
    identifier: 'tenant@haris.test',
    email: 'tenant@haris.test',
    password: 'Password123!',
    firstName: 'Daniel',
    lastName: 'Okello',
    role: 'TENANT',
    landlordApproved: true,
  },
  {
    id: 'local-landlord-demo',
    identifier: '+256700000001',
    phone: '+256700000001',
    password: 'Password123!',
    firstName: 'Amina',
    lastName: 'Kato',
    role: 'LANDLORD',
    landlordApproved: true,
  },
];

function readUsers() {
  if (typeof window === 'undefined') return seededUsers;
  try {
    const stored = JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]');
    return [...seededUsers, ...stored];
  } catch {
    return seededUsers;
  }
}

function writeUser(user: LocalUser & { password: string; identifier: string }) {
  const stored = readUsers().filter((item) => !seededUsers.some((seeded) => seeded.id === item.id));
  localStorage.setItem(USERS_KEY, JSON.stringify([user, ...stored.filter((item) => item.identifier !== user.identifier)]));
}

async function sha256(value: string) {
  const input = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', input);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function localLogin(identifier: string, password: string) {
  const normalized = identifier.trim().toLowerCase();
  const candidates = readUsers().filter((item) => item.identifier.toLowerCase() === normalized);
  const passwordHash = await sha256(password);
  const user = candidates.find((item) => item.password === password || item.passwordHash === passwordHash);
  if (!user) return null;
  const { password: _password, passwordHash: _passwordHash, identifier: _identifier, ...publicUser } = user;
  return { accessToken: `local-${publicUser.id}`, user: publicUser };
}

export function localRegister(input: {
  identifier: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'TENANT' | 'LANDLORD';
  method: 'email' | 'phone';
}) {
  const identifier = input.identifier.trim();
  const user = {
    id: `local-${input.role.toLowerCase()}-${Date.now()}`,
    identifier,
    email: input.method === 'email' ? identifier : null,
    phone: input.method === 'phone' ? identifier : null,
    password: input.password,
    firstName: input.firstName || (input.role === 'LANDLORD' ? 'Landlord' : 'Tenant'),
    lastName: input.lastName || 'User',
    role: input.role,
    landlordApproved: input.role !== 'LANDLORD',
  } satisfies LocalUser & { password: string; identifier: string };
  writeUser(user);
  const { password: _password, identifier: _identifier, ...publicUser } = user;
  return { accessToken: `local-${publicUser.id}`, user: publicUser };
}

export function getLocalPendingLandlords() {
  return readUsers()
    .filter((user) => user.role === 'LANDLORD' && !user.landlordApproved)
    .map(({ password: _password, passwordHash: _passwordHash, identifier: _identifier, ...publicUser }) => publicUser);
}

export function getLocalUsers() {
  return readUsers().map(({ password: _password, passwordHash: _passwordHash, identifier: _identifier, ...publicUser }) => publicUser);
}

export function approveLocalLandlord(landlordId: string, approved: boolean) {
  const stored = readUsers().filter((item) => !seededUsers.some((seeded) => seeded.id === item.id));
  const updated = stored.map((user) => user.id === landlordId ? { ...user, landlordApproved: approved } : user);
  localStorage.setItem(USERS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('haris-local-users'));
}
