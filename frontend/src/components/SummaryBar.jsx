import { useEffect, useState } from 'react';
import axios from 'axios';

function SummaryBar({
  feedCount,
  decoderCount,
  staticFileCount,
  staticSize,
  healthStatus,
  availableDecoders = []
}) {
  return (
    <div className="bg-gray-100 rounded p-4 mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center shadow">
      <div className="text-sm text-gray-700 flex flex-wrap gap-x-4 gap-y-2 mb-2 sm:mb-0">
        <div><strong>Feeds:</strong> {feedCount}</div>

        <div className="relative group">
          <strong>Decoders:</strong> {decoderCount}
          <span className="ml-1 text-blue-600 cursor-pointer">ℹ️</span>
          <div className="absolute z-50 hidden group-hover:block bg-white border border-blue-300 text-xs text-gray-800 p-2 rounded shadow top-6 left-0 whitespace-nowrap">
            <strong>Available:</strong><br />
            {availableDecoders.length > 0
              ? availableDecoders.map(dec => <div key={dec}>• {dec}</div>)
              : 'None'}
          </div>
        </div>

        <div><strong>Static Files:</strong> {staticFileCount}</div>
        <div><strong>Total Size:</strong> {staticSize}</div>
      </div>

      <div>
        <span className={`text-xs font-bold px-2 py-1 rounded ${healthStatus === 'ok' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
          {healthStatus === 'ok' ? 'HEALTHY' : 'UNAVAILABLE'}
        </span>
      </div>
    </div>
  );
}

export default SummaryBar;
