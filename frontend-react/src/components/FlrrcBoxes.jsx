import { BarChart3, Calculator, Lightbulb, ShieldAlert, Target } from 'lucide-react'
import { extractScore } from '../lib/parseDecision'

function Box({ icon, title, tone, children, delay = 0 }) {
  const Icon = icon
  return (
    <div
      className="rounded-2xl bg-panel-2 border border-line p-4 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wide ${tone}`}>
        <Icon size={15} />
        {title}
      </div>
      {children}
    </div>
  )
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="mb-2 last:mb-0">
      <p className="text-[11px] uppercase tracking-wider text-dim">{label}</p>
      <p className="text-sm text-fg2 leading-relaxed">{value}</p>
    </div>
  )
}

// Vertical bar chart of the two scores (0-10 scale), drawn from the recalculated totals.
function ScoreChart({ goScore, noGoScore, higher }) {
  const bars = [
    { key: 'Go', label: 'Go', value: goScore, color: 'bg-mint' },
    { key: 'No-Go', label: 'No-Go', value: noGoScore, color: 'bg-violet' },
  ]
  const CHART_H = 140
  return (
    <div className="flex items-end justify-center gap-10 px-2 pt-2">
      {bars.map((b) => {
        const h = Math.max(4, Math.min(CHART_H, (b.value / 10) * CHART_H))
        const winner = b.key === higher
        return (
          <div key={b.key} className="flex flex-col items-center w-20">
            <span className={`font-mono text-sm mb-1 ${winner ? 'text-fg font-bold' : 'text-muted'}`}>
              {b.value}
            </span>
            <div
              className="w-full flex items-end border-b border-line"
              style={{ height: CHART_H }}
              role="img"
              aria-label={`${b.label} score ${b.value} out of 10`}
            >
              <div
                className={`w-full rounded-t-lg ${b.color} ${winner ? '' : 'opacity-60'} transition-all duration-700`}
                style={{ height: h }}
              />
            </div>
            <span className="text-xs text-fg2 mt-2">{b.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// The model's graph text is "Bar chart: Go X vs NoGo Y. note". Its numbers can be wrong,
// so when we draw the chart ourselves we only keep the note after the first sentence.
function graphNote(text) {
  if (typeof text !== 'string') return ''
  if (!/^\s*bar chart/i.test(text)) return text
  const i = text.indexOf('. ')
  return i === -1 ? '' : text.slice(i + 2).trim()
}

export default function FlrrcBoxes({ data }) {
  const b1 = data.box_1_flrrc || {}
  const b2 = data.box_2_equation || {}
  const b4 = data.box_4_risk || {}
  const goScore = extractScore(b2.go_score)
  const noGoScore = extractScore(b2.nogo_score)
  const hasScores = goScore !== null && noGoScore !== null
  const higher = hasScores ? (goScore >= noGoScore ? 'Go' : 'No-Go') : null

  return (
    <div className="space-y-3">
      {hasScores && (
        <div className="flex items-center gap-3 animate-fade-up">
          <span className="text-xs uppercase tracking-wider text-dim">Higher score</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-bold ${
              higher === 'Go' ? 'bg-mint/15 text-mint' : 'bg-violet/20 text-violet'
            }`}
          >
            {higher}
          </span>
        </div>
      )}

      {data._recalc?.changed && (
        <p className="text-xs text-warn bg-warn/10 border border-warn/30 rounded-xl px-3 py-2 animate-fade-up">
          {data._recalc.winnerFlipped
            ? `The model's own total pointed the other way. Recalculated from its factors: Go ${data._recalc.computed.go} vs No-Go ${data._recalc.computed.nogo}. The conclusion text below was written by the model and may disagree. Decide with the numbers and your own judgement.`
            : `Totals were recalculated from the model's own factors (Go ${data._recalc.computed.go}, No-Go ${data._recalc.computed.nogo}) because its arithmetic was off. The conclusion text is the model's and may not fully match.`}
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <Box icon={Lightbulb} title="1. FLRRC Breakdown" tone="text-cyan">
          <Row label="Fact" value={b1.fact} />
          <Row label="Logic" value={b1.logic} />
          <Row label="Reasoning" value={b1.reasoning} />
          <Row label="Representation" value={b1.representation} />
          <Row label="Conclusion" value={b1.conclusion} />
        </Box>

        <Box icon={Calculator} title="2. Equation" tone="text-azure" delay={80}>
          {b2.formula && (
            <p className="font-mono text-xs text-azure bg-inset rounded-lg p-2 mb-3 break-words">
              {b2.formula}
            </p>
          )}
          <Row label="Go score" value={b2.go_score} />
          <Row label="No-Go score" value={b2.nogo_score} />
          <Row label="Regret probability" value={b2.regret_probability} />
        </Box>

        <Box icon={BarChart3} title="3. Graph" tone="text-violet" delay={160}>
          {hasScores ? (
            <>
              <ScoreChart goScore={goScore} noGoScore={noGoScore} higher={higher} />
              <p className="text-[11px] text-dim text-center mt-3">Score out of 10, higher is better</p>
              {graphNote(data.box_3_graph) && (
                <p className="text-sm text-fg2 leading-relaxed mt-2">{graphNote(data.box_3_graph)}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-fg2 leading-relaxed">
              {typeof data.box_3_graph === 'string' ? data.box_3_graph : JSON.stringify(data.box_3_graph)}
            </p>
          )}
        </Box>

        <Box icon={ShieldAlert} title="4. Risk & Alternatives" tone="text-warn" delay={240}>
          <Row label="Best case" value={b4.best} />
          <Row label="Worst case" value={b4.worst} />
          <Row label="Middle path" value={b4.middle} />
        </Box>
      </div>

      {data.box_5_next_action && (
        <Box icon={Target} title="5. Next Action" tone="text-mint" delay={320}>
          <p className="text-sm text-fg2 leading-relaxed">{data.box_5_next_action}</p>
        </Box>
      )}

      {data.note_point && <p className="text-xs text-dim">{data.note_point}</p>}
    </div>
  )
}
