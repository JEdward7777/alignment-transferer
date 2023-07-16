// App.tsx
import React, { useEffect, useMemo, useState } from 'react';
import FileMenu from './FileMenu';
import AboutMenu from './AboutMenu';
import List from './List';
import Toolbar from './Toolbar';
import GroupCollection from '../shared/GroupCollection'
import {parseUsfmHeaders} from "../utils/usfm_misc";
import useWindowDimensions from '../hooks/useWindowDimensions'

// @ts-ignore
import usfm from 'usfm-js';
import Verse from '@/shared/Verse';
import { TAlignerStatus, TState, WordAlignerDialog } from './WordAlignerDialog';



interface AppState {
  groupCollection: GroupCollection;
  scope: string;
  currentSelection: string[][];
  doubleClickedVerse: string[] | null;
  alignerStatus: TAlignerStatus | null; 
}

function translate( key: string ): string{

  console.log( `missed translate key: ${key}` );
  return ":-)";

}


const App: React.FC = () => {
  const [state, setState] = useState<AppState>({ groupCollection: new GroupCollection(), scope: "Book", currentSelection:[], doubleClickedVerse:null, alignerStatus:null });

  const {groupCollection, scope, currentSelection, doubleClickedVerse, alignerStatus } = state;

  const setGroupCollection = (newGroupCollection: GroupCollection ) => {
    setState( { ...state, groupCollection: newGroupCollection } );
  }

  const onScopeChange = (newScope: string) =>{
    setState( { ...state, scope: newScope } );
  }

  const setCurrentSelection = (newCurrentSelection: string[][] ) => {
    setState( { ...state, currentSelection: newCurrentSelection } );
  }

  const setDoubleClickedVerse = (newDoubleClickedVerse: string[] | null ) => {
    setState( {...state, doubleClickedVerse: newDoubleClickedVerse } );
  }

  const setAlignerStatus = (newAlignerStatus: TAlignerStatus ) => {
    setState( {...state, alignerStatus: newAlignerStatus } );
  }

  // const stringResourceKey = (resourceKey: string[]): string => {
  //   const sanitizedKey = resourceKey.map((entry) => entry.replace(/->/g, '->>'));
  //   return sanitizedKey.join('->');
  // }

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
  


  
  const loadUsfmTargetCallback = async ( contents: { [key: string]: string } ) => {
    try{
      //load the usfm.
      const usfm_json = Object.fromEntries( Object.entries(contents).map(([key,value]) => [key, usfm.toJSON(value,  { convertToInt: ['occurrence', 'occurrences'] })]));

      const group_name = await promptTextInput( "What group name should the resources be loaded into?" );

      let need_confirmation = false;
      let confirmation_message = "";

      //now make sure that for each of the chapters being loaded that that chapter hasn't already been loaded.
      Object.values(usfm_json).forEach((usfm_book) => {
        if( groupCollection.hasBookInGroup( {group_name, usfm_book}) ){
          const parsed_headers = parseUsfmHeaders(usfm_book.headers);
          need_confirmation = true;
          confirmation_message += `Do you want to reload ${parsed_headers.h} in ${group_name}?`
        }
      })

      //now do the confirmation if needed.
      //this will throw an exception if it doesn't pass confirmation.
      if( need_confirmation ) await getUserConfirmation(confirmation_message  );

      //poke all the newly loaded items in.
      const newGroupCollection = groupCollection.addTargetUsfm({group_name, usfm_json })
      setGroupCollection( newGroupCollection );

      await showMessage( "target usfm loaded" )

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
      const usfm_json = Object.fromEntries( Object.entries(contents).map(([key,value]) => [key, usfm.toJSON(value, { convertToInt: ['occurrence','occurrences'] })]));

      //it would be good to come back to this and add confirmation
      //if the pairing is changing an existing pairing.

      const {newGroupCollection, addedVerseCount, droppedVerseCount } = groupCollection.addSourceUsfm( {usfm_json, isResourceSelected} );
      setGroupCollection( newGroupCollection );


      //await showMessage( `Attached ${addedVerseCount} verses\nDropped ${droppedVerseCount} verses.`);
      await showMessage( `${addedVerseCount} connections added.`);

    } catch( error ){
      //user declined
      console.log( `error importing ${error}` );
      await showMessage( `Error ${error}`)
    }
  };


  //This use effect responds when a double click in the list happens when it is on a verse to pop open the aliner dialog.
  useEffect(() =>{
    console.log( `Behold the double clicked verse is ${doubleClickedVerse}` );

    if( doubleClickedVerse != null ){
      //const verse: Verse | null = groupCollection.getVerseBySelector(doubleClickedVerse);

      const state: TState | null = groupCollection.getVerseAlignmentStateBySelector(doubleClickedVerse);

      if( state != null ){
        setAlignerStatus( {
          state,
          actions:{
            onAlignmentsChange: (results) => true, //TODO
            cancelAlignment: () => {}, //TODO
            saveAlignment: (results) => {}, //TODO 
          },
        } );


      }else{
        showMessage( "Change scope to verse for double click to show alignment dialog" );
      }
    }

  },[doubleClickedVerse]);



  const wordAlignmentScreenRatio = 0.7
  const wordAlignmentMaxHeightPx = 1000
  const { height } = useWindowDimensions()
  const wordAlignerHeight = useMemo(() => {
    let _height = 20;
    if( height != null ){
      _height = wordAlignmentScreenRatio * height;
    }
    if (_height > wordAlignmentMaxHeightPx) _height = wordAlignmentMaxHeightPx
    return _height
  }, [height])

  return (
    <div className="h-screen flex flex-col py-4">
      <header className="py-4 bg-gray-200">
        <nav className="container mx-auto">
          <ul className="flex space-x-4">
            <FileMenu onAddTargetResource={loadUsfmTargetCallback} onAddSourceResource={loadSourceUsfmCallback} />
            <AboutMenu />
          </ul>
        </nav>
      </header>

      <List groupCollection={groupCollection} scope={scope} setCurrentSelection={setCurrentSelection} onEntryDoubleClick={setDoubleClickedVerse}/>

      <WordAlignerDialog
        alignerStatus={alignerStatus}
        height={wordAlignerHeight}
        translate={translate}
        />

      <footer className="py-4 bg-gray-200">
        <Toolbar onAddResource={loadUsfmTargetCallback} 
                 onAddSourceResource={loadSourceUsfmCallback}
                 onScopeChange={onScopeChange}
                />
      </footer>
    </div>
  );
};

export default App;
