import Card from '@components/Card'
import { clsx } from 'clsx'

export default function ExcelTableCard({
  title,
  subtitle,
  icon: Icon,
  headers,
  rows,
  emptyMessage = 'No hay datos para mostrar',
  className = '',
}) {
  return (
    <Card className={clsx('border border-slate-200 shadow-sm', className)}>
      <div className="flex items-center gap-3 mb-5">
        {Icon && (
          <div className="w-11 h-11 rounded-lg bg-slate-800 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-300">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-100">
            <tr>
              {headers.map((header) => (
                <th
                  key={header.key}
                  className={clsx(
                    'border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700 whitespace-nowrap',
                    header.className
                  )}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="border border-slate-300 px-3 py-8 text-center text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.key ?? index}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}
                >
                  {headers.map((header) => (
                    <td
                      key={header.key}
                      className={clsx(
                        'border border-slate-300 px-3 py-2 align-middle text-slate-800',
                        header.cellClassName
                      )}
                    >
                      {row[header.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
