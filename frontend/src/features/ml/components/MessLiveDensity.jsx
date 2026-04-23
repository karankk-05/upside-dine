import React from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, Activity } from 'lucide-react';
import DensityIndicator from './DensityIndicator';
import { useLiveCrowdDensity } from '../hooks/useLiveCrowdDensity';
import '../styles/crowd.css';

/**
 * Real-time crowd density card for a single mess.
 * Shows density level, person count, estimated wait time.
 * Props: messId, messName, onClick
 */
export default function MessLiveDensity({ messId, messName, onClick }) {
  const { data, isLoading, isError } = useLiveCrowdDensity(messId);

  if (isLoading) {
    return <div className="skeleton skeleton-card" />;
  }

  if (isError || !data) {
    return (
      <div className="density-card" onClick={onClick}>
        <div className="density-card__header">
          <span className="density-card__name">{messName || `Mess ${messId}`}</span>
        </div>
        <div className="crowd-empty" style={{ padding: '12px 0' }}>
          <span style={{ fontSize: 20 }}>📡</span>
          <p style={{ fontSize: 12, marginTop: 4 }}>No data available</p>
        </div>
      </div>
    );
  }

  const level = data.density_level || 'low';
  const waitMin = Math.round(data.estimated_wait_minutes || 0);
  const personCount = data.person_count || 0;
  const densityPct = Math.round(data.density_percentage || 0);
  const isDemoMode = Boolean(data.demo_mode);

  return (
    <motion.div
      className={`density-card density-card--${level}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="density-card__header">
        <span className="density-card__name">{messName || `Mess ${messId}`}</span>
        <div
          className={`density-card__live-badge ${
            isDemoMode ? 'density-card__live-badge--demo' : ''
          }`}
        >
          <span className="density-card__live-dot" />
          {isDemoMode ? 'DEMO' : 'LIVE'}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <DensityIndicator level={level} />
      </div>

      <div className="density-card__stats">
        <div className="density-card__stat">
          <div className="density-card__stat-value">
            <Users size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            {personCount}
          </div>
          <div className="density-card__stat-label">People</div>
        </div>

        <div className="density-card__stat">
          <div className="density-card__stat-value">
            <Clock size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            {waitMin}m
          </div>
          <div className="density-card__stat-label">Wait Time</div>
        </div>

        <div className="density-card__stat">
          <div className="density-card__stat-value">
            <Activity size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            {densityPct}%
          </div>
          <div className="density-card__stat-label">Density</div>
        </div>
      </div>
    </motion.div>
  );
}
