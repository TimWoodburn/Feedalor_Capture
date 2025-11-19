import { useEffect } from 'react';

export function useAutoRefresh({ refreshFeeds, refreshThumbnails }) {
  useEffect(() => {
    const offlineInterval = setInterval(() => {
      refreshThumbnails();
    }, 10000);

    const fullInterval = setInterval(() => {
      refreshFeeds();
    }, 30000);

    return () => {
      clearInterval(offlineInterval);
      clearInterval(fullInterval);
    };
  }, [refreshFeeds, refreshThumbnails]);
}
