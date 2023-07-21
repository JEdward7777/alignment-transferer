  /**
   * Checks to see if a specific string array references a given resource.
   * The locations in the string are [group][book name][chapter num][verse num]
   * The array only needs to be as long as the granularity.
   * @param currentSelection The selections to see if resourceKey is represented.
   * @param resourceKey A string array identifying resource at some granularity
   * @returns true if the referenced resource is selected.
   */
  export function isProvidedResourceSelected( currentSelection: string[][], resourceKey: string[] ):boolean{
    //iterate through the selected resources and return true on the first match.
    //If the selected resource array is shorter but what is there matches then it is still
    //a match.
    selectionLoop: for( const selected of currentSelection ){
      //if the resourceKey is shorter then the selected then it doesn't count
      //a chapter isn't selected if a verse is selected from it even if it is all the verses selected from it.
      if( selected.length > resourceKey.length ) continue selectionLoop;

      for( let i = 0; i < resourceKey.length; ++i ){
        //if we have matched this far and the iteration is longer then the selection
        //key then it is a valid selection.  Return true.
        if( i >= selected.length ) return true;

        //if we found a key that is different, then just continue with the next
        //selection option and see if it matches.
        if( selected[i] != resourceKey[i] ) continue selectionLoop;
      }
      //if we finish the loop, then it is all selected.
      return true;
    }
    return false;
  }


  export function isProvidedResourcePartiallySelected( currentSelection: string[][], resourceKey: string[] ):boolean{
    //iterate through the selected resources and return true on the first match.
    //If the selected resource array is shorter but what is there matches then it is still
    //a match.
    selectionLoop: for( const selected of currentSelection ){

      for( let i = 0; i < resourceKey.length || i < selected.length; ++i ){
        //if we have matched this far and the iteration is longer then the selection
        //key then it is a valid selection.  Return true.
        if( i >= selected.length ) return true;

        //if we have matched this far and the iteration is longer then the
        //resource key then it is at least a partial selection.  Return true.
        if( i >= resourceKey.length ) return true;

        //if we found a key that is different, then just continue with the next
        //selection option and see if it matches.
        if( selected[i] != resourceKey[i] ) continue selectionLoop;
      }
      //if we finish the loop, then it is all selected.
      return true;
    }
    return false;

  }
