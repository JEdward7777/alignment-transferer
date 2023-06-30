import React, {useMemo, useState, useEffect} from 'react';
import 'react-data-grid/lib/styles.css';
import DataGrid from 'react-data-grid';
import type { Column, SortColumn } from 'react-data-grid';


interface DataObject {
  group_name: string;
  book_name: string;
}

interface TableProps {
  resources: {
    [key: string]: {
      [key: string]: any;
    };
  };
};


export default function List({ resources }: TableProps) {

  //need to slice and dice the resources so that it looks like we want it in the table.
  const [data, setData] = useState<DataObject[]>([]);

  useEffect(() => {
    const newData: DataObject[] = [];

    for( const group_name in resources ) if ( resources.hasOwnProperty(group_name) ){
      const group = resources[group_name];
      for( const book_name in group ) if ( group.hasOwnProperty( book_name ) ){
        const book = group[book_name];
        newData.push( { group_name, book_name });
      }
    }

    setData(newData);
  },[resources]);


  const columns = [
    { key: 'group_name', name: 'Group' },
    { key: 'book_name', name: 'Book' },
  ];

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
    columns={columns} 
    rows={sortedData} 
    sortColumns={sortColumns}
    onSortColumnsChange={setSortColumns}
    defaultColumnOptions={{
      sortable: true,
    }}
    
    />;
}