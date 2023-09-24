# Alignment Transferer
Alignment Transferer is a react app which demos using [wordmapbooster](https://github.com/JEdward7777/wordmapbooster) and [suggesting-word-aligner-rcl](https://github.com/JEdward7777/word-aligner-rcl/tree/suggesting-word-aligner) to preform word alignments between source and target translations saved in usfm.

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

Install dependencies with npm using --legacy-peer-deps

```bash
npm i --legacy-peer-deps
```

The dev server can be started with 

```bash
npm run dev
```

The server then shows up at [http://localhost:3003](http://localhost:3003)

There is also a [Alignment Transferer netlify demo](https://alignment-transferer.netlify.app/).


# Data
Source and target language data is loaded into the tool using usfm data in [Unfolding Word](https://www.unfoldingword.org/) usfm alignment format as defined by [usfm.js](https://github.com/unfoldingWord/usfm-js).

### English
The [unfoldingWord Literal Text](https://git.door43.org/unfoldingWord/en_ult#unfoldingword-literal-text-english) is an example USFM target with alignments for English.  Here is a direct link for [Matthew](https://git.door43.org/unfoldingWord/en_ult/raw/branch/master/41-MAT.usfm).  Right click and select `Save As`.

### Greek
The [unfoldingWord Greek New Testament](https://git.door43.org/unfoldingWord/el-x-koine_ugnt#unfoldingword-greek-new-testament-ugnt) is an example USFM source in Greek.  Here is a direct link for [Matthew](https://git.door43.org/unfoldingWord/en_ult/raw/branch/master/41-MAT.usfm).  Right click and select `Save As`.

### Spanish
The [Texto Puente Literal](https://git.door43.org/Es-419_gl/es-419_glt#texto-puente-literal-idiomas-puentes) is an example USFM target in Spanish.

### Hebrew
The [unfoldingWord Hebrew Bible](https://git.door43.org/unfoldingWord/hbo_uhb#unfoldingword-hebrew-bible) is an example USFM source in Hebrew.