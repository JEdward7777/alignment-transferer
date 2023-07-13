import Chapter from './Chapter';
import { is_number } from '@/utils/usfm_misc';


export default class Book {
    chapters: { [key: number]: Chapter };
    filename: string;
    toc3Name: string;

    constructor( {chapters,filename,toc3Name}:{chapters?:{[key:number]:Chapter},filename?:string,toc3Name?:string} = {}) {
        this.chapters = chapters || {};
        this.filename = filename || "";
        this.toc3Name = toc3Name || "";
    }

    /**
     * This adds usfm chapters to this book object but returns a new
     * book object to maintain immutability for react's sake.
     * @param usfm_book The usfm book content being added.
     * @returns a new copy of the Book object with the usfm content added.
     */
    addTargetUsfm( {filename,usfm_book,toc3Name}:{filename:string,usfm_book:any,toc3Name:string}):Book{
        const newChapters: {[key:number]:Chapter} = {};

        Object.entries(usfm_book.chapters).forEach( ([chapter_number_string,usfm_chapter]:[string,any]) => {
            if( is_number(chapter_number_string) ){
                const chapter_number_int = parseInt( chapter_number_string );
                const newChapter = this.chapters[chapter_number_int] || new Chapter();
                newChapters[chapter_number_int] = newChapter.addTargetUsfm( usfm_chapter );
            }
        });

        return new Book( {chapters:{...this.chapters,...newChapters}, filename, toc3Name} );
    }

    addSourceUsfm( {usfm_book, isResourceSelected, group_name, book_name }:{usfm_book:any,isResourceSelected:( resourceKey: string[] )=>boolean,group_name:string,book_name:string} ):{ addedVerseCount:number, droppedVerseCount:number, modifiedBook:Book }{
        const modifiedChapters: {[key:number]:Chapter} = {};
        let totalAddedVerseCount = 0;
        let totalDroppedVerseCount = 0;

        //TODO: the code for calculating dropped verses doesn't work right.  If the first group takes a verse and then the second group
        //doesn't then the verse shouldn't be considered dropped, but the way this code works, all the drops from all the groups are added together.

        Object.entries(usfm_book.chapters).forEach( ([chapter_number_string,usfm_chapter]:[string,any]) => {
            if( is_number(chapter_number_string) ){
                const chapter_number_int = parseInt( chapter_number_string );
                const toModifyChapter: Chapter = this.chapters[chapter_number_int] || new Chapter();
                const {addedVerseCount, droppedVerseCount, modifiedChapter } = toModifyChapter.addSourceUsfm( {usfm_chapter, isResourceSelected, group_name, book_name, chapter_number:chapter_number_string } );
                totalAddedVerseCount += addedVerseCount;
                totalDroppedVerseCount += droppedVerseCount;
                modifiedChapters[chapter_number_int] = modifiedChapter;
            }
        });

        return {
            addedVerseCount:totalAddedVerseCount,
            droppedVerseCount: totalDroppedVerseCount,
            modifiedBook: new Book( {chapters:{...this.chapters,...modifiedChapters}, filename:this.filename, toc3Name:this.toc3Name } ),
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
}