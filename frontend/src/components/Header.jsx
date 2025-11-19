// src/components/Header.jsx

import React from 'react';

function Header() {
  return (
    <header className="bg-blue-800 text-white py-4 px-6 shadow-md sticky top-0 z-50">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          CCTV Still Grab – Feed Viewer
        </h1>
        <span className="text-sm bg-green-600 text-white px-2 py-1 rounded">
          Server Healthy
        </span>
      </div>
    </header>
  );
}

export default Header;
