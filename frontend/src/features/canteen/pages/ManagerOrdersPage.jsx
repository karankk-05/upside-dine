import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, ChefHat, Package, Truck, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import InfiniteScrollSentinel from '../../../components/InfiniteScrollSentinel';
import { useIncrementalList } from '../../../hooks/useIncrementalList';
import { useManagerOrders } from '../hooks/useManagerOrders';
import { useUpdateOrderStatus } from '../hooks/useUpdateOrderStatus';
import { formatDistanceToNow } from 'date-fns';
import '../canteen.css';

const statusConfig = {
  pending:          { label: 'New Order',        bg: '#331111', color: '#ff6b6b', border: '#ff6b6b', icon: '🔔', glow: 'rgba(255,107,107,0.15)' },
  confirmed:        { label: 'Confirmed',        bg: '#112211', color: '#66cc66', border: '#66cc66', icon: '✅', glow: 'rgba(102,204,102,0.15)' },
  preparing:        { label: 'Preparing',        bg: '#332200', color: '#ffaa33', border: '#ffaa33', icon: '🍳', glow: 'rgba(255,170,51,0.15)' },
  ready:            { label: 'Ready',            bg: '#003311', color: '#00ff66', border: '#00ff66', icon: '📦', glow: 'rgba(0,255,102,0.15)' },
  out_for_delivery: { label: 'Out for Delivery', bg: '#220033', color: '#b566ff', border: '#b566ff', icon: '🚴', glow: 'rgba(181,102,255,0.15)' },
  delivered:        { label: 'Delivered',         bg: '#112233', color: '#66aaff', border: '#66aaff', icon: '🎉', glow: 'rgba(102,170,255,0.15)' },
  picked_up:        { label: 'Picked Up',        bg: '#112233', color: '#66aaff', border: '#66aaff', icon: '🎉', glow: 'rgba(102,170,255,0.15)' },
  cancelled:        { label: 'Cancelled',        bg: '#222',    color: '#888',    border: '#555',    icon: '✕',  glow: 'none' },
  rejected:         { label: 'Rejected',         bg: '#222',    color: '#888',    border: '#555',    icon: '✕',  glow: 'none' },
};

const getItemNames = (items) => {
  if (!items?.length) return 'No items';
  return items.map(i => `${i.menu_item_name || i.item_name || i.name || 'Item'} ×${i.quantity}`).join(', ');
};

