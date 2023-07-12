enum VerseState {
    Unpaired = 'unpaired',
    Unaligned = 'unaligned',
    AlignedTrain = 'aligned-train',
    AlignedTest = 'aligned-test',
}

export default class Verse {


    clone(): Verse{
        return new Verse();
    }


    addTargetUsfm( usfm_verse: any ): Verse{
        const newVerse: Verse = this.clone();


        //TODO: need to create ngrams etc from the data.

        return newVerse;
    }

    addSourceUsfm( usfm_verse: any ):Verse{
        const newVerse: Verse = this.clone();

        //TODO: need to use the received source usfm material.

        return newVerse;
    }

    static getListHeaders():string[]{
        return ["Verse"];
    }
    getListInfo( verse_num: number ):{ data:string[], keys:string[] }[]{
        return [{data:[ "" + verse_num ],keys:[""+verse_num]}];
    }
}
