import React, {useMemo, useState, useEffect} from 'react';
import 'react-data-grid/lib/styles.css';
import DataGrid, {SelectColumn} from 'react-data-grid';
import type { Column, SortColumn } from 'react-data-grid';


interface DataObject {
  id: number;

  group_name: string;

  num_books?: number;
  book_name?: string;

  num_chapters?: number;
  chapter_number?: number;

  num_verses?: number;
  verse_number?: number;
}

interface TableProps {
  resources: {
    [key: string]: {
      [key: string]: any;
    };
  };
  scope: string
  setCurrentSelection: (newCurrentSelection: string[][] ) => void;
};


function only_numbers(to_filter: string[]): string[] {
  return to_filter.reduce((acc: string[], curr: string) => {
    const parsedNumber = parseInt(curr);
    if (!isNaN(parsedNumber)) {
      acc.push(curr);
    }
    return acc;
  }, []);
}

export default function List({ resources, scope, setCurrentSelection }: TableProps) {

  //need to slice and dice the resources so that it looks like we want it in the table.
  const [data, setData] = useState<DataObject[]>([]);

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
    const newData: DataObject[] = [];
    const newReverseIndex: {[key: number]: Array<string>} = {};

    let id = 0;

    for( const group_name in resources ) if ( resources.hasOwnProperty(group_name) ){
      const group = resources[group_name];

      if( scope == "Group" ){
        newData.push( {id, group_name, num_books: Object.keys(group).length,  })
        newReverseIndex[id++] = [group_name];
      }else{
        for( const book_name in group ) if ( group.hasOwnProperty( book_name ) ){
          const book = group[book_name];

          if( scope == "Book" ){
            newData.push( {id, group_name, book_name, num_chapters: only_numbers(Object.keys(book.chapters)).length } );
            newReverseIndex[id++] = [group_name,book_name];
          }else{
            for( const chapter_number of only_numbers(Object.keys(book.chapters)) ){
              const chapter = book.chapters[chapter_number];

              if( scope == "Chapter" ){
                newData.push( {id, group_name, book_name, chapter_number: parseInt(chapter_number), num_verses: only_numbers(Object.keys(chapter)).length })
                newReverseIndex[id++] = [group_name,book_name,chapter_number];
              }else{

                for( const verse_number of only_numbers(Object.keys(chapter))){
                  newData.push( {id,group_name, book_name, chapter_number: parseInt(chapter_number), verse_number: parseInt(verse_number)})
                  newReverseIndex[id++] = [group_name,book_name,chapter_number,verse_number];
                }
              }

            }
          }

        }
      }
    }

    setData(newData);
    setReverseIndex(newReverseIndex);

  },[resources,scope]);




  //compile the names of the columns.
  const [columns, setColumns] = useState<Column<DataObject>[]>([]);
  useEffect(() => {
    const newColumns: Column<DataObject>[] = [SelectColumn];
    //newColumns.push( {key: 'id', name: 'ID'})

    newColumns.push( {key: 'group_name', name: 'Group'} );
    if( scope == "Group" ){
      newColumns.push( {key: 'num_books', name: 'Books'} );
    }else{
      newColumns.push( {key: 'book_name', name: 'Book' } );
      if( scope == "Book" ){
        newColumns.push( {key: 'num_chapters', name: 'Chapters'} );
      }else{
        newColumns.push( {key: 'chapter_number', name: 'Chapter' } );
        if( scope == "Chapter" ){
          newColumns.push( {key: 'num_verses', name: 'Verses' } );
        }else{
          newColumns.push( {key: 'verse_number', name: 'Verse'} );
        }
      }
    }
    setColumns( newColumns );
  },[scope]);
  
  //have a state for the sortedness of the container
  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);

  //actually sort the data.
  const sortedData = useMemo((): readonly DataObject[] => {
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
    rowKeyGetter={ (row) => row.id }
    selectedRows={selectedRows}
    onSelectedRowsChange={setSelectedRows}
    />;
}