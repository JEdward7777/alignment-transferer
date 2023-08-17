// App.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import FileMenu from './FileMenu';
import AboutMenu from './AboutMenu';
import List from './List';
import Toolbar from './Toolbar';
import GroupCollection from '../shared/GroupCollection'
import {parseUsfmHeaders} from "../utils/usfm_misc";
import useWindowDimensions from '../hooks/useWindowDimensions'
import JSZip from "jszip";

// @ts-ignore
import usfm from 'usfm-js';
import { TAlignerStatus, TState, TWordAlignerAlignmentResult, WordAlignerDialog } from './WordAlignerDialog';
import { TUsfmBook } from 'word-aligner-rcl';
import { isProvidedResourceSelected, isProvidedResourcePartiallySelected } from '@/utils/misc';
import WordMapBoosterWrapper from '@/shared/WordMapBoosterWrapper';
import { AbstractWordMapWrapper } from 'wordmapbooster/dist/boostwordmap_tools';


interface AppState {
  groupCollection: GroupCollection; //This contains all the verse data loaded in a hierarchical structure of Groups->Books->Chapter->Verses
  scope: string;  //This is Book, Group, Chapter or Verse.  It changes how the list is shown.
  currentSelection: string[][]; //This contains a collection of the references to all the things selected in the list.
  doubleClickedVerse: string[] | null; //This gets set when a verse is double clicked.
  alignerStatus: TAlignerStatus | null; //This gets set to pop up the word aligner dialog.
}

interface TrainingState{
  isTrainingEnabled: boolean; //This is true when the training checkbox is checked
  trainingStatusOutput: string; //Setting this shows up on the toolbar and lets the training have a place to give live output status.
  lastTrainedInstanceCount: number; //This lets us know if something has changed since last training by comparing it to groupCollection.instanceCount
  currentTrainingInstanceCount: number; //This keeps track of what is currently training so that when it finishes lastTrainedInstanceCount can be set.
}

const translateDict : {[key:string]:string}= {
  "suggestions.refresh_suggestions": "Refresh suggestions.",
  "suggestions.refresh": "Refresh Suggestions",
  "suggestions.accept_suggestions": "Accept all suggestions.",
  "suggestions.accept": "Accept Suggestions",
  "suggestions.reject_suggestions": "Reject all suggestions.",
  "suggestions.reject": "Reject Suggestions",
}

function translate( key: string ): string{
  if( key in translateDict ) return translateDict[key];

  console.log( `missed translate key: ${key}` );
  return ":-)";
}


