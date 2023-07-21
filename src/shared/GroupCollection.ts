import Group from "./Group";
import {parseUsfmHeaders} from "../utils/usfm_misc";
import Verse from "./Verse";
import { TState, TWordAlignerAlignmentResult } from "@/components/WordAlignerDialog";
import { TUsfmBook } from "word-aligner-rcl";
import JSZip from "jszip";

export default class GroupCollection {
    groups: { [key: string]: Group };

    constructor( newGroups?: {[key:string]: Group }) {
        this.groups = newGroups || {};
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
        return new GroupCollection(newGroups);
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
            newGroupCollection: new GroupCollection(newGroups) };
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
        return new GroupCollection(newGroups);
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

        return new GroupCollection(newGroups);
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

        return new GroupCollection( {[newGroupName]: mergedGroup} );
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
        return new GroupCollection(mergedGroups);
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

}