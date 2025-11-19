import React, { useState } from 'react';
import axios from 'axios';
import EditFeedRegionModal from './EditFeedRegionModal';
import EditFeedSchedule from './EditFeedSchedule';

function EditFeedModal({ feed, onClose, onSave }) {
  const [title, setTitle] = useState(feed.title);
  const [secondsPerCapture, setSecondsPerCapture] = useState(feed.seconds_per_capture || 60);
  const [historyLength, setHistoryLength] = useState(feed.history_length ?? 1);
  const [dispatchMode, setDispatchMode] = useState(feed.dispatch_mode || 'interval');
  const [saving, setSaving] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [gpsLatitude, setGpsLatitude] = useState(feed.gps_latitude ?? '');
  const [gpsLongitude, setGpsLongitude] = useState(feed.gps_longitude ?? '');
  const [gpsImgDirection, setGpsImgDirection] = useState(feed.gps_img_direction ?? '');


const handleSave = () => {
  setSaving(true);

  const lat = String(gpsLatitude ?? '').trim();
  const lon = String(gpsLongitude ?? '').trim();
  const dir = String(gpsImgDirection ?? '').trim();

  const hasLat = lat !== '';
  const hasLon = lon !== '';

  if ((hasLat && !hasLon) || (!hasLat && hasLon)) {
    alert("Both latitude and longitude must be set, or both left blank.");
    setSaving(false);
    return;
  }

  if (hasLat) {
    const parsedLat = parseFloat(lat);
    if (isNaN(parsedLat)) {
      alert("Latitude must be a valid float.");
      setSaving(false);
      return;
    }
    if (parsedLat < -90 || parsedLat > 90) {
      alert("Latitude must be between -90 and 90.");
      setSaving(false);
      return;
    }
  }

  if (hasLon) {
    const parsedLon = parseFloat(lon);
    if (isNaN(parsedLon)) {
      alert("Longitude must be a valid float.");
      setSaving(false);
      return;
    }
    if (parsedLon < -180 || parsedLon > 180) {
      alert("Longitude must be between -180 and 180.");
      setSaving(false);
      return;
    }
  }

  if (dir !== '') {
    const direction = parseInt(dir);
    if (isNaN(direction) || direction < 0 || direction > 359) {
      alert("Image direction must be an integer between 0 and 359.");
      setSaving(false);
      return;
    }
  }

  axios.put(`/api/feeds/${feed.uuid}`, {
    title,
    seconds_per_capture: secondsPerCapture || 60,
    history_length: historyLength,
    dispatch_mode: dispatchMode,
    gps_latitude: hasLat ? parseFloat(lat) : null,
    gps_longitude: hasLon ? parseFloat(lon) : null,
    gps_img_direction: dir !== '' ? parseInt(dir) : null
  })
    .then(() => {
      setSaving(false);
      if (onSave) onSave();
      onClose();
    })
    .catch(err => {
      console.error("Error updating feed:", err);
      setSaving(false);
      alert("Failed to update feed.");
    });
};




  const isSchedule = dispatchMode === 'schedule';
  const isDisabled = dispatchMode === 'disabled';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-[600px] p-6 rounded shadow-lg relative">
        <h2 className="text-lg font-bold mb-4">Edit Feed Parameters</h2>

        <label className="block mb-2">
          Title:
          <input
            type="text"
            className="border p-2 w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label className="block mb-2">
          Capture Mode:
          <select
            className="border p-2 w-full"
            value={dispatchMode}
            onChange={(e) => setDispatchMode(e.target.value)}
          >
            <option value="interval">🕒 Interval</option>
            <option value="schedule">📅 Schedule</option>
            <option value="disabled">🚫 Disabled</option>
          </select>
        </label>

        <label className="block mb-2">
          Capture Rate (s):
          <input
            type="number"
            min="1"
            className="border p-2 w-full"
            value={secondsPerCapture}
            onChange={(e) => setSecondsPerCapture(parseInt(e.target.value))}
            disabled={isSchedule || isDisabled}
            title={isSchedule || isDisabled ? 'Disabled due to selected Capture Mode' : ''}
          />
        </label>

        <label className="block mb-4">
          History Length:
          <input
            type="number"
            min="0"
            className="border p-2 w-full"
            value={historyLength}
            onChange={(e) => setHistoryLength(parseInt(e.target.value))}
            disabled={isDisabled}
            title={isDisabled ? 'Disabled due to selected Capture Mode' : ''}
          />
        </label>

        <label className="block mb-2">
          Latitude:
          <input
            type="text"
            className="border p-2 w-full"
            value={gpsLatitude}
            onChange={(e) => setGpsLatitude(e.target.value)}
            placeholder="e.g. 51.5074"
          />
        </label>

        <label className="block mb-2">
          Longitude:
          <input
            type="text"
            className="border p-2 w-full"
            value={gpsLongitude}
            onChange={(e) => setGpsLongitude(e.target.value)}
            placeholder="e.g. -0.1278"
          />
        </label>

        <label className="block mb-4">
          Image Direction (0–359 degrees, optional):
          <input
            type="number"
            className="border p-2 w-full"
            min="0"
            max="359"
            value={gpsImgDirection}
            onChange={(e) => setGpsImgDirection(e.target.value)}
            placeholder="e.g. 90"
          />
        </label>


        <div className="grid grid-cols-4 gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded col-span-1">Cancel</button>

          {!feed.url.includes('offline.jpg') && (
            <button
              onClick={() => setShowRegionModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded col-span-1"
            >
              Define Region
            </button>
          )}

          <button
            onClick={() => setShowScheduleModal(true)}
            disabled={!isSchedule}
            className={`px-3 py-2 rounded col-span-1 ${isSchedule ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
            title={!isSchedule ? 'Only available in Schedule mode' : ''}
          >
            Set Schedule
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded col-span-1"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {showRegionModal && (
        <EditFeedRegionModal
          feed={feed}
          onClose={() => setShowRegionModal(false)}
          onSave={() => {
            setShowRegionModal(false);
            if (onSave) onSave();
          }}
        />
      )}

      {showScheduleModal && (
        <EditFeedSchedule
          feed={feed}
          onClose={() => setShowScheduleModal(false)}
          onSave={() => {
            setShowScheduleModal(false);
            if (onSave) onSave();
          }}
        />
      )}
    </div>
  );
}

export default EditFeedModal;
