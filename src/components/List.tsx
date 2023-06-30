import React from 'react';
import 'react-data-grid/lib/styles.css';
import DataGrid from 'react-data-grid';


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
    { key: 'toc3', name: 'Name' }
  ];

  return <DataGrid columns={columns} rows={data} />;
}