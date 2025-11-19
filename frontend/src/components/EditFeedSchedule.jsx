import React, { useState } from 'react';
import axios from 'axios';

function EditFeedSchedule({ feed, onClose, onSave }) {
  const [timeInput, setTimeInput] = useState('');
  const [times, setTimes] = useState(
    Array.isArray(feed.capture_at_times) ? [...feed.capture_at_times].sort() : []
  );
  const [saving, setSaving] = useState(false);

  const normalizeTime = (value) => {
    const parts = value.trim().split(':').map(Number);
    if (parts.length === 2) {
      const [h, m] = parts;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
    } else if (parts.length === 3) {
      const [h, m, s] = parts;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return null;
  };

  const isValidTime = (value) => {
    const norm = normalizeTime(value);
    if (!/^\d{2}:\d{2}:\d{2}$/.test(norm)) return false;
    const [h, m, s] = norm.split(':').map(Number);
    return h >= 0 && h <= 23 && m >= 0 && m <= 59 && s >= 0 && s <= 59;
  };

  const addTime = () => {
    const norm = normalizeTime(timeInput);
    if (norm && isValidTime(timeInput) && !times.includes(norm)) {
      const updated = [...times, norm].sort();
      setTimes(updated);
      setTimeInput('');
    }
  };

  const removeTime = (value) => {
    setTimes((prev) => prev.filter((t) => t !== value));
  };

  const handleSave = () => {
    setSaving(true);
    axios.put(`/api/feeds/${feed.uuid}`, { capture_at_times: times })
      .then(() => {
        setSaving(false);
        if (onSave) onSave();
        onClose();
      })
      .catch(err => {
        console.error('Failed to update schedule:', err);
        setSaving(false);
        alert('Failed to save schedule.');
      });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-[500px] p-6 rounded shadow-lg relative">
        <h2 className="text-lg font-bold mb-4">Edit Capture Schedule</h2>

        <div className="mb-4">
          <label className="block mb-1">Add Time (hh:mm or hh:mm:ss)</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="border p-2 flex-grow"
              placeholder="e.g. 6:00 or 13:45:00"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTime()}
            />
            <button
              onClick={addTime}
              disabled={!isValidTime(timeInput)}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">All times are UTC</p>
        </div>

        <div className="mb-4 max-h-40 overflow-auto border p-2 rounded">
          {times.length === 0 ? (
            <p className="text-sm text-gray-400">No scheduled times yet.</p>
          ) : (
            <ul className="space-y-1">
              {times.map((time) => (
                <li key={time} className="flex justify-between items-center">
                  <span>{time}</span>
                  <button
                    onClick={() => removeTime(time)}
                    className="text-red-600 hover:text-red-800 text-lg font-bold px-2"
                    title="Remove time"
                  >
                    ✖
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-between mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded">Close</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditFeedSchedule;
