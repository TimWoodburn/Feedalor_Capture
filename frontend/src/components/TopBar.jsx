import React from 'react';

const TopBar = ({ onRefresh, onOpenSettings }) => (
  <div className="sticky-top flex justify-between items-center mb-4 px-4 py-3 bg-white shadow z-50 border-b border-gray-200">
    <h1 className="text-2xl font-bold text-blue-800">Feedalor Capture - Feed Viewer</h1>
    <div className="flex items-center gap-2">
      <button
        onClick={onRefresh}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
      >
        🔄 Refresh All
      </button>
      <button
        onClick={onOpenSettings}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow w-10 h-10 flex items-center justify-center text-xl"
        title="Settings"
      >
        ⚙
      </button>

    </div>
  </div>
);

export default TopBar;
