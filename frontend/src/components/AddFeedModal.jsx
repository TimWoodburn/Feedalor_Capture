import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddFeedModal = ({ onClose, onAdded }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [decoderName, setDecoderName] = useState('');
  const [decoderOptions, setDecoderOptions] = useState([]);

  const [secondsPerCapture, setSecondsPerCapture] = useState(60);
  const [historyLength, setHistoryLength] = useState(1);

  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // null | 'success' | 'error'
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    axios.get('/api/decoders')
      .then(res => setDecoderOptions(res.data))
      .catch(err => console.error('Failed to load decoders:', err));
  }, []);

  const handleTestDecoder = () => {
    if (!url || !decoderName) {
      setTestStatus('error');
      setTestMessage('URL and decoder are required to test.');
      return;
    }

    setTesting(true);
    setTestStatus(null);
    axios.post('/api/feeds/test-decoder', { url, decoder_name: decoderName })
      .then(() => {
        setTestStatus('success');
        setTestMessage('Decoder test succeeded.');
      })
      .catch(err => {
        setTestStatus('error');
        setTestMessage(err.response?.data?.error || 'Decoder test failed.');
      })
      .finally(() => setTesting(false));
  };

  const handleAddFeed = () => {
    axios.post('/api/feeds', {
      title,
      url,
      decoder_name: decoderName,
      seconds_per_capture: secondsPerCapture,
      history_length: historyLength,
    }).then(() => {
      if (onAdded) onAdded(); // refresh feed list
      onClose();
    }).catch(err => {
      console.error('Failed to add feed:', err);
      alert('Failed to add feed. Please check the inputs.');
    });
  };

  const formValid = title && url && decoderName && testStatus === 'success';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-[500px] p-6 rounded shadow-lg relative">
        <h2 className="text-lg font-bold mb-4">Add New Feed</h2>

        <label className="block mb-2">
          Title:
          <input
            type="text"
            className="border p-2 w-full"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </label>

        <label className="block mb-2">
          Feed URL:
          <input
            type="text"
            className="border p-2 w-full"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
        </label>

        <label className="block mb-2">
          Decoder:
          <select
            className="border p-2 w-full"
            value={decoderName}
            onChange={e => setDecoderName(e.target.value)}
          >
            <option value="">-- Select Decoder --</option>
            {decoderOptions.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>

        <button
          className="bg-blue-500 text-white px-3 py-2 rounded mt-2 mb-1 hover:bg-blue-600"
          onClick={handleTestDecoder}
          disabled={testing || !decoderName || !url}
        >
          {testing ? 'Testing...' : 'Test Decoder'}
        </button>

        {testStatus && (
          <p
            className={`text-sm mt-1 ${testStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}
            style={{
              maxHeight: '3.5rem',        // roughly 2 lines
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={testMessage} // ✅ show full message on hover
          >
            {testMessage}
          </p>
        )}


        <label className="block mt-4 mb-2">
          Capture Rate (s):
          <input
            type="number"
            min="1"
            className="border p-2 w-full"
            value={secondsPerCapture}
            onChange={e => setSecondsPerCapture(parseInt(e.target.value))}
          />
        </label>

        <label className="block mb-4">
          History Length:
          <input
            type="number"
            min="1"
            className="border p-2 w-full"
            value={historyLength}
            onChange={e => setHistoryLength(parseInt(e.target.value))}
          />
        </label>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={handleAddFeed}
            disabled={!formValid}
            className={`px-4 py-2 rounded text-white ${formValid ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
          >
            Add Feed
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddFeedModal;
