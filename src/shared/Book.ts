import Chapter from './Chapter';
import { is_number } from '@/utils/usfm_misc';
import Verse from './Verse';
import { TState, TWordAlignerAlignmentResult } from '@/components/WordAlignerDialog';
import { TUsfmBook, TUsfmChapter } from 'word-aligner-rcl';
import { deepClone } from '@/utils/load_file';
import JSZip from 'jszip';
// @ts-ignore
import usfm from 'usfm-js';


export default class Book {
    chapters: { [key: number]: Chapter };
    filename: string;
    toc3Name: string;
    targetUsfmBook: TUsfmBook | null;


    constructor( {chapters,filename,toc3Name,targetUsfmBook}: {chapters:{[key:number]:Chapter},filename:string,toc3Name:string,targetUsfmBook:TUsfmBook|null} ) {
        this.chapters = chapters;
        this.filename = filename;
        this.toc3Name = toc3Name;
        this.targetUsfmBook = targetUsfmBook;
    }

    /**
     * This adds usfm chapters to this book object but returns a new
     * book object to maintain immutability for react's sake.
     * @param usfm_book The usfm book content being added.
     * @returns a new copy of the Book object with the usfm content added.
     */
    addTargetUsfm( {filename,usfm_book,toc3Name}:{filename:string,usfm_book:TUsfmBook,toc3Name:string}):Book{
        const newChapters: {[key:number]:Chapter} = {};

        Object.entries(usfm_book.chapters).forEach( ([chapter_number_string,usfm_chapter]:[string,TUsfmChapter]) => {
            if( is_number(chapter_number_string) ){
                const chapter_number_int = parseInt( chapter_number_string );
                const newChapter = this.chapters[chapter_number_int] || new Chapter({},null,null);
                newChapters[chapter_number_int] = newChapter.addTargetUsfm( usfm_chapter );
            }
        });

        return new Book( {chapters:{...this.chapters,...newChapters}, filename, toc3Name, targetUsfmBook:usfm_book} );
    }

    addSourceUsfm( {usfm_book, isResourceSelected, group_name, book_name }:{usfm_book:TUsfmBook,isResourceSelected:( resourceKey: string[] )=>boolean,group_name:string,book_name:string} ):{ addedVerseCount:number, droppedVerseCount:number, modifiedBook:Book }{
        const modifiedChapters: {[key:number]:Chapter} = {};
        let totalAddedVerseCount = 0;
        let totalDroppedVerseCount = 0;

        //TODO: the code for calculating dropped verses doesn't work right.  If the first group takes a verse and then the second group
        //doesn't then the verse shouldn't be considered dropped, but the way this code works, all the drops from all the groups are added together.

        Object.entries(usfm_book.chapters).forEach( ([chapter_number_string,usfm_chapter]:[string,TUsfmChapter]) => {
            if( is_number(chapter_number_string) ){
                const chapter_number_int = parseInt( chapter_number_string );
                const toModifyChapter: Chapter = this.chapters[chapter_number_int] || new Chapter({},null,null);
                const {addedVerseCount, droppedVerseCount, modifiedChapter } = toModifyChapter.addSourceUsfm( {usfm_chapter, isResourceSelected, group_name, book_name, chapter_number:chapter_number_string } );
                totalAddedVerseCount += addedVerseCount;
                totalDroppedVerseCount += droppedVerseCount;
                modifiedChapters[chapter_number_int] = modifiedChapter;
            }
        });

        return {
            addedVerseCount:totalAddedVerseCount,
            droppedVerseCount: totalDroppedVerseCount,
            modifiedBook: new Book( {chapters:{...this.chapters,...modifiedChapters}, filename:this.filename, toc3Name:this.toc3Name, targetUsfmBook:this.targetUsfmBook } ),
        }
    }

    static getListHeaders( scope:string ):string[]{
        if( scope == "Book" ) return ["Book", "Chapters"];
        return ["Book"].concat( Chapter.getListHeaders(scope) );
    }

