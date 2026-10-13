import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone')
  const [devOtp, setDevOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const sendOtp = async () => {
    if (phone.length < 10) return setError('Enter valid 10-digit phone')
    setError(''); setLoading(true)
    try {
      const res = await api.post('/send-otp', { phone })
      setDevOtp(res.data.dev_otp)
      setStep('otp')
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to send OTP')
    }
    setLoading(false)
  }

  const verifyOtp = async () => {
    if (otp.length !== 6) return setError('Enter 6-digit OTP')
    setError(''); setLoading(true)
    try {
      const res = await api.post('/verify-otp', { phone, otp })
      login(res.data.user)
      navigate('/')
    } catch (e) {
      setError(e.response?.data?.error || 'Invalid OTP')
    }
    setLoading(false)
  }

  return (
    <div className="container" style={{ paddingTop: 80 }}>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <div style={{ fontSize: 60 }}>🛺</div>
        <h1>Rapido Clone</h1>
        <p style={{ color: '#888' }}>Book. Track. Share. Save.</p>
      </div>

      {error && (
        <div style={{ background: '#ffebee', color: '#c62828', padding: 12, borderRadius: 8, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {step === 'phone' && (
        <div className="card">
          <h3>Enter your phone</h3>
          <input
            type="tel"
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            maxLength={10}
          />
          <button className="btn-primary" onClick={sendOtp} disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </div>
      )}

      {step === 'otp' && (
        <div className="card">
          <h3>Enter OTP</h3>
          <p style={{ color: '#888', fontSize: 13 }}>Sent to +91 {phone}</p>
          {devOtp && (
            <p style={{ background: '#fffde7', padding: 8, borderRadius: 6, fontSize: 13 }}>
              🔧 DEV OTP: <b>{devOtp}</b>
            </p>
          )}
          <input
            type="text"
            placeholder="6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            maxLength={6}
          />
          <button className="btn-primary" onClick={verifyOtp} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify & Login'}
          </button>
          <button className="btn-outline" onClick={() => setStep('phone')}>
            Change number
          </button>
        </div>
      )}
    </div>
  )
}