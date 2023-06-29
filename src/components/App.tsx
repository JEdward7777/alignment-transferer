// App.tsx
import React from 'react';
import FileMenu from './FileMenu';
import AboutMenu from './AboutMenu';
import List from './List';
import Toolbar from './Toolbar';

// @ts-ignore
import usfm from 'usfm-js';

const App: React.FC = () => {
  //const listItems = ['Item 1', 'Item 2', 'Item 3', 'a', 'b', 'c', 'e', 'j','k', 'Item 3', 'a', 'b', 'c', 'e', 'f', 'g','h','i','j','k', 'a', 'b', 'c', 'e', 'f', 'g','h','i','j','k'];
  //const listItems = ['Item 1', 'Item 2', 'Item 3', 'a', 'b', 'c', 'e', 'j','k', 'Item 3', 'a', 'b', 'c', 'e', 'f', 'g','h','i','j','k', 'Item 3', 'a', 'b', 'c', 'e', 'f', 'g','h','i','j','k', 'a', 'b', 'c', 'e', 'f', 'g','h','i','j','k'];
  const listItems : string[] = []


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
  
  async function handleUserConfirmation() {
    try {
      const confirmed = await getUserConfirmation('Are you sure?');
      // User confirmed, continue with the operation
      // Access the confirmed value within the local scope
      console.log('User confirmation:', confirmed);
    } catch (error) {
      // User declined, handle accordingly
      console.error('User confirmation error:', error);
    }
  }

  
  const loadUsfmCallback = async ( contents: { [key: string]: string } ) => {
    console.log( `in app callback contents is ${contents}` );

    // const usfm_json = usfm.toJSON(fileContent, { convertToInt: ['occurrence', 'occurrences'] });

    // try {
    //   const confirmed = await getUserConfirmation('Are you sure?');

    //   console.log( usfm_json );
    // } catch (error) {
    //   // User declined, handle accordingly
    //   console.error('User confirmation error:', error);
    // }
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
        <List items={listItems} />
      </main>

      <footer className="py-4 bg-gray-200">
        <Toolbar onAddResource={loadUsfmCallback}/>
      </footer>
    </div>
  );
};

export default App;
