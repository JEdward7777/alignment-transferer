import { MorphJLBoostWordMap } from "wordmapbooster/dist/boostwordmap_tools";
import GroupCollection from "./GroupCollection";

/**
 * This class wraps the interactions with MorphJLBoostWordMap
 * or other wordmapping tool.
 */
export default class WordMapBoosterWrapper {
    wordMapper : MorphJLBoostWordMap;
    constructor() {
        this.wordMapper = new MorphJLBoostWordMap({ targetNgramLength: 5, warnings: false, forceOccurrenceOrder:false });
    }

    /**
     * This function is used to incrementally train the wordmapper.
     * @param groupCollection - the group collection that contains the information to train
     * @returns newGroupCollection - the new group collection after training
     */
    trainIncrementally( groupCollection: GroupCollection ): GroupCollection {
        

        //TODO: need to actually change this to implement what has changed.
        return groupCollection;
    }
}