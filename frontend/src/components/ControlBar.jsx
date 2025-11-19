import React from 'react';

const ControlBar = ({
  searchTerm,
  setSearchTerm,
  decoderFilter,
  setDecoderFilter,
  uniqueDecoders,
  selectedFeeds,
  setShowDeleteModal,
  setShowAddModal,
  onViewGrid // ✅ added
}) => {
  return (
    <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
      {/* Left Side: Search + Filter */}
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Search feeds..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 w-64"
        />

        <select
          value={decoderFilter}
          onChange={(e) => setDecoderFilter(e.target.value)}
          className="border p-2 w-48"
        >
          <option value="All Decoders">All Decoders</option>
          {uniqueDecoders.map((decoder) => (
            <option key={decoder} value={decoder}>
              {decoder}
            </option>
          ))}
        </select>
      </div>

      {/* Right Side: Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          + Add Feed
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={selectedFeeds.length === 0}
          className={`px-4 py-2 rounded text-white ${
            selectedFeeds.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          Delete Selected
        </button>

        <button
          onClick={onViewGrid}
          disabled={selectedFeeds.length === 0}
          className={`px-4 py-2 rounded text-white ${
            selectedFeeds.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          View in Grid
        </button>
      </div>
    </div>
  );
};

export default ControlBar;
