import { useState } from 'react'
import {
  VIEW_LABELS,
  availableViews,
  buildFactors,
  parseRegret,
  preferredView,
} from '../lib/decisionViz'

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))
const fmt = (n) => (Math.round(n * 100) / 100).toString()

function Legend() {
  return (
    <div className="flex justify-center gap-4 text-[11px] text-muted mt-2">
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-sm bg-mint" /> Go
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-sm bg-violet" /> No-Go
      </span>
    </div>
  )
}

// Two vertical bars: final totals (0-10).
function ScoresView({ goScore, noGoScore, higher }) {
  const bars = [
    { key: 'Go', value: goScore, color: 'bg-mint' },
    { key: 'No-Go', value: noGoScore, color: 'bg-violet' },
  ]
  const H = 140
  return (
    <div>
      <div className="flex items-end justify-center gap-10 px-2 pt-2">
        {bars.map((b) => {
          const winner = b.key === higher
          return (
            <div key={b.key} className="flex flex-col items-center w-20">
              <span className={`font-mono text-sm mb-1 ${winner ? 'text-fg font-bold' : 'text-muted'}`}>
                {b.value}
              </span>
              <div
                className="w-full flex items-end border-b border-line"
                style={{ height: H }}
                role="img"
                aria-label={`${b.key} score ${b.value} out of 10`}
              >
                <div
                  className={`w-full rounded-t-lg ${b.color} ${winner ? '' : 'opacity-60'} transition-all duration-700`}
                  style={{ height: clamp((b.value / 10) * H, 4, H) }}
                />
              </div>
              <span className="text-xs text-fg2 mt-2">{b.key}</span>
            </div>
          )
        })}
      </div>
      <p className="text-[11px] text-dim text-center mt-3">Total score out of 10, higher is better</p>
    </div>
  )
}

// One pair of horizontal bars per factor (value 0-10).
function FactorsView({ factors }) {
  return (
    <div className="space-y-3">
      {factors.rows.map((r, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-fg2">
              {r.sign < 0 ? '− ' : ''}
              {r.name}
              {r.sign < 0 && <span className="text-dim"> (cost)</span>}
            </span>
            <span className="text-dim font-mono">weight {r.goWeight}</span>
          </div>
          {[
            ['Go', r.goValue, 'bg-mint'],
            ['No-Go', r.noGoValue, 'bg-violet'],
          ].map(([label, value, color]) => (
            <div key={label} className="flex items-center gap-2 mb-1">
              <span className="w-11 text-[10px] text-dim">{label}</span>
              <div className="flex-1 h-2 rounded-full bg-hover overflow-hidden">
                <div
                  className={`h-full rounded-full ${color} transition-all duration-700`}
                  style={{ width: `${clamp(value * 10, 2, 100)}%` }}
                />
              </div>
              <span className="w-6 text-right font-mono text-[11px] text-muted">{value}</span>
            </div>
          ))}
        </div>
      ))}
      <Legend />
    </div>
  )
}

// Spider chart over the factors (needs 3 or more).
function RadarView({ factors }) {
  const rows = factors.rows
  const n = rows.length
  const W = 300
  const H = 250
  const cx = W / 2
  const cy = 125
  const R = 78
  const pt = (i, v) => {
    const a = (2 * Math.PI * i) / n
    const r = (clamp(v, 0, 10) / 10) * R
    return [cx + r * Math.sin(a), cy - r * Math.cos(a)]
  }
  const poly = (key) => rows.map((r, i) => pt(i, r[key]).join(',')).join(' ')
  const short = (s) => (s.length > 16 ? `${s.slice(0, 15)}…` : s)

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-sm mx-auto" role="img" aria-label="Radar chart of factors">
        {[0.25, 0.5, 0.75, 1].map((k) => (
          <polygon
            key={k}
            points={rows.map((_, i) => pt(i, 10 * k).join(',')).join(' ')}
            className="fill-none stroke-line"
            strokeWidth="1"
          />
        ))}
        {rows.map((_, i) => {
          const [x, y] = pt(i, 10)
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} className="stroke-line" strokeWidth="1" />
        })}
        <polygon points={poly('noGoValue')} className="fill-violet/25 stroke-violet" strokeWidth="2" />
        <polygon points={poly('goValue')} className="fill-mint/25 stroke-mint" strokeWidth="2" />
        {rows.map((r, i) => {
          const [x, y] = pt(i, 11.8)
          const anchor = x < cx - 6 ? 'end' : x > cx + 6 ? 'start' : 'middle'
          return (
            <text key={i} x={x} y={y + 4} textAnchor={anchor} className="fill-fg2" fontSize="11">
              {short(r.name)}
            </text>
          )
        })}
      </svg>
      <Legend />
    </div>
  )
}

