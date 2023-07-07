// Toolbar.tsx
import React from 'react';
import PropTypes from 'prop-types'
import ScopeSelector from './ScopeSelector';
import { loadFilesFromInputOnChangeTogether } from '../utils/load_file';

interface ToolbarProps {
    onAddResource: (contents: { [key: string]: string } ) => void;
    onAddSourceResource: (contents: { [key: string]: string } ) => void;
    onScopeChange: (selectedScope: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ( {onAddResource, onAddSourceResource, onScopeChange} ) => {
    return (
        <div className="flex justify-center gap-4">
            <ScopeSelector onScopeChange={onScopeChange} />
            <div>
                <input type="file" onChange={loadFilesFromInputOnChangeTogether(onAddResource)} accept=".usfm" className="hidden" id="file-input" multiple />
                <label htmlFor="file-input" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded cursor-pointer">
                    Add Target Resource
                </label>
            </div>
            <div>
                <input type="file" onChange={loadFilesFromInputOnChangeTogether(onAddSourceResource)} accept=".usfm" className="hidden" id="source-file-input" multiple />
                <label htmlFor="source-file-input" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded cursor-pointer">
                    Add Source To Selected
                </label>
            </div>
        </div>
    );
};
  

export default Toolbar;
