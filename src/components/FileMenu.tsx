// FileMenu.tsx
import React from 'react';
import { loadFilesFromInputOnChangeTogether } from '../utils/load_file';

interface FileMenuProps {
  onAddTargetResource: (contents: { [key: string]: string } ) => void;
  onAddSourceResource: (contents: { [key: string]: string } ) => void;
}

const FileMenu: React.FC<FileMenuProps> = ({ onAddTargetResource, onAddSourceResource }) => {
  const saveSelectedFiles = () => {
    // Generate the content of the file
    const fileContent = "This is the content of the saved file.";
    const fileName = "saved_file.txt";

    // Create a blob from the file content
    const blob = new Blob([fileContent], { type: "text/plain" });

    // Check if the browser supports the `saveAs` function
    if (typeof window.navigator.msSaveBlob !== "undefined") {
      // For IE and Edge browsers
      window.navigator.msSaveBlob(blob, fileName);
    } else {
      // For other browsers
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    }
  };

  const loadFilesFromInputOnChangeTogether = (callback) => (event) => {
    const files = event.target.files;
    callback(files);
  };

  return (
    <li className="relative group z-10">
      <a href="#" className="text-gray-700 hover:text-black">
        File
      </a>
      <ul className="absolute hidden group-hover:block bg-white py-2 ml-0.5 w-40">
        <li>
          <label htmlFor="file-input" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">
            Add Target Resource
            <input type="file" onChange={loadFilesFromInputOnChangeTogether(onAddTargetResource)} accept=".usfm" className="hidden" id="file-input" multiple />
          </label>
        </li>
        <li>
          <label htmlFor="source-file-input" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">
            Add Source To Selected
            <input type="file" onChange={loadFilesFromInputOnChangeTogether(onAddSourceResource)} accept=".usfm" className="hidden" id="source-file-input" multiple />
          </label>
        </li>
        <li>
          <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={saveSelectedFiles}>
            Save Selected
          </a>
        </li>
      </ul>
    </li>
  );
};


export default FileMenu;
