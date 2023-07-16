declare module 'word-aligner'{
    export function unmerge(verseObject: TUsfmVerse, alignedVerse: TUsfmVerse | TWord[] | string ): { alignment: TAlignment, alignments: TAlignment[], wordBank };

    export function merge( alignments: TAlignment, wordBank: TWord[], verseString: string, useVerseText:boolean ): TWord[] | null | string;
}