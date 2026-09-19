// =========================================================================
// MOCK DATA
// Stand-in content so every page renders real-looking UI without a backend.
// When the Node/Express + PostgreSQL API is ready, replace these arrays
// with fetch()/axios calls (see src/hooks for where that will plug in).
// =========================================================================

export const currentParent = {
  id: 'p1',
  name: 'Nusrat Jahan',
  email: 'nusrat.jahan@example.com',
  location: 'Dhanmondi, Dhaka',
  avatarColor: '#335765',
}

export const children = [
  {
    id: 'c1',
    name: 'Arham',
    age: 6,
    diagnosis: 'Autism Spectrum Disorder',
    supportLevel: 'Level 2',
    notes: 'Responds well to visual schedules and sensory breaks.',
  },
  {
    id: 'c2',
    name: 'Meherin',
    age: 9,
    diagnosis: 'ADHD, Dyslexia',
    supportLevel: 'Level 1',
    notes: 'Needs extended time for reading tasks.',
  },
]

export const professionals = [
  {
    id: 'pr1',
    name: 'Dr. Farhana Islam',
    role: 'Speech & Language Therapist',
    specialties: ['Autism', 'Apraxia', 'Non-verbal communication'],
    location: 'Gulshan, Dhaka',
    coordinates: [23.7906, 90.4128],
    distanceKm: 3.2,
    price: '৳1500/session',
    availability: 'Available this week',
    verified: true,
  },
  {
    id: 'pr2',
    name: 'Tanvir Ahmed',
    role: 'Occupational Therapist',
    specialties: ['Sensory Integration', 'Fine motor skills'],
    location: 'Uttara, Dhaka',
    coordinates: [23.8759, 90.3795],
    distanceKm: 8.7,
    price: '৳1200/session',
    availability: 'Next slot: Mon',
    verified: true,
  },
  {
    id: 'pr3',
    name: 'Dr. Shirin Akter',
    role: 'Child Psychologist',
    specialties: ['ADHD', 'Behavioral therapy', 'Anxiety'],
    location: 'Dhanmondi, Dhaka',
    coordinates: [23.7465, 90.3760],
    distanceKm: 1.5,
    price: '৳2000/session',
    availability: 'Available today',
    verified: true,
  },
  {
    id: 'pr4',
    name: 'Rezaul Karim',
    role: 'Special Education Tutor',
    specialties: ['Dyslexia', 'Learning disabilities'],
    location: 'Mirpur, Dhaka',
    coordinates: [23.8223, 90.3654],
    distanceKm: 12.1,
    price: '৳900/session',
    availability: 'Available this week',
    verified: false,
  },
  {
    id: 'pr5',
    name: 'Dr. Nabila Chowdhury',
    role: 'Developmental Pediatrician',
    specialties: ['Early intervention', 'Autism', 'Developmental delay'],
    location: 'Banani, Dhaka',
    coordinates: [23.7935, 90.4061],
    distanceKm: 5.4,
    price: '৳2500/session',
    availability: 'Next slot: Wed',
    verified: true,
  },
  {
    id: 'pr6',
    name: 'Imran Hossain',
    role: 'Physiotherapist',
    specialties: ['Cerebral Palsy', 'Motor delay'],
    location: 'Mohammadpur, Dhaka',
    coordinates: [23.7597, 90.3591],
    distanceKm: 6.9,
    price: '৳1300/session',
    availability: 'Available this week',
    verified: true,
  },
]

export const schools = [
  {
    id: 's1',
    name: 'Bright Horizons Inclusive School',
    type: 'Inclusive (mainstream + special needs)',
    location: 'Dhanmondi, Dhaka',
    coordinates: [23.7465, 90.3760],
    distanceKm: 2.1,
    ageRange: '4–12 yrs',
    facilities: ['Sensory room', 'Speech therapy on-site', 'Small class size'],
  },
  {
    id: 's2',
    name: 'Shishu Bikash Special School',
    type: 'Special needs school',
    location: 'Mirpur, Dhaka',
    coordinates: [23.8223, 90.3654],
    distanceKm: 9.4,
    ageRange: '5–16 yrs',
    facilities: ['Occupational therapy', 'Vocational training', 'Transport'],
  },
  {
    id: 's3',
    name: 'Little Steps Learning Center',
    type: 'Early intervention center',
    location: 'Gulshan, Dhaka',
    coordinates: [23.7906, 90.4128],
    distanceKm: 4.0,
    ageRange: '2–7 yrs',
    facilities: ['1:1 therapy rooms', 'Parent training', 'Play-based curriculum'],
  },
  {
    id: 's4',
    name: 'Asha Inclusive Academy',
    type: 'Inclusive (mainstream + special needs)',
    location: 'Uttara, Dhaka',
    coordinates: [23.8759, 90.3795],
    distanceKm: 11.2,
    ageRange: '6–14 yrs',
    facilities: ['Resource room', 'Shadow teachers', 'Counseling'],
  },
]

