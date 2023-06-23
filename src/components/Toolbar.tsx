// Toolbar.tsx
import React from 'react';

const Toolbar: React.FC = () => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log( "in handleFileChange" )
        const file = event.target.files?.[0]; // Get the first selected file
        if (file) {
            const reader = new FileReader();
            reader.onload = handleFileRead;
            reader.readAsText(file); // Read the file as text
        }
    };

    const handleFileRead = (event: ProgressEvent<FileReader>) => {
        console.log( "In handleFileRead" )
        const fileContent = event.target?.result as string; // Retrieve the text content of the file
        console.log(fileContent); // Perform any further processing or store the content as needed
    };

    return (
        <div className="text-center">
            <input type="file" onChange={handleFileChange} accept=".usfm" className="hidden" id="file-input" />
            <label htmlFor="file-input" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded cursor-pointer">
                Add Resource
            </label>
        </div>
    );
};

export default Toolbar;
