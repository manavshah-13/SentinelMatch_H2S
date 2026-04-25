import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet + React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const MissionMap = ({ missions, currentPosition, volunteers = [] }) => {
  const center = currentPosition || [12.9716, 77.5946];

  const getUrgencyColor = (urgency) => {
    if (urgency >= 4) return '#ff4d4d';
    if (urgency >= 2) return '#ffcc00';
    return '#00f2ff';
  };

  return (
    <div style={{ 
      height: '600px', 
      width: '100%', 
      borderRadius: '24px', 
      overflow: 'hidden', 
      border: '2px solid var(--primary)', 
      marginTop: '2rem',
      position: 'relative',
      boxShadow: '0 0 40px rgba(0, 242, 255, 0.15)'
    }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        background: 'rgba(10, 11, 30, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: '10px 20px',
        borderRadius: '12px',
        border: '1px solid var(--primary)',
        color: '#fff',
        fontSize: '0.8rem',
        fontWeight: 'bold'
      }}>
        {missions.length} Active Crises in Sector
      </div>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {currentPosition && (
          <Marker position={currentPosition}>
            <Popup>Your Current Location</Popup>
          </Marker>
        )}

        {missions.map((mission) => {
          const pos = mission.location.latitude 
            ? [mission.location.latitude, mission.location.longitude]
            : [mission.location.lat, mission.location.lon || mission.location.lng];

          return (
            <Marker key={mission.id} position={pos}>
              <Popup>
                <div style={{ color: '#000' }}>
                  <h4 style={{ margin: '0 0 5px 0' }}>{mission.category}</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem' }}>{mission.summary}</p>
                  <span style={{ 
                    color: getUrgencyColor(mission.urgency), 
                    fontWeight: 'bold',
                    fontSize: '0.7rem'
                  }}>
                    Urgency: {mission.urgency}/5
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {volunteers.map((v) => (
          <Marker 
            key={v.id} 
            position={[v.location.lat, v.location.lon]}
            icon={new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          >
            <Popup>
              <div style={{ color: '#000' }}>
                <h4 style={{ margin: 0 }}>Responder: {v.name}</h4>
                <p style={{ fontSize: '0.7rem', margin: '4px 0' }}>{v.skills.join(', ')}</p>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{v.distance} km away</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MissionMap;
