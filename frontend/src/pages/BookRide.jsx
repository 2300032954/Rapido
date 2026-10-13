import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/axios'
import { useAuth } from '../context/AuthContext'
import MapPicker from '../components/MapPicker'
import AddressSearch from '../components/AddressSearch'

export default function BookRide() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pickupText, setPickupText] = useState('')
  const [dropText, setDropText] = useState('')
  const [pickup, setPickup] = useState(null)
  const [dropoff, setDropoff] = useState(null)
  const [estimate, setEstimate] = useState(null)
  const [vehicleType, setVehicleType] = useState('auto')
  const [loading, setLoading] = useState(false)
  const [picking, setPicking] = useState('pickup')

  // Called when user taps map OR picks from suggestion
  const handlePick = (coords) => {
    if (picking === 'pickup') {
      setPickup(coords)
      setPicking('dropoff')
    } else {
      setDropoff(coords)
    }
  }

  // Called when user selects from the search dropdown
  const handlePickupSearch = (place) => {
    setPickup({ lat: place.lat, lng: place.lng })
    setPickupText(place.shortName)
    setPicking('dropoff')
  }

  const handleDropSearch = (place) => {
    setDropoff({ lat: place.lat, lng: place.lng })
    setDropText(place.shortName)
  }

  const getEstimate = async () => {
    if (!pickup || !dropoff) return alert('Pick both locations')
    const res = await api.post('/estimate', {
      pickup_lat: pickup.lat, pickup_lng: pickup.lng,
      dropoff_lat: dropoff.lat, dropoff_lng: dropoff.lng
    })
    setEstimate(res.data)
  }

  const bookNow = async () => {
    if (!pickup || !dropoff) return alert('Pick both locations')
    setLoading(true)
    try {
      const res = await api.post('/rides/book', {
        user_id: user.id,
        pickup: pickupText || 'Pickup',
        dropoff: dropText || 'Drop',
        pickup_lat: pickup.lat, pickup_lng: pickup.lng,
        dropoff_lat: dropoff.lat, dropoff_lng: dropoff.lng,
        vehicle_type: vehicleType
      })
      navigate(`/track/${res.data.id}`)
    } catch (e) {
      alert('Booking failed')
    }
    setLoading(false)
  }

  return (
    <div className="container">
      <h2>Book a Ride</h2>

      {/* Search suggestions */}
      <AddressSearch
        label="Pickup"
        placeholder="🔍 Search pickup location..."
        value={pickupText}
        onSelect={handlePickupSearch}
      />

      <AddressSearch
        label="Drop"
        placeholder="🔍 Search drop location..."
        value={dropText}
        onSelect={handleDropSearch}
      />

      <p style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
        Or tap on map to pick: <b>{picking === 'pickup' ? 'PICKUP' : 'DROP'}</b>
      </p>

      <MapPicker pickup={pickup} dropoff={dropoff} onPick={handlePick} />

      <button className="btn-secondary" onClick={getEstimate}>
        Get Fare Estimate
      </button>

      {estimate && (
        <>
          <p style={{ marginTop: 12, color: '#888', fontSize: 13 }}>
            Distance: <b>{estimate.distance_km} km</b>
          </p>

          {['auto', 'bike', 'cab'].map((v) => (
            <div
              key={v}
              className={`vehicle-option ${vehicleType === v ? 'selected' : ''}`}
              onClick={() => setVehicleType(v)}
            >
              <div>
                <p style={{ fontWeight: 700, textTransform: 'capitalize' }}>
                  {v === 'auto' ? '🛺' : v === 'bike' ? '🏍️' : '🚗'} {v}
                </p>
                <p style={{ fontSize: 12, color: '#888' }}>~5 mins away</p>
              </div>
              <span className="fare-tag">₹{estimate[v]}</span>
            </div>
          ))}
        </>
      )}

      <button className="btn-primary" onClick={bookNow} disabled={loading || !estimate}>
        {loading ? 'Booking...' : `Confirm & Book ${vehicleType}`}
      </button>
    </div>
  )
}