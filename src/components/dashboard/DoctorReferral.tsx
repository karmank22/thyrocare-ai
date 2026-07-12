import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Facility, ReferralTier } from '../../types';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue in Vite
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Props {
  referralTier: ReferralTier;
  facilities: Facility[];
  emergencyFlag: boolean;
  referralTrigger?: string;
}

const TIER_LABELS: Record<ReferralTier, string> = {
  none: '✅ No Referral Needed',
  telemedicine: '💻 Telemedicine (e-Sanjeevani)',
  pmjay: '🏥 PMJAY Hospital',
  emergency: '🚨 Emergency — 104 Helpline',
};

const TIER_COLORS: Record<ReferralTier, string> = {
  none: '#00c896', telemedicine: '#00a3ff', pmjay: '#f59e0b', emergency: '#ef4444',
};

const CHANNEL_LABELS: Record<string, string> = {
  pmjay: 'PMJAY Hospital',
  e_sanjeevani: 'e-Sanjeevani',
  nhm_104: 'NHM 104 Emergency',
};

export default function DoctorReferral({ referralTier, facilities, emergencyFlag, referralTrigger }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Facility | null>(facilities[0] || null);

  const tierColor = TIER_COLORS[referralTier];

  return (
    <div className="glass-card panel-card panel-referral animate-fadeInUp" id="panel-doctor-referral">
      <div className="panel-title">
        <div className="panel-title-icon">🏥</div>
        {t('dashboard.referral')}
      </div>

      {/* Referral tier badge */}
      <div className="referral-tier-badge" style={{ borderColor: tierColor, color: tierColor, background: `${tierColor}18` }}>
        {TIER_LABELS[referralTier]}
      </div>
      {referralTrigger && (
        <div className="referral-trigger">⚡ Triggered by: {referralTrigger}</div>
      )}

      <div className="referral-body">
        {/* Facilities list */}
        <div className="facilities-list">
          <div className="facilities-title">{t('referral.nearest_facilities')}</div>
          {facilities.map(f => (
            <div
              key={f.facility_id}
              className={`facility-item glass-card ${selected?.facility_id === f.facility_id ? 'selected' : ''}`}
              onClick={() => setSelected(f)}
              id={`facility-${f.facility_id}`}
            >
              <div className="facility-header">
                <span className="facility-name">{f.facility_name}</span>
                <span className="facility-distance">{f.distance_km} {t('referral.distance')}</span>
              </div>
              <div className="facility-meta">
                <span className="tag">{CHANNEL_LABELS[f.channel] || f.channel}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.address}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Map */}
        <div className="referral-map-wrap">
          <MapContainer
            center={[30.9010, 75.8573]}
            zoom={10}
            style={{ height: '100%', width: '100%', borderRadius: 12 }}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {facilities.map(f => (
              <Marker key={f.facility_id} position={[f.facility_lat, f.facility_lng]}>
                <Popup>
                  <div style={{ color: '#000' }}>
                    <strong>{f.facility_name}</strong><br />
                    {f.address}<br />
                    <em>{f.distance_km} km away</em>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Action buttons */}
      <div className="referral-actions">
        {referralTier === 'emergency' && (
          <a href="tel:104" className="btn btn-danger" id="btn-104-referral">
            📞 Call 104 Now
          </a>
        )}
        {(referralTier === 'telemedicine' || referralTier === 'emergency') && (
          <a href="https://esanjeevani.mohfw.gov.in" target="_blank" rel="noopener noreferrer"
            className="btn btn-primary" id="btn-esanjeevani">
            💻 {t('dashboard.book_telemedicine')}
          </a>
        )}
        {(referralTier === 'pmjay' || referralTier === 'emergency') && selected && (
          <button className="btn btn-secondary" id="btn-pmjay-directions">
            🗺️ Get Directions to {selected.facility_name.split(' ').slice(0, 3).join(' ')}...
          </button>
        )}
      </div>
    </div>
  );
}
