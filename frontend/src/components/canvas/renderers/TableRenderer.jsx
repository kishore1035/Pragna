import { useState, useMemo } from 'react'
import { ArrowUpDown, Search, Download, Copy, Check } from 'lucide-react'

export default function TableRenderer({ data, title }) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [copied, setCopied] = useState(false)

  const columns = useMemo(() => {
    if (data?.columns && Array.isArray(data.columns)) return data.columns
    if (Array.isArray(data?.rows) && data.rows.length > 0) {
      return Object.keys(data.rows[0])
    }
    return []
  }, [data])

  const rows = useMemo(() => {
    if (!Array.isArray(data?.rows)) return []
    let list = [...data.rows]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((r) =>
        Object.values(r).some((val) => String(val ?? '').toLowerCase().includes(q))
      )
    }

    if (sortKey) {
      list.sort((a, b) => {
        const valA = a[sortKey] ?? ''
        const valB = b[sortKey] ?? ''
        const numA = Number(valA)
        const numB = Number(valB)
        if (!isNaN(numA) && !isNaN(numB) && typeof valA !== 'boolean') {
          return sortDir === 'asc' ? numA - numB : numB - numA
        }
        return sortDir === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA))
      })
    }

    return list
  }, [data, search, sortKey, sortDir])

  const handleSort = (col) => {
    if (sortKey === col) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(col)
      setSortDir('asc')
    }
  }

  const exportCSV = () => {
    if (!columns.length || !rows.length) return
    const headerLine = columns.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')
    const rowLines = rows.map((r) =>
      columns.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')
    )
    const csvContent = 'data:text/csv;charset=utf-8,' + [headerLine, ...rowLines].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${(title || 'pragna_table').toLowerCase().replace(/\s+/g, '_')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyTSV = () => {
    if (!columns.length || !rows.length) return
    const headerLine = columns.join('\t')
    const rowLines = rows.map((r) => columns.map((c) => r[c] ?? '').join('\t'))
    const tsv = [headerLine, ...rowLines].join('\n')
    navigator.clipboard?.writeText(tsv)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a89878]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter rows..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0e0e11] border border-[#2d2a24] rounded-lg text-[#f0e6d3] placeholder-[#a89878]/40 focus:outline-none focus:border-[#d4af37]/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={copyTSV}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-[#141417] hover:bg-[#1c1c20] border border-[#2d2a24] hover:border-[#d4af37]/30 rounded-lg text-[#c9bda2] hover:text-[#f0e6d3] transition-colors"
            title="Copy as TSV"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-[#141417] hover:bg-[#1c1c20] border border-[#2d2a24] hover:border-[#d4af37]/30 rounded-lg text-[#c9bda2] hover:text-[#f0e6d3] transition-colors"
            title="Export as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-[#2d2a24] bg-[#0e0e11]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#121216] border-b border-[#2d2a24]">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(col)}
                  className="px-3.5 py-2.5 font-medium text-[#e5c76b] tracking-wider uppercase cursor-pointer select-none hover:text-[#f0e6d3] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col}</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortKey === col ? 'text-[#e5c76b]' : 'opacity-30'}`} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2d2a24]/60">
            {rows.length > 0 ? (
              rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="hover:bg-[#141417] transition-colors group"
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={cIdx}
                      className="px-3.5 py-2 text-[#c9bda2] group-hover:text-[#f0e6d3] transition-colors"
                    >
                      {typeof row[col] === 'boolean' ? (
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] ${row[col] ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'}`}>
                          {row[col] ? 'Yes' : 'No'}
                        </span>
                      ) : (
                        String(row[col] ?? '—')
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length || 1} className="px-3.5 py-6 text-center text-[#a89878]/50">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="text-[10.5px] text-[#a89878]/50 px-1 flex justify-between items-center">
        <span>Showing {rows.length} row{rows.length !== 1 ? 's' : ''}</span>
        <span>Click column header to sort</span>
      </div>
    </div>
  )
}
