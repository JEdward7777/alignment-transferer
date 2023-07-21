import React, {useMemo, useState, useEffect} from 'react';
import 'react-data-grid/lib/styles.css';
import DataGrid, {SelectColumn, } from 'react-data-grid';
import type { Column, SortColumn, CellClickArgs,  } from 'react-data-grid';
import GroupCollection from '@/shared/GroupCollection';
import { isProvidedResourcePartiallySelected, isProvidedResourceSelected } from '@/utils/misc';



interface TableProps {
  groupCollection: GroupCollection
  scope: string
  currentSelection: string[][];
  setCurrentSelection: (newCurrentSelection: string[][] ) => void;
  onEntryDoubleClick: (currentTarget: string[] ) => void;
};


export default function List({ groupCollection, scope, currentSelection, setCurrentSelection, onEntryDoubleClick }: TableProps) {

  //need to slice and dice the resources so that it looks like we want it in the table.
  const [data, setData] = useState<{[key:string]:string}[]>([]);

  //compile and maintain a reverse index which will go from
  //row number to indexing the resource(s) the row references.
  const [reverseIndex, setReverseIndex] = useState<{[key: number]: string[]}>([]);

  //This identifies which rows are selected in the list.  It needs to be reversed
  //using the reverseIndex to figure out what resources are selected.
  const [selectedRows, _setSelectedRows] = useState((): ReadonlySet<number> => new Set());

  //This is used by the React Data Grid to know what the headers are of each column.
  const [columns, setColumns] = useState<Column<{[key:string]:string}>[]>([]);

  //This is used to be able to force the grid to redraw when we need to.
  const [key, setKey] = useState(0);

  useEffect(() => {
    const newData: {[key:string]:string}[] = [];
    const newReverseIndex: {[key: number]: Array<string>} = {};

    let id = 0;

    const listHeaders = GroupCollection.getListHeaders(scope);
    const listInfos = groupCollection.getListInfo(scope);
    listInfos.forEach( (listInfo) => {
      const dataObject: {[key:string]:string} = { id:"" +id };
      for( let i = 0; i < listHeaders.length; ++i ){
        dataObject[listHeaders[i]] = listInfo.data[i];
      }
      newData.push(dataObject);

      newReverseIndex[id] = listInfo.keys;
      id++;
    });

    setData(newData);
    setReverseIndex(newReverseIndex);

  },[groupCollection,scope]);


  //compile the names of the columns.
  useEffect(() => {
    const newColumns: Column<{[key:string]:string}>[] = [SelectColumn];
    GroupCollection.getListHeaders(scope).forEach( (header) => {
      newColumns.push( {key: header, name: header } );
    });
    setColumns( newColumns );
    setKey((prevKey) => prevKey + 1);
  },[scope]);
  
  //have a state for the order of the container
  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);

  //actually sort the data.
  const sortedData = useMemo((): readonly {[key:string]:string}[] => {
    if (sortColumns.length === 0) return data;

    return [...data].sort((a, b) => {
      for (const sort of sortColumns) {
        let compResult = 0;
        if( (a as any)[sort.columnKey] < (b as any)[sort.columnKey] ){
          compResult = -1;
        }else if( (a as any)[sort.columnKey] > (b as any)[sort.columnKey] ){
          compResult = 1;
        }
        if (compResult !== 0) {
          return sort.direction === 'ASC' ? compResult : -compResult;
        }
      }
      return 0;
    });
  }, [data, sortColumns]);


  const onCellDoubleClick = ( target: CellClickArgs<{[key:string]:string}> ) => {
    onEntryDoubleClick( reverseIndex[parseInt(target.row.id)] );
  };

  //tap into the setSelectionRows callback so we can harvest the information
  const setSelectedRows = ( selectionsRowIds: ReadonlySet<number>): void => {
    _setSelectedRows(selectionsRowIds);

    //convert into resource string indexing
    const selectionsStrings: string[][] = Array.from(selectionsRowIds).map( (id:number):string[] => reverseIndex[id] || [] ).filter((arr: string[]) => arr.length > 0);
    setCurrentSelection(selectionsStrings);
  }

  //have a feedback so that if the currentSelection in the App changes that the proper rows in the list get
  //selected.
  useEffect(() => {
    let somethingChanged = false;
    let needToPushChangesBack = false;

    //filter through the revereIndex and keep each entry which is selected.
    //then map it to just the indexes.
    const newSelectedRows = new Set(Object.entries(reverseIndex).filter( ( [rowId, resourceKey ]:[string, string[]] ):boolean =>{
      //need to see if resourceKey is in the currentSelection.
      if( isProvidedResourceSelected( currentSelection, resourceKey ) ) {
        if( !selectedRows.has( parseInt(rowId) ) ) somethingChanged = true;
        return true;
      }
      if( isProvidedResourcePartiallySelected( currentSelection, resourceKey ) ) {
        //if we are partially selected, and not fully selected, we need to say something changed just because this needs to be flushed the other way.
        needToPushChangesBack = true;
        somethingChanged = true;
      }
      if( selectedRows.has( parseInt(rowId) ) ) somethingChanged = true;
      return false;
    }).map( ( [rowId, resourceKey ]:[string, string[]] ) => {
      return parseInt(rowId);
    }));

    if( somethingChanged ){
      if( needToPushChangesBack ){
        setSelectedRows( newSelectedRows );
      }else{
        _setSelectedRows( newSelectedRows );
      }
    }

  }, [currentSelection,reverseIndex]);

  return <DataGrid 
    key={key}
    className="flex-grow w-full"
    columns={columns} 
    rows={sortedData} 
    sortColumns={sortColumns}
    onSortColumnsChange={setSortColumns}
    defaultColumnOptions={{
      sortable: true,
    }}
    rowKeyGetter={ (row) => parseInt(row.id) }
    selectedRows={selectedRows}
    onSelectedRowsChange={setSelectedRows}
    onCellDoubleClick={onCellDoubleClick}
    />;
}