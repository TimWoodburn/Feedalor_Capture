import React, { useRef } from 'react';

function SettingsModal({ onClose }) {
  const fileInputRef = useRef();

  const backupFeeds = () => {
    fetch("/api/feeds/backup")
      .then(res => res.json())
      .then(data => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `FEEDALOR_CAPTURE_BACKUP_${timestamp}.json`;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      })
      .catch(err => alert("Failed to back up feeds.\n" + err));
  };

  const restoreFeeds = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result);
        fetch("/api/feeds/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        })
          .then(res => res.json())
          .then(() => {
            alert("Restore complete. Refreshing...");
            window.location.reload();
          })
          .catch(err => alert("Restore failed.\n" + err));
      } catch (err) {
        alert("Invalid JSON file.\n" + err);
      }
    };
    reader.readAsText(file);
  };

  const openEngineeringPage = () => {
    window.open("/engineering", "_blank");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-[700px] h-[600px] rounded shadow-lg relative flex flex-col p-6">
        <h2 className="text-2xl font-bold mb-4 text-left">Settings</h2>

        <label className="block font-semibold mb-2">About</label>
        <textarea
          readOnly
          className="w-full h-48 p-2 border rounded resize-none bg-gray-100 text-sm mb-6"
          value={
            "Feedalor Capture\nVersion v1.5.0-ioc\n\nThis application manages video stills from registered feeds.\nLicensed under MIT License."
          }
        />

        <div className="mt-auto flex justify-between items-center">
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Close
          </button>
          <div className="flex gap-2">
            <button
              onClick={backupFeeds}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Backup Feeds
            </button>
            <label className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded cursor-pointer">
              Restore Feeds
              <input
                type="file"
                accept="application/json"
                ref={fileInputRef}
                onChange={restoreFeeds}
                className="hidden"
              />
            </label>
            <button
              onClick={openEngineeringPage}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            >
              Engineering Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
