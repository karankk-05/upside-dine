import { useEffect, useRef, useState } from 'react';

const MAX_PULL_DISTANCE = 120;
const REFRESH_TRIGGER_DISTANCE = 84;
const REFRESH_HOLD_DISTANCE = 56;
const MIN_REFRESH_SPINNER_MS = 350;
const MAX_REFRESH_SPINNER_MS = 1600;

const PullToRefresh = ({ onRefresh, children, disabled = false, className = '', style }) => {
  const containerRef = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef(0);
  const isTrackingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const refreshingRef = useRef(false);
  const disabledRef = useRef(disabled);
  const onRefreshRef = useRef(onRefresh);
  const getScrollTop = () => containerRef.current?.scrollTop || 0;

  const indicatorVisible = pullDistance > 0 || refreshing;
  const progress = Math.min(1, pullDistance / REFRESH_TRIGGER_DISTANCE);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const resetPullState = () => {
    isTrackingRef.current = false;
    pullDistanceRef.current = 0;
    setDragging(false);
    setPullDistance(0);
  };

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  useEffect(() => {
    pullDistanceRef.current = pullDistance;
  }, [pullDistance]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return undefined;
    }

    const isInteractiveTarget = (target) =>
      Boolean(target?.closest('input, textarea, select, button, a, [role="button"]'));

    const handleTouchStart = (event) => {
      if (
        disabledRef.current ||
        refreshingRef.current ||
        getScrollTop() > 0 ||
        isInteractiveTarget(event.target)
      ) {
        return;
      }

      startYRef.current = event.touches[0].clientY;
      isTrackingRef.current = true;
      setDragging(true);
    };

    const handleTouchMove = (event) => {
      if (!isTrackingRef.current || disabledRef.current || refreshingRef.current) {
        return;
      }

      if (getScrollTop() > 0) {
        resetPullState();
        return;
      }

      const currentY = event.touches[0].clientY;
      const delta = currentY - startYRef.current;

      if (delta <= 0) {
        pullDistanceRef.current = 0;
        setPullDistance(0);
        return;
      }

      if (event.cancelable) {
        event.preventDefault();
      }

      const nextDistance = Math.min(MAX_PULL_DISTANCE, delta * 0.45);
      pullDistanceRef.current = nextDistance;
      setPullDistance(nextDistance);
    };

    const handleTouchEnd = async () => {
      if (!isTrackingRef.current) {
        return;
      }

      isTrackingRef.current = false;
      setDragging(false);

      if (disabledRef.current || refreshingRef.current || !onRefreshRef.current) {
        setPullDistance(0);
        return;
      }

      if (pullDistanceRef.current < REFRESH_TRIGGER_DISTANCE) {
        setPullDistance(0);
        return;
      }

      setRefreshing(true);
      setPullDistance(REFRESH_HOLD_DISTANCE);
      const refreshStartedAt = Date.now();

      try {
        await Promise.race([
          Promise.resolve().then(() => onRefreshRef.current?.()),
          wait(MAX_REFRESH_SPINNER_MS),
        ]);
      } finally {
        const elapsed = Date.now() - refreshStartedAt;
        if (elapsed < MIN_REFRESH_SPINNER_MS) {
          await wait(MIN_REFRESH_SPINNER_MS - elapsed);
        }
        setRefreshing(false);
        setPullDistance(0);
      }
    };

    node.addEventListener('touchstart', handleTouchStart, { passive: true });
    node.addEventListener('touchmove', handleTouchMove, { passive: false });
    node.addEventListener('touchend', handleTouchEnd, { passive: true });
    node.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      node.removeEventListener('touchstart', handleTouchStart);
      node.removeEventListener('touchmove', handleTouchMove);
      node.removeEventListener('touchend', handleTouchEnd);
      node.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`pull-refresh ${className}`.trim()}
      style={style}
    >
      <div
        className={`pull-refresh__indicator ${
          indicatorVisible ? 'pull-refresh__indicator--visible' : ''
        }`}
        style={{
          transform: `translateY(${indicatorVisible ? Math.max(0, pullDistance * 0.24 - 10) : -18}px)`,
        }}
        aria-live="polite"
        aria-label={refreshing ? 'Refreshing' : 'Pull to refresh'}
      >
        <div
          className={`pull-refresh__spinner ${
            refreshing ? 'pull-refresh__spinner--refreshing' : ''
          }`}
          style={{ transform: `rotate(${refreshing ? 0 : progress * 240}deg)` }}
        />
      </div>

      <div
        className={`pull-refresh__content ${
          dragging ? 'pull-refresh__content--dragging' : ''
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
