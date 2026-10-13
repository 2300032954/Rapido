import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { api } from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function DriverDashboard() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [online, setOnline] = useState(user.is_online || false)
  const [rides, setRides] = useState([])
  const [current, setCurrent] = useState(null)
  const [startOtp, setStartOtp] = useState('')
  const [driverPos, setDriverPos] = useState({ lat: 12.9716, lng: 77.5946 })

  // Poll nearby rides when online
  useEffect(() => {
    if (!online) return
    const load = async () => {
      try {
        const res = await api.get(`/driver/nearby-rides/${user.id}`)
        setRides(res.data)
      } catch (e) { /* ignore */ }
    }
    load()
    const t = setInterval(load, 4000)
    return () => clearInterval(t)
  }, [online, user.id])

  // Broadcast driver location via socket
  useEffect(() => {
    if (!current) return
    const socket = io('http://localhost:5000', { transports: ['websocket'] })
    socket.emit('join_tracking', { ride_id: current.id })
    const t = setInterval(() => {
      socket.emit('driver_location_update', {
        ride_id: current.id,
        lat: driverPos.lat,
        lng: driverPos.lng
      })
    }, 3000)
    return () => { clearInterval(t); socket.disconnect() }
  }, [current, driverPos])

  const toggle = async () => {
    try {
      const res = await api.post('/driver/toggle-online', {
        user_id: user.id, lat: driverPos.lat, lng: driverPos.lng
      })
      setOnline(res.data.is_online)
      updateUser({ is_online: res.data.is_online })
    } catch (e) {
      alert('Failed to toggle status')
    }
  }

  const accept = async (rideId) => {
    try {
      const res = await api.post(`/driver/accept/${rideId}`, { driver_id: user.id })
      setCurrent(res.data)
      setRides([])
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to accept ride')
    }
  }

  const start = async () => {
    try {
      await api.post(`/driver/start/${current.id}`, { otp: startOtp })
      setCurrent({ ...current, status: 'ongoing' })
    } catch (e) {
      alert('Wrong OTP')
    }
  }

  const end = async () => {
    try {
      const res = await api.post(`/driver/end/${current.id}`)
      alert(
        `✅ Trip completed\n` +
        `Fare: ₹${res.data.fare}\n` +
        `You earned: ₹${(res.data.fare * 0.8).toFixed(2)}`
      )
      setCurrent({ ...res.data, status: 'completed' })
      setStartOtp('')
    } catch (e) {
      alert('Failed to end trip')
    }
  }

  return (
    <div className="container" style={{ paddingBottom: 90 }}>
      <h2>Driver Dashboard 🚗</h2>

      {/* Status card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: 700 }}>{user.name || 'Driver'}</p>
            <p style={{ fontSize: 13, color: '#888' }}>
              {user.vehicle_type} • {user.vehicle_number}
            </p>
          </div>
          <button
            className={online ? 'btn-danger' : 'btn-primary'}
            style={{ width: 'auto', padding: '10px 20px' }}
            onClick={toggle}
          >
            {online ? 'Go Offline' : 'Go Online'}
          </button>
        </div>
        <p style={{ fontSize: 13, marginTop: 8 }}>
          Total earnings: <b>₹{user.total_earnings || 0}</b>
        </p>
      </div>

      {/* Current ride */}
      {current && (
        <div className="card" style={{ background: '#e3f2fd' }}>
          <h3>Current Ride #{current.id}</h3>
          <p>📍 {current.pickup}</p>
          <p>🎯 {current.dropoff}</p>
          <p className="fare-tag">₹{current.fare}</p>

          {current.status === 'accepted' && (
            <>
              <input
                placeholder="Enter customer OTP"
                value={startOtp}
                onChange={(e) => setStartOtp(e.target.value)}
                maxLength={4}
              />
              <button className="btn-primary" onClick={start}>
                🚀 Start Trip
              </button>
            </>
          )}

          {current.status === 'ongoing' && (
            <>
              <button className="btn-danger" onClick={end}>
                🏁 End Trip
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigate(`/driver/qr/${current.id}`)}
                style={{ marginTop: 8 }}
              >
                📱 Show UPI QR to Customer
              </button>
            </>
          )}

          {current.status === 'completed' && (
            <>
              <p style={{ color: '#2e7d32', fontWeight: 700, marginTop: 8 }}>
                ✅ Trip completed
              </p>
              <button
                className="btn-primary"
                onClick={() => navigate(`/driver/qr/${current.id}`)}
                style={{ marginTop: 8 }}
              >
                📱 Collect Payment (UPI QR)
              </button>
              <button
                className="btn-outline"
                onClick={() => setCurrent(null)}
                style={{ marginTop: 8 }}
              >
                Done — Back to Rides
              </button>
            </>
          )}
        </div>
      )}

      {/* Nearby ride requests */}
      {online && !current && (
        <div className="card">
          <h3>Nearby ride requests</h3>
          {rides.length === 0 && (
            <p style={{ color: '#888', fontSize: 13 }}>Searching...</p>
          )}
          {rides.map((r) => (
            <div key={r.id} className="card" style={{ background: '#f9f9f9' }}>
              <p style={{ fontWeight: 700 }}>{r.pickup}</p>
              <p style={{ fontSize: 13, color: '#888' }}>→ {r.dropoff}</p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 8
                }}
              >
                <span className="fare-tag">₹{r.fare}</span>
                <button
                  className="btn-primary"
                  style={{ width: 'auto', padding: '8px 20px' }}
                  onClick={() => accept(r.id)}
                >
                  Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Offline state */}
      {!online && (
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>You're offline</h3>
          <p style={{ fontSize: 13, color: '#888' }}>
            Go online to receive ride requests
          </p>
        </div>
      )}
    </div>
  )
}