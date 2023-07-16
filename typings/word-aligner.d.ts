declare module 'word-aligner'{
    export function unmerge(verseObject: TUsfmVerse, alignedVerse: TUsfmVerse | TWord[] | string ): { alignment: TAlignment, alignments: TAlignment[], wordBank };

    // module "default"{
    //     export function unmerge(verseObject, alignedVerse): {alignment: TAlignment, alignments: TAlignment[]};
    // }
}