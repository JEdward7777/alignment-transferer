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


    export interface TSourceTargetAlignment{
        sourceNgram: TWord[];
        targetNgram: TWord[];
    }
    

    interface TTopBottomAlignment{
        topWords: TWord[];
        bottomWords: TWord[];
    }

    interface TAlignerData{
        wordBank: TWord[];
        alignments: TSourceTargetAlignment[];
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
        suggester: ((sourceSentence: string | Token[], targetSentence: string | Token[], maxSuggestions?: number, manuallyAligned: Alignment[] = []) => Suggestion[]) | null;
    }
    export class SuggestingWordAligner extends React.Component<SuggestingWordAlignerProps>{}

    //function removeUsfmMarkers(verse: UsfmVerse):string;
    function usfmVerseToJson();

    


    export module usfmHelpers {
        export function removeUsfmMarkers(targetVerseText: string): string;
    }

    export module AlignmentHelpers{
        export function getWordListFromVerseObjects( verseObjects: TWord[] ): Token[];
        export function markTargetWordsAsDisabledIfAlreadyUsedForAlignments(targetWordList: Token[], alignments: TSourceTargetAlignment[]):TWord[];
        export function addAlignmentsToVerseUSFM( wordBankWords: TWord[], verseAlignments: any, targetVerseText: string ): string;
        //I see that Algnments is not spelled correctly, it is this way in the library.
        export function areAlgnmentsComplete( targetWords: TWord[], verseAlignments: TSourceTargetAlignment[] ): boolean;
    }
}

declare module 'word-aligner-rcl/dist/utils/alignmentHelpers';

declare module 'word-aligner-rcl/dist/utils/migrateOriginalLanguageHelpers';


// declare module 'word-aligner-rcl/dist/utils/migrateOriginalLanguageHelpers';