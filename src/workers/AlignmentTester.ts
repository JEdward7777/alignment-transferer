import { AbstractWordMapWrapper, MorphJLBoostWordMap } from "wordmapbooster/dist/boostwordmap_tools";
import { is_correct_prediction } from "wordmapbooster/dist/wordmap_tools";
import wordmapLexer, { Token } from "wordmap-lexer";
import { Alignment, Ngram, Suggestion } from "wordmap";
import { TSourceTargetAlignment } from "word-aligner-rcl";

interface TTestingWorkerData{
  alignmentTestingData: {
    [reference: string]: {
      sourceVerse: string; 
      targetVerse: string;
      alignments: TSourceTargetAlignment[];
    }
  },
  serializedTrainedModel: {
    [key: string]: any;
  };
}

export interface TWordAlignmentTestScore{
  num_manual_mappings: number;
  num_suggested_mappings: number;
  num_correct_mappings: number;
  ratio_correct: number;
}

export interface TWordAlignmentTestResults{
  testResults: {[reference: string]: TWordAlignmentTestScore };
  average_ratio_correct: number;
}

//TODOj need to make the sending side send the serialized model.

self.addEventListener('message', (event: { data: TTestingWorkerData }) => {

  console.log("Testing worker has started");


  //Convert the data into the structure which the trained model expects.
  const sourceVersesTokenized : {[reference: string]: Token[] } = {};
  const targetVersesTokenized : {[reference: string]: Token[] } = {};
  const refToAlignments: {[reference: string]: Alignment[] } = {};
  Object.entries(event.data.alignmentTestingData).forEach(([reference,training_data])=>{
    sourceVersesTokenized[reference] = wordmapLexer.tokenize(training_data.sourceVerse);
    targetVersesTokenized[reference] = wordmapLexer.tokenize(training_data.targetVerse);
    refToAlignments[reference] = training_data.alignments.map(alignment=>new Alignment( new Ngram( alignment.sourceNgram.map( n => new Token(n) ) ), new Ngram( alignment.targetNgram.map( n => new Token(n) )  ) ) );
  });


  //Restore the trained model.
  try{
    const wordAlignerModel = AbstractWordMapWrapper.load( event.data.serializedTrainedModel );


    //now need to run the alignments on all the test data and collect statistics on how correct the results are.
    let ratio_correct_sum : number = 0;
    const testResults = Object.fromEntries(Object.entries( refToAlignments ).map(([reference,manual_mappings])=>{
      //reference to tokens.
      const source_sentence_tokens = sourceVersesTokenized[reference];
      const target_sentence_tokens = targetVersesTokenized[reference];

      //Run the model.
      const suggestions: Suggestion[] = wordAlignerModel.predict( source_sentence_tokens, target_sentence_tokens );
      const firstPredictions = suggestions[0].getPredictions();

      //grade the results.
      let num_correct_mappings = 0;

      //Iterate through the suggestions given by the model
      for( let suggested_mapping_i = 0; suggested_mapping_i < firstPredictions.length; suggested_mapping_i++ ){
        const suggested_mapping = firstPredictions[suggested_mapping_i];

        if( is_correct_prediction( suggested_mapping, manual_mappings ) ){
          num_correct_mappings++;
        }
      }

      const ratio_correct = num_correct_mappings/manual_mappings.length;
      ratio_correct_sum += ratio_correct;

      if( global.gc ){
        global.gc();
      }

      return [reference, {
        num_manual_mappings:manual_mappings.length,
        num_suggested_mappings:firstPredictions.length,
        num_correct_mappings,
        ratio_correct,
      }];

    }));

    const average_ratio_correct = ratio_correct_sum/Object.keys(testResults).length;
    
    //Send the results.
    self.postMessage({message:'Worker has finished', results:{testResults, average_ratio_correct}, error:null});

  }catch(error){
    console.log(error);

    self.postMessage({message:'There was an error while restoring the trained model.', error:error});
  }
});