export default function ManagerOrdersPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const { data: orders = [], isLoading, refetch } = useManagerOrders();
  const { mutateAsync: updateStatus } = useUpdateOrderStatus();

  const filtered = filter === 'all'
    ? orders
    : filter === 'prebooking'
      ? orders.filter(o => o.order_type === 'prebooking')
      : orders.filter(o => o.order_type === filter);

  // Sort: pending first, then by created_at desc
  const sorted = [...filtered].sort((a, b) => {
    const priority = { pending: 0, confirmed: 1, preparing: 2, ready: 3 };
    const pa = priority[a.status] ?? 99;
    const pb = priority[b.status] ?? 99;
    if (pa !== pb) return pa - pb;
    return new Date(b.created_at) - new Date(a.created_at);
  });
  const {
    visibleItems: visibleOrders,
    hasMore,
    loadMore,
  } = useIncrementalList(sorted, {
    initialCount: 6,
    step: 4,
    resetKey: filter,
  });

  const handleStatusUpdate = async (e, id, newStatus) => {
    e.stopPropagation();
    try {
      await updateStatus({ id, status: newStatus });
      refetch();
    } catch (err) {
      const d = err.response?.data;
      alert(typeof d === 'object' ? JSON.stringify(d) : (d?.detail || 'Failed'));
    }
  };

  const activeCount = orders.filter(o => !['cancelled', 'rejected', 'picked_up', 'delivered'].includes(o.status)).length;

  return (
    <div className="canteen-page">
      <div className="canteen-page-header">
        <button className="canteen-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <h1 className="canteen-page-title">Manage Orders</h1>
      </div>

      <div style={{ padding: 20, paddingBottom: 100 }}>
        {/* Stats */}
        <div style={{
          display: 'flex', gap: 12, marginBottom: 20,
        }}>
          {[
            { label: 'Active', value: activeCount, color: '#d45555' },
            { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: '#ff6b6b' },
            { label: 'Preparing', value: orders.filter(o => o.status === 'preparing').length, color: '#ffaa33' },
            { label: 'Ready', value: orders.filter(o => o.status === 'ready').length, color: '#00ff66' },
          ].map(stat => (
            <div key={stat.label} style={{
              flex: 1, background: '#1a1a1a', border: '1px solid #333', borderRadius: 12,
              padding: '12px 8px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: '#888', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto' }}>
          {['all', 'pickup', 'delivery'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: filter === f ? '1px solid #d45555' : '1px solid #333',
                background: filter === f ? '#d45555' : 'transparent',
                color: filter === f ? '#fff' : '#999',
                cursor: 'pointer', textTransform: 'capitalize', whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {f === 'all' ? `All (${orders.length})` : f}
            </button>
          ))}
        </div>

        {/* Orders */}
        {isLoading ? (
          <div className="canteen-loading"><div className="canteen-loading-spinner" /></div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <p style={{ color: '#666', fontSize: 14 }}>No orders to display</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {visibleOrders.map((order, idx) => {
              const cfg = statusConfig[order.status] || statusConfig.pending;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => navigate(`/manager/canteen/orders/${order.id}`)}
                  style={{
                    background: '#1a1a1a',
                    border: `1px solid ${order.status === 'pending' ? cfg.border : '#333'}`,
                    borderRadius: 16,
                    padding: 16,
                    cursor: 'pointer',
                    boxShadow: order.status === 'pending' ? `0 0 20px ${cfg.glow}` : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                        #{order.order_number || order.id}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                        background: order.order_type === 'delivery' ? '#220044' : order.order_type === 'prebooking' ? '#002244' : '#222',
                        color: order.order_type === 'delivery' ? '#b566ff' : order.order_type === 'prebooking' ? '#66aaff' : '#aaa',
                        textTransform: 'uppercase', letterSpacing: 0.5,
                      }}>
                        {order.order_type === 'prebooking' ? 'prebook' : order.order_type || 'pickup'}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                    }}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>

                  {/* Items */}
                  <p style={{ fontSize: 13, color: '#ddd', fontWeight: 500, marginBottom: 6, lineHeight: 1.5 }}>
                    {getItemNames(order.items)}
                  </p>

                  {/* Meta Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: order.delivery_person_name ? 6 : 10 }}>
                    <span style={{ fontSize: 12, color: '#888' }}>
                      {order.student_name || order.student?.user?.full_name || 'Student'}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#d45555' }}>
                      ₹{order.total_amount}
                    </span>
                  </div>

                  {/* Delivery Coordinator */}
                  {order.delivery_person_name && (
                    <p style={{ fontSize: 12, color: '#b566ff', marginBottom: 10 }}>
                      🚴 Delivering: <strong>{order.delivery_person_name}</strong>
                    </p>
                  )}

                  {/* Time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: order.status === 'pending' || order.status === 'confirmed' || order.status === 'preparing' || order.status === 'ready' ? 12 : 0 }}>
                    <Clock size={10} color="#666" />
                    <span style={{ fontSize: 11, color: '#666' }}>
                      {order.created_at ? formatDistanceToNow(new Date(order.created_at), { addSuffix: true }) : ''}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {order.status === 'pending' && (
                      <>
                        <button onClick={(e) => handleStatusUpdate(e, order.id, 'confirmed')} style={{
                          flex: 1, padding: '10px 12px', background: '#d45555', color: '#fff',
                          border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        }}>
                          ✅ Accept
                        </button>
                        <button onClick={(e) => handleStatusUpdate(e, order.id, 'rejected')} style={{
                          padding: '10px 16px', background: 'transparent', color: '#ff6b6b',
                          border: '1px solid #ff6b6b', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}>
                          ✕
                        </button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <button onClick={(e) => handleStatusUpdate(e, order.id, 'preparing')} style={{
                        flex: 1, padding: '10px', background: '#332200', color: '#ffaa33',
                        border: '1px solid #ffaa33', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      }}>
                        🍳 Start Preparing
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button onClick={(e) => handleStatusUpdate(e, order.id, 'ready')} style={{
                        flex: 1, padding: '10px', background: '#003311', color: '#00ff66',
                        border: '1px solid #00ff66', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      }}>
                        📦 Mark Ready
                      </button>
                    )}
                    {order.status === 'ready' && order.order_type !== 'delivery' && (
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/manager/canteen/orders/${order.id}`); }} style={{
                        flex: 1, padding: '10px', background: '#112233', color: '#66aaff',
                        border: '1px solid #66aaff', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      }}>
                        🔑 Enter OTP to Complete
                      </button>
                    )}
                    {order.status === 'ready' && order.order_type === 'delivery' && (
                      order.delivery_person_name ? (
                        <button onClick={(e) => handleStatusUpdate(e, order.id, 'out_for_delivery')} style={{
                          flex: 1, padding: '10px', background: '#220033', color: '#b566ff',
                          border: '1px solid #b566ff', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}>
                          🚴 Dispatch to Coordinator
                        </button>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/manager/canteen/orders/${order.id}`); }} style={{
                          flex: 1, padding: '10px', background: '#1a1a1a', color: '#aaa',
                          border: '1px dashed #666', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}>
                          ⏳ Open to Assign Coordinator
                        </button>
                      )
                    )}
                  </div>
                </motion.div>
              );
            })}
            <InfiniteScrollSentinel
              hasMore={hasMore}
              onLoadMore={loadMore}
              skeletonCount={2}
              minHeight={186}
            />
          </div>
        )}
      </div>
    </div>
  );
}
