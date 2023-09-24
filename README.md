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


Source and target language data is loaded into the tool using usfm data in [Unfolding Word](https://www.unfoldingword.org/) usfm alignment format as defined by [usfm.js](https://github.com/unfoldingWord/usfm-js).