const CITY_COORDINATES = {
  dhaka: [23.8103, 90.4125],
  chattogram: [22.3569, 91.7832],
  khulna: [22.8456, 89.5403],
  rajshahi: [24.3745, 88.6042],
  sylhet: [24.8949, 91.8687],
  gazipur: [23.9999, 90.4203],
  narayanganj: [23.6238, 90.5000],
  barishal: [22.7010, 90.3535],
  rangpur: [25.7439, 89.2752],
  mymensingh: [24.7471, 90.4203],
}

export function normalizeProfessional(item) {
  const location = item.location || item.chamberAddress || item.chamber || item.institution?.address || item.institution?.district || 'Dhaka, Bangladesh'
  const cityKey = Object.keys(CITY_COORDINATES).find((city) => location.toLowerCase().includes(city))
  const coordinates = item.latitude && item.longitude
    ? [item.latitude, item.longitude]
    : item.institution?.latitude && item.institution?.longitude
      ? [item.institution.latitude, item.institution.longitude]
      : CITY_COORDINATES[cityKey] || [23.8103, 90.4125]

  return {
    ...item,
    role: item.professionType || item.providerType || 'Specialist / Doctor',
    specialties: item.specialties?.length ? item.specialties.map((entry) => entry.specialty?.name || entry.name || entry) : (item.specialty || 'General developmental support').split(';').map((value) => value.trim()).filter(Boolean),
    degrees: item.degrees?.length ? item.degrees.map((entry) => entry.degree?.name || entry.name || entry) : (item.qualification || '').split(',').map((value) => value.trim()).filter(Boolean),
    location,
    coordinates,
    distanceKm: '—',
    price: item.consultationFee || 'Contact for fee',
    availability: item.visitingDays ? `${item.visitingDays} (${item.visitingHours || 'Regular hours'})` : (item.appointmentMethod || 'By Appointment'),
    visitingDays: item.visitingDays,
    visitingHours: item.visitingHours,
    chamber: item.chamber || item.chamberAddress,
    phone: item.phone,
    appointmentMethod: item.appointmentMethod,
    verified: item.verificationStatus === 'VERIFIED',
  }
}

export function normalizeInstitution(item) {
  const location = item.address || item.area || item.district || 'Dhaka, Bangladesh'
  const cityKey = Object.keys(CITY_COORDINATES).find((city) =>
    (item.district || item.area || location).toLowerCase().includes(city)
  )
  const coordinates = item.latitude && item.longitude
    ? [item.latitude, item.longitude]
    : CITY_COORDINATES[cityKey] || [23.8103, 90.4125]

  return {
    ...item,
    type: item.type || 'Special School / Care Centre',
    location,
    coordinates,
    distanceKm: '—',
    ageRange: item.ageRange || 'Children / Adolescents',
    facilities: [item.ownership, item.status].filter(Boolean),
  }
}