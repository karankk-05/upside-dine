import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import CrowdDemoBanner from '../components/CrowdDemoBanner';
import DensityIndicator from '../components/DensityIndicator';
import CameraFeedStatus from '../components/CameraFeedStatus';
import { CROWD_DEMO_LOOP_MINUTES, isCrowdDemoEnabled } from '../demo/crowdDemo';
import { useLiveCrowdDensity } from '../hooks/useLiveCrowdDensity';
import PullToRefresh from '../../../components/PullToRefresh';
import { STANDARD_INPUT_PROPS, sanitizeUrl } from '../../../lib/formValidation';
import { compareNaturalText } from '../../../lib/naturalSort';
import '../styles/crowd.css';

/**
 * Single mess card with trend arrow for manager overview.
 */
function ManagerDensityCard({ messId, messName }) {
  const { data, isLoading, isError } = useLiveCrowdDensity(messId);

  if (isLoading) return <div className="skeleton skeleton-card" />;
  if (isError || !data) {
    return (
      <div className="density-card">
        <div className="density-card__name">{messName}</div>
        <div className="crowd-empty" style={{ padding: '8px 0' }}>
          <span style={{ fontSize: 14, color: 'var(--st-text-dim)' }}>No data available</span>
        </div>
      </div>
    );
  }

  const level = data.density_level || 'low';
  const pct = Math.round(data.density_percentage || 0);
  const count = data.person_count || 0;
  const waitMin = Math.round(data.estimated_wait_minutes || 0);
  const trendDirection = data.trend_direction || (pct > 60 ? 'up' : pct < 35 ? 'down' : 'stable');

  const trendIcon =
    trendDirection === 'up' ? (
      <TrendingUp size={14} />
    ) : trendDirection === 'down' ? (
      <TrendingDown size={14} />
    ) : (
      <Minus size={14} />
    );
  const trendClass =
    trendDirection === 'up'
      ? 'trend-arrow--up'
      : trendDirection === 'down'
        ? 'trend-arrow--down'
        : 'trend-arrow--stable';

  return (
    <motion.div
      className={`density-card density-card--${level}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="density-card__header">
        <span className="density-card__name">{messName}</span>
        <span className={`trend-arrow ${trendClass}`}>
          {trendIcon}
          {trendDirection === 'up'
            ? 'Rising'
            : trendDirection === 'down'
              ? 'Falling'
              : 'Stable'}
        </span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <DensityIndicator level={level} />
      </div>

      <div className="density-card__stats">
        <div className="density-card__stat">
          <div className="density-card__stat-value">{count}</div>
          <div className="density-card__stat-label">People</div>
        </div>
        <div className="density-card__stat">
          <div className="density-card__stat-value">{pct}%</div>
          <div className="density-card__stat-label">Density</div>
        </div>
        <div className="density-card__stat">
          <div className="density-card__stat-value">{waitMin}m</div>
          <div className="density-card__stat-label">Wait</div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Manager crowd overview — /manager/crowd
 * All messes density on a single dashboard with trend arrows + camera feed status.
 */
export default function ManagerCrowdOverview() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userRole = localStorage.getItem('user_role');
  const demoModeEnabled = isCrowdDemoEnabled();
  const [feedUrl, setFeedUrl] = React.useState('');
  const [selectedFeedMess, setSelectedFeedMess] = React.useState('');
  const [submittingFeed, setSubmittingFeed] = React.useState(false);
  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['mess', 'list'] }),
      queryClient.invalidateQueries({ queryKey: ['manager', 'stats'] }),
      queryClient.invalidateQueries({ queryKey: ['crowd', 'live'] }),
      queryClient.invalidateQueries({ queryKey: ['crowd', 'feeds'] }),
    ]);
  };

  const { data: messes = [], isLoading } = useQuery({
    queryKey: ['mess', 'list'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const { data } = await axios.get('/api/mess/', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const messes = Array.isArray(data) ? data : data.results || [];
      return messes.sort((left, right) =>
        compareNaturalText(left.hall_name || left.name, right.hall_name || right.name)
      );
    },
    staleTime: 300000,
  });

  const { data: managerStats } = useQuery({
    queryKey: ['manager', 'stats'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      const { data } = await axios.get('/api/mess/manager/stats/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },
    enabled: userRole === 'mess_manager',
    retry: false,
  });

  let filteredMesses = messes;
  if (userRole === 'mess_manager' && managerStats?.mess_id) {
    filteredMesses = messes.filter(m => m.id === managerStats.mess_id);
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="manager-overview">
        <div className="crowd-dashboard__header">
        <div className="crowd-dashboard__header-row">
          <button
            className="crowd-dashboard__back-btn"
            onClick={() => {
              if (userRole === 'mess_manager') navigate('/manager/mess');
              else if (userRole === 'admin' || userRole === 'admin_manager') navigate('/manager/admin');
              else navigate(-1);
            }}
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="crowd-dashboard__title">Crowd Overview</h1>
        </div>
        <p className="crowd-dashboard__subtitle">
          {demoModeEnabled
            ? 'Manager dashboard — simulated analytics for presentation'
            : 'Manager dashboard — all mess halls'}
        </p>
      </div>

        <div className="crowd-dashboard__content">
        {demoModeEnabled ? (
          <div className="crowd-section">
            <CrowdDemoBanner message="No live camera feed is required. This dashboard now runs on a 10-minute simulation loop for your presentation." />
          </div>
        ) : null}

        {/* All Mess Density */}
        <div className="crowd-section">
          <div className="crowd-section__title">
            <BarChart3 size={16} color="var(--st-accent)" />
            {demoModeEnabled
              ? userRole === 'mess_manager'
                ? 'Your Mess — Demo Loop'
                : 'All Messes — Demo Loop'
              : userRole === 'mess_manager'
                ? 'Your Mess — Live'
                : 'All Messes — Live'}
            <button
              onClick={() => navigate('/manager/crowd/analytics')}
              style={{
                marginLeft: 'auto',
                padding: '6px 12px',
                background: 'var(--st-light-gray)',
                border: '1px solid var(--st-border)',
                borderRadius: 8,
                color: 'var(--st-accent)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              Analytics →
            </button>
          </div>

          {isLoading || (userRole === 'mess_manager' && !managerStats) ? (
            <div className="density-cards-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton skeleton-card" />
              ))}
            </div>
          ) : (
            <div className="density-cards-grid">
              {filteredMesses.map((mess) => (
                <ManagerDensityCard
                  key={mess.id}
                  messId={mess.id}
                  messName={mess.name || `Mess ${mess.id}`}
                />
              ))}
            </div>
          )}
        </div>

        {demoModeEnabled ? (
          <div className="crowd-section">
            <div className="crowd-section__title">Presentation Scenario</div>
            <div className="crowd-demo-panel">
              <h3 className="crowd-demo-panel__title">Camera-free demo is active</h3>
              <p className="crowd-demo-panel__text">
                Crowd counts, density, and wait times now move gradually on a repeating{' '}
                {CROWD_DEMO_LOOP_MINUTES}-minute loop so you can present the workflow without a
                live feed.
              </p>
              <div className="crowd-demo-panel__chips">
                <span className="crowd-demo-chip">Slow metric changes</span>
                <span className="crowd-demo-chip">No camera required</span>
                <span className="crowd-demo-chip">Analytics still populated</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="crowd-section">
            <div className="crowd-section__title">
              Camera Feeds
            </div>
            <CameraFeedStatus filterMessId={userRole === 'mess_manager' ? managerStats?.mess_id : null} messesList={messes} />

            {/* Add Camera Feed Form */}
            {userRole === 'mess_manager' && managerStats?.mess_id && (
              <div style={{ marginTop: 20, padding: 16, background: 'var(--st-light-gray)', borderRadius: 12, border: '1px solid var(--st-border)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Add Video Feed Link</h3>
                <form noValidate onSubmit={async (e) => {
                  e.preventDefault();
                  setSubmittingFeed(true);
                  try {
                    const token = localStorage.getItem('access_token');
                    const messIdToUse = selectedFeedMess || managerStats.mess_id;
                    await axios.post('/api/crowd/feeds/', {
                      mess_id: messIdToUse,
                      camera_url: feedUrl,
                      location_description: 'Added via Manager Dashboard'
                    }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
                    alert('Video feed link has been configured!');
                    setFeedUrl('');
                    queryClient.invalidateQueries({ queryKey: ['crowd', 'feeds'] });
                  } catch (err) {
                    alert(err.response?.data?.detail || 'Failed to add video feed. Ensure it is a valid URL.');
                  } finally {
                    setSubmittingFeed(false);
                  }
                }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredMesses.length > 1 && (
                    <select
                      value={selectedFeedMess}
                      onChange={(e) => setSelectedFeedMess(e.target.value)}
                      style={{ padding: 10, background: '#111', border: '1px solid #333', color: '#fff', borderRadius: 8 }}
                      required
                    >
                      <option value="">-- Select Mess --</option>
                      {filteredMesses.map(m => (
                        <option key={m.id} value={m.id}>{m.name || `Mess ${m.id}`}</option>
                      ))}
                    </select>
                  )}
                  <input 
                    value={feedUrl} 
                    onChange={(e) => setFeedUrl(sanitizeUrl(e.target.value))} 
                    placeholder="Enter RTSP or HTTP stream URL..." 
                    {...STANDARD_INPUT_PROPS.url}
                    style={{ padding: 10, background: '#111', border: '1px solid #333', color: '#fff', borderRadius: 8 }}
                    required 
                  />
                  <button 
                    type="submit" 
                    disabled={submittingFeed}
                    style={{ padding: '10px', background: 'var(--st-accent)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: submittingFeed ? 'not-allowed' : 'pointer' }}
                  >
                    {submittingFeed ? 'Saving...' : 'Save Feed URL'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </PullToRefresh>
  );
}
