import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ArrowLeft, BarChart3, Clock, Users } from 'lucide-react';
import { format, subDays } from 'date-fns';
import CrowdDemoBanner from '../components/CrowdDemoBanner';
import CrowdModeToggle from '../components/CrowdModeToggle';
import MessSelector from '../components/MessSelector';
import CrowdHeatmap from '../components/CrowdHeatmap';
import { getDemoWeekHistory } from '../demo/crowdDemo';
import { useManagerCrowdMode } from '../hooks/useStudentCrowdMode';
import '../styles/crowd.css';

function AnalyticsTooltip({ active, payload }) {
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
      <p style={{ fontWeight: 700, marginBottom: 4 }}>{d.label || d.timeLabel}</p>
      <p style={{ color: '#d45555' }}>{Math.round(d.value || d.density_percentage || 0)}%</p>
      {d.estimated_count != null && <p style={{ color: '#999' }}>People: {d.estimated_count}</p>}
    </div>
  );
}

/**
 * Crowd analytics page — /manager/crowd/analytics
 * Multi-day density chart, heatmap, avg wait time stats.
 */
export default function CrowdAnalytics() {
  const navigate = useNavigate();
  const [selectedMess, setSelectedMess] = useState(null);
  const { mode, demoModeEnabled, setMode } = useManagerCrowdMode();

  // Past 7 days of history for selected (or first) mess
  const { data: messes = [] } = useQuery({
    queryKey: ['mess', 'list'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const { data } = await axios.get('/api/mess/', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return Array.isArray(data) ? data : data.results || [];
    },
    staleTime: 300000,
  });

  const activeMess = selectedMess || messes[0]?.id;

  // Fetch 7 days of history for heatmap + charts
  const { data: weekHistory = [], isLoading } = useQuery({
    queryKey: ['crowd', 'history', activeMess, 'week', demoModeEnabled ? 'demo' : 'api'],
    queryFn: async () => {
      if (!activeMess) return [];
      if (demoModeEnabled) {
        return getDemoWeekHistory(activeMess);
      }
      const token = localStorage.getItem('access_token');
      // Fetch each day's data
      const promises = Array.from({ length: 7 }, (_, i) => {
        const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
        return axios
          .get(`/api/crowd/mess/${activeMess}/history/`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            params: { date: dateStr },
          })
          .then((res) => res.data || [])
          .catch(() => []);
      });
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: !!activeMess,
    staleTime: 60000,
  });

  // Summary stats
  const stats = useMemo(() => {
    if (!weekHistory.length) {
      return { avgDensity: 0, avgWait: 0, peakHour: '—', totalReadings: 0 };
    }
    const avgDensity = Math.round(
      weekHistory.reduce((s, m) => s + m.density_percentage, 0) / weekHistory.length
    );
    const avgWait = Math.round(
      weekHistory.reduce((s, m) => s + (m.estimated_wait_minutes || 0), 0) / weekHistory.length
    );

    // Find peak hour
    const hourCounts = {};
    weekHistory.forEach((m) => {
      const h = new Date(m.recorded_at).getHours();
      hourCounts[h] = (hourCounts[h] || 0) + m.density_percentage;
    });
    const hourCountEntries = Object.entries(hourCounts);
    const peakEntry = hourCountEntries.sort((a, b) => b[1] - a[1])[0];
    const peakHour = peakEntry ? `${peakEntry[0]}:00` : '—';

    return { avgDensity, avgWait, peakHour, totalReadings: weekHistory.length };
  }, [weekHistory]);

  // Daily average for bar chart
  const dailyData = useMemo(() => {
    const dayMap = {};
    weekHistory.forEach((m) => {
      const day = format(new Date(m.recorded_at), 'MMM dd');
      if (!dayMap[day]) dayMap[day] = [];
      dayMap[day].push(m.density_percentage);
    });
    return Object.entries(dayMap).map(([label, vals]) => ({
      label,
      value: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }));
  }, [weekHistory]);

  return (
    <div className="analytics-page">
      <div className="crowd-dashboard__header">
        <div className="crowd-dashboard__header-row">
          <button
            className="crowd-dashboard__back-btn"
            onClick={() => navigate(-1)}
            aria-label="Back to overview"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="crowd-dashboard__title">Crowd Analytics</h1>
        </div>
        <p className="crowd-dashboard__subtitle">
          {demoModeEnabled
            ? 'Detailed analysis generated from simulated crowd history'
            : 'Detailed analysis — past 7 days'}
        </p>
      </div>

      <div className="crowd-dashboard__content">
        <div className="crowd-section">
          <CrowdModeToggle mode={mode} onChange={setMode} />
        </div>

        {demoModeEnabled ? (
          <div className="crowd-section">
            <CrowdDemoBanner message="Analytics are being populated from the same 10-minute presentation simulation, plus generated historical patterns." />
          </div>
        ) : null}

        {/* Mess Selector */}
        <div className="crowd-section">
          <MessSelector value={selectedMess} onChange={setSelectedMess} />
        </div>

        {/* Summary Stats */}
        <motion.div
          className="analytics-stats-row"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="analytics-stat-card">
            <div className="analytics-stat-card__value">{stats.avgDensity}%</div>
            <div className="analytics-stat-card__label">Avg Density</div>
          </div>
          <div className="analytics-stat-card">
            <div className="analytics-stat-card__value">
              <Clock size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {stats.avgWait}m
            </div>
            <div className="analytics-stat-card__label">Avg Wait</div>
          </div>
          <div className="analytics-stat-card">
            <div className="analytics-stat-card__value">{stats.peakHour}</div>
            <div className="analytics-stat-card__label">Peak Hour</div>
          </div>
          <div className="analytics-stat-card">
            <div className="analytics-stat-card__value">
              <Users size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {stats.totalReadings}
            </div>
            <div className="analytics-stat-card__label">Readings</div>
          </div>
        </motion.div>

        {/* Daily Average Bar Chart */}
        <motion.div
          className="crowd-section"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <div className="chart-container">
            <div className="chart-container__header">
              <div className="chart-container__title">
                <BarChart3 size={16} color="var(--st-accent)" />
                Daily Average Density
              </div>
            </div>
            {isLoading ? (
              <div className="skeleton skeleton-chart" />
            ) : dailyData.length === 0 ? (
              <div className="crowd-empty">
                <div className="crowd-empty__icon">📊</div>
                <p>No analytics data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis
                    dataKey="label"
                    stroke="#555"
                    tick={{ fill: '#999', fontSize: 11 }}
                    axisLine={{ stroke: '#333' }}
                  />
                  <YAxis
                    stroke="#555"
                    tick={{ fill: '#999', fontSize: 11 }}
                    axisLine={{ stroke: '#333' }}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<AnalyticsTooltip />} />
                  <Bar
                    dataKey="value"
                    fill="var(--st-accent)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Peak Hour Heatmap */}
        <motion.div
          className="crowd-section"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
        >
          <CrowdHeatmap historyData={weekHistory} />
        </motion.div>
      </div>
    </div>
  );
}
