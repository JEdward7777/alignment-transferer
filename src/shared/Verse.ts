import { TState, TWordAlignerAlignmentResult } from "@/components/WordAlignerDialog";
import { mergeInAlignments, parseUsfmToWordAlignerData_JSON, verseObjectsToTargetString } from "@/utils/usfm_misc";
import { AlignmentHelpers, TUsfmVerse } from "word-aligner-rcl";

enum VerseState {
    NoSource = "no-source",
    NoTarget = "no-target",
    Unaligned = 'unaligned',
    AlignedTrain = 'aligned-train',
    AlignedTest = 'aligned-test',
}

export default class Verse {

    state: VerseState = VerseState.NoTarget;
    sourceVerse: TUsfmVerse | null = null;
    targetVerse: TUsfmVerse | null = null;

    reservedForTesting: boolean = false;

    clone(): Verse{
        const result: Verse = new Verse();
        result.sourceVerse = this.sourceVerse;
        result.targetVerse = this.targetVerse;
        result.state = this.state;
        result.reservedForTesting = this.reservedForTesting;
        return result;
    }

    
    /**
     * Computes what the state of this verse should be.
     * @return {VerseState} - The state of this verse.
     */
    computeState(): VerseState{
        if( this.sourceVerse == null ) return VerseState.NoSource;
        if( this.targetVerse == null ) return VerseState.NoTarget;
        const wordAlignerData = parseUsfmToWordAlignerData_JSON( this.targetVerse, this.sourceVerse );
        const alignmentComputed = AlignmentHelpers.areAlgnmentsComplete(wordAlignerData.targetWords, wordAlignerData.verseAlignments);
        if( !alignmentComputed ) return VerseState.Unaligned;
        if( this.reservedForTesting ) return VerseState.AlignedTest;
        return VerseState.AlignedTrain;
    }


    /**
     * Adds a target USFM verse to the current verse and returns a new 
     * Verse object with the updated target verse.
     *
     * @param {TUsfmVerse} usfm_verse - The target USFM verse to be added.
     * @return {Verse} - A new Verse object with the updated target verse.
     */
    addTargetUsfm( usfm_verse: TUsfmVerse ): Verse{
        const newVerse: Verse = this.clone();
        newVerse.targetVerse = usfm_verse;

        newVerse.state = newVerse.computeState();

        return newVerse;
    }

    addSourceUsfm( usfm_verse: TUsfmVerse ):Verse{
        const newVerse: Verse = this.clone();
        newVerse.sourceVerse = usfm_verse;

        newVerse.state = newVerse.computeState();
        return newVerse;
    }

    static getListHeaders():string[]{
        return ["Verse","Status"];
    }
    getListInfo( verse_num: number ):{ data:string[], keys:string[] }[]{
        return [{data:[ "" + verse_num, this.state ],keys:[""+verse_num]}];
    }

    getAlignmentState( chapter: number, verse: number ): TState | null{
        if( this.sourceVerse === null ) throw new Error( "No source text in verse" );
        if( this.targetVerse === null ) throw new Error( "No target text in verse" );

        //console.log( `potato: ${potato}`);


        const wordAlignerData = parseUsfmToWordAlignerData_JSON( this.targetVerse, this.sourceVerse );


        return {
            aligned: this.state !== VerseState.Unaligned,
            sourceLanguage: "sourceLang", //TODO: see if I can pull this information out of the usfm.
            targetLanguage: "targetLang", //TODO: ditto
            reference: {
                chapter, verse
            },
            alignerData:{
                wordBank:wordAlignerData.targetWords,
                alignments:wordAlignerData.verseAlignments,
            }
        };
    }

    updateAlignmentState( alignmentDialogResult: TWordAlignerAlignmentResult ): Verse{
        let result: Verse = this;

        if( this.targetVerse != null ){
            const newTargetVerse = mergeInAlignments( alignmentDialogResult.targetWords, alignmentDialogResult.verseAlignments, this.targetVerse );

            if( newTargetVerse != null ){
                result = this.addTargetUsfm({verseObjects: newTargetVerse} );
            }
        }

        return result;
    }
}
