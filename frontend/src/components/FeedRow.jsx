import React from 'react';

function FeedRow({ feed, selected, onToggle, onClick }) {
  const isDisabled = feed.dispatch_mode === 'disabled';

  const dispatchIcon = {
    interval: '🕒',
    schedule: '📅',
    disabled: '🚫',
  };

  return (
    <tr
      className={`border-t hover:bg-blue-50 cursor-pointer ${
        isDisabled ? 'bg-gray-100 text-gray-400' : ''
      }`}
      onClick={() => onClick(feed)}
    >
      <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
        />
      </td>
      <td className="p-2" onClick={(e) => e.stopPropagation()}>
        <img
          src={`/static/stills/${feed.uuid}.jpg`}
          alt="Thumbnail"
          className="w-24 h-24 object-cover border"
          data-original-src={`/static/stills/${feed.uuid}.jpg`}
          onError={(e) => { e.target.src = '/static/offline.jpg'; }}
        />
      </td>
      <td className="p-2">{feed.title}</td>
      <td className="p-2">{feed.decoder_name}</td>
      <td className="p-2">{feed.seconds_per_capture || 'N/A'}</td>
      <td className="p-2 text-xl" title={feed.dispatch_mode}>
        {dispatchIcon[feed.dispatch_mode]}
      </td>

    </tr>
  );
}

export default FeedRow;
