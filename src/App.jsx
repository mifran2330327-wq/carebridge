import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar.jsx'
import Footer from './components/Footer/Footer.jsx'
import { GuestOnly, RequireAuth, RequireRole } from './lib/AuthGuard.jsx'
import { useAuth } from './context/AuthContext.jsx'

import Home from './pages/Home/Home.jsx'
import Login from './pages/Login/Login.jsx'
import Signup from './pages/Signup/Signup.jsx'
import Dashboard from './pages/Dashboard/Dashboard.jsx'
import Professionals from './pages/Professionals/Professionals.jsx'
import Schools from './pages/Schools/Schools.jsx'
import SmartSearch from './pages/SmartSearch/SmartSearch.jsx'
import Appointments from './pages/Appointments/Appointments.jsx'
import Resources from './pages/Resources/Resources.jsx'
import Community from './pages/Community/Community.jsx'
import CreatePost from './pages/Community/CreatePost.jsx'
import PostDetail from './pages/Community/PostDetail.jsx'
import Recommendations from './pages/Recommendations/Recommendations.jsx'
import NotFound from './pages/NotFound/NotFound.jsx'
import Admin from './pages/Admin/Admin.jsx'
import AIChatWidget from './components/AIChatWidget/AIChatWidget.jsx'

export default function App() {
  const { user } = useAuth()

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />

        {/* Auth required for all features */}
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/professionals" element={<RequireAuth><Professionals /></RequireAuth>} />
        <Route path="/schools" element={<RequireAuth><Schools /></RequireAuth>} />
        <Route path="/search" element={<RequireAuth><SmartSearch /></RequireAuth>} />
        <Route path="/resources" element={<RequireAuth><Resources /></RequireAuth>} />
        <Route path="/community" element={<RequireAuth><Community /></RequireAuth>} />
        <Route path="/community/new" element={<RequireAuth><CreatePost /></RequireAuth>} />
        <Route path="/community/:postId" element={<RequireAuth><PostDetail /></RequireAuth>} />
        <Route path="/appointments" element={<RequireAuth><Appointments /></RequireAuth>} />
        <Route path="/recommendations" element={<RequireAuth><Recommendations /></RequireAuth>} />

        {/* Admin only */}
        <Route path="/admin" element={<RequireRole role="ADMIN"><Admin /></RequireRole>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      {/* AI Chatbot only visible when logged in */}
      {user && <AIChatWidget />}
    </>
  )
}
