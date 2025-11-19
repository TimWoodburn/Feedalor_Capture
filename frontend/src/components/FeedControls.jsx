// src/components/FeedControls.jsx

import React from 'react';

function FeedControls({
  searchTerm,
  setSearchTerm,
  decoderFilter,
  setDecoderFilter,
  decoderOptions,
  onDelete,
  onViewGrid,  // NEW
  selectedCount,
  onRefresh,
  selectAll,
  setSelectAll
}) {
  return (
    <div className="flex flex-wrap gap-4 items-center justify-between bg-blue-50 px-6 py-4 border-b border-blue-200 sticky top-[4rem] z-40">
      <div className="flex gap-2 flex-wrap items-center">
        <input
          type="text"
          placeholder="Search Title..."
          className="border border-gray-300 rounded p-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="border border-gray-300 rounded p-2"
          value={decoderFilter}
          onChange={(e) => setDecoderFilter(e.target.value)}
        >
          <option>All Decoders</option>
          {decoderOptions.map(dec => (
            <option key={dec} value={dec}>{dec}</option>
          ))}
        </select>

        <button
          onClick={onRefresh}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="flex gap-3 items-center">
        <label className="inline-flex items-center text-sm">
          <input
            type="checkbox"
            className="mr-2"
            checked={selectAll}
            onChange={(e) => setSelectAll(e.target.checked)}
          />
          Select All
        </label>

        {selectedCount > 0 && (
          <>
            <button
              onClick={onDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Delete Selected ({selectedCount})
            </button>

            <button
              onClick={onViewGrid}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              View in Grid ({selectedCount})
            </button>
          </>
        )}
      </div>

    </div>
  );
}

export default FeedControls;
