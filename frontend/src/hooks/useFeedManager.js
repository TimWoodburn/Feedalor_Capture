import { useState, useEffect } from "react";
import axios from "axios";

export function useFeedManager() {
  const [feeds, setFeeds] = useState([]);
  const [decoderFilter, setDecoderFilter] = useState("All Decoders");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "title", direction: "asc" });
  const [selectedFeeds, setSelectedFeeds] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch feeds from API
  const fetchFeeds = () => {
    axios.get("/api/feeds")
      .then(response => {
        setFeeds(response.data || []);
        setSelectedFeeds(new Set());
      })
      .catch(error => {
        console.error("Error fetching feeds:", error);
      });
  };

  useEffect(() => {
    fetchFeeds();
  }, []);

  // Selection logic
  const toggleFeedSelection = (uuid) => {
    setSelectedFeeds(prev => {
      const updated = new Set(prev);
      if (updated.has(uuid)) {
        updated.delete(uuid);
      } else {
        updated.add(uuid);
      }
      return updated;
    });
  };

  const toggleSelectAll = () => {
    if (selectedFeeds.size === filteredFeeds.length) {
      setSelectedFeeds(new Set());
    } else {
      setSelectedFeeds(new Set(filteredFeeds.map(feed => feed.uuid)));
    }
  };

  const deleteSelectedFeeds = () => {
    const deletions = Array.from(selectedFeeds).map(uuid =>
      axios.delete(`/api/feeds/${uuid}`)
    );
    return Promise.all(deletions)
      .then(() => {
        fetchFeeds();
        setShowDeleteModal(false);
      })
      .catch(error => {
        console.error("Error deleting feeds:", error);
      });
  };

  const refreshFeeds = () => {
    fetchFeeds();
    const imgs = document.querySelectorAll("img");
    imgs.forEach(img => {
      const now = Date.now();
      const originalSrc = img.dataset.originalSrc || img.src;
      img.src = originalSrc.split("?")[0] + `?refresh=${now}`;
    });
  };

  // Sorting
  const sortedFeeds = [...feeds].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Filtering
  const filteredFeeds = sortedFeeds.filter(feed => {
    const matchesTitle = feed.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDecoder = decoderFilter === "All Decoders" || feed.decoder_name === decoderFilter;
    return matchesTitle && matchesDecoder;
  });

  const uniqueDecoders = Array.from(new Set(feeds.map(feed => feed.decoder_name)));

  return {
    feeds,
    filteredFeeds,
    decoderFilter,
    setDecoderFilter,
    searchTerm,
    setSearchTerm,
    sortConfig,
    requestSort: setSortConfig,
    selectedFeeds,
    toggleFeedSelection,
    toggleSelectAll,
    selectAll: selectedFeeds.size === filteredFeeds.length,
    showDeleteModal,
    setShowDeleteModal,
    deleteSelectedFeeds,
    refreshFeeds,
    uniqueDecoders,
  };
}
