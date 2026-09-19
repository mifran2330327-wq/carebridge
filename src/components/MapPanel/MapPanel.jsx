import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import './MapPanel.css'

const DEFAULT_CENTER = [23.8103, 90.4125]

function FitBounds({ places }) {
  const map = useMap()

  useEffect(() => {
    if (!places.length) return

    const validPlaces = places.filter((place) => Array.isArray(place.coordinates) && place.coordinates.length === 2)
    if (!validPlaces.length) return

    const bounds = validPlaces.map((place) => place.coordinates)
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [map, places])

  return null
}

export default function MapPanel({ places = [] }) {
  const validPlaces = places.filter((place) => Array.isArray(place.coordinates) && place.coordinates.length === 2)

  return (
    <div className="map-panel">
      <MapContainer center={DEFAULT_CENTER} zoom={11} scrollWheelZoom className="map-panel__map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds places={validPlaces} />

        {validPlaces.map((place, index) => (
          <CircleMarker
            key={place.id || `${place.name}-${index}`}
            center={place.coordinates}
            radius={10}
            pathOptions={{ color: '#335765', fillColor: '#335765', fillOpacity: 0.8 }}
          >
            <Popup>
              <strong>{place.name}</strong><br />
              {place.role || place.type || 'CareBridge service'}<br />
              {place.location}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
