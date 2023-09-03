import Group, { TGroupTestResults } from "./Group";
import {parseUsfmHeaders} from "../utils/usfm_misc";
import Verse from "./Verse";
import { TState, TWordAlignerAlignmentResult } from "@/components/WordAlignerDialog";
import { TSourceTargetAlignment, TUsfmBook, TWord } from "word-aligner-rcl";
import JSZip from "jszip";
import { TTrainingAndTestingData, TWordAlignmentTestScore } from "@/workers/WorkerComTypes";

export interface TGroupCollectionTestResults{
    [key:string]: TGroupTestResults
}


export default class GroupCollection {
    groups: { [key: string]: Group };
    instanceCount: number = 0;

    constructor( newGroups: {[key:string]: Group}, newInstanceCount: number ) {
        this.groups = newGroups;
        this.instanceCount = newInstanceCount;
    }

    /**
     * Loads a group collection from a serialized format.
     *
     * @param {object} groupCollection - The serialized group collection.
     * @return {GroupCollection} The revived group collection.
     */
    static load( groupCollection: {[key:string]: any} ): GroupCollection {
        const newGroups : {[key:string]: Group} = {};
        if( !groupCollection ) return new GroupCollection(newGroups, 0);

        let newInstanceCount = 0;
        if( groupCollection.instanceCount ) newInstanceCount = groupCollection.instanceCount;

        if( !groupCollection.groups ) return new GroupCollection(newGroups, newInstanceCount);
        if( !(groupCollection.groups instanceof Object) ) return new GroupCollection(newGroups, newInstanceCount);
        
        Object.entries(groupCollection.groups as any).forEach( ([group_name,group]: [string,any]) => {
            newGroups[group_name] = Group.load(group_name,group);
        })
        return new GroupCollection(newGroups, newInstanceCount);
    }


    hasBookInGroup({ group_name, usfm_book }: {group_name: string; usfm_book: TUsfmBook } ): boolean{
        if( !(group_name in this.groups) ) return false;
        const usfmHeaders = parseUsfmHeaders(usfm_book.headers);
        return this.groups[group_name].hasBook(usfmHeaders.h);
    }

    /**
     * This adds usfm to this group collection, but does so without
     * changing the original group collection in order to make it react compatible.
     */
    addTargetUsfm({group_name, usfm_json }: {group_name: string, usfm_json: {[key:string]:TUsfmBook}}): GroupCollection{
        let newGroup: Group = this.groups[group_name] || new Group();
        newGroup = newGroup.addTargetUsfm( usfm_json );
        const newGroups = {...this.groups, [group_name]:newGroup};
        return new GroupCollection(newGroups, this.instanceCount + 1);
    }

    /**
     * This adds source usfm content like greek to all possible matching books, chapters and verses
     * across the different groups as long as the supplied function isResourceSelected returns true.
     * The results is returned without modifying the original object.
     * @param param0 
     */
    addSourceUsfm( {usfm_json, isResourceSelected}:{usfm_json:{[key:string]:TUsfmBook}, isResourceSelected:( resourceKey: string[] )=>boolean} ):{newGroupCollection:GroupCollection, addedVerseCount:number, droppedVerseCount:number }{
        let totalAddedVerseCount = 0;
        let totalDroppedVerseCount = 0;
        const newGroups: {[key: string]: Group } = Object.fromEntries( Object.entries(this.groups).map( ([group_name,group]:[string,Group]):[group_name:string,newGroup:Group] => {
            const {addedVerseCount,droppedVerseCount,newGroup} = group.addSourceUsfm( {usfm_json: usfm_json,isResourceSelected,group_name});
            totalAddedVerseCount += addedVerseCount;
            totalDroppedVerseCount += droppedVerseCount;
            return [group_name,newGroup];
        }));
        return {addedVerseCount:totalAddedVerseCount, 
            droppedVerseCount: totalDroppedVerseCount, 
            newGroupCollection: new GroupCollection(newGroups, this.instanceCount + 1) };
    }

