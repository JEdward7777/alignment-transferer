import { is_number } from "@/utils/usfm_misc";
import Verse, { VerseState } from "./Verse";
import { TState, TWordAlignerAlignmentResult } from "@/components/WordAlignerDialog";
import { TSourceTargetAlignment, TUsfmChapter, TUsfmVerse, TWord } from "word-aligner-rcl";
import { TTrainingAndTestingData, TWordAlignmentTestScore } from "@/workers/WorkerComTypes";


export interface TChapterTestResults{
    [key:number]: TWordAlignmentTestScore;
}

export default class Chapter {
    verses: { [key: number]: Verse };

    targetUsfm: TUsfmChapter | null = null;
    sourceUsfm: TUsfmChapter | null = null;

    constructor( newVerses: {[key:number]: Verse}, targetUsfm: TUsfmChapter | null, sourceUsfm: TUsfmChapter | null ) {
        this.verses = newVerses;
        this.targetUsfm = targetUsfm;
        this.sourceUsfm = sourceUsfm;
    }

    /**
     * Loads a chapter object from a serialized representation.
     *
     * @param {any} chapter - The serialized chapter object.
     * @return {Chapter} The revived chapter object.
     */
    static load( chapter_number_string: string, chapter: any ): Chapter {
        const newVerses: {[key:number]:Verse} = {};
        if( chapter.verses ){
            Object.entries(chapter.verses).forEach( ([verse_number_string,usfm_verse]:[string,any]) => {
                if( is_number(verse_number_string) ){
                    const verse_number_int = parseInt( verse_number_string );
                    newVerses[verse_number_int] = Verse.load( verse_number_string, usfm_verse );
                }
            });
        }
        //The usfm is added after construction in the book's load method.
        //Otherwise the usfm would be in the structure multiple times.
        return new Chapter( newVerses, null, null );
    } 

    /**
     * Converts the object to JSON format.
     *
     * @return {any} The JSON representation of the object.
     */
    toJSON(): any{
        return {
            verses: this.verses,
            //drop target and source usfm because it is in the book structure.
        }
    }

    
    addTargetUsfm( usfm_chapter: TUsfmChapter ): Chapter{
        const newVerses: {[key:number]:Verse} = {};

        Object.entries(usfm_chapter).forEach( ([verse_number_string,usfm_verse]:[string,TUsfmVerse]) => {
            if( is_number(verse_number_string) ){
                const verse_number_int = parseInt( verse_number_string );
                const newVerse = this.verses[verse_number_int] || new Verse();
                newVerses[verse_number_int] = newVerse.addTargetUsfm( usfm_verse );
            }
        });

        return new Chapter( {...this.verses, ...newVerses}, usfm_chapter, this.sourceUsfm );
    }
    addSourceUsfm( {usfm_chapter, isResourceSelected, group_name, book_name, chapter_number}: {usfm_chapter:TUsfmChapter, isResourceSelected:( resourceKey: string[] )=>boolean, group_name:string, book_name:string, chapter_number:string }):{addedVerseCount:number, droppedVerseCount:number, modifiedChapter:Chapter }{
        const modifiedVerses: {[key:number]:Verse} = {};
        let totalAddedVerseCount = 0;
        let totalDroppedVerseCount = 0;

        Object.entries(usfm_chapter).forEach( ([verse_number_string,usfm_verse]:[string,TUsfmVerse]) => {
            if( is_number(verse_number_string) ){
                const verse_number_int = parseInt( verse_number_string );

                if( verse_number_int in this.verses && isResourceSelected([group_name,book_name,chapter_number,verse_number_string]) ){
                    const toModifyVerse: Verse = this.verses[verse_number_int];
                    modifiedVerses[verse_number_int] = toModifyVerse.addSourceUsfm( usfm_verse )
                    totalAddedVerseCount++;
                }else{
                    totalDroppedVerseCount++;
                }
            }
        })

        return {
            addedVerseCount:totalAddedVerseCount,
            droppedVerseCount:totalDroppedVerseCount,
            modifiedChapter:new Chapter( {...this.verses, ...modifiedVerses}, this.targetUsfm, usfm_chapter ),
        }
    }

