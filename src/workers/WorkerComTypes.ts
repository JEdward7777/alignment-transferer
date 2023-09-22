import { TSourceTargetAlignment, TWord } from "suggesting-word-aligner-rcl";


export interface TTrainingAndTestingData {
    alignments: {
        [key: string]: {
            targetVerse: TWord[];
            sourceVerse: TWord[];
            alignments: TSourceTargetAlignment[];
        }
    };
    corpus: {
        [key: string]: {
            sourceTokens: TWord[];
            targetTokens: TWord[];
        }
    };
}

export interface TTestingWorkerData{
    data: TTrainingAndTestingData;
    serializedModel: {[key: string]: any};
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