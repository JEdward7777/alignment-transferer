import React from 'react';

const App: React.FC = () => {
  const listItems = ['Item 1', 'Item 2', 'Item 3'];

  return (
    <div>
      <header className="py-4 bg-gray-200">
        <nav className="container mx-auto">
          <ul className="flex space-x-4">
            <li className="relative group">
              <a href="#" className="text-gray-700 hover:text-black">
                File
              </a>
              <ul className="absolute hidden group-hover:block bg-white py-2 mt-1 ml-0.5">
                <li>
                  <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    Open
                  </a>
                </li>
                <li>
                  <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    Save
                  </a>
                </li>
              </ul>
            </li>
            <li>
              <a href="#" className="text-gray-700 hover:text-black">
                About
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <main className="container mx-auto mt-8">
        <div className="h-48 overflow-y-scroll bg-white border border-gray-300 p-4">
          <ul className="list-disc list-inside">
            {listItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </main>

      <footer className="py-4 bg-gray-200">
        <div className="text-center">
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Add Resource
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
