import React, { useState, useEffect } from 'react';
import FeedRow from './FeedRow';

function FeedTable({
  feeds,
  selectedFeeds,
  setSelectedFeeds,
  searchTerm,
  decoderFilter,
  sortConfig,
  requestSort,
  onFeedClick
}) {
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    setSelectAll(feeds.length > 0 && selectedFeeds.length === feeds.length);
  }, [selectedFeeds, feeds]);

  const handleSelectAllToggle = () => {
    if (selectAll) {
      setSelectedFeeds([]);
    } else {
      setSelectedFeeds(feeds.map(feed => feed.uuid));
    }
  };

  const toggleFeedSelection = (uuid) => {
    setSelectedFeeds(prev =>
      prev.includes(uuid) ? prev.filter(id => id !== uuid) : [...prev, uuid]
    );
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

  return (
    <table className="min-w-full table-auto border border-gray-300">
      <thead className="bg-blue-100 sticky top-0 z-20">
        <tr>
          <th className="p-2 text-center">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAllToggle}
            />
          </th>
          <th className="p-2">Thumbnail</th>
          <th className="p-2 cursor-pointer" onClick={() => requestSort('title')}>Title</th>
          <th className="p-2 cursor-pointer" onClick={() => requestSort('decoder_name')}>Decoder</th>
          <th className="p-2 cursor-pointer" onClick={() => requestSort('seconds_per_capture')}>Capture Rate (s)</th>
          <th className="p-2 cursor-pointer" onClick={() => requestSort('dispatch_mode')}>Mode</th>
        </tr>
      </thead>
      <tbody>
        {filteredFeeds.map(feed => (
          <FeedRow
            key={feed.uuid}
            feed={feed}
            selected={selectedFeeds.includes(feed.uuid)}
            onToggle={() => toggleFeedSelection(feed.uuid)}
            onClick={() => onFeedClick(feed)}
          />
        ))}
      </tbody>
    </table>
  );
}

export default FeedTable;
