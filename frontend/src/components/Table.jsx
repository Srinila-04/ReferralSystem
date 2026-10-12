import React from 'react';

const Table = ({ columns, data, keyField = 'id', onRowClick, children, className = '' }) => {
  if (children) {
    return (
      <div className={`overflow-x-auto ${className}`}>
        <table className="w-full text-left border-collapse">
          {children}
        </table>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            {columns?.map((col, idx) => (
              <th
                key={idx}
                className={`py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {!data || data.length === 0 ? (
            <tr>
              <td colSpan={columns?.length || 1} className="py-8 text-center text-slate-500 text-sm">
                No data available
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row[keyField]}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}
              >
                {columns.map((col, idx) => (
                  <td key={idx} className={`py-4 px-4 text-sm text-slate-700 ${col.cellClassName || ''}`}>
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

Table.Header = ({ children, className = '' }) => (
  <thead className={`border-b border-slate-200 bg-slate-50/50 ${className}`}>{children}</thead>
);

Table.Body = ({ children, className = '' }) => (
  <tbody className={`divide-y divide-slate-100 ${className}`}>{children}</tbody>
);

Table.Row = ({ children, className = '', onClick }) => (
  <tr
    onClick={onClick}
    className={`transition-colors ${onClick ? 'cursor-pointer hover:bg-slate-50' : ''} ${className}`}
  >
    {children}
  </tr>
);

Table.Head = ({ children, className = '' }) => (
  <th className={`py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider ${className}`}>
    {children}
  </th>
);

Table.Cell = ({ children, className = '', colSpan }) => (
  <td colSpan={colSpan} className={`py-4 px-4 text-sm text-slate-700 ${className}`}>
    {children}
  </td>
);

export default Table;
