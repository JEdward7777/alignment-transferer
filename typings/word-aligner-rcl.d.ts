declare module 'word-aligner-rcl'{
    interface TWord{
        type: string;

        occurrence?: number | string;
        occurrences?: number | string;

        position?: number;

        //Sometimes it is word sometimes it is text.
        word?: string; //usfm format uses word
        text?: string; //alignment uses text.

        content?: string;
        endTag?: string;
        lemma?: string;
        morph?: string;
        strongs?: string; //something was using strongs, I forget
        strong?: string; //alignment dialog uses strong
        tag?: string;

        children?: TWord[];

        
    }
    interface TAlignment{
        topWords: TWord[];
        bottomWords: TWord[];
    }

    interface TAlignerData{
        wordBank: TWord[];
        alignments: TAlignment[];
    }
  

    interface TReference{
        chapter: number;
        verse: number;
    }

    interface TContextId{
        reference: TReference;
    }

    interface TUsfmVerse{
        verseObjects: TWord[];
    }

    type TUsfmChapter = {[key:string]:TUsfmVerse};

    interface TUsfmHeader{
        tag: string;
        content: string;
    }

    interface TUsfmBook{
        headers: TUsfmHeader[];
        chapters: {[key:string]:TUsfmChapter};
    }

    interface SuggestingWordAlignerProps {
        style: {[key: string]: string };
        verseAlignments: TAlignments;
        targetWords: TWord[];
        translate: (key:string)=>string;
        contextId: TContextId;
        targetLanguage: string;
        targetLanguageFont: {};
        sourceLanguage: string;
        showPopover: (PopoverTitle: string, wordDetails: string, positionCoord: string, rawData: any) => void;
        lexicons: {};
        loadLexiconEntry: (arg:string)=>{[key:string]:string};
        onChange: (results: TWordAlignerAlignmentResult) => void;
    }
    export class SuggestingWordAligner extends React.Component<SuggestingWordAlignerProps>{}

    //function removeUsfmMarkers(verse: UsfmVerse):string;
    function usfmVerseToJson();

    


    export module usfmHelpers {
        export function removeUsfmMarkers(targetVerseText: string): string;
    }

    export module AlignmentHelpers{
        export function getWordListFromVerseObjects( verseObjects: TWord[] ): Token[];
        export function markTargetWordsAsDisabledIfAlreadyUsedForAlignments(targetWordList: Token[], alignments: TAlignment[]):TWord[];
        export function addAlignmentsToVerseUSFM( wordBankWords: TWord[], verseAlignments: any, targetVerseText: string ): string;
    }
}

declare module 'word-aligner-rcl/dist/utils/alignmentHelpers';

declare module 'word-aligner-rcl/dist/utils/migrateOriginalLanguageHelpers';


// declare module 'word-aligner-rcl/dist/utils/migrateOriginalLanguageHelpers';