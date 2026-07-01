interface TableHeaderRowProps {
  columns: string[]
}

export default function TableHeaderRow({ columns }: TableHeaderRowProps) {
  return (
    <thead>
      <tr style={{ borderBottom: '1px solid #21262d' }}>
        {columns.map((column) => (
          <th
            key={column}
            style={{
              padding: '11px 20px',
              textAlign: 'left',
              fontSize: 11,
              fontWeight: 600,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
            }}
          >
            {column}
          </th>
        ))}
      </tr>
    </thead>
  )
}
