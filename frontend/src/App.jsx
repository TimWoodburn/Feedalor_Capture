import { useEffect, useState } from 'react';
import axios from 'axios';

import TopBar from './components/TopBar';
import SummaryBar from './components/SummaryBar';
import ControlBar from './components/ControlBar';
import FeedTable from './components/FeedTable';
import DeleteModal from './components/DeleteModal';
import AddFeedModal from './components/AddFeedModal';
import FeedViewerModal from './components/FeedViewerModal';
import EditFeedModal from './components/EditFeedModal';
import SettingsModal from './components/SettingsModal';
import MobileFeedViewer from './components/MobileFeedViewer';


function App() {
  const [feeds, setFeeds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [decoderFilter, setDecoderFilter] = useState('All Decoders');
  const [sortConfig, setSortConfig] = useState({ key: 'title', direction: 'asc' });
  const [selectedFeeds, setSelectedFeeds] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [healthInfo, setHealthInfo] = useState(null);
  const [decoderList, setDecoderList] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    const fullInterval = setInterval(() => {
      fetchAll();
    }, 30000);

    const offlineInterval = setInterval(() => {
      const now = Date.now();
      document.querySelectorAll('img').forEach(img => {
        if (img.src.includes('offline.jpg')) {
          const originalSrc = img.dataset.originalSrc || img.src;
          img.dataset.originalSrc = originalSrc;
          img.src = originalSrc.split('?')[0] + `?refresh=${now}`;
        }
      });
    }, 10000);

    return () => {
      clearInterval(fullInterval);
      clearInterval(offlineInterval);
    };
  }, []);

  const fetchAll = () => {
    axios.get('/api/feeds')
      .then(res => {
        const updatedFeeds = res.data;
        setFeeds(updatedFeeds);

        // Preserve UUIDs that still exist
        setSelectedFeeds(prevSelected =>
          prevSelected.filter(uuid => updatedFeeds.some(feed => feed.uuid === uuid))
        );
      })

      .catch(err => console.error('Error fetching feeds:', err));

    axios.get('/api/health')
      .then(res => setHealthInfo(res.data))
      .catch(() => setHealthInfo(null));

    axios.get('/api/decoders')
      .then(res => setDecoderList(res.data))
      .catch(() => setDecoderList([]));
  };

  const handleFeedClick = (uuid) => {
    axios.get(`/api/feeds/${uuid}`)
      .then(res => setSelectedFeed(res.data))
      .catch(err => {
        console.error('Failed to load feed:', err);
        alert('Could not load feed details');
      });
  };

  const toggleFeedSelection = (uuid) => {
    setSelectedFeeds(prev =>
      prev.includes(uuid) ? prev.filter(id => id !== uuid) : [...prev, uuid]
    );
  };

  const handleDeleteFeeds = () => {
    Promise.all(selectedFeeds.map(uuid => axios.delete(`/api/feeds/${uuid}`)))
      .then(() => {
        setShowDeleteModal(false);
        fetchAll();
      })
      .catch(err => {
        console.error('Error deleting feeds:', err);
        alert('Failed to delete some feeds!');
      });
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedFeeds = [...feeds].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const filteredFeeds = sortedFeeds.filter(feed => {
    const matchesTitle = feed.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDecoder = decoderFilter === 'All Decoders' || feed.decoder_name === decoderFilter;
    return matchesTitle && matchesDecoder;
  });

  const uniqueDecoders = Array.from(new Set(feeds.map(feed => feed.decoder_name)));

  const handleSaveAndRefresh = () => {
    if (selectedFeed) {
      axios.get(`/api/feeds/${selectedFeed.uuid}`)
        .then(res => setSelectedFeed(res.data))
        .catch(err => console.error("Failed to reload updated feed:", err));
    }
    fetchAll();
  };

  const handleViewGrid = () => {
  if (selectedFeeds.length === 0) return;
  const url = `/custom_grid?feeds=${selectedFeeds.join(',')}`;
  window.location.href = url;
};


return (
  <div className="p-4 flex flex-col h-screen">
    <TopBar onRefresh={fetchAll} onOpenSettings={() => setShowSettings(true)} />
    <SummaryBar
      feedCount={feeds.length}
      decoderCount={uniqueDecoders.length}
      staticFileCount={healthInfo?.static_file_count || 0}
      staticSize={healthInfo?.static_total_size_human || '0 B'}
      healthStatus={healthInfo?.status || 'unknown'}
      availableDecoders={decoderList}
    />
    <ControlBar
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      decoderFilter={decoderFilter}
      setDecoderFilter={setDecoderFilter}
      uniqueDecoders={uniqueDecoders}
      selectedFeeds={selectedFeeds}
      setShowDeleteModal={setShowDeleteModal}
      setShowAddModal={setShowAddModal}
      onViewGrid={handleViewGrid} // NEW
    />

    <div className="overflow-y-auto h-[calc(100vh-280px)] border border-gray-300 rounded">
      <FeedTable
        feeds={filteredFeeds}
        selectedFeeds={selectedFeeds}
        setSelectedFeeds={setSelectedFeeds}
        searchTerm={searchTerm}
        decoderFilter={decoderFilter}
        sortConfig={sortConfig}
        requestSort={requestSort}
        onFeedClick={(feed) => handleFeedClick(feed.uuid)}
      />
    </div>

    {showDeleteModal && (
      <DeleteModal
        count={selectedFeeds.length}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteFeeds}
      />
    )}

  {selectedFeed && (
    isMobile ? (
      <MobileFeedViewer
        feed={selectedFeed}
        onClose={() => setSelectedFeed(null)}
      />
    ) : (
      <FeedViewerModal
        feed={selectedFeed}
        onClose={() => setSelectedFeed(null)}
        onEdit={() => setShowEditModal(true)}
      />
    )
  )}


    {showEditModal && selectedFeed && (
      <EditFeedModal
        feed={selectedFeed}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveAndRefresh}
      />
    )}

    {showAddModal && (
      <AddFeedModal
        onClose={() => setShowAddModal(false)}
        onAdded={fetchAll}
      />
    )}

    {showSettings && (
      <SettingsModal
        onClose={() => setShowSettings(false)}
      />
    )}
  </div>
);

}

export default App;
