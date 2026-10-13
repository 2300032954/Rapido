import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix default marker icons (Leaflet + Vite bug)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng })
    }
  })
  return null
}

// Auto-pan the map when pickup or dropoff changes (from search)
function RecenterMap({ pickup, dropoff }) {
  const map = useMap()

  useEffect(() => {
    const target = dropoff || pickup
    if (target) {
      map.setView([target.lat, target.lng], 15, { animate: true })
    }
  }, [pickup, dropoff, map])

  return null
}

export default function MapPicker({ pickup, dropoff, onPick }) {
  return (
    <MapContainer
      center={[12.9716, 77.5946]}
      zoom={12}
      className="map-picker"
      style={{ height: 320, width: '100%', borderRadius: 12 }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {pickup && <Marker position={[pickup.lat, pickup.lng]} />}
      {dropoff && <Marker position={[dropoff.lat, dropoff.lng]} />}
      <ClickHandler onPick={onPick} />
      <RecenterMap pickup={pickup} dropoff={dropoff} />
    </MapContainer>
  )
}