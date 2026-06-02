type LocalPropertyInput = {
  id?: string;
  title: string;
  description: string;
  price: number;
  city: string;
  district?: string;
  region?: string;
  address?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  imageUrls?: string[];
  youtubeUrls?: string[];
  amenityNames?: string[];
  nearbyFacilities?: string[];
  landlord: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    email?: string | null;
  };
};

const LOCAL_PROPERTIES_KEY = 'haris_local_properties';

function inferRegion(city: string) {
  const value = city.trim().toLowerCase();
  if (['kampala', 'wakiso', 'mukono', 'masaka'].includes(value)) return 'central';
  if (['jinja', 'mbale', 'iganga', 'soroti'].includes(value)) return 'eastern';
  if (['mbarara', 'kasese', 'kabale', 'fort portal'].includes(value)) return 'western';
  if (['gulu', 'lira', 'kitgum', 'arua'].includes(value)) return 'northern';
  return 'central';
}

export function getLocalProperties() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_PROPERTIES_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveLocalProperties(items: any[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_PROPERTIES_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('haris-local-properties'));
}

export function getLocalPropertyById(propertyId: string) {
  return getLocalProperties().find((property: any) => property.id === propertyId) ?? null;
}

export function createLocalProperty(input: LocalPropertyInput) {
  const items = getLocalProperties();
  const id = input.id ?? `local-property-${Date.now()}`;
  const next = {
    id,
    title: input.title,
    description: input.description,
    price: Number(input.price),
    city: input.city,
    district: input.district || input.city,
    region: input.region || inferRegion(input.city),
    currency: 'UGX',
    propertyType: (input.propertyType || 'APARTMENT').toUpperCase(),
    bedrooms: Number(input.bedrooms ?? 0),
    bathrooms: Number(input.bathrooms ?? 0),
    address: input.address || '',
    status: 'ACTIVE',
    availabilityStatus: 'AVAILABLE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    images: (input.imageUrls ?? []).filter(Boolean).map((url) => ({ url })),
    youtubeUrls: (input.youtubeUrls ?? []).filter(Boolean),
    amenities: (input.amenityNames ?? []).filter(Boolean).map((name) => ({ name })),
    nearbyFacilities: (input.nearbyFacilities ?? []).filter(Boolean),
    units: [],
    landlord: {
      id: input.landlord.id,
      firstName: input.landlord.firstName,
      lastName: input.landlord.lastName,
      phone: input.landlord.phone ?? null,
      email: input.landlord.email ?? null,
      verified: false,
      verificationBadge: false,
    },
  };
  saveLocalProperties([next, ...items.filter((item: any) => item.id !== id)]);
  return next;
}

export function updateLocalProperty(propertyId: string, input: LocalPropertyInput) {
  const items = getLocalProperties();
  const existing = items.find((item: any) => item.id === propertyId);
  if (!existing) return createLocalProperty({ ...input, id: propertyId });
  const updated = {
    ...existing,
    title: input.title,
    description: input.description,
    price: Number(input.price),
    city: input.city,
    district: input.district || existing.district || input.city,
    region: input.region || existing.region || inferRegion(input.city),
    address: input.address || '',
    propertyType: (input.propertyType || existing.propertyType || 'APARTMENT').toUpperCase(),
    bedrooms: Number(input.bedrooms ?? 0),
    bathrooms: Number(input.bathrooms ?? 0),
    images: (input.imageUrls ?? []).filter(Boolean).map((url) => ({ url })),
    youtubeUrls: (input.youtubeUrls ?? []).filter(Boolean),
    amenities: (input.amenityNames ?? []).filter(Boolean).map((name) => ({ name })),
    nearbyFacilities: (input.nearbyFacilities ?? []).filter(Boolean),
    updatedAt: new Date().toISOString(),
  };
  saveLocalProperties(items.map((item: any) => item.id === propertyId ? updated : item));
  return updated;
}

export function deleteLocalProperty(propertyId: string) {
  const items = getLocalProperties();
  saveLocalProperties(items.filter((item: any) => item.id !== propertyId));
}
