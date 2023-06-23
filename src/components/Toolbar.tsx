// Toolbar.tsx
import React from 'react';
import { handleFileChange } from '../utils/load_file';

const Toolbar: React.FC = () => {


    const contents_callback = (fileContent: String) => {
        console.log( "in callbacki" );
        //console.log( fileContent );
    };

    return (
        <div className="text-center">
            <input type="file" onChange={handleFileChange(contents_callback)} accept=".usfm" className="hidden" id="file-input" />
            <label htmlFor="file-input" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded cursor-pointer">
                Add Resource
            </label>
        </div>
    );
};

export default Toolbar;
