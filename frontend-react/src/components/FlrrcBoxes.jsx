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

function ScoreBar({ label, value, color }) {
  const pct = Math.max(0, Math.min(100, (value / 10) * 100))
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-fg2">{label}</span>
        <span className="font-mono text-muted">{value}/10</span>
      </div>
      <div className="h-2 rounded-full bg-hover overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
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
          {hasScores && (
            <>
              <ScoreBar label="Go" value={goScore} color="bg-mint" />
              <ScoreBar label="No-Go" value={noGoScore} color="bg-violet" />
            </>
          )}
          <Row label="Go score" value={b2.go_score} />
          <Row label="No-Go score" value={b2.nogo_score} />
          <Row label="Regret probability" value={b2.regret_probability} />
        </Box>

        <Box icon={BarChart3} title="3. Graph" tone="text-violet" delay={160}>
          <p className="text-sm text-fg2 leading-relaxed">
            {typeof data.box_3_graph === 'string' ? data.box_3_graph : JSON.stringify(data.box_3_graph)}
          </p>
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
