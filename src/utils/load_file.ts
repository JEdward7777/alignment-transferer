/**
 * Reads the content of a file as a string using the FileReader API.
 * @param file - The file to be read.
 * @returns A promise that resolves with the file content as a string, or rejects with an error.
 */
function readFile(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const fileContent = reader.result as string;
            resolve(fileContent);
        };
        reader.onerror = () => {
            reject(reader.error);
        };
        reader.readAsText(file);
    });
}

export function loadFilesFromInputOnChangeTogether( callback: (contents: { [key: string]: string } ) => void ): ((event: React.ChangeEvent<HTMLInputElement>) => void) {


    const _handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        (async () => {

            const loaded_contents: { [key: string]: string } = {};

            if (files && files.length > 0) {
                for (let i = 0; i < files.length; ++i) {
                    loaded_contents[files[i].name] = await readFile(files[i])
                }
            }
            
            // Clear the input field
            event.target.value = '';

            callback( loaded_contents );
        })();
    };

    return _handleFileChange;
}


// export function loadFilesFromInputOnChange( callback: (filename: string, contents: string) => void ): ((event: React.ChangeEvent<HTMLInputElement>) => void) {

//     const _handleFileReadFor = (filename: string ): ((event: ProgressEvent<FileReader>) => void) => {
//         const _handleFileRead = (event: ProgressEvent<FileReader>) => {
//             const fileContent = event.target?.result as string; // Retrieve the text content of the file
//             callback(filename,fileContent); // Perform any further processing or store the content as needed
//         };
//         return _handleFileRead;
//     }
//     const _handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//         const files = event.target.files;
//         if (files && files.length > 0) {
//             for( let i = 0; i < files.length; ++i ){
//                 const file = files[i];
//                 const reader = new FileReader();
//                 reader.onload = _handleFileReadFor(file.name);
//                 reader.readAsText(file); // Read the file as text
//             }
//         }
//         // Clear the input field
//         event.target.value = '';
//     };

//     return _handleFileChange;
// }