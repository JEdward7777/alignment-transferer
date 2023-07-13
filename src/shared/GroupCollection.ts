import Group from "./Group";
import {parseUsfmHeaders} from "../utils/usfm_misc";

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
}