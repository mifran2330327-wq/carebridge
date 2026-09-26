const API = 'http://localhost:5000/api'

async function post(url, data, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API}${url}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
  const text = await res.text()
  try {
    return { status: res.status, ok: res.ok, body: JSON.parse(text) }
  } catch {
    return { status: res.status, ok: res.ok, body: text }
  }
}

async function get(url, token) {
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API}${url}`, { headers })
  const text = await res.text()
  try {
    return { status: res.status, ok: res.ok, body: JSON.parse(text) }
  } catch {
    return { status: res.status, ok: res.ok, body: text }
  }
}

async function patch(url, data, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API}${url}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  })
  const text = await res.text()
  try {
    return { status: res.status, ok: res.ok, body: JSON.parse(text) }
  } catch {
    return { status: res.status, ok: res.ok, body: text }
  }
}

async function del(url, token) {
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API}${url}`, { method: 'DELETE', headers })
  return { status: res.status, ok: res.ok }
}

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE VERIFICATION ---\n')
  let passed = 0
  let failed = 0

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${name}`)
      passed++
    } else {
      console.error(`❌ FAIL: ${name}`, details)
      failed++
    }
  }

  // 1. Parent login
  const parentLogin = await post('/auth/login', { email: 'ifran1@gmail.com', password: 'ifran1234' })
  assert(parentLogin.ok && parentLogin.body.token, 'Parent login (ifran1@gmail.com)')
  const parentToken = parentLogin.body?.token

  // 2. Doctor login
  const docLogin = await post('/auth/login', { email: 'shantoDoctor@gmail.com', password: 'ifran1234' })
  assert(docLogin.ok && docLogin.body.token, 'Doctor login (shantoDoctor@gmail.com)')
  const docToken = docLogin.body?.token
  const docUser = docLogin.body?.user

  // 3. Admin login
  const adminLogin = await post('/auth/login', { email: 'ifranadmin@gmail.com', password: 'ifran1234' })
  assert(adminLogin.ok && adminLogin.body.token, 'Admin login (ifranadmin@gmail.com)')
  const adminToken = adminLogin.body?.token

  // 4. Parent creates child profile with empty string dateOfBirth
  const childCreate1 = await post('/children', {
    name: 'Ayaan Test',
    dateOfBirth: '',
    supportNeeds: 'Speech Therapy',
    conditionDescription: 'Mild delay in speech milestones',
  }, parentToken)
  assert(childCreate1.ok && childCreate1.body.child?.id, 'Parent creates child profile (empty date string handled gracefully)', childCreate1.body)
  const child1Id = childCreate1.body?.child?.id

  // 5. Parent creates child profile with valid ISO dateOfBirth
  const childCreate2 = await post('/children', {
    name: 'Sami Test',
    dateOfBirth: '2020-03-15',
    supportNeeds: 'Autism Spectrum Support',
    conditionDescription: 'Sensory sensitivity and repetitive behaviors',
  }, parentToken)
  assert(childCreate2.ok && childCreate2.body.child?.id, 'Parent creates child profile (valid dateOfBirth)', childCreate2.body)
  const child2Id = childCreate2.body?.child?.id

  // 6. Parent creates community discussion post
  const commPost = await post('/community', {
    title: 'Tips for speech therapy at home?',
    body: 'Looking for advice from parents who have practiced speech games with their 4 year old.',
    isAnonymous: false,
  }, parentToken)
  assert(commPost.ok && commPost.body.post?.id, 'Parent creates community post', commPost.body)
  const postId = commPost.body?.post?.id

  // 7. Doctor comments on community post
  const commentRes = await post(`/community/${postId}/comments`, {
    body: 'Consistency is key! Try naming objects during meal times.',
    isAnonymous: false,
  }, docToken)
  assert(commentRes.ok && commentRes.body.comment?.id, 'Doctor comments on community post', commentRes.body)
  const commentId = commentRes.body?.comment?.id

  // 8. Doctor Profile Name Sync test:
  // Update doctor profile with new name and verify User.name is synced in DB
  const docProfileUpdate = await patch('/auth/professional', {
    name: 'Dr. Shanto MD',
    professionType: 'Child Neurologist',
    specialties: ['Neurology', 'Pediatrics'],
    degrees: ['MBBS', 'MD (Pediatrics)'],
    location: 'Dhaka',
    chamber: 'Square Hospital',
    phone: '+8801700000000',
    visitingDays: 'Sat-Thu',
    visitingHours: '5pm-9pm',
    nidNumber: '1234567890123',
    description: 'Pediatric neurology specialist',
  }, docToken)
  assert(docProfileUpdate.ok && docProfileUpdate.body.professional?.name === 'Dr. Shanto MD', 'Doctor updates profile via PATCH /auth/professional', docProfileUpdate.body)

  // Verify User.name was synced in DB:
  const docVerifyLogin = await post('/auth/login', { email: 'shantoDoctor@gmail.com', password: 'ifran1234' })
  assert(docVerifyLogin.body.user?.name === 'Dr. Shanto MD', 'Doctor User.name synced with Professional.name in DB', docVerifyLogin.body.user?.name)

  // 9. Doctor submits a video resource
  const docVideo = await post('/resources', {
    type: 'VIDEO',
    title: 'Recognizing Early Signs of Autism',
    externalUrl: 'https://www.youtube.com/watch?v=0k5G6F_278A',
    sourceName: 'Child Health Hub',
  }, docToken)
  assert(docVideo.ok && docVideo.body.resource?.id, 'Doctor submits YouTube video resource', docVideo.body)
  const docVideoId = docVideo.body?.resource?.id

  // 10. Admin publishes YouTube Video Resource via POST /admin/resources
  const adminVideo = await post('/admin/resources', {
    type: 'VIDEO',
    title: 'Sensory Friendly Activities at Home',
    externalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    summary: 'Great activities for sensory development',
    sourceName: 'CareBridge Education',
    featured: true,
  }, adminToken)
  assert(adminVideo.ok && adminVideo.body.resource?.id, 'Admin publishes YouTube Video resource', adminVideo.body)
  const adminVideoId = adminVideo.body?.resource?.id

  // 11. Admin publishes Article Resource via POST /admin/resources
  const adminArticle = await post('/admin/resources', {
    type: 'ARTICLE',
    title: 'Guide to Inclusive Classrooms in Bangladesh',
    summary: 'How schools can adapt environments for neurodiverse children',
    sourceName: 'Education Ministry Resource',
  }, adminToken)
  assert(adminArticle.ok && adminArticle.body.resource?.id, 'Admin publishes Article resource', adminArticle.body)
  const adminArticleId = adminArticle.body?.resource?.id

  // 12. Admin adds institution via POST /admin/institutions
  const adminInst = await post('/admin/institutions', {
    name: 'Special Care Horizon School',
    type: 'SCHOOL',
    ownership: 'PRIVATE',
    address: 'Gulshan-2, Dhaka',
    district: 'Dhaka',
    website: 'https://specialcarehorizon.org',
    latitude: 23.7925,
    longitude: 90.4078,
  }, adminToken)
  assert(adminInst.ok && adminInst.body.institution?.id, 'Admin adds institution / school', adminInst.body)
  const instId = adminInst.body?.institution?.id

  // 13. Parent books appointment with doctor
  // Find doctor's professional id
  const docProfId = docProfileUpdate.body?.professional?.id || docUser?.professional?.id
  const apptDate = new Date(Date.now() + 86400000 * 2) // 2 days later
  const bookRes = await post('/appointments', {
    professionalId: docProfId,
    childId: child2Id,
    scheduledAt: apptDate.toISOString(),
    notes: 'Consultation for sensory assessment',
  }, parentToken)
  assert(bookRes.ok && bookRes.body.appointment?.id, 'Parent books appointment with Dr. Shanto MD', bookRes.body)
  const apptId = bookRes.body?.appointment?.id

  // 14. Doctor accepts appointment
  if (apptId) {
    const acceptRes = await patch(`/appointments/${apptId}/status`, { status: 'CONFIRMED' }, docToken)
    assert(acceptRes.ok && acceptRes.body.appointment?.status === 'CONFIRMED', 'Doctor accepts appointment', acceptRes.body)

    // 15. Doctor reschedules appointment
    const newTime = new Date(Date.now() + 86400000 * 3).toISOString()
    const reschedRes = await patch(`/appointments/${apptId}/reschedule`, { scheduledAt: newTime }, docToken)
    assert(reschedRes.ok && reschedRes.body.appointment?.status === 'REQUESTED', 'Doctor reschedules appointment time', reschedRes.body)
  }

  // 16. Cleanup test records
  if (commentId) await del(`/community/comments/${commentId}`, adminToken)
  if (postId) await del(`/community/${postId}`, adminToken)
  if (docVideoId) await del(`/resources/${docVideoId}`, adminToken)
  if (adminVideoId) await del(`/resources/${adminVideoId}`, adminToken)
  if (adminArticleId) await del(`/resources/${adminArticleId}`, adminToken)
  if (instId) await del(`/admin/institutions/${instId}`, adminToken)
  if (child1Id) await del(`/children/${child1Id}`, parentToken)
  if (child2Id) await del(`/children/${child2Id}`, parentToken)

  console.log(`\n========================================`)
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`)
  console.log(`========================================`)
}

runTests().catch(console.error)
