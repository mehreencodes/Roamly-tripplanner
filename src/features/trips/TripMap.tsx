
import { useEffect, useMemo } from 'react'
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Polyline,
  useMap,
} from 'react-leaflet'
import { divIcon, type LatLngTuple } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { formatDuration } from '@/lib/format'
import type { Activity } from '@/types/trip'
import type { Attraction } from '@/types/destination'
import { formatTime } from '@/features/trips/tripUtils'

const numberedIcon = (n: number, selected = false) =>
  divIcon({
    className: '',
    html: `<div class="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta text-sm font-semibold text-white shadow-lg ${selected ? 'ring-4 ring-forest' : 'ring-2 ring-white'}">${n}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  })

// function FitBounds({ points }: { points: LatLngTuple[] }) {
//   const map = useMap()

//   useEffect(() => {
//     if (points.length === 1) {
//       map.setView(points[0], 12)
//     } else if (points.length > 1) {
//       map.fitBounds(points, { padding: [48, 48] })
//     }
//   }, [map, points])

//   return null
// }
function FitBounds({ points }: { points: LatLngTuple[] }) {
  const map = useMap()
  // Sirf tab refit ho jab coordinates sach mein badlen
  const signature = points.map((p) => p.join(',')).join('|')

  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 12)
    else if (points.length > 1) map.fitBounds(points, { padding: [48, 48] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, signature])

  return null
}

interface TripMapProps {
  activities: Activity[]
  attractions: Attraction[]
  selectedActivityId: string | null
  onSelectActivity: (id: string) => void
}

export default function TripMap({
  activities,
  attractions,
  selectedActivityId,
  onSelectActivity,
}: TripMapProps) {
  const locations = useMemo(() => {
    return activities.flatMap((activity, index) => {
      const place = attractions.find(
        (attraction) => attraction.id === activity.placeId,
      )

      if (!place) return []

      return [
        {
          activity,
          place,
          index,
          position: [
            place.coordinates.lat,
            place.coordinates.lng,
          ] as LatLngTuple,
        },
      ]
    })
  }, [activities, attractions])

  const points = useMemo(
    () => locations.map((location) => location.position),
    [locations],
  )

  const unlocatedCount = activities.length - locations.length

  if (locations.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-sand bg-white/60 px-6 py-14 text-center">
        <p className="font-display text-xl text-forest">
          No locations to show
        </p>
        <p className="mt-2 text-sm text-muted">
          Add destination places with coordinates to see them on the map.
        </p>
        {unlocatedCount > 0 && (
          <p className="mt-3 text-xs text-muted">
            {unlocatedCount} {unlocatedCount === 1 ? 'activity has' : 'activities have'} no location
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {unlocatedCount > 0 && (
        <p className="rounded-xl bg-sand/60 px-4 py-3 text-sm text-muted">
          {unlocatedCount} {unlocatedCount === 1 ? 'activity has' : 'activities have'} no location and won't appear on the map.
        </p>
      )}

      <div
        role="region"
        aria-label="Map of planned trip activities"
        className="relative isolate z-0 h-[360px] overflow-hidden rounded-3xl border border-sand lg:h-[480px]"
      >
        <MapContainer
          center={points[0]}
          zoom={10}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds points={points} />

          {points.length > 1 && (
            <Polyline
              positions={points}
              pathOptions={{
                color: '#C66B50',
                weight: 4,
                opacity: 0.8,
              }}
            />
          )}

          {locations.map(({ activity, index, position }) => (
          <Marker
  key={activity.id}
  position={position}
  icon={numberedIcon(
    index + 1,
    selectedActivityId === activity.id,
  )}
  zIndexOffset={selectedActivityId === activity.id ? 1000 : 0}
  eventHandlers={{
    click: () => onSelectActivity(activity.id),
  }}
>
             <Popup>
  <strong>{index + 1}. {activity.title}</strong>
  <br />
  {activity.startMin !== null && `${formatTime(activity.startMin)} · `}
  {formatDuration(activity.durationMin)}
</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <p className="text-xs text-muted">
        Numbers match the activities in your itinerary. The line connects them in planned order.
      </p>
    </div>
  )
}
