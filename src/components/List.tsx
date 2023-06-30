import React from 'react';
import { useTable, useSortBy, useFilters, useRowSelect, Column } from 'react-table';
import { FaSortUp, FaSortDown } from 'react-icons/fa';
import 'tailwindcss/tailwind.css';

interface DataObject {
  group: string;
  toc3: string;
}

interface TableProps {
  data: DataObject[];
}

export default function List({ data }: TableProps) {
  const columns: Column<DataObject>[] = React.useMemo(
    () => [
      {
        Header: 'Group',
        accessor: 'group',
        Filter: DefaultColumnFilter,
        width: 300,
      },
      {
        Header: 'TOC3',
        accessor: 'toc3',
        Filter: DefaultColumnFilter,
        width: 150,
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    // @ts-ignore
    selectedFlatRows, 
  } = useTable<DataObject>(
    {
      columns,
      data,
    },
    useFilters,
    useSortBy,
    useRowSelect
  );

  return (
    <table {...getTableProps()} className="table">
      <thead>
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <th
                {...column.getHeaderProps(column.getSortByToggleProps())}
                className="cursor-pointer"
              >
                {column.render('Header')}
                {column.isSorted ? (
                  column.isSortedDesc ? (
                    <FaSortDown className="inline-block ml-1" />
                  ) : (
                    <FaSortUp className="inline-block ml-1" />
                  )
                ) : null}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row) => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map((cell) => (
                <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// DefaultColumnFilter component for text-based filtering
const DefaultColumnFilter = ({
  column: { filterValue, setFilter },
}) => {
  return (
    <input
      type="text"
      value={filterValue || ''}
      onChange={(e) => setFilter(e.target.value)}
      className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none"
      placeholder="Filter..."
    />
  );
};
