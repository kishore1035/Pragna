import { Database, Key, Link2 } from 'lucide-react'

export default function ERDiagramRenderer({ data }) {
  const entities = Array.isArray(data?.entities)
    ? data.entities
    : Array.isArray(data?.tables)
    ? data.tables
    : []

  const relations = Array.isArray(data?.relations)
    ? data.relations
    : Array.isArray(data?.relationships)
    ? data.relationships
    : []

  return (
    <div className="w-full flex flex-col gap-3 p-3 bg-[#0a0a0c]/40 rounded-xl">
      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {entities.map((ent, idx) => {
          const fields = Array.isArray(ent.fields)
            ? ent.fields
            : Array.isArray(ent.columns)
            ? ent.columns
            : []

          return (
            <div
              key={ent.name || idx}
              className="flex flex-col rounded-xl border border-[#2d2a24] bg-[#0e0e11] overflow-hidden shadow-sm hover:border-[#d4af37]/35 transition-colors"
            >
              {/* Table Header */}
              <div className="flex items-center gap-2 p-2.5 bg-[#121216] border-b border-[#2d2a24]">
                <Database className="w-3.5 h-3.5 text-[#e5c76b]" />
                <span className="text-xs font-semibold text-[#f0e6d3] tracking-wide font-mono">
                  {ent.name || ent.tableName || `Table ${idx + 1}`}
                </span>
              </div>

              {/* Table Fields */}
              <div className="p-1.5 divide-y divide-[#2d2a24]/60 font-mono text-[11px]">
                {fields.map((field, fIdx) => {
                  const name = typeof field === 'string' ? field : (field.name || field.column)
                  const type = typeof field === 'object' ? field.type : 'VARCHAR'
                  const key = typeof field === 'object' ? field.key : null

                  return (
                    <div
                      key={fIdx}
                      className="flex items-center justify-between py-1 px-1.5 hover:bg-[#141417] rounded transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        {key === 'PK' ? (
                          <span className="px-1 py-0.2 text-[8.5px] font-medium rounded bg-[#d4af37]/15 text-[#e5c76b] border border-[#d4af37]/30">
                            PK
                          </span>
                        ) : key === 'FK' ? (
                          <span className="px-1 py-0.2 text-[8.5px] font-medium rounded bg-[#141417] text-[#a89878] border border-[#2d2a24]">
                            FK
                          </span>
                        ) : (
                          <span className="w-2.5" />
                        )}
                        <span className="text-[#f0e6d3] font-normal">{name}</span>
                      </div>
                      <span className="text-[#a89878]/60 text-[9.5px] uppercase">{type}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Relationships Summary */}
      {relations.length > 0 && (
        <div className="p-2.5 rounded-xl bg-[#0e0e11] border border-[#2d2a24] flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#e5c76b]">
            <Link2 className="w-3 h-3" />
            <span>Relationships</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {relations.map((rel, rIdx) => (
              <div
                key={rIdx}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#141417] border border-[#2d2a24] text-xs font-mono text-[#f0e6d3]"
              >
                <span className="text-[#e5c76b]">{rel.from}</span>
                <span className="px-1 py-0.2 rounded bg-[#0a0a0c] text-[9.5px] text-[#a89878] font-sans border border-[#2d2a24]">
                  {rel.type || '1:N'}
                </span>
                <span className="text-[#e5c76b]">{rel.to}</span>
                {rel.label && <span className="text-[#a89878] text-[10.5px] font-sans">({rel.label})</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
