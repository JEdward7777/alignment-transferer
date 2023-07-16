import { TState } from "@/components/WordAlignerDialog";
import { parseUsfmToWordAlignerData_JSON } from "@/utils/usfm_misc";
import { TUsfmVerse } from "word-aligner-rcl";

enum VerseState {
    Unpaired = 'unpaired',
    Unaligned = 'unaligned',
    AlignedTrain = 'aligned-train',
    AlignedTest = 'aligned-test',
}

export default class Verse {

    state: VerseState = VerseState.Unpaired;
    sourceVerse: TUsfmVerse | null = null;
    targetVerse: TUsfmVerse | null = null;

    clone(): Verse{
        const result: Verse = new Verse();
        result.sourceVerse = this.sourceVerse;
        result.targetVerse = this.targetVerse;
        result.state = this.state;
        return result;
    }


    addTargetUsfm( usfm_verse: TUsfmVerse ): Verse{
        const newVerse: Verse = this.clone();
        newVerse.targetVerse = usfm_verse;


        return newVerse;
    }

    addSourceUsfm( usfm_verse: TUsfmVerse ):Verse{
        const newVerse: Verse = this.clone();
        newVerse.sourceVerse = usfm_verse;

        //TODO: need to check the aligned state to know the proper state to set here.
        newVerse.state = VerseState.Unaligned;
        return newVerse;
    }

    static getListHeaders():string[]{
        return ["Verse","Status"];
    }
    getListInfo( verse_num: number ):{ data:string[], keys:string[] }[]{
        return [{data:[ "" + verse_num, this.state ],keys:[""+verse_num]}];
    }

    getAlignmentState( chapter: number, verse: number ): TState | null{
        if( this.sourceVerse === null ) return null;
        if( this.targetVerse === null ) return null;

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
}
