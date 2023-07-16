declare module 'word-aligner-rcl'{
    interface TWord{
        type: string;

        occurrence?: number | string;
        occurrences?: number | string;

        position?: number;

        //Sometimes it is word sometimes it is text.
        word?: string;
        text?: string;

        content?: string;
        endTag?: string;
        lemma?: string;
        morph?: string;
        strongs?: string;
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
        onChange: (results: TAlignerData) => void;
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
    }
}

declare module 'word-aligner-rcl/dist/utils/alignmentHelpers';

declare module 'word-aligner-rcl/dist/utils/migrateOriginalLanguageHelpers';


// declare module 'word-aligner-rcl/dist/utils/migrateOriginalLanguageHelpers';