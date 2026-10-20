import { splitRepresentation } from '../lib/decisionViz'

const TOKEN = /([A-Za-z_][A-Za-z0-9_]*(?: [A-Za-z][A-Za-z0-9_]*)*)|(\d+(?:\.\d+)?)|([()+\-*=/])/g

// Math-style rendering of "Score = (Energy*0.3)+(Sleep*0.3)-(Exam_Preparation*0.3)":
// names, numbers and operators get their own style, * becomes x and - becomes a real minus.
export function FormulaView({ text }) {
  if (typeof text !== 'string' || !text.trim()) return null
  const tokens = [...text.matchAll(TOKEN)]
  const eq = tokens.findIndex((t) => t[3] === '=')
  return (
    <div className="font-mono text-[13px] leading-8 bg-inset rounded-lg px-3 py-1.5 mb-3 break-words">
      {tokens.map((t, i) => {
        if (t[1]) {
          const lead = eq === -1 || i < eq
          return (
            <span key={i} className={lead ? 'text-fg font-bold' : 'text-cyan'}>
              {t[1].replace(/_/g, ' ')}
            </span>
          )
        }
        if (t[2]) return <span key={i} className="text-warn">{t[2]}</span>
        const op = t[3] === '*' ? '×' : t[3] === '-' ? '−' : t[3]
        const spaced = op === '+' || op === '−' || op === '='
        return (
          <span key={i} className={`text-dim ${spaced ? 'px-1.5' : 'px-px'}`}>
            {op}
          </span>
        )
      })}
    </div>
  )
}

// "A + B = C" or "A -> B": operators get highlighted, the rest stays normal prose.
export function LogicText({ text }) {
  if (typeof text !== 'string') return null
  const parts = text.split(/(\s\+\s|\s=\s|\s->\s|\s→\s)/)
  return (
    <p className="text-sm text-fg2 leading-relaxed">
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span key={i} className="text-cyan font-bold">
            {p.replace('->', '→')}
          </span>
        ) : (
          p
        ),
      )}
    </p>
  )
}

// "Bar chart: A vs B" -> small chip with the chart/representation type + the description.
export function RepresentationText({ text }) {
  const { kind, rest } = splitRepresentation(text)
  return (
    <p className="text-sm text-fg2 leading-relaxed">
      {kind && (
        <span className="inline-block mr-2 px-2 py-0.5 rounded-md bg-violet/15 text-violet text-[11px] font-semibold uppercase tracking-wide align-middle">
          {kind}
        </span>
      )}
      {rest}
    </p>
  )
}

const fmt = (n) => (Math.round(n * 100) / 100).toString().replace('-', '−')

function Cell({ value, weight, contribution, sign }) {
  return (
    <td className="py-1.5 pl-2 text-right align-top">
      <span className="text-dim">
        {value}×{weight}
      </span>
      <span className={`ml-1 font-semibold ${sign < 0 || contribution < 0 ? 'text-danger' : 'text-fg'}`}>
        {fmt(contribution)}
      </span>
    </td>
  )
}

// Factor x option table with weighted contributions and totals.
export function FactorTable({ factors, higher }) {
  const { rows, goTotal, noGoTotal } = factors
  return (
    <div className="overflow-x-auto mb-3">
      <table className="w-full text-[11px] font-mono border-collapse">
        <thead>
          <tr className="text-dim border-b border-line">
            <th className="py-1 text-left font-medium uppercase tracking-wider">Factor</th>
            <th className="py-1 pl-2 text-right font-medium uppercase tracking-wider text-mint">Go</th>
            <th className="py-1 pl-2 text-right font-medium uppercase tracking-wider text-violet">No-Go</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line/60">
              <td className="py-1.5 pr-1 text-fg2 font-sans text-xs">
                <span className="text-dim mr-1">{r.sign < 0 ? '−' : '+'}</span>
                {r.name}
              </td>
              <Cell value={r.goValue} weight={r.goWeight} contribution={r.goContribution} sign={r.sign} />
              <Cell value={r.noGoValue} weight={r.noGoWeight} contribution={r.noGoContribution} sign={r.sign} />
            </tr>
          ))}
          <tr>
            <td className="py-2 text-fg font-sans text-xs font-bold">Total / 10</td>
            <td className={`py-2 pl-2 text-right text-sm font-bold ${higher === 'Go' ? 'text-mint' : 'text-muted'}`}>
              {fmt(goTotal)}
            </td>
            <td className={`py-2 pl-2 text-right text-sm font-bold ${higher === 'No-Go' ? 'text-violet' : 'text-muted'}`}>
              {fmt(noGoTotal)}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="text-[11px] text-dim mt-1">Each cell: value × weight, then the signed result. Red = reduces the score.</p>
    </div>
  )
}
