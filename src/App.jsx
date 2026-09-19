import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar.jsx'
import Footer from './components/Footer/Footer.jsx'
import AIChatWidget from './components/AIChatWidget/AIChatWidget.jsx'

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
import Recommendations from './pages/Recommendations/Recommendations.jsx'
import NotFound from './pages/NotFound/NotFound.jsx'
import Admin from './pages/Admin/Admin.jsx'

// All top-level routes live here. Each page is a self-contained folder
// under src/pages/<PageName>/ with its own .jsx + .css file.
export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/professionals" element={<Professionals />} />
        <Route path="/schools" element={<Schools />} />
        <Route path="/search" element={<SmartSearch />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/community" element={<Community />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <AIChatWidget />
    </>
  )
}
