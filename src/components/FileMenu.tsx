// FileMenu.tsx
import React from 'react';
import { loadFilesFromInputOnChangeTogether } from '../utils/load_file';

interface FileMenuProps {
  onAddResource: (contents: { [key: string]: string } ) => void;
}

const FileMenu: React.FC<FileMenuProps> = ({onAddResource}) => {
  console.log( `onAddResource is ${onAddResource}` );
  return (
    <li className="relative group">
      <a href="#" className="text-gray-700 hover:text-black">
        File
      </a>
      <ul className="absolute hidden group-hover:block bg-white py-2 ml-0.5 w-40">
        <li>
            <label htmlFor="file-input" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">
               Add Resource
            <input type="file" onChange={loadFilesFromInputOnChangeTogether(onAddResource)} accept=".usfm" className="hidden" id="file-input" multiple />
          </label>
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
