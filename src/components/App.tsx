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
  currentSelection: string[][];
  sourceResources: {
    [key: string]: any;
  };
}


const App: React.FC = () => {
  const [state, setState] = useState<AppState>({ resources: {}, scope: "Book", currentSelection:[], sourceResources:{} });

  const {resources, scope, currentSelection, sourceResources } = state;

  const updateResources = (newResources: any) =>{
    setState( { ...state, resources: newResources } );
  }

  const onScopeChange = (newScope: string) =>{
    setState( { ...state, scope: newScope } );
  }

  const setCurrentSelection = (newCurrentSelection: string[][] ) =>{
    setState( { ...state, currentSelection: newCurrentSelection } );
  }

  const setSourceResources = (newSourceResources: {[key: string]: any} ) => {
    setState( {...state, sourceResources: newSourceResources });
  }

  const stringResourceKey = (resourceKey: string[]): string => {
    const sanitizedKey = resourceKey.map((entry) => entry.replace(/->/g, '->>'));
    return sanitizedKey.join('->');
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

  /**
   * Checks to see if a specific string array references a given resource.
   * The locations in the string are [group][book name][chapter num][verse num]
   * The array only needs to be as long as the granularity.
   * @param resourceKey A string array identifying resource at some granularity
   * @returns true if the referenced resource is selected.
   */
  const isResourceSelected = ( resourceKey: string[] ):boolean => {
    //iterate through the selected resources and return true on the first match.
    //If the selected resource array is shorter but what is there matches then it is still
    //a match.
    selectionLoop: for( const selected of currentSelection ){
      //if the resourceKey is shorter then the selected then it doesn't count
      //a chapter isn't selected if a verse is selected from it even if it is all the verses selected from it.
      if( selected.length > resourceKey.length ) continue selectionLoop;

      for( let i = 0; i < resourceKey.length; ++i ){
        //if we have matched this far and the iteration is longer then the selection
        //key then it is a valid selection.  Return true.
        if( i >= selected.length ) return true;

        //if we found a key that is different, then just continue with the next
        //selection option and see if it matches.
        if( selected[i] != resourceKey[i] ) continue selectionLoop;
      }
      //if we finish the loop, then it is all selected.
      return true;
    }
    return false;
  }

  const loadSourceUsfmCallback = async ( contents: { [key: string]: string } ) => {
    try{
      //load the usfm.
      const usfm_jsons = Object.fromEntries( Object.entries(contents).map(([key,value]) => [key, usfm.toJSON(value, { convertToInt: ['occurrence','occurrences'] })]));

      //it would be good to come back to this and add confirmation
      //if the pairing is changing an existing pairing.


      const newSourceResources: {[key: string]: any} = {};

      let droppedVerseCount = 0;

      //loop down to the verse granularity and see if each verse has a place to be put.
      Object.values( usfm_jsons ).forEach( (book) => {
        const parsed_source_headers = parseUsfmHeaders( book.headers );

        Object.entries(book.chapters).map(([source_chapter_num, source_chapter]) => {
          Object.entries(source_chapter as any).map(([source_verse_num, source_verse]) => {

            let verseUsed = false;
            //ok, at this point we are at the verse level in the source language i.e. greek,
            //and now we need to identify which verses there are in the different groups which match.

            Object.entries(resources).map(([target_group_name, target_group]) => {
              Object.entries(target_group).map(([target_book_name, target_book]) => {
                const parsed_target_headers = parseUsfmHeaders(target_book.headers);

                if (parsed_source_headers.toc3 == parsed_target_headers.toc3) {
                  Object.entries(target_book.chapters).map(([target_chapter_num, target_chapter]) => {
                    if (source_chapter_num == target_chapter_num) {
                      Object.entries(target_chapter as any).map(([target_verse_num, target_verse]) => {
                        if (source_verse_num == target_verse_num) {
                          //now check if this verse is selected.
                          if (isResourceSelected([target_group_name, target_book_name, target_chapter_num, target_verse_num])) {

                            //we have a match.  Go ahead and add the information.
                            const resourceString = stringResourceKey([target_group_name, target_book_name, target_chapter_num, target_verse_num]);
                            newSourceResources[resourceString] = source_verse;

                            verseUsed = true;
                          }
                        }
                      });
                    }
                  });
                }
              });
            });

            if( !verseUsed ) droppedVerseCount++;
          });
        });
      })

      if( Object.keys(newSourceResources).length > 0 ){
        setSourceResources( {...sourceResources, ...newSourceResources} );
      }


      await showMessage( `Attached ${Object.keys(newSourceResources).length} verses\nDropped ${droppedVerseCount} verses.`);

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
            <FileMenu onAddResource={loadUsfmCallback} onAddSourceResource={loadSourceUsfmCallback} />
            <AboutMenu />
          </ul>
        </nav>
      </header>

      <List resources={resources} scope={scope} setCurrentSelection={setCurrentSelection}/>

      <footer className="py-4 bg-gray-200">
        <Toolbar onAddResource={loadUsfmCallback} 
                 onAddSourceResource={loadSourceUsfmCallback}
                 onScopeChange={onScopeChange}
                />
      </footer>
    </div>
  );
};

export default App;
