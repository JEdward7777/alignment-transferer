// App.tsx
import React, { useState } from 'react';
import FileMenu from './FileMenu';
import AboutMenu from './AboutMenu';
import List from './List';
import Toolbar from './Toolbar';

// @ts-ignore
import usfm from 'usfm-js';

interface AppState {
  resources: {
    [key: string]: {
      [key: string]: any;
    };
  };
  scope: string;
}


const App: React.FC = () => {
  const [state, setState] = useState<AppState>({ resources: {}, scope: "Book" });

  const {resources, scope} = state;

  const updateResources = (newResources: any) =>{
    setState( { ...state, resources: newResources } );
  }

  const onScopeChange = (newScope: string) =>{
    setState( { ...state, scope: newScope } );
  }

  function getUserConfirmation(message: string) {
    return new Promise((resolve, reject) => {
      const userResponse = window.confirm(message);
      if (userResponse) {
        resolve(true); // User confirmed
      } else {
        reject(new Error('User declined')); // User declined
      }
    });
  }

  /**
 * Prompts the user for text input and resolves with the entered text.
 * If the user cancels or closes the prompt, it rejects with a cancellation message.
 *
 * @param promptMessage - The message displayed to the user as a prompt.
 * @returns A promise that resolves with the user's entered text or rejects with a cancellation message.
 */
  async function promptTextInput(promptMessage: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const userInput = prompt(promptMessage);
      if (userInput === null) {
        reject("User cancelled or closed the prompt.");
      } else {
        resolve(userInput);
      }
    });
  }

  /**
 * Displays a message to the user and resolves when the user clicks "OK".
 *
 * @param message - The message to display to the user.
 * @returns A promise that resolves when the user acknowledges the message.
 */
  async function showMessage(message: string): Promise<void> {
    return new Promise((resolve) => {
      alert(message);
      resolve();
    });
  }
  

  function parseUsfmHeaders( headers_section:  {tag: string, content:string}[] ){
    const parsed_headers: { [key: string]: string } = headers_section.reduce((acc: { [key: string]: string }, entry: {tag: string, content: string}) => {
      if (entry.tag && entry.content) {
        return { ...acc, [entry.tag]: entry.content };
      }
      return acc;
    }, {});
    return parsed_headers;
  }

  
  const loadUsfmCallback = async ( contents: { [key: string]: string } ) => {
    try{
      console.log( `in app callback contents is ${contents}` );

      //load the usfm.
      const usfm_jsons = Object.fromEntries( Object.entries(contents).map(([key,value]) => [key, usfm.toJSON(value,  { convertToInt: ['occurrence', 'occurrences'] })]));

      const group_name = await promptTextInput( "What group name should the resources be loaded into?" );

      let need_confirmation = false;
      let confirmation_message = "";

      //now make sure that for each of the chapters being loaded that that chapter hasn't already been loaded.

      if (group_name in resources) {
        //the specific group exists already.
        const existing_matching_resource = resources[group_name];
        Object.values(usfm_jsons).forEach((value) => {
          const parsed_headers = parseUsfmHeaders(value.headers);
          //now see if the specific book already exists in this group
          if (parsed_headers.h in existing_matching_resource) {
            need_confirmation = true;
            confirmation_message += `Do you want to reload ${parsed_headers.h} in ${group_name}?`
          }
        });
      }

      //now do the confirmation if needed.
      //this will throw an exception if it doesn't pass confirmation.
      if( need_confirmation ) await getUserConfirmation(confirmation_message  );

      //poke all the newly loaded items in.
      const new_resources = {...resources};
      if( !(group_name in new_resources) ) new_resources[group_name] = {};
      Object.values( usfm_jsons ).forEach((value) => {
        const parsed_headers = parseUsfmHeaders( value.headers );
        new_resources[group_name][parsed_headers.h] = value;
      })
      updateResources( new_resources );

      await showMessage( "resources loaded" )

    } catch( error ){
      //user declined
      console.log( `error importing ${error}` );
      await showMessage( `Error ${error}`)
    }
  };

  return (
    <div className="h-screen flex flex-col py-4">
      <header className="py-4 bg-gray-200">
        <nav className="container mx-auto">
          <ul className="flex space-x-4">
            <FileMenu onAddResource={loadUsfmCallback} />
            <AboutMenu />
          </ul>
        </nav>
      </header>

      <main className="overflow-y-scroll container flex-grow mx-auto mt-8 py-4 bg-white">
        <List resources={resources} scope={scope}/>
      </main>

      <footer className="py-4 bg-gray-200">
        <Toolbar onAddResource={loadUsfmCallback} onScopeChange={onScopeChange}/>
      </footer>
    </div>
  );
};

export default App;
