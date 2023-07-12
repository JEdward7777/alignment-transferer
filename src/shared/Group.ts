import { is_number, parseUsfmHeaders } from "@/utils/usfm_misc";
import Book from "./Book";

export default class Group {
    books: { [key: string]: Book };

    constructor( newBooks?: {[key:string]: Book}) {
        this.books = newBooks || {};
    }

    hasBook( usfmBookName: string ): boolean{
        return usfmBookName in this.books;
    }

    /**
     * This adds usfm to this group collection, but does so without
     * changing the original group collection in order to make it react compatible.
     */
    addTargetUsfm( usfm_json: any ): Group {
        const newBooks: {[key:string]:Book} = {};

        Object.entries(usfm_json).forEach(([filename,usfm_book])=>{
            const usfmHeaders = parseUsfmHeaders((usfm_book as any).headers);
            const newBook = this.books[usfmHeaders.h] || new Book();
            newBooks[usfmHeaders.h] = newBook.addTargetUsfm({filename,usfm_book,toc3Name:usfmHeaders.toc3});
        });

        return new Group({...this.books, ...newBooks});
    }

    addSourceUsfm( {usfm_json: usfm_json,isResourceSelected,group_name}:{usfm_json:any,isResourceSelected:( resourceKey: string[] )=>boolean,group_name:string} ): {addedVerseCount:number,droppedVerseCount:number,newGroup:Group }{
        const modifiedBooks: {[key:string]:Book} = {};

        //rehash our books by their toc3.
        const toc3_books: {[key:string]:[bookName:string,book:Book]} = Object.fromEntries( Object.entries(this.books ).map( ([bookName,book]:[string,Book]) => {
            return [book.toc3Name,[bookName,book]];
        }));


        let totalAddedVerseCount:number = 0;
        let totalDroppedVerseCount:number = 0;
        //Now run through each of the imported books and match them up.
        Object.entries(usfm_json).forEach( ([filename,usfm_book]:[book_name:string,book_json:any]) => {
            const parsedUsfmHeaders = parseUsfmHeaders(usfm_book.headers);
            
            if( parsedUsfmHeaders.toc3 in toc3_books ){
                const [bookName,book]:[string,Book] = toc3_books[parsedUsfmHeaders.toc3];
                const{ addedVerseCount, droppedVerseCount, modifiedBook } = book.addSourceUsfm( {usfm_book, isResourceSelected, group_name, book_name:bookName} )
                totalAddedVerseCount += addedVerseCount;
                totalDroppedVerseCount += droppedVerseCount;
                modifiedBooks[bookName] = modifiedBook;
            }else{
                //count the verses in the book
                let nonMatchedVerseCount = 0;
                Object.entries(usfm_book.chapters).forEach(([chapter_num,chapter_json]) => {
                    if( is_number(chapter_num) ){
                        Object.entries(chapter_json as any).forEach(([verse_num,verse_json]) => {
                            if( is_number( verse_num ) ){
                                nonMatchedVerseCount += 1;
                            }
                        });
                    }
                });
                totalDroppedVerseCount += nonMatchedVerseCount;
            }
        })
        return {addedVerseCount:totalAddedVerseCount,
            droppedVerseCount:totalDroppedVerseCount,
            newGroup:new Group({ ...this.books, ...modifiedBooks}) };
    }

    static getListHeaders( scope:string ):string[]{
        if( scope == "Group" ) return ["Group", "Books" ];
        return ["Group"].concat( Book.getListHeaders(scope) );
    }

    getListInfo( group_name: string, scope:string ):{ data:string[], keys:string[] }[]{
        const result: { data:string[], keys:string[] }[] = [];
        if( scope == "Group" ){
            result.push({
                data:[group_name,""+Object.values(this.books).length],
                keys:[group_name],
            });
        }else{
            Object.entries(this.books).forEach(([book_name,book])=>{
                book.getListInfo(book_name,scope).forEach((subResult) => {
                    result.push( {
                        data: [group_name].concat(subResult.data),
                        keys: [group_name].concat(subResult.keys),
                    })
                });
            });
        }
        return result;
    }
}