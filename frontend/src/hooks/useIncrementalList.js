import { useCallback, useEffect, useState } from 'react';

export const useIncrementalList = (
  items,
  { initialCount = 6, step = initialCount, resetKey = '' } = {}
) => {
  const safeItems = Array.isArray(items) ? items : [];
  const [visibleCount, setVisibleCount] = useState(initialCount);

  useEffect(() => {
    setVisibleCount(initialCount);
  }, [initialCount, resetKey]);

  useEffect(() => {
    setVisibleCount((current) => {
      if (safeItems.length === 0) {
        return initialCount;
      }

      return Math.min(safeItems.length, Math.max(initialCount, current));
    });
  }, [initialCount, safeItems.length]);

  const loadMore = useCallback(() => {
    setVisibleCount((current) => {
      if (current >= safeItems.length) {
        return current;
      }

      return Math.min(safeItems.length, current + step);
    });
  }, [safeItems.length, step]);

  const showThroughIndex = useCallback(
    (index) => {
      if (typeof index !== 'number' || index < 0) {
        return;
      }

      setVisibleCount((current) => {
        const nextVisibleCount = Math.min(safeItems.length, index + 1);
        return Math.max(current, nextVisibleCount, initialCount);
      });
    },
    [initialCount, safeItems.length]
  );

  return {
    visibleItems: safeItems.slice(0, visibleCount),
    visibleCount,
    hasMore: visibleCount < safeItems.length,
    loadMore,
    showThroughIndex,
    totalCount: safeItems.length,
  };
};
