import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Clock, Edit2, Trash2, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import '../styles/crowd.css';

/**
 * Status cards for camera feeds — shows active/offline badge and last update time.
 * Fetches from GET /api/crowd/feeds/
 */
export default function CameraFeedStatus({ filterMessId }) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = React.useState(null);
  const [editUrl, setEditUrl] = React.useState('');

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this camera feed?')) return;
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`/api/crowd/feeds/${id}/`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      queryClient.invalidateQueries({ queryKey: ['crowd', 'feeds'] });
    } catch (e) {
      alert('Failed to delete feed.');
    }
  };

  const handleUpdate = async (id) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.patch(`/api/crowd/feeds/${id}/`, { camera_url: editUrl }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['crowd', 'feeds'] });
    } catch (e) {
      alert('Failed to update feed.');
    }
  };

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
            style={{ position: 'relative' }}
          >
            {filterMessId && (
              <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
                {editingId === feed.id ? (
                  <>
                    <button onClick={() => handleUpdate(feed.id)} title="Save" style={{ background: '#33aa33', border: 'none', color: '#fff', padding: '4px', borderRadius: 4, cursor: 'pointer', display: 'flex' }}><Check size={14} /></button>
                    <button onClick={() => setEditingId(null)} title="Cancel" style={{ background: '#ff6b6b', border: 'none', color: '#fff', padding: '4px', borderRadius: 4, cursor: 'pointer', display: 'flex' }}><X size={14} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditingId(feed.id); setEditUrl(feed.camera_url || ''); }} title="Edit URL" style={{ background: 'transparent', border: 'none', color: '#aaa', padding: '4px', cursor: 'pointer', display: 'flex' }}><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(feed.id)} title="Delete" style={{ background: 'transparent', border: 'none', color: '#ff6b6b', padding: '4px', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button>
                  </>
                )}
              </div>
            )}
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
            {editingId === feed.id ? (
              <div style={{ marginTop: 8, marginBottom: 8 }}>
                <input 
                  type="text" 
                  value={editUrl} 
                  onChange={(e) => setEditUrl(e.target.value)}
                  style={{ width: '100%', padding: '6px', fontSize: 12, background: '#111', border: '1px solid #333', color: '#fff', borderRadius: 4, boxSizing: 'border-box' }}
                />
              </div>
            ) : (
              <div className="camera-feed-card__location" style={{ wordBreak: 'break-all' }}>
                Mess {feed.mess_id}
                {feed.location_description ? ` — ${feed.location_description}` : ''}
                <br/>
                <span style={{ fontSize: 10, color: '#777' }}>{feed.camera_url}</span>
              </div>
            )}
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
