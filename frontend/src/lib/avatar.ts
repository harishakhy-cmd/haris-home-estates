export function defaultAvatarForUser(user?: { email?: string | null; firstName?: string; lastName?: string; avatarUrl?: string | null }) {
  if (user?.avatarUrl) return user.avatarUrl;
  if (user?.email) return `https://unavatar.io/${encodeURIComponent(user.email)}`;
  const name = encodeURIComponent(`${user?.firstName ?? 'HARIS'} ${user?.lastName ?? 'User'}`.trim());
  return `https://ui-avatars.com/api/?name=${name}&background=16876f&color=fff`;
}
