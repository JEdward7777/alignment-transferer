import React, {useMemo, useState} from 'react';
import 'react-data-grid/lib/styles.css';
import DataGrid from 'react-data-grid';
import type { Column, SortColumn } from 'react-data-grid';


interface DataObject {
  group: string;
  toc3: string;
}

interface TableProps {
  data: DataObject[];
}


export default function List({ data }: TableProps) {
  const columns = [
    { key: 'group', name: 'Group' },
    { key: 'toc3', name: 'Name' },
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