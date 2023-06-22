// App.tsx
import React from 'react';
import FileMenu from './FileMenu';
import AboutMenu from './AboutMenu';
import List from './List';
import Toolbar from './Toolbar';

const App: React.FC = () => {
  const listItems = ['Item 1', 'Item 2', 'Item 3'];

  return (
    <div>
      <header className="py-4 bg-gray-200">
        <nav className="container mx-auto">
          <ul className="flex space-x-4">
            <FileMenu />
            <AboutMenu />
          </ul>
        </nav>
      </header>

      <main className="container mx-auto mt-8">
        <List items={listItems} />
      </main>

      <footer className="py-4 bg-gray-200">
        <Toolbar />
      </footer>
    </div>
  );
};

export default App;
