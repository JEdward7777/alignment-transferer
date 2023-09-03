import { MorphJLBoostWordMap } from "wordmapbooster/dist/boostwordmap_tools";
import wordmapLexer, { Token } from "wordmap-lexer";
import { Alignment, Ngram } from "wordmap";
import { TTrainingAndTestingData } from "./WorkerComTypes";
import { updateTokenLocations } from "wordmapbooster/dist/wordmap_tools";



self.addEventListener('message', (event: { data: TTrainingAndTestingData }) => {

  console.log("Training worker has started");


  //Convert the data into the structure which the training model expects.
  const sourceVersesTokenized : {[reference: string]: Token[] } = {};
  const targetVersesTokenized : {[reference: string]: Token[] } = {};
  const alignments: {[reference: string]: Alignment[] } = {};
  Object.entries(event.data.alignments).forEach(([reference,training_data])=>{
    // sourceVersesTokenized[reference] = wordmapLexer.tokenize(training_data.sourceVerse);
    // targetVersesTokenized[reference] = wordmapLexer.tokenize(training_data.targetVerse);
    sourceVersesTokenized[reference] = training_data.sourceVerse.map( n => new Token(n) );
    targetVersesTokenized[reference] = training_data.targetVerse.map( n => new Token(n) );
    updateTokenLocations(sourceVersesTokenized[reference])
    updateTokenLocations(targetVersesTokenized[reference])

    //TODOj: need to make sure the tokens here have position information in them.
    alignments[reference] = training_data.alignments.map(alignment=>new Alignment( new Ngram( alignment.sourceNgram.map( n => new Token(n) ) ), new Ngram( alignment.targetNgram.map( n => new Token(n) )  ) ) );
  });


  const sourceCorpusTokenized : {[reference: string]: Token[] } = {};
  const targetCorpusTokenized : {[reference: string]: Token[] } = {};
  Object.entries(event.data.corpus).forEach(([reference,training_data])=>{
    sourceCorpusTokenized[reference] = training_data.sourceTokens.map( n => new Token(n) );
    targetCorpusTokenized[reference] = training_data.targetTokens.map( n => new Token(n) );
    updateTokenLocations(sourceCorpusTokenized[reference])
    updateTokenLocations(targetCorpusTokenized[reference])
  })


  //Create the training object.
  //There are several different word map classes,
  //and there are different hyper parameters which can be passed into it as well.
  const wordAlignerModel = new MorphJLBoostWordMap({ targetNgramLength: 5, warnings: false, forceOccurrenceOrder:false, train_steps:1000 });
  wordAlignerModel.appendKeyedCorpusTokens(sourceCorpusTokenized,targetCorpusTokenized);
  //Do a test to see if adding the alignment stuff as corpus as well helps.
  wordAlignerModel.appendKeyedCorpusTokens(sourceVersesTokenized,targetVersesTokenized);

  wordAlignerModel.add_alignments_2(sourceVersesTokenized,targetVersesTokenized,alignments).then(()=>{
    
    self.postMessage({message:'Worker has finished', trainedModel:wordAlignerModel.save()});
  }).catch((error)=>{
    console.log(error);

    //TODO, need to communicate error back to the other side.
    self.postMessage({message:'There was an error while training the word map.', error:error});
  })

});

//TODOj: I am going to need to modify the wordmap saver restorer to keep the information from learning corpus.