export const resources = [
  {
    id: 'r1',
    title: 'Understanding Your Child’s IEP: A Parent’s Guide',
    category: 'Education',
    readTime: '6 min read',
    excerpt:
      'What an Individualized Education Plan actually covers, and the questions worth asking at your next school meeting.',
  },
  {
    id: 'r2',
    title: 'Sensory-Friendly Routines for Mornings That Don’t Melt Down',
    category: 'Daily Life',
    readTime: '4 min read',
    excerpt:
      'Small, practical changes to morning routines that reduce sensory overload before school.',
  },
  {
    id: 'r3',
    title: 'ADHD in Girls: Why It’s Often Missed',
    category: 'Health',
    readTime: '8 min read',
    excerpt:
      'Recognizing the quieter signs of ADHD that don’t match the classic hyperactive stereotype.',
  },
  {
    id: 'r4',
    title: 'Choosing Between Inclusive and Special Schools',
    category: 'Education',
    readTime: '7 min read',
    excerpt:
      'A side-by-side look at what each setting offers, and how to match it to your child’s needs.',
  },
  {
    id: 'r5',
    title: 'Talking to Siblings About Autism',
    category: 'Family',
    readTime: '5 min read',
    excerpt:
      'Age-appropriate ways to help siblings understand and support their brother or sister.',
  },
  {
    id: 'r6',
    title: 'Building a Visual Schedule at Home',
    category: 'Daily Life',
    readTime: '3 min read',
    excerpt: 'A step-by-step template for a visual schedule that actually gets used.',
  },
]

export const forumPosts = [
  {
    id: 'f1',
    author: 'Sabrina R.',
    childContext: 'Parent of a 5-year-old with ASD',
    title: 'Any recommendations for a good OT near Mirpur?',
    replies: 14,
    lastActive: '2h ago',
    tag: 'Recommendations',
  },
  {
    id: 'f2',
    author: 'Kamrul H.',
    childContext: 'Parent of a 9-year-old with ADHD',
    title: 'How do you handle homework meltdowns?',
    replies: 27,
    lastActive: '5h ago',
    tag: 'Daily Life',
  },
  {
    id: 'f3',
    author: 'Tasnim A.',
    childContext: 'Parent of a 7-year-old with Dyslexia',
    title: 'Our IEP meeting went badly — what would you have asked?',
    replies: 9,
    lastActive: '1d ago',
    tag: 'Education',
  },
  {
    id: 'f4',
    author: 'Rafiq M.',
    childContext: 'Parent of a 4-year-old with global developmental delay',
    title: 'Early intervention center suggestions in Dhaka?',
    replies: 21,
    lastActive: '1d ago',
    tag: 'Recommendations',
  },
]

export const recommendations = [
  {
    id: 'rec1',
    forChild: 'Arham',
    type: 'Professional',
    title: 'Dr. Farhana Islam — Speech & Language Therapist',
    reason: 'Matches Arham’s non-verbal communication goals and is 3.2 km away.',
  },
  {
    id: 'rec2',
    forChild: 'Arham',
    type: 'Resource',
    title: 'Building a Visual Schedule at Home',
    reason: 'You noted Arham responds well to visual schedules.',
  },
  {
    id: 'rec3',
    forChild: 'Meherin',
    type: 'Professional',
    title: 'Rezaul Karim — Special Education Tutor',
    reason: 'Specializes in dyslexia support with flexible after-school slots.',
  },
  {
    id: 'rec4',
    forChild: 'Meherin',
    type: 'School',
    title: 'Bright Horizons Inclusive School',
    reason: 'Small class sizes and a resource room fit Meherin’s IEP goals.',
  },
]

export const upcomingAppointments = [
  {
    id: 'ap1',
    professional: 'Dr. Farhana Islam',
    role: 'Speech & Language Therapist',
    date: 'Sep 8, 2026',
    time: '10:30 AM',
    child: 'Arham',
    mode: 'In-person',
  },
  {
    id: 'ap2',
    professional: 'Dr. Shirin Akter',
    role: 'Child Psychologist',
    date: 'Sep 10, 2026',
    time: '4:00 PM',
    child: 'Meherin',
    mode: 'Video call',
  },
]
