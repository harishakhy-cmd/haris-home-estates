export const ugandaRegions = [
  {
    name: 'Central Uganda',
    slug: 'central',
    districts: ['Kampala', 'Wakiso', 'Mukono', 'Masaka', 'Mityana', 'Luweero'],
    locations: ['Kololo', 'Ntinda', 'Kira', 'Entebbe', 'Nansana', 'Mukono town'],
    mapQuery: 'Central Region Uganda',
  },
  {
    name: 'Eastern Uganda',
    slug: 'eastern',
    districts: ['Jinja', 'Mbale', 'Tororo', 'Iganga', 'Soroti', 'Busia'],
    locations: ['Jinja city', 'Mbale city', 'Njeru', 'Tororo municipality', 'Soroti city'],
    mapQuery: 'Eastern Region Uganda',
  },
  {
    name: 'Northern Uganda',
    slug: 'northern',
    districts: ['Gulu', 'Lira', 'Arua', 'Kitgum', 'Adjumani', 'Moyo'],
    locations: ['Gulu city', 'Lira city', 'Arua city', 'Kitgum town', 'Adjumani town'],
    mapQuery: 'Northern Region Uganda',
  },
  {
    name: 'Western Uganda',
    slug: 'western',
    districts: ['Mbarara', 'Fort Portal', 'Hoima', 'Kabale', 'Kasese', 'Bushenyi'],
    locations: ['Mbarara city', 'Fort Portal city', 'Hoima city', 'Kabale town', 'Kasese town'],
    mapQuery: 'Western Region Uganda',
  },
];

export function googleMapUrl(query: string, satellite = false, zoom = 7) {
  const params = new URLSearchParams({
    q: query,
    z: String(zoom),
    output: 'embed',
  });
  if (satellite) params.set('t', 'k');
  return `https://maps.google.com/maps?${params.toString()}`;
}

export function googleMapSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function googleMapDirectionsUrl(origin: string, destination: string) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}
