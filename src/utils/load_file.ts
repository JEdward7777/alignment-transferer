export function handleFileChange( callback: (arg: string) => void ): (event: React.ChangeEvent<HTMLInputElement>) => void {

    const _handleFileRead = (event: ProgressEvent<FileReader>) => {
        const fileContent = event.target?.result as string; // Retrieve the text content of the file
        callback(fileContent); // Perform any further processing or store the content as needed
    };
    const _handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]; // Get the first selected file
        if (file) {
            const reader = new FileReader();
            reader.onload = _handleFileRead;
            reader.readAsText(file); // Read the file as text
        }
        // Clear the input field
        event.target.value = '';
    };

    return _handleFileChange;
}