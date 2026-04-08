import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Activity, ArrowLeft } from 'lucide-react';
import MessSelector from '../components/MessSelector';
import MessLiveDensity from '../components/MessLiveDensity';
import PullToRefresh from '../../../components/PullToRefresh';
import '../styles/crowd.css';

/**
 * Student crowd overview page — /crowd
 * Shows all mess density cards. Tap a card to see detail.
 */
export default function CrowdDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedMess, setSelectedMess] = useState(null);
  const userRole = localStorage.getItem('user_role');
  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['mess', 'list'] }),
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] }),
    ]);
  };

  const { data: profile } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      const { data } = await axios.get('/api/users/me/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.profile;
    },
    enabled: userRole === 'student',
  });

  // Fetch mess list to iterate density cards
  const { data: messes = [], isLoading } = useQuery({
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

  let filteredMesses = selectedMess
    ? messes.filter((m) => m.id === selectedMess)
    : messes;

  if (userRole === 'student' && profile) {
    filteredMesses = messes.filter(m => m.hall_name?.toLowerCase() === profile.hostel_name?.toLowerCase());
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="crowd-dashboard">
        <div className="crowd-dashboard__header">
        <div className="crowd-dashboard__header-row">
          <button
            className="crowd-dashboard__back-btn"
            onClick={() => {
              if (userRole === 'student') navigate('/dashboard');
              else navigate(-1);
            }}
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="crowd-dashboard__title">Live Crowd Monitor</h1>
        </div>
        <p className="crowd-dashboard__subtitle">
          Real-time crowd density across all mess halls
        </p>
      </div>

        <div className="crowd-dashboard__content">
        {/* Mess Selector */}
        {userRole !== 'student' && (
          <div className="crowd-section">
            <MessSelector value={selectedMess} onChange={setSelectedMess} />
          </div>
        )}

        {/* Density Cards */}
        <div className="crowd-section">
          <div className="crowd-section__title">
            <Activity size={16} color="var(--st-accent)" />
            Live Density
          </div>

          {isLoading ? (
            <div className="crowd-loading">
              <div className="crowd-loading__spinner" />
              <span>Loading mess data...</span>
            </div>
          ) : filteredMesses.length === 0 ? (
            <div className="crowd-empty">
              <div className="crowd-empty__icon">🏫</div>
              <p>No messes found</p>
            </div>
          ) : (
            <motion.div
              className="density-cards-grid"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.1 } },
              }}
            >
              {filteredMesses.map((mess) => (
                <MessLiveDensity
                  key={mess.id}
                  messId={mess.id}
                  messName={mess.name || `Mess ${mess.id}`}
                  onClick={() => navigate(`/crowd/mess/${mess.id}`)}
                />
              ))}
            </motion.div>
          )}
        </div>
        </div>
      </div>
    </PullToRefresh>
  );
}
