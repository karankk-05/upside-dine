import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PullToRefresh from '../components/PullToRefresh';
import InfiniteScrollSentinel from '../components/InfiniteScrollSentinel';
import { useIncrementalList } from '../hooks/useIncrementalList';
import api from '../lib/api';
import { logoutUser } from '../lib/auth';
import '../features/canteen/canteen.css';

const DELIVERY_AVAILABLE_QUERY_KEY = ['delivery', 'available-orders'];
const DELIVERY_ORDERS_QUERY_KEY = ['delivery', 'orders'];

const normalizeOrderList = (data) => {
  const results = data?.results || data;
  return Array.isArray(results) ? results : [];
};

const DeliveryStatsSkeleton = () => (
  <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
    {Array.from({ length: 3 }).map((_, index) => (
      <div
        key={`delivery-stat-skeleton-${index}`}
        style={{
          flex: 1,
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: 12,
          padding: '12px 8px',
          textAlign: 'center',
        }}
      >
        <div
          className="ui-skeleton ui-skeleton-text"
          style={{ width: '52%', height: 24, margin: '0 auto 8px' }}
        />
        <div
          className="ui-skeleton ui-skeleton-text"
          style={{ width: '68%', height: 10, margin: '0 auto' }}
        />
      </div>
    ))}
  </div>
);

