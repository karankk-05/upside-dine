import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import '../styles/crowd.css';

/**
 * Status cards for camera feeds — shows active/offline badge and last update time.
 * Fetches from GET /api/crowd/feeds/
 */
export default function CameraFeedStatus({ filterMessId }) {
  const { data: allFeeds = [], isLoading } = useQuery({
    queryKey: ['crowd', 'feeds'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const { data } = await axios.get('/api/crowd/feeds/', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return Array.isArray(data) ? data : data.results || [];
    },
    staleTime: 30000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="camera-feed-grid">
        {[1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />
        ))}
      </div>
    );
  }

  const feeds = filterMessId ? allFeeds.filter(f => f.mess_id === Number(filterMessId)) : allFeeds;

  if (!feeds.length) {
    return (
      <div className="crowd-empty">
        <p>No camera feeds registered</p>
      </div>
    );
  }

  return (
    <div className="camera-feed-grid">
      {feeds.map((feed, idx) => {
        const isActive = feed.is_active;
        const updatedAt = feed.created_at
          ? formatDistanceToNow(new Date(feed.created_at), { addSuffix: true })
          : 'Unknown';

        return (
          <motion.div
            key={feed.id}
            className="camera-feed-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.08 }}
          >
            <div className="camera-feed-card__header">
              <div
                className={`camera-feed-card__status ${
                  isActive ? 'camera-feed-card__status--active' : 'camera-feed-card__status--offline'
                }`}
              >
                <span className="camera-feed-card__status-dot" />
                {isActive ? 'Active' : 'Offline'}
              </div>
            </div>
            <div className="camera-feed-card__title">Feed #{feed.id}</div>
            <div className="camera-feed-card__location">
              Mess {feed.mess_id}
              {feed.location_description ? ` — ${feed.location_description}` : ''}
            </div>
            <div className="camera-feed-card__updated">
              <Clock size={10} />
              {updatedAt}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
