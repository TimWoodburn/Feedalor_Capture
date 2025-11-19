import React from 'react';

const DeleteModal = ({ count, onCancel, onConfirm }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
    <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
      <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
      <p className="mb-4">Are you sure you want to delete {count} feed(s)?</p>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 border rounded">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);

export default DeleteModal;
