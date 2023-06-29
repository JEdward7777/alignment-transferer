// Toolbar.tsx
import React from 'react';
import PropTypes from 'prop-types'
import { loadFilesFromInputOnChangeTogether } from '../utils/load_file';

interface ToolbarProps {
    onAddResource: (contents: { [key: string]: string } ) => void;
}

const Toolbar: React.FC<ToolbarProps> = ( {onAddResource} ) => {
    return (
        <div className="text-center">
            <input type="file" onChange={loadFilesFromInputOnChangeTogether(onAddResource)} accept=".usfm" className="hidden" id="file-input" multiple />
            <label htmlFor="file-input" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded cursor-pointer">
                Add Resource
            </label>
        </div>
    );
};
  

export default Toolbar;
