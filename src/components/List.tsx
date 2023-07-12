import React, {useMemo, useState, useEffect} from 'react';
import 'react-data-grid/lib/styles.css';
import DataGrid, {SelectColumn} from 'react-data-grid';
import type { Column, SortColumn } from 'react-data-grid';
import { only_numbers } from '@/utils/usfm_misc';
import GroupCollection from '@/shared/GroupCollection';
import Group from '@/shared/Group';
import Book from '@/shared/Book';
import Chapter from '@/shared/Chapter';



interface TableProps {
  groupCollection: GroupCollection
  scope: string
  setCurrentSelection: (newCurrentSelection: string[][] ) => void;
};


export default function List({ groupCollection, scope, setCurrentSelection }: TableProps) {

  //need to slice and dice the resources so that it looks like we want it in the table.
  const [data, setData] = useState<{[key:string]:string}[]>([]);

  //compile and maintain a reverse index which will go from
  //row number to indexing the resource(s) the row references.
  const [reverseIndex, setReverseIndex] = useState<{[key: number]: string[]}>([]);

  //This identifies which rows are selected in the list.  It needs to be reversed
  //using the reverseIndex to figure out what resources are selected.
  const [selectedRows, _setSelectedRows] = useState((): ReadonlySet<number> => new Set());

  //tap into the setSelectionRows callback so we can harvest the information
  const setSelectedRows = ( selectionsRowIds: ReadonlySet<number>): void => {
    _setSelectedRows(selectionsRowIds);

    //convert into resource string indexing
    const selectionsStrings: string[][] = Array.from(selectionsRowIds).map( (id:number):string[] => reverseIndex[id] || [] ).filter((arr: string[]) => arr.length > 0);
    setCurrentSelection(selectionsStrings);
  }

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
  const [columns, setColumns] = useState<Column<{[key:string]:string}>[]>([]);
  useEffect(() => {
    const newColumns: Column<{[key:string]:string}>[] = [SelectColumn];
    GroupCollection.getListHeaders(scope).forEach( (header) => {
      newColumns.push( {key: header, name: header } );
    });
    setColumns( newColumns );
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


  return <DataGrid 
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
    />;
}