    setTestReservation( {reservedForTesting, isResourcePartiallySelected, group_name, book_name, chapter_number}: {reservedForTesting:boolean, isResourcePartiallySelected:( resourceKey: string[] )=>boolean, group_name:string, book_name:string, chapter_number:string }):Chapter{
        //Map through our verses and modify them accordingly.
        //It makes more sense to use isResourceSelected to grab the verses
        //but isResourcePartiallySelected will do and is needed further up.
        const newVerses : {[key:number]: Verse} = Object.fromEntries(Object.entries(this.verses).map( ([verse_number,verse])=>{
            return [verse_number,isResourcePartiallySelected([group_name,book_name,chapter_number,verse_number]) ? 
                verse.setTestReservation( reservedForTesting ) : 
                verse];            
        }));
        //now return the new "me"
        return new Chapter( newVerses, this.targetUsfm, this.sourceUsfm );
    }

    /**
     * Retrieves the list headers based on the given scope.
     * The list is spreadsheet view of the program.
     *
     * @param {string} scope - The scope for retrieving the list headers.
     * @return {string[]} - The list of headers.
     */
    static getListHeaders( scope:string ):string[]{
        if( scope == "Chapter" ) return ["Chapter","Verses"];
        return ["Chapter"].concat( Verse.getListHeaders() );
    }

    getListInfo( chapter_num: number, scope:string ):{ data:string[], keys:string[] }[]{
        const result: { data:string[], keys:string[] }[] = [];
        if( scope == "Chapter" ){
            result.push( {
                data:[""+chapter_num,""+Object.values(this.verses).length], 
                keys: [""+chapter_num],
            } );
        }else{
            Object.entries(this.verses).forEach(([verse_number,verse])=>{
                verse.getListInfo(parseInt(verse_number)).forEach((subResult) =>{
                    result.push( {
                        data: [""+chapter_num].concat(subResult.data),
                        keys: [""+chapter_num].concat(subResult.keys),
                    })
                });
            });
        }
        return result;
    }


    getVerseBySelector(selector: string[]): Verse | null {
        if( selector.length < 1 ) return null;
        const verse_num : number = parseInt(selector[0]);
        if( !(verse_num in this.verses ) ) return null;
        return this.verses[verse_num];
    }


    getVerseAlignmentStateBySelector(chapter_num: number, selector: string[]): TState | null {
        if( selector.length < 1 ) throw new Error( "Verse not selected for alignment." );
        const verse_num : number = parseInt(selector[0]);
        if( !(verse_num in this.verses ) ) throw new Error( "Verse not found." );
        return this.verses[verse_num].getAlignmentState( chapter_num, verse_num );
    }

    updateAlignmentState( alignmentDialogResult: TWordAlignerAlignmentResult, selector: string[] ): Chapter{
        if( selector.length < 1 ) return this;
        const verse_num: number = parseInt( selector[0] );
        if( !(verse_num in this.verses) ) return this;

        const newVerse = this.verses[verse_num].updateAlignmentState(alignmentDialogResult );

        const newVerses = { ...this.verses, [verse_num]: newVerse };

        const newTargetUsfm = { ...this.targetUsfm, [verse_num]: newVerse.targetVerse };

        return new Chapter( newVerses, newTargetUsfm, this.sourceUsfm );
    }

     /**
     * This function will remove resources which are
     * selected or partially remove partially selected resources.
     * @param bookKey the key for this book
     * @param isResourcePartiallySelected function to test if resource is partially selected
     * @param isResourceSelected function to test if resource is selected
     * @returns the new book.
     */
    removeSelectedResources( bookKey: string[], { isResourcePartiallySelected, isResourceSelected }: { isResourcePartiallySelected: (resourceKey: string[]) => boolean, isResourceSelected: (resourceKey: string[]) => boolean } ): Chapter {
        //console.log( `bookKey outside is ${bookKey}` );
        const newVerses = Object.fromEntries(Object.entries(this.verses).filter(([verse_number,verse]:[string,Verse])=>{
            //console.log( `bookKey inside is ${bookKey}` );
            //only keep the verses which are not selected.
            const isSelected = isResourceSelected( bookKey.concat([verse_number]) );
            return !isSelected;
        }));

        //also trip the USFM chapter
        const newTargetUsfm = this.targetUsfm == null?null:Object.fromEntries(Object.entries(this.targetUsfm).filter(([verse_number,verse]:[string,TUsfmVerse]):boolean=>{
            //only keep the verses which are not selected or is other stuff.
            if( !is_number(verse_number) ) return true;
            const isSelected = isResourceSelected( bookKey.concat([verse_number]) );
            return !isSelected;
        }));

        return new Chapter( newVerses, newTargetUsfm, this.sourceUsfm );
    }

