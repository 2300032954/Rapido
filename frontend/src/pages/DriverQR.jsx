import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/axios'

export default function DriverQR() {
  const { rideId } = useParams()
  const navigate = useNavigate()
  const [qr, setQr] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.post(`/qr/driver-ride/${rideId}`)
      .then((r) => setQr(r.data))
      .catch(() => alert('Failed to generate QR'))
      .finally(() => setLoading(false))
  }, [rideId])

  const markPaid = async () => {
    if (!confirm('Confirm payment received?')) return
    try {
      await api.post(`/rides/${rideId}/mark-paid`)
      alert('✅ Payment confirmed!')
      navigate('/driver')
    } catch (e) {
      alert('Failed')
    }
  }

  if (loading) return <div className="container"><p>Generating QR...</p></div>
  if (!qr) return <div className="container"><p>Could not load QR</p></div>

  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: 30 }}>
      <h2>Collect Payment</h2>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
        Show this QR to the customer
      </p>

      <div className="card" style={{ background: '#fffde7' }}>
        <p style={{ fontSize: 13, color: '#666' }}>Amount to collect</p>
        <h1 style={{ fontSize: 44, color: '#1a1a1a', margin: '10px 0' }}>
          ₹{qr.amount}
        </h1>
        <p style={{ fontSize: 12, color: '#888' }}>
          Ride #{qr.ride_id} • {qr.upi_id}
        </p>
      </div>

      <div
        style={{
          background: 'white',
          padding: 20,
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          margin: '20px 0'
        }}
      >
        <img
          src={`http://localhost:5000${qr.qr_url}`}
          alt="UPI QR"
          style={{ width: '100%', maxWidth: 320, display: 'block', margin: '0 auto' }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 16,
            marginTop: 16,
            fontSize: 12,
            color: '#888'
          }}
        >
          <span>📱 PhonePe</span>
          <span>GPay</span>
          <span>Paytm</span>
          <span>BHIM</span>
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
        Customer scans with any UPI app → money goes to your UPI ID
      </p>

      <button className="btn-primary" onClick={markPaid}>
        ✅ Payment Received
      </button>

      <button className="btn-outline" onClick={() => navigate('/driver')}>
        Back to Dashboard
      </button>
    </div>
  )
}