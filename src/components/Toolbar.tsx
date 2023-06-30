// Toolbar.tsx
import React from 'react';
import PropTypes from 'prop-types'
import ScopeSelector from './ScopeSelector';
import { loadFilesFromInputOnChangeTogether } from '../utils/load_file';

interface ToolbarProps {
    onAddResource: (contents: { [key: string]: string } ) => void;
}

const Toolbar: React.FC<ToolbarProps> = ( {onAddResource} ) => {
    return (
        <div className="flex justify-center gap-4">
            <ScopeSelector onScopeChange={ (newScope: string) => {} }/>
            <div>
                <input type="file" onChange={loadFilesFromInputOnChangeTogether(onAddResource)} accept=".usfm" className="hidden" id="file-input" multiple />
                <label htmlFor="file-input" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded cursor-pointer">
                    Add Resource
                </label>
            </div>
        </div>
    );
};
  

export default Toolbar;