const DeliveryCardSkeleton = ({ count = 2 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={`delivery-card-skeleton-${index}`}
        style={{
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: 14,
          padding: 16,
        }}
      >
        <div
          className="ui-skeleton ui-skeleton-text"
          style={{ width: '28%', height: 14, marginBottom: 12 }}
        />
        <div
          className="ui-skeleton ui-skeleton-text"
          style={{ width: '86%', height: 14, marginBottom: 10 }}
        />
        <div
          className="ui-skeleton ui-skeleton-card"
          style={{ width: '100%', height: 72, marginBottom: 12, borderRadius: 10 }}
        />
        <div className="ui-skeleton ui-skeleton-card" style={{ width: '100%', height: 44 }} />
      </div>
    ))}
  </div>
);

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState(null);
  const [deliveryOtps, setDeliveryOtps] = useState({});
  const [otpErrors, setOtpErrors] = useState({});

  const { data: availableOrdersData = [], isLoading: isLoadingAvailableOrders } = useQuery({
    queryKey: DELIVERY_AVAILABLE_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get('/delivery/available/');
      return normalizeOrderList(data);
    },
    refetchInterval: 30000,
  });

  const { data: allOrdersData = [], isLoading: isLoadingMyOrders } = useQuery({
    queryKey: DELIVERY_ORDERS_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get('/delivery/orders/');
      return normalizeOrderList(data);
    },
    refetchInterval: 30000,
  });

  const refreshDeliveryData = useCallback(
    async () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: DELIVERY_AVAILABLE_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: DELIVERY_ORDERS_QUERY_KEY }),
      ]),
    [queryClient]
  );

  const availableOrders = availableOrdersData;
  const myOrders = useMemo(
    () => allOrdersData.filter((order) => order.status === 'out_for_delivery'),
    [allOrdersData]
  );
  const completedOrders = useMemo(
    () => allOrdersData.filter((order) => order.status === 'delivered'),
    [allOrdersData]
  );
  const assignedPending = useMemo(
    () =>
      allOrdersData.filter((order) =>
        ['confirmed', 'preparing', 'ready'].includes(order.status)
      ),
    [allOrdersData]
  );

  const isInitialStatsLoading =
    isLoadingAvailableOrders &&
    isLoadingMyOrders &&
    availableOrders.length === 0 &&
    allOrdersData.length === 0;
  const {
    visibleItems: visibleActiveDeliveries,
    hasMore: hasMoreActiveDeliveries,
    loadMore: loadMoreActiveDeliveries,
  } = useIncrementalList(myOrders, {
    initialCount: 2,
    step: 2,
    resetKey: myOrders.length,
  });
  const {
    visibleItems: visibleAssignedPending,
    hasMore: hasMoreAssignedPending,
    loadMore: loadMoreAssignedPending,
  } = useIncrementalList(assignedPending, {
    initialCount: 3,
    step: 3,
    resetKey: assignedPending.length,
  });
  const {
    visibleItems: visibleAvailableOrders,
    hasMore: hasMoreAvailableOrders,
    loadMore: loadMoreAvailableOrders,
  } = useIncrementalList(availableOrders, {
    initialCount: 4,
    step: 4,
    resetKey: availableOrders.length,
  });
  const {
    visibleItems: visibleCompletedOrders,
    hasMore: hasMoreCompletedOrders,
    loadMore: loadMoreCompletedOrders,
  } = useIncrementalList(completedOrders, {
    initialCount: 5,
    step: 4,
    resetKey: completedOrders.length,
  });

  const handleRefresh = useCallback(async () => {
    await refreshDeliveryData();
  }, [refreshDeliveryData]);

  const handleAccept = async (orderId) => {
    setActionLoading(orderId);
    try {
      await api.post(`/delivery/orders/${orderId}/accept/`);
      await refreshDeliveryData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to accept order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (orderId, otpCode) => {
    if (otpCode.length !== 6) {
      throw new Error('Enter the 6-digit OTP from the student');
    }

    setActionLoading(orderId);
    try {
      await api.post(`/delivery/orders/${orderId}/complete/`, { pickup_otp: otpCode });
      setDeliveryOtps((current) => ({ ...current, [orderId]: '' }));
      await refreshDeliveryData();
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setActionLoading(null);
    }
  };

  const getItemNames = (order) => {
    if (order.items?.length) {
      return order.items
        .map((item) => `${item.menu_item_name || item.item_name || item.name} ×${item.quantity}`)
        .join(', ');
    }
    return 'Order items';
  };

  const formatTime = (dateStr) => {
    if (!dateStr) {
      return '';
    }

    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const statusLabel = (status) => {
    const map = {
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      ready: 'Ready for Pickup',
      out_for_delivery: 'Out for Delivery',
    };
    return map[status] || status?.replace(/_/g, ' ');
  };

  const statusColor = (status) => {
    const map = {
      confirmed: '#66cc66',
      preparing: '#ffaa33',
      ready: '#00ff66',
      out_for_delivery: '#b566ff',
    };
    return map[status] || '#999';
  };

  const handleLogout = async () => {
    if (!window.confirm('Log out?')) {
      return;
    }

    await logoutUser();
    navigate('/auth');
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', paddingBottom: 80 }}>
        <div
          style={{
            maxWidth: 428,
            margin: '0 auto',
            background: '#000',
            minHeight: '100vh',
            position: 'relative',
          }}
        >
          <div
            style={{
              padding: '40px 20px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#d45555' }}>Deliveries</h1>
            <div
              onClick={handleLogout}
              style={{
                width: 40,
                height: 40,
                background: '#1a1a1a',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '1px solid #333',
              }}
            >
              <span style={{ fontSize: 20 }}>🚴</span>
            </div>
          </div>

          <div style={{ padding: '0 20px' }}>
            {isInitialStatsLoading ? (
              <DeliveryStatsSkeleton />
            ) : (
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <div
                  style={{
                    flex: 1,
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: 12,
                    padding: '12px 8px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#d45555' }}>
                    {completedOrders.length}
                  </div>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>DELIVERED</div>
                </div>
                <div
                  style={{
                    flex: 1,
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: 12,
                    padding: '12px 8px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#ffaa33' }}>
                    {availableOrders.length}
                  </div>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>AVAILABLE</div>
                </div>
                <div
                  style={{
                    flex: 1,
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: 12,
                    padding: '12px 8px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#00ff66' }}>
                    ₹
                    {completedOrders
                      .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0)
                      .toFixed(0)}
                  </div>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>EARNINGS</div>
                </div>
              </div>
            )}

            {myOrders.length > 0 ? (
              <div style={{ marginBottom: 24 }}>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  🚴 Active Deliveries <span style={{ color: '#b566ff' }}>({myOrders.length})</span>
                </h3>
                {visibleActiveDeliveries.map((activeDelivery) => {
                  const otp = deliveryOtps[activeDelivery.id] || '';
                  const errorMessage = otpErrors[activeDelivery.id] || '';

                  return (
                    <div
                      key={activeDelivery.id}
                      style={{
                        background: '#1a1a1a',
                        border: '2px solid #b566ff',
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 16,
                        boxShadow: '0 0 20px rgba(181,102,255,0.1)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 10,
                        }}
                      >
                        <span style={{ fontSize: 15, fontWeight: 700 }}>
                          #{activeDelivery.order_number || activeDelivery.id}
                        </span>
                        <span
                          style={{
                            background: '#220033',
                            color: '#b566ff',
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          Out for Delivery
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: '#eee',
                          marginBottom: 10,
                        }}
                      >
                        {getItemNames(activeDelivery)}
                      </p>

                      <div
                        style={{
                          background: '#111',
                          borderRadius: 8,
                          padding: 12,
                          marginBottom: 12,
                          border: '1px solid #222',
                        }}
                      >
                        <div style={{ marginBottom: 8 }}>
                          <p style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>
                            📍 Pickup from:
                          </p>
                          <p style={{ fontSize: 13, fontWeight: 600 }}>
                            {activeDelivery.canteen?.name || 'Canteen'}
                          </p>
                        </div>
                        <div style={{ height: 1, background: '#222' }} />
                        <div style={{ marginTop: 8 }}>
                          <p style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>
                            🏠 Deliver to:
                          </p>
                          <p style={{ fontSize: 13, fontWeight: 600 }}>
                            {activeDelivery.delivery_address || 'Student Address'}
                          </p>
                        </div>
                      </div>

                      <div
                        style={{
                          background: '#111',
                          borderRadius: 10,
                          padding: 14,
                          marginBottom: 12,
                          border: '1px solid #333',
                        }}
                      >
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            marginBottom: 8,
                            textAlign: 'center',
                          }}
                        >
                          🔑 Enter Student&apos;s OTP
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 6,
                            marginBottom: 8,
                          }}
                        >
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <input
                              key={index}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]"
                              autoComplete={index === 0 ? 'one-time-code' : 'off'}
                              maxLength={1}
                              value={otp[index] || ''}
                              onChange={(event) => {
                                const value = event.target.value.replace(/\D/, '');
                                const otpArray = otp.split('');
                                while (otpArray.length < 6) otpArray.push('');
                                otpArray[index] = value;
                                setDeliveryOtps((current) => ({
                                  ...current,
                                  [activeDelivery.id]: otpArray.join('').substring(0, 6),
                                }));
                                setOtpErrors((current) => ({
                                  ...current,
                                  [activeDelivery.id]: '',
                                }));
                                if (value && event.target.nextElementSibling) {
                                  event.target.nextElementSibling.focus();
                                }
                              }}
                              onKeyDown={(event) => {
                                if (
                                  event.key === 'Backspace' &&
                                  !otp[index] &&
                                  event.target.previousElementSibling
                                ) {
                                  event.target.previousElementSibling.focus();
                                }
                              }}
                              style={{
                                width: 36,
                                height: 44,
                                textAlign: 'center',
                                fontSize: 18,
                                fontWeight: 700,
                                background: '#000',
                                color: '#d45555',
                                border: errorMessage
                                  ? '2px solid #ff3333'
                                  : '2px solid #d45555',
                                borderRadius: 8,
                                outline: 'none',
                                fontFamily: 'monospace',
                              }}
                            />
                          ))}
                        </div>
                        {errorMessage ? (
                          <p
                            style={{
                              color: '#ff3333',
                              fontSize: 11,
                              textAlign: 'center',
                              marginBottom: 4,
                            }}
                          >
                            {errorMessage}
                          </p>
                        ) : null}
                      </div>

                      <button
                        onClick={async () => {
                          const currentOtp = deliveryOtps[activeDelivery.id] || '';
                          try {
                            await handleComplete(activeDelivery.id, currentOtp);
                          } catch (error) {
                            setOtpErrors((current) => ({
                              ...current,
                              [activeDelivery.id]:
                                error.message || 'Verification failed',
                            }));
                          }
                        }}
                        disabled={actionLoading === activeDelivery.id || otp.length < 6}
                        style={{
                          width: '100%',
                          padding: 14,
                          background:
                            actionLoading === activeDelivery.id || otp.length < 6
                              ? '#333'
                              : '#d45555',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 10,
                          fontWeight: 700,
                          fontSize: 14,
                          cursor:
                            actionLoading === activeDelivery.id || otp.length < 6
                              ? 'not-allowed'
                              : 'pointer',
                        }}
                      >
                        {actionLoading === activeDelivery.id
                          ? 'Verifying...'
                          : 'Confirm Delivery'}
                      </button>

                      <p
                        style={{
                          fontSize: 11,
                          color: '#666',
                          marginTop: 8,
                          textAlign: 'center',
                        }}
                      >
                        ₹{activeDelivery.total_amount} • Accepted{' '}
                        {formatTime(activeDelivery.delivery_accepted_at)}
                      </p>
                    </div>
                  );
                })}
                <InfiniteScrollSentinel
                  hasMore={hasMoreActiveDeliveries}
                  onLoadMore={loadMoreActiveDeliveries}
                  skeletonCount={1}
                  minHeight={128}
                />
              </div>
            ) : isLoadingMyOrders && allOrdersData.length === 0 ? (
              <div style={{ marginBottom: 24 }}>
                <div
                  className="ui-skeleton ui-skeleton-text"
                  style={{ width: '44%', height: 18, marginBottom: 12 }}
                />
                <DeliveryCardSkeleton count={1} />
              </div>
            ) : null}

            {assignedPending.length > 0 ? (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                  ⏳ Assigned – Waiting for Food
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {visibleAssignedPending.map((order) => (
                    <div
                      key={order.id}
                      style={{
                        background: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: 14,
                        padding: 14,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                          #{order.order_number || order.id}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: '#332200',
                            color: '#ffaa33',
                          }}
                        >
                          {statusLabel(order.status)}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: '#ddd', marginBottom: 6 }}>
                        {getItemNames(order)}
                      </p>
                      <p style={{ fontSize: 12, color: '#888' }}>
                        📍 {order.canteen?.name || 'Canteen'} →{' '}
                        {order.delivery_address || 'Student'}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: '#d45555',
                          fontWeight: 600,
                          marginTop: 4,
                        }}
                      >
                        ₹{order.total_amount}
                      </p>
                    </div>
                  ))}
                </div>
                <InfiniteScrollSentinel
                  hasMore={hasMoreAssignedPending}
                  onLoadMore={loadMoreAssignedPending}
                  skeletonCount={1}
                  minHeight={90}
                />
              </div>
            ) : null}

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                📦 Pending Deliveries{' '}
                {availableOrders.length > 0 ? (
                  <span style={{ color: '#d45555' }}>({availableOrders.length})</span>
                ) : null}
              </h3>

              {isLoadingAvailableOrders && availableOrders.length === 0 ? (
                <DeliveryCardSkeleton count={2} />
              ) : availableOrders.length === 0 ? (
                <div
                  style={{
                    background: '#1a1a1a',
                    border: '1px dashed #333',
                    borderRadius: 12,
                    padding: 28,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                  <p style={{ color: '#666', fontSize: 13 }}>
                    No delivery orders available right now
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {visibleAvailableOrders.map((order) => (
                    <div
                      key={order.id}
                      style={{
                        background: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: 14,
                        padding: 16,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 10,
                        }}
                      >
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                          #{order.order_number || order.id}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: 8,
                            background:
                              order.status === 'ready'
                                ? '#003311'
                                : order.status === 'preparing'
                                  ? '#332200'
                                  : '#112211',
                            color: statusColor(order.status),
                            border: `1px solid ${statusColor(order.status)}`,
                          }}
                        >
                          {statusLabel(order.status)}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 14,
                          color: '#eee',
                          fontWeight: 500,
                          marginBottom: 8,
                        }}
                      >
                        {getItemNames(order)}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ fontSize: 12, color: '#999' }}>
                          📍 {order.canteen?.name || 'Canteen'}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#d45555' }}>
                          ₹{order.total_amount}
                        </span>
                      </div>
                      {order.delivery_address ? (
                        <p style={{ fontSize: 12, color: '#aaa', marginBottom: 10 }}>
                          🏠 → {order.delivery_address}
                        </p>
                      ) : null}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleAccept(order.id)}
                          disabled={actionLoading === order.id}
                          style={{
                            flex: 1,
                            padding: 12,
                            background: actionLoading === order.id ? '#333' : '#d45555',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: 13,
                            cursor:
                              actionLoading === order.id ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {actionLoading === order.id
                            ? 'Accepting...'
                            : 'Volunteer to Deliver'}
                        </button>
                      </div>
                      <p
                        style={{
                          fontSize: 11,
                          color: '#666',
                          marginTop: 6,
                          textAlign: 'center',
                        }}
                      >
                        {formatTime(order.created_at)}
                      </p>
                    </div>
                  ))}
                  <InfiniteScrollSentinel
                    hasMore={hasMoreAvailableOrders}
                    onLoadMore={loadMoreAvailableOrders}
                    skeletonCount={2}
                    minHeight={144}
                  />
                </div>
              )}
            </div>

            {completedOrders.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                  ✅ Completed ({completedOrders.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {visibleCompletedOrders.map((order) => (
                    <div
                      key={order.id}
                      style={{
                        background: '#1a1a1a',
                        border: '1px solid #222',
                        borderRadius: 10,
                        padding: 12,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          #{order.order_number || order.id}
                        </span>
                        <p style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                          {getItemNames(order)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#d45555' }}>
                          ₹{order.total_amount}
                        </span>
                        <p style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                          {formatTime(order.delivered_at || order.updated_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <InfiniteScrollSentinel
                  hasMore={hasMoreCompletedOrders}
                  onLoadMore={loadMoreCompletedOrders}
                  skeletonCount={1}
                  minHeight={72}
                />
              </div>
            ) : null}
          </div>

          <nav
            style={{
              position: 'fixed',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              maxWidth: 428,
              width: '100%',
              background: '#000',
              borderTop: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-around',
              padding: '12px 0',
              zIndex: 100,
            }}
          >
            <button
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                color: '#d45555',
                background: 'none',
                border: 'none',
                fontSize: 11,
                padding: '8px 20px',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 20 }}>🏠</span>Home
            </button>
            <button
              onClick={() => navigate('/profile')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                color: '#666',
                background: 'none',
                border: 'none',
                fontSize: 11,
                padding: '8px 20px',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 20 }}>👤</span>Profile
            </button>
          </nav>
        </div>
      </div>
    </PullToRefresh>
  );
};

export default DeliveryDashboard;
