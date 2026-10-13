import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { io } from 'socket.io-client'
import { api } from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function TrackRide() {
  const { rideId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [ride, setRide] = useState(null)
  const [driverPos, setDriverPos] = useState(null)
  const [qrData, setQrData] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/rides/${rideId}`)
        setRide(res.data)
        if (res.data.driver_lat && res.data.driver_lng) {
          setDriverPos({ lat: res.data.driver_lat, lng: res.data.driver_lng })
        }
      } catch (e) { /* ignore */ }
    }
    load()
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [rideId])

  useEffect(() => {
    const socket = io('http://localhost:5000', { transports: ['websocket'] })
    socket.emit('join_tracking', { ride_id: Number(rideId) })
    socket.on('location_update', (d) => setDriverPos({ lat: d.lat, lng: d.lng }))
    socket.on('status_changed', (d) =>
      setRide((r) => (r ? { ...r, status: d.status } : r))
    )
    return () => socket.disconnect()
  }, [rideId])

  const enableSharing = async () => {
    const res = await api.post(`/share/enable/${rideId}`)
    alert(
      `🔑 Share Code: ${res.data.share_code}\n\n` +
      `2 people → ₹${res.data.splits['2']} each\n` +
      `3 people → ₹${res.data.splits['3']} each`
    )
    setRide((r) => ({ ...r, is_shared: true, share_code: res.data.share_code }))
  }

  const generateQR = async () => {
    const res = await api.post(`/qr/generate/${rideId}`)
    setQrData(res.data)
  }

  const payWithWallet = async () => {
    try {
      const res = await api.post('/wallet/pay-ride', { ride_id: Number(rideId) })
      alert(`✅ Paid! New balance: ₹${res.data.new_balance}`)
      setRide((r) => ({ ...r, payment_status: 'paid' }))
    } catch (e) {
      alert(e.response?.data?.error || 'Payment failed')
    }
  }

  const cancelRide = async () => {
    if (!confirm('Cancel this ride?')) return
    await api.post(`/rides/${rideId}/cancel`)
    navigate('/')
  }

  if (!ride) return <div className="container" style={{ paddingTop: 60 }}><p>Loading ride...</p></div>

  const center = ride.pickup_lat ? [ride.pickup_lat, ride.pickup_lng] : [12.9716, 77.5946]

  return (
    <div className="container" style={{ paddingBottom: 90 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Ride #{ride.id}</h2>
        <span className={`status-badge status-${ride.status}`}>{ride.status}</span>
      </div>

      <MapContainer center={center} zoom={13} style={{ height: '42vh', width: '100%', borderRadius: 12, marginTop: 12 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {ride.pickup_lat && <Marker position={[ride.pickup_lat, ride.pickup_lng]}><Popup>Pickup</Popup></Marker>}
        {ride.dropoff_lat && <Marker position={[ride.dropoff_lat, ride.dropoff_lng]}><Popup>Drop</Popup></Marker>}
        {driverPos && <Marker position={[driverPos.lat, driverPos.lng]}><Popup>🛺 Driver</Popup></Marker>}
      </MapContainer>

      {ride.driver && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 700 }}>{ride.driver.name}</p>
              <p style={{ fontSize: 13, color: '#888' }}>{ride.driver.vehicle}</p>
              <p style={{ fontSize: 12 }}>⭐ {ride.driver.rating}</p>
            </div>
            <a href={`tel:${ride.driver.phone}`} className="fare-tag" style={{ textDecoration: 'none' }}>
              📞 Call
            </a>
          </div>
        </div>
      )}

      {ride.status === 'accepted' && (
        <div className="card" style={{ background: '#fffde7' }}>
          <p style={{ fontSize: 13 }}>Share this OTP with your driver</p>
          <div className="otp-box">{ride.otp}</div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 13, color: '#888' }}>Fare</p>
            <p className="fare-tag">₹{ride.fare}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 13, color: '#888' }}>Distance</p>
            <p style={{ fontWeight: 700 }}>{ride.distance_km} km</p>
          </div>
        </div>
        <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
          Payment: <b>{ride.payment_status || 'pending'}</b>
        </p>
      </div>

      {(ride.status === 'ongoing' || ride.status === 'completed') && ride.payment_status !== 'paid' && (
        <div className="card">
          <h3>Pay Now</h3>
          <button className="btn-primary" onClick={payWithWallet}>
            💰 Pay ₹{ride.fare} with Wallet
          </button>
          <button className="btn-secondary" onClick={generateQR}>
            📱 Show UPI QR
          </button>
        </div>
      )}

      {qrData && (
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>Scan to Pay ₹{qrData.amount}</h3>
          <img src={`http://localhost:5000${qrData.qr_url}`} alt="UPI QR" style={{ width: '100%', maxWidth: 260, margin: '10px auto', display: 'block' }} />
          <p style={{ fontSize: 12, color: '#888', wordBreak: 'break-all' }}>{qrData.upi_link}</p>
          <button className="btn-secondary" onClick={async () => {
            await api.post('/qr/verify', { qr_id: qrData.qr_id })
            setRide((r) => ({ ...r, payment_status: 'paid' }))
            setQrData(null)
            alert('Marked as paid!')
          }}>✅ I have paid</button>
        </div>
      )}

      {!ride.is_shared && ride.status !== 'completed' && ride.status !== 'cancelled' && (
        <button className="btn-secondary" onClick={enableSharing}>
          🤝 Share this ride & split fare
        </button>
      )}

      {ride.is_shared && ride.share_code && (
        <div className="card" style={{ background: '#e8f5e9' }}>
          <p style={{ fontSize: 13 }}>Your share code</p>
          <h2 style={{ letterSpacing: 4 }}>{ride.share_code}</h2>
        </div>
      )}

      {ride.status === 'searching' && (
        <button className="btn-danger" onClick={cancelRide}>Cancel Ride</button>
      )}
    </div>
  )
}