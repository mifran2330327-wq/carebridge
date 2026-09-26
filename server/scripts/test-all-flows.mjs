import 'dotenv/config'

const API = 'http://localhost:5000/api'

async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API}${path}`, { method: 'POST', headers, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${res.status}: ${data.error || JSON.stringify(data)}`)
  return data
}

async function get(path, token) {
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API}${path}`, { headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${res.status}: ${data.error || JSON.stringify(data)}`)
  return data
}

async function patch(path, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API}${path}`, { method: 'PATCH', headers, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${res.status}: ${data.error || JSON.stringify(data)}`)
  return data
}

async function del(path, token) {
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API}${path}`, { method: 'DELETE', headers })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(`${res.status}: ${data.error || 'Delete failed'}`)
  }
  return true
}

async function run() {
  console.log('=== CareBridge Full System Verification ===\n')

  // 1. Logins
  console.log('1. Testing Logins...')
  const adminLogin = await post('/auth/login', { email: 'ifranadmin@gmail.com', password: 'ifran1234' })
  console.log('   Admin Login OK:', adminLogin.user.role)

  const parentLogin = await post('/auth/login', { email: 'ifran1@gmail.com', password: 'ifran1234' })
  console.log('   Parent Login OK:', parentLogin.user.role)

  const doctorLogin = await post('/auth/login', { email: 'shantoDoctor@gmail.com', password: 'ifran1234' })
  console.log('   Doctor Login OK:', doctorLogin.user.role, 'User ID:', doctorLogin.user.id)

  // 2. Directory check
  console.log('\n2. Testing Directory...')
  const dir = await get('/directory')
  console.log('   Total professionals in DB:', dir.professionals.length)
  const shantoDoc = dir.professionals.find(p => p.ownerId === doctorLogin.user.id)
  console.log('   ShantoDoctor found in directory:', !!shantoDoc, 'ID:', shantoDoc?.id)

  // 3. Appointment booking with shantoDoctor
  console.log('\n3. Testing Appointment Booking with shantoDoctor...')
  const children = await get('/children', parentLogin.token)
  const child = children.children[0]
  console.log('   Booking for child:', child.name)

  const tomorrow = new Date(Date.now() + 86400000)
  // Pick an hour
  tomorrow.setHours(10, 0, 0, 0)
  const appt = await post('/appointments', {
    professionalId: shantoDoc.id,
    childId: child.id,
    scheduledAt: tomorrow.toISOString(),
    notes: 'Child needs assessment'
  }, parentLogin.token)
  console.log('   ✓ Appointment created! Status:', appt.appointment.status, 'ID:', appt.appointment.id)

  // 4. Doctor checks appointments & notifications
  console.log('\n4. Checking Doctor Notifications & Appointments...')
  const docNotifs = await get('/notifications', doctorLogin.token)
  console.log('   Doctor unread notifications:', docNotifs.unreadCount)
  console.log('   Latest notification:', docNotifs.notifications[0]?.message)

  const docAppts = await get('/appointments', doctorLogin.token)
  const myAppt = docAppts.appointments.find(a => a.id === appt.appointment.id)
  console.log('   Doctor sees appointment:', !!myAppt)

  // 5. Doctor accepts appointment
  console.log('\n5. Doctor Accepts Appointment...')
  const acceptRes = await patch(`/appointments/${appt.appointment.id}/status`, { status: 'CONFIRMED' }, doctorLogin.token)
  console.log('   ✓ Appointment status updated to:', acceptRes.appointment.status)

  // Parent checks notification
  const parentNotifs = await get('/notifications', parentLogin.token)
  console.log('   Parent received acceptance notification:', parentNotifs.notifications[0]?.message)

  // 6. Doctor reschedules appointment
  console.log('\n6. Doctor Reschedules Appointment...')
  const nextWeek = new Date(Date.now() + 7 * 86400000)
  nextWeek.setHours(14, 30, 0, 0)
  const reschedRes = await patch(`/appointments/${appt.appointment.id}/reschedule`, { scheduledAt: nextWeek.toISOString() }, doctorLogin.token)
  console.log('   ✓ Doctor rescheduled to:', new Date(reschedRes.appointment.scheduledAt).toLocaleString())

  // 7. Doctor submits a YouTube video resource
  console.log('\n7. Doctor Submits a YouTube Resource...')
  const docResource = await post('/resources', {
    type: 'VIDEO',
    title: 'Autism Sensory Management Guide by Dr. Shanto',
    externalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    sourceName: 'Dhaka Medical College',
    summary: '' // Testing empty summary on video
  }, doctorLogin.token)
  console.log('   ✓ Doctor submitted resource! ID:', docResource.resource.id, 'Status:', docResource.resource.status)

  // 8. Admin reviews & publishes resource, then deletes it
  console.log('\n8. Admin Reviews and Deletes Resource...')
  await patch(`/admin/resources/${docResource.resource.id}`, { status: 'PUBLISHED' }, adminLogin.token)
  console.log('   ✓ Admin published doctor resource')
  await del(`/admin/resources/${docResource.resource.id}`, adminLogin.token)
  console.log('   ✓ Admin deleted resource')

  // 9. Community post: User creates regular and anonymous post
  console.log('\n9. Community Forum Post Creation...')
  const regularPost = await post('/community', {
    title: 'Question about sensory therapy for 5yo',
    body: 'My child experiences sensory overload in crowded places. Any advice?',
    isAnonymous: false
  }, parentLogin.token)
  console.log('   ✓ Parent created post! ID:', regularPost.post.id, 'Author:', regularPost.post.author.name)

  const anonPost = await post('/community', {
    title: 'Seeking advice anonymously',
    body: 'How do you handle sleep routines with ADHD toddlers?',
    isAnonymous: true
  }, parentLogin.token)
  console.log('   ✓ Parent created anonymous post! ID:', anonPost.post.id, 'Author:', anonPost.post.author.name)

  // 10. Doctor comments on parent post
  console.log('\n10. Doctor Comments on Parent Post...')
  const docComment = await post(`/community/${regularPost.post.id}/comments`, {
    body: 'As a pediatric specialist, I recommend occupational sensory integration therapy.',
    isAnonymous: false
  }, doctorLogin.token)
  console.log('   ✓ Doctor commented! Is expert reply:', docComment.comment.isExpertReply, 'Author:', docComment.comment.author.name)

  // 11. Anonymous comment
  console.log('\n11. Anonymous Comment on Parent Post...')
  const anonComment = await post(`/community/${regularPost.post.id}/comments`, {
    body: 'We had the same challenge, weighted blankets helped us a lot.',
    isAnonymous: true
  }, parentLogin.token)
  console.log('   ✓ Anonymous comment posted! Author:', anonComment.comment.author.name)

  // 12. Doctor deletes their own comment
  console.log('\n12. Doctor Deletes Their Comment...')
  await del(`/community/comments/${docComment.comment.id}`, doctorLogin.token)
  console.log('   ✓ Doctor successfully deleted their comment!')

  // 13. Admin views post, comments on it, then deletes it
  console.log('\n13. Admin Moderation & Commenting...')
  const adminComment = await post(`/community/${regularPost.post.id}/comments`, {
    body: 'Community guidelines reminder from CareBridge Admin Team.',
    isAnonymous: false
  }, adminLogin.token)
  console.log('   ✓ Admin commented on post! Comment ID:', adminComment.comment.id)

  await del(`/community/${regularPost.post.id}`, adminLogin.token)
  console.log('   ✓ Admin successfully deleted community post!')
  await del(`/community/${anonPost.post.id}`, adminLogin.token)
  console.log('   ✓ Admin successfully cleaned up test post!')

  console.log('\n=== ALL 13 TEST SUITES PASSED FLAWLESSLY! ===')
}

run().catch((err) => {
  console.error('\n❌ Test failed:', err.message)
  process.exit(1)
})
