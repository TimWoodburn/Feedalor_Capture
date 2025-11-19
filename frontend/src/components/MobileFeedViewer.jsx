import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import exifr from 'exifr';

function MobileFeedViewer({ feed, onClose }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [frameUrl, setFrameUrl] = useState('');
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [captureTime, setCaptureTime] = useState(null);
  const [formData, setFormData] = useState({
    seconds_per_capture: feed.seconds_per_capture,
    history_length: feed.history_length,
  });

  const now = useRef(Date.now());

  useEffect(() => {
    const url = feed.history_length > 0
      ? `/api/feeds/${feed.uuid}/frames/${currentFrameIndex}?refresh=${now.current}`
      : `/static/stills/${feed.uuid}.jpg`;
    setFrameUrl(url);
  }, [feed.uuid, currentFrameIndex, feed.history_length]);

  useEffect(() => {
    const loadExif = async () => {
      setCaptureTime(null);
      if (!frameUrl || frameUrl.includes('offline.jpg')) return;

      try {
        const exif = await exifr.parse(frameUrl, ['DateTimeOriginal']);
        if (exif?.DateTimeOriginal) {
          const dt = new Date(exif.DateTimeOriginal).toISOString();
          const [date, time] = dt.split('T');
          setCaptureTime(`${date} ${time.split('.')[0]}`);
        }
      } catch (err) {
        console.warn('EXIF read failed:', err);
      }
    };
    loadExif();
  }, [frameUrl]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSliderChange = (e) => {
    const raw = parseInt(e.target.value, 10);
    const newIndex = feed.history_length - 1 - raw;
    setCurrentFrameIndex(newIndex);
  };

  const handleSave = () => {
    axios.put(`/api/feeds/${feed.uuid}`, formData)
      .then(() => onClose())
      .catch(() => alert("Failed to save feed parameters."));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-[95vw] max-h-[95vh] rounded-lg shadow-lg p-4 overflow-auto">
        <h2 className="text-xl font-bold mb-4">{feed.title}</h2>

        <div className="w-full mb-4 border rounded bg-gray-100 flex items-center justify-center h-64">
          <img
            src={frameUrl}
            alt="Feed Frame"
            className="object-contain max-h-full max-w-full"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => { e.target.src = '/static/offline.jpg'; }}
          />
        </div>

        {feed.history_length > 1 && (
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={feed.history_length - 1}
              value={feed.history_length - 1 - currentFrameIndex}
              onChange={handleSliderChange}
              className="w-full"
            />
            <p className="text-center text-sm font-semibold text-gray-700 mt-2">
              Frame {currentFrameIndex + 1} of {feed.history_length}
              {captureTime ? ` – captured UTC ${captureTime}` : ''}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Capture Rate (seconds)</label>
            <input
              type="number"
              name="seconds_per_capture"
              value={formData.seconds_per_capture}
              onChange={handleInputChange}
              className="mt-1 block w-full border px-2 py-1 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">History Length</label>
            <input
              type="number"
              name="history_length"
              value={formData.history_length}
              onChange={handleInputChange}
              className="mt-1 block w-full border px-2 py-1 rounded"
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border text-gray-700"
          >
            Close
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default MobileFeedViewer;
