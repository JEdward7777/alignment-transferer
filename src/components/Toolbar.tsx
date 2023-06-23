// Toolbar.tsx
import React from 'react';
import PropTypes from 'prop-types'
import { loadFilesFromInputOnChange } from '../utils/load_file';

interface ToolbarProps {
    onAddResource: (filename: string, fileContent: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ( {onAddResource} ) => {
    return (
        <div className="text-center">
            <input type="file" onChange={loadFilesFromInputOnChange(onAddResource)} accept=".usfm" className="hidden" id="file-input" multiple />
            <label htmlFor="file-input" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded cursor-pointer">
                Add Resource
            </label>
        </div>
    );
};

// Toolbar.propTypes = {
//     onAddResource: PropTypes.func.isRequired,
//   }
  

export default Toolbar;
