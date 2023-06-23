// App.tsx
import React from 'react';
import FileMenu from './FileMenu';
import AboutMenu from './AboutMenu';
import List from './List';
import Toolbar from './Toolbar';

const App: React.FC = () => {
  //const listItems = ['Item 1', 'Item 2', 'Item 3', 'a', 'b', 'c', 'e', 'j','k', 'Item 3', 'a', 'b', 'c', 'e', 'f', 'g','h','i','j','k', 'a', 'b', 'c', 'e', 'f', 'g','h','i','j','k'];
  //const listItems = ['Item 1', 'Item 2', 'Item 3', 'a', 'b', 'c', 'e', 'j','k', 'Item 3', 'a', 'b', 'c', 'e', 'f', 'g','h','i','j','k', 'Item 3', 'a', 'b', 'c', 'e', 'f', 'g','h','i','j','k', 'a', 'b', 'c', 'e', 'f', 'g','h','i','j','k'];
  const listItems : string[] = []


  const loadUsfmCallback = ( filename: string, fileContent: string ) => {
    console.log( `in app callback filename is ${filename}` );
    console.log( fileContent );
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
