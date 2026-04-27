import { useState, useEffect, useCallback } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { suscribirUbicaciones } from '../../firebase/firestore'

const MTY_CENTER = { lat: 25.6866, lng: -100.3161 }
const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { elementType: 'geometry',       stylers: [{ color: '#0f1829' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0f1829' }] },
    { elementType: 'labels.text.fill',   stylers: [{ color: '#5a7090' }] },
    { featureType: 'road',           elementType: 'geometry', stylers: [{ color: '#1e2d45' }] },
    { featureType: 'road',           elementType: 'labels.text.fill', stylers: [{ color: '#5a7090' }] },
    { featureType: 'water',          elementType: 'geometry', stylers: [{ color: '#080d1a' }] },
    { featureType: 'poi',            stylers: [{ visibility: 'off' }] },
    { featureType: 'transit',        stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1e2d45' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#dde6f0' }] },
  ],
}

const STATUS_COLOR = {
  en_ruta:   '#00e676',
  pendiente: '#ffb300',
  sin_senal: '#ff4444',
}

function markerIcon(status) {
  const color = STATUS_COLOR[status] ?? STATUS_COLOR.sin_senal
  return {
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z',
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#080d1a',
    strokeWeight: 1.5,
    scale: 1.4,
    anchor: { x: 12, y: 24 },
  }
}

function timeAgo(ts) {
  if (!ts) return 'sin datos'
  const sec = Math.floor((Date.now() - ts.toMillis()) / 1000)
  if (sec < 60)  return 'hace un momento'
  if (sec < 3600) return `hace ${Math.floor(sec / 60)} min`
  return `hace ${Math.floor(sec / 3600)} h`
}

export default function MapTab({ tecnicosMap, tecnicoStats }) {
  const [ubicaciones, setUbicaciones] = useState({})
  const [selected, setSelected]       = useState(null)
  const [mapRef, setMapRef]           = useState(null)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY ?? '',
  })

  useEffect(() => {
    const unsub = suscribirUbicaciones(setUbicaciones)
    return unsub
  }, [])

  const onLoad = useCallback((map) => setMapRef(map), [])

  if (loadError) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Error al cargar el mapa</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          Verifica que VITE_GOOGLE_MAPS_KEY sea válida y que Maps JavaScript API esté habilitada.
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontSize: 13 }}>
        Cargando mapa...
      </div>
    )
  }

  const tecnicoIds = Object.keys(tecnicosMap)
  const ubicActivas = tecnicoIds.filter((id) => ubicaciones[id])
  const sinSenal    = tecnicoIds.filter((id) => !ubicaciones[id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Legend */}
      <div className="card" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '10px 14px' }}>
        {[
          { color: '#00e676', label: 'En ruta' },
          { color: '#ffb300', label: 'Pendiente' },
          { color: '#ff4444', label: 'Sin señal' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
            {label}
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
          {ubicActivas.length}/{tecnicoIds.length} técnicos activos
        </div>
      </div>

      {/* Map */}
      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: 340 }}
          center={MTY_CENTER}
          zoom={12}
          options={MAP_OPTIONS}
          onLoad={onLoad}
        >
          {tecnicoIds.map((id) => {
            const ub  = ubicaciones[id]
            if (!ub?.lat || !ub?.lng) return null
            const tec = tecnicosMap[id]
            return (
              <Marker
                key={id}
                position={{ lat: ub.lat, lng: ub.lng }}
                icon={markerIcon(ub.status ?? 'sin_senal')}
                onClick={() => setSelected(id)}
              />
            )
          })}

          {selected && ubicaciones[selected] && (
            <InfoWindow
              position={{ lat: ubicaciones[selected].lat, lng: ubicaciones[selected].lng }}
              onCloseClick={() => setSelected(null)}
            >
              <div style={{
                background: '#0f1829', color: '#dde6f0', borderRadius: 8,
                padding: '10px 14px', minWidth: 160, fontSize: 13,
              }}>
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>
                  {tecnicosMap[selected]?.nombre ?? selected}
                </div>
                {(() => {
                  const st  = tecnicoStats?.[selected]
                  const ub  = ubicaciones[selected]
                  const label = { en_ruta: 'En ruta', pendiente: 'Pendiente', sin_senal: 'Sin señal' }
                  return (
                    <>
                      <div style={{ color: STATUS_COLOR[ub.status] ?? '#ff4444', marginBottom: 4 }}>
                        ● {label[ub.status] ?? 'Desconocido'}
                      </div>
                      {st && (
                        <>
                          <div style={{ color: '#5a7090', fontSize: 12 }}>
                            {st.completados}/{st.total} servicios hoy
                          </div>
                          {st.ultimoNombre && (
                            <div style={{ color: '#5a7090', fontSize: 11, marginTop: 3 }}>
                              Último: {st.ultimoNombre}
                            </div>
                          )}
                        </>
                      )}
                      <div style={{ color: '#5a7090', fontSize: 11, marginTop: 4 }}>
                        {timeAgo(ub.timestamp)}
                      </div>
                    </>
                  )
                })()}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {/* Sin señal notice */}
      {sinSenal.length > 0 && (
        <div className="card" style={{ padding: '10px 14px' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Sin ubicación reciente</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {sinSenal.map((id) => (
              <span key={id} className="badge badge-red" style={{ fontSize: 11 }}>
                {tecnicosMap[id]?.nombre ?? id}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Technician list */}
      {tecnicoIds.length > 0 && (
        <div className="section-title" style={{ marginTop: 4 }}>Estado en tiempo real</div>
      )}
      {tecnicoIds.map((id) => {
        const tec = tecnicosMap[id]
        const ub  = ubicaciones[id]
        const st  = tecnicoStats?.[id]
        const statusKey = ub?.status ?? 'sin_senal'
        const color     = STATUS_COLOR[statusKey]
        return (
          <div key={id} className="card" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="avatar">{(tec?.nombre ?? id).slice(0, 2).toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{tec?.nombre ?? id}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {ub ? timeAgo(ub.timestamp) : 'Sin señal'}
                {st && ` · ${st.completados}/${st.total} servicios`}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 12, color }}>{
                { en_ruta: 'En ruta', pendiente: 'Pendiente', sin_senal: 'Sin señal' }[statusKey]
              }</span>
            </div>
            {ub?.lat && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11, padding: '4px 8px' }}
                onClick={() => {
                  mapRef?.panTo({ lat: ub.lat, lng: ub.lng })
                  mapRef?.setZoom(15)
                  setSelected(id)
                }}
              >
                Ver
              </button>
            )}
          </div>
        )
      })}

      {tecnicoIds.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>👷</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>No hay técnicos registrados.</div>
        </div>
      )}
    </div>
  )
}