    getListInfo( book_name: string, scope:string ):{ data:string[], keys:string[] }[]{
        const result: { data:string[], keys:string[] }[] = [];
        if( scope == "Book" ){
            result.push({
                data:[book_name,""+Object.values(this.chapters).length],
                keys:[book_name],
            })
        }else{
            Object.entries(this.chapters).forEach(([chapter_number,chapter])=>{
                chapter.getListInfo(parseInt(chapter_number), scope).forEach((subResult) => {
                    result.push( {
                        data: [book_name].concat(subResult.data),
                        keys: [book_name].concat(subResult.keys),
                    })
                });
            });
        }
        return result;
    }


    getVerseBySelector(selector: string[]): Verse | null {
        if( selector.length < 1 ) return null;
        const chapter_num : number = parseInt(selector[0]);
        if( !(chapter_num in this.chapters ) ) return null;
        return this.chapters[chapter_num].getVerseBySelector( selector.slice(1) );
    }


    getVerseAlignmentStateBySelector(selector: string[]): TState | null {
        if( selector.length < 1 ) throw new Error( "Chapter not selected for editing verse." );
        const chapter_num : number = parseInt(selector[0]);
        if( !(chapter_num in this.chapters ) ) throw new Error( "Chapter not found in book." );
        return this.chapters[chapter_num].getVerseAlignmentStateBySelector( chapter_num, selector.slice(1) );
    }

    updateAlignmentState( alignmentDialogResult: TWordAlignerAlignmentResult, selector: string[] ): Book{
        if( selector.length < 1 ) return this;
        const chapter_num: number = parseInt( selector[0] );
        if( !(chapter_num in this.chapters) ) return this;

        const newChapter = this.chapters[chapter_num].updateAlignmentState( alignmentDialogResult, selector.slice(1) );

        if( this.targetUsfmBook == null ) throw new Error( "Target USFM not loaded" );

        //Going to deep clone the book before adding the new chapter in to preserve the immutability of the original structure.
        const newTargetUsfm = deepClone( this.targetUsfmBook );
        newTargetUsfm.chapters[chapter_num] = newChapter.targetUsfm!;

        const newChapters = { ...this.chapters, [chapter_num]: newChapter };
        return new Book( {chapters:newChapters,filename:this.filename,toc3Name:this.toc3Name,targetUsfmBook:newTargetUsfm } );
    }

    /**
     * This function saves the loaded USFM to the zip archive which is passed in.
     * The resources saved are filtered by the isResourcePartiallySelected function.
     * @param folder the zip folder to save to
     * @param bookKey the key for this book
     * @param isResourcePartiallySelected function to test if resource is partially selected
     */ 
    saveSelectedResourcesToUsfmZip( folder: JSZip, bookKey: string[], isResourcePartiallySelected: ( resourceKey: string[] ) => boolean ): void {
        if( this.targetUsfmBook == null ) throw new Error( "Target USFM not loaded" );

        //Deep clone the target usfm information that we have and then cut out of it the chapters and verses which are not selected.
        const newTargetUsfm = deepClone( this.targetUsfmBook );

        Object.entries(this.chapters).forEach(([chapter_number,chapter])=>{
            const chapterKey = bookKey.concat([chapter_number]);
            //if this chapter isn't even partially selected then delete it
            if( !isResourcePartiallySelected( chapterKey ) ){
                 delete newTargetUsfm.chapters[chapter_number];
            }else{
                //now check if there are any verses to nix.
                const chapter = newTargetUsfm.chapters[chapter_number];
                Object.entries(chapter).forEach(([verse_number,verse])=>{
                    if( !isResourcePartiallySelected( chapterKey.concat([verse_number]) ) ){
                        delete chapter[verse_number];
                    }
                })
            }
        });

        //Save the new target usfm to the zip file.
        //first we convert the object structure back to usfm using the usfm-js library.
        const newTargetUsfmString = usfm.toUSFM(newTargetUsfm, { chunk: true, forcedNewLines: true })

        //now write it tot he zip folder.
        folder.file(`${this.filename}`, newTargetUsfmString);
    }

