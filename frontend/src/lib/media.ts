export function googleDriveImageUrl(url: string) {
  const match = url.match(/\/file\/d\/([^/]+)/) ?? url.match(/[?&]id=([^&]+)/);
  return match?.[1] ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1600` : url;
}

export function youtubeEmbedUrl(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
  return match?.[1] ? `https://www.youtube.com/embed/${match[1]}` : url;
}

export function normalizeWhatsAppPhone(phone: string) {
  const digits = phone.replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0') && digits.length >= 9) return `256${digits.slice(1)}`;
  if (digits.startsWith('7') && digits.length === 9) return `256${digits}`;
  return digits;
}

export function whatsappUrl(phone: string, message: string) {
  const clean = normalizeWhatsAppPhone(phone);
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
