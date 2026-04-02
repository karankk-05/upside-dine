import React, { useMemo } from 'react';
import { Flame } from 'lucide-react';
import '../styles/crowd.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM – 8 PM

function getCellLevel(value) {
  if (value == null) return 'empty';
  if (value < 35) return 'low';
  if (value < 70) return 'moderate';
  return 'high';
}

/**
 * Peak-hour heatmap visualization.
 * Props: historyData – array of CrowdMetric objects (multi-day), or null for placeholder
 */
export default function CrowdHeatmap({ historyData = [] }) {
  // Build a 7-day x 14-hour grid
  const grid = useMemo(() => {
    const map = {};
    historyData.forEach((m) => {
      const dt = new Date(m.recorded_at);
      const dayIdx = (dt.getDay() + 6) % 7; // Mon=0 ... Sun=6
      const hour = dt.getHours();
      const key = `${dayIdx}-${hour}`;
      if (!map[key]) map[key] = [];
      map[key].push(m.density_percentage);
    });

    return DAYS.map((day, dIdx) =>
      HOURS.map((hour) => {
        const key = `${dIdx}-${hour}`;
        const vals = map[key];
        if (!vals || !vals.length) return null;
        return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      })
    );
  }, [historyData]);

  return (
    <div className="crowd-heatmap">
      <div className="crowd-heatmap__title">
        <Flame size={16} color="var(--st-accent)" />
        Peak Hour Heatmap
      </div>

      {/* Hour labels */}
      <div className="crowd-heatmap__hour-labels">
        {HOURS.map((h) => (
          <span key={h} className="crowd-heatmap__hour-label">
            {h > 12 ? `${h - 12}p` : h === 12 ? '12p' : `${h}a`}
          </span>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="crowd-heatmap__grid">
        {grid.map((row, dIdx) => (
          <div key={DAYS[dIdx]} className="crowd-heatmap__row">
            <span className="crowd-heatmap__day-label">{DAYS[dIdx]}</span>
            {row.map((val, hIdx) => (
              <div
                key={hIdx}
                className={`crowd-heatmap__cell crowd-heatmap__cell--${getCellLevel(val)}`}
                title={val != null ? `${DAYS[dIdx]} ${HOURS[hIdx]}:00 — ${val}% density` : 'No data'}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="crowd-heatmap__legend">
        <span className="crowd-heatmap__legend-item">
          <span className="crowd-heatmap__legend-swatch" style={{ background: 'var(--st-light-gray)' }} />
          No data
        </span>
        <span className="crowd-heatmap__legend-item">
          <span className="crowd-heatmap__legend-swatch" style={{ background: 'rgba(34,197,94,0.3)' }} />
          Low
        </span>
        <span className="crowd-heatmap__legend-item">
          <span className="crowd-heatmap__legend-swatch" style={{ background: 'rgba(245,158,11,0.5)' }} />
          Moderate
        </span>
        <span className="crowd-heatmap__legend-item">
          <span className="crowd-heatmap__legend-swatch" style={{ background: 'rgba(239,68,68,0.6)' }} />
          High
        </span>
      </div>
    </div>
  );
}
