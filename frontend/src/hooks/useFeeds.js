import { useState, useEffect } from "react";

export function useFeeds() {
  const [feeds, setFeeds] = useState([]);
  const [serverStats, setServerStats] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchFeeds = async () => {
    try {
      const [feedsRes, statsRes] = await Promise.all([
        fetch("/api/feeds"),
        fetch("/api/server/summary")
      ]);
      const feedsData = await feedsRes.json();
      const statsData = await statsRes.json();
      setFeeds(feedsData);
      setServerStats(statsData);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch feeds or stats", err);
    }
  };

  useEffect(() => {
    fetchFeeds();

    const interval = setInterval(fetchFeeds, 60000); // Auto-refresh every 60s
    return () => clearInterval(interval);
  }, []);

  return { feeds, serverStats, loading, refreshFeeds: fetchFeeds };
}