    setTestReservation( {reservedForTesting, isResourcePartiallySelected }: {reservedForTesting: boolean, isResourcePartiallySelected:( resourceKey: string[] )=>boolean} ): GroupCollection{
        const newGroups: {[key: string]: Group } = Object.fromEntries( Object.entries(this.groups).map( ([group_name,group]:[string,Group]):[group_name:string,newGroup:Group] => {
            const newGroup = isResourcePartiallySelected( [ group_name ] ) ? 
                    group.setTestReservation( {reservedForTesting, isResourcePartiallySelected, group_name } ) : 
                    group;
            return [group_name,newGroup];
        }));
        return new GroupCollection(newGroups, this.instanceCount + 1);    
    }

    static getListHeaders( scope:string ):string[]{
        return Group.getListHeaders(scope);
    }

    getListInfo( scope:string ):{ data:string[], keys:string[] }[]{
        const result: { data:string[], keys:string[] }[] = [];
        Object.entries(this.groups).forEach(([group_name,group])=>result.push(...group.getListInfo(group_name,scope)));
        return result;
    }

    /**
     * This function is used to grab a Verse object using a selector.
     * If the selector is too short or doesn't reference a verse null is returned.
     * @param selector a selector as defined by the keys returned from getListInfo.
     * @returns 
     */
    getVerseBySelector(selector: string[]): Verse | null {
      if( selector.length < 1 ) return null;
      if( !(selector[0] in this.groups ) ) return null;
      return this.groups[selector[0]].getVerseBySelector( selector.slice(1) );
    }

    /**
     * This function is used to grab the verse alignment state using a selector.
     * If the selector is too short or doesn't reference a verse null is returned.
     * @param selector a selector as defined by the keys returned from getListInfo.
     * @returns 
     */
    getVerseAlignmentStateBySelector(selector: string[]): TState | null {
      if( selector.length < 1 ) return null;
      if( !(selector[0] in this.groups ) ) return null;
      return this.groups[selector[0]].getVerseAlignmentStateBySelector( selector.slice(1) );
    }

    /**
     * This function takes the result of the alignment dialog when save is set
     * and returns a new group collection which has the new changes merged in.
     * The GroupCollection and sub objects are treated as immutable for react's sake
     * except for the usfm objects at the leaves.
     * @param alignmentDialogResult Returned by the alignment dialog
     * @param selector The same selector which is used by the previous functions
     */
    updateAlignmentState( alignmentDialogResult: TWordAlignerAlignmentResult, selector: string[] ): GroupCollection{
        //need to figure out if any group got hit and if so return a group collection which
        //has a modified version of it.
        if( selector.length < 1 ) throw new Error( "Group not selected" );
        if( !(selector[0] in this.groups ) ) new Error( "Group not found" );

        const newGroup = this.groups[selector[0]].updateAlignmentState( alignmentDialogResult, selector.slice(1) );

        const newGroups = { ...this.groups,
            [selector[0]]: newGroup,
        }
        return new GroupCollection(newGroups, this.instanceCount + 1);
    }

    /**
     * This function saves the loaded USFM to the zip archive which is passed in.
     * The resources saved are filtered by the isResourcePartiallySelected function.
     * @param zip the zip object to save to
     * @param isResourcePartiallySelected function to test if resource is partially selected
     */
    saveSelectedResourcesToUsfmZip( zip: JSZip, isResourcePartiallySelected: ( resourceKey: string[] ) => boolean ): void {
        Object.entries(this.groups).forEach(([group_name,group])=>{
            const groupKey = [group_name];
            if( isResourcePartiallySelected( groupKey ) ){
                //filter the group_name so it doesn't contain any invalid characters for a filename.
                const groupFilename = group_name.replace(/[^a-zA-Z0-9 ]/g, "");
                group.saveSelectedResourcesToUsfmZip(zip.folder(groupFilename)!,groupKey,isResourcePartiallySelected);
            }
        });
    }


