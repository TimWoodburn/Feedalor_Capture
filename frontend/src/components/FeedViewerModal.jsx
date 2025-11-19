import React, { useState, useRef, useEffect } from 'react';
import exifr from 'exifr';

function FeedViewerModal({ feed, onClose, onEdit }) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [captureTime, setCaptureTime] = useState(null);


  const dispatchIcon = {
    interval: '🕒 Interval',
    schedule: '📅 Schedule',
    disabled: '🚫 Disabled',
  };

  const now = useRef(Date.now());
  const frameUrl = feed.history_length > 0
    ? `/api/feeds/${feed.uuid}/frames/${currentFrameIndex}?refresh=${now.current}`
    : `/static/stills/${feed.uuid}.jpg`;

  const handleSliderChange = (e) => {
    const raw = parseInt(e.target.value, 10);
    const newIndex = feed.history_length - 1 - raw;
    setCurrentFrameIndex(newIndex);
  };

  const drawOverlay = () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = img.getBoundingClientRect();
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.left = `${img.offsetLeft}px`;
    canvas.style.top = `${img.offsetTop}px`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (
      feed.crop_x !== null &&
      feed.crop_y !== null &&
      feed.crop_width !== null &&
      feed.crop_height !== null
    ) {
      const x = feed.crop_x / scaleX;
      const y = feed.crop_y / scaleY;
      const w = feed.crop_width / scaleX;
      const h = feed.crop_height / scaleY;

      ctx.strokeStyle = feed.crop_active ? 'green' : 'red';
      ctx.lineWidth = 2;
      ctx.setLineDash([6]);
      ctx.strokeRect(x, y, w, h);
    }
  };

  useEffect(() => {
    if (!imageLoaded) return;
    drawOverlay();
  }, [imageLoaded]);

  useEffect(() => {
    if (!imageLoaded) return;
    drawOverlay();
  }, [
    feed.crop_x,
    feed.crop_y,
    feed.crop_width,
    feed.crop_height,
    feed.crop_active
  ]);

useEffect(() => {
  const loadExif = async () => {
    setCaptureTime(null);

    if (!frameUrl || frameUrl.includes('offline.jpg')) {
      console.warn("guard clause fires");
      return;
    }

    try {
      const exif = await exifr.parse(frameUrl, ['DateTimeOriginal']);
      if (exif?.DateTimeOriginal) {
        const dt = new Date(exif.DateTimeOriginal).toISOString();
        const [date, timeWithMs] = dt.split('T');
        const time = timeWithMs.split('.')[0];
        setCaptureTime(`${date} ${time}`);

      }
    } catch (err) {
      console.warn('Failed to read EXIF:', err);
    }
  };

  loadExif();
}, [currentFrameIndex, frameUrl]);




  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white w-full max-w-[95vw] max-h-[95vh] rounded shadow-lg relative flex flex-col p-6 overflow-auto sm:w-[1280px] sm:h-[1024px] min-w-[600px] min-h-[500px]">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-black text-xl"
        >
          ✖
        </button>

        <h2 className="text-2xl font-bold mb-1">{feed.title}</h2>

        <div className="mb-4">
          <button
            onClick={() => window.open(feed.url, "_blank", "noopener,noreferrer")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow text-sm"
          >
            Open Source Feed
          </button>
        </div>

        <div ref={containerRef} className="relative h-[512px] border rounded bg-gray-50 flex items-center justify-center overflow-hidden">
          <img
            ref={imgRef}
            src={frameUrl}
            alt="Feed Frame"
            className="max-h-full max-w-full object-contain"
            onLoad={() => {
              setImageLoaded(true);
              setIsOffline(false);
            }}
            onError={(e) => {
              e.target.src = '/static/offline.jpg';
              setIsOffline(true);
            }}
          />
          <canvas
            ref={canvasRef}
            className="absolute pointer-events-none"
          />
        </div>

        {feed.history_length > 1 && (
          <div className="mt-4">
            <input
              type="range"
              min="0"
              max={feed.history_length - 1}
              value={feed.history_length - 1 - currentFrameIndex}
              onChange={handleSliderChange}
              className="w-full"
            />
            <p className="text-center text-xs text-gray-500 mt-1">
              Frame {currentFrameIndex + 1} of {feed.history_length}
              {captureTime ? ` – captured UTC ${captureTime}` : ''}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
          <div><strong>Title:</strong> {feed.title}</div>
          <div><strong>Decoder:</strong> {feed.decoder_name}</div>
          <div><strong>Capture Rate:</strong> {feed.seconds_per_capture}s</div>
          <div><strong>History Length:</strong> {feed.history_length}</div>
          <div><strong>Last Capture:</strong> {feed.last_capture_at || 'N/A'}</div>
          <div><strong>Last Failure:</strong> {feed.last_failed_at || 'None'}</div>
          <div><strong>Dispatch Mode:</strong> <span className="text-lg" title={feed.dispatch_mode}>{dispatchIcon[feed.dispatch_mode]}</span></div>
          <div>
            <strong>Location:</strong>{' '}
            {feed.gps_latitude != null && feed.gps_longitude != null ? (
              <a
                href={`https://www.google.com/maps?q=${feed.gps_latitude},${feed.gps_longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {feed.gps_latitude.toFixed(6)}, {feed.gps_longitude.toFixed(6)}
              </a>
            ) : (
              <span className="text-gray-500">Not Set (Set in edit parameters)</span>
            )}
          </div>
          <div className="col-span-2">
            <strong>Crop Region:</strong> {feed.crop_active ? 'Active' : 'Inactive'} <span className="text-gray-500">(set crop region state in Edit Parameters, Define Region)</span>
          </div>
        </div>

        <div className="mt-auto flex justify-between">
          <div className="relative group">
            <button
              onClick={() => window.open(`/api/feeds/${feed.uuid}/download`, '_blank')}
              disabled={isOffline || feed.history_length === 0}
              className={`px-4 py-2 rounded text-white mt-4 ${
                isOffline || feed.history_length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Download Feed Stills
            </button>
            {(isOffline || feed.history_length === 0) && (
              <div className="absolute bottom-full mb-1 left-0 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {isOffline
                  ? 'Image is offline. Cannot download.'
                  : 'No frames available to download.'}
              </div>
            )}
          </div>
          <button
            onClick={onEdit}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mt-4"
          >
            Edit Parameters
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeedViewerModal;
