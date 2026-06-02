const keyFor = (userId: string, type: 'favorites' | 'viewed') => `haris_tenant_${userId}_${type}`;

const cleanProperty = (property: any) => ({
  id: property.id,
  title: property.title,
  city: property.city,
  district: property.district,
  price: property.price,
  currency: property.currency,
  propertyType: property.propertyType,
  bedrooms: property.bedrooms,
  bathrooms: property.bathrooms,
  description: property.description,
  images: property.images ?? [],
  amenities: property.amenities ?? [],
  landlord: property.landlord,
  viewedAt: new Date().toISOString(),
});

function readList(userId: string, type: 'favorites' | 'viewed') {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    return JSON.parse(localStorage.getItem(keyFor(userId, type)) ?? '[]');
  } catch {
    return [];
  }
}

function writeList(userId: string, type: 'favorites' | 'viewed', properties: any[]) {
  if (typeof window === 'undefined' || !userId) return;
  localStorage.setItem(keyFor(userId, type), JSON.stringify(properties));
  window.dispatchEvent(new Event('haris-tenant-activity'));
}

export function getTenantFavorites(userId: string) {
  return readList(userId, 'favorites');
}

export function getTenantViewed(userId: string) {
  return readList(userId, 'viewed');
}

export function isTenantFavorite(userId: string, propertyId: string) {
  return getTenantFavorites(userId).some((property: any) => property.id === propertyId);
}

export function addTenantFavorite(userId: string, property: any) {
  const current = getTenantFavorites(userId).filter((item: any) => item.id !== property.id);
  writeList(userId, 'favorites', [cleanProperty(property), ...current]);
}

export function removeTenantFavorite(userId: string, propertyId: string) {
  writeList(userId, 'favorites', getTenantFavorites(userId).filter((property: any) => property.id !== propertyId));
}

export function addTenantViewed(userId: string, property: any) {
  const current = getTenantViewed(userId).filter((item: any) => item.id !== property.id);
  writeList(userId, 'viewed', [cleanProperty(property), ...current].slice(0, 24));
}

export function getLocalBookings() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('haris_local_bookings') ?? '[]');
  } catch {
    return [];
  }
}

export function addLocalBooking(booking: any) {
  const current = getLocalBookings();
  const newBooking = { id: `local-booking-${Date.now()}`, status: 'PENDING', createdAt: new Date().toISOString(), ...booking };
  localStorage.setItem('haris_local_bookings', JSON.stringify([newBooking, ...current]));
  window.dispatchEvent(new Event('haris-tenant-activity'));
  return newBooking;
}

export function getLocalInquiries() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('haris_local_inquiries') ?? '[]');
  } catch {
    return [];
  }
}

export function addLocalInquiry(inquiry: any) {
  const current = getLocalInquiries();
  const newInquiry = { id: `local-inquiry-${Date.now()}`, status: 'OPEN', createdAt: new Date().toISOString(), ...inquiry };
  localStorage.setItem('haris_local_inquiries', JSON.stringify([newInquiry, ...current]));
  window.dispatchEvent(new Event('haris-tenant-activity'));
  return newInquiry;
}

export function getLocalReviews() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('haris_local_reviews') ?? '[]');
  } catch {
    return [];
  }
}

export function addLocalReview(review: any) {
  const current = getLocalReviews();
  const newReview = { id: `local-review-${Date.now()}`, createdAt: new Date().toISOString(), ...review };
  localStorage.setItem('haris_local_reviews', JSON.stringify([newReview, ...current]));
  window.dispatchEvent(new Event('haris-tenant-activity'));
  return newReview;
}
