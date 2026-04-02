import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import '../styles/crowd.css';

/**
 * Tab bar to switch between mess halls.
 * Fetches mess list from GET /api/mess/
 * Props: value (selected messId), onChange(messId)
 */
export default function MessSelector({ value, onChange }) {
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

  if (isLoading) {
    return (
      <div className="mess-selector">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ width: 100, height: 40, borderRadius: 12 }} />
        ))}
      </div>
    );
  }

  if (!messes.length) {
    return null;
  }

  return (
    <div className="mess-selector" role="tablist" aria-label="Select Mess Hall">
      <button
        className={`mess-selector__tab ${!value ? 'mess-selector__tab--active' : ''}`}
        role="tab"
        aria-selected={!value}
        onClick={() => onChange(null)}
      >
        All Messes
      </button>
      {messes.map((mess) => (
        <button
          key={mess.id}
          className={`mess-selector__tab ${value === mess.id ? 'mess-selector__tab--active' : ''}`}
          role="tab"
          aria-selected={value === mess.id}
          onClick={() => onChange(mess.id)}
        >
          {mess.name || `Mess ${mess.id}`}
        </button>
      ))}
    </div>
  );
}
