const CITY_COORDINATES = {
  dhaka: [23.8103, 90.4125],
  chattogram: [22.3569, 91.7832],
  khulna: [22.8456, 89.5403],
  rajshahi: [24.3745, 88.6042],
  sylhet: [24.8949, 91.8687],
}

export function normalizeProfessional(item) {
  const location = item.location || item.institution?.address || item.institution?.district || 'Bangladesh'
  const cityKey = Object.keys(CITY_COORDINATES).find((city) => location.toLowerCase().includes(city))
  const coordinates = item.latitude && item.longitude
    ? [item.latitude, item.longitude]
    : item.institution?.latitude && item.institution?.longitude
      ? [item.institution.latitude, item.institution.longitude]
      : CITY_COORDINATES[cityKey] || null

  return {
    ...item,
    role: item.providerType || 'Care professional',
    specialties: item.specialties?.length ? item.specialties.map((entry) => entry.specialty.name) : (item.specialty || 'General developmental support').split(';').map((value) => value.trim()).filter(Boolean),
    degrees: item.degrees?.length ? item.degrees.map((entry) => entry.degree.name) : (item.qualification || '').split(',').map((value) => value.trim()).filter(Boolean),
    location,
    coordinates,
    distanceKm: '—',
    price: item.consultationFee || 'Contact for fee',
    availability: item.appointmentMethod || 'Contact provider',
    visitingDays: item.visitingDays,
    visitingHours: item.visitingHours,
    chamber: item.chamber,
    phone: item.phone,
    appointmentMethod: item.appointmentMethod,
    verified: item.verificationStatus === 'VERIFIED',
  }
}

export function normalizeInstitution(item) {
  return {
    ...item,
    type: item.type || 'Institution / care centre',
    location: item.address || item.district || 'Bangladesh',
    coordinates: item.latitude && item.longitude ? [item.latitude, item.longitude] : null,
    distanceKm: '—',
    ageRange: item.ageRange || 'All ages',
    facilities: [item.ownership, item.status].filter(Boolean),
  }
}