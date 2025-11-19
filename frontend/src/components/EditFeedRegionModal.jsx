import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';

function EditFeedRegionModal({ feed, onClose, onSave }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [region, setRegion] = useState(null);
  const [startPoint, setStartPoint] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scaledDims, setScaledDims] = useState({ x: 0, y: 0, scale: 1 });
  const [cropActive, setCropActive] = useState(feed.crop_active || false);
  const [checkboxDisabled, setCheckboxDisabled] = useState(true);
  const [regionCleared, setRegionCleared] = useState(false);

  const imgUrl = `/static/stills/${feed.uuid}.jpg`;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;
    if (!img || !imageLoaded) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (region) {
        ctx.strokeStyle = cropActive ? 'green' : 'red';
        ctx.lineWidth = 2;
        ctx.setLineDash([6]);
        ctx.strokeRect(region.x, region.y, region.w, region.h);
      }
    };

    draw();
  }, [region, imageLoaded, cropActive]);

  useEffect(() => {
    if (
      feed.crop_x != null &&
      feed.crop_y != null &&
      feed.crop_width != null &&
      feed.crop_height != null &&
      imgRef.current &&
      imgRef.current.complete
    ) {
      handleImageLoad();
    }
  }, []);

  const handleMouseDown = (e) => {
    if (!imageLoaded) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (region && isInsideRegion(x, y)) {
      setRegion(null);
      setCropActive(false);
      setCheckboxDisabled(true);
      setRegionCleared(true);
      return;
    }

    setStartPoint({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !imageLoaded) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRegion = {
      x: Math.min(startPoint.x, x),
      y: Math.min(startPoint.y, y),
      w: Math.abs(x - startPoint.x),
      h: Math.abs(y - startPoint.y),
    };
    setRegion(newRegion);
    setCheckboxDisabled(false);
    setRegionCleared(false);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const isInsideRegion = (x, y) => {
    if (!region) return false;
    return (
      x >= region.x &&
      x <= region.x + region.w &&
      y >= region.y &&
      y <= region.y + region.h
    );
  };

  const handleImageLoad = () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;

    const containerWidth = canvas.parentElement.offsetWidth;
    const scale = containerWidth / img.naturalWidth;

    const width = containerWidth;
    const height = img.naturalHeight * scale;

    canvas.width = width;
    canvas.height = height;
    setScaledDims({ x: 0, y: 0, scale });
    setImageLoaded(true);

    if (
      feed.crop_x != null &&
      feed.crop_y != null &&
      feed.crop_width != null &&
      feed.crop_height != null
    ) {
      setRegion({
        x: feed.crop_x * scale,
        y: feed.crop_y * scale,
        w: feed.crop_width * scale,
        h: feed.crop_height * scale,
      });
      setCheckboxDisabled(false);
    }
  };

  const handleSaveRegion = () => {
    const { scale } = scaledDims;

    const payload = region
      ? {
          crop_x: Math.round(region.x / scale),
          crop_y: Math.round(region.y / scale),
          crop_width: Math.round(region.w / scale),
          crop_height: Math.round(region.h / scale),
          crop_active: cropActive,
        }
      : regionCleared
      ? {
          crop_x: null,
          crop_y: null,
          crop_width: null,
          crop_height: null,
          crop_active: false,
        }
      : null;

    if (!payload) return;

    axios
      .put(`/api/feeds/${feed.uuid}`, payload)
      .then(() => {
        if (onSave) onSave();
        onClose();
      })
      .catch((err) => {
        console.error('Failed to save region:', err);
        alert('Failed to save region.');
      });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 w-full max-w-[95vw] max-h-[95vh] min-w-[600px] min-h-[500px] rounded shadow-lg overflow-auto sm:w-[900px]">
        <h2 className="text-xl font-bold mb-2">Define Capture Region</h2>
        <div className="mb-2">
          <p className="text-sm text-gray-600">
            Click and drag on the image to draw the capture region. Click inside the region to clear.
          </p>
        </div>

        <div className="relative border overflow-hidden mb-2 h-[512px]">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="border"
          />
          <img
            ref={imgRef}
            src={imgUrl}
            alt="Preview"
            className="hidden"
            onLoad={handleImageLoad}
            onError={(e) => (e.target.src = '/static/offline.jpg')}
          />
        </div>

        <div className="flex items-center justify-between mb-2 h-5">
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={cropActive}
              onChange={() => setCropActive(!cropActive)}
              className="mr-2"
              disabled={checkboxDisabled}
            />
            Enable Crop Region
          </label>

          {region ? (
            <p className="text-sm text-gray-600">
              X: {region.x}, Y: {region.y}, W: {region.w}, H: {region.h}
            </p>
          ) : (
            <span />
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={handleSaveRegion}
            disabled={!region && !regionCleared}
            className={`px-4 py-2 rounded text-white ${
              region || regionCleared ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Save Region
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditFeedRegionModal;
