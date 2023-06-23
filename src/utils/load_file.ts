export function handleFileChange( callback: (filename: String, contents: string) => void ): ((event: React.ChangeEvent<HTMLInputElement>) => void) {

    const _handleFileReadFor = (filename: String ): ((event: ProgressEvent<FileReader>) => void) => {
        const _handleFileRead = (event: ProgressEvent<FileReader>) => {
            const fileContent = event.target?.result as string; // Retrieve the text content of the file
            callback(filename,fileContent); // Perform any further processing or store the content as needed
        };
        return _handleFileRead;
    }
    const _handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            for( let i = 0; i < files.length; ++i ){
                const file = files[i];
                const reader = new FileReader();
                reader.onload = _handleFileReadFor(file.name);
                reader.readAsText(file); // Read the file as text
            }
        }
        // Clear the input field
        event.target.value = '';
    };

    return _handleFileChange;
}