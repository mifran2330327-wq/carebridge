export function parseVisitingDays(visitingDays) {
  if (!visitingDays) return []
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const shortDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  
  const str = visitingDays.toLowerCase().trim()
  if (str.includes('daily') || str.includes('everyday') || str.includes('all day') || str.includes('request') || str.includes('any')) {
    return days
  }
  
  const result = new Set()
  
  // Direct word match
  days.forEach((day, idx) => {
    if (str.includes(day) || str.includes(shortDays[idx])) {
      result.add(idx)
    }
  })
  
  // Range match e.g. "sat-tue" or "sat - wed" or "saturday to tuesday"
  const rangeMatch = str.match(/([a-z]{3,9})\s*(?:-|to)\s*([a-z]{3,9})/)
  if (rangeMatch) {
    const startIdx = shortDays.findIndex(s => rangeMatch[1].startsWith(s))
    const endIdx = shortDays.findIndex(s => rangeMatch[2].startsWith(s))
    if (startIdx !== -1 && endIdx !== -1) {
      if (startIdx <= endIdx) {
        for (let i = startIdx; i <= endIdx; i++) result.add(i)
      } else {
        for (let i = startIdx; i < 7; i++) result.add(i)
        for (let i = 0; i <= endIdx; i++) result.add(i)
      }
    }
  }
  
  return Array.from(result)
}

export function parseVisitingHours(visitingHours) {
  if (!visitingHours) return []
  
  const str = visitingHours.toLowerCase().trim()
  const slots = []
  
  // Parse time ranges like "9:00-13:00" or "9:00 AM - 1:00 PM" or "9-13" or "9am-1pm"
  const timeRangeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/gi
  let match
  while ((match = timeRangeRegex.exec(str)) !== null) {
    const [, startHour, startMin, startAmPm, endHour, endMin, endAmPm] = match
    const start = parseTimeToMinutes(startHour, startMin, startAmPm)
    const end = parseTimeToMinutes(endHour, endMin, endAmPm)
    if (start !== null && end !== null && start < end) {
      slots.push({ start, end })
    }
  }
  
  // Also try simpler format like "9-13" or "9:00-13:00"
  const simpleRangeRegex = /(\d{1,2})(?::(\d{2}))?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?/g
  let simpleMatch
  while ((simpleMatch = simpleRangeRegex.exec(str)) !== null) {
    const [, startHour, startMin, endHour, endMin] = simpleMatch
    const start = parseTimeToMinutes(startHour, startMin, null)
    const end = parseTimeToMinutes(endHour, endMin, null)
    if (start !== null && end !== null && start < end) {
      slots.push({ start, end })
    }
  }
  
  return slots
}

function parseTimeToMinutes(hour, minute, amPm) {
  const h = parseInt(hour, 10)
  const m = minute ? parseInt(minute, 10) : 0
  
  if (isNaN(h) || isNaN(m)) return null
  
  let hour24 = h
  if (amPm) {
    const ap = amPm.toLowerCase()
    if (ap === 'pm' && h !== 12) hour24 = h + 12
    if (ap === 'am' && h === 12) hour24 = 0
  }
  
  if (hour24 < 0 || hour24 > 23 || m < 0 || m > 59) return null
  return hour24 * 60 + m
}

export function generateTimeSlots(visitingDays, visitingHours, date, slotDurationMinutes = 30, existingAppointments = []) {
  const dayIndex = new Date(date).getDay() // 0 = Sunday
  const availableDays = parseVisitingDays(visitingDays)
  
  if (!availableDays.includes(dayIndex)) {
    return []
  }
  
  const timeRanges = parseVisitingHours(visitingHours)
  if (timeRanges.length === 0) {
    // Default to 9am-5pm if no hours specified
    return generateSlotsForRange(9 * 60, 17 * 60, slotDurationMinutes, existingAppointments, date)
  }
  
  const allSlots = []
  for (const range of timeRanges) {
    const slots = generateSlotsForRange(range.start, range.end, slotDurationMinutes, existingAppointments, date)
    allSlots.push(...slots)
  }
  
  return allSlots
}

function generateSlotsForRange(startMinutes, endMinutes, slotDurationMinutes, existingAppointments, date) {
  const slots = []
  const dateStr = new Date(date).toISOString().split('T')[0]
  
  for (let minutes = startMinutes; minutes + slotDurationMinutes <= endMinutes; minutes += slotDurationMinutes) {
    const slotStart = new Date(`${dateStr}T${formatMinutesToTime(minutes)}:00`)
    const slotEnd = new Date(slotStart.getTime() + slotDurationMinutes * 60 * 1000)
    
    // Check if slot conflicts with existing appointments
    const isBooked = existingAppointments.some(apt => {
      const aptStart = new Date(apt.scheduledAt)
      const aptEnd = new Date(aptStart.getTime() + 30 * 60 * 1000) // Assume 30 min appointments
      return slotStart < aptEnd && slotEnd > aptStart
    })
    
    if (!isBooked) {
      slots.push({
        start: slotStart,
        end: slotEnd,
        label: formatTime12Hour(minutes)
      })
    }
  }
  
  return slots
}

function formatMinutesToTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export function formatTime12Hour(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

export function formatDateForInput(date) {
  return new Date(date).toISOString().split('T')[0]
}

export function getAvailableDates(visitingDays, daysAhead = 30) {
  const availableDays = parseVisitingDays(visitingDays)
  if (availableDays.length === 0) return []
  
  const dates = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    if (availableDays.includes(date.getDay())) {
      dates.push(new Date(date))
    }
  }
  return dates
}