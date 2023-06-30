import React, {useMemo, useState, useEffect} from 'react';
import 'react-data-grid/lib/styles.css';
import DataGrid from 'react-data-grid';
import type { Column, SortColumn } from 'react-data-grid';


interface DataObject {
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
};

interface KeyName{
  key: string;
  name: string;
}

function only_numbers(to_filter: string[]): string[] {
  return to_filter.reduce((acc: string[], curr: string) => {
    const parsedNumber = parseInt(curr);
    if (!isNaN(parsedNumber)) {
      acc.push(curr);
    }
    return acc;
  }, []);
}

export default function List({ resources, scope }: TableProps) {

  //need to slice and dice the resources so that it looks like we want it in the table.
  const [data, setData] = useState<DataObject[]>([]);

  useEffect(() => {
    const newData: DataObject[] = [];


    for( const group_name in resources ) if ( resources.hasOwnProperty(group_name) ){
      const group = resources[group_name];

      if( scope == "Group" ){
        newData.push( {group_name, num_books: Object.keys(group).length,  })
      }else{
        for( const book_name in group ) if ( group.hasOwnProperty( book_name ) ){
          const book = group[book_name];

          if( scope == "Book" ){
            newData.push( {group_name, book_name, num_chapters: only_numbers(Object.keys(book.chapters)).length } );
          }else{
            for( const chapter_number of only_numbers(Object.keys(book.chapters)) ){
              const chapter = book.chapters[chapter_number];

              if( scope == "Chapter" ){
                newData.push( {group_name, book_name, chapter_number: parseInt(chapter_number), num_verses: only_numbers(Object.keys(chapter)).length })
              }else{

                for( const verse_number of only_numbers(Object.keys(chapter))){
                  newData.push( {group_name, book_name, chapter_number: parseInt(chapter_number), verse_number: parseInt(verse_number)})
                }
              }

            }
          }

        }
      }
    }

    setData(newData);

  },[resources,scope]);


  //compile the names of the columns.
  const [columns, setColumns] = useState<KeyName[]>([]);
  useEffect(() => {
    const newColumns: KeyName[] = [];
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
    
    />;
}