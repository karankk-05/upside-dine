import { useEffect, useRef } from 'react';

const InfiniteScrollSentinel = ({
  hasMore,
  onLoadMore,
  skeletonCount = 2,
  minHeight = 92,
  columns = 1,
}) => {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      {
        rootMargin: '180px 0px',
        threshold: 0.2,
      }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  if (!hasMore) {
    return null;
  }

  return (
    <div ref={sentinelRef} style={{ paddingTop: 8 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            columns > 1 ? `repeat(${columns}, minmax(0, 1fr))` : 'minmax(0, 1fr)',
          gap: 12,
        }}
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div
            key={`infinite-sentinel-${index}`}
            className="ui-skeleton ui-skeleton-card"
            style={{ minHeight }}
          />
        ))}
      </div>
    </div>
  );
};

export default InfiniteScrollSentinel;
