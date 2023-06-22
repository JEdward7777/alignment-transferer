// FileMenu.tsx
import React from 'react';

const FileMenu: React.FC = () => {
  return (
    <li className="relative group">
      <a href="#" className="text-gray-700 hover:text-black">
        File
      </a>
      <ul className="absolute hidden group-hover:block bg-white py-2 ml-0.5">
        <li>
          <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
            Open
          </a>
        </li>
        <li>
          <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
            Save
          </a>
        </li>
      </ul>
    </li>
  );
};

export default FileMenu;
