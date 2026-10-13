import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user, updateUser } = useAuth()
  const [wallet, setWallet] = useState(0)
  const [rides, setRides] = useState([])
  const [showRegister, setShowRegister] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    api.get(`/wallet/${user.id}`).then((r) => {
      setWallet(r.data.balance)
      updateUser({ wallet: r.data.balance })
    }).catch(() => {})
    api.get(`/rides/history/${user.id}`).then((r) => setRides(r.data)).catch(() => {})
  }, [user?.id])

  const registerDriver = async (form) => {
    try {
      const res = await api.post('/register-driver', { ...form, phone: user.phone })
      updateUser(res.data.user)
      setShowRegister(false)
      alert('You are now a driver! 🎉')
    } catch (e) {
      alert('Failed to register')
    }
  }

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <p style={{ color: '#888', fontSize: 13 }}>Welcome back</p>
          <h2>{user?.name || `+91 ${user?.phone}`}</h2>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: '#888', fontSize: 12 }}>Wallet</p>
          <p style={{ fontSize: 22, fontWeight: 800 }}>₹{wallet}</p>
        </div>
      </div>

      {user?.role === 'customer' && !showRegister && (
        <div className="card" style={{ background: '#1a1a1a', color: 'white' }}>
          <h3 style={{ color: 'white' }}>Want to drive?</h3>
          <p style={{ fontSize: 13, color: '#ccc', marginBottom: 12 }}>
            Register as a driver and start earning.
          </p>
          <button className="btn-primary" onClick={() => setShowRegister(true)}>
            Register as Driver
          </button>
        </div>
      )}

      {showRegister && (
        <DriverRegisterForm
          onSubmit={registerDriver}
          onCancel={() => setShowRegister(false)}
        />
      )}

      <div className="card">
        <h3>Book a ride</h3>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>
          Choose your vehicle and get going.
        </p>
        <button className="btn-primary" onClick={() => navigate('/book')}>
          🛺 Book Now
        </button>
      </div>

      <div className="card">
        <h3>Recent rides</h3>
        {rides.length === 0 && <p style={{ color: '#888', fontSize: 13 }}>No rides yet</p>}
        {rides.slice(0, 5).map((r) => (
          <div key={r.id} className="txn-row">
            <div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>
                {r.pickup?.slice(0, 20)} → {r.dropoff?.slice(0, 20)}
              </p>
              <p style={{ fontSize: 12 }}>
                <span className={`status-badge status-${r.status}`}>{r.status}</span>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 700 }}>₹{r.fare}</p>
              <p style={{ fontSize: 11, color: '#888' }}>{r.vehicle_type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DriverRegisterForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    vehicle_type: 'auto',
    vehicle_number: '',
    license_number: '',
    upi_id: ''
  })
  const set = (k, v) => setForm({ ...form, [k]: v })

  return (
    <div className="card">
      <h3>Driver Registration</h3>
      <input placeholder="Full name" value={form.name} onChange={(e) => set('name', e.target.value)} />
      <select value={form.vehicle_type} onChange={(e) => set('vehicle_type', e.target.value)}>
        <option value="auto">Auto</option>
        <option value="bike">Bike</option>
        <option value="cab">Cab</option>
      </select>
      <input placeholder="Vehicle number (KA01AB1234)" value={form.vehicle_number} onChange={(e) => set('vehicle_number', e.target.value)} />
      <input placeholder="License number" value={form.license_number} onChange={(e) => set('license_number', e.target.value)} />
      <input placeholder="UPI ID (you@upi)" value={form.upi_id} onChange={(e) => set('upi_id', e.target.value)} />
      <button className="btn-primary" onClick={() => onSubmit(form)}>Register</button>
      <button className="btn-outline" onClick={onCancel}>Cancel</button>
    </div>
  )
}