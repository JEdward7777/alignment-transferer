import Group from "./Group";
import {parseUsfmHeaders} from "../utils/usfm_misc";
import Verse from "./Verse";
import { TState } from "@/components/WordAlignerDialog";

export default class GroupCollection {
    groups: { [key: string]: Group };

    constructor( newGroups?: {[key:string]: Group }) {
        this.groups = newGroups || {};
    }


    hasBookInGroup({ group_name, usfm_book }: {group_name: string; usfm_book: any } ): boolean{
        if( !(group_name in this.groups) ) return false;
        const usfmHeaders = parseUsfmHeaders(usfm_book.headers);
        return this.groups[group_name].hasBook(usfmHeaders.h);
    }

    /**
     * This adds usfm to this group collection, but does so without
     * changing the original group collection in order to make it react compatible.
     */
    addTargetUsfm({group_name, usfm_json }: {group_name: string, usfm_json: any}): GroupCollection{
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
    addSourceUsfm( {usfm_json, isResourceSelected}:{usfm_json:any, isResourceSelected:( resourceKey: string[] )=>boolean} ):{newGroupCollection:GroupCollection, addedVerseCount:number, droppedVerseCount:number }{
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
    updateAlignmentState( alignmentDialogResult: any, selector: string[] ): GroupCollection{
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
}