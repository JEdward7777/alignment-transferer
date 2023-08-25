// Toolbar.tsx
import React from 'react';
import PropTypes from 'prop-types'
import ScopeSelector from './ScopeSelector';
import { loadFilesFromInputOnChangeTogether } from '../utils/load_file';
import IndexedDBStorage from '@/shared/IndexedDBStorage';

interface ToolbarProps {
    onAddResource: (contents: { [key: string]: string } ) => void;
    onAddSourceResource: (contents: { [key: string]: string } ) => void;
    onScopeChange: (selectedScope: string) => void;
    isTrainingEnabled: boolean;
    onToggleTraining: (event: React.ChangeEvent<HTMLInputElement>) => void;
    trainingStatusOutput: string;
}


async function testDbStorage() {
    console.log("testDbStorage");
      // Example usage
    const dbStorage = new IndexedDBStorage('myDatabase', 'dataStore');
    await dbStorage.initialize();
    
    try {
        await dbStorage.setItem('name', 'John Doe');
        const name = await dbStorage.getItem('name');
        console.log(name); // Output: John Doe
    } catch (error) {
        console.error(error);
    }
}

const Toolbar: React.FC<ToolbarProps> = ( {onAddResource, onAddSourceResource, onScopeChange, isTrainingEnabled, onToggleTraining, trainingStatusOutput} ) => {
    return (
        <div className="flex items-center justify-center gap-4">
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
            <div className="flex items-center justify-center gap-2">
                <label htmlFor="trainingCheckbox" className="text-black bg-transparent py-2 rounded cursor-text">
                    Live Training
                </label>
                <input type="checkbox" id="trainingCheckbox"checked={isTrainingEnabled} onChange={onToggleTraining} />
            </div>
            <label className="w-40 bg-white border border-black text-black py-2 px-4 rounded cursor-text">
                {trainingStatusOutput}
            </label>
            {/* Create a test button to call testDbStorage */}
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded cursor-pointer" onClick={testDbStorage}>
                Test Db Storage
            </button>
        </div>
    );
};
  

export default Toolbar;
