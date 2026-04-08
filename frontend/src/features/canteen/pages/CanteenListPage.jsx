import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import CanteenCard from '../components/CanteenCard';
import '../canteen.css';

export default function CanteenListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: canteens = [], isLoading } = useQuery({
    queryKey: ['canteen', 'list'],
    queryFn: async () => {
      const { data } = await axios.get('/api/public/canteens/');
      return Array.isArray(data) ? data : data.results || [];
    },
    staleTime: 300000,
  });

  const filtered = canteens.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.location?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const isAHall = aName.includes('hall') || aName.includes('gh1') || aName.includes('ght2');
    const isBHall = bName.includes('hall') || bName.includes('gh1') || bName.includes('ght2');
    if (isAHall && !isBHall) return 1;
    if (!isAHall && isBHall) return -1;
    return aName.localeCompare(bName);
  });

  return (
    <div className="canteen-page">
      <div className="canteen-page-header">
        <button className="canteen-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <h1 className="canteen-page-title">All Canteens</h1>
      </div>

      <div style={{ padding: 20 }}>
        <div className="canteen-search">
          <input className="canteen-search__input" placeholder="Search canteens..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <span className="canteen-search__icon"><Search size={18} /></span>
        </div>

        {isLoading ? (
          <div className="canteen-loading"><div className="canteen-loading-spinner" /><span style={{ color: '#999' }}>Loading...</span></div>
        ) : filtered.length === 0 ? (
          <div className="canteen-empty"><div className="canteen-empty__icon">🍽️</div><p className="canteen-empty__text">No canteens found</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((c, i) => (
              <CanteenCard key={c.id} canteen={c} index={i} onClick={() => navigate(`/canteens/${c.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}