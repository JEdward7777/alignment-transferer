// Toolbar.tsx
import React from 'react';
import { loadFilesFromInputOnChange } from '../utils/load_file';

const Toolbar: React.FC = () => {


    const contents_callback = (filename: String, fileContent: String) => {
        console.log( `in callback filename is ${filename}` );
        console.log( fileContent );
    };

    return (
        <div className="text-center">
            <input type="file" onChange={loadFilesFromInputOnChange(contents_callback)} accept=".usfm" className="hidden" id="file-input" multiple />
            <label htmlFor="file-input" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded cursor-pointer">
                Add Resource
            </label>
        </div>
    );
};

export default Toolbar;
