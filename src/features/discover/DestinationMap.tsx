import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { divIcon, type LatLngTuple } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { formatDuration } from '@/lib/format'
import type { Attraction } from '@/types/destination'

// Default marker image Vite mein toot jati hai, is liye apna numbered marker
const numberedIcon = (n: number) =>
  divIcon({
    className: '',
    html: `<div class="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta text-sm font-semibold text-white shadow-lg ring-2 ring-white">${n}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  })

function FitBounds({ points }: { points: LatLngTuple[] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 12)
    else if (points.length > 1) map.fitBounds(points, { padding: [48, 48] })
  }, [map, points])
  return null
}

export default function DestinationMap({
  attractions,
  name,
}: {
  attractions: Attraction[]
  name: string
}) {
  const points = useMemo<LatLngTuple[]>(
    () => attractions.map((a) => [a.coordinates.lat, a.coordinates.lng]),
    [attractions],
  )

  if (points.length === 0) return null

  return (
    // relative + z-0 + isolate: map navbar ke upar na aaye
    <div
      role="region"
      aria-label={`Map of places in ${name}`}
      className="relative isolate z-0 h-[360px] overflow-hidden rounded-3xl border border-sand lg:h-[480px]"
    >
      <MapContainer center={points[0]} zoom={10} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {attractions.map((a, i) => (
          <Marker
            key={a.id}
            position={[a.coordinates.lat, a.coordinates.lng]}
            icon={numberedIcon(i + 1)}
          >
            <Popup>
              <strong>{a.name}</strong>
              <br />
              {formatDuration(a.durationMin)}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}