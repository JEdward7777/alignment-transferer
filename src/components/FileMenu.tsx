// FileMenu.tsx
import React from 'react';
import { loadTextFilesFromInputOnChangeTogether, loadBinaryFileFromInputOnChange } from '../utils/load_file';

interface FileMenuProps {
  onAddTargetResource: (contents: { [key: string]: string } ) => void;
  onAddSourceResource: (contents: { [key: string]: string } ) => void;
  onSaveSelectedFiles: () => void;
  onSaveProject: () => void;
  loadProjectCallback: (contents: ArrayBuffer | null ) => void;
  onRemoveSelectedResources: () => void;
  onRenameSelectedGroups: () => void;
}

const FileMenu: React.FC<FileMenuProps> = ({ onAddTargetResource, onAddSourceResource, onSaveSelectedFiles, onSaveProject, loadProjectCallback, onRemoveSelectedResources, onRenameSelectedGroups }) => {


  return (
    <li className="relative group z-10">
      <a href="#" className="text-gray-700 hover:text-black">
        File
      </a>
      <ul className="absolute hidden group-hover:block bg-white py-2 ml-0.5 w-40">
        <li>
          <label htmlFor="file-input" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">
            Add Target Resource
            <input type="file" onChange={loadTextFilesFromInputOnChangeTogether(onAddTargetResource)} accept=".usfm" className="hidden" id="file-input" multiple />
          </label>
        </li>
        <li>
          <label htmlFor="source-file-input" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">
            Add Source To Selected
            <input type="file" onChange={loadTextFilesFromInputOnChangeTogether(onAddSourceResource)} accept=".usfm" className="hidden" id="source-file-input" multiple />
          </label>
        </li>
        <li>
          <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={onSaveSelectedFiles}>
            Save Selected
          </a>
        </li>
        <li>
          <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={onRemoveSelectedResources}>
            Remove Selected
          </a>
        </li>
        <li>
          <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={onRenameSelectedGroups}>
            Rename Selected Groups
          </a>
        </li>
        <li>
          <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={onSaveProject}>
            Save Project
          </a>
        </li>
        <li>
          <label htmlFor="project-file-input" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">
            Load Project
            <input type="file" onChange={loadBinaryFileFromInputOnChange(loadProjectCallback)} accept=".at" className="hidden" id="project-file-input" />
          </label>
        </li>
      </ul>
    </li>
  );
};


export default FileMenu;