const App: React.FC = () => {
  const [state, _setState] = useState<AppState>({
    groupCollection: new GroupCollection({}, 0),
    scope: "Book",
    currentSelection: [],
    doubleClickedVerse: null,
    alignerStatus: null,
  });
  //also hold the state in a ref so that callbacks can get the up-to-date information.
  //https://stackoverflow.com/a/60643670
  const stateRef = useRef<AppState>(state);
  function setState( newState: AppState ) {
    stateRef.current = newState;
    _setState( newState );
  }

  const [trainingState, _setTrainingState] = useState<TrainingState>({
    isTrainingEnabled: false,
    trainingStatusOutput: "",
    lastTrainedInstanceCount: -1,
    currentTrainingInstanceCount: -1,
  })
  const trainingStateRef = useRef<TrainingState>(trainingState);
  function setTrainingState( newState: TrainingState ) {
    trainingStateRef.current = newState;
    _setTrainingState( newState );
  }


  const alignmentWorkerRef = useRef<Worker | null>(null);

  const {groupCollection, scope, currentSelection, doubleClickedVerse, alignerStatus } = state;

  const alignmentPredictor = useRef< AbstractWordMapWrapper | null >( null );




  const setGroupCollection = (newGroupCollection: GroupCollection ) => {
    setState( { ...stateRef.current, groupCollection: newGroupCollection } );
  }

  const onScopeChange = (newScope: string) =>{
    setState( { ...stateRef.current, scope: newScope } );
  }

  const setCurrentSelection = (newCurrentSelection: string[][] ) => {
    setState( { ...stateRef.current, currentSelection: newCurrentSelection } );
  }

  const setDoubleClickedVerse = (newDoubleClickedVerse: string[] | null ) => {
    setState( {...stateRef.current, doubleClickedVerse: newDoubleClickedVerse } );
  }

  const setAlignerStatus = (newAlignerStatus: TAlignerStatus | null ) => {
    setState( {...stateRef.current, alignerStatus: newAlignerStatus } );
  }
  const setIsTrainingEnabled = (newIsTrainingEnabled: boolean) => {
    setTrainingState( {...trainingStateRef.current, isTrainingEnabled: newIsTrainingEnabled } );
  }

  function startTraining(){

    //Use the Refs such as trainingStateRef instead of trainingState
    //because in the callback the objects are stale because they were
    //captured from a previous invocation of the function and don't
    //have later versions of the function in which things have been updated.
    //startTraining itself gets called from within the callback so itself is
    //a callback needs to use the Refs.
    //https://stackoverflow.com/a/60643670

    //make sure that lastUsedInstanceCount isn't still the same as groupCollection.instanceCount
    if( trainingStateRef.current.lastTrainedInstanceCount !== stateRef.current.groupCollection.instanceCount ){
      if( alignmentWorkerRef.current === null ){

        //before creating the worker, check to see if there is any data to train on.
        //get the information for the alignment to training.
        const alignmentTrainingData = stateRef.current.groupCollection.getAlignmentTrainingData();

        //check if there are enough entries in the alignment training data dictionary
        if( Object.values(alignmentTrainingData).length > 4 ){

          console.log(`start training for ${stateRef.current.groupCollection.instanceCount}`);
          setTrainingState( {...trainingStateRef.current, currentTrainingInstanceCount: stateRef.current.groupCollection.instanceCount } );

          //create a new worker.
          alignmentWorkerRef.current = new Worker( new URL("../workers/AlignmentTrainer.ts", import.meta.url ) );

          //Define the callback which will after the alignment trainer has finished
          alignmentWorkerRef.current.addEventListener('message', (event) => {
            console.log( `alignment worker message: ${event.data}` );
            alignmentWorkerRef.current?.terminate();
            alignmentWorkerRef.current = null;


            //Load the trained model and put it somewhere it can be used.
            if( "trainedModel" in event.data ){
              alignmentPredictor.current = AbstractWordMapWrapper.load( event.data.trainedModel );
            }
            if( "error" in event.data ){
              console.log( "Error running alignment worker: " + event.data.error );
            }

            setTrainingState( {...trainingStateRef.current, lastTrainedInstanceCount: trainingStateRef.current.currentTrainingInstanceCount } );
            //start the training again.  It won't run again if the instanceCount hasn't changed
            startTraining();
          })


          alignmentWorkerRef.current.postMessage({alignmentTrainingData});

        }else{
          console.log( "Not enough training data" );
        }
          
      }else{
        console.log("Alignment already running" );
      }
    }else{
      console.log( "information not changed" );
    }
  }
  function stopTraining(){
    if( alignmentWorkerRef.current !== null ){
      alignmentWorkerRef.current.terminate();
      alignmentWorkerRef.current = null;
      console.log( "Alignment stopped" );
    }
  }

  //When the isTraining gets set call the startTraining function
  useEffect( () => {
    if( trainingStateRef.current.isTrainingEnabled ) {
      startTraining();
    }else{
      stopTraining();
    }
  }, [trainingState.isTrainingEnabled,groupCollection.instanceCount] );

  //Update the toolbar with the status of the training
  useEffect( () => {
    const newTrainingStatusOutput = 
       (alignmentWorkerRef.current === null )? 
         ((alignmentPredictor.current === null)? "Not trained" : "Trained"):
         ((alignmentPredictor.current === null)? "Training..." : "Updating...");

    //now make sure it is changed before setting it to prevent a loop.
    if( newTrainingStatusOutput != trainingStateRef.current.trainingStatusOutput ){
      setTrainingState( {...trainingStateRef.current, trainingStatusOutput: newTrainingStatusOutput } );
    }
  }, [trainingState] );

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
      const usfm_json : { [key: string]: TUsfmBook } = Object.fromEntries( Object.entries(contents).map(([key,value]) => [key, usfm.toJSON(value,  { convertToInt: ['occurrence', 'occurrences'] })]));

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
    return isProvidedResourceSelected( currentSelection, resourceKey );
  }

  /**
   * Checks to see if a specific string array intercepts a given resource.
   * The locations in the string are [group][book name][chapter num][verse num]
   * The array only needs to be as long as the granularity.
   * @param resourceKey A string array identifying resource at some granularity
   * @returns true if the referenced resource is selected.
   */
  const isResourcePartiallySelected = ( resourceKey: string[] ):boolean => {
    return isProvidedResourcePartiallySelected( currentSelection, resourceKey );
  }

  const loadSourceUsfmCallback = async ( contents: { [key: string]: string } ) => {
    try{
      //ask the user to make a selection if no resources are selected.
      if( currentSelection.length == 0 ) {
        throw new Error("No resources selected to add to.");
      }

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


  /**
   * This function is for closing the alignment dialog when cancel is clicked.
   */
  const onCancelAlignment = () => {
    setState({
      ...stateRef.current,
      alignerStatus: null,
      doubleClickedVerse: null,
    });
  }

  /**
   * This function gets called from the alignment dialog when save gets called.
   * @param result 
   */
  const onSaveAlignment = ( result: null | TWordAlignerAlignmentResult ) => {
    let newGroupCollection = groupCollection;
    try{
      if( result != null && doubleClickedVerse != null ){
        newGroupCollection = groupCollection.updateAlignmentState( result, doubleClickedVerse );
      }
    } catch( error ){
      //user declined
      console.log( `error importing ${error}` );
      showMessage( `Error ${error}`)
    }
    //some reason can't call both, so combine them.
    //Setting aligner status to null closes the dialog.
    setState( {...stateRef.current, 
      alignerStatus: null, //null the aligner state for the dialog being closed.
      groupCollection: newGroupCollection, //replace the group collection so the change has been updated.
      doubleClickedVerse: null, //null the double clicked verse selection so we can double click the same verse again.
     } );
  }

  /**
   * This function implements the onAlignmentsChange callback for the alignment dialog.
   * @param results The results from the alignment dialog
   * @returns true - if the alignment is completed
   */
  const onAlignmentsChange = ( results: TWordAlignerAlignmentResult ): boolean => {
    let result = false;
    //To be able to test if the alignment is complete, we do a temporary update and then
    //check the results what their state is.
    if( doubleClickedVerse != null ){
      const tempGroupCollection = groupCollection.updateAlignmentState( results, doubleClickedVerse );
      const state: TState | null = tempGroupCollection.getVerseAlignmentStateBySelector(doubleClickedVerse);
      if( state?.aligned ) result = true;
    }
    return result;
  }

  //This use effect responds when a double click in the list happens when it is on a verse to pop open the aliner dialog.
  useEffect(() =>{
    if( doubleClickedVerse != null ){
      //const verse: Verse | null = groupCollection.getVerseBySelector(doubleClickedVerse);

      try {
        const state: TState | null = groupCollection.getVerseAlignmentStateBySelector(doubleClickedVerse);

        if (state != null) {
          setAlignerStatus({
            state,
            actions: {
              onAlignmentsChange: onAlignmentsChange,
              cancelAlignment: onCancelAlignment,
              saveAlignment: onSaveAlignment,
            },
          });


        } else {
          showMessage("Change scope to verse for double click to show alignment dialog");
        }
      } catch (error) {
        //user declined
        console.log(`error importing ${error}`);
        showMessage(`Error ${error}`)
      }
    }

  },[doubleClickedVerse]);

  const onSaveSelectedFiles = async () => {
    //ask the user to make a selection if no resources are selected.
    if( currentSelection.length == 0 ) {
      await showMessage( "No resources selected" );
      return;
    }


    console.log("Saving selected files");

    //Make the zip filename be the current date
    const fileName = `${new Date().toISOString()}.zip`;
    const zip = new JSZip();

    //now pass the structure to groupCollection so that it can populate it with the selected
    //resources.
    groupCollection.saveSelectedResourcesToUsfmZip(
      zip, isResourcePartiallySelected
    )

    const zipFile = await zip.generateAsync({ type: "blob" });

    // Check if the browser supports the `saveAs` function
    if (typeof (window.navigator as any).msSaveBlob !== "undefined") {
      // For IE and Edge browsers
      (window.navigator as any).msSaveBlob(zipFile, fileName);
    } else {
      // For other browsers
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipFile);
      link.download = fileName;
      link.click();
    }
  
  };

  /**
   * Removes the selected resources from the group collection and updates the state.
   *
   * @returns {void}
   */
  const onRemoveSelectedResources = async () => {
    //ask the user to make a selection if no resources are selected.
    if( currentSelection.length == 0 ) {
      await showMessage( "No resources selected" );
      return;
    }


    const newGroupCollection: GroupCollection = groupCollection.removeSelectedResources( {isResourcePartiallySelected, isResourceSelected} );

    setState( {...stateRef.current, 
      groupCollection: newGroupCollection, //replace the group collection so the change has been updated.
      currentSelection: [], //clear the current selection because all those items should be gone.
     } );
  }

  /**
   * This function will rename all the selected groups.
   */
  const  onRenameSelectedGroups = async () => {
    try{
      //ask the user what the new group name should be.
      const newGroupName = await promptTextInput( "What do you want to call the new group?" );

      const newGroupCollection = groupCollection.renameSelectedGroups( {newGroupName, isResourcePartiallySelected, isResourceSelected } );

      setGroupCollection( newGroupCollection );
    } catch( error ){
      //user declined
    }
  }

  /**
   * This function is called when the training checkbox is clicked.
   */
  const onToggleTraining = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsTrainingEnabled(event.target.checked);
  }


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


  // const hackedPredict = (sourceSentence: string | Token[], targetSentence: string | Token[], maxSuggestions?: number, manuallyAligned: Alignment[] = []): Suggestion[] => {
  //   //{alignmentPredictor.current?.predict.bind(alignmentPredictor.current)||null}
  //   const suggestions = alignmentPredictor.current?.predict(sourceSentence, targetSentence, maxSuggestions, manuallyAligned);

  //   // const sourceToken = new Token( {text:"Παῦλος"} );
  //   // const targetToken = new Token( {text:"apóstol"} );
  //   // const sourceNgram = new Ngram( [sourceToken] );
  //   // const targetNgram = new Ngram( [targetToken] );
  //   // const alignment = new Alignment( sourceNgram, targetNgram );
  //   // const prediction = new Prediction( alignment );
  //   // const suggestion = new Suggestion();
  //   // suggestion.addPrediction(prediction);

  //   // const suggestions = [suggestion];

  //   return suggestions
  // };

  return (
    <div className="h-screen flex flex-col py-4">
      <header className="py-4 bg-gray-200">
        <nav className="container mx-auto">
          <ul className="flex space-x-4">
            <FileMenu onAddTargetResource={loadUsfmTargetCallback} 
            onAddSourceResource={loadSourceUsfmCallback} 
            onSaveSelectedFiles={onSaveSelectedFiles} 
            onRemoveSelectedResources={onRemoveSelectedResources}
            onRenameSelectedGroups={onRenameSelectedGroups} 
            />
            <AboutMenu />
          </ul>
        </nav>
      </header>

      <List groupCollection={groupCollection} scope={scope} setCurrentSelection={setCurrentSelection} onEntryDoubleClick={setDoubleClickedVerse} currentSelection={currentSelection}/>

      <WordAlignerDialog
        alignerStatus={alignerStatus}
        height={wordAlignerHeight}
        translate={translate}
        suggester={alignmentPredictor.current?.predict.bind(alignmentPredictor.current)||null}
        />

      <footer className="py-4 bg-gray-200">
        <Toolbar onAddResource={loadUsfmTargetCallback} 
                 onAddSourceResource={loadSourceUsfmCallback}
                 onScopeChange={onScopeChange}
                 isTrainingEnabled={trainingState.isTrainingEnabled}
                 onToggleTraining={onToggleTraining}
                 trainingStatusOutput={trainingState.trainingStatusOutput} />
      </footer>
    </div>
  );
};

export default App;
