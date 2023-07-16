import { is_number } from "@/utils/usfm_misc";
import Verse from "./Verse";
import { TState } from "@/components/WordAlignerDialog";

export default class Chapter {
    verses: { [key: number]: Verse };

    constructor( newVerses: {[key:number]: Verse} = {} ) {
        this.verses = newVerses;
    }

    addTargetUsfm( usfm_chapter: any ): Chapter{
        const newVerses: {[key:number]:Verse} = {};

        Object.entries(usfm_chapter).forEach( ([verse_number_string,usfm_verse]:[string,any]) => {
            if( is_number(verse_number_string) ){
                const verse_number_int = parseInt( verse_number_string );
                const newVerse = this.verses[verse_number_int] || new Verse();
                newVerses[verse_number_int] = newVerse.addTargetUsfm( usfm_verse );
            }
        });

        return new Chapter( {...this.verses, ...newVerses} );
    }
    addSourceUsfm( {usfm_chapter, isResourceSelected, group_name, book_name, chapter_number}: {usfm_chapter:any, isResourceSelected:( resourceKey: string[] )=>boolean, group_name:string, book_name:string, chapter_number:string }):{addedVerseCount:number, droppedVerseCount:number, modifiedChapter:Chapter }{
        const modifiedVerses: {[key:number]:Verse} = {};
        let totalAddedVerseCount = 0;
        let totalDroppedVerseCount = 0;

        Object.entries(usfm_chapter).forEach( ([verse_number_string,usfm_verse]:[string,any]) => {
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
            modifiedChapter:new Chapter( {...this.verses, ...modifiedVerses} ),
        }
    }

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

    updateAlignmentState( alignmentDialogResult: any, selector: string[] ): Chapter{
        if( selector.length < 1 ) return this;
        const verse_num: number = parseInt( selector[0] );
        if( !(verse_num in this.verses) ) return this;

        const newVerse = this.verses[verse_num].updateAlignmentState(alignmentDialogResult );

        const newVerses = { ...this.verses, [verse_num]: newVerse };
        return new Chapter( newVerses );
    }
}