// One block (per option) of the impact chart.
function ImpactBlock({ rows, title, titleClass, keyName, max }) {
  return (
    <div>
      <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${titleClass}`}>{title}</p>
      {rows.map((r, i) => {
        const c = r[keyName]
        const w = (Math.abs(c) / max) * 50
        return (
          <div key={i} className="flex items-center gap-2 mb-1.5">
            <span className="w-24 shrink-0 text-[11px] text-fg2 truncate" title={r.name}>
              {r.name}
            </span>
            <div className="relative flex-1 h-3">
              <div className="absolute inset-y-0 left-1/2 w-px bg-line" />
              <div
                className={`absolute top-0.5 bottom-0.5 rounded-sm transition-all duration-700 ${c >= 0 ? 'bg-mint' : 'bg-danger'}`}
                style={c >= 0 ? { left: '50%', width: `${w}%` } : { right: '50%', width: `${w}%` }}
              />
            </div>
            <span className={`w-9 text-right font-mono text-[11px] ${c >= 0 ? 'text-muted' : 'text-danger'}`}>
              {c < 0 ? '−' : '+'}
              {fmt(Math.abs(c))}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// Weighted contribution of each factor: right of the axis raises the score, left lowers it.
function ImpactView({ factors }) {
  const max = Math.max(0.1, ...factors.rows.flatMap((r) => [Math.abs(r.goContribution), Math.abs(r.noGoContribution)]))
  return (
    <div className="space-y-4">
      <ImpactBlock
        rows={factors.rows}
        max={max}
        title={`Go, total ${fmt(factors.goTotal)}`}
        titleClass="text-mint"
        keyName="goContribution"
      />
      <ImpactBlock
        rows={factors.rows}
        max={max}
        title={`No-Go, total ${fmt(factors.noGoTotal)}`}
        titleClass="text-violet"
        keyName="noGoContribution"
      />
      <p className="text-[11px] text-dim">Weighted points per factor. Green raises the score, red lowers it.</p>
    </div>
  )
}

// Donut gauges for the regret percentages the model wrote.
function RegretView({ regret }) {
  const r = 26
  const C = 2 * Math.PI * r
  return (
    <div>
      <div className={`grid gap-3 ${regret.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {regret.map((g, i) => {
          const tone = g.pct >= 50 ? 'stroke-danger' : g.pct >= 30 ? 'stroke-warn' : 'stroke-mint'
          return (
            <div key={i} className="flex flex-col items-center">
              <svg viewBox="0 0 70 70" className="w-20 h-20" role="img" aria-label={`${g.label} regret ${g.pct}%`}>
                <circle cx="35" cy="35" r={r} className="fill-none stroke-hover" strokeWidth="8" />
                <circle
                  cx="35"
                  cy="35"
                  r={r}
                  className={`fill-none ${tone}`}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(g.pct / 100) * C} ${C}`}
                  transform="rotate(-90 35 35)"
                />
                <text x="35" y="39" textAnchor="middle" className="fill-fg" fontSize="13" fontWeight="700">
                  {g.pct}%
                </text>
              </svg>
              <span className="mt-1 text-[11px] text-fg2 text-center leading-tight">{g.label}</span>
            </div>
          )
        })}
      </div>
      <p className="text-[11px] text-dim text-center mt-3">Chance of regretting each choice. Lower is better.</p>
    </div>
  )
}

// The model only says what it wants to draw in words. We pick the chart type from that hint
// and from the data that can really be parsed, and let the user switch.
export default function DecisionChart({ data, goScore, noGoScore, higher }) {
  const factors = buildFactors(data.box_2_equation)
  const regret = parseRegret(data.box_2_equation?.regret_probability)
  const views = availableViews(factors, regret)
  const hint = `${data.box_3_graph ?? ''} ${data.box_1_flrrc?.representation ?? ''}`
  const [picked, setPicked] = useState(null)
  const view = picked && views.includes(picked) ? picked : preferredView(hint, views)

  return (
    <div>
      {views.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {views.map((v) => (
            <button
              key={v}
              onClick={() => setPicked(v)}
              className={`px-2.5 py-1 rounded-full text-[11px] border transition ${
                v === view
                  ? 'border-violet/60 bg-violet/15 text-violet'
                  : 'border-line text-dim hover:text-fg hover:border-violet/40'
              }`}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
      )}
      {view === 'factors' && factors && <FactorsView factors={factors} />}
      {view === 'radar' && factors && <RadarView factors={factors} />}
      {view === 'impact' && factors && <ImpactView factors={factors} />}
      {view === 'regret' && <RegretView regret={regret} />}
      {view === 'scores' && <ScoresView goScore={goScore} noGoScore={noGoScore} higher={higher} />}
    </div>
  )
}
