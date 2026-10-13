import DriverQR from './pages/DriverQR'
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Home from './pages/Home'
import BookRide from './pages/BookRide'
import TrackRide from './pages/TrackRide'
import Wallet from './pages/Wallet'
import ShareRide from './pages/ShareRide'
import DriverDashboard from './pages/DriverDashboard'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  if (!user) return null

  const items = [
    { to: '/',       label: 'Home',   icon: '🏠' },
    { to: '/book',   label: 'Book',   icon: '🛺' },
    { to: '/wallet', label: 'Wallet', icon: '💰' },
    { to: '/share',  label: 'Share',  icon: '🤝' },
  ]
  if (user.role === 'driver') {
    items.push({ to: '/driver', label: 'Drive', icon: '🚗' })
  }

  return (
    <div className="nav">
      {items.map((it) => (
        <Link
          key={it.to}
          to={it.to}
          className={`nav-item ${location.pathname === it.to ? 'active' : ''}`}
        >
          <span style={{ fontSize: 20 }}>{it.icon}</span>
          <span>{it.label}</span>
        </Link>
      ))}
      <button
        onClick={logout}
        className="nav-item"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <span style={{ fontSize: 20 }}>↩</span>
        <span>Exit</span>
      </button>
    </div>
  )
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/book" element={<ProtectedRoute><BookRide /></ProtectedRoute>} />
        <Route path="/track/:rideId" element={<ProtectedRoute><TrackRide /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/share" element={<ProtectedRoute><ShareRide /></ProtectedRoute>} />
        <Route path="/driver" element={<ProtectedRoute><DriverDashboard /></ProtectedRoute>} />
        <Route path="/driver/qr/:rideId" element={<ProtectedRoute><DriverQR /></ProtectedRoute>} />
      </Routes>
      <Navbar />
    </>
  )
}