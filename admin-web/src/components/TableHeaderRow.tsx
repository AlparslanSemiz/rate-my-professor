import type { CSSProperties } from 'react'

interface TableHeaderRowProps {
  columns: readonly string[]
}

const headerRowStyle: CSSProperties = {
  borderBottom: '1px solid #21262d',
}

const headerCellStyle: CSSProperties = {
  padding: '11px 20px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  whiteSpace: 'nowrap',
}

export default function TableHeaderRow({ columns }: TableHeaderRowProps) {
  return (
    <thead>
      <tr style={headerRowStyle}>
        {columns.map((column) => (
          <th
            key={column}
            scope="col"
            style={headerCellStyle}
          >
            {column}
          </th>
        ))}
      </tr>
    </thead>
  )
}
