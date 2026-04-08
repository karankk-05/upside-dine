import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { STANDARD_INPUT_PROPS, sanitizeSearchText } from '../lib/formValidation';
import PullToRefresh from '../components/PullToRefresh';
import InfiniteScrollSentinel from '../components/InfiniteScrollSentinel';
import api from '../lib/api';
import { CURRENT_USER_QUERY_KEY, useCurrentUser } from '../hooks/useCurrentUser';
import { useIncrementalList } from '../hooks/useIncrementalList';
import { compareNaturalText } from '../lib/naturalSort';
import { canteenDetailQueryKey, fetchCanteenDetail } from '../features/canteen/hooks/useCanteenDetail';
import { canteenMenuQueryKey, fetchCanteenMenu } from '../features/canteen/hooks/useCanteenMenu';
import '../features/mess/mess.css';

const PUBLIC_CANTEENS_QUERY_KEY = ['public-canteens'];
const MESS_LIST_QUERY_KEY = ['mess', 'list'];
const CANTEEN_MENU_SEARCH_QUERY_KEY = ['canteen', 'search'];

const StudentDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const trimmedSearchQuery = searchQuery.trim();

  const { data: currentUser } = useCurrentUser();
  const { data: canteens = [], isLoading: isLoadingCanteens } = useQuery({
    queryKey: PUBLIC_CANTEENS_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get('/public/canteens/');
      return Array.isArray(data) ? data : [];
    },
  });
  const { data: messes = [], isLoading: isLoadingMesses } = useQuery({
    queryKey: MESS_LIST_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get('/mess/');
      return Array.isArray(data) ? data : [];
    },
  });
  const { data: searchResults = [], isLoading: isLoadingSearchResults } = useQuery({
    queryKey: [...CANTEEN_MENU_SEARCH_QUERY_KEY, trimmedSearchQuery],
    queryFn: async () => {
      const { data } = await api.get('/canteens/search/', {
        params: { q: trimmedSearchQuery },
      });
      return Array.isArray(data) ? data : data?.results || [];
    },
    enabled: trimmedSearchQuery.length >= 2,
  });

  const loadDashboard = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: PUBLIC_CANTEENS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: MESS_LIST_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: CANTEEN_MENU_SEARCH_QUERY_KEY }),
    ]);
  }, [queryClient]);

  const primeCanteenPage = useCallback((canteenId) => {
    void queryClient.prefetchQuery({
      queryKey: canteenDetailQueryKey(canteenId),
      queryFn: () => fetchCanteenDetail(canteenId),
    });
    void queryClient.prefetchQuery({
      queryKey: canteenMenuQueryKey(canteenId),
      queryFn: () => fetchCanteenMenu(canteenId),
    });
  }, [queryClient]);

  const canteenEmojis = ['🍕', '🍔', '🥡', '☕', '🍜', '🧁', '🥪', '🍩'];
  const userName =
    currentUser?.profile?.full_name || currentUser?.email?.split('@')[0] || '';
  const mess = useMemo(() => {
    if (!currentUser) {
      return null;
    }

    const studentHostel = currentUser.profile?.hostel_name || '';
    const myMess = messes.find(
      (item) => item.hall_name?.toLowerCase() === studentHostel.toLowerCase()
    );
    return myMess || messes[0] || null;
  }, [currentUser, messes]);

  // Filter canteens & mess by search
  const q = searchQuery.toLowerCase();
  const filteredCanteens = canteens.filter(
    (c) =>
      c.name.toLowerCase().includes(q) || c.location?.toLowerCase().includes(q)
  ).sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const isAHall = aName.includes('hall') || aName.includes('gh1') || aName.includes('ght2');
    const isBHall = bName.includes('hall') || bName.includes('gh1') || bName.includes('ght2');
    if (isAHall && !isBHall) return 1;
    if (!isAHall && isBHall) return -1;
    return compareNaturalText(a.name, b.name);
  });
  const showMess =
    mess && (mess.name?.toLowerCase().includes(q) || mess.hall_name?.toLowerCase().includes(q) || !q);
  const {
    visibleItems: visibleCanteens,
    hasMore: hasMoreCanteens,
    loadMore: loadMoreCanteens,
  } = useIncrementalList(filteredCanteens, {
    initialCount: 4,
    step: 4,
    resetKey: q,
  });
  const {
    visibleItems: visibleSearchItems,
    hasMore: hasMoreSearchItems,
    loadMore: loadMoreSearchItems,
  } = useIncrementalList(searchResults, {
    initialCount: 4,
    step: 4,
    resetKey: trimmedSearchQuery,
  });

  // Logout is now handled in ProfilePage

  return (
    <PullToRefresh onRefresh={loadDashboard}>
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
        <div style={{ maxWidth: 428, margin: '0 auto', minHeight: '100vh', background: '#000', position: 'relative' }}>

        {/* Header */}
        <div style={{ padding: '40px 20px 0 20px', background: 'linear-gradient(180deg, #000 0%, #0a0a0a 100%)' }}>
          <div style={{ marginBottom: 24 }}>
            <div>
              {currentUser ? (
                <>
                  <h1 style={{
                    fontSize: 24, fontWeight: 700, color: '#d55555',
                    textShadow: '0 0 4px rgba(232,85,85,0.12), 0 0 8px rgba(232,85,85,0.12)',
                  }}>
                    Hey, {userName}!
                  </h1>
                  <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>What would you like to eat today?</p>
                </>
              ) : (
                <>
                  <div className="ui-skeleton ui-skeleton-text" style={{ width: '56%', height: 30, marginBottom: 8 }} />
                  <div className="ui-skeleton ui-skeleton-text" style={{ width: '42%', height: 14 }} />
                </>
              )}
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <input
              {...STANDARD_INPUT_PROPS.search}
              placeholder="Search for food, canteens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(sanitizeSearchText(e.target.value))}
              style={{
                width: '100%', padding: '14px 44px 14px 16px', background: '#1a1a1a',
                border: '1px solid #333', borderRadius: 12, color: '#fff', fontSize: 14,
                outline: 'none',
              }}
              id="dashboard-search"
            />
            <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#999' }}>🔍</span>
          </div>
        </div>

        {trimmedSearchQuery.length >= 2 ? (
          <div style={{ padding: '0 20px 0 20px' }}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                Matching Food Items
              </h2>
              <p style={{ fontSize: 12, color: '#999' }}>
                Results from canteen menus for "{trimmedSearchQuery}"
              </p>
            </div>

            {isLoadingSearchResults ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`search-item-skeleton-${index}`}
                    className="ui-skeleton ui-skeleton-card"
                    style={{ minHeight: 108 }}
                  />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {visibleSearchItems.map((item) => (
                    <div
                      key={`${item.canteen_id}-${item.id}`}
                      onClick={() => {
                        primeCanteenPage(item.canteen_id);
                        navigate(`/canteens/${item.canteen_id}`, {
                          state: {
                            highlightItemId: item.id,
                          },
                        });
                      }}
                      onMouseEnter={() => primeCanteenPage(item.canteen_id)}
                      onTouchStart={() => primeCanteenPage(item.canteen_id)}
                      onFocus={() => primeCanteenPage(item.canteen_id)}
                      style={{
                        background: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: 16,
                        padding: 16,
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginBottom: 4,
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                flexShrink: 0,
                                background: item.is_veg ? '#33aa33' : '#d45555',
                              }}
                            />
                            <h3
                              style={{
                                fontSize: 16,
                                fontWeight: 700,
                                color: '#fff',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {item.item_name}
                            </h3>
                          </div>
                          <p style={{ fontSize: 12, color: '#999' }}>
                            {item.canteen_name}
                            {item.category_name ? ` • ${item.category_name}` : ''}
                          </p>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#d55555', flexShrink: 0 }}>
                          ₹{item.price}
                        </div>
                      </div>
                      {item.description ? (
                        <p style={{ fontSize: 12, color: '#999', lineHeight: 1.45 }}>
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
                <InfiniteScrollSentinel
                  hasMore={hasMoreSearchItems}
                  onLoadMore={loadMoreSearchItems}
                  skeletonCount={2}
                  minHeight={108}
                />
              </>
            ) : (
              <div
                style={{
                  background: '#111',
                  border: '1px dashed #333',
                  borderRadius: 16,
                  padding: 20,
                  textAlign: 'center',
                  color: '#777',
                  marginBottom: 8,
                }}
              >
                No food items match this search yet.
              </div>
            )}
          </div>
        ) : null}

        {/* Mess Section */}
        {showMess && mess ? (
          <div style={{ padding: '24px 20px 0 20px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#fff' }}>{mess.name}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Book Extras Option */}
              <div
                onClick={() => navigate(`/mess/${mess.id}/menu`)}
                style={{
                  background: '#1a1a1a', border: '1px solid #d55555', borderRadius: 16,
                  padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  color: '#fff',
                  boxShadow: '0 0 15px rgba(232,85,85,0.12)', transition: 'transform 0.2s', aspectRatio: '1/1',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>🍽️</div>
                <h3 style={{ fontSize: 14, fontWeight: 700, textAlign: 'center', color: '#fff' }}>Book Extras</h3>
                <div style={{ fontSize: 11, color: '#00ff00', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, background: '#00ff00', borderRadius: '50%', boxShadow: '0 0 6px #00ff00' }} />
                  Available Now
                </div>
              </div>

              {/* Crowd Density Option */}
              <div
                onClick={() => navigate('/crowd/mess/' + mess.id)}
                style={{
                  background: '#1a1a1a', border: '1px solid #333', borderRadius: 16,
                  padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  color: '#fff',
                  transition: 'transform 0.2s', aspectRatio: '1/1',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
                <h3 style={{ fontSize: 14, fontWeight: 700, textAlign: 'center', color: '#fff' }}>Crowd Density</h3>
                <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>Live View</div>
              </div>
            </div>
          </div>
        ) : isLoadingMesses ? (
          <div style={{ padding: '24px 20px 0 20px' }}>
            <div className="ui-skeleton ui-skeleton-text" style={{ width: '42%', height: 22, marginBottom: 16 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="ui-skeleton ui-skeleton-card" style={{ aspectRatio: '1 / 1' }} />
              <div className="ui-skeleton ui-skeleton-card" style={{ aspectRatio: '1 / 1' }} />
            </div>
          </div>
        ) : null}

        {/* Canteens Section */}
        <div style={{ padding: '24px 20px 120px 20px' }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
              {trimmedSearchQuery ? 'Matching Canteens' : 'Canteens'}
            </h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {visibleCanteens.map((canteen, idx) => (
              <div
                key={canteen.id}
                onClick={() => {
                  primeCanteenPage(canteen.id);
                  navigate(`/canteens/${canteen.id}`);
                }}
                onMouseEnter={() => primeCanteenPage(canteen.id)}
                onTouchStart={() => primeCanteenPage(canteen.id)}
                onFocus={() => primeCanteenPage(canteen.id)}
                style={{
                  background: '#1a1a1a', border: '1px solid #333', borderRadius: 16,
                  padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  color: '#fff',
                  transition: 'transform 0.2s', aspectRatio: '4/5', textAlign: 'center',
                }}
              >
                <div style={{
                  width: 56, height: 56, background: '#2a2a2a', borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 12,
                }}>
                  {canteenEmojis[idx % canteenEmojis.length]}
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: '#fff' }}>{canteen.name}</h3>
                <div style={{ fontSize: 11, color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, background: '#00ff00', borderRadius: '50%', boxShadow: '0 0 6px #00ff00' }} />
                  {canteen.location || 'Open Now'}
                </div>
              </div>
            ))}

            {filteredCanteens.length === 0 && isLoadingCanteens
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`canteen-skeleton-${index}`}
                    className="ui-skeleton ui-skeleton-card"
                    style={{ aspectRatio: '4 / 5' }}
                  />
                ))
              : null}

            {filteredCanteens.length === 0 && !isLoadingCanteens && (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666', padding: 40 }}>No canteens found.</p>
            )}
          </div>

          {filteredCanteens.length > 0 ? (
            <InfiniteScrollSentinel
              hasMore={hasMoreCanteens}
              onLoadMore={loadMoreCanteens}
              skeletonCount={2}
              minHeight={180}
              columns={2}
            />
          ) : null}
        </div>
        </div>
      </div>
    </PullToRefresh>
  );
};

export default StudentDashboard;
