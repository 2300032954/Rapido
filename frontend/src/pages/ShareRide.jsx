import { useState } from 'react'
import { api } from '../api/axios'
import { useAuth } from '../context/AuthContext'
import MapPicker from '../components/MapPicker'
import AddressSearch from '../components/AddressSearch'

export default function ShareRide() {
  const { user } = useAuth()
  const [pickup, setPickup] = useState(null)
  const [dropoff, setDropoff] = useState(null)
  const [pickupText, setPickupText] = useState('')
  const [dropText, setDropText] = useState('')
  const [picking, setPicking] = useState('pickup')
  const [matches, setMatches] = useState([])
  const [code, setCode] = useState('')
  const [joinStatus, setJoinStatus] = useState('')

  const handlePick = (c) => {
    if (picking === 'pickup') { setPickup(c); setPicking('dropoff') }
    else setDropoff(c)
  }

  const handlePickupSearch = (place) => {
    setPickup({ lat: place.lat, lng: place.lng })
    setPickupText(place.shortName)
    setPicking('dropoff')
  }

  const handleDropSearch = (place) => {
    setDropoff({ lat: place.lat, lng: place.lng })
    setDropText(place.shortName)
  }

  const findMatches = async () => {
    if (!pickup || !dropoff) return alert('Pick both locations')
    const res = await api.post('/share/find-matches', {
      pickup_lat: pickup.lat, pickup_lng: pickup.lng,
      dropoff_lat: dropoff.lat, dropoff_lng: dropoff.lng
    })
    setMatches(res.data.matches)
    if (res.data.matches.length === 0) {
      alert('No shared rides on your route right now. Try again later or book your own.')
    }
  }

  const joinByCode = async () => {
    if (!pickup) return alert('Pick your pickup location first')
    try {
      const res = await api.post('/share/join', {
        share_code: code.toUpperCase(),
        user_id: user.id,
        lat: pickup.lat,
        lng: pickup.lng
      })
      setJoinStatus(`✅ Request sent! Waiting for rider to accept.`)
    } catch (e) {
      setJoinStatus('❌ ' + (e.response?.data?.error || 'Failed to join'))
    }
  }

  const joinMatch = async (m) => {
    if (!pickup) return alert('Pick your pickup location first')
    try {
      await api.post('/share/join', {
        share_code: m.share_code,
        user_id: user.id,
        lat: pickup.lat,
        lng: pickup.lng
      })
      alert(`✅ Request sent to ride #${m.ride_id}. They will approve soon.`)
    } catch (e) {
      alert('Failed to join')
    }
  }

  return (
    <div className="container">
      <h2>Share a Ride 🤝</h2>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>
        Split the fare with riders going the same way.
      </p>

      <AddressSearch
        label="Your pickup"
        placeholder="🔍 Search pickup..."
        value={pickupText}
        onSelect={handlePickupSearch}
      />

      <AddressSearch
        label="Your drop"
        placeholder="🔍 Search drop..."
        value={dropText}
        onSelect={handleDropSearch}
      />

      <p style={{ fontSize: 13, color: '#888' }}>
        Or tap on map to pick: <b>{picking === 'pickup' ? 'PICKUP' : 'DROP'}</b>
      </p>

      <MapPicker pickup={pickup} dropoff={dropoff} onPick={handlePick} />

      <button className="btn-primary" onClick={findMatches}>
        🔍 Find matching shared rides
      </button>

      {matches.length > 0 && (
        <div className="card">
          <h3>{matches.length} ride(s) found</h3>
          {matches.map((m) => (
            <div key={m.ride_id} className="card" style={{ background: '#f9f9f9' }}>
              <p style={{ fontWeight: 700 }}>{m.pickup} → {m.dropoff}</p>
              <p style={{ fontSize: 13, color: '#888' }}>
                Total fare: ₹{m.total_fare} • <b style={{ color: '#2e7d32' }}>Your share: ₹{m.your_share}</b>
              </p>
              <p style={{ fontSize: 12, color: '#888' }}>Code: {m.share_code}</p>
              <button className="btn-primary" onClick={() => joinMatch(m)}>
                Join this ride
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3>Have a share code?</h3>
        <input
          placeholder="Enter 6-char code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
        />
        <button className="btn-secondary" onClick={joinByCode} disabled={!code}>
          Join by code
        </button>
        {joinStatus && <p style={{ fontSize: 13, marginTop: 8 }}>{joinStatus}</p>}
      </div>
    </div>
  )
}