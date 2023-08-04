import React, { useEffect, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import { RxLink2, RxLinkBreak2 } from 'react-icons/rx'
import { SuggestingWordAligner, TAlignerData, TReference, TWord } from 'word-aligner-rcl'
import Button from '@mui/material/Button'
import Paper, { PaperProps } from '@mui/material/Paper';
import Draggable from 'react-draggable'

const alignmentIconStyle = { marginLeft:'50px' }

export interface TWordAlignerAlignment{
  sourceNgram: TWord[];
  targetNgram: TWord[];
}

export interface TWordAlignerAlignmentResult{
  targetWords: TWord[];
  verseAlignments: TWordAlignerAlignment[];
}


export interface TState{
  aligned: boolean
  sourceLanguage: string
  targetLanguage: string
  reference: TReference;
  alignerData: TAlignerData;
}

interface TActions{
  saveAlignment: ( results: TWordAlignerAlignmentResult | null ) => void;
  cancelAlignment: () => void;
  onAlignmentsChange: ( results: TWordAlignerAlignmentResult) => boolean;
}

export interface TAlignerStatus{
  actions: TActions;
  state: TState;
}

interface WordAlignerDialogProps{
    alignerStatus: TAlignerStatus | null,
    height: number,
    translate: (key:string)=>string,
}


function PaperComponent(props: PaperProps) {
  return (
    <Draggable
      handle="#draggable-aligner-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} />
    </Draggable>
  )
}

// popup dialog for user to align verse
export const WordAlignerDialog: React.FC<WordAlignerDialogProps> = ({
  alignerStatus,
  height,
  translate,
}) => {
  const [alignmentChange, setAlignmentChange] = useState<TWordAlignerAlignmentResult|null>(null)
  const [aligned, setAligned] = useState(false)

  /**
   * called on every alignment change.  We save this new alignment state so that it can be applied if user clicks accept.
   *   We also update the aligned status so that the UI can be updated dynamically
   * @param {object} results
   */
  function onAlignmentChange(results: TWordAlignerAlignmentResult) {
    const onAlignmentsChange = alignerStatus?.actions?.onAlignmentsChange;
    const alignmentComplete = onAlignmentsChange?.(results)
    setAlignmentChange(results) // save the most recent change
    if (alignmentComplete !== undefined) {
      setAligned(alignmentComplete) // update alignment complete status
    } else {
      setAligned(false)
    }
  }

  function showPopover(PopoverTitle: string, wordDetails: string, positionCoord: string, rawData: any){
    console.log(`showPopover`, rawData);
  }

  const alignerData = alignerStatus?.state?.alignerData

  useEffect(() => { // set initial aligned state
    if (alignerData) {
      setAligned(!!alignerStatus?.state?.aligned)
    }
  }, [alignerData, alignerStatus])

  const {
    chapter,
    verse,
  } = alignerStatus?.state?.reference || {}
  const title = `${chapter}:${verse}`

  function cancelAlignment() {
    const cancelAlignment = alignerStatus?.actions?.cancelAlignment
    cancelAlignment?.()
    setAlignmentChange(null)
  }

  function saveAlignment() {
    const saveAlignment = alignerStatus?.actions?.saveAlignment
    saveAlignment?.(alignmentChange)
    setAlignmentChange(null)
  }

  return (
    <>
      <Dialog
        fullWidth={true}
        maxWidth={'lg'}
        onClose={() => {}}
        open={!!alignerData}
        PaperComponent={PaperComponent}
        aria-labelledby="draggable-aligner-dialog-title"
      >
        <DialogTitle style={{ cursor: 'move' }} id="draggable-aligner-dialog-title" >
          <span>
            {`Aligning: ${title}`}
            {aligned? (
              <RxLink2 style={alignmentIconStyle} id='valid_icon' color='#BBB' />
            ) : (
              <RxLinkBreak2 style={alignmentIconStyle} id='invalid_icon' color='#000' />
            )}
          </span>
        </DialogTitle>
        <div style={{ width : `95%`, margin: '10px' }} >
          { ( alignerData != null && 
            alignerData.alignments != null && 
            alignerData.wordBank != null &&
            alignerStatus != null &&
            alignerStatus.state != null) && 
              <SuggestingWordAligner
                style={{ maxHeight: `${height}px`, overflowY: 'auto' }}
                verseAlignments={alignerData?.alignments || null}
                targetWords={alignerData?.wordBank || null}
                translate={translate}
                contextId={{ reference: alignerStatus?.state?.reference }}
                targetLanguage={alignerStatus?.state?.targetLanguage}
                targetLanguageFont={''}
                sourceLanguage={alignerStatus?.state?.sourceLanguage}
                showPopover={showPopover}
                lexicons={{}}
                loadLexiconEntry={(arg)=>{ return{} }}
                onChange={onAlignmentChange}
                />
          }
        </div>
        <span style={{ width : `95%`, height: '60px', display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
          <Button variant="outlined" style={{ margin: '10px 100px' }} onClick={cancelAlignment}>
            Cancel
          </Button>
          <Button variant="outlined" style={{ margin: '10px 100px' }} onClick={saveAlignment}>
            Accept
          </Button>
        </span>
      </Dialog>
    </>
  )
};