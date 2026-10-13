import { useState, useEffect, useRef } from 'react'

export default function AddressSearch({ placeholder, value, onSelect, label }) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!query || query.length < 3) {
      setResults([])
      return
    }
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        // Photon — better for small places (apartments, shops, malls)
        const photonRes = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8&lang=en&lat=12.9716&lon=77.5946`
        )
        const photonData = await photonRes.json()

        // Map Photon results to our format
        const mapped = (photonData.features || [])
          .filter((f) => {
            const c = f.properties.countrycode
            return c === 'IN' // limit to India
          })
          .map((f) => {
            const p = f.properties
            const [lng, lat] = f.geometry.coordinates

            // Build a nice name like Google Maps
            const primary = p.name || p.street || 'Unknown place'
            const secondary = [
              p.street && p.name !== p.street ? p.street : null,
              p.district,
              p.city,
              p.state
            ].filter(Boolean).join(', ')

            return {
              primary,
              secondary,
              full: secondary ? `${primary}, ${secondary}` : primary,
              lat,
              lng
            }
          })

        setResults(mapped)
        setOpen(true)
      } catch (e) {
        setResults([])
      }
      setLoading(false)
    }, 350)

    return () => clearTimeout(timerRef.current)
  }, [query])

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const pick = (r) => {
    setQuery(r.primary)
    setOpen(false)
    setResults([])
    onSelect({
      name: r.full,
      shortName: r.primary,
      lat: r.lat,
      lng: r.lng
    })
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', margin: '8px 0' }}>
      {label && (
        <p style={{ fontSize: 12, color: '#888', marginBottom: 4, paddingLeft: 4 }}>
          {label}
        </p>
      )}

      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 3 && setOpen(true)}
        style={{ margin: 0 }}
        autoComplete="off"
      />

      {loading && (
        <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Searching...</p>
      )}

      {open && results.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 9999,
            maxHeight: 320,
            overflowY: 'auto',
            marginTop: 4
          }}
        >
          {results.map((r, i) => (
            <div
              key={i}
              onClick={() => pick(r)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: i < results.length - 1 ? '1px solid #f0f0f0' : 'none',
                fontSize: 13,
                lineHeight: 1.4
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#fffde7')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
            >
              <div style={{ fontWeight: 600, color: '#1a1a1a' }}>
                📍 {r.primary}
              </div>
              {r.secondary && (
                <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>
                  {r.secondary}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}