    /**
     * This function merges this chapter with another chapter.
     * lhs takes priority
     * @param chapter the chapter to merge.
     * @return the merged chapter
     */
    mergeWith( chapter: Chapter ): Chapter {
        const newVerses = { ...this.verses };
        const newTargetUsfm = (this.targetUsfm==null)?{}:{ ...this.targetUsfm};
        const newSourceUsfm = (this.sourceUsfm==null)?{}:{ ...this.sourceUsfm};
        Object.entries(chapter.verses).forEach(([verse_number,verse]:[string,Verse])=>{
            const verse_number_int = parseInt(verse_number);
            if( !(verse_number in this.verses) ){
                newVerses[verse_number_int] = verse;
                if( verse.targetVerse != null ) newTargetUsfm[verse_number_int] = verse.targetVerse;
                if( verse.sourceVerse != null ) newSourceUsfm[verse_number_int] = verse.sourceVerse;
            }
        });
        return new Chapter( newVerses, newTargetUsfm, newSourceUsfm );
    }

    /**
     * This function gets the alignment training data from this chapter.
     * @param {boolean} forTesting - true if this is for testing
     * @param {boolean} getCorpus - true if this should include corpus
     * @return the alignment training data
     */
    getAlignmentDataAndCorpusForTrainingOrTesting( { forTesting, getCorpus }: { forTesting:boolean, getCorpus: boolean } ): TTrainingAndTestingData {
        //This function need to modified when there is verse spanning alignments.
        const alignmentSelectedVerses : { [key: number]: Verse } = {};
        const corpusSelectedVerses    : { [key: number]: Verse } = {};

        Object.entries(this.verses).forEach(([verse_number,verse]:[string,Verse])=>{
           //First test if this is for the training or testing which will make it for an alignment.
           if( verse.getVerseAlignmentStatus() == (forTesting?VerseState.AlignedTest:VerseState.AlignedTrain) ){
               alignmentSelectedVerses[parseInt(verse_number)] = verse;
           }else if( getCorpus ){
               corpusSelectedVerses[parseInt(verse_number)] = verse;
           }
        });

        //now extract the source and target verses as strings as well as the alignments.
        const alignments = Object.entries( alignmentSelectedVerses ).reduce( (acc: { [key: string]: { targetVerse: TWord[], sourceVerse: TWord[], alignments:TSourceTargetAlignment[] }} , [verse_num,verse]:[string,Verse])=>{
            acc[verse_num] = { targetVerse: verse.getTargetVerseAsTWords()!, sourceVerse: verse.getSourceVerseAsTWords()!, alignments: verse.getVerseAlignments()! };
            return acc;
        },{});

        const corpus = Object.entries( corpusSelectedVerses ).reduce( (acc: { [key: string]: { targetTokens: TWord[], sourceTokens: TWord[] }} , [verse_num,verse]:[string,Verse])=>{
            acc[verse_num] = { targetTokens: verse.getTargetVerseAsTWords()!, sourceTokens: verse.getSourceVerseAsTWords()! };
            return acc;
        },{});

        return {
            alignments,
            corpus,
        };
    }


    addRestructuredAlignmentTestResults( testResults: TChapterTestResults ): Chapter{
        const newVerses = Object.fromEntries(Object.entries(this.verses).map(([verse_number,verse]:[string,Verse])=>{
            if( !(verse_number in testResults) ) return [verse_number,verse];
            return [verse_number,verse.addAlignmentTestResults( testResults[parseInt(verse_number)] )];
        }));
        return new Chapter( newVerses, this.targetUsfm, this.sourceUsfm );
    }
}