/**
 * Reads the content of a file as a string using the FileReader API.
 * @param file - The file to be read.
 * @returns A promise that resolves with the file content as a string, or rejects with an error.
 */
function readTextFile(file: Blob): Promise<string> {
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

function readBinaryFile(file: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            resolve(arrayBuffer);
        };
        reader.onerror = () => {
            reject(reader.error);
        };
        reader.readAsArrayBuffer(file);
    });
}

export function loadTextFilesFromInputOnChangeTogether(callback: (contents: { [key: string]: string }) => void): ((event: React.ChangeEvent<HTMLInputElement>) => void) {


    const _handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        (async () => {

            const loaded_contents: { [key: string]: string } = {};

            if (files && files.length > 0) {
                for (let i = 0; i < files.length; ++i) {
                    loaded_contents[files[i].name] = await readTextFile(files[i])
                }
            }

            // Clear the input field
            event.target.value = '';

            callback(loaded_contents);
        })();
    };

    return _handleFileChange;
}

export function loadBinaryFileFromInputOnChange(callback: (contents: ArrayBuffer | null) => void): ((event: React.ChangeEvent<HTMLInputElement>) => void) {
    const _handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        (async () => {
            let loaded_content: ArrayBuffer | null = null;

            if (files && files.length > 0) {
                loaded_content = await readBinaryFile(files[0]);
            }

            // Clear the input field
            event.target.value = '';

            callback(loaded_content);
        })();
    };

    return _handleFileChange;
}


/**
 * Deep clones an object.
 *
 * @param {T} obj - The object to be cloned.
 * @return {T} - The cloned object.
 */
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}
