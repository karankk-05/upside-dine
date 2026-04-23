import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useCrowdHistory } from '../hooks/useCrowdHistory';
import '../styles/crowd.css';

const DENSITY_COLORS = {
  low: '#4ade80',
  moderate: '#fbbf24',
  high: '#f87171',
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div
      style={{
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 12,
      }}
    >
      <p style={{ fontWeight: 700, marginBottom: 4 }}>{d.timeLabel}</p>
      <p style={{ color: '#d45555' }}>Density: {Math.round(d.density_percentage)}%</p>
      <p style={{ color: '#999' }}>People: {d.estimated_count}</p>
      <p style={{ color: '#999' }}>Wait: {Math.round(d.estimated_wait_minutes || 0)} min</p>
    </div>
  );
}

/**
 * Hourly crowd density chart using Recharts AreaChart.
 * Includes date picker for past trends.
 * Props: messId
 */
export default function CrowdHistoryChart({ messId }) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: rawHistory = [], isLoading } = useCrowdHistory(messId, selectedDate);

  const chartData = useMemo(() => {
    return rawHistory.map((m) => {
      const dt = new Date(m.recorded_at);
      return {
        ...m,
        timeLabel: format(dt, 'h:mm a'),
        hour: dt.getHours(),
      };
    });
  }, [rawHistory]);

  // Past 7 day options
  const dateOptions = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), i);
      return { value: format(d, 'yyyy-MM-dd'), label: format(d, 'MMM dd') };
    });
  }, []);

  // Determine dominant density level for the gradient color
  const dominantLevel = useMemo(() => {
    if (!chartData.length) return 'low';
    const avgPct =
      chartData.reduce((s, d) => s + d.density_percentage, 0) / chartData.length;
    if (avgPct >= 70) return 'high';
    if (avgPct >= 40) return 'moderate';
    return 'low';
  }, [chartData]);

  const gradientColor = DENSITY_COLORS[dominantLevel];

  return (
    <div className="chart-container">
      <div className="chart-container__header">
        <div className="chart-container__title">
          <BarChart3 size={16} color="var(--st-accent)" />
          Crowd History
        </div>
        <select
          className="chart-container__date-picker"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          aria-label="Select date"
        >
          {dateOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="skeleton skeleton-chart" />
      ) : chartData.length === 0 ? (
        <div className="crowd-empty">
          <div className="crowd-empty__icon">📊</div>
          <p>No data available for this date</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="densityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={gradientColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={gradientColor} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis
              dataKey="timeLabel"
              stroke="#555"
              tick={{ fill: '#999', fontSize: 11 }}
              axisLine={{ stroke: '#333' }}
              minTickGap={24}
            />
            <YAxis
              stroke="#555"
              tick={{ fill: '#999', fontSize: 11 }}
              axisLine={{ stroke: '#333' }}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="density_percentage"
              stroke={gradientColor}
              strokeWidth={2}
              fill="url(#densityGradient)"
              dot={false}
              activeDot={{ r: 5, fill: gradientColor, stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