    /**
     * This function will remove the resources which are selected or partially remove partially selected resources.
     * @param bookKey the key for this book
     * @param isResourcePartiallySelected function to test if resource is partially selected
     * @param isResourceSelected function to test if resource is selected
     * @returns a new book object
     */
    removeSelectedResources( bookKey: string[], { isResourcePartiallySelected, isResourceSelected }: { isResourcePartiallySelected: (resourceKey: string[]) => boolean, isResourceSelected: (resourceKey: string[]) => boolean } ): Book{
        const newChapters = Object.fromEntries(Object.entries(this.chapters).map(([chapter_number,chapter]:[string,Chapter]):[string,Chapter]=>{
            const chapterKey = bookKey.concat([chapter_number]);
            if( isResourcePartiallySelected( chapterKey ) ){
                return [chapter_number,chapter.removeSelectedResources( chapterKey, {isResourcePartiallySelected, isResourceSelected} )];
            }else{
                return [chapter_number,chapter];
            }
        }).filter(([chapter_number,chapter])=>{
            return Object.keys(chapter.verses).length > 0;
        }));

        //now also filter the usfm information.
        const newTargetUsfmBook = deepClone( this.targetUsfmBook )!;

        Object.entries(newTargetUsfmBook.chapters).forEach(([chapter_number,chapter]:[string,TUsfmChapter])=>{
            const chapterKey = bookKey.concat([chapter_number]);
            //just pass the front or other sections which are not numbers.
            if( is_number(chapter_number) ){
                //if it isn't partially selected we can just pass it.
                if( isResourcePartiallySelected( chapterKey ) ){
                    //Check to see if the partially selected chapter should be whittled or removed.
                    if( chapter_number in newChapters ){
                        newTargetUsfmBook.chapters[chapter_number] = newChapters[chapter_number].targetUsfm!;
                    }else{
                        delete newTargetUsfmBook.chapters[chapter_number];
                    }
                }                
            }
        })

        return new Book( {chapters:newChapters,filename:this.filename,toc3Name:this.toc3Name,targetUsfmBook:newTargetUsfmBook } );
    }

    /**
     * This function merges this book with another book.
     * This is most will happen when the same book is in two different
     * groups and they are renamed to the same thing.
     * lhs takes priority
     * @param {Book} book - the book to merge with
     * @returns a new book object
     */
    mergeWith( book: Book ): Book {
        const newChapters = { ...this.chapters };
        //fall over to the other other book's usfm for the target usfm
        //so we can have book headers.
        let newTargetUsfmBook : TUsfmBook | null = (this.targetUsfmBook !== null)?this.targetUsfmBook:book.targetUsfmBook;
        Object.entries(book.chapters).forEach(([chapter_number,chapter]:[string,Chapter])=>{
            const chapter_number_int = parseInt(chapter_number);
            if( chapter_number in newChapters ){
                const mergedChapter = newChapters[chapter_number_int].mergeWith( chapter );
                newChapters[chapter_number_int] = mergedChapter;
                //snag the merged usfm
                if( newTargetUsfmBook != null && mergedChapter.targetUsfm != null ){
                    newTargetUsfmBook.chapters[chapter_number_int] = mergedChapter.targetUsfm!;
                }
            }else{
                newChapters[chapter_number_int] = chapter;
                if( newTargetUsfmBook != null && chapter.targetUsfm != null ){
                    newTargetUsfmBook.chapters[chapter_number_int] = chapter.targetUsfm!;
                }
            }
        });
        return new Book( {chapters:newChapters,filename:this.filename,toc3Name:this.toc3Name,targetUsfmBook:newTargetUsfmBook } );
    }
}