    /**
     * This function will remove resources which are
     * selected or partially remove partially selected resources.
     * @param isResourcePartiallySelected function to test if resource is partially selected
     * @param isResourceSelected function to test if resource is selected
     * @returns the new GroupCollection.
     */
    removeSelectedResources({ isResourcePartiallySelected, isResourceSelected }: { isResourcePartiallySelected: (resourceKey: string[]) => boolean, isResourceSelected: (resourceKey: string[]) => boolean }): GroupCollection {

        //first map the groups through the recursive removal and then filter out the empty ones.
        const newGroups: {[key: string]: Group } = Object.fromEntries( Object.entries(this.groups).map( ([group_name,group]:[string,Group]):[string,Group] => {
            const groupKey = [group_name];
            //shortcut pass the items which are not touched.
            if( !isResourcePartiallySelected( groupKey ) ) return [group_name,group];
            //now recurse on the rest.
            return [group_name,group.removeSelectedResources( groupKey, {isResourcePartiallySelected, isResourceSelected} )];
        }).filter( ([group_name,group]:[string,Group])=>{
            return Object.keys(group.books).length > 0;
        }));

        return new GroupCollection(newGroups, this.instanceCount + 1);
    }


    /**
     * This function renames all groups under the given name.
     * The lhs has the the precedence in case of a collision.
     * @param {string} newGroupName - The new name for the group.
     * @return {GroupCollection} - The updated group collection.
     */
    mergeGroupsUnderName(newGroupName: string): GroupCollection {
        //take care of the case of no groups.
        if( Object.keys(this.groups).length === 0 ) return this;

        const mergedGroup: Group = Object.values(this.groups)
           .reduce( (mergedGroup: Group, group: Group):Group => mergedGroup.mergeWith( group ) );

        return new GroupCollection( {[newGroupName]: mergedGroup}, this.instanceCount + 1 );
    }

    /**
     * This function merges this GroupCollection with another GroupCollection
     * The lhs has the the precedence in case of a collision.
     * @param {GroupCollection} otherGroupCollection - The other GroupCollection.
     * @return {GroupCollection} - The updated group collection.
     */
    mergeWith( otherGroupCollection: GroupCollection ): GroupCollection {
        const mergedGroups: {[key: string]: Group } = {...this.groups};
        Object.entries(otherGroupCollection.groups).forEach(([group_name,group]:[string,Group])=>{
            if( group_name in mergedGroups ){
                mergedGroups[group_name] = mergedGroups[group_name].mergeWith( group );
            }else{
                mergedGroups[group_name] = group;
            }
        });
        return new GroupCollection(mergedGroups, this.instanceCount + 1);
    }

    /**
     * Renames selected groups.
     *
     * @param {Object} params - The parameters for renaming the groups.
     * @param {string} params.newGroupName - The new name for the group.
     * @param {function} params.isResourcePartiallySelected - A function that determines if a resource is partially selected.
     * @return {GroupCollection} - The updated group collection.
     */
    renameSelectedGroups({
        newGroupName,
        isResourcePartiallySelected,
        isResourceSelected,
    }: {
        newGroupName: string;
        isResourcePartiallySelected: (resourceKey: string[]) => boolean;
        isResourceSelected: (resourceKey: string[]) => boolean;
    }) {

        //so first split stuff apart by doing a delete and a reverse delete.
        //So define the reverse selection functions to be able to do the reverse delete.
        const oppositeIsResourceSelected = ( resourceKey: string[] ) => !isResourcePartiallySelected( resourceKey );
        const oppositeIsResourcePartiallySelected = ( resourceKey: string[] ) => !isResourceSelected( resourceKey );

        const withoutSelected = this.removeSelectedResources({ isResourcePartiallySelected, isResourceSelected });
        const withSelected    = this.removeSelectedResources({ isResourcePartiallySelected:oppositeIsResourcePartiallySelected, isResourceSelected:oppositeIsResourceSelected});

        const renamedSelected = withSelected.mergeGroupsUnderName( newGroupName );

        const result = withoutSelected.mergeWith( renamedSelected );

        return result;
    }

    /**
     * This function gets the alignment training data from this book.
     * @param {boolean} forTesting - true if this is for testing
     * @return the alignment training data, with targetVerse, sourceVerse as strings and the alignments as TSourceTargetAlignment[]
     */
    getAlignmentDataAndCorpusForTrainingOrTesting( { forTesting, getCorpus }: { forTesting:boolean, getCorpus: boolean } ): TTrainingAndTestingData {
        const alignments: { [key: string]: { targetVerse: TWord[], sourceVerse: TWord[], alignments:TSourceTargetAlignment[] }} = {};
        const corpus: { [key: string]: { sourceTokens: TWord[], targetTokens: TWord[] }} = {};
        
        Object.entries(this.groups).forEach( ([group_name,group]: [string,Group])=>{
            const subResults = group.getAlignmentDataAndCorpusForTrainingOrTesting( {forTesting,getCorpus} );
            Object.entries(subResults.alignments).forEach(([reference,alignment])=>{
                alignments[`[${group_name}] ${reference}`] = alignment;
            });
            Object.entries(subResults.corpus).forEach(([reference,subCorpus])=>{
                corpus[`[${group_name}] ${reference}`] = subCorpus;
            })         
        });
        return {
            alignments,
            corpus,
        };
    }

    parseReference(reference: string): { group: string, book: string, chapter: number, verse: number } | null {
        const regex = /^\[(\w+)\]\s+(\w+)\s+(\d+):(\d+)$/;
        const match = reference.match(regex);
        
        if (match) {
            const [, group, book, chapterStr, verseStr] = match;
            const chapter = parseInt(chapterStr, 10);
            const verse = parseInt(verseStr, 10);
        
            if (!isNaN(chapter) && !isNaN(verse)) {
                return {
                    group,
                    book,
                    chapter,
                    verse,
                };
            }
        }
        
        return null; // Return null for invalid references
    }

    /**
     * This function adds test results to the class structure so that the results
     * can be displayed in the UI.
     * @param testResults 
     * @returns 
     */
    addAlignmentTestResults( testResults:TWordAlignmentTestScore ): GroupCollection {
        console.log( `addAlignmentTestResults: ${JSON.stringify(testResults)}` );

        const restructuredTestResults: TGroupCollectionTestResults = {};

        Object.entries(testResults).forEach(([reference, score])=>{
            const fullParse = this.parseReference(reference);
            if( fullParse ){
                const { group, book, chapter, verse } = fullParse;
                if( !(group in restructuredTestResults) ){
                    restructuredTestResults[group] = {};
                }
                const groupResult = restructuredTestResults[group];
                if( !(book in groupResult) ){
                    groupResult[book] = {};
                }
                const bookResult = groupResult[book];
                if( !(chapter in bookResult) ){
                    bookResult[chapter] = {};
                }
                const chapterResult = bookResult[chapter];
                chapterResult[verse] = score;
            }
        });

        //Now filter through our groups to stuffs the information in.
        const newGroups = Object.fromEntries(Object.entries(this.groups).map(([group_name,group]:[string,Group])=>{
            if( !(group_name in restructuredTestResults) ) return [group_name,group];
            return [group_name,group.addRestructuredAlignmentTestResults( restructuredTestResults[group_name] )];
        }));

        //do not increment the instance count
        //because it will trigger a new train which will then
        //trigger a new test which then will call this again.
        //Basically do not increment the instanceCount if something hasn't
        //changed which impacts the training.
        return new GroupCollection(newGroups, this.instanceCount);
    }
}