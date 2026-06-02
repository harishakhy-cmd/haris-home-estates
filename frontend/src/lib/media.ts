export function googleDriveImageUrl(url: string) {
  const match = url.match(/\/file\/d\/([^/]+)/) ?? url.match(/[?&]id=([^&]+)/);
  return match?.[1] ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1600` : url;
}

export function youtubeEmbedUrl(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
  return match?.[1] ? `https://www.youtube.com/embed/${match[1]}` : url;
}

export function whatsappUrl(phone: string, message: string) {
  const clean = phone.replace(/[^\d]/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
