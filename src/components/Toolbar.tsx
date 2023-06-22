// Toolbar.tsx
import React from 'react';

const Toolbar: React.FC = () => {
  return (
    <div className="text-center">
      <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
        Add Resource
      </button>
    </div>
  );
};

export default Toolbar;
