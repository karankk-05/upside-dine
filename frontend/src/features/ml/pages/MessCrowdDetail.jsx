import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowLeft, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import MessLiveDensity from '../components/MessLiveDensity';
import CrowdHistoryChart from '../components/CrowdHistoryChart';
import BestTimeRecommendation from '../components/BestTimeRecommendation';
import { useCrowdSocket } from '../hooks/useCrowdSocket';
import '../styles/crowd.css';

/**
 * Detailed crowd view for a single mess — /crowd/mess/:messId
 * Hero density card + history chart + best time recommendation.
 */
export default function MessCrowdDetail() {
  const { messId } = useParams();
  const navigate = useNavigate();
  const messIdNum = Number(messId);

  // Attempt WebSocket for real-time updates
  const { isConnected } = useCrowdSocket(messIdNum);

  // Get mess name
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

  const mess = messes.find((m) => m.id === messIdNum);
  const messName = mess?.name || `Mess ${messIdNum}`;

  return (
    <div className="crowd-dashboard">
      <div className="crowd-dashboard__header">
        <div className="crowd-dashboard__header-row">
          <button
            className="crowd-dashboard__back-btn"
            onClick={() => navigate('/crowd')}
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="crowd-dashboard__title">{messName}</h1>
        </div>
        <p className="crowd-dashboard__subtitle" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Radio size={12} color={isConnected ? '#4ade80' : 'var(--st-text-dim)'} />
          {isConnected ? 'Live updates connected' : 'Polling for updates'}
        </p>
      </div>

      <div className="crowd-dashboard__content">
        {/* Live Density Hero */}
        <motion.div
          className="crowd-section"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <MessLiveDensity messId={messIdNum} messName={messName} />
        </motion.div>

        {/* History Chart */}
        <motion.div
          className="crowd-section"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <CrowdHistoryChart messId={messIdNum} />
        </motion.div>

        {/* Best Time Recommendation */}
        <motion.div
          className="crowd-section"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <BestTimeRecommendation messId={messIdNum} />
        </motion.div>
      </div>
    </div>
  );
}
