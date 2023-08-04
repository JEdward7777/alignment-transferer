import { MorphJLBoostWordMap } from "wordmapbooster/dist/boostwordmap_tools";
import wordmapLexer, { Token } from "wordmap-lexer";
import { Alignment, Ngram } from "wordmap";
import { TSourceTargetAlignment } from "word-aligner-rcl";

interface TWorkerData{
  alignmentTrainingData: {
    [reference: string]: {
      sourceVerse: string; 
      targetVerse: string;
      alignments: TSourceTargetAlignment[];
    }
  }
}

self.addEventListener('message', (event: { data: TWorkerData }) => {

  console.log("Worker has started");


  //Convert the data into the structure which the training model expects.
  const sourceVersesTokenized : {[reference: string]: Token[] } = {};
  const targetVersesTokenized : {[reference: string]: Token[] } = {};
  const alignments: {[reference: string]: Alignment[] } = {};
  Object.entries(event.data.alignmentTrainingData).forEach(([reference,training_data])=>{
    sourceVersesTokenized[reference] = wordmapLexer.tokenize(training_data.sourceVerse);
    targetVersesTokenized[reference] = wordmapLexer.tokenize(training_data.targetVerse);
    alignments[reference] = training_data.alignments.map(alignment=>new Alignment( new Ngram( alignment.sourceNgram.map( n => new Token(n) ) ), new Ngram( alignment.targetNgram.map( n => new Token(n) )  ) ) );
  });


  //Create the training object.
  //There are several different word map classes,
  //and there are different hyper parameters which can be passed into it as well.
  const wordAlignerModel = new MorphJLBoostWordMap({ targetNgramLength: 5, warnings: false, forceOccurrenceOrder:false, train_steps:100 });
  wordAlignerModel.add_alignments_2(sourceVersesTokenized,targetVersesTokenized,alignments).then(()=>{
    
    //TODO, need to pass the model back to the other side.
    self.postMessage({message:'Worker has finished', trainedModel:wordAlignerModel.save()});
  }).catch((error)=>{
    console.log(error);

    //TODO, need to communicate error back to the other side.
    self.postMessage({message:'There was an error while training the word map.', error:error});
  